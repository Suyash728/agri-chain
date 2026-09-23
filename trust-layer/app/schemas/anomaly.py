"""
app/schemas/anomaly.py
----------------------
Pydantic models for Phase 5 Machine Learning Anomaly Detection results.

PURPOSE
-------
Represents the outcome of the unsupervised Isolation Forest anomaly detector.

STATUS CODES
------------
- NORMAL: Model classified sample as expected in-distribution reading (prediction = 1).
- ANOMALOUS: Model flagged sample as out-of-distribution anomaly (prediction = -1).
- INSUFFICIENT_FEATURES: Missing historical context (e.g. first reading) prevents full feature generation.
- MODEL_NOT_TRAINED: Isolation Forest model has not yet been fitted with baseline data.

NOTE ON SCORING
---------------
`anomaly_score` is the raw `decision_function()` score from scikit-learn's Isolation Forest.
Positive scores represent normal inliers; negative scores represent isolated outliers.
It is NOT a probability.
"""

from typing import Optional
from pydantic import BaseModel, Field


class AnomalyResult(BaseModel):
    """
    Structured output of the Isolation Forest ML anomaly detection layer.
    """

    status: str = Field(
        ...,
        description="Detection status: 'NORMAL', 'ANOMALOUS', 'INSUFFICIENT_FEATURES', or 'MODEL_NOT_TRAINED'.",
    )
    prediction: Optional[int] = Field(
        None,
        description="Raw Isolation Forest prediction: 1 for inlier (normal), -1 for outlier (anomaly), None if unpredicted.",
    )
    anomaly_score: Optional[float] = Field(
        None,
        description="Raw decision_function score from Isolation Forest (positive = normal, negative = anomalous).",
    )
    model: str = Field(
        default="IsolationForest",
        description="Name of the ML model used for detection.",
    )
    details: Optional[str] = Field(
        None,
        description="Explanatory details or context regarding the ML evaluation.",
    )
