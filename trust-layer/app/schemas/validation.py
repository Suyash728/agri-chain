"""
app/schemas/validation.py
--------------------------
Pydantic models for the structured validation result returned by the
AI Trust Layer pipeline.

WHY A STRUCTURED RESULT?
--------------------------
Returning a plain True/False from a validator makes it hard for the caller
(or a future verdict engine) to know:
  - Which field failed?
  - What value was received?
  - Why was it rejected?

Instead, every check returns a ValidationResult that carries all of that
context. This makes the API response informative and keeps the pipeline
stages loosely coupled — each stage just looks at the 'passed' flag and
the 'failures' list, without caring about the details of how each check
was done.

Usage example (within the validator service)
--------------------------------------------
    result = ValidationResult(
        passed=False,
        stage="basic_range_validation",
        failures=[
            FieldFailure(
                field="temperature",
                received_value=120.0,
                reason="Temperature 120.0°C exceeds maximum allowed 60.0°C.",
            )
        ],
    )
"""

from typing import Any, List, Optional
from pydantic import BaseModel


class FieldFailure(BaseModel):
    """
    Describes a single validation failure for one field.

    Attributes
    ----------
    field : str
        Name of the field that failed (e.g., "temperature").
    received_value : Any
        The value that was actually received from the sensor.
        Optional because some failures (e.g., missing field) have no value.
    reason : str
        A human-readable explanation of why this value is invalid.
    """

    field: str
    received_value: Optional[Any] = None
    reason: str


class ValidationResult(BaseModel):
    """
    The structured output of a single pipeline validation stage.

    Attributes
    ----------
    passed : bool
        True if all checks in this stage passed; False if any failed.
    stage : str
        Name of the pipeline stage that produced this result.
        Examples: "basic_range_validation", "physical_plausibility",
                  "ml_anomaly_detection", "integrity_check".
        This makes it easy to trace which stage flagged a problem.
    failures : List[FieldFailure]
        All fields that failed, with their received values and reasons.
        Empty list when passed=True.
    """

    passed: bool
    stage: str
    failures: List[FieldFailure] = []
