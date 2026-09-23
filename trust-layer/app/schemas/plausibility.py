"""
app/schemas/plausibility.py
----------------------------
Pydantic models for structured Phase 3 Physical & Temporal Plausibility results.

WHY A STRUCTURED PLAUSIBILITY RESULT?
------------------------------------
Phase 3 does not produce the final VALID/ANOMALOUS verdict.
Instead, it generates structured trust signals and evidence that will later
be consumed by:
  - Feature engineering (Phase 4)
  - ML anomaly detection (Phase 5)
  - Integrity / replay checks
  - Final verdict engine

A failed check in Phase 3 is represented as a flagged check with a specific
reason code (e.g., GPS_SPEED_EXCEEDED), maintaining complete context for downstream processing.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class PlausibilityCheckResult(BaseModel):
    """
    Describes the outcome of a single physical or temporal plausibility check.

    Attributes
    ----------
    name : str
        Name of the check (e.g., "gps_speed_check", "temperature_rate_check").
    passed : bool
        True if the check passed; False if flagged as physically/temporally implausible.
    reason_code : Optional[str]
        Standardised error code when passed=False (e.g., "GPS_SPEED_EXCEEDED").
        None when passed=True.
    calculated_value : Optional[str]
        Human-readable calculated value (e.g., "185.2 km/h", "4.5 °C/min").
    threshold : Optional[str]
        Human-readable threshold value (e.g., "120.0 km/h", "2.0 °C/min").
    details : Optional[str]
        Additional context or breakdown of the calculation.
    """

    name: str = Field(..., description="Name of the plausibility check.")
    passed: bool = Field(..., description="True if check passed; False if flagged.")
    reason_code: Optional[str] = Field(
        None,
        description="Standardized code for failure (e.g. GPS_SPEED_EXCEEDED).",
    )
    calculated_value: Optional[str] = Field(
        None,
        description="Calculated value for evidence (e.g. '150.0 km/h').",
    )
    threshold: Optional[str] = Field(
        None,
        description="Configured limit (e.g. '120.0 km/h').",
    )
    details: Optional[str] = Field(
        None,
        description="Additional contextual calculation details.",
    )


class PlausibilityResult(BaseModel):
    """
    Structured output of the Phase 3 Physical & Temporal Plausibility stage.

    Attributes
    ----------
    plausible : bool
        True if ALL checks passed; False if any check was flagged.
    stage : str
        Identifies this stage as "physical_temporal_plausibility".
    checks : List[PlausibilityCheckResult]
        Detailed list of individual checks performed and their evidence.
    """

    plausible: bool = Field(
        ...,
        description="Overall plausibility status. True if all checks passed.",
    )
    stage: str = Field(
        default="physical_temporal_plausibility",
        description="Name of the pipeline stage.",
    )
    checks: List[PlausibilityCheckResult] = Field(
        default_factory=list,
        description="List of individual physical/temporal checks.",
    )
