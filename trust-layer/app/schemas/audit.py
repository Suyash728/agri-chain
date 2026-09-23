"""
app/schemas/audit.py
--------------------
Pydantic schemas for Phase 8 Quarantine & Audit Trail.

PURPOSE
-------
Records the final operational disposition and immutable audit record for every
processed telemetry event.

DISPOSITION STATES
------------------
- READY_FOR_ORACLE: Event passed all validation and ML trust layers (Verdict = VALID).
                    Held ready for future Phase 9 blockchain Oracle dispatch.
- QUARANTINED: Event failed one or more physical, statistical, or integrity checks (Verdict = ANOMALOUS).
               Isolated off-chain with preserved evidence for human review/investigation.
- ON_HOLD: Incomplete evidence (e.g. first reading or untrained ML model) prevented full verification.
           Held without false rejection or false acceptance (Verdict = INSUFFICIENT_EVIDENCE).
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AuditRecord(BaseModel):
    """
    Immutable audit trail entry recording the disposition and evidence for a telemetry event.
    """

    audit_id: str = Field(..., description="Unique identifier for the audit record (UUID).")
    batch_id: str = Field(..., description="Batch identifier associated with the telemetry.")
    device_id: str = Field(..., description="Device identifier associated with the telemetry.")
    timestamp: datetime = Field(..., description="Original ISO 8601 telemetry timestamp.")
    latitude: Optional[float] = Field(None, description="GPS latitude from telemetry.")
    longitude: Optional[float] = Field(None, description="GPS longitude from telemetry.")
    temperature: Optional[float] = Field(None, description="Ambient temperature in °C from telemetry.")
    humidity: Optional[float] = Field(None, description="Relative humidity from telemetry.")
    event_hash: str = Field(..., description="Deterministic SHA-256 fingerprint from Phase 6.")
    verdict: str = Field(..., description="Phase 7 Trust Verdict ('VALID', 'ANOMALOUS', or 'INSUFFICIENT_EVIDENCE').")
    disposition: str = Field(
        ...,
        description="Phase 8 operational disposition: 'READY_FOR_ORACLE', 'QUARANTINED', or 'ON_HOLD'.",
    )
    reason_codes: List[str] = Field(
        default_factory=list,
        description="Preserved reason codes explaining why the event was flagged or quarantined.",
    )
    anomaly_score: Optional[float] = Field(
        None,
        description="Raw Isolation Forest decision score from Phase 5 (if available).",
    )
    processed_at: datetime = Field(
        ...,
        description="UTC timestamp when the audit record was created and stored.",
    )
    details: Optional[str] = Field(
        None,
        description="Summary explanation of the audit disposition.",
    )
