"""
app/schemas/evaluation.py
-------------------------
Pydantic schemas for Phase 11 — AI Trust Layer Evaluation & Performance Measurement.

PURPOSE
-------
Defines structured schemas for configuring and reporting performance evaluation
experiments, classification metrics (TP, TN, FP, FN, Precision, Recall, F1, FPR),
fault-wise detection breakdowns, confusion matrices, and latency measurements.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.simulation import FaultType


class EvaluationConfig(BaseModel):
    """
    Configuration for an evaluation benchmark run.
    """

    random_seed: int = Field(
        default=42,
        description="Random seed for deterministic, reproducible simulation.",
    )
    sequences_per_fault: int = Field(
        default=5,
        ge=1,
        le=100,
        description="Number of sequence trials to generate per fault category.",
    )
    sequence_length: int = Field(
        default=5,
        ge=2,
        le=50,
        description="Number of telemetry readings in each sequence trial.",
    )
    train_baseline_model: bool = Field(
        default=True,
        description="Whether to fit the Isolation Forest on normal baseline data prior to evaluation.",
    )
    fault_types: List[FaultType] = Field(
        default_factory=lambda: [
            FaultType.TEMPERATURE_SPIKE,
            FaultType.HUMIDITY_SPIKE,
            FaultType.GPS_JUMP,
            FaultType.TIMESTAMP_OUT_OF_ORDER,
            FaultType.REPLAY,
            FaultType.TELEMETRY_GAP,
            FaultType.COMBINED,
        ],
        description="List of fault types to evaluate against.",
    )


class FaultWiseResult(BaseModel):
    """
    Performance breakdown for an individual telemetry scenario (Normal or specific fault).
    """

    fault_type: str = Field(..., description="Name of the scenario / fault type.")
    total_cases: int = Field(..., description="Total sequence trials evaluated.")
    detected_anomalous: int = Field(..., description="Number of cases yielding ANOMALOUS verdict.")
    accepted_valid: int = Field(..., description="Number of cases yielding VALID verdict.")
    insufficient_evidence: int = Field(..., description="Number of cases yielding INSUFFICIENT_EVIDENCE verdict.")
    detection_rate: float = Field(
        ...,
        description="Proportion of cases correctly detected (for faults: anomalous/total; for normal: valid/total).",
    )


class ConfusionMatrix(BaseModel):
    """
    2x2 Confusion matrix for binary decisions (Normal vs. Anomalous).
    INSUFFICIENT_EVIDENCE cases are explicitly separated and not forced into binary classes.
    """

    tp: int = Field(..., description="True Positives: Faulty telemetry correctly flagged as ANOMALOUS.")
    tn: int = Field(..., description="True Negatives: Normal telemetry correctly approved as VALID.")
    fp: int = Field(..., description="False Positives: Normal telemetry falsely flagged as ANOMALOUS.")
    fn: int = Field(..., description="False Negatives: Faulty telemetry falsely approved as VALID.")
    insufficient_evidence: int = Field(
        ...,
        description="Cases where evaluation could not reach a definitive binary verdict.",
    )
    matrix: List[List[int]] = Field(
        ...,
        description="2x2 numeric representation: [[TN, FP], [FN, TP]].",
    )


class EvaluationMetrics(BaseModel):
    """
    Overall classification performance metrics.
    """

    total_cases: int = Field(..., description="Total sequence trials evaluated.")
    total_normal_cases: int = Field(..., description="Total ground-truth normal sequences.")
    total_faulty_cases: int = Field(..., description="Total ground-truth faulty sequences.")

    tp: int = Field(..., description="True Positives.")
    tn: int = Field(..., description="True Negatives.")
    fp: int = Field(..., description="False Positives.")
    fn: int = Field(..., description="False Negatives.")

    precision: float = Field(..., description="Precision = TP / (TP + FP).")
    recall: float = Field(..., description="Recall / Detection Rate = TP / (TP + FN).")
    f1_score: float = Field(..., description="F1-score = 2 * P * R / (P + R).")
    false_positive_rate: float = Field(..., description="False Positive Rate = FP / (FP + TN).")

    insufficient_evidence_count: int = Field(
        ...,
        description="Number of trials resulting in INSUFFICIENT_EVIDENCE.",
    )
    insufficient_evidence_rate: float = Field(
        ...,
        description="Proportion of trials resulting in INSUFFICIENT_EVIDENCE.",
    )
    mean_latency_ms: Optional[float] = Field(
        None,
        description="Average measured processing latency per reading in milliseconds.",
    )


class EvaluationReport(BaseModel):
    """
    Comprehensive evaluation report summarizing pipeline benchmark performance.
    """

    config: EvaluationConfig = Field(..., description="Configuration used for the benchmark run.")
    metrics: EvaluationMetrics = Field(..., description="Calculated performance metrics.")
    confusion_matrix: ConfusionMatrix = Field(..., description="Binary confusion matrix.")
    fault_wise_results: List[FaultWiseResult] = Field(..., description="Fault-wise breakdown table.")
    generated_figures: List[str] = Field(
        default_factory=list,
        description="Filepaths of generated visualization plots.",
    )
    scientific_notes: str = Field(
        ...,
        description="Scientific caveats, scope of simulation, and real-world considerations.",
    )
