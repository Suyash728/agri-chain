"""
app/schemas/oracle.py
---------------------
Pydantic schemas and exceptions for Phase 10 — AI Trust Layer -> Oracle Handoff Interface.

PURPOSE
-------
Establishes an explicit, stable data contract between the AI Trust Layer and the
downstream Oracle/blockchain module. Only telemetry events satisfying:
    verdict == "VALID" and disposition == "READY_FOR_ORACLE"
are eligible to be packaged into an `OracleHandoffPayload`.

RESPONSIBILITY BOUNDARY
-----------------------
- The AI Trust Layer guarantees that:
    1. Telemetry passed all schema, physical, ML, and cryptographic integrity checks.
    2. The event hash is deterministic and canonical (Phase 6 SHA-256).
    3. The payload matches this stable contract.
- The AI Trust Layer does NOT guarantee:
    1. Blockchain transaction execution or confirmation.
    2. Smart contract execution or gas management.
    3. Wallet authorization or final on-chain persistence.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class OracleHandoffIneligibleError(Exception):
    """Raised when an attempt is made to construct an Oracle handoff for an ineligible telemetry event."""
    pass


class OracleHandoffPayload(BaseModel):
    """
    Approved data payload handed off to the downstream Oracle for blockchain dispatch.
    """

    schema_version: str = Field(
        default="1.0",
        description="Version of the Oracle handoff schema contract.",
    )
    event_hash: str = Field(
        ...,
        description="Deterministic SHA-256 canonical hash from Phase 6.",
    )
    batch_id: str = Field(
        ...,
        description="Batch identifier associated with the produce.",
    )
    device_id: str = Field(
        ...,
        description="IoT sensor device identifier.",
    )
    timestamp: datetime = Field(
        ...,
        description="ISO 8601 telemetry timestamp.",
    )
    latitude: float = Field(
        ...,
        description="GPS latitude coordinate of the reading.",
    )
    longitude: float = Field(
        ...,
        description="GPS longitude coordinate of the reading.",
    )
    temperature: float = Field(
        ...,
        description="Ambient temperature in °C.",
    )
    humidity: float = Field(
        ...,
        description="Relative humidity percentage.",
    )
    verdict: str = Field(
        default="VALID",
        description="Phase 7 Trust Verdict (must be 'VALID').",
    )
    disposition: str = Field(
        default="READY_FOR_ORACLE",
        description="Phase 8 Operational Disposition (must be 'READY_FOR_ORACLE').",
    )
    reason_codes: List[str] = Field(
        default_factory=list,
        description="Reason codes (empty for clean VALID events).",
    )
    anomaly_score: Optional[float] = Field(
        None,
        description="Raw Isolation Forest decision score from Phase 5.",
    )
    approved_at: datetime = Field(
        ...,
        description="UTC timestamp when the payload was approved for Oracle handoff.",
    )
    notes: Optional[str] = Field(
        default="Approved for downstream Oracle handoff.",
        description="Operational context for the downstream consumer.",
    )


class OracleHandoffRejection(BaseModel):
    """
    Structured response returned when a telemetry event is rejected from Oracle handoff.
    """

    event_hash: Optional[str] = Field(
        None,
        description="Event hash of the requested telemetry event.",
    )
    verdict: str = Field(
        ...,
        description="Current verdict of the event.",
    )
    disposition: str = Field(
        ...,
        description="Current operational disposition of the event.",
    )
    eligible: bool = Field(
        default=False,
        description="Always False for rejection payloads.",
    )
    detail: str = Field(
        ...,
        description="Explanation of why handoff was rejected.",
    )
