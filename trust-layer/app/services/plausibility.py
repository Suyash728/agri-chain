"""
app/services/plausibility.py
-----------------------------
Phase 3 — Physical & Temporal Plausibility checking service.

WHAT THIS MODULE DOES
----------------------
Receives the current TelemetryPayload and an optional previous TelemetryPayload
(retrieved from history) for the same device/batch.

It performs 4 core physical and temporal checks:
  1. GPS Physical Plausibility: Haversine distance and implied vehicle speed (km/h).
     Reason code on failure: GPS_SPEED_EXCEEDED
  2. Temperature Temporal Plausibility: Rate of temperature change (°C/min).
     Reason code on failure: TEMPERATURE_RATE_EXCEEDED
  3. Humidity Temporal Plausibility: Rate of humidity change (%/min).
     Reason code on failure: HUMIDITY_RATE_EXCEEDED
  4. Timestamp Consistency: Sequence chronology, duplicates, and max transmission gap.
     Reason codes on failure:
       - TIMESTAMP_OUT_OF_ORDER
       - DUPLICATE_TIMESTAMP
       - TELEMETRY_GAP_EXCEEDED

DESIGN PRINCIPLES
-----------------
- Pure function evaluation: Takes current reading, previous reading, and optional policy.
- Modular & testable: Does not directly touch database or HTTP request objects.
- Non-blocking: Generates structured flags/evidence, NOT final VALID/ANOMALOUS verdicts.
"""

import math
from typing import Optional
from app.schemas.plausibility import PlausibilityCheckResult, PlausibilityResult
from app.schemas.policy import CropPolicy
from app.schemas.telemetry import TelemetryPayload

STAGE_NAME = "physical_temporal_plausibility"


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two GPS coordinates in kilometers.

    Uses the Haversine formula:
        a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
        c = 2 * atan2(√a, √(1-a))
        d = R * c
    """
    r = 6371.0  # Radius of Earth in kilometers

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def run_plausibility_checks(
    current: TelemetryPayload,
    previous: Optional[TelemetryPayload] = None,
    policy: Optional[CropPolicy] = None,
) -> PlausibilityResult:
    """
    Run physical and temporal plausibility checks on incoming telemetry.

    Parameters
    ----------
    current : TelemetryPayload
        The current sensor reading.
    previous : Optional[TelemetryPayload]
        The previous sensor reading for the same device/batch (if available).
    policy : Optional[CropPolicy]
        Policy thresholds to apply. Uses standard default CropPolicy if None.

    Returns
    -------
    PlausibilityResult
        Structured result containing overall plausibility status and check details.
    """
    if policy is None:
        policy = CropPolicy()

    checks: list[PlausibilityCheckResult] = []

    # ------------------------------------------------------------------
    # 0. Crop Policy Environmental Limits (Temperature & Humidity)
    # ------------------------------------------------------------------
    if policy.min_temp_c is not None and current.temperature < policy.min_temp_c:
        checks.append(
            PlausibilityCheckResult(
                name="crop_temperature_bounds_check",
                passed=False,
                reason_code="TEMPERATURE_OUT_OF_POLICY",
                calculated_value=f"{current.temperature:.2f} °C",
                threshold=f">= {policy.min_temp_c:.2f} °C",
                details=(
                    f"Temperature {current.temperature:.2f} °C is below policy minimum "
                    f"of {policy.min_temp_c:.2f} °C for crop '{policy.crop_type}'."
                ),
            )
        )
    elif policy.max_temp_c is not None and current.temperature > policy.max_temp_c:
        checks.append(
            PlausibilityCheckResult(
                name="crop_temperature_bounds_check",
                passed=False,
                reason_code="TEMPERATURE_OUT_OF_POLICY",
                calculated_value=f"{current.temperature:.2f} °C",
                threshold=f"<= {policy.max_temp_c:.2f} °C",
                details=(
                    f"Temperature {current.temperature:.2f} °C exceeds policy maximum "
                    f"of {policy.max_temp_c:.2f} °C for crop '{policy.crop_type}'."
                ),
            )
        )
    elif policy.min_temp_c is not None or policy.max_temp_c is not None:
        checks.append(
            PlausibilityCheckResult(
                name="crop_temperature_bounds_check",
                passed=True,
                calculated_value=f"{current.temperature:.2f} °C",
                threshold=f"[{policy.min_temp_c}, {policy.max_temp_c}] °C",
                details=f"Temperature {current.temperature:.2f} °C is within policy limits for crop '{policy.crop_type}'.",
            )
        )

    if policy.min_humidity is not None and current.humidity < policy.min_humidity:
        checks.append(
            PlausibilityCheckResult(
                name="crop_humidity_bounds_check",
                passed=False,
                reason_code="HUMIDITY_OUT_OF_POLICY",
                calculated_value=f"{current.humidity:.2f} %",
                threshold=f">= {policy.min_humidity:.2f} %",
                details=(
                    f"Humidity {current.humidity:.2f} % is below policy minimum "
                    f"of {policy.min_humidity:.2f} % for crop '{policy.crop_type}'."
                ),
            )
        )
    elif policy.max_humidity is not None and current.humidity > policy.max_humidity:
        checks.append(
            PlausibilityCheckResult(
                name="crop_humidity_bounds_check",
                passed=False,
                reason_code="HUMIDITY_OUT_OF_POLICY",
                calculated_value=f"{current.humidity:.2f} %",
                threshold=f"<= {policy.max_humidity:.2f} %",
                details=(
                    f"Humidity {current.humidity:.2f} % exceeds policy maximum "
                    f"of {policy.max_humidity:.2f} % for crop '{policy.crop_type}'."
                ),
            )
        )
    elif policy.min_humidity is not None or policy.max_humidity is not None:
        checks.append(
            PlausibilityCheckResult(
                name="crop_humidity_bounds_check",
                passed=True,
                calculated_value=f"{current.humidity:.2f} %",
                threshold=f"[{policy.min_humidity}, {policy.max_humidity}] %",
                details=f"Humidity {current.humidity:.2f} % is within policy limits for crop '{policy.crop_type}'.",
            )
        )

    # ------------------------------------------------------------------
    # First-ever reading for a device
    # If no previous reading exists, all checks pass with an informative note.
    # ------------------------------------------------------------------
    if previous is None:
        checks.append(
            PlausibilityCheckResult(
                name="initial_reading_check",
                passed=True,
                details="First reading for device/batch. No prior historical reading available for comparison.",
            )
        )
        return PlausibilityResult(
            plausible=all(c.passed for c in checks),
            stage=STAGE_NAME,
            checks=checks,
        )

    # Calculate elapsed time in seconds between readings
    elapsed_seconds = (current.timestamp - previous.timestamp).total_seconds()

    # ------------------------------------------------------------------
    # 1. Timestamp Consistency Checks
    # ------------------------------------------------------------------
    if elapsed_seconds < 0:
        checks.append(
            PlausibilityCheckResult(
                name="timestamp_chronology_check",
                passed=False,
                reason_code="TIMESTAMP_OUT_OF_ORDER",
                calculated_value=f"{elapsed_seconds:.1f} s",
                threshold=">= 0.0 s",
                details=(
                    f"Current timestamp ({current.timestamp.isoformat()}) is earlier than "
                    f"previous timestamp ({previous.timestamp.isoformat()})."
                ),
            )
        )
    elif elapsed_seconds == 0:
        checks.append(
            PlausibilityCheckResult(
                name="timestamp_duplicate_check",
                passed=False,
                reason_code="DUPLICATE_TIMESTAMP",
                calculated_value=f"0.0 s",
                threshold="> 0.0 s",
                details=(
                    f"Duplicate timestamp detected for device {current.device_id}: "
                    f"{current.timestamp.isoformat()}."
                ),
            )
        )
    else:
        # Chronology is valid. Now check maximum telemetry gap.
        if elapsed_seconds > policy.max_telemetry_gap_seconds:
            checks.append(
                PlausibilityCheckResult(
                    name="telemetry_gap_check",
                    passed=False,
                    reason_code="TELEMETRY_GAP_EXCEEDED",
                    calculated_value=f"{elapsed_seconds:.1f} s",
                    threshold=f"{policy.max_telemetry_gap_seconds:.1f} s",
                    details=(
                        f"Elapsed time between readings ({elapsed_seconds:.1f} s) exceeds "
                        f"maximum allowed telemetry gap ({policy.max_telemetry_gap_seconds:.1f} s)."
                    ),
                )
            )
        else:
            checks.append(
                PlausibilityCheckResult(
                    name="timestamp_consistency_check",
                    passed=True,
                    calculated_value=f"{elapsed_seconds:.1f} s",
                    threshold=f"<= {policy.max_telemetry_gap_seconds:.1f} s",
                    details="Timestamp sequence is chronological and within expected gap limits.",
                )
            )

    # If elapsed_seconds <= 0, we cannot reliably compute speed or rate of change.
    if elapsed_seconds <= 0:
        return PlausibilityResult(
            plausible=False,
            stage=STAGE_NAME,
            checks=checks,
        )

    # ------------------------------------------------------------------
    # 2. GPS Physical Plausibility (Haversine distance & implied speed)
    # ------------------------------------------------------------------
    dist_km = haversine_distance_km(
        previous.latitude, previous.longitude, current.latitude, current.longitude
    )
    speed_kmh = (dist_km / elapsed_seconds) * 3600.0

    if speed_kmh > policy.max_plausible_speed_kmh:
        checks.append(
            PlausibilityCheckResult(
                name="gps_speed_check",
                passed=False,
                reason_code="GPS_SPEED_EXCEEDED",
                calculated_value=f"{speed_kmh:.2f} km/h",
                threshold=f"{policy.max_plausible_speed_kmh:.2f} km/h",
                details=(
                    f"Implied movement speed of {speed_kmh:.2f} km/h (distance: {dist_km:.3f} km "
                    f"over {elapsed_seconds:.1f} s) exceeds maximum plausible speed limit of "
                    f"{policy.max_plausible_speed_kmh:.2f} km/h. Coordinates: previous "
                    f"({previous.latitude}, {previous.longitude}) -> current ({current.latitude}, {current.longitude})."
                ),
            )
        )
    else:
        checks.append(
            PlausibilityCheckResult(
                name="gps_speed_check",
                passed=True,
                calculated_value=f"{speed_kmh:.2f} km/h",
                threshold=f"{policy.max_plausible_speed_kmh:.2f} km/h",
                details=(
                    f"Movement speed {speed_kmh:.2f} km/h is physically plausible "
                    f"(distance: {dist_km:.3f} km over {elapsed_seconds:.1f} s)."
                ),
            )
        )

    # ------------------------------------------------------------------
    # 3. Temperature Temporal Plausibility (Rate of change in °C/min)
    # ------------------------------------------------------------------
    temp_change = abs(current.temperature - previous.temperature)
    temp_rate_per_min = (temp_change / elapsed_seconds) * 60.0

    if temp_rate_per_min > policy.max_temperature_change_rate_per_min:
        checks.append(
            PlausibilityCheckResult(
                name="temperature_rate_check",
                passed=False,
                reason_code="TEMPERATURE_RATE_EXCEEDED",
                calculated_value=f"{temp_rate_per_min:.2f} °C/min",
                threshold=f"{policy.max_temperature_change_rate_per_min:.2f} °C/min",
                details=(
                    f"Temperature change rate of {temp_rate_per_min:.2f} °C/min (ΔT: {temp_change:.2f} °C "
                    f"from {previous.temperature} °C to {current.temperature} °C over {elapsed_seconds:.1f} s) "
                    f"exceeds maximum allowed rate of {policy.max_temperature_change_rate_per_min:.2f} °C/min."
                ),
            )
        )
    else:
        checks.append(
            PlausibilityCheckResult(
                name="temperature_rate_check",
                passed=True,
                calculated_value=f"{temp_rate_per_min:.2f} °C/min",
                threshold=f"{policy.max_temperature_change_rate_per_min:.2f} °C/min",
                details=(
                    f"Temperature change rate {temp_rate_per_min:.2f} °C/min is plausible "
                    f"(ΔT: {temp_change:.2f} °C over {elapsed_seconds:.1f} s)."
                ),
            )
        )

    # ------------------------------------------------------------------
    # 4. Humidity Temporal Plausibility (Rate of change in %/min)
    # ------------------------------------------------------------------
    humidity_change = abs(current.humidity - previous.humidity)
    humidity_rate_per_min = (humidity_change / elapsed_seconds) * 60.0

    if humidity_rate_per_min > policy.max_humidity_change_rate_per_min:
        checks.append(
            PlausibilityCheckResult(
                name="humidity_rate_check",
                passed=False,
                reason_code="HUMIDITY_RATE_EXCEEDED",
                calculated_value=f"{humidity_rate_per_min:.2f} %/min",
                threshold=f"{policy.max_humidity_change_rate_per_min:.2f} %/min",
                details=(
                    f"Humidity change rate of {humidity_rate_per_min:.2f} %/min (ΔH: {humidity_change:.2f}% "
                    f"from {previous.humidity}% to {current.humidity}% over {elapsed_seconds:.1f} s) "
                    f"exceeds maximum allowed rate of {policy.max_humidity_change_rate_per_min:.2f} %/min."
                ),
            )
        )
    else:
        checks.append(
            PlausibilityCheckResult(
                name="humidity_rate_check",
                passed=True,
                calculated_value=f"{humidity_rate_per_min:.2f} %/min",
                threshold=f"{policy.max_humidity_change_rate_per_min:.2f} %/min",
                details=(
                    f"Humidity change rate {humidity_rate_per_min:.2f} %/min is plausible "
                    f"(ΔH: {humidity_change:.2f}% over {elapsed_seconds:.1f} s)."
                ),
            )
        )

    # Overall plausible flag is True only if ALL checks passed
    all_passed = all(c.passed for c in checks)

    return PlausibilityResult(
        plausible=all_passed,
        stage=STAGE_NAME,
        checks=checks,
    )
