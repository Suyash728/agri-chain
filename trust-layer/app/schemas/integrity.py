"""
app/schemas/integrity.py
------------------------
Pydantic schemas for Phase 6 Telemetry Integrity & Replay Detection.

PURPOSE
-------
Phase 6 produces structured evidence regarding cryptographic payload fingerprints,
replay detection, timestamp freshness, and device authentication status.

IMPORTANT DISTINCTION
---------------------
- `event_hash` (SHA-256): Cryptographic fingerprint of the canonical payload content.
  Proves payload integrity and uniqueness, but does NOT by itself prove device identity.
- `authenticated`: Device authentication status via cryptographic signature verification
  (software stub in Phase 6, extensible for hardware-backed ATECC608A in later phases).
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class IntegrityCheckResult(BaseModel):
    """
    Describes the outcome of an individual integrity or replay check.
    """

    name: str = Field(..., description="Name of the check (e.g. 'event_fingerprint', 'replay_detection').")
    passed: bool = Field(..., description="True if check passed; False if flagged as suspicious/replayed.")
    reason_code: str = Field(
        ...,
        description="Standardized code (e.g. 'INTEGRITY_VALID', 'REPLAY_DETECTED', 'TIMESTAMP_OUT_OF_SEQUENCE').",
    )
    details: Optional[str] = Field(None, description="Detailed contextual message for evidence.")


class IntegrityResult(BaseModel):
    """
    Structured result of the Phase 6 Integrity & Replay Detection layer.
    """

    status: str = Field(
        ...,
        description="Overall integrity status: 'VALID', 'REPLAY_DETECTED', or 'SUSPICIOUS'.",
    )
    event_hash: str = Field(
        ...,
        description="Deterministic SHA-256 hash of the canonical telemetry payload.",
    )
    replay_detected: bool = Field(
        ...,
        description="True if the exact event hash was previously processed for this device/batch.",
    )
    authenticated: bool = Field(
        default=True,
        description="True if device identity/signature was verified (software stub in Phase 6).",
    )
    checks: List[IntegrityCheckResult] = Field(
        default_factory=list,
        description="List of individual integrity, replay, and authentication checks.",
    )
    details: Optional[str] = Field(
        None,
        description="Summary details of integrity evaluation.",
    )
