"""
app/schemas/simulation.py
-------------------------
Pydantic schemas and enum definitions for Phase 9 Telemetry Simulator + Fault Injection.

PURPOSE
-------
Defines structured configuration for synthetic telemetry generation and controlled
fault injection to rigorously evaluate the AgriChain AI Trust Layer pipeline.

FAULT TYPES
-----------
- TEMPERATURE_SPIKE: Sudden surge or drop exceeding thermal inertia plausibility.
- HUMIDITY_SPIKE: Sudden jump or drop exceeding physical rate plausibility.
- GPS_JUMP: Unrealistic displacement resulting in impossible implied vehicle speed.
- TIMESTAMP_OUT_OF_ORDER: Regressive timestamp violating chronological monotonicity.
- REPLAY: Reused canonical payload triggering Phase 6 cryptographic replay detection.
- TELEMETRY_GAP: Abnormally large interval between successive readings.
- COMBINED: Simultaneous or sequential multi-fault injection scenarios.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.telemetry import TelemetryPayload


class FaultType(str, Enum):
    """Supported fault injection scenarios."""

    TEMPERATURE_SPIKE = "TEMPERATURE_SPIKE"
    HUMIDITY_SPIKE = "HUMIDITY_SPIKE"
    GPS_JUMP = "GPS_JUMP"
    TIMESTAMP_OUT_OF_ORDER = "TIMESTAMP_OUT_OF_ORDER"
    REPLAY = "REPLAY"
    TELEMETRY_GAP = "TELEMETRY_GAP"
    COMBINED = "COMBINED"


class FaultConfig(BaseModel):
    """
    Configuration for an individual fault injection event.
    """

    fault_type: FaultType = Field(
        ...,
        description="The type of fault to inject into the sequence.",
    )
    position: Optional[int] = Field(
        None,
        description="0-indexed position in the sequence to inject the fault. Defaults to the last reading if omitted.",
    )
    params: Dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters specific to the fault (e.g. temp_delta, humidity_delta, speed_kmh, time_gap_seconds, replay_source_index).",
    )


class SimulationConfig(BaseModel):
    """
    Configuration for generating a sequence of simulated IoT telemetry readings.
    """

    device_id: str = Field(
        default="DEV-SIM-001",
        description="Device identifier for the generated telemetry.",
    )
    batch_id: str = Field(
        default="BATCH-SIM-001",
        description="Batch identifier for the generated telemetry.",
    )
    num_readings: int = Field(
        default=10,
        ge=1,
        le=1000,
        description="Number of telemetry readings to generate.",
    )
    start_time: Optional[datetime] = Field(
        default=None,
        description="Starting ISO timestamp. Defaults to UTC now if not provided.",
    )
    time_step_seconds: float = Field(
        default=60.0,
        gt=0.0,
        description="Time interval between consecutive readings in seconds.",
    )
    start_lat: float = Field(
        default=18.5204,
        ge=-90.0,
        le=90.0,
        description="Starting GPS latitude.",
    )
    start_lon: float = Field(
        default=73.8567,
        ge=-180.0,
        le=180.0,
        description="Starting GPS longitude.",
    )
    start_temp: float = Field(
        default=4.0,
        description="Starting temperature in °C.",
    )
    start_humidity: float = Field(
        default=85.0,
        ge=0.0,
        le=100.0,
        description="Starting relative humidity percentage.",
    )
    speed_kmh: float = Field(
        default=40.0,
        ge=0.0,
        le=120.0,
        description="Nominal vehicle speed in km/h for normal route progression.",
    )
    random_seed: Optional[int] = Field(
        default=42,
        description="Optional seed for deterministic random generation.",
    )
    faults: List[FaultConfig] = Field(
        default_factory=list,
        description="List of faults to inject into the sequence.",
    )


class SimulationEvaluationResult(BaseModel):
    """
    Summary result of simulated telemetry readings processed through the AI Trust Layer.
    """

    total_readings: int = Field(..., description="Total readings generated.")
    faults_injected: int = Field(..., description="Total faults requested.")
    readings: List[TelemetryPayload] = Field(..., description="Simulated telemetry payload list.")
    pipeline_results: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Detailed ingestion responses if evaluated through the pipeline.",
    )
