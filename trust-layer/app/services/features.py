"""
app/services/features.py
------------------------
Phase 4 — Time-Series Feature Engineering service.

WHAT THIS MODULE DOES
----------------------
Extracts clean, numerical features from an incoming TelemetryPayload and its
corresponding historical context (the previous reading from the same device and batch).

These features capture both:
  1. Instantaneous state (temperature, humidity, GPS coordinates).
  2. Dynamic / temporal transitions (temperature delta & rate, humidity delta & rate,
     displacement distance, velocity, elapsed time).

DESIGN DECISIONS
----------------
1. Reuse existing Haversine calculation: Reuses `haversine_distance_km` from
   `app.services.plausibility` to maintain consistency across the codebase.
2. Numerical Safety: Prevents division-by-zero errors when elapsed time is 0.
   When elapsed time is <= 0 or previous reading is missing, rates and speed are
   explicitly set to None rather than fabricating numbers.
3. Pure function: `extract_features(current, previous)` is stateless and deterministic,
   making it easy to test and integrate with future rolling window engines.
"""

from typing import Optional
from app.schemas.features import TelemetryFeatures
from app.schemas.telemetry import TelemetryPayload
from app.services.plausibility import haversine_distance_km


def extract_features(
    current: TelemetryPayload,
    previous: Optional[TelemetryPayload] = None,
) -> TelemetryFeatures:
    """
    Extract time-series features from current and previous telemetry readings.

    Parameters
    ----------
    current : TelemetryPayload
        The validated current sensor reading.
    previous : Optional[TelemetryPayload]
        The previous sensor reading for the same device and batch (if available).

    Returns
    -------
    TelemetryFeatures
        Structured numerical feature object.
    """
    # 1. Raw current sensor values
    temperature = current.temperature
    humidity = current.humidity
    latitude = current.latitude
    longitude = current.longitude

    # 2. If there is no previous reading, return raw values with null derived features
    if previous is None:
        return TelemetryFeatures(
            temperature=temperature,
            humidity=humidity,
            latitude=latitude,
            longitude=longitude,
            temperature_change=None,
            temperature_rate=None,
            humidity_change=None,
            humidity_rate=None,
            distance_from_previous=None,
            implied_speed=None,
            time_since_previous=None,
        )

    # 3. Compute elapsed time in seconds
    elapsed_seconds = (current.timestamp - previous.timestamp).total_seconds()

    # 4. Compute delta differences
    temperature_change = current.temperature - previous.temperature
    humidity_change = current.humidity - previous.humidity
    distance_km = haversine_distance_km(
        previous.latitude, previous.longitude, current.latitude, current.longitude
    )

    # 5. Compute rates and speed only if elapsed_seconds > 0 to avoid division by zero
    if elapsed_seconds > 0:
        temperature_rate = (temperature_change / elapsed_seconds) * 60.0
        humidity_rate = (humidity_change / elapsed_seconds) * 60.0
        implied_speed = (distance_km / elapsed_seconds) * 3600.0
    else:
        temperature_rate = None
        humidity_rate = None
        implied_speed = None

    return TelemetryFeatures(
        temperature=temperature,
        humidity=humidity,
        latitude=latitude,
        longitude=longitude,
        temperature_change=round(temperature_change, 4),
        temperature_rate=round(temperature_rate, 4) if temperature_rate is not None else None,
        humidity_change=round(humidity_change, 4),
        humidity_rate=round(humidity_rate, 4) if humidity_rate is not None else None,
        distance_from_previous=round(distance_km, 4),
        implied_speed=round(implied_speed, 4) if implied_speed is not None else None,
        time_since_previous=round(elapsed_seconds, 2),
    )
