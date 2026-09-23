"""
tests/test_integrity.py
------------------------
Phase 6 tests for Telemetry Integrity, Fingerprinting, Replay Detection & Device Authentication.

HOW TO RUN
----------
From the project root directory:

    pytest tests/ -v

COVERED TEST CASES (Section 14):
  1. Identical payloads produce identical SHA-256 fingerprints.
  2. Changing any field changes the fingerprint.
  3. Canonicalization is deterministic regardless of formatting or dictionary ordering.
  4. First event submission is not a replay (replay_detected = False, status = VALID).
  5. Re-submitting identical payload triggers REPLAY_DETECTED (replay_detected = True).
  6. Submitting a new distinct payload for same device/batch does not trigger replay.
  7. Device isolation: identical sensor values across different devices do not trigger false replay.
  8. Batch isolation: identical sensor values across different batches do not trigger false replay.
  9. Out-of-sequence timestamp produces TIMESTAMP_OUT_OF_SEQUENCE.
 10. Valid chronological timestamp progression passes integrity check.
 11. Device authentication interface handles unauthenticated devices gracefully.
 12. End-to-end POST /telemetry response includes structured integrity evidence.
"""

from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas.telemetry import TelemetryPayload
from app.services.anomaly_detector import anomaly_detector
from app.services.history import history_repository
from app.services.integrity import (
    DeviceAuthenticator,
    canonicalize_telemetry,
    compute_event_hash,
    replay_repository,
    verify_telemetry_integrity,
)

client = TestClient(app)

BASE_TIME = datetime(2026, 9, 21, 10, 0, 0, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def clean_all_stores():
    """Ensure history, replay, and anomaly detector stores are cleared before and after each test."""
    history_repository.clear()
    replay_repository.clear()
    anomaly_detector.clear_model()
    yield
    history_repository.clear()
    replay_repository.clear()
    anomaly_detector.clear_model()


def make_payload(
    device_id: str = "DEV-001",
    batch_id: str = "BATCH-001",
    latitude: float = 18.5204,
    longitude: float = 73.8567,
    temperature: float = 4.0,
    humidity: float = 80.0,
    timestamp: datetime = BASE_TIME,
) -> TelemetryPayload:
    return TelemetryPayload(
        batch_id=batch_id,
        device_id=device_id,
        latitude=latitude,
        longitude=longitude,
        temperature=temperature,
        humidity=humidity,
        timestamp=timestamp,
    )


# ===========================================================================
# 1. Canonicalization & Fingerprinting Tests
# ===========================================================================

class TestCanonicalizationAndFingerprint:
    def test_identical_payloads_produce_same_hash(self):
        """Two identical payload instances produce the exact same SHA-256 fingerprint."""
        p1 = make_payload()
        p2 = make_payload()

        hash1 = compute_event_hash(p1)
        hash2 = compute_event_hash(p2)

        assert hash1 == hash2
        assert len(hash1) == 64  # Standard SHA-256 hexadecimal string

    def test_changing_any_field_changes_fingerprint(self):
        """Modifying any field (temperature, humidity, lat, lon, time) alters the fingerprint."""
        base_hash = compute_event_hash(make_payload())

        assert compute_event_hash(make_payload(temperature=4.1)) != base_hash
        assert compute_event_hash(make_payload(humidity=80.1)) != base_hash
        assert compute_event_hash(make_payload(latitude=18.5205)) != base_hash
        assert compute_event_hash(make_payload(longitude=73.8568)) != base_hash
        assert compute_event_hash(make_payload(device_id="DEV-002")) != base_hash
        assert compute_event_hash(make_payload(batch_id="BATCH-002")) != base_hash
        assert (
            compute_event_hash(make_payload(timestamp=BASE_TIME + timedelta(seconds=1)))
            != base_hash
        )

    def test_canonicalization_is_deterministic(self):
        """Canonical string contains sorted keys without extra whitespace."""
        p = make_payload()
        canonical = canonicalize_telemetry(p)

        assert '"batch_id":"BATCH-001"' in canonical
        assert '"device_id":"DEV-001"' in canonical
        assert '"temperature":4.0' in canonical
        assert '"humidity":80.0' in canonical
        # Keys should be sorted alphabetically
        keys_in_order = ["batch_id", "device_id", "humidity", "latitude", "longitude", "temperature", "timestamp"]
        pos = 0
        for k in keys_in_order:
            new_pos = canonical.find(f'"{k}"')
            assert new_pos >= pos
            pos = new_pos


# ===========================================================================
# 2. Replay Detection Tests
# ===========================================================================

class TestReplayDetection:
    def test_first_event_is_not_replay(self):
        """Initial event submission passes integrity with replay_detected=False."""
        p = make_payload()
        res = verify_telemetry_integrity(p)

        assert res.status == "VALID"
        assert res.replay_detected is False
        reasons = [c.reason_code for c in res.checks]
        assert "INTEGRITY_VALID" in reasons

    def test_exact_duplicate_payload_flags_replay_detected(self):
        """Submitting the exact same event twice triggers REPLAY_DETECTED on second attempt."""
        p = make_payload()
        res1 = verify_telemetry_integrity(p)
        assert res1.replay_detected is False

        # Submit exact same payload again
        res2 = verify_telemetry_integrity(p)
        assert res2.status == "REPLAY_DETECTED"
        assert res2.replay_detected is True
        reasons = [c.reason_code for c in res2.checks]
        assert "REPLAY_DETECTED" in reasons

    def test_subsequent_distinct_event_passes(self):
        """Subsequent distinct event in forward sequence is not flagged as a replay."""
        p1 = make_payload(timestamp=BASE_TIME)
        verify_telemetry_integrity(p1)

        p2 = make_payload(
            temperature=4.5,
            timestamp=BASE_TIME + timedelta(minutes=1),
        )
        res2 = verify_telemetry_integrity(p2)
        assert res2.status == "VALID"
        assert res2.replay_detected is False

    def test_device_isolation_no_false_replay(self):
        """Same reading on DEV-001 does not flag replay for DEV-002."""
        p1 = make_payload(device_id="DEV-001")
        verify_telemetry_integrity(p1)

        p2 = make_payload(device_id="DEV-002")
        res2 = verify_telemetry_integrity(p2)
        assert res2.status == "VALID"
        assert res2.replay_detected is False

    def test_batch_isolation_no_false_replay(self):
        """Same reading on BATCH-001 does not flag replay for BATCH-002."""
        p1 = make_payload(batch_id="BATCH-001")
        verify_telemetry_integrity(p1)

        p2 = make_payload(batch_id="BATCH-002")
        res2 = verify_telemetry_integrity(p2)
        assert res2.status == "VALID"
        assert res2.replay_detected is False


# ===========================================================================
# 3. Timestamp Sequence & Authentication Tests
# ===========================================================================

class TestTimestampSequenceAndAuthentication:
    def test_out_of_sequence_timestamp_flags_suspicious(self):
        """Submitting an event with timestamp earlier than the latest accepted event flags TIMESTAMP_OUT_OF_SEQUENCE."""
        p1 = make_payload(timestamp=BASE_TIME + timedelta(minutes=5))
        verify_telemetry_integrity(p1)

        # Older event submitted later
        p2 = make_payload(
            temperature=5.0,  # Distinct payload so not an identical hash replay
            timestamp=BASE_TIME + timedelta(minutes=2),
        )
        res2 = verify_telemetry_integrity(p2)
        assert res2.status == "SUSPICIOUS"
        assert res2.replay_detected is False
        reasons = [c.reason_code for c in res2.checks]
        assert "TIMESTAMP_OUT_OF_SEQUENCE" in reasons

    def test_mock_unauthenticated_device_flags_unauthenticated(self):
        """Custom authenticator returning False produces UNAUTHENTICATED_DEVICE."""
        class RejectAuthenticator(DeviceAuthenticator):
            def authenticate(self, payload, signature=None) -> bool:
                return False

        p = make_payload()
        res = verify_telemetry_integrity(p, authenticator=RejectAuthenticator())

        assert res.status == "SUSPICIOUS"
        assert res.authenticated is False
        reasons = [c.reason_code for c in res.checks]
        assert "UNAUTHENTICATED_DEVICE" in reasons


# ===========================================================================
# 4. API End-to-End Integration Tests
# ===========================================================================

class TestAPIIntegrityIntegration:
    def test_api_returns_structured_integrity_evidence(self):
        """POST /telemetry includes complete integrity block in response."""
        payload = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 80.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        res = client.post("/telemetry", json=payload)
        assert res.status_code == 200
        body = res.json()

        assert "integrity" in body
        integrity = body["integrity"]
        assert integrity["status"] == "VALID"
        assert integrity["replay_detected"] is False
        assert len(integrity["event_hash"]) == 64
        assert integrity["authenticated"] is True
        assert len(integrity["checks"]) >= 3

    def test_api_detects_replay_on_second_identical_call(self):
        """Sending the exact same JSON payload twice returns replay_detected=True on 2nd response."""
        payload = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 80.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        res1 = client.post("/telemetry", json=payload)
        assert res1.status_code == 200
        assert res1.json()["integrity"]["replay_detected"] is False

        # Resend exact duplicate
        res2 = client.post("/telemetry", json=payload)
        assert res2.status_code == 200
        body2 = res2.json()
        assert body2["integrity"]["status"] == "REPLAY_DETECTED"
        assert body2["integrity"]["replay_detected"] is True
