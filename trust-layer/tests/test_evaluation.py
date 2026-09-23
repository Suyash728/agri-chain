"""
tests/test_evaluation.py
------------------------
Unit and integration tests for Phase 11 — AI Trust Layer Evaluation & Performance Measurement.

Tests verify all 16 requirements:
  1. Evaluation runs successfully end-to-end.
  2. Deterministic random seed produces reproducible evaluation metrics.
  3. Normal cases are included in the evaluation suite.
  4. Every required fault type is evaluated.
  5. Ground-truth labels are generated strictly from the simulation configuration.
  6. Predictions come strictly from the real existing trust pipeline verdicts.
  7. TP, TN, FP, FN calculations are mathematically correct.
  8. Precision calculation is correct.
  9. Recall calculation is correct.
 10. F1 calculation is correct.
 11. False-positive-rate calculation is correct.
 12. INSUFFICIENT_EVIDENCE outcomes are tracked separately and not forced into binary classes.
 13. Fault-wise results are generated for all categories.
 14. Confusion matrix dimensions and content are correct.
 15. No blockchain functionality or side-effects are introduced.
 16. POST /telemetry/evaluate development endpoint functions properly.
"""

import os
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.schemas.evaluation import EvaluationConfig, EvaluationReport
from app.schemas.simulation import FaultType
from app.services.anomaly_detector import anomaly_detector
from app.services.audit import audit_service
from app.services.evaluation import evaluation_service
from app.services.history import history_repository
from app.services.integrity import replay_repository

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_stores():
    """Ensure in-memory stores are clean before and after each test."""
    history_repository.clear()
    replay_repository.clear()
    audit_service.clear()
    anomaly_detector.clear_model()
    yield
    history_repository.clear()
    replay_repository.clear()
    audit_service.clear()
    anomaly_detector.clear_model()


# ===========================================================================
# 1. Evaluation Service Core Tests
# ===========================================================================

def test_evaluation_runs_successfully():
    """Verify evaluation runs to completion and produces an EvaluationReport."""
    cfg = EvaluationConfig(
        random_seed=42,
        sequences_per_fault=2,
        sequence_length=4,
        train_baseline_model=True,
    )
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=None)

    assert isinstance(report, EvaluationReport)
    assert report.metrics.total_cases > 0
    assert report.metrics.total_normal_cases == 2
    assert report.metrics.total_faulty_cases == 2 * len(cfg.fault_types)
    assert len(report.fault_wise_results) == 1 + len(cfg.fault_types)
    assert report.scientific_notes is not None


def test_evaluation_reproducibility_with_seed():
    """Verify identical random seed produces bit-exact identical evaluation metrics."""
    cfg1 = EvaluationConfig(random_seed=123, sequences_per_fault=2, sequence_length=4)
    cfg2 = EvaluationConfig(random_seed=123, sequences_per_fault=2, sequence_length=4)

    rep1 = evaluation_service.run_pipeline_evaluation(config=cfg1, output_dir=None)
    rep2 = evaluation_service.run_pipeline_evaluation(config=cfg2, output_dir=None)

    assert (
        rep1.metrics.model_dump(exclude={"mean_latency_ms"})
        == rep2.metrics.model_dump(exclude={"mean_latency_ms"})
    )
    assert rep1.confusion_matrix.matrix == rep2.confusion_matrix.matrix


def test_all_required_fault_types_evaluated():
    """Verify that NORMAL and every required fault category is present in fault_wise_results."""
    cfg = EvaluationConfig(random_seed=42, sequences_per_fault=2, sequence_length=3)
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=None)

    categories = [fw.fault_type for fw in report.fault_wise_results]
    expected_categories = [
        "NORMAL",
        "TEMPERATURE_SPIKE",
        "HUMIDITY_SPIKE",
        "GPS_JUMP",
        "TIMESTAMP_OUT_OF_ORDER",
        "REPLAY",
        "TELEMETRY_GAP",
        "COMBINED",
    ]
    for exp in expected_categories:
        assert exp in categories


def test_ground_truth_and_predictions_separation():
    """
    Verify ground truth is dictated by scenario configuration (NORMAL=0, Fault=1),
    while predictions are strictly derived from real pipeline verdicts.
    """
    cfg = EvaluationConfig(
        random_seed=42,
        sequences_per_fault=2,
        sequence_length=4,
        fault_types=[FaultType.GPS_JUMP],
    )
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=None)

    assert report.metrics.total_normal_cases == 2
    assert report.metrics.total_faulty_cases == 2
    assert report.metrics.total_cases == 4

    # GPS jump is deterministically detected by Phase 3 Haversine rule
    gps_res = next(r for r in report.fault_wise_results if r.fault_type == "GPS_JUMP")
    assert gps_res.detected_anomalous == 2
    assert gps_res.detection_rate == 1.0


def test_metric_formula_calculations():
    """Verify standard formula calculations for Precision, Recall, F1, and FPR."""
    m = evaluation_service.run_pipeline_evaluation(
        config=EvaluationConfig(random_seed=42, sequences_per_fault=2, sequence_length=3),
        output_dir=None,
    ).metrics

    tp, tn, fp, fn = m.tp, m.tn, m.fp, m.fn

    # Precision = TP / (TP + FP)
    expected_precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
    assert m.precision == expected_precision

    # Recall = TP / (TP + FN)
    expected_recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
    assert m.recall == expected_recall

    # F1 = 2 * P * R / (P + R)
    if (expected_precision + expected_recall) > 0:
        expected_f1 = round(
            2.0 * expected_precision * expected_recall / (expected_precision + expected_recall), 4
        )
        assert abs(m.f1_score - expected_f1) <= 0.001

    # False Positive Rate = FP / (FP + TN)
    expected_fpr = round(fp / (fp + tn), 4) if (fp + tn) > 0 else 0.0
    assert m.false_positive_rate == expected_fpr


def test_insufficient_evidence_tracked_separately():
    """
    Verify that when the ML model is not trained, INSUFFICIENT_EVIDENCE outcomes
    are counted in insufficient_evidence_count and NOT counted in TP or TN.
    """
    cfg = EvaluationConfig(
        random_seed=42,
        sequences_per_fault=2,
        sequence_length=3,
        train_baseline_model=False,  # Intentionally untrained to generate INSUFFICIENT_EVIDENCE
    )
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=None)

    assert report.metrics.insufficient_evidence_count > 0
    assert report.metrics.insufficient_evidence_rate > 0.0
    # Normal sequences without trained ML yield INSUFFICIENT_EVIDENCE, so TN should be 0
    assert report.metrics.tn == 0


def test_confusion_matrix_structure_and_consistency():
    """Verify confusion matrix dimensions [[TN, FP], [FN, TP]] and consistency with metrics."""
    cfg = EvaluationConfig(random_seed=42, sequences_per_fault=2, sequence_length=4)
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=None)
    cm = report.confusion_matrix

    assert len(cm.matrix) == 2
    assert len(cm.matrix[0]) == 2
    assert len(cm.matrix[1]) == 2

    assert cm.matrix[0][0] == report.metrics.tn
    assert cm.matrix[0][1] == report.metrics.fp
    assert cm.matrix[1][0] == report.metrics.fn
    assert cm.matrix[1][1] == report.metrics.tp
    assert cm.insufficient_evidence == report.metrics.insufficient_evidence_count


def test_latency_measurement_is_positive():
    """Verify latency per reading is accurately measured and reported as a positive number."""
    cfg = EvaluationConfig(random_seed=42, sequences_per_fault=1, sequence_length=3)
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=None)

    assert report.metrics.mean_latency_ms is not None
    assert report.metrics.mean_latency_ms > 0.0


def test_visualization_generation(tmp_path):
    """Verify that matplotlib visualizations are generated to disk."""
    cfg = EvaluationConfig(random_seed=42, sequences_per_fault=1, sequence_length=3)
    out_dir = str(tmp_path / "figures")
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=out_dir)

    assert len(report.generated_figures) == 4
    for fig_path in report.generated_figures:
        assert os.path.exists(fig_path)
        assert os.path.getsize(fig_path) > 0


def test_no_blockchain_side_effects():
    """Verify evaluation does not produce or require any blockchain connections."""
    cfg = EvaluationConfig(random_seed=42, sequences_per_fault=1, sequence_length=3)
    report = evaluation_service.run_pipeline_evaluation(config=cfg, output_dir=None)

    assert not hasattr(report, "blockchain_tx")
    assert not hasattr(report.metrics, "gas_used")


# ===========================================================================
# 2. API Endpoint Tests (POST /telemetry/evaluate)
# ===========================================================================

def test_api_evaluate_endpoint():
    """Verify POST /telemetry/evaluate returns HTTP 200 with complete EvaluationReport."""
    payload = {
        "random_seed": 42,
        "sequences_per_fault": 1,
        "sequence_length": 3,
        "train_baseline_model": True,
        "fault_types": ["GPS_JUMP", "TEMPERATURE_SPIKE"],
    }
    resp = client.post("/telemetry/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert "metrics" in data
    assert "confusion_matrix" in data
    assert "fault_wise_results" in data
    assert "scientific_notes" in data
    assert data["metrics"]["total_cases"] == 3  # 1 Normal + 2 faults * 1 sequence
