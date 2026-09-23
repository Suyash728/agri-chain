"""
tests/test_features.py
-----------------------
Phase 4 tests for Telemetry History & Time-Series Feature Engineering.

HOW TO RUN
----------
From the project root directory:

    pytest tests/ -v

COVERED TEST CASES (Section 12):
  1. First reading produces raw features and no fabricated derived values (None).
  2. Normal consecutive readings produce correct temperature change (°C).
  3. Correct temperature rate is calculated (°C/min).
  4. Correct humidity change is calculated (%).
  5. Correct humidity rate is calculated (%/min).
  6. Correct GPS distance is calculated (km).
  7. Correct implied speed is calculated (km/h).
  8. Correct elapsed-time feature is calculated (seconds).
  9. Zero elapsed time does not cause division-by-zero (returns None for rates/speed).
 10. Device histories remain isolated.
 11. Batch histories remain isolated.
 12. End-to-end API response includes the structured features block.
"""

import pytest
import math
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.telemetry import TelemetryPayload
from app.services.features import extract_features
from app.services.history import history_repository

client = TestClient(app)

BASE_TIME = datetime(2026, 9, 21, 10, 0, 0, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def clear_history():
    """Ensure history repository is cleared before and after each test."""
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
# 1. First Reading Behavior
# ===========================================================================

class TestFirstReadingFeatures:
    def test_first_reading_has_null_derived_features(self):
        """First reading must populate raw values and leave derived features as None."""
        payload = make_payload(
            temperature=5.2,
            humidity=78.5,
            latitude=18.5204,
            longitude=73.8567,
        )
        features = extract_features(current=payload, previous=None)

        assert features.temperature == 5.2
        assert features.humidity == 78.5
        assert features.latitude == 18.5204
        assert features.longitude == 73.8567

        # Derived features must be None, NOT 0.0
        assert features.temperature_change is None
        assert features.temperature_rate is None
        assert features.humidity_change is None
        assert features.humidity_rate is None
        assert features.distance_from_previous is None
        assert features.implied_speed is None
        assert features.time_since_previous is None

    def test_feature_vector_conversion_with_fill_na(self):
        """Test to_feature_vector converts features to a fixed-length numerical list."""
        payload = make_payload(temperature=5.0, humidity=80.0, latitude=18.0, longitude=73.0)
        features = extract_features(current=payload, previous=None)
        vector = features.to_feature_vector(fill_na=0.0)

        assert len(vector) == 11
        assert vector[0] == 5.0
        assert vector[1] == 80.0
        assert vector[2] == 18.0
        assert vector[3] == 73.0
        # Derived features replaced by fill_na
        assert vector[4:] == [0.0] * 7


# ===========================================================================
# 2, 3, 4, 5, 6, 7, 8: Consecutive Readings Feature Calculations
# ===========================================================================

class TestDerivedFeatureCalculations:
    def test_temperature_change_and_rate(self):
        """
        Previous: 4.0 °C at 10:00:00
        Current:  6.0 °C at 10:02:00 (120 seconds = 2.0 minutes)
        Change:   +2.0 °C
        Rate:     (2.0 / 120) * 60 = 1.0 °C/min
        """
        p1 = make_payload(temperature=4.0, timestamp=BASE_TIME)
        p2 = make_payload(temperature=6.0, timestamp=BASE_TIME + timedelta(minutes=2))

        features = extract_features(current=p2, previous=p1)

        assert features.temperature_change == pytest.approx(2.0, rel=1e-3)
        assert features.temperature_rate == pytest.approx(1.0, rel=1e-3)

    def test_negative_temperature_rate(self):
        """
        Previous: 6.0 °C at 10:00:00
        Current:  3.0 °C at 10:01:00 (60 seconds = 1.0 minute)
        Change:   -3.0 °C
        Rate:     -3.0 °C/min
        """
        p1 = make_payload(temperature=6.0, timestamp=BASE_TIME)
        p2 = make_payload(temperature=3.0, timestamp=BASE_TIME + timedelta(minutes=1))

        features = extract_features(current=p2, previous=p1)

        assert features.temperature_change == pytest.approx(-3.0, rel=1e-3)
        assert features.temperature_rate == pytest.approx(-3.0, rel=1e-3)

    def test_humidity_change_and_rate(self):
        """
        Previous: 80.0 % at 10:00:00
        Current:  85.0 % at 10:05:00 (300 seconds = 5.0 minutes)
        Change:   +5.0 %
        Rate:     (5.0 / 300) * 60 = 1.0 %/min
        """
        p1 = make_payload(humidity=80.0, timestamp=BASE_TIME)
        p2 = make_payload(humidity=85.0, timestamp=BASE_TIME + timedelta(minutes=5))

        features = extract_features(current=p2, previous=p1)

        assert features.humidity_change == pytest.approx(5.0, rel=1e-3)
        assert features.humidity_rate == pytest.approx(1.0, rel=1e-3)

    def test_gps_distance_implied_speed_and_elapsed_time(self):
        """
        Previous: (18.5204, 73.8567) at 10:00:00
        Current:  (18.5600, 73.8567) at 10:06:00 (360 seconds = 0.1 hours)
        Distance: ~4.40 km
        Speed:    ~44.0 km/h
        Elapsed:  360.0 s
        """
        p1 = make_payload(latitude=18.5204, longitude=73.8567, timestamp=BASE_TIME)
        p2 = make_payload(
            latitude=18.5600,
            longitude=73.8567,
            timestamp=BASE_TIME + timedelta(minutes=6),
        )

        features = extract_features(current=p2, previous=p1)

        assert features.time_since_previous == pytest.approx(360.0, rel=1e-2)
        assert features.distance_from_previous == pytest.approx(4.40, abs=0.1)
        assert features.implied_speed == pytest.approx(44.0, abs=1.0)


# ===========================================================================
# 9. Numerical Safety & Edge Cases
# ===========================================================================

class TestNumericalSafety:
    def test_zero_elapsed_time_no_division_by_zero(self):
        """When timestamps are identical (elapsed = 0), rates and speed must be None."""
        p1 = make_payload(temperature=4.0, humidity=80.0, timestamp=BASE_TIME)
        p2 = make_payload(temperature=5.0, humidity=82.0, timestamp=BASE_TIME)

        features = extract_features(current=p2, previous=p1)

        assert features.time_since_previous == 0.0
        assert features.temperature_change == pytest.approx(1.0, rel=1e-3)
        assert features.humidity_change == pytest.approx(2.0, rel=1e-3)
        # Rates and speed must safely be None
        assert features.temperature_rate is None
        assert features.humidity_rate is None
        assert features.implied_speed is None

    def test_negative_elapsed_time_no_division_by_zero(self):
        """When timestamp is out of order, rates and speed must safely be None."""
        p1 = make_payload(temperature=4.0, timestamp=BASE_TIME)
        p2 = make_payload(temperature=5.0, timestamp=BASE_TIME - timedelta(minutes=5))

        features = extract_features(current=p2, previous=p1)

        assert features.time_since_previous == -300.0
        assert features.temperature_rate is None
        assert features.humidity_rate is None
        assert features.implied_speed is None


# ===========================================================================
# 10 & 11. History Isolation
# ===========================================================================

class TestHistoryIsolationFeatures:
    def test_device_histories_remain_isolated(self):
        """
        Post reading for DEV-001.
        Then post reading for DEV-002.
        DEV-002 must have None for derived features (it has no prior history).
        """
        payload1 = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 80.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        res1 = client.post("/telemetry", json=payload1)
        assert res1.status_code == 200

        payload2 = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-002",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "temperature": 22.0,
            "humidity": 50.0,
            "timestamp": (BASE_TIME + timedelta(minutes=5)).isoformat(),
        }
        res2 = client.post("/telemetry", json=payload2)
        assert res2.status_code == 200
        body2 = res2.json()

        # DEV-002 is first reading for DEV-002, so derived features must be None
        feat = body2["features"]
        assert feat["temperature_change"] is None
        assert feat["distance_from_previous"] is None

    def test_batch_histories_remain_isolated(self):
        """
        Post reading for DEV-001 under BATCH-001.
        Then post reading for DEV-001 under BATCH-002.
        BATCH-002 must have None for derived features.
        """
        payload1 = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 80.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        client.post("/telemetry", json=payload1)

        payload2 = {
            "batch_id": "BATCH-002",
            "device_id": "DEV-001",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "temperature": 22.0,
            "humidity": 50.0,
            "timestamp": (BASE_TIME + timedelta(minutes=5)).isoformat(),
        }
        res2 = client.post("/telemetry", json=payload2)
        assert res2.status_code == 200
        body2 = res2.json()

        feat = body2["features"]
        assert feat["temperature_change"] is None
        assert feat["distance_from_previous"] is None


# ===========================================================================
# 12. API Integration Test
# ===========================================================================

class TestAPIResponseFeatures:
    def test_api_returns_structured_features_block(self):
        """End-to-end test confirming API returns validation, plausibility, and features."""
        # 1st reading
        p1 = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 80.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        res1 = client.post("/telemetry", json=p1)
        assert res1.status_code == 200
        body1 = res1.json()
        assert "features" in body1
        assert body1["features"]["temperature"] == 4.0
        assert body1["features"]["temperature_change"] is None

        # 2nd reading
        p2 = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.6,
            "humidity": 81.0,
            "timestamp": (BASE_TIME + timedelta(minutes=2)).isoformat(),
        }
        res2 = client.post("/telemetry", json=p2)
        assert res2.status_code == 200
        body2 = res2.json()

        assert "features" in body2
        feat2 = body2["features"]
        assert feat2["temperature"] == 4.6
        assert feat2["temperature_change"] == pytest.approx(0.6, rel=1e-3)
        assert feat2["temperature_rate"] == pytest.approx(0.3, rel=1e-3)
        assert feat2["humidity_change"] == pytest.approx(1.0, rel=1e-3)
        assert feat2["humidity_rate"] == pytest.approx(0.5, rel=1e-3)
        assert feat2["time_since_previous"] == 120.0
