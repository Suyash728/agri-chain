"""
tests/test_plausibility.py
--------------------------
Phase 3 tests for the Physical & Temporal Plausibility pipeline layer.

HOW TO RUN
----------
From the project root directory:

    pytest tests/ -v

COVERED TEST CASES (Section 11):
  1. Normal consecutive GPS readings            -> passes
  2. Unrealistic GPS movement                   -> GPS_SPEED_EXCEEDED
  3. Normal temperature change                  -> passes
  4. Sudden unrealistic temperature change      -> TEMPERATURE_RATE_EXCEEDED
  5. Normal humidity change                     -> passes
  6. Sudden unrealistic humidity change         -> HUMIDITY_RATE_EXCEEDED
  7. Correct chronological timestamps           -> passes
  8. Current timestamp earlier than previous    -> TIMESTAMP_OUT_OF_ORDER
  9. Duplicate timestamp                        -> DUPLICATE_TIMESTAMP
 10. Excessive telemetry gap                    -> TELEMETRY_GAP_EXCEEDED
 11. First-ever reading for a device            -> passes (no prior history error)
 12. Two different devices                      -> histories isolated
 13. Two different batches/devices               -> unrelated histories isolated
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.services.history import history_repository

client = TestClient(app)

BASE_TIME = datetime(2026, 9, 21, 10, 0, 0, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def clear_history():
    """Ensure history is cleared before each test for complete isolation."""
    history_repository.clear()
    yield
    history_repository.clear()


def make_payload(
    device_id: str = "DEV-001",
    batch_id: str = "BATCH-001",
    latitude: float = 18.5204,
    longitude: float = 73.8567,
    temperature: float = 4.0,
    humidity: float = 80.0,
    timestamp: datetime = BASE_TIME,
) -> dict:
    return {
        "batch_id": batch_id,
        "device_id": device_id,
        "latitude": latitude,
        "longitude": longitude,
        "temperature": temperature,
        "humidity": humidity,
        "timestamp": timestamp.isoformat(),
    }


def post_telemetry(payload: dict):
    return client.post("/telemetry", json=payload)


# ===========================================================================
# Scenario 1 & 11: First-ever reading and normal consecutive readings
# ===========================================================================

class TestGPSPlausibility:
    def test_first_ever_reading_passes(self):
        """First reading for a device should pass without error."""
        payload = make_payload()
        res = post_telemetry(payload)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is True

    def test_normal_consecutive_gps_readings_pass(self):
        """Normal movement (e.g., 5 km in 10 minutes = 30 km/h) passes."""
        p1 = make_payload(latitude=18.5204, longitude=73.8567, timestamp=BASE_TIME)
        post_telemetry(p1)

        # ~5 km shift in 10 minutes
        p2 = make_payload(
            latitude=18.5600,
            longitude=73.8567,
            timestamp=BASE_TIME + timedelta(minutes=10),
        )
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is True

    def test_unrealistic_gps_movement_flags_gps_speed_exceeded(self):
        """Unrealistic GPS jump (e.g., 500 km in 2 minutes = 15000 km/h) flags GPS_SPEED_EXCEEDED."""
        p1 = make_payload(latitude=18.5204, longitude=73.8567, timestamp=BASE_TIME)
        post_telemetry(p1)

        # Huge coordinate jump in 2 minutes
        p2 = make_payload(
            latitude=28.6139,
            longitude=77.2090,
            timestamp=BASE_TIME + timedelta(minutes=2),
        )
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is False
        reasons = [
            c["reason_code"]
            for c in body["plausibility"]["checks"]
            if c.get("reason_code")
        ]
        assert "GPS_SPEED_EXCEEDED" in reasons


# ===========================================================================
# Scenarios 3 & 4: Temperature Plausibility
# ===========================================================================

class TestTemperaturePlausibility:
    def test_normal_temperature_change_passes(self):
        """Small temp change (e.g., +0.5°C over 10 minutes = 0.05°C/min) passes."""
        p1 = make_payload(temperature=4.0, timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(
            temperature=4.5, timestamp=BASE_TIME + timedelta(minutes=10)
        )
        res = post_telemetry(p2)
        assert res.status_code == 200
        assert res.json()["plausibility"]["plausible"] is True

    def test_sudden_unrealistic_temperature_change_flags_temp_rate_exceeded(self):
        """Sudden temp jump (e.g., +15°C over 1 minute = 15°C/min) flags TEMPERATURE_RATE_EXCEEDED."""
        p1 = make_payload(temperature=4.0, timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(
            temperature=19.0, timestamp=BASE_TIME + timedelta(minutes=1)
        )
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is False
        reasons = [
            c["reason_code"]
            for c in body["plausibility"]["checks"]
            if c.get("reason_code")
        ]
        assert "TEMPERATURE_RATE_EXCEEDED" in reasons


# ===========================================================================
# Scenarios 5 & 6: Humidity Plausibility
# ===========================================================================

class TestHumidityPlausibility:
    def test_normal_humidity_change_passes(self):
        """Gradual humidity change (e.g., +2% over 10 minutes = 0.2%/min) passes."""
        p1 = make_payload(humidity=80.0, timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(humidity=82.0, timestamp=BASE_TIME + timedelta(minutes=10))
        res = post_telemetry(p2)
        assert res.status_code == 200
        assert res.json()["plausibility"]["plausible"] is True

    def test_sudden_unrealistic_humidity_change_flags_humidity_rate_exceeded(self):
        """Sudden humidity drop (e.g., -40% over 1 minute = 40%/min) flags HUMIDITY_RATE_EXCEEDED."""
        p1 = make_payload(humidity=80.0, timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(humidity=40.0, timestamp=BASE_TIME + timedelta(minutes=1))
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is False
        reasons = [
            c["reason_code"]
            for c in body["plausibility"]["checks"]
            if c.get("reason_code")
        ]
        assert "HUMIDITY_RATE_EXCEEDED" in reasons


# ===========================================================================
# Scenarios 7, 8, 9, 10: Timestamp Consistency
# ===========================================================================

class TestTimestampConsistency:
    def test_chronological_timestamps_pass(self):
        """Normal forward timestamps pass."""
        p1 = make_payload(timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(timestamp=BASE_TIME + timedelta(minutes=5))
        res = post_telemetry(p2)
        assert res.status_code == 200
        assert res.json()["plausibility"]["plausible"] is True

    def test_timestamp_out_of_order_flags_reason(self):
        """Current timestamp earlier than previous flags TIMESTAMP_OUT_OF_ORDER."""
        p1 = make_payload(timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(timestamp=BASE_TIME - timedelta(minutes=5))
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is False
        reasons = [
            c["reason_code"]
            for c in body["plausibility"]["checks"]
            if c.get("reason_code")
        ]
        assert "TIMESTAMP_OUT_OF_ORDER" in reasons

    def test_duplicate_timestamp_flags_reason(self):
        """Same timestamp twice for the same device flags DUPLICATE_TIMESTAMP."""
        p1 = make_payload(timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(timestamp=BASE_TIME)
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is False
        reasons = [
            c["reason_code"]
            for c in body["plausibility"]["checks"]
            if c.get("reason_code")
        ]
        assert "DUPLICATE_TIMESTAMP" in reasons

    def test_excessive_telemetry_gap_flags_reason(self):
        """Gap of 2 hours (> max 3600s default) flags TELEMETRY_GAP_EXCEEDED."""
        p1 = make_payload(timestamp=BASE_TIME)
        post_telemetry(p1)

        p2 = make_payload(timestamp=BASE_TIME + timedelta(hours=2))
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is False
        reasons = [
            c["reason_code"]
            for c in body["plausibility"]["checks"]
            if c.get("reason_code")
        ]
        assert "TELEMETRY_GAP_EXCEEDED" in reasons


# ===========================================================================
# Scenarios 12 & 13: History Isolation across Devices & Batches
# ===========================================================================

class TestHistoryIsolation:
    def test_two_different_devices_do_not_mix_history(self):
        """
        Device DEV-001 has reading at Pune.
        Device DEV-002 has reading at Delhi 5 minutes later.
        DEV-002 should NOT be compared against DEV-001 (which would falsely trigger GPS speed exceeded).
        """
        # DEV-001 in Pune
        p1 = make_payload(
            device_id="DEV-001",
            latitude=18.5204,
            longitude=73.8567,
            timestamp=BASE_TIME,
        )
        post_telemetry(p1)

        # DEV-002 in Delhi 5 minutes later
        p2 = make_payload(
            device_id="DEV-002",
            latitude=28.6139,
            longitude=77.2090,
            timestamp=BASE_TIME + timedelta(minutes=5),
        )
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        # DEV-002 is the first reading for DEV-002, so plausibility must be True!
        assert body["plausibility"]["plausible"] is True

    def test_two_different_batches_same_device_do_not_mix_history(self):
        """
        Device DEV-001 on BATCH-001 at Pune.
        Device DEV-001 on BATCH-002 at Delhi 5 minutes later.
        The different batch should start fresh history and not flag GPS speed exceeded.
        """
        p1 = make_payload(
            device_id="DEV-001",
            batch_id="BATCH-001",
            latitude=18.5204,
            longitude=73.8567,
            timestamp=BASE_TIME,
        )
        post_telemetry(p1)

        p2 = make_payload(
            device_id="DEV-001",
            batch_id="BATCH-002",
            latitude=28.6139,
            longitude=77.2090,
            timestamp=BASE_TIME + timedelta(minutes=5),
        )
        res = post_telemetry(p2)
        assert res.status_code == 200
        body = res.json()
        assert body["plausibility"]["plausible"] is True
