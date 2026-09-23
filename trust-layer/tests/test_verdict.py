"""
tests/test_verdict.py
---------------------
Phase 7 tests for Trust/Verdict Engine.

HOW TO RUN
----------
From the project root directory:

    pytest tests/ -v

COVERED TEST CASES (Section 16):
  1. All evidence passes (Plausibility + ML Normal + Integrity Valid) -> VALID.
  2. Replay detected -> ANOMALOUS with reason REPLAY_DETECTED.
  3. Integrity sequence failure + normal telemetry -> ANOMALOUS.
  4. GPS speed failure -> ANOMALOUS with reason GPS_SPEED_EXCEEDED.
  5. Temperature-rate failure -> ANOMALOUS with reason TEMPERATURE_RATE_EXCEEDED.
  6. Humidity-rate failure -> ANOMALOUS with reason HUMIDITY_RATE_EXCEEDED.
  7. Timestamp failure -> ANOMALOUS with reason TIMESTAMP_OUT_OF_ORDER.
  8. ML NORMAL + all valid -> VALID.
  9. ML ANOMALOUS -> ANOMALOUS with reason ML_ANOMALY.
 10. ML unavailable (MODEL_NOT_TRAINED or INSUFFICIENT_FEATURES) -> INSUFFICIENT_EVIDENCE.
 11. Combined failures (ML anomaly + GPS failure) -> both reason codes preserved.
 12. Triple failures (Replay + ML anomaly + plausibility failure) -> all reasons preserved without duplicates in deterministic order.
 13. End-to-end POST /telemetry response includes structured final verdict.
"""

from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas.anomaly import AnomalyResult
from app.schemas.integrity import IntegrityCheckResult, IntegrityResult
from app.schemas.plausibility import PlausibilityCheckResult, PlausibilityResult
from app.services.anomaly_detector import anomaly_detector
from app.services.history import history_repository
from app.services.integrity import replay_repository
from app.services.verdict import evaluate_verdict

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


def mock_valid_plausibility():
    return PlausibilityResult(
        plausible=True,
        checks=[
            PlausibilityCheckResult(name="gps_speed_check", passed=True, details="OK"),
            PlausibilityCheckResult(name="temperature_rate_check", passed=True, details="OK"),
            PlausibilityCheckResult(name="humidity_rate_check", passed=True, details="OK"),
        ],
    )


def mock_valid_ml():
    return AnomalyResult(
        status="NORMAL",
        prediction=1,
        anomaly_score=0.15,
        model="IsolationForest",
        details="Inlier",
    )


def mock_valid_integrity():
    return IntegrityResult(
        status="VALID",
        event_hash="a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
        replay_detected=False,
        authenticated=True,
        checks=[
            IntegrityCheckResult(name="event_fingerprint", passed=True, reason_code="INTEGRITY_VALID"),
            IntegrityCheckResult(name="replay_detection", passed=True, reason_code="INTEGRITY_VALID"),
            IntegrityCheckResult(name="timestamp_sequence", passed=True, reason_code="INTEGRITY_VALID"),
        ],
    )


# ===========================================================================
# 1. Valid Cases & ML Availability
# ===========================================================================

class TestValidAndMLAvailabilityVerdicts:
    def test_all_evidence_passes_yields_valid_verdict(self):
        """When plausibility is True, ML is NORMAL, and integrity is VALID -> verdict is VALID."""
        plaus = mock_valid_plausibility()
        ml = mock_valid_ml()
        integ = mock_valid_integrity()

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "VALID"
        assert len(verdict.reason_codes) == 0
        assert "passed successfully" in verdict.details

    def test_ml_untrained_yields_insufficient_evidence(self):
        """When plausibility and integrity pass, but ML is MODEL_NOT_TRAINED -> INSUFFICIENT_EVIDENCE."""
        plaus = mock_valid_plausibility()
        ml = AnomalyResult(status="MODEL_NOT_TRAINED", prediction=None, anomaly_score=None)
        integ = mock_valid_integrity()

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "INSUFFICIENT_EVIDENCE"
        assert len(verdict.reason_codes) == 0
        assert "MODEL_NOT_TRAINED" in verdict.details

    def test_ml_insufficient_features_yields_insufficient_evidence(self):
        """When first reading has INSUFFICIENT_FEATURES -> INSUFFICIENT_EVIDENCE (not false VALID)."""
        plaus = mock_valid_plausibility()
        ml = AnomalyResult(status="INSUFFICIENT_FEATURES", prediction=None, anomaly_score=None)
        integ = mock_valid_integrity()

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "INSUFFICIENT_EVIDENCE"
        assert len(verdict.reason_codes) == 0


# ===========================================================================
# 2. Individual Evidence Failure Cases
# ===========================================================================

class TestIndividualEvidenceFailures:
    def test_replay_detected_yields_anomalous_verdict(self):
        """Replay detected must result in ANOMALOUS verdict with REPLAY_DETECTED reason code."""
        plaus = mock_valid_plausibility()
        ml = mock_valid_ml()
        integ = IntegrityResult(
            status="REPLAY_DETECTED",
            event_hash="abcdef123456",
            replay_detected=True,
            authenticated=True,
            checks=[
                IntegrityCheckResult(name="replay_detection", passed=False, reason_code="REPLAY_DETECTED")
            ],
        )

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "ANOMALOUS"
        assert "REPLAY_DETECTED" in verdict.reason_codes

    def test_integrity_sequence_failure_yields_anomalous(self):
        """Timestamp sequence failure results in ANOMALOUS."""
        plaus = mock_valid_plausibility()
        ml = mock_valid_ml()
        integ = IntegrityResult(
            status="SUSPICIOUS",
            event_hash="abcdef123456",
            replay_detected=False,
            authenticated=True,
            checks=[
                IntegrityCheckResult(
                    name="timestamp_sequence",
                    passed=False,
                    reason_code="TIMESTAMP_OUT_OF_SEQUENCE",
                )
            ],
        )

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "ANOMALOUS"
        assert "TIMESTAMP_OUT_OF_SEQUENCE" in verdict.reason_codes

    def test_gps_speed_failure_yields_anomalous(self):
        """Plausibility GPS speed failure results in ANOMALOUS with GPS_SPEED_EXCEEDED."""
        plaus = PlausibilityResult(
            plausible=False,
            checks=[
                PlausibilityCheckResult(
                    name="gps_speed_check",
                    passed=False,
                    reason_code="GPS_SPEED_EXCEEDED",
                    details="Speed too high",
                )
            ],
        )
        ml = mock_valid_ml()
        integ = mock_valid_integrity()

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "ANOMALOUS"
        assert "GPS_SPEED_EXCEEDED" in verdict.reason_codes

    def test_temperature_rate_failure_yields_anomalous(self):
        """Plausibility temp rate failure results in ANOMALOUS with TEMPERATURE_RATE_EXCEEDED."""
        plaus = PlausibilityResult(
            plausible=False,
            checks=[
                PlausibilityCheckResult(
                    name="temperature_rate_check",
                    passed=False,
                    reason_code="TEMPERATURE_RATE_EXCEEDED",
                )
            ],
        )
        verdict = evaluate_verdict(plaus, mock_valid_ml(), mock_valid_integrity())

        assert verdict.verdict == "ANOMALOUS"
        assert "TEMPERATURE_RATE_EXCEEDED" in verdict.reason_codes

    def test_humidity_rate_failure_yields_anomalous(self):
        """Plausibility humidity rate failure results in ANOMALOUS with HUMIDITY_RATE_EXCEEDED."""
        plaus = PlausibilityResult(
            plausible=False,
            checks=[
                PlausibilityCheckResult(
                    name="humidity_rate_check",
                    passed=False,
                    reason_code="HUMIDITY_RATE_EXCEEDED",
                )
            ],
        )
        verdict = evaluate_verdict(plaus, mock_valid_ml(), mock_valid_integrity())

        assert verdict.verdict == "ANOMALOUS"
        assert "HUMIDITY_RATE_EXCEEDED" in verdict.reason_codes

    def test_timestamp_out_of_order_failure_yields_anomalous(self):
        """Plausibility timestamp out of order results in ANOMALOUS with TIMESTAMP_OUT_OF_ORDER."""
        plaus = PlausibilityResult(
            plausible=False,
            checks=[
                PlausibilityCheckResult(
                    name="timestamp_chronology_check",
                    passed=False,
                    reason_code="TIMESTAMP_OUT_OF_ORDER",
                )
            ],
        )
        verdict = evaluate_verdict(plaus, mock_valid_ml(), mock_valid_integrity())

        assert verdict.verdict == "ANOMALOUS"
        assert "TIMESTAMP_OUT_OF_ORDER" in verdict.reason_codes

    def test_ml_anomaly_yields_anomalous_with_ml_anomaly_reason(self):
        """Isolation Forest predicting ANOMALOUS (-1) results in ANOMALOUS verdict with ML_ANOMALY code."""
        plaus = mock_valid_plausibility()
        ml = AnomalyResult(
            status="ANOMALOUS",
            prediction=-1,
            anomaly_score=-0.25,
            model="IsolationForest",
        )
        integ = mock_valid_integrity()

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "ANOMALOUS"
        assert "ML_ANOMALY" in verdict.reason_codes


# ===========================================================================
# 3. Combined Multiple Failures & Deterministic Ordering
# ===========================================================================

class TestCombinedFailures:
    def test_combined_gps_and_ml_failure_preserves_both_reasons(self):
        """Both GPS_SPEED_EXCEEDED and ML_ANOMALY are preserved when both fail."""
        plaus = PlausibilityResult(
            plausible=False,
            checks=[
                PlausibilityCheckResult(
                    name="gps_speed_check",
                    passed=False,
                    reason_code="GPS_SPEED_EXCEEDED",
                )
            ],
        )
        ml = AnomalyResult(status="ANOMALOUS", prediction=-1, anomaly_score=-0.2)
        integ = mock_valid_integrity()

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "ANOMALOUS"
        assert verdict.reason_codes == ["GPS_SPEED_EXCEEDED", "ML_ANOMALY"]

    def test_triple_failure_deterministic_order_and_deduplication(self):
        """Integrity + Plausibility + ML failures are ordered deterministically without duplicates."""
        integ = IntegrityResult(
            status="REPLAY_DETECTED",
            event_hash="hash123",
            replay_detected=True,
            authenticated=True,
            checks=[
                IntegrityCheckResult(name="replay_detection", passed=False, reason_code="REPLAY_DETECTED"),
                IntegrityCheckResult(name="replay_detection", passed=False, reason_code="REPLAY_DETECTED"),  # Duplicate
            ],
        )
        plaus = PlausibilityResult(
            plausible=False,
            checks=[
                PlausibilityCheckResult(name="gps_speed_check", passed=False, reason_code="GPS_SPEED_EXCEEDED"),
                PlausibilityCheckResult(name="temp_check", passed=False, reason_code="TEMPERATURE_RATE_EXCEEDED"),
            ],
        )
        ml = AnomalyResult(status="ANOMALOUS", prediction=-1, anomaly_score=-0.3)

        verdict = evaluate_verdict(plaus, ml, integ)

        assert verdict.verdict == "ANOMALOUS"
        # Order must be: 1. Integrity -> 2. Plausibility -> 3. ML
        assert verdict.reason_codes == [
            "REPLAY_DETECTED",
            "GPS_SPEED_EXCEEDED",
            "TEMPERATURE_RATE_EXCEEDED",
            "ML_ANOMALY",
        ]


# ===========================================================================
# 4. API End-to-End Verdict Integration
# ===========================================================================

class TestAPIVerdictIntegration:
    def test_api_returns_verdict_block(self):
        """POST /telemetry includes the 'verdict' block in the response."""
        p = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 80.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        res = client.post("/telemetry", json=p)
        assert res.status_code == 200
        body = res.json()

        assert "verdict" in body
        verdict = body["verdict"]
        # First reading has INSUFFICIENT_FEATURES for ML -> verdict is INSUFFICIENT_EVIDENCE
        assert verdict["verdict"] == "INSUFFICIENT_EVIDENCE"
        assert isinstance(verdict["reason_codes"], list)

    def test_api_verdict_on_replay_is_anomalous(self):
        """Submitting duplicate telemetry yields ANOMALOUS verdict with REPLAY_DETECTED."""
        p = {
            "batch_id": "BATCH-001",
            "device_id": "DEV-001",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 80.0,
            "timestamp": BASE_TIME.isoformat(),
        }
        client.post("/telemetry", json=p)

        # Resend exact duplicate
        res2 = client.post("/telemetry", json=p)
        assert res2.status_code == 200
        body2 = res2.json()

        assert body2["verdict"]["verdict"] == "ANOMALOUS"
        assert "REPLAY_DETECTED" in body2["verdict"]["reason_codes"]
