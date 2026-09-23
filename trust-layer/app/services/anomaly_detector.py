"""
app/services/anomaly_detector.py
--------------------------------
Phase 5 — Isolation Forest Machine Learning Anomaly Detection service.

WHAT THIS MODULE DOES
----------------------
Implements unsupervised anomaly detection using scikit-learn's Isolation Forest algorithm.
It evaluates Phase 4 dynamic feature vectors against a trained normal baseline.

FEATURE ORDER (11 Dimensions)
------------------------------
The feature vector order is strictly fixed and documented:
  1. temperature            (°C)
  2. humidity               (%)
  3. latitude               (degrees)
  4. longitude              (degrees)
  5. temperature_change     (°C)
  6. temperature_rate       (°C/min)
  7. humidity_change        (%)
  8. humidity_rate          (%/min)
  9. distance_from_previous (km)
 10. implied_speed          (km/h)
 11. time_since_previous    (seconds)

DESIGN DECISIONS
----------------
1. Explicit Preprocessing: When derived features are None (e.g. first reading),
   the detector returns an explicit `INSUFFICIENT_FEATURES` status rather than
   silently fabricating zeros or fake measurements.
2. Clear Model State: If the model has not been fitted, it returns `MODEL_NOT_TRAINED`
   instead of failing the request or returning false predictions.
3. Raw Scoring: Returns scikit-learn's `decision_function()` score (positive for normal,
   negative for anomalies) without fabricating pseudo-probabilities.
4. Separation of Concerns: Produces ML trust evidence; does NOT produce the final
   Verdict Engine decision (which belongs to a later phase).
"""

from typing import List, Optional
import numpy as np
from sklearn.ensemble import IsolationForest

from app.config import (
    IFOREST_CONTAMINATION,
    IFOREST_N_ESTIMATORS,
    IFOREST_RANDOM_STATE,
)
from app.schemas.anomaly import AnomalyResult
from app.schemas.features import TelemetryFeatures

FEATURE_NAMES: List[str] = [
    "temperature",
    "humidity",
    "latitude",
    "longitude",
    "temperature_change",
    "temperature_rate",
    "humidity_change",
    "humidity_rate",
    "distance_from_previous",
    "implied_speed",
    "time_since_previous",
]


class IsolationForestDetector:
    """
    Service encapsulating scikit-learn's IsolationForest for IoT telemetry.
    """

    def __init__(
        self,
        n_estimators: int = IFOREST_N_ESTIMATORS,
        contamination: float = IFOREST_CONTAMINATION,
        random_state: int = IFOREST_RANDOM_STATE,
    ) -> None:
        self.n_estimators = n_estimators
        self.contamination = contamination
        self.random_state = random_state
        self._model: Optional[IsolationForest] = None

    def is_trained(self) -> bool:
        """Check whether the Isolation Forest model has been fitted."""
        return self._model is not None

    def fit(self, feature_matrix: List[List[float]]) -> None:
        """
        Fit the Isolation Forest model on a matrix of normal baseline feature vectors.

        Parameters
        ----------
        feature_matrix : List[List[float]]
            A 2D array/list where each row is an 11-element feature vector.
        """
        if not feature_matrix or len(feature_matrix) == 0:
            raise ValueError("Training dataset cannot be empty.")

        for row in feature_matrix:
            if len(row) != len(FEATURE_NAMES):
                raise ValueError(
                    f"Each feature vector must contain exactly {len(FEATURE_NAMES)} elements. Got {len(row)}."
                )

        model = IsolationForest(
            n_estimators=self.n_estimators,
            contamination=self.contamination,
            random_state=self.random_state,
        )
        model.fit(feature_matrix)
        self._model = model

    def predict_vector(self, vector: List[float]) -> AnomalyResult:
        """
        Run anomaly prediction on a single 11-dimensional feature vector.

        Parameters
        ----------
        vector : List[float]
            11-element numerical feature list.

        Returns
        -------
        AnomalyResult
            Structured prediction result.
        """
        if not self.is_trained():
            return AnomalyResult(
                status="MODEL_NOT_TRAINED",
                prediction=None,
                anomaly_score=None,
                details="Isolation Forest model has not been trained yet. Train the model using a normal baseline dataset.",
            )

        if len(vector) != len(FEATURE_NAMES):
            return AnomalyResult(
                status="INSUFFICIENT_FEATURES",
                prediction=None,
                anomaly_score=None,
                details=f"Feature vector has length {len(vector)}, expected {len(FEATURE_NAMES)}.",
            )

        # Reshape for single-sample prediction
        x = np.array(vector, dtype=float).reshape(1, -1)
        pred = int(self._model.predict(x)[0])  # 1 (inlier) or -1 (outlier)
        score = float(self._model.decision_function(x)[0])

        status = "NORMAL" if pred == 1 else "ANOMALOUS"
        details = (
            "Observation is within expected statistical distribution."
            if pred == 1
            else "Observation exhibits unusual time-series or multi-dimensional isolation characteristics."
        )

        return AnomalyResult(
            status=status,
            prediction=pred,
            anomaly_score=round(score, 4),
            model="IsolationForest",
            details=details,
        )

    def predict_features(self, features: TelemetryFeatures) -> AnomalyResult:
        """
        Run anomaly prediction from a TelemetryFeatures schema object.

        Parameters
        ----------
        features : TelemetryFeatures
            Extracted telemetry features from Phase 4.

        Returns
        -------
        AnomalyResult
            Structured prediction result.
        """
        # Check if any required feature is None (e.g. first reading)
        derived_values = [
            features.temperature_change,
            features.temperature_rate,
            features.humidity_change,
            features.humidity_rate,
            features.distance_from_previous,
            features.implied_speed,
            features.time_since_previous,
        ]

        if any(v is None for v in derived_values):
            return AnomalyResult(
                status="INSUFFICIENT_FEATURES",
                prediction=None,
                anomaly_score=None,
                details="Historical derived features unavailable (e.g. first reading for device/batch). Cannot evaluate ML anomaly detection.",
            )

        vector = [
            features.temperature,
            features.humidity,
            features.latitude,
            features.longitude,
            features.temperature_change,
            features.temperature_rate,
            features.humidity_change,
            features.humidity_rate,
            features.distance_from_previous,
            features.implied_speed,
            features.time_since_previous,
        ]

        return self.predict_vector(vector)

    def clear_model(self) -> None:
        """Reset the internal model state (useful for test isolation)."""
        self._model = None


# Shared singleton anomaly detector instance for runtime
anomaly_detector = IsolationForestDetector()
