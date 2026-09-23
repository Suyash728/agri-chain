"""
tests/test_policy.py
---------------------
Tests for dynamic CropPolicy binding and enforcement in the AI Trust Layer.
Verifies that crop-specific environmental limits (from SQLite or CropPolicy)
are enforced, quarantining violating telemetry while permitting compliant telemetry.
"""

from datetime import datetime, timezone, timedelta
import pytest
import sqlite3
import tempfile
import pathlib

from app.schemas.telemetry import TelemetryPayload
from app.schemas.policy import CropPolicy
from app.services.policy import get_crop_policy, DEFAULT_CONSERVATIVE_TOMATO_POLICY
from app.services.plausibility import run_plausibility_checks
from app.services.features import extract_features
from app.services.anomaly_detector import IsolationForestDetector
from app.services.integrity import verify_telemetry_integrity, replay_repository
from app.services.verdict import evaluate_verdict
from app.services.audit import AuditService

BASE_TIME = datetime(2026, 9, 23, 10, 0, 0, tzinfo=timezone.utc)


@pytest.fixture
def mock_db():
    """Create a temporary SQLite DB populated with batches and policy tables."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name

    conn = sqlite3.connect(db_path)
    conn.execute(
        """
        CREATE TABLE batches (
            batch_id TEXT PRIMARY KEY,
            crop_name TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE policy (
            crop_name TEXT PRIMARY KEY,
            min_temp_c REAL NOT NULL,
            max_temp_c REAL NOT NULL,
            min_humidity REAL NOT NULL,
            max_humidity REAL NOT NULL
        )
        """
    )
    conn.executemany(
        "INSERT INTO policy VALUES (?, ?, ?, ?, ?)",
        [
            ("tomato", 2.0, 8.0, 85.0, 95.0),
            ("wheat", 15.0, 25.0, 50.0, 70.0),
        ],
    )
    conn.executemany(
        "INSERT INTO batches VALUES (?, ?)",
        [
            ("BATCH-TOMATO-01", "tomato"),
            ("BATCH-WHEAT-01", "wheat"),
        ],
    )
    conn.commit()
    conn.close()

    yield db_path

    pathlib.Path(db_path).unlink(missing_ok=True)


class TestCropPolicyLookup:
    def test_unknown_batch_falls_back_to_conservative_tomato(self, mock_db):
        policy = get_crop_policy("NON-EXISTENT-BATCH", db_path=mock_db)
        assert policy.min_temp_c == 2.0
        assert policy.max_temp_c == 8.0
        assert policy.min_humidity == 85.0
        assert policy.max_humidity == 95.0

    def test_tomato_batch_policy_lookup(self, mock_db):
        policy = get_crop_policy("BATCH-TOMATO-01", db_path=mock_db)
        assert policy.crop_type == "tomato"
        assert policy.min_temp_c == 2.0
        assert policy.max_temp_c == 8.0

    def test_wheat_batch_policy_lookup(self, mock_db):
        policy = get_crop_policy("BATCH-WHEAT-01", db_path=mock_db)
        assert policy.crop_type == "wheat"
        assert policy.min_temp_c == 15.0
        assert policy.max_temp_c == 25.0
        assert policy.min_humidity == 50.0
        assert policy.max_humidity == 70.0


class TestCropPolicyValidation:
    def test_tomato_15c_quarantined_wheat_15c_ready_for_oracle(self, mock_db):
        """
        DONE WHEN criteria:
        A reading with 15.0°C for Tomato (max 8.0°C) evaluates to ANOMALOUS / QUARANTINED,
        while 15.0°C for Wheat (max 25.0°C) evaluates to VALID / READY_FOR_ORACLE.
        """
        tomato_policy = get_crop_policy("BATCH-TOMATO-01", db_path=mock_db)
        wheat_policy = get_crop_policy("BATCH-WHEAT-01", db_path=mock_db)

        # Train a dummy anomaly detector so ML passes (NORMAL)
        detector = IsolationForestDetector()
        training_samples = [
            [15.0, 60.0, 18.5, 73.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60.0]
            for _ in range(50)
        ]
        detector.fit(training_samples)

        audit_svc = AuditService(db_path=mock_db)

        # 1. Evaluate Tomato with 15.0°C (Breaches max 8.0°C)
        tomato_reading = TelemetryPayload(
            batch_id="BATCH-TOMATO-01",
            device_id="DEV-TOMATO-01",
            latitude=18.5204,
            longitude=73.8567,
            temperature=15.0,
            humidity=90.0,
            timestamp=BASE_TIME,
        )
        tomato_plausibility = run_plausibility_checks(current=tomato_reading, policy=tomato_policy)
        assert tomato_plausibility.plausible is False
        reasons = [c.reason_code for c in tomato_plausibility.checks if not c.passed]
        assert "TEMPERATURE_OUT_OF_POLICY" in reasons

        replay_repository.clear()
        features_tomato = extract_features(current=tomato_reading)
        anomaly_tomato = detector.predict_features(features_tomato)
        integrity_tomato = verify_telemetry_integrity(tomato_reading)
        verdict_tomato = evaluate_verdict(tomato_plausibility, anomaly_tomato, integrity_tomato)
        assert verdict_tomato.verdict == "ANOMALOUS"

        audit_tomato = audit_svc.record_audit(
            payload=tomato_reading,
            verdict=verdict_tomato,
            integrity=integrity_tomato,
            anomaly=anomaly_tomato,
        )
        assert audit_tomato.disposition == "QUARANTINED"
        assert "TEMPERATURE_OUT_OF_POLICY" in audit_tomato.reason_codes

        # 2. Evaluate Wheat with 15.0°C (Within [15.0, 25.0]°C and [50, 70]% humidity)
        prev_wheat = TelemetryPayload(
            batch_id="BATCH-WHEAT-01",
            device_id="DEV-WHEAT-01",
            latitude=18.5,
            longitude=73.8,
            temperature=15.0,
            humidity=60.0,
            timestamp=BASE_TIME - timedelta(minutes=1),
        )
        wheat_reading = TelemetryPayload(
            batch_id="BATCH-WHEAT-01",
            device_id="DEV-WHEAT-01",
            latitude=18.5,
            longitude=73.8,
            temperature=15.0,
            humidity=60.0,
            timestamp=BASE_TIME,
        )
        wheat_plausibility = run_plausibility_checks(current=wheat_reading, previous=prev_wheat, policy=wheat_policy)
        assert wheat_plausibility.plausible is True

        replay_repository.clear()
        features_wheat = extract_features(current=wheat_reading, previous=prev_wheat)
        anomaly_wheat = detector.predict_features(features_wheat)
        assert anomaly_wheat.status == "NORMAL"
        integrity_wheat = verify_telemetry_integrity(wheat_reading)
        verdict_wheat = evaluate_verdict(wheat_plausibility, anomaly_wheat, integrity_wheat)
        assert verdict_wheat.verdict == "VALID"

        audit_wheat = audit_svc.record_audit(
            payload=wheat_reading,
            verdict=verdict_wheat,
            integrity=integrity_wheat,
            anomaly=anomaly_wheat,
        )
        assert audit_wheat.disposition == "READY_FOR_ORACLE"
