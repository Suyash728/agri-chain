"""
app/config.py
-------------
Central configuration for the AI Trust Layer.

All validation thresholds live here so they can be changed in
one place without hunting through multiple files.

TEMPERATURE RANGE ASSUMPTION
-----------------------------
Agricultural cold-chain storage typically operates across several zones:

  Zone                    | Typical Range (°C)
  ------------------------|--------------------
  Frozen storage          | -25 °C to -18 °C
  Refrigerated / chilled  |  -2 °C to +8 °C
  Controlled-atmosphere   |  +2 °C to +15 °C
  Ambient (warehouse)     | +10 °C to +35 °C

We cover the widest practical range a legitimate cold-chain sensor
could ever report: -30 °C (extreme freezer headroom) to +60 °C
(extreme ambient headroom for trucks in hot climates).

Any reading outside [-30, +60] is almost certainly a sensor fault
or a spoofed/erroneous value and should be flagged for review.

References
----------
- FAO / WHO Codex Alimentarius cold-chain guidelines
- ASHRAE standard 62.1 for refrigerated facilities
- FSSAI Cold Chain Management guidelines (India)
"""

# ---------------------------------------------------------------------------
# Temperature range (°C)
# Rationale above. Covers frozen storage to hot-climate ambient transport.
# ---------------------------------------------------------------------------
TEMPERATURE_MIN: float = -30.0   # °C — extreme freezer lower bound
TEMPERATURE_MAX: float = 60.0    # °C — extreme hot-climate ambient upper bound

# ---------------------------------------------------------------------------
# Humidity range (%)
# Physical limits of relative humidity.
# ---------------------------------------------------------------------------
HUMIDITY_MIN: float = 0.0
HUMIDITY_MAX: float = 100.0

# ---------------------------------------------------------------------------
# GPS coordinate ranges
# These are fixed physical constants — no configuration needed in practice,
# but listed here so that the validator imports from one place.
# ---------------------------------------------------------------------------
LATITUDE_MIN: float = -90.0
LATITUDE_MAX: float = 90.0
LONGITUDE_MIN: float = -180.0
LONGITUDE_MAX: float = 180.0

# ---------------------------------------------------------------------------
# Phase 3 — Physical & Temporal Plausibility Thresholds
#
# All limits are configurable defaults. Crop/batch policies can override
# these values where specific agricultural constraints apply.
# ---------------------------------------------------------------------------

# Maximum plausible movement speed for cold-chain transit vehicles (km/h).
# Rationale: Standard commercial transport trucks rarely exceed 120 km/h.
# Speeds above 120 km/h indicate GPS drift, spoofing, or invalid coordinates.
MAX_PLAUSIBLE_SPEED_KMH: float = 120.0

# Maximum plausible temperature rate of change (°C / minute).
# Rationale: Cold-chain storage containers and refrigerated trucks have high
# thermal mass and insulation. A temperature jump > 2.0 °C per minute (or 120°C/hr)
# is physically impossible under standard operating conditions and usually
# indicates sensor malfunction or tampering.
MAX_TEMPERATURE_CHANGE_RATE_PER_MIN: float = 2.0

# Maximum plausible humidity rate of change (% / minute).
# Rationale: Relative humidity inside sealed cold-chain containers shifts
# gradually. A change exceeding 5.0% per minute indicates sensor exposure or fault.
MAX_HUMIDITY_CHANGE_RATE_PER_MIN: float = 5.0

# Maximum expected gap between consecutive telemetry readings (seconds).
# Rationale: Sensors are configured to transmit periodically (e.g. every 5–15 mins).
# A gap larger than 3600 seconds (1 hour) represents a missed interval or signal loss.
MAX_TELEMETRY_GAP_SECONDS: float = 3600.0

# ---------------------------------------------------------------------------
# Phase 5 — Isolation Forest Hyperparameters
#
# Configurable initial settings for unsupervised ML anomaly detection.
# Note: Contamination is an initial development setting and not an absolute
# physical constant; it can be fine-tuned during the evaluation phase.
# ---------------------------------------------------------------------------
IFOREST_N_ESTIMATORS: int = 100
IFOREST_CONTAMINATION: float = 0.05
IFOREST_RANDOM_STATE: int = 42

# ---------------------------------------------------------------------------
# Phase 6 & 8 — Persistent SQLite Storage Path
# ---------------------------------------------------------------------------
import os
import pathlib

_REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", str(_REPO_ROOT / "backend" / "agrichain.db"))


