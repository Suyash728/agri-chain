"""
app/schemas/telemetry.py
------------------------
Pydantic schema (data model) for IoT telemetry data.

Pydantic automatically validates incoming JSON against this schema.
If any required field is missing or has the wrong type, FastAPI will
return a 422 Unprocessable Entity response with a clear error message.

This schema represents a single sensor reading from a device attached
to an agricultural supply chain node (farm, warehouse, dark store, etc.)
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TelemetryPayload(BaseModel):
    """
    Represents one telemetry reading sent by an IoT device.

    Fields
    ------
    batch_id    : Unique identifier for the produce batch (e.g., "BATCH-2026-001").
    device_id   : Unique identifier for the IoT sensor device (e.g., "DEV-042").
    latitude    : GPS latitude of the device (-90.0 to 90.0 degrees).
    longitude   : GPS longitude of the device (-180.0 to 180.0 degrees).
    temperature : Ambient temperature reading in degrees Celsius.
    humidity    : Relative humidity reading as a percentage (0-100).
    timestamp   : ISO 8601 datetime string of when the reading was taken.

    Validation notes
    ----------------
    Pydantic enforces ge/le bounds on latitude, longitude, and humidity at
    the schema level.  Temperature bounds are NOT enforced here — they are
    intentionally left to the validator service (app/services/validator.py)
    so that the cold-chain range is configurable in one place (app/config.py).
    """

    # Pydantic v2: use model_config = ConfigDict(...) instead of inner Config class.
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "batch_id": "BATCH-2026-001",
                "device_id": "DEV-042",
                "latitude": 18.5204,
                "longitude": 73.8567,
                "temperature": 4.5,
                "humidity": 85.0,
                "timestamp": "2026-09-21T10:00:00Z",
            }
        }
    )

    batch_id: str = Field(
        ...,
        description="Unique identifier for the produce batch.",
    )
    device_id: str = Field(
        ...,
        description="Unique identifier for the IoT sensor device.",
    )
    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="GPS latitude of the device (degrees). Must be in [-90, 90].",
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="GPS longitude of the device (degrees). Must be in [-180, 180].",
    )
    temperature: float = Field(
        ...,
        description=(
            "Ambient temperature in degrees Celsius. "
            "Acceptable cold-chain range is enforced by the validator service "
            "(default: -30°C to 60°C — see app/config.py)."
        ),
    )
    humidity: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Relative humidity as a percentage. Must be in [0, 100].",
    )
    timestamp: datetime = Field(
        ...,
        description="ISO 8601 datetime when the reading was captured.",
    )
