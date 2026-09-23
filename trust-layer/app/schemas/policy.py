"""
app/schemas/policy.py
---------------------
Pydantic model for Crop and Batch Plausibility Policy configurations.

PURPOSE
-------
Different agricultural commodities (e.g., berries vs. apples vs. frozen meat)
have vastly different thermal mass, sensitivity, and transport constraints.

This schema defines a CropPolicy interface so Phase 3 threshold parameters can
be overridden per crop or batch without modifying core validator code.
If no policy is provided, global defaults from app/config.py are used.
"""

from typing import Optional
from pydantic import BaseModel, Field
from app.config import (
    MAX_HUMIDITY_CHANGE_RATE_PER_MIN,
    MAX_PLAUSIBLE_SPEED_KMH,
    MAX_TELEMETRY_GAP_SECONDS,
    MAX_TEMPERATURE_CHANGE_RATE_PER_MIN,
)


class CropPolicy(BaseModel):
    """
    Configuration policy defining physical/temporal thresholds for a crop or batch.

    Attributes
    ----------
    crop_type : str
        Name of the crop / product (e.g., "Table Grapes", "Fresh Strawberries", "Frozen Seafood").
    max_plausible_speed_kmh : float
        Maximum vehicle transit speed allowed for this batch/crop.
    max_temperature_change_rate_per_min : float
        Maximum allowed temperature rate of change in °C per minute.
    max_humidity_change_rate_per_min : float
        Maximum allowed relative humidity rate of change in % per minute.
    max_telemetry_gap_seconds : float
        Maximum allowed time gap between consecutive telemetry transmissions.
    """

    crop_type: str = Field(
        default="Default Cold Chain Produce",
        description="Name of the crop or commodity.",
    )
    max_plausible_speed_kmh: float = Field(
        default_factory=lambda: MAX_PLAUSIBLE_SPEED_KMH,
        description="Max speed in km/h.",
    )
    max_temperature_change_rate_per_min: float = Field(
        default_factory=lambda: MAX_TEMPERATURE_CHANGE_RATE_PER_MIN,
        description="Max temperature rate of change in °C/min.",
    )
    max_humidity_change_rate_per_min: float = Field(
        default_factory=lambda: MAX_HUMIDITY_CHANGE_RATE_PER_MIN,
        description="Max humidity rate of change in %/min.",
    )
    max_telemetry_gap_seconds: float = Field(
        default_factory=lambda: MAX_TELEMETRY_GAP_SECONDS,
        description="Max telemetry gap in seconds.",
    )
    min_temp_c: Optional[float] = Field(
        default=None,
        description="Minimum allowed temperature in °C for this crop.",
    )
    max_temp_c: Optional[float] = Field(
        default=None,
        description="Maximum allowed temperature in °C for this crop.",
    )
    min_humidity: Optional[float] = Field(
        default=None,
        description="Minimum allowed relative humidity in % for this crop.",
    )
    max_humidity: Optional[float] = Field(
        default=None,
        description="Maximum allowed relative humidity in % for this crop.",
    )
