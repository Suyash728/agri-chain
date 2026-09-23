"""
app/services/verdict.py
-----------------------
Phase 7 — Trust/Verdict Engine service.

WHAT THIS MODULE DOES
----------------------
Consolidates and evaluates trust signals from:
  1. Phase 3 — Physical & Temporal Plausibility
  2. Phase 5 — Isolation Forest ML Anomaly Detection
  3. Phase 6 — Cryptographic Integrity & Replay Detection

DECISION POLICY
---------------
1. Integrity Failures (Rule A):
   - Replay detected (`REPLAY_DETECTED`) -> ANOMALOUS
   - Sequence out-of-order (`TIMESTAMP_OUT_OF_SEQUENCE`) -> ANOMALOUS
   - Failed authentication (`UNAUTHENTICATED_DEVICE`) -> ANOMALOUS
2. Physical Plausibility Failures (Rule B):
   - GPS speed exceeded, temperature/humidity rate exceeded, timestamps invalid -> ANOMALOUS
3. ML Anomaly (Rule C):
   - Isolation Forest outlier (`prediction = -1` or `status = ANOMALOUS`) -> ANOMALOUS (reason: `ML_ANOMALY`)
4. ML Unavailable (Rule D):
   - If physical & integrity checks pass, but ML is `MODEL_NOT_TRAINED` or `INSUFFICIENT_FEATURES`,
     returns `INSUFFICIENT_EVIDENCE` rather than falsely claiming `VALID` or falsely claiming `ANOMALOUS`.
5. Valid Telemetry (Rule E):
   - Returns `VALID` only when all physical, integrity, and ML checks (`status = NORMAL`) pass.

DETERMINISTIC REASON CODE ORDER
-------------------------------
1. Integrity reason codes
2. Plausibility reason codes
3. ML anomaly reason codes
"""

from typing import List
from app.schemas.anomaly import AnomalyResult
from app.schemas.integrity import IntegrityResult
from app.schemas.plausibility import PlausibilityResult
from app.schemas.verdict import VerdictEvidence, VerdictResult


def evaluate_verdict(
    plausibility: PlausibilityResult,
    ml: AnomalyResult,
    integrity: IntegrityResult,
    include_evidence: bool = True,
) -> VerdictResult:
    """
    Evaluate evidence from all pipeline stages and compute a final trust verdict.

    Parameters
    ----------
    plausibility : PlausibilityResult
        Output of Phase 3 physical/temporal checks.
    ml : AnomalyResult
        Output of Phase 5 Isolation Forest ML detector.
    integrity : IntegrityResult
        Output of Phase 6 cryptographic integrity & replay checks.
    include_evidence : bool
        Whether to attach consolidated raw evidence in the result object.

    Returns
    -------
    VerdictResult
        Deterministic final verdict, ordered reason codes, and explanation.
    """
    raw_reasons: List[str] = []

    # ------------------------------------------------------------------
    # 1. Evaluate Integrity Evidence
    # ------------------------------------------------------------------
    if integrity.replay_detected:
        raw_reasons.append("REPLAY_DETECTED")

    for check in integrity.checks:
        if not check.passed and check.reason_code not in ("INTEGRITY_VALID", "DEVICE_AUTHENTICATED"):
            raw_reasons.append(check.reason_code)

    # ------------------------------------------------------------------
    # 2. Evaluate Physical & Temporal Plausibility Evidence
    # ------------------------------------------------------------------
    for check in plausibility.checks:
        if not check.passed and check.reason_code:
            raw_reasons.append(check.reason_code)

    # ------------------------------------------------------------------
    # 3. Evaluate ML Anomaly Evidence
    # ------------------------------------------------------------------
    if ml.status == "ANOMALOUS" or ml.prediction == -1:
        raw_reasons.append("ML_ANOMALY")

    # Deduplicate reason codes while strictly preserving order:
    # 1. Integrity -> 2. Plausibility -> 3. ML
    unique_reasons: List[str] = []
    for r in raw_reasons:
        if r not in unique_reasons:
            unique_reasons.append(r)

    # ------------------------------------------------------------------
    # 4. Determine Final Verdict State
    # ------------------------------------------------------------------
    if len(unique_reasons) > 0:
        verdict = "ANOMALOUS"
        details = f"Telemetry flagged as ANOMALOUS due to {len(unique_reasons)} failure(s): {', '.join(unique_reasons)}."
    elif ml.status in ("MODEL_NOT_TRAINED", "INSUFFICIENT_FEATURES"):
        verdict = "INSUFFICIENT_EVIDENCE"
        details = (
            f"Physical and integrity checks passed, but ML anomaly detection is unavailable ({ml.status}). "
            "Telemetry cannot be verified as fully VALID without complete ML evidence."
        )
    elif ml.status == "NORMAL" and plausibility.plausible and integrity.status == "VALID":
        verdict = "VALID"
        details = "All physical, temporal, ML, and integrity trust checks passed successfully."
    else:
        verdict = "INSUFFICIENT_EVIDENCE"
        details = "Evaluation completed with intermediate or incomplete trust signals."

    evidence = (
        VerdictEvidence(
            plausibility=plausibility,
            ml=ml,
            integrity=integrity,
        )
        if include_evidence
        else None
    )

    return VerdictResult(
        verdict=verdict,
        reason_codes=unique_reasons,
        details=details,
        evidence=evidence,
    )
