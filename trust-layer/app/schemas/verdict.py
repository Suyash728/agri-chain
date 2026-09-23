"""
app/schemas/verdict.py
----------------------
Pydantic schemas for Phase 7 Trust/Verdict Engine.

PURPOSE
-------
Aggregates trust evidence from:
  - Phase 3: Physical & Temporal Plausibility
  - Phase 5: Isolation Forest ML Anomaly Detection
  - Phase 6: Cryptographic Integrity & Replay Detection

VERDICT STATES
--------------
- VALID: All checks passed and ML model confirms in-distribution reading.
- ANOMALOUS: One or more confirmed plausibility, ML, or integrity failures occurred.
- INSUFFICIENT_EVIDENCE: No confirmed failures, but required evidence is unavailable
  (e.g., first reading missing derived features or untrained ML model).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.anomaly import AnomalyResult
from app.schemas.integrity import IntegrityResult
from app.schemas.plausibility import PlausibilityResult


class VerdictEvidence(BaseModel):
    """
    Consolidated raw evidence from all evaluation pipeline stages.
    """

    plausibility: PlausibilityResult = Field(..., description="Evidence from Phase 3 plausibility checks.")
    ml: AnomalyResult = Field(..., description="Evidence from Phase 5 Isolation Forest ML anomaly detector.")
    integrity: IntegrityResult = Field(..., description="Evidence from Phase 6 integrity and replay detector.")


class VerdictResult(BaseModel):
    """
    Final structured output of the Phase 7 Trust/Verdict Engine.
    """

    verdict: str = Field(
        ...,
        description="Final trust verdict: 'VALID', 'ANOMALOUS', or 'INSUFFICIENT_EVIDENCE'.",
    )
    reason_codes: List[str] = Field(
        default_factory=list,
        description="Deterministic, deduplicated list of reason codes explaining the verdict.",
    )
    details: Optional[str] = Field(
        None,
        description="Human-readable explanation of why the verdict was reached.",
    )
    evidence: Optional[VerdictEvidence] = Field(
        None,
        description="Consolidated evidence from all pipeline stages (optional in compact responses).",
    )
