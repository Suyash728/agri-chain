"""
app/schemas/features.py
-----------------------
Pydantic schema for time-series features extracted from IoT telemetry readings.

PURPOSE
-------
Phase 4 computes numerical time-series features from validated telemetry and
its historical context. These features form the input vector that will be consumed
by the Isolation Forest anomaly detector in Phase 5.

DESIGN DECISIONS
----------------
1. First-reading semantics: When no previous reading exists (first reading for a device/batch),
   derived temporal features (deltas, rates, speed, elapsed time) are set to None (nullable)
   rather than fabricated zero values.
2. Units consistency:
   - Temperature change: °C (signed)
   - Temperature rate: °C / minute (signed)
   - Humidity change: % (signed)
   - Humidity rate: % / minute (signed)
   - Distance: kilometers (km)
   - Implied speed: km / hour (km/h)
   - Time since previous: seconds (s)
3. ML-ready: Supports easy conversion to dictionary or numerical vector.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class TelemetryFeatures(BaseModel):
    """
    Numerical feature vector derived from current telemetry and historical context.
    """

    # --- Raw Current Values ---
    temperature: float = Field(..., description="Current temperature reading (°C).")
    humidity: float = Field(..., description="Current relative humidity reading (%).")
    latitude: float = Field(..., description="Current GPS latitude.")
    longitude: float = Field(..., description="Current GPS longitude.")

    # --- Temperature Temporal Features ---
    temperature_change: Optional[float] = Field(
        None,
        description="Temperature change from previous reading in °C (current - previous).",
    )
    temperature_rate: Optional[float] = Field(
        None,
        description="Rate of temperature change in °C/minute.",
    )

    # --- Humidity Temporal Features ---
    humidity_change: Optional[float] = Field(
        None,
        description="Humidity change from previous reading in % (current - previous).",
    )
    humidity_rate: Optional[float] = Field(
        None,
        description="Rate of humidity change in %/minute.",
    )

    # --- Movement & GPS Features ---
    distance_from_previous: Optional[float] = Field(
        None,
        description="Haversine distance from previous GPS position in kilometers (km).",
    )
    implied_speed: Optional[float] = Field(
        None,
        description="Implied vehicle speed in km/h based on distance and elapsed time.",
    )

    # --- Time Feature ---
    time_since_previous: Optional[float] = Field(
        None,
        description="Elapsed time since previous telemetry reading in seconds.",
    )

    def to_feature_vector(self, fill_na: float = 0.0) -> List[float]:
        """
        Convert features into a flat numerical list suitable for ML inference.

        Parameters
        ----------
        fill_na : float
            Default value to substitute for None values (e.g. for initial readings).

        Returns
        -------
        List[float]
            Fixed-order numerical list of feature values.
        """
        return [
            self.temperature,
            self.humidity,
            self.latitude,
            self.longitude,
            self.temperature_change if self.temperature_change is not None else fill_na,
            self.temperature_rate if self.temperature_rate is not None else fill_na,
            self.humidity_change if self.humidity_change is not None else fill_na,
            self.humidity_rate if self.humidity_rate is not None else fill_na,
            self.distance_from_previous if self.distance_from_previous is not None else fill_na,
            self.implied_speed if self.implied_speed is not None else fill_na,
            self.time_since_previous if self.time_since_previous is not None else fill_na,
        ]
