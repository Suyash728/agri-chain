"""
tests/test_audit.py
--------------------
Unit and integration tests for Phase 8 — Off-Chain Quarantine & Audit Trail.

Tests cover:
  1. AuditService unit tests:
     - Disposition mapping (VALID -> READY_FOR_ORACLE, ANOMALOUS -> QUARANTINED, INSUFFICIENT_EVIDENCE -> ON_HOLD)
     - Reason codes and anomaly score preservation
     - Append-only recording and multi-event history per hash
     - Filter queries (by event hash, quarantine filter by device/batch, disposition filter, etc.)
     - Telemetry preservation (anomalous events are kept, never discarded)
  2. Telemetry ingestion API integration tests (POST /telemetry):
     - Response includes top-level 'audit' dictionary
     - Valid telemetry assigns READY_FOR_ORACLE
     - Anomalous telemetry assigns QUARANTINED
     - Insufficient evidence telemetry assigns ON_HOLD
  3. Audit query API endpoints:
     - GET /telemetry/quarantine (lists quarantined items, supports device_id and batch_id query filters)
     - GET /telemetry/audit/{event_hash} (retrieves audit history, 404 on unknown hash)
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.anomaly import AnomalyResult
from app.schemas.integrity import IntegrityResult
from app.schemas.telemetry import TelemetryPayload
from app.schemas.verdict import VerdictResult
from app.services.anomaly_detector import anomaly_detector
from app.services.audit import AuditService, audit_service
from app.services.history import history_repository
from app.services.integrity import replay_repository


client = TestClient(app)


def _make_payload(
    device_id: str = "DEV-001",
    batch_id: str = "BATCH-001",
    timestamp_str: str = "2026-03-29T10:00:00Z",
    temperature: float = 4.0,
    humidity: float = 85.0,
    latitude: float = 18.5204,
    longitude: float = 73.8567,
) -> TelemetryPayload:
    return TelemetryPayload(
        device_id=device_id,
        batch_id=batch_id,
        timestamp=datetime.fromisoformat(timestamp_str),
        temperature=temperature,
        humidity=humidity,
        latitude=latitude,
        longitude=longitude,
    )


@pytest.fixture(autouse=True)
def reset_repositories():
    """Reset all in-memory state before each test to guarantee isolation."""
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


# ===========================================================================
# 1. AuditService Unit Tests
# ===========================================================================

def test_audit_service_valid_to_ready_for_oracle():
    service = AuditService()
    payload = _make_payload()
    verdict = VerdictResult(verdict="VALID", reason_codes=[])
    integrity = IntegrityResult(
        status="VALID",
        replay_detected=False,
        authenticated=True,
        event_hash="hash-1234",
    )
    anomaly = AnomalyResult(
        is_anomaly=False,
        anomaly_score=0.15,
        status="NORMAL",
        model_trained=True,
    )

    record = service.record_audit(
        payload=payload,
        verdict=verdict,
        integrity=integrity,
        anomaly=anomaly,
    )

    assert record.disposition == "READY_FOR_ORACLE"
    assert record.verdict == "VALID"
    assert record.event_hash == "hash-1234"
    assert record.anomaly_score == 0.15
    assert record.reason_codes == []
    assert "ready for blockchain Oracle" in record.details
    assert len(service.get_all_records()) == 1


def test_audit_service_anomalous_to_quarantined_with_reasons():
    service = AuditService()
    payload = _make_payload()
    verdict = VerdictResult(
        verdict="ANOMALOUS",
        reason_codes=["REPLAY_DETECTED", "ML_ANOMALY"],
    )
    integrity = IntegrityResult(
        status="REPLAY_DETECTED",
        replay_detected=True,
        authenticated=True,
        event_hash="hash-5678",
    )
    anomaly = AnomalyResult(
        is_anomaly=True,
        anomaly_score=-0.42,
        status="ANOMALOUS",
        model_trained=True,
    )

    record = service.record_audit(
        payload=payload,
        verdict=verdict,
        integrity=integrity,
        anomaly=anomaly,
    )

    assert record.disposition == "QUARANTINED"
    assert record.verdict == "ANOMALOUS"
    assert record.event_hash == "hash-5678"
    assert record.anomaly_score == -0.42
    assert record.reason_codes == ["REPLAY_DETECTED", "ML_ANOMALY"]
    assert "quarantined" in record.details.lower()
    assert "REPLAY_DETECTED" in record.details


def test_audit_service_insufficient_evidence_to_on_hold():
    service = AuditService()
    payload = _make_payload()
    verdict = VerdictResult(
        verdict="INSUFFICIENT_EVIDENCE",
        reason_codes=[],
    )
    integrity = IntegrityResult(
        status="VALID",
        replay_detected=False,
        authenticated=True,
        event_hash="hash-9999",
    )
    anomaly = AnomalyResult(
        is_anomaly=False,
        anomaly_score=None,
        status="MODEL_NOT_TRAINED",
        model_trained=False,
    )

    record = service.record_audit(
        payload=payload,
        verdict=verdict,
        integrity=integrity,
        anomaly=anomaly,
    )

    assert record.disposition == "ON_HOLD"
    assert record.verdict == "INSUFFICIENT_EVIDENCE"
    assert record.event_hash == "hash-9999"
    assert record.anomaly_score is None
    assert record.reason_codes == []
    assert "on hold" in record.details.lower()


def test_audit_service_preserves_anomalous_telemetry_never_deleted():
    service = AuditService()
    payload = _make_payload()
    verdict = VerdictResult(verdict="ANOMALOUS", reason_codes=["TEMPERATURE_RATE_EXCEEDED"])
    integrity = IntegrityResult(
        status="VALID",
        replay_detected=False,
        authenticated=True,
        event_hash="hash-anom-1",
    )

    service.record_audit(payload=payload, verdict=verdict, integrity=integrity)

    # Telemetry is stored and retrievable, not discarded
    quarantined = service.get_quarantined_records()
    assert len(quarantined) == 1
    assert quarantined[0].event_hash == "hash-anom-1"
    assert quarantined[0].disposition == "QUARANTINED"
    assert len(service.get_all_records()) == 1


def test_audit_service_append_only_history_for_same_event_hash():
    service = AuditService()
    payload = _make_payload()
    integrity = IntegrityResult(
        status="VALID",
        replay_detected=False,
        authenticated=True,
        event_hash="hash-repeat",
    )

    # First attempt: INSUFFICIENT_EVIDENCE
    v1 = VerdictResult(verdict="INSUFFICIENT_EVIDENCE", reason_codes=[])
    service.record_audit(payload=payload, verdict=v1, integrity=integrity)

    # Second attempt (e.g. after replay): ANOMALOUS
    v2 = VerdictResult(verdict="ANOMALOUS", reason_codes=["REPLAY_DETECTED"])
    service.record_audit(payload=payload, verdict=v2, integrity=integrity)

    history = service.get_by_event_hash("hash-repeat")
    assert len(history) == 2
    assert history[0].disposition == "ON_HOLD"
    assert history[1].disposition == "QUARANTINED"
    assert history[0].audit_id != history[1].audit_id


def test_audit_service_filtering():
    service = AuditService()

    # Create 3 records across 2 devices and 2 batches
    p1 = _make_payload(device_id="DEV-A", batch_id="BATCH-1")
    p2 = _make_payload(device_id="DEV-A", batch_id="BATCH-2")
    p3 = _make_payload(device_id="DEV-B", batch_id="BATCH-1")

    v_anom = VerdictResult(verdict="ANOMALOUS", reason_codes=["GPS_SPEED_EXCEEDED"])
    v_val = VerdictResult(verdict="VALID", reason_codes=[])

    int_dummy = IntegrityResult(
        status="VALID",
        replay_detected=False,
        authenticated=True,
        event_hash="h1",
    )

    service.record_audit(payload=p1, verdict=v_anom, integrity=int_dummy)
    service.record_audit(payload=p2, verdict=v_anom, integrity=int_dummy)
    service.record_audit(payload=p3, verdict=v_val, integrity=int_dummy)

    # All quarantined records
    assert len(service.get_quarantined_records()) == 2

    # Quarantined filtered by device
    assert len(service.get_quarantined_records(device_id="DEV-A")) == 2
    assert len(service.get_quarantined_records(device_id="DEV-B")) == 0

    # Quarantined filtered by batch
    assert len(service.get_quarantined_records(batch_id="BATCH-1")) == 1
    assert len(service.get_quarantined_records(device_id="DEV-A", batch_id="BATCH-2")) == 1

    # Filter by disposition
    assert len(service.get_records_by_disposition("READY_FOR_ORACLE")) == 1
    assert len(service.get_records_by_disposition("QUARANTINED")) == 2
    assert len(service.get_records_by_disposition("ON_HOLD")) == 0

    # Filter by device and batch
    assert len(service.get_by_device_and_batch("DEV-A")) == 2
    assert len(service.get_by_device_and_batch("DEV-A", "BATCH-1")) == 1


# ===========================================================================
# 2. Ingest Telemetry API Integration Tests
# ===========================================================================

def test_ingest_telemetry_returns_audit_block_when_valid(trained_detector):
    p1 = {
        "device_id": "DEV-001",
        "batch_id": "BATCH-001",
        "timestamp": "2026-03-29T10:00:00Z",
        "temperature": 4.0,
        "humidity": 85.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    resp1 = client.post("/telemetry", json=p1)
    assert resp1.status_code == 200

    p2 = {
        "device_id": "DEV-001",
        "batch_id": "BATCH-001",
        "timestamp": "2026-03-29T10:01:00Z",
        "temperature": 4.1,
        "humidity": 85.1,
        "latitude": 18.5205,
        "longitude": 73.8568,
    }
    resp2 = client.post("/telemetry", json=p2)
    assert resp2.status_code == 200
    data2 = resp2.json()

    assert "audit" in data2
    audit = data2["audit"]
    assert audit["verdict"] == "VALID"
    assert audit["disposition"] == "READY_FOR_ORACLE"
    assert audit["device_id"] == "DEV-001"
    assert audit["batch_id"] == "BATCH-001"
    assert len(audit["event_hash"]) == 64
    assert audit["reason_codes"] == []
    assert audit["anomaly_score"] is not None


def test_ingest_telemetry_returns_audit_block_when_quarantined_on_replay(trained_detector):
    payload = {
        "device_id": "DEV-001",
        "batch_id": "BATCH-001",
        "timestamp": "2026-03-29T10:00:00Z",
        "temperature": 4.0,
        "humidity": 85.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    # First submission
    resp1 = client.post("/telemetry", json=payload)
    assert resp1.status_code == 200

    # Replay submission (identical payload)
    resp2 = client.post("/telemetry", json=payload)
    assert resp2.status_code == 200
    data2 = resp2.json()

    assert "audit" in data2
    audit = data2["audit"]
    assert audit["verdict"] == "ANOMALOUS"
    assert audit["disposition"] == "QUARANTINED"
    assert "REPLAY_DETECTED" in audit["reason_codes"]
    assert "quarantined" in audit["details"].lower()


def test_ingest_telemetry_returns_audit_block_when_on_hold_untrained():
    payload = {
        "device_id": "DEV-001",
        "batch_id": "BATCH-001",
        "timestamp": "2026-03-29T10:00:00Z",
        "temperature": 4.0,
        "humidity": 85.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    resp = client.post("/telemetry", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "audit" in data
    audit = data["audit"]
    assert audit["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert audit["disposition"] == "ON_HOLD"
    assert audit["reason_codes"] == []
    assert "hold" in audit["details"].lower()


# ===========================================================================
# 3. Quarantine & Audit Query API Endpoints
# ===========================================================================

def test_get_quarantine_endpoint(trained_detector):
    # Send reading 1
    client.post(
        "/telemetry",
        json={
            "device_id": "DEV-001",
            "batch_id": "BATCH-001",
            "timestamp": "2026-03-29T10:00:00Z",
            "temperature": 4.0,
            "humidity": 85.0,
            "latitude": 18.5204,
            "longitude": 73.8567,
        },
    )
    # Send reading 2 with impossible speed jump -> ANOMALOUS -> QUARANTINED
    client.post(
        "/telemetry",
        json={
            "device_id": "DEV-001",
            "batch_id": "BATCH-001",
            "timestamp": "2026-03-29T10:01:00Z",
            "temperature": 4.0,
            "humidity": 85.0,
            "latitude": 28.5204,  # ~1100 km away in 1 min
            "longitude": 73.8567,
        },
    )

    # Query quarantine endpoint
    resp = client.get("/telemetry/quarantine")
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 1
    assert len(data["quarantined_records"]) == 1
    rec = data["quarantined_records"][0]
    assert rec["disposition"] == "QUARANTINED"
    assert "GPS_SPEED_EXCEEDED" in rec["reason_codes"]

    # Filter matching device
    resp_filtered = client.get("/telemetry/quarantine?device_id=DEV-001")
    assert resp_filtered.status_code == 200
    assert resp_filtered.json()["count"] == 1

    # Filter non-matching device
    resp_empty = client.get("/telemetry/quarantine?device_id=DEV-999")
    assert resp_empty.status_code == 200
    assert resp_empty.json()["count"] == 0


def test_get_audit_by_hash_endpoint(trained_detector):
    payload = {
        "device_id": "DEV-001",
        "batch_id": "BATCH-001",
        "timestamp": "2026-03-29T10:00:00Z",
        "temperature": 4.0,
        "humidity": 85.0,
        "latitude": 18.5204,
        "longitude": 73.8567,
    }
    resp = client.post("/telemetry", json=payload)
    data = resp.json()
    event_hash = data["integrity"]["event_hash"]

    # Query by event hash
    audit_resp = client.get(f"/telemetry/audit/{event_hash}")
    assert audit_resp.status_code == 200
    audit_data = audit_resp.json()
    assert audit_data["event_hash"] == event_hash
    assert audit_data["count"] == 1
    assert audit_data["records"][0]["event_hash"] == event_hash


def test_get_audit_by_hash_not_found():
    resp = client.get("/telemetry/audit/nonexistenthash1234567890abcdef")
    assert resp.status_code == 404
    assert "No audit records found" in resp.json()["detail"]
