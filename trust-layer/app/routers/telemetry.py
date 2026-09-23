"""
app/routers/telemetry.py
-------------------------
Router for all telemetry-related API endpoints.

Using APIRouter lets us keep endpoint definitions separate from the
main application file (main.py). As the project grows, each domain
(validation, ML, quarantine, oracle) can have its own router.

Current endpoints
-----------------
POST /telemetry
    Phase 1: Accepts and schema-validates an IoT telemetry payload.
    Phase 2: Also runs basic range validation via the validator service.
             Returns HTTP 200 on success, HTTP 422 on validation failure.

HTTP STATUS CODE RATIONALE
---------------------------
We use 422 Unprocessable Entity for range validation failures because:
  - The request was well-formed JSON and parseable (so not 400 Bad Request).
  - The values are syntactically valid (e.g., temperature IS a number) but
    semantically invalid (e.g., 120°C is outside the allowed range).
  - 422 is the standard REST status for "I understood the request but the
    data contained semantic errors". FastAPI itself uses 422 for Pydantic
    schema failures, so we keep the same convention for our range checks.
  - Future phases (ML anomaly, integrity check) may introduce additional
    codes (e.g., 200 with ANOMALOUS verdict) — but that belongs to the
    verdict engine phase, not here.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.schemas.evaluation import EvaluationConfig, EvaluationReport
from app.schemas.oracle import (
    OracleHandoffIneligibleError,
    OracleHandoffPayload,
    OracleHandoffRejection,
)
from app.schemas.simulation import SimulationConfig
from app.schemas.telemetry import TelemetryPayload
from app.services.anomaly_detector import anomaly_detector
from app.services.audit import audit_service
from app.services.evaluation import evaluation_service
from app.services.features import extract_features
from app.services.history import history_repository
from app.services.integrity import verify_telemetry_integrity
from app.services.oracle_handoff import oracle_handoff_service
from app.services.plausibility import run_plausibility_checks
from app.services.simulator import telemetry_simulator
from app.services.validator import run_basic_validation
from app.services.verdict import evaluate_verdict

# Create a router with a prefix and tag so Swagger UI groups it neatly.
router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry Ingestion"],
)


class TrainingPayload(BaseModel):
    """Payload containing a matrix of 11-dimensional feature vectors for training."""
    feature_matrix: List[List[float]] = Field(
        ...,
        description="List of 11-element numerical feature vectors representing normal baseline telemetry.",
    )


@router.post(
    "/train",
    summary="Train Isolation Forest (Development)",
    description=(
        "Fits the Isolation Forest anomaly detection model using a provided matrix of normal baseline "
        "feature vectors.\n\n"
        "Each vector must contain all 11 features in the exact order:\n"
        "1. temperature, 2. humidity, 3. latitude, 4. longitude, 5. temperature_change, "
        "6. temperature_rate, 7. humidity_change, 8. humidity_rate, 9. distance_from_previous, "
        "10. implied_speed, 11. time_since_previous."
    ),
    status_code=200,
)
def train_anomaly_model(payload: TrainingPayload):
    """
    Train the Isolation Forest anomaly detector.
    """
    try:
        anomaly_detector.fit(payload.feature_matrix)
        return {
            "status": "success",
            "message": f"Isolation Forest trained successfully with {len(payload.feature_matrix)} baseline samples.",
            "model": "IsolationForest",
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to train Isolation Forest: {str(e)}",
        )


@router.get(
    "/quarantine",
    summary="List Quarantined Telemetry Records",
    description="Retrieve all quarantined telemetry records for investigation, with optional device/batch filters.",
    status_code=200,
)
def list_quarantine_records(
    device_id: Optional[str] = Query(None, description="Filter by device ID."),
    batch_id: Optional[str] = Query(None, description="Filter by batch ID."),
):
    """
    Retrieve quarantined telemetry audit records.
    """
    records = audit_service.get_quarantined_records(device_id=device_id, batch_id=batch_id)
    return {
        "count": len(records),
        "quarantined_records": [r.model_dump() for r in records],
    }


@router.get(
    "/audit/{event_hash}",
    summary="Get Audit Records by Event Hash",
    description="Retrieve immutable audit history for a specific SHA-256 telemetry event hash.",
    status_code=200,
)
def get_audit_by_hash(event_hash: str):
    """
    Retrieve audit history by event hash.
    """
    records = audit_service.get_by_event_hash(event_hash)
    if not records:
        raise HTTPException(status_code=404, detail=f"No audit records found for event hash '{event_hash}'.")
    return {
        "event_hash": event_hash,
        "count": len(records),
        "records": [r.model_dump() for r in records],
    }


@router.get(
    "/oracle-handoff/{event_hash}",
    summary="Get Oracle Handoff Payload",
    description=(
        "Retrieves an approved, immutable Oracle Handoff Payload for a processed telemetry event.\n\n"
        "**Strict Eligibility Rule**:\n"
        "- Only events with trusted verdict 'VALID' and disposition 'READY_FOR_ORACLE' can be returned.\n"
        "- Returns **HTTP 200** with `OracleHandoffPayload` if approved.\n"
        "- Returns **HTTP 400** with `OracleHandoffRejection` if event is QUARANTINED or ON_HOLD.\n"
        "- Returns **HTTP 404** if event_hash is not found in the audit trail."
    ),
    response_model=OracleHandoffPayload,
    responses={
        200: {"description": "Telemetry approved for Oracle handoff.", "model": OracleHandoffPayload},
        400: {"description": "Telemetry ineligible for Oracle handoff.", "model": OracleHandoffRejection},
        404: {"description": "Telemetry event hash not found."},
    },
    status_code=200,
)
def get_oracle_handoff(event_hash: str):
    """
    Retrieve Oracle Handoff Payload by event hash.
    """
    try:
        payload = oracle_handoff_service.create_handoff_by_hash(event_hash)
        return payload
    except KeyError:
        raise HTTPException(
            status_code=404,
            detail=f"No audit records found for event hash '{event_hash}'.",
        )
    except OracleHandoffIneligibleError as e:
        records = audit_service.get_by_event_hash(event_hash)
        rec = records[-1]
        raise HTTPException(
            status_code=400,
            detail={
                "event_hash": event_hash,
                "verdict": rec.verdict,
                "disposition": rec.disposition,
                "eligible": False,
                "detail": str(e),
            },
        )



@router.post(
    "",
    summary="Ingest IoT Telemetry",
    description=(
        "Receives a single IoT telemetry reading from a supply chain device.\n\n"
        "**Phase 1** — Pydantic validates the payload schema automatically.\n\n"
        "**Phase 2** — Basic range validation checks that sensor values are "
        "within physically plausible limits for agricultural cold-chain telemetry.\n\n"
        "**Phase 3** — Physical & Temporal Plausibility checks compare the reading "
        "against historical telemetry for the same device/batch:\n"
        "- GPS Speed calculation using Haversine formula (detects sudden position jumps)\n"
        "- Temperature rate-of-change (°C/min)\n"
        "- Humidity rate-of-change (%/min)\n"
        "- Timestamp sequence consistency (chronology, duplicates, max gap)\n\n"
        "**Phase 4** — Time-Series Feature Engineering calculates numerical feature vectors.\n\n"
        "**Phase 5** — Isolation Forest evaluates the feature vector against the trained ML model.\n\n"
        "**Phase 6** — Integrity & Replay Detection verifies SHA-256 fingerprint, checks duplicate replays, and validates sequence.\n\n"
        "**Phase 7** — Trust/Verdict Engine consolidates all evidence and produces a final trust decision.\n\n"
        "**Phase 8** — Quarantine + Audit Trail assigns final disposition and creates an immutable audit record.\n\n"
        "Returns **HTTP 200** with structured validation, plausibility reports, feature vectors, ML anomaly, integrity, verdict, and audit records.\n"
        "Returns **HTTP 422** with structured failure details if basic range validation fails."
    ),
    status_code=200,
)
def ingest_telemetry(payload: TelemetryPayload):
    """
    Accept, validate, evaluate physical plausibility, extract features, run ML anomaly detection,
    verify cryptographic integrity/replay state, compute trust verdict, and record audit disposition.

    Parameters
    ----------
    payload : TelemetryPayload
        The telemetry data sent by the IoT device, already schema-validated
        by Pydantic before this function is called.

    Returns
    -------
    dict
        On success (HTTP 200): confirmation with validation, plausibility, features, ML anomaly, integrity, verdict, and audit results.
        On Phase 2 failure (HTTP 422): raises HTTPException with structured details.
    """
    # ------------------------------------------------------------------
    # Phase 2: Run basic range validation
    # ------------------------------------------------------------------
    result = run_basic_validation(payload)

    if not result.passed:
        failure_details = [f.model_dump() for f in result.failures]
        raise HTTPException(
            status_code=422,
            detail={
                "validation_stage": result.stage,
                "message": (
                    "Telemetry failed basic range validation. "
                    "See 'failures' for details."
                ),
                "failures": failure_details,
            },
        )

    # ------------------------------------------------------------------
    # Phase 3 & 4: Retrieve history, run plausibility checks, and extract features
    # ------------------------------------------------------------------
    previous = history_repository.get_last_reading(
        device_id=payload.device_id, batch_id=payload.batch_id
    )
    plausibility = run_plausibility_checks(current=payload, previous=previous)
    features = extract_features(current=payload, previous=previous)

    # ------------------------------------------------------------------
    # Phase 5: Run ML Anomaly Detection (Isolation Forest)
    # ------------------------------------------------------------------
    anomaly = anomaly_detector.predict_features(features)

    # ------------------------------------------------------------------
    # Phase 6: Run Cryptographic Integrity & Replay Detection
    # ------------------------------------------------------------------
    integrity = verify_telemetry_integrity(payload)

    # ------------------------------------------------------------------
    # Phase 7: Compute Final Trust Verdict
    # ------------------------------------------------------------------
    verdict = evaluate_verdict(
        plausibility=plausibility,
        ml=anomaly,
        integrity=integrity,
        include_evidence=False,  # Evidence already presented as top-level blocks in API
    )

    # ------------------------------------------------------------------
    # Phase 8: Record Immutable Audit & Quarantine Disposition
    # ------------------------------------------------------------------
    audit_record = audit_service.record_audit(
        payload=payload,
        verdict=verdict,
        integrity=integrity,
        anomaly=anomaly,
    )

    # Record current payload in history for subsequent readings
    history_repository.add_reading(payload)

    # ------------------------------------------------------------------
    # All Phase 2 checks passed — return success acknowledgement with full pipeline evidence, verdict, and audit.
    # ------------------------------------------------------------------
    return {
        "status": "received",
        "message": "Telemetry ingested, evaluated across AI trust pipeline, and recorded in audit trail.",
        "batch_id": payload.batch_id,
        "device_id": payload.device_id,
        "timestamp": payload.timestamp.isoformat(),
        "validation": {
            "stage": result.stage,
            "passed": result.passed,
        },
        "plausibility": plausibility.model_dump(),
        "features": features.model_dump(),
        "anomaly_detection": anomaly.model_dump(),
        "integrity": integrity.model_dump(),
        "verdict": verdict.model_dump(exclude_none=True),
        "audit": audit_record.model_dump(),
    }


@router.post(
    "/simulate",
    summary="Simulate Telemetry Stream (Development)",
    description=(
        "Generates a synthetic telemetry sequence with optional fault injection and optionally "
        "evaluates each reading through the complete AI Trust Layer pipeline."
    ),
    status_code=200,
)
def simulate_telemetry_stream(
    config: SimulationConfig,
    evaluate_pipeline: bool = Query(
        False,
        description="If True, each simulated reading is passed through the real ingestion pipeline and recorded in the audit trail.",
    ),
):
    """
    Generate synthetic telemetry with optional fault injection.
    """
    readings = telemetry_simulator.generate_sequence(config)

    pipeline_results: Optional[List[Dict[str, Any]]] = None
    if evaluate_pipeline:
        pipeline_results = []
        for reading in readings:
            try:
                res = ingest_telemetry(reading)
                pipeline_results.append(res)
            except HTTPException as e:
                pipeline_results.append({"status_code": e.status_code, "detail": e.detail})

    return {
        "status": "success",
        "total_readings": len(readings),
        "faults_injected": len(config.faults),
        "readings": [r.model_dump(mode="json") for r in readings],
        "pipeline_results": pipeline_results,
    }


@router.post(
    "/evaluate",
    summary="Evaluate AI Trust Layer (Benchmark)",
    description=(
        "Executes a comprehensive performance evaluation benchmark across normal telemetry "
        "and all 7 fault injection categories. Returns detailed classification metrics, "
        "fault-wise breakdowns, confusion matrix, and latency statistics."
    ),
    response_model=EvaluationReport,
    status_code=200,
)
def evaluate_trust_layer(config: Optional[EvaluationConfig] = None):
    """
    Run pipeline evaluation benchmark.
    """
    report = evaluation_service.run_pipeline_evaluation(config=config)
    return report

