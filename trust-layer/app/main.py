"""
app/main.py
-----------
Entry point for the AgriChain AI Trust Layer FastAPI application.

This file:
  1. Creates the FastAPI application instance.
  2. Registers all routers (health, telemetry, and future routers).
  3. Configures API metadata shown in the Swagger UI (/docs).

To start the server, run from the project root:
    uvicorn app.main:app --reload

Then open http://127.0.0.1:8000/docs in your browser to explore
the interactive API documentation.
"""

from fastapi import FastAPI
from app.routers import health, telemetry

# ---------------------------------------------------------------------------
# Application metadata
# This information appears at the top of the Swagger UI page (/docs).
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AgriChain AI Trust Layer",
    description=(
        "Backend API for the AI Trust Layer component of the "
        "'Blockchain Traceability with an AI Trust Layer' B.Tech project.\n\n"
        "**Phase 1 (Complete) — Foundation:**\n"
        "- Accepts IoT telemetry from supply chain devices.\n"
        "- Validates the payload schema using Pydantic.\n\n"
        "**Phase 2 (Complete) — Basic Range Validation:**\n"
        "- Checks latitude, longitude, temperature, humidity against "
        "configured cold-chain limits.\n\n"
        "**Phase 3 (Complete) — Physical & Temporal Plausibility:**\n"
        "- Evaluates historical telemetry sequence per device/batch.\n"
        "- Checks GPS movement speed (Haversine formula).\n"
        "- Checks temperature and humidity rate of change over time.\n"
        "- Checks timestamp sequence (chronology, duplicates, max gap).\n\n"
        "**Phase 4 (Complete) — Telemetry History & Time-Series Feature Engineering:**\n"
        "- Generates dynamic numerical feature vectors (deltas, rates, speeds, elapsed time).\n"
        "- Maintains clean history isolation by device and batch.\n\n"
        "**Phase 5 (Complete) — Isolation Forest ML Anomaly Detection:**\n"
        "- Unsupervised multi-dimensional anomaly detection using scikit-learn.\n"
        "- Evaluates complete feature vectors against normal baseline distributions.\n"
        "- Generates raw decision scores and prediction classifications (NORMAL / ANOMALOUS).\n\n"
        "**Phase 6 (Complete) — Telemetry Integrity & Replay Detection:**\n"
        "- Deterministic canonical event serialization and SHA-256 fingerprinting.\n"
        "- Replay detection and duplicate event prevention per device/batch.\n"
        "- Timestamp sequence tracking and extensible device authentication interface.\n\n"
        "**Phase 7 (Complete) — Trust/Verdict Engine:**\n"
        "- Aggregates trust signals across Physical Plausibility, ML Anomaly Detection, and Integrity.\n"
        "- Transparent deterministic decision policy generating VALID, ANOMALOUS, or INSUFFICIENT_EVIDENCE.\n"
        "- Preserves explainable, ordered failure reason codes.\n\n"
        "**Phase 8 (Complete) — Off-Chain Quarantine & Audit Trail:**\n"
        "- Append-only audit record storage for every processed telemetry reading.\n"
        "- Disposition assignment (READY_FOR_ORACLE, QUARANTINED, ON_HOLD).\n"
        "- Query endpoints for audit trail retrieval by event hash and quarantine inspection.\n\n"
        "**Phase 9 (Complete) — Telemetry Simulator + Fault Injection:**\n"
        "- Realistic synthetic telemetry stream generation with configurable parameters and random seed.\n"
        "- Controlled fault injection: temperature/humidity spikes, GPS jumps, timestamp out-of-order, replays, telemetry gaps, and combined faults.\n"
        "- Standalone test framework and development simulation endpoint.\n\n"
        "**Phase 10 (Complete) — AI Trust Layer -> Oracle Handoff Interface:**\n"
        "- Explicit OracleHandoffPayload data contract (schema version 1.0) preserving Phase 6 SHA-256 event_hash.\n"
        "- Strict eligibility enforcement: only trusted events with verdict VALID and disposition READY_FOR_ORACLE are approved.\n"
        "- Immutable boundary adapter preventing unauthorized bypass, tampered verdicts, or blockchain side-effects.\n\n"
        "**Phase 11 (Current / Final) — Evaluation & Performance Measurement:**\n"
        "- Comprehensive pipeline benchmarking across normal telemetry and all 7 fault injection categories.\n"
        "- Quantitative evaluation: TP, TN, FP, FN, Precision, Recall, F1-Score, False Positive Rate, and Latency.\n"
        "- Detailed fault-wise breakdown, binary confusion matrices, and publication-ready visualization charts.\n"
    ),
    version="0.11.0",
    contact={
        "name": "AgriChain B.Tech Project",
    },
    license_info={
        "name": "MIT",
    },
)

# ---------------------------------------------------------------------------
# Register routers
# Each router groups related endpoints together.
# Add new routers here as the project grows.
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(telemetry.router)
