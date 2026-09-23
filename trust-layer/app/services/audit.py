"""
app/services/audit.py
---------------------
Phase 8 — Quarantine & Audit Trail service.

WHAT THIS MODULE DOES
----------------------
1. Maps Phase 7 Trust Verdicts to Phase 8 Operational Dispositions:
     - VALID                 -> READY_FOR_ORACLE
     - ANOMALOUS             -> QUARANTINED
     - INSUFFICIENT_EVIDENCE -> ON_HOLD
2. Creates and stores immutable, append-only `AuditRecord` entries for every processed telemetry event.
3. Preserves anomalous telemetry with complete reason codes and ML anomaly scores for investigation.
4. Provides read-only query interfaces for audit inspection by event hash, quarantine status, and device/batch.

DESIGN DECISIONS
----------------
- Data Preservation: Telemetry is never discarded or deleted. Anomalous events are safely quarantined off-chain.
- Reuses Phase 6 Event Hash: SHA-256 fingerprint uniquely identifies each event across audit records.
- Append-Only History: Re-submitting an event appends a new audit record without destroying previous history.
- Modular Repository: In-memory store for development; easily replaceable with persistent DB later.
"""

from datetime import datetime, timezone
from typing import List, Optional
import uuid

from app.schemas.anomaly import AnomalyResult
from app.schemas.audit import AuditRecord
from app.schemas.integrity import IntegrityResult
from app.schemas.telemetry import TelemetryPayload
from app.schemas.verdict import VerdictResult

VERDICT_TO_DISPOSITION = {
    "VALID": "READY_FOR_ORACLE",
    "ANOMALOUS": "QUARANTINED",
    "INSUFFICIENT_EVIDENCE": "ON_HOLD",
}


class AuditService:
    """
    Append-only repository and service for telemetry audit records and quarantine management.
    """

    def __init__(self) -> None:
        self._records: List[AuditRecord] = []

    def record_audit(
        self,
        payload: TelemetryPayload,
        verdict: VerdictResult,
        integrity: IntegrityResult,
        anomaly: Optional[AnomalyResult] = None,
    ) -> AuditRecord:
        """
        Create and append an immutable audit record for a processed telemetry event.

        Parameters
        ----------
        payload : TelemetryPayload
            The incoming telemetry payload.
        verdict : VerdictResult
            The Phase 7 Trust Verdict.
        integrity : IntegrityResult
            The Phase 6 cryptographic integrity result.
        anomaly : Optional[AnomalyResult]
            The Phase 5 ML anomaly detection result.

        Returns
        -------
        AuditRecord
            The stored audit record.
        """
        disposition = VERDICT_TO_DISPOSITION.get(verdict.verdict, "ON_HOLD")
        anomaly_score = anomaly.anomaly_score if anomaly else None

        if disposition == "QUARANTINED":
            details = f"Telemetry quarantined due to {len(verdict.reason_codes)} reason(s): {', '.join(verdict.reason_codes)}."
        elif disposition == "READY_FOR_ORACLE":
            details = "Telemetry verified across all trust layers and ready for blockchain Oracle transmission."
        else:
            details = "Telemetry placed on hold pending complete ML baseline evidence."

        record = AuditRecord(
            audit_id=str(uuid.uuid4()),
            batch_id=payload.batch_id,
            device_id=payload.device_id,
            timestamp=payload.timestamp,
            latitude=payload.latitude,
            longitude=payload.longitude,
            temperature=payload.temperature,
            humidity=payload.humidity,
            event_hash=integrity.event_hash,
            verdict=verdict.verdict,
            disposition=disposition,
            reason_codes=verdict.reason_codes,
            anomaly_score=anomaly_score,
            processed_at=datetime.now(timezone.utc),
            details=details,
        )

        self._records.append(record)
        return record

    def get_by_event_hash(self, event_hash: str) -> List[AuditRecord]:
        """Retrieve all audit records associated with a specific SHA-256 event hash."""
        return [r for r in self._records if r.event_hash == event_hash]

    def get_quarantined_records(
        self,
        device_id: Optional[str] = None,
        batch_id: Optional[str] = None,
    ) -> List[AuditRecord]:
        """
        Retrieve all quarantined telemetry records, with optional device and batch filtering.
        """
        results = [r for r in self._records if r.disposition == "QUARANTINED"]
        if device_id:
            results = [r for r in results if r.device_id == device_id]
        if batch_id:
            results = [r for r in results if r.batch_id == batch_id]
        return results

    def get_records_by_disposition(self, disposition: str) -> List[AuditRecord]:
        """Retrieve all audit records with a specific disposition."""
        return [r for r in self._records if r.disposition == disposition]

    def get_by_device_and_batch(
        self,
        device_id: str,
        batch_id: Optional[str] = None,
    ) -> List[AuditRecord]:
        """Retrieve all audit records for a device (and optional batch)."""
        results = [r for r in self._records if r.device_id == device_id]
        if batch_id:
            results = [r for r in results if r.batch_id == batch_id]
        return results

    def get_all_records(self) -> List[AuditRecord]:
        """Retrieve all stored audit records."""
        return list(self._records)

    def clear(self) -> None:
        """Clear all stored audit records (for test isolation)."""
        self._records.clear()


# Shared singleton service instance
audit_service = AuditService()
