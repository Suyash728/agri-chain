"""
app/services/oracle_handoff.py
------------------------------
Phase 10 — AI Trust Layer -> Oracle Handoff Interface service.

WHAT THIS MODULE DOES
----------------------
1. Acts as a strict, clean architectural boundary adapter between the AI Trust Layer
   and the downstream Oracle/blockchain module.
2. Enforces the strict eligibility invariant:
     Only events satisfying:
         verdict == "VALID" and disposition == "READY_FOR_ORACLE"
     can be packaged into an `OracleHandoffPayload`.
3. Rejects any anomalous (`ANOMALOUS` / `QUARANTINED`) or incomplete (`INSUFFICIENT_EVIDENCE` / `ON_HOLD`)
   telemetry events by raising an explicit `OracleHandoffIneligibleError`.
4. Strictly preserves the canonical Phase 6 SHA-256 `event_hash` without recalculation or mutation.
5. Produces zero blockchain side-effects (no Web3, Polygon, Solidity, wallets, or mock transactions).

RESPONSIBILITY BOUNDARY GUARANTEES
-----------------------------------
- AI Trust Layer Guarantees:
    - Telemetry passed all schema, physical, ML, and cryptographic integrity checks.
    - Event has a verified, deterministic canonical SHA-256 event fingerprint.
    - Verdict is VALID and operational disposition is READY_FOR_ORACLE.
    - Approved payload conforms strictly to `OracleHandoffPayload` (schema version 1.0).

- AI Trust Layer Does NOT Guarantee:
    - Blockchain transaction execution, mining, or confirmation.
    - Smart contract execution or gas management.
    - Polygon network connectivity or wallet authentication.
    - Final on-chain ledger persistence.
"""

from datetime import datetime, timezone
from typing import Optional

from app.schemas.audit import AuditRecord
from app.schemas.oracle import OracleHandoffIneligibleError, OracleHandoffPayload
from app.services.audit import audit_service


class OracleHandoffService:
    """
    Service responsible for validating eligibility and generating structured Oracle handoff payloads.
    """

    @staticmethod
    def is_eligible(verdict: str, disposition: str) -> bool:
        """
        Check if an event is strictly eligible for downstream Oracle handoff.

        Eligibility Rule:
            Must have verdict == "VALID" AND disposition == "READY_FOR_ORACLE".
            No overrides, bypasses, or exceptions are permitted.
        """
        return verdict == "VALID" and disposition == "READY_FOR_ORACLE"

    def create_handoff(self, record: AuditRecord) -> OracleHandoffPayload:
        """
        Convert an approved AuditRecord into a structured OracleHandoffPayload.

        Parameters
        ----------
        record : AuditRecord
            The trusted audit record to evaluate for handoff.

        Returns
        -------
        OracleHandoffPayload
            The approved payload contract for the downstream Oracle.

        Raises
        ------
        OracleHandoffIneligibleError
            If the record does not satisfy the eligibility requirements.
        """
        if not self.is_eligible(record.verdict, record.disposition):
            raise OracleHandoffIneligibleError(
                f"Event '{record.event_hash}' with verdict '{record.verdict}' and disposition "
                f"'{record.disposition}' is not eligible for Oracle handoff. "
                "Only events with verdict 'VALID' and disposition 'READY_FOR_ORACLE' are permitted."
            )

        # Fallback values for latitude/longitude/temperature/humidity if not stored directly
        lat = record.latitude if record.latitude is not None else 0.0
        lon = record.longitude if record.longitude is not None else 0.0
        temp = record.temperature if record.temperature is not None else 0.0
        hum = record.humidity if record.humidity is not None else 0.0

        return OracleHandoffPayload(
            schema_version="1.0",
            event_hash=record.event_hash,
            batch_id=record.batch_id,
            device_id=record.device_id,
            timestamp=record.timestamp,
            latitude=lat,
            longitude=lon,
            temperature=temp,
            humidity=hum,
            verdict=record.verdict,
            disposition=record.disposition,
            reason_codes=record.reason_codes,
            anomaly_score=record.anomaly_score,
            approved_at=datetime.now(timezone.utc),
            notes="Approved for downstream Oracle handoff.",
        )

    def create_handoff_by_hash(self, event_hash: str) -> OracleHandoffPayload:
        """
        Retrieve trusted audit record by SHA-256 event hash and construct the Oracle handoff payload.

        Parameters
        ----------
        event_hash : str
            The SHA-256 canonical event hash.

        Returns
        -------
        OracleHandoffPayload
            The approved payload.

        Raises
        ------
        KeyError
            If no audit records exist for the given event hash.
        OracleHandoffIneligibleError
            If the event exists but is not eligible for handoff.
        """
        records = audit_service.get_by_event_hash(event_hash)
        if not records:
            raise KeyError(f"No audit records found for event hash '{event_hash}'.")

        # Use the latest recorded audit state for this event hash
        latest_record = records[-1]
        return self.create_handoff(latest_record)


# Shared singleton instance
oracle_handoff_service = OracleHandoffService()
