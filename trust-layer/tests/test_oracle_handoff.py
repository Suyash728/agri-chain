"""
tests/test_oracle_handoff.py
----------------------------
Unit and integration tests for Phase 10 — AI Trust Layer -> Oracle Handoff Interface.

Tests cover:
  1. Service Unit Tests:
     - VALID + READY_FOR_ORACLE event produces an approved OracleHandoffPayload
     - ANOMALOUS + QUARANTINED event raises OracleHandoffIneligibleError
     - INSUFFICIENT_EVIDENCE + ON_HOLD event raises OracleHandoffIneligibleError
     - Exact Phase 6 event_hash is preserved
     - Inconsistent / tampered combinations (e.g. VALID + QUARANTINED) are rejected
     - OracleHandoffPayload schema validation enforces all required fields and schema version
     - Zero blockchain dependencies (runs entirely off-chain with no Web3/Polygon requirements)
  2. Integration & API Endpoint Tests (GET /telemetry/oracle-handoff/{event_hash}):
     - End-to-end: verified normal telemetry ingestion creates approved handoff payload (HTTP 200)
     - End-to-end: replay or anomalous telemetry ingestion rejects handoff (HTTP 400 with OracleHandoffRejection)
     - End-to-end: untrained ML (ON_HOLD) rejects handoff (HTTP 400)
     - Non-existent event_hash returns HTTP 404
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.audit import AuditRecord
from app.schemas.oracle import OracleHandoffIneligibleError, OracleHandoffPayload
from app.services.anomaly_detector import anomaly_detector
from app.services.audit import audit_service
from app.services.history import history_repository
from app.services.integrity import replay_repository
from app.services.oracle_handoff import oracle_handoff_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_stores():
    """Ensure in-memory repositories are cleared before and after every test."""
    history_repository.clear()
    replay_repository.clear()
    audit_service.clear()
    anomaly_detector.clear_model()
    yield
    history_repository.clear()
    replay_repository.clear()
    audit_service.clear()
    anomaly_detector.clear_model()


@pytest.fixture
def trained_detector():
    """Trains the anomaly detector with normal baseline features."""
    baseline = [
        [4.0, 85.0, 18.5204, 73.8567, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        [4.1, 85.1, 18.5205, 73.8568, 0.1, 0.1, 0.1, 0.1, 0.01, 0.6, 60.0],
        [4.2, 84.9, 18.5206, 73.8569, 0.1, 0.1, -0.2, -0.2, 0.015, 0.9, 60.0],
        [3.9, 85.2, 18.5207, 73.8570, -0.3, -0.3, 0.3, 0.3, 0.01, 0.6, 60.0],
        [4.0, 85.0, 18.5208, 73.8571, 0.1, 0.1, -0.2, -0.2, 0.012, 0.72, 60.0],
        [4.1, 85.0, 18.5209, 73.8572, 0.1, 0.1, 0.0, 0.0, 0.01, 0.6, 60.0],
    ]
    anomaly_detector.fit(baseline)
    return anomaly_detector


def _make_audit_record(
    verdict: str = "VALID",
    disposition: str = "READY_FOR_ORACLE",
    event_hash: str = "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
    reason_codes: list = None,
    anomaly_score: float = 0.12,
) -> AuditRecord:
    return AuditRecord(
        audit_id="audit-test-001",
        batch_id="BATCH-001",
        device_id="DEV-001",
        timestamp=datetime(2026, 9, 21, 10, 0, 0, tzinfo=timezone.utc),
        latitude=18.5204,
        longitude=73.8567,
        temperature=4.2,
        humidity=85.0,
        event_hash=event_hash,
        verdict=verdict,
        disposition=disposition,
        reason_codes=reason_codes or [],
        anomaly_score=anomaly_score,
        processed_at=datetime(2026, 9, 21, 10, 0, 1, tzinfo=timezone.utc),
        details="Test record.",
    )


# ===========================================================================
# 1. Oracle Handoff Service Unit Tests
# ===========================================================================

def test_valid_event_accepted():
    record = _make_audit_record(verdict="VALID", disposition="READY_FOR_ORACLE")
    payload = oracle_handoff_service.create_handoff(record)

    assert isinstance(payload, OracleHandoffPayload)
    assert payload.schema_version == "1.0"
    assert payload.event_hash == record.event_hash
    assert payload.batch_id == "BATCH-001"
    assert payload.device_id == "DEV-001"
    assert payload.latitude == 18.5204
    assert payload.longitude == 73.8567
    assert payload.temperature == 4.2
    assert payload.humidity == 85.0
    assert payload.verdict == "VALID"
    assert payload.disposition == "READY_FOR_ORACLE"
    assert payload.reason_codes == []
    assert payload.anomaly_score == 0.12
    assert payload.approved_at is not None
    assert "Approved" in payload.notes


def test_anomalous_event_rejected():
    record = _make_audit_record(
        verdict="ANOMALOUS",
        disposition="QUARANTINED",
        reason_codes=["REPLAY_DETECTED"],
    )

    with pytest.raises(OracleHandoffIneligibleError) as exc_info:
        oracle_handoff_service.create_handoff(record)

    assert "not eligible for Oracle handoff" in str(exc_info.value)
    assert "ANOMALOUS" in str(exc_info.value)


def test_insufficient_evidence_event_rejected():
    record = _make_audit_record(
        verdict="INSUFFICIENT_EVIDENCE",
        disposition="ON_HOLD",
        anomaly_score=None,
    )

    with pytest.raises(OracleHandoffIneligibleError) as exc_info:
        oracle_handoff_service.create_handoff(record)

    assert "not eligible for Oracle handoff" in str(exc_info.value)
    assert "INSUFFICIENT_EVIDENCE" in str(exc_info.value)


def test_event_hash_preservation():
    test_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    record = _make_audit_record(
        verdict="VALID",
        disposition="READY_FOR_ORACLE",
        event_hash=test_hash,
    )
    payload = oracle_handoff_service.create_handoff(record)

    # Hash must remain identical to input hash
    assert payload.event_hash == test_hash


def test_tampered_eligibility_combinations_rejected():
    # Inconsistent combinations must be strictly rejected
    assert not oracle_handoff_service.is_eligible("ANOMALOUS", "READY_FOR_ORACLE")
    assert not oracle_handoff_service.is_eligible("VALID", "QUARANTINED")
    assert not oracle_handoff_service.is_eligible("VALID", "ON_HOLD")
    assert not oracle_handoff_service.is_eligible("INSUFFICIENT_EVIDENCE", "READY_FOR_ORACLE")
    assert not oracle_handoff_service.is_eligible("INVALID", "UNKNOWN")

    record_tampered = _make_audit_record(verdict="ANOMALOUS", disposition="READY_FOR_ORACLE")
    with pytest.raises(OracleHandoffIneligibleError):
        oracle_handoff_service.create_handoff(record_tampered)


def test_schema_validation_required_fields():
    # Verify missing required field raises ValidationError
    with pytest.raises(ValidationError):
        OracleHandoffPayload(
            schema_version="1.0",
            # missing event_hash
            batch_id="BATCH-001",
            device_id="DEV-001",
            timestamp=datetime.now(timezone.utc),
            latitude=18.52,
            longitude=73.85,
            temperature=4.0,
            humidity=80.0,
            approved_at=datetime.now(timezone.utc),
        )


def test_no_blockchain_side_effects():
    """Verify that constructing the handoff requires no Web3 or blockchain connection."""
    record = _make_audit_record(verdict="VALID", disposition="READY_FOR_ORACLE")
    # Must execute purely synchronously in-memory
    payload = oracle_handoff_service.create_handoff(record)
    assert payload is not None
    # No blockchain attributes exist on the payload
    assert not hasattr(payload, "transaction_hash")
    assert not hasattr(payload, "block_number")
    assert not hasattr(payload, "gas_used")


def test_create_handoff_by_hash_not_found():
    with pytest.raises(KeyError):
        oracle_handoff_service.create_handoff_by_hash("nonexistent_hash_12345")


# ===========================================================================
# 2. Integration & API Endpoint Tests (GET /telemetry/oracle-handoff/{hash})
# ===========================================================================

def test_api_oracle_handoff_approved_on_valid_telemetry(trained_detector):
    """End-to-end: normal reading processed through POST /telemetry returns approved Oracle handoff payload."""
    payload1 = {
        "device_id": "DEV-ORACLE-01",
        "batch_id": "BATCH-ORACLE-01",
        "timestamp": "2026-09-21T10:00:00Z",
        "temperature": 4.0,
        "humidity": 85.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    client.post("/telemetry", json=payload1)

    payload2 = {
        "device_id": "DEV-ORACLE-01",
        "batch_id": "BATCH-ORACLE-01",
        "timestamp": "2026-09-21T10:01:00Z",
        "temperature": 4.1,
        "humidity": 85.1,
        "latitude": 18.5205,
        "longitude": 73.8568,
    }
    resp2 = client.post("/telemetry", json=payload2)
    assert resp2.status_code == 200
    event_hash = resp2.json()["integrity"]["event_hash"]
    assert resp2.json()["verdict"]["verdict"] == "VALID"
    assert resp2.json()["audit"]["disposition"] == "READY_FOR_ORACLE"

    # Request Oracle handoff payload by event_hash
    handoff_resp = client.get(f"/telemetry/oracle-handoff/{event_hash}")
    assert handoff_resp.status_code == 200
    data = handoff_resp.json()

    assert data["schema_version"] == "1.0"
    assert data["event_hash"] == event_hash
    assert data["batch_id"] == "BATCH-ORACLE-01"
    assert data["device_id"] == "DEV-ORACLE-01"
    assert data["verdict"] == "VALID"
    assert data["disposition"] == "READY_FOR_ORACLE"
    assert data["temperature"] == 4.1
    assert data["humidity"] == 85.1
    assert data["latitude"] == 18.5205
    assert data["longitude"] == 73.8568
    assert data["reason_codes"] == []


def test_api_oracle_handoff_rejected_on_quarantined_replay(trained_detector):
    """End-to-end: replayed event produces QUARANTINED audit -> handoff request rejected with HTTP 400."""
    payload = {
        "device_id": "DEV-ORACLE-02",
        "batch_id": "BATCH-ORACLE-02",
        "timestamp": "2026-09-21T10:00:00Z",
        "temperature": 4.0,
        "humidity": 85.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    client.post("/telemetry", json=payload)
    # Replay identical event
    replay_resp = client.post("/telemetry", json=payload)
    assert replay_resp.status_code == 200
    event_hash = replay_resp.json()["integrity"]["event_hash"]
    assert replay_resp.json()["verdict"]["verdict"] == "ANOMALOUS"
    assert replay_resp.json()["audit"]["disposition"] == "QUARANTINED"

    # Request Oracle handoff payload for replayed event
    handoff_resp = client.get(f"/telemetry/oracle-handoff/{event_hash}")
    assert handoff_resp.status_code == 400
    data = handoff_resp.json()["detail"]

    assert data["event_hash"] == event_hash
    assert data["verdict"] == "ANOMALOUS"
    assert data["disposition"] == "QUARANTINED"
    assert data["eligible"] is False
    assert "not eligible for Oracle handoff" in data["detail"]


def test_api_oracle_handoff_rejected_on_on_hold_untrained():
    """End-to-end: untrained ML produces ON_HOLD audit -> handoff request rejected with HTTP 400."""
    payload = {
        "device_id": "DEV-ORACLE-03",
        "batch_id": "BATCH-ORACLE-03",
        "timestamp": "2026-09-21T10:00:00Z",
        "temperature": 4.0,
        "humidity": 85.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    resp = client.post("/telemetry", json=payload)
    assert resp.status_code == 200
    event_hash = resp.json()["integrity"]["event_hash"]
    assert resp.json()["verdict"]["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert resp.json()["audit"]["disposition"] == "ON_HOLD"

    handoff_resp = client.get(f"/telemetry/oracle-handoff/{event_hash}")
    assert handoff_resp.status_code == 400
    data = handoff_resp.json()["detail"]
    assert data["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert data["disposition"] == "ON_HOLD"
    assert data["eligible"] is False


def test_api_oracle_handoff_not_found():
    resp = client.get("/telemetry/oracle-handoff/nonexistenthash00000000000000000000000000000000")
    assert resp.status_code == 404
    assert "No audit records found" in resp.json()["detail"]
