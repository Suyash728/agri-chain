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

import json
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional
import uuid

from app.schemas.anomaly import AnomalyResult
from app.schemas.audit import AuditRecord
from app.schemas.integrity import IntegrityResult
from app.schemas.telemetry import TelemetryPayload
from app.schemas.verdict import VerdictResult
from app.services.db import get_connection, init_trust_db

VERDICT_TO_DISPOSITION = {
    "VALID": "READY_FOR_ORACLE",
    "ANOMALOUS": "QUARANTINED",
    "INSUFFICIENT_EVIDENCE": "ON_HOLD",
}


class AuditService:
    """
    SQLite-backed append-only repository and service for telemetry audit records and quarantine management.
    """

    def __init__(self, db_path: Optional[str] = None) -> None:
        self.db_path = db_path
        init_trust_db(self.db_path)

    def record_audit(
        self,
        payload: TelemetryPayload,
        verdict: VerdictResult,
        integrity: IntegrityResult,
        anomaly: Optional[AnomalyResult] = None,
    ) -> AuditRecord:
        """
        Create and append an immutable audit record for a processed telemetry event.
        """
        disposition = VERDICT_TO_DISPOSITION.get(verdict.verdict, "ON_HOLD")
        anomaly_score = anomaly.anomaly_score if anomaly else None

        if disposition == "QUARANTINED":
            details = f"Telemetry quarantined due to {len(verdict.reason_codes)} reason(s): {', '.join(verdict.reason_codes)}."
        elif disposition == "READY_FOR_ORACLE":
            details = "Telemetry verified across all trust layers and ready for blockchain Oracle transmission."
        else:
            details = "Telemetry placed on hold pending complete ML baseline evidence."

        ts = payload.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        processed_at = datetime.now(timezone.utc)

        record = AuditRecord(
            audit_id=str(uuid.uuid4()),
            batch_id=payload.batch_id,
            device_id=payload.device_id,
            timestamp=ts,
            latitude=payload.latitude,
            longitude=payload.longitude,
            temperature=payload.temperature,
            humidity=payload.humidity,
            event_hash=integrity.event_hash,
            verdict=verdict.verdict,
            disposition=disposition,
            reason_codes=verdict.reason_codes,
            anomaly_score=anomaly_score,
            processed_at=processed_at,
            details=details,
        )

        with get_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO audit_trail (
                    audit_id, batch_id, device_id, timestamp, latitude, longitude,
                    temperature, humidity, event_hash, verdict, disposition,
                    reason_codes, anomaly_score, processed_at, details
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.audit_id,
                    record.batch_id,
                    record.device_id,
                    record.timestamp.isoformat(),
                    float(record.latitude) if record.latitude is not None else None,
                    float(record.longitude) if record.longitude is not None else None,
                    float(record.temperature) if record.temperature is not None else None,
                    float(record.humidity) if record.humidity is not None else None,
                    record.event_hash,
                    record.verdict,
                    record.disposition,
                    json.dumps(record.reason_codes),
                    record.anomaly_score,
                    record.processed_at.isoformat(),
                    record.details,
                ),
            )
            conn.commit()

        return record

    def _row_to_record(self, row: sqlite3.Row) -> AuditRecord:
        raw_ts = row["timestamp"]
        ts = datetime.fromisoformat(raw_ts)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        raw_proc = row["processed_at"]
        proc_ts = datetime.fromisoformat(raw_proc)
        if proc_ts.tzinfo is None:
            proc_ts = proc_ts.replace(tzinfo=timezone.utc)

        raw_reasons = row["reason_codes"]
        reasons = json.loads(raw_reasons) if raw_reasons else []

        return AuditRecord(
            audit_id=row["audit_id"],
            batch_id=row["batch_id"],
            device_id=row["device_id"],
            timestamp=ts,
            latitude=float(row["latitude"]) if row["latitude"] is not None else None,
            longitude=float(row["longitude"]) if row["longitude"] is not None else None,
            temperature=float(row["temperature"]) if row["temperature"] is not None else None,
            humidity=float(row["humidity"]) if row["humidity"] is not None else None,
            event_hash=row["event_hash"],
            verdict=row["verdict"],
            disposition=row["disposition"],
            reason_codes=reasons,
            anomaly_score=float(row["anomaly_score"]) if row["anomaly_score"] is not None else None,
            processed_at=proc_ts,
            details=row["details"],
        )

    def get_by_event_hash(self, event_hash: str) -> List[AuditRecord]:
        """Retrieve all audit records associated with a specific SHA-256 event hash."""
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                "SELECT * FROM audit_trail WHERE event_hash = ? ORDER BY processed_at ASC",
                (event_hash,),
            ).fetchall()
            return [self._row_to_record(r) for r in rows]

    def get_quarantined_records(
        self,
        device_id: Optional[str] = None,
        batch_id: Optional[str] = None,
    ) -> List[AuditRecord]:
        """
        Retrieve all quarantined telemetry records, with optional device and batch filtering.
        """
        query = "SELECT * FROM audit_trail WHERE disposition = 'QUARANTINED'"
        params = []
        if device_id:
            query += " AND device_id = ?"
            params.append(device_id)
        if batch_id:
            query += " AND batch_id = ?"
            params.append(batch_id)
        query += " ORDER BY processed_at DESC"

        with get_connection(self.db_path) as conn:
            rows = conn.execute(query, params).fetchall()
            return [self._row_to_record(r) for r in rows]

    def get_records_by_disposition(self, disposition: str) -> List[AuditRecord]:
        """Retrieve all audit records with a specific disposition."""
        with get_connection(self.db_path) as conn:
            rows = conn.execute(
                "SELECT * FROM audit_trail WHERE disposition = ? ORDER BY processed_at DESC",
                (disposition,),
            ).fetchall()
            return [self._row_to_record(r) for r in rows]

    def get_by_device_and_batch(
        self,
        device_id: str,
        batch_id: Optional[str] = None,
    ) -> List[AuditRecord]:
        """Retrieve all audit records for a device (and optional batch)."""
        query = "SELECT * FROM audit_trail WHERE device_id = ?"
        params = [device_id]
        if batch_id:
            query += " AND batch_id = ?"
            params.append(batch_id)
        query += " ORDER BY processed_at DESC"

        with get_connection(self.db_path) as conn:
            rows = conn.execute(query, params).fetchall()
            return [self._row_to_record(r) for r in rows]

    def get_all_records(self) -> List[AuditRecord]:
        """Retrieve all stored audit records."""
        with get_connection(self.db_path) as conn:
            rows = conn.execute("SELECT * FROM audit_trail ORDER BY processed_at ASC").fetchall()
            return [self._row_to_record(r) for r in rows]

    def clear(self) -> None:
        """Clear all stored audit records (for test isolation)."""
        with get_connection(self.db_path) as conn:
            conn.execute("DELETE FROM audit_trail")
            conn.commit()


# Shared singleton service instance
audit_service = AuditService()

