"""
tests/test_anomaly.py
---------------------
Phase 5 tests for Isolation Forest ML Anomaly Detection.

HOW TO RUN
----------
From the project root directory:

    pytest tests/ -v

COVERED TEST CASES (Section 14):
  1. Isolation Forest initializes with expected hyperparameters.
  2. Model fits successfully with synthetic normal baseline data.
  3. Predicts NORMAL (1) for standard in-distribution samples.
  4. Predicts ANOMALOUS (-1) for clearly separated artificial anomalies.
  5. Generates raw decision_function anomaly score.
  6. Deterministic predictions across runs with fixed random_state.
  7. Prediction before training returns MODEL_NOT_TRAINED.
  8. Incomplete feature vector (e.g. first reading) returns INSUFFICIENT_FEATURES.
  9. None values are not silently fabricated into fake measurements.
 10. Empty or mismatched dimension training dataset raises error.
 11. End-to-end /telemetry flow functions gracefully when model is untrained.
 12. End-to-end /telemetry/train and /telemetry ingestion with trained model.
"""

import pytest
import numpy as np
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.features import TelemetryFeatures
from app.services.anomaly_detector import FEATURE_NAMES, IsolationForestDetector, anomaly_detector
from app.services.history import history_repository

client = TestClient(app)

BASE_TIME = datetime(2026, 9, 21, 10, 0, 0, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def clean_state():
    """Ensure history and anomaly detector model are cleared before and after each test."""
    history_repository.clear()
    anomaly_detector.clear_model()
    yield
    history_repository.clear()
    anomaly_detector.clear_model()


def generate_synthetic_normal_dataset(num_samples: int = 100, seed: int = 42) -> list:
    """
    Generate synthetic normal baseline feature vectors around cold-chain parameters:
    - temperature ~ 4.0 °C (+/- 1.0)
    - humidity ~ 85.0 % (+/- 3.0)
    - latitude ~ 18.52 (+/- 0.05)
    - longitude ~ 73.85 (+/- 0.05)
    - temp_change ~ 0.05 °C (+/- 0.05)
    - temp_rate ~ 0.02 °C/min (+/- 0.02)
    - humidity_change ~ 0.1 % (+/- 0.1)
    - humidity_rate ~ 0.05 %/min (+/- 0.05)
    - distance ~ 0.5 km (+/- 0.2)
    - speed ~ 30.0 km/h (+/- 10.0)
    - elapsed_time ~ 60.0 s (+/- 5.0)
    """
    rng = np.random.default_rng(seed)
    data = []
    for _ in range(num_samples):
        vec = [
            float(rng.normal(4.0, 0.5)),      # temperature
            float(rng.normal(85.0, 2.0)),     # humidity
            float(rng.normal(18.52, 0.02)),   # latitude
            float(rng.normal(73.85, 0.02)),   # longitude
            float(rng.normal(0.05, 0.02)),    # temperature_change
            float(rng.normal(0.02, 0.01)),    # temperature_rate
            float(rng.normal(0.1, 0.05)),     # humidity_change
            float(rng.normal(0.05, 0.02)),    # humidity_rate
            float(rng.normal(0.5, 0.1)),      # distance_from_previous
            float(rng.normal(30.0, 5.0)),     # implied_speed
            float(rng.normal(60.0, 2.0)),     # time_since_previous
        ]
        data.append(vec)
    return data


# ===========================================================================
# 1. Model Lifecycle & Initialization Tests
# ===========================================================================

class TestIsolationForestLifecycle:
    def test_initialization_and_hyperparameters(self):
        """Detector initializes with configured hyperparameters and untrained state."""
        detector = IsolationForestDetector(n_estimators=50, contamination=0.02, random_state=123)
        assert detector.is_trained() is False
        assert detector.n_estimators == 50
        assert detector.contamination == 0.02
        assert detector.random_state == 123

    def test_prediction_before_training_returns_model_not_trained(self):
        """Attempting to predict before fitting returns MODEL_NOT_TRAINED."""
        detector = IsolationForestDetector()
        vector = [4.0, 85.0, 18.52, 73.85, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60.0]
        res = detector.predict_vector(vector)
        assert res.status == "MODEL_NOT_TRAINED"
        assert res.prediction is None
        assert res.anomaly_score is None

    def test_empty_training_data_raises_error(self):
        """Fitting on empty dataset must raise ValueError."""
        detector = IsolationForestDetector()
        with pytest.raises(ValueError, match="cannot be empty"):
            detector.fit([])

    def test_invalid_dimension_training_data_raises_error(self):
        """Fitting on vectors with wrong dimension must raise ValueError."""
        detector = IsolationForestDetector()
        bad_matrix = [[1.0, 2.0, 3.0]]  # Only 3 elements instead of 11
        with pytest.raises(ValueError, match="must contain exactly 11 elements"):
            detector.fit(bad_matrix)


# ===========================================================================
# 2. Prediction, Anomaly Detection & Scoring
# ===========================================================================

class TestIsolationForestPredictions:
    def test_normal_baseline_sample_returns_normal(self):
        """A sample close to the center of normal baseline returns status NORMAL and prediction 1."""
        detector = IsolationForestDetector(random_state=42)
        training_data = generate_synthetic_normal_dataset(num_samples=100, seed=42)
        detector.fit(training_data)
        assert detector.is_trained() is True

        # Test normal sample from the same distribution
        normal_vec = [4.1, 84.8, 18.52, 73.85, 0.05, 0.02, 0.1, 0.05, 0.5, 30.0, 60.0]
        res = detector.predict_vector(normal_vec)

        assert res.status == "NORMAL"
        assert res.prediction == 1
        assert res.anomaly_score is not None
        assert res.anomaly_score > 0.0  # Inliers have positive decision_function score

    def test_clear_outlier_sample_returns_anomalous(self):
        """An extreme outlier sample far from the baseline returns ANOMALOUS and prediction -1."""
        detector = IsolationForestDetector(random_state=42)
        training_data = generate_synthetic_normal_dataset(num_samples=100, seed=42)
        detector.fit(training_data)

        # Extreme synthetic anomaly: massive temp rate, speed, and negative score
        anomaly_vec = [35.0, 15.0, 28.52, 77.85, 20.0, 15.0, -40.0, -30.0, 50.0, 300.0, 60.0]
        res = detector.predict_vector(anomaly_vec)

        assert res.status == "ANOMALOUS"
        assert res.prediction == -1
        assert res.anomaly_score is not None
        assert res.anomaly_score < 0.0  # Outliers have negative decision_function score

    def test_deterministic_predictions_with_fixed_seed(self):
        """Two detectors initialized with identical random_state produce identical scores."""
        training_data = generate_synthetic_normal_dataset(num_samples=80, seed=42)

        d1 = IsolationForestDetector(random_state=42)
        d1.fit(training_data)

        d2 = IsolationForestDetector(random_state=42)
        d2.fit(training_data)

        test_vec = [4.5, 83.0, 18.50, 73.80, 0.1, 0.05, 0.2, 0.1, 0.8, 35.0, 60.0]
        res1 = d1.predict_vector(test_vec)
        res2 = d2.predict_vector(test_vec)

        assert res1.prediction == res2.prediction
        assert res1.anomaly_score == res2.anomaly_score


# ===========================================================================
# 3. Handling Incomplete Features & First-Reading Semantics
# ===========================================================================

class TestFeatureCompletenessAndNulls:
    def test_incomplete_features_returns_insufficient_features(self):
        """A TelemetryFeatures object with None derived values returns INSUFFICIENT_FEATURES."""
        detector = IsolationForestDetector()
        training_data = generate_synthetic_normal_dataset(num_samples=50, seed=42)
        detector.fit(training_data)

        # First reading where derived features are None
        incomplete_features = TelemetryFeatures(
            temperature=4.0,
            humidity=85.0,
            latitude=18.5204,
            longitude=73.8567,
            temperature_change=None,
            temperature_rate=None,
            humidity_change=None,
            humidity_rate=None,
            distance_from_previous=None,
            implied_speed=None,
            time_since_previous=None,
        )

        res = detector.predict_features(incomplete_features)
        assert res.status == "INSUFFICIENT_FEATURES"
        assert res.prediction is None
        assert res.anomaly_score is None

    def test_complete_features_evaluates_successfully(self):
        """A complete TelemetryFeatures object evaluates to NORMAL or ANOMALOUS."""
        detector = IsolationForestDetector(random_state=42)
        training_data = generate_synthetic_normal_dataset(num_samples=50, seed=42)
        detector.fit(training_data)

        complete_features = TelemetryFeatures(
            temperature=4.1,
            humidity=85.1,
            latitude=18.5204,
            longitude=73.8567,
            temperature_change=0.05,
            temperature_rate=0.02,
            humidity_change=0.1,
            humidity_rate=0.05,
            distance_from_previous=0.5,
            implied_speed=30.0,
            time_since_previous=60.0,
        )

        res = detector.predict_features(complete_features)
        assert res.status == "NORMAL"
        assert res.prediction == 1


# ===========================================================================
# 4. API Integration & Training Endpoint Tests
# ===========================================================================

class TestAPIMLIntegration:
    def test_telemetry_flow_with_untrained_model(self):
        """POST /telemetry functions gracefully when the ML model has not been trained."""
        payload = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 85.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        res = client.post("/telemetry", json=payload)
        assert res.status_code == 200
        body = res.json()

        assert "anomaly_detection" in body
        # First reading has incomplete features, so status is INSUFFICIENT_FEATURES
        assert body["anomaly_detection"]["status"] == "INSUFFICIENT_FEATURES"

    def test_train_endpoint_and_subsequent_telemetry_prediction(self):
        """Test training via POST /telemetry/train and subsequent ML prediction via POST /telemetry."""
        # 1. Train the model via API
        training_data = generate_synthetic_normal_dataset(num_samples=60, seed=42)
        train_res = client.post("/telemetry/train", json={"feature_matrix": training_data})
        assert train_res.status_code == 200
        assert train_res.json()["status"] == "success"

        # 2. Ingest 1st telemetry (first reading -> INSUFFICIENT_FEATURES)
        p1 = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 85.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        res1 = client.post("/telemetry", json=p1)
        assert res1.status_code == 200
        assert res1.json()["anomaly_detection"]["status"] == "INSUFFICIENT_FEATURES"

        # 3. Ingest 2nd telemetry (normal transition -> complete features -> NORMAL ML prediction)
        p2 = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5250,
            "longitude": 73.8567,
            "temperature": 4.1,
            "humidity": 85.2,
            "timestamp": (BASE_TIME + timedelta(minutes=1)).isoformat(),
        }
        res2 = client.post("/telemetry", json=p2)
        assert res2.status_code == 200
        body2 = res2.json()

        assert body2["anomaly_detection"]["status"] == "NORMAL"
        assert body2["anomaly_detection"]["prediction"] == 1
        assert isinstance(body2["anomaly_detection"]["anomaly_score"], float)
