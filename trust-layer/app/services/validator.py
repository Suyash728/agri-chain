"""
app/services/validator.py
--------------------------
Phase 2 — Basic Range Validation service.

WHAT THIS MODULE DOES
----------------------
It receives a TelemetryPayload (already schema-validated by Pydantic) and
performs a second layer of checks: are the sensor values within physically
plausible ranges for agricultural cold-chain telemetry?

PIPELINE POSITION
-----------------
  Pydantic schema check  ← Phase 1 (done by FastAPI automatically)
         ↓
  Basic range validation ← Phase 2 (THIS FILE)
         ↓
  Physical plausibility  ← Phase 3 (future)
         ↓
  ML anomaly detection   ← Phase 4 (future)
         ↓
  Integrity checks       ← Phase 5 (future)
         ↓
  Verdict engine         ← Phase 6 (future)

DESIGN DECISIONS
----------------
1. Pure function — run_basic_validation() takes a payload and returns a
   ValidationResult. No side effects, no DB calls, no HTTP calls.
   This makes it trivial to unit-test and easy to swap out later.

2. Collects ALL failures in one pass — we don't stop at the first bad
   field. The caller (and the API consumer) gets a complete picture of
   every problem in one response, which is more useful than finding
   issues one by one.

3. Imports thresholds from config.py — changing a range limit never
   requires editing this file.

4. Returns ValidationResult (from schemas/validation.py) — a structured
   object rather than a bare dict or boolean. Future stages can inspect
   the 'failures' list to decide what to do.
"""

from app.config import (
    HUMIDITY_MAX,
    HUMIDITY_MIN,
    LATITUDE_MAX,
    LATITUDE_MIN,
    LONGITUDE_MAX,
    LONGITUDE_MIN,
    TEMPERATURE_MAX,
    TEMPERATURE_MIN,
)
from app.schemas.telemetry import TelemetryPayload
from app.schemas.validation import FieldFailure, ValidationResult

# Name of this pipeline stage — appears in every ValidationResult this
# module produces, so the caller can always trace where a failure came from.
STAGE_NAME = "basic_range_validation"


def run_basic_validation(payload: TelemetryPayload) -> ValidationResult:
    """
    Run all basic range checks on a telemetry payload.

    Checks performed (in order):
      1. batch_id  — must be a non-empty string
      2. device_id — must be a non-empty string
      3. latitude  — must be in [-90, 90]
      4. longitude — must be in [-180, 180]
      5. temperature — must be in [TEMPERATURE_MIN, TEMPERATURE_MAX]
      6. humidity    — must be in [0, 100]
      7. timestamp   — already a Python datetime (Pydantic guarantees this),
                       but we confirm it is not None as a safety net

    All failures are collected before returning so the caller sees
    every problem at once, not just the first one encountered.

    Parameters
    ----------
    payload : TelemetryPayload
        The incoming telemetry reading, already schema-validated by Pydantic.

    Returns
    -------
    ValidationResult
        passed=True  and failures=[] if everything is within range.
        passed=False and failures=[...] listing every out-of-range field.
    """
    failures: list[FieldFailure] = []

    # ------------------------------------------------------------------
    # Check 1: batch_id must be present and non-empty
    # Pydantic already ensures it is a string, but an empty string ("") or
    # a whitespace-only string is still semantically meaningless.
    # ------------------------------------------------------------------
    if not payload.batch_id or not payload.batch_id.strip():
        failures.append(
            FieldFailure(
                field="batch_id",
                received_value=repr(payload.batch_id),
                reason="batch_id must be a non-empty string.",
            )
        )

    # ------------------------------------------------------------------
    # Check 2: device_id must be present and non-empty
    # Same reasoning as batch_id.
    # ------------------------------------------------------------------
    if not payload.device_id or not payload.device_id.strip():
        failures.append(
            FieldFailure(
                field="device_id",
                received_value=repr(payload.device_id),
                reason="device_id must be a non-empty string.",
            )
        )

    # ------------------------------------------------------------------
    # Check 3: latitude must be in [-90, 90]
    # Pydantic already enforces this via ge/le in the schema, but we
    # re-check here so that this service is self-contained and works
    # correctly even if the schema constraints are ever relaxed.
    # ------------------------------------------------------------------
    if not (LATITUDE_MIN <= payload.latitude <= LATITUDE_MAX):
        failures.append(
            FieldFailure(
                field="latitude",
                received_value=payload.latitude,
                reason=(
                    f"Latitude {payload.latitude}° is outside the valid range "
                    f"[{LATITUDE_MIN}, {LATITUDE_MAX}]."
                ),
            )
        )

    # ------------------------------------------------------------------
    # Check 4: longitude must be in [-180, 180]
    # ------------------------------------------------------------------
    if not (LONGITUDE_MIN <= payload.longitude <= LONGITUDE_MAX):
        failures.append(
            FieldFailure(
                field="longitude",
                received_value=payload.longitude,
                reason=(
                    f"Longitude {payload.longitude}° is outside the valid range "
                    f"[{LONGITUDE_MIN}, {LONGITUDE_MAX}]."
                ),
            )
        )

    # ------------------------------------------------------------------
    # Check 5: temperature must be in [TEMPERATURE_MIN, TEMPERATURE_MAX]
    # See app/config.py for the rationale behind these limits.
    # ------------------------------------------------------------------
    if not (TEMPERATURE_MIN <= payload.temperature <= TEMPERATURE_MAX):
        failures.append(
            FieldFailure(
                field="temperature",
                received_value=payload.temperature,
                reason=(
                    f"Temperature {payload.temperature}°C is outside the "
                    f"acceptable cold-chain range "
                    f"[{TEMPERATURE_MIN}°C, {TEMPERATURE_MAX}°C]."
                ),
            )
        )

    # ------------------------------------------------------------------
    # Check 6: humidity must be in [0, 100]
    # Pydantic already enforces this, but we include it here for the
    # same self-contained-service reason as latitude/longitude.
    # ------------------------------------------------------------------
    if not (HUMIDITY_MIN <= payload.humidity <= HUMIDITY_MAX):
        failures.append(
            FieldFailure(
                field="humidity",
                received_value=payload.humidity,
                reason=(
                    f"Humidity {payload.humidity}% is outside the valid range "
                    f"[{HUMIDITY_MIN}%, {HUMIDITY_MAX}%]."
                ),
            )
        )

    # ------------------------------------------------------------------
    # Check 7: timestamp must not be None
    # Pydantic parses the ISO 8601 string into a datetime object and
    # raises a 422 if the string is unparseable, so by the time we get
    # here it is always a valid datetime. This guard is a safety net for
    # any future code path that might bypass Pydantic.
    # ------------------------------------------------------------------
    if payload.timestamp is None:
        failures.append(
            FieldFailure(
                field="timestamp",
                received_value=None,
                reason="timestamp is missing or could not be parsed as a datetime.",
            )
        )

    # ------------------------------------------------------------------
    # Build and return the structured result
    # ------------------------------------------------------------------
    return ValidationResult(
        passed=len(failures) == 0,
        stage=STAGE_NAME,
        failures=failures,
    )
