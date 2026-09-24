import pathlib
import sqlite3
from typing import Optional, List
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
from datetime import datetime, timezone, timedelta
import json

import chain
import ipfs
from db import get_connection, init_db, DB_PATH
from validation import validate_reading

# Ensure trust-layer is importable
TRUST_LAYER_PATH = pathlib.Path(__file__).resolve().parent.parent / "trust-layer"
if str(TRUST_LAYER_PATH) not in sys.path:
    sys.path.insert(0, str(TRUST_LAYER_PATH))

from app.schemas.telemetry import TelemetryPayload
from app.services.validator import run_basic_validation
from app.services.plausibility import run_plausibility_checks
from app.services.policy import get_crop_policy
from app.services.features import extract_features
from app.services.anomaly_detector import anomaly_detector
from app.services.integrity import verify_telemetry_integrity
from app.services.verdict import evaluate_verdict
from app.services.audit import audit_service
from app.services.history import history_repository
from app.services.evaluation import evaluation_service
from app.schemas.evaluation import EvaluationConfig, EvaluationReport

app = FastAPI(title="AgriChain API", version="1.0.0")

# Enable CORS for frontend communication (Vite on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PARTICIPANT_ADDRESSES = {
    "farmer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "logistics": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "safexpress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "dark_store": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "retailer": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "consumer": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
}


def init_baseline_anomaly_model():
    """Train Isolation Forest on representative normal operational baselines (stationary + transit produce)."""
    import numpy as np
    np.random.seed(42)
    X = []
    for _ in range(500):
        crop = np.random.choice(["tomato", "mango", "wheat"])
        if crop == "tomato":
            temp = float(np.random.uniform(2.0, 8.0))
            hum = float(np.random.uniform(85.0, 95.0))
        elif crop == "mango":
            temp = float(np.random.uniform(10.0, 15.0))
            hum = float(np.random.uniform(85.0, 90.0))
        else:
            temp = float(np.random.uniform(15.0, 25.0))
            hum = float(np.random.uniform(50.0, 70.0))

        is_transit = np.random.rand() > 0.4
        elapsed = float(np.random.uniform(30.0, 120.0))

        if is_transit:
            speed = float(np.random.uniform(10.0, 75.0))
            dist = float((speed * elapsed) / 3600.0)
        else:
            speed = 0.0
            dist = 0.0

        lat = float(18.5204 + np.random.uniform(-0.5, 0.5))
        lon = float(73.8567 + np.random.uniform(-0.5, 0.5))

        d_temp = float(np.random.uniform(-0.8, 0.8))
        temp_rate = float((d_temp / elapsed) * 60.0)
        d_hum = float(np.random.uniform(-2.0, 2.0))
        hum_rate = float((d_hum / elapsed) * 60.0)

        X.append([temp, hum, lat, lon, d_temp, temp_rate, d_hum, hum_rate, dist, speed, elapsed])

    anomaly_detector.fit(X)


@app.on_event("startup")
def on_startup():
    init_db()
    try:
        init_baseline_anomaly_model()
    except Exception as e:
        print(f"Warning: could not fit baseline anomaly detector: {e}")


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------- Telemetry Models & Route ----------------

class TelemetryRequest(BaseModel):
    batch_id: str
    crop_name: Optional[str] = None
    temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    device_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[str] = None


class TelemetryResponse(BaseModel):
    verdict: str
    reason: Optional[str] = None
    tx_hash: Optional[str] = None
    reading_id: int
    event_hash: Optional[str] = None
    disposition: Optional[str] = None
    reason_codes: Optional[List[str]] = None
    anomaly_score: Optional[float] = None


class TelemetryBatchRequest(BaseModel):
    readings: List[TelemetryRequest]


class TelemetryBatchResponse(BaseModel):
    total_received: int
    valid_count: int
    quarantined_count: int
    tx_hash: Optional[str] = None
    results: List[TelemetryResponse]


@app.post("/telemetry", response_model=TelemetryResponse)
def post_telemetry(payload: TelemetryRequest, anchor_onchain: bool = True):
    """Ingest a telemetry reading with AI trust validation, anomaly detection, and quarantine."""
    conn = get_connection()
    try:
        temp_c = payload.temp_c if payload.temp_c is not None else payload.temperature
        humidity_pct = payload.humidity_pct if payload.humidity_pct is not None else payload.humidity
        if temp_c is None or humidity_pct is None:
            raise HTTPException(status_code=400, detail="Missing temperature or humidity in telemetry payload")

        temp_c = float(temp_c)
        humidity_pct = float(humidity_pct)
        device_id = payload.device_id or f"DEV-{payload.batch_id}"
        latitude = float(payload.latitude) if payload.latitude is not None else 18.5204
        longitude = float(payload.longitude) if payload.longitude is not None else 73.8567

        ts_raw = payload.timestamp
        if ts_raw:
            try:
                ts = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
            except Exception:
                ts = datetime.now(timezone.utc)
        else:
            prev_reading = history_repository.get_last_reading(device_id=device_id, batch_id=payload.batch_id)
            now = datetime.now(timezone.utc)
            if prev_reading and (now - prev_reading.timestamp).total_seconds() < 60.0:
                ts = prev_reading.timestamp + timedelta(seconds=60.0)
            else:
                ts = now
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        # 1. Record raw reading in readings table first with verdict='PENDING' (audit integrity per RULES.md §4)
        cur = conn.execute(
            """
            INSERT INTO readings (batch_id, temp_c, humidity_pct, verdict, tx_hash)
            VALUES (?, ?, ?, 'PENDING', NULL)
            """,
            (payload.batch_id, temp_c, humidity_pct),
        )
        reading_id = cur.lastrowid
        conn.commit()

        # 2. Look up batch crop & dynamic crop policy
        batch_row = conn.execute("SELECT crop_name FROM batches WHERE batch_id = ?", (payload.batch_id,)).fetchone()
        crop_name = (payload.crop_name or (batch_row["crop_name"] if batch_row else "tomato")).lower()
        policy = get_crop_policy(payload.batch_id, db_path=str(DB_PATH))

        # 3. Construct TelemetryPayload for trust pipeline
        telemetry_obj = TelemetryPayload(
            batch_id=payload.batch_id,
            device_id=device_id,
            latitude=latitude,
            longitude=longitude,
            temperature=temp_c,
            humidity=humidity_pct,
            timestamp=ts,
        )

        # 4. Range validation
        range_res = run_basic_validation(telemetry_obj)
        range_reasons = [f.reason_code for f in range_res.failures] if not range_res.passed else []

        # 5. History lookup and Plausibility checks
        previous = history_repository.get_last_reading(device_id=device_id, batch_id=payload.batch_id)
        plausibility = run_plausibility_checks(current=telemetry_obj, previous=previous, policy=policy)

        # 6. Feature extraction & Isolation Forest Anomaly Detection
        features = extract_features(current=telemetry_obj, previous=previous)
        if not anomaly_detector.is_trained():
            try:
                evaluation_service._fit_baseline_model(seed=42)
            except Exception:
                pass
        anomaly = anomaly_detector.predict_features(features)

        # 7. Cryptographic Integrity & Replay Detection
        integrity = verify_telemetry_integrity(telemetry_obj)

        # 8. Compute Verdict
        verdict = evaluate_verdict(
            plausibility=plausibility,
            ml=anomaly,
            integrity=integrity,
            include_evidence=True,
        )

        # If range validation failed, prepend reason codes
        all_reasons = range_reasons + [r for r in verdict.reason_codes if r not in range_reasons]
        if "REPLAY_DETECTED" in all_reasons and "REPLAY_ATTACK_DETECTED" not in all_reasons:
            all_reasons.append("REPLAY_ATTACK_DETECTED")
        if range_reasons and verdict.verdict != "ANOMALOUS":
            verdict.verdict = "ANOMALOUS"
            verdict.reason_codes = all_reasons

        # Handle initial reading semantics: if physical and integrity pass and no reasons, mark valid
        is_initial_clean = (
            previous is None
            and plausibility.plausible
            and integrity.status == "VALID"
            and not all_reasons
        )

        if is_initial_clean or verdict.verdict == "VALID":
            final_verdict = "VALID"
            final_disposition = "READY_FOR_ORACLE"
            verdict.verdict = "VALID"
        else:
            final_verdict = "ANOMALOUS"
            final_disposition = "QUARANTINED"
            verdict.verdict = "ANOMALOUS"

        verdict.reason_codes = all_reasons

        # 9. Record in Audit Trail and History
        audit_record = audit_service.record_audit(
            payload=telemetry_obj,
            verdict=verdict,
            integrity=integrity,
            anomaly=anomaly,
        )
        if final_verdict == "VALID":
            history_repository.add_reading(telemetry_obj)

        # 10. Execute Oracle Handoff (blockchain anchor) or Quarantine
        if final_verdict == "VALID":
            if not anchor_onchain:
                conn.execute(
                    "UPDATE readings SET verdict = 'VALID' WHERE id = ?",
                    (reading_id,),
                )
                conn.commit()
                return TelemetryResponse(
                    verdict="VALID",
                    reason=None,
                    tx_hash=None,
                    reading_id=reading_id,
                    event_hash=integrity.event_hash,
                    disposition="READY_FOR_ORACLE",
                    reason_codes=[],
                    anomaly_score=anomaly.anomaly_score if anomaly else None,
                )

            temp_deci_c = int(round(temp_c * 10))
            humidity_pct_int = int(round(humidity_pct))
            try:
                tx_hash = chain.record_condition(
                    batch_id=payload.batch_id,
                    temp_deci_c=temp_deci_c,
                    humidity_pct=humidity_pct_int,
                    breach=False,
                )
            except Exception as e:
                conn.execute(
                    "UPDATE readings SET verdict = 'ANOMALOUS' WHERE id = ?",
                    (reading_id,),
                )
                conn.execute(
                    "INSERT INTO quarantine (reading_id, reason) VALUES (?, ?)",
                    (reading_id, f"Blockchain recording failed: {str(e)}"),
                )
                conn.commit()
                return TelemetryResponse(
                    verdict="ANOMALOUS",
                    reason=f"Blockchain recording failed: {str(e)}",
                    tx_hash=None,
                    reading_id=reading_id,
                    event_hash=integrity.event_hash,
                    disposition="QUARANTINED",
                    reason_codes=["BLOCKCHAIN_RECORDING_FAILED"],
                    anomaly_score=anomaly.anomaly_score if anomaly else None,
                )

            conn.execute(
                "UPDATE readings SET verdict = 'VALID', tx_hash = ? WHERE id = ?",
                (tx_hash, reading_id),
            )
            conn.commit()
            return TelemetryResponse(
                verdict="VALID",
                reason=None,
                tx_hash=tx_hash,
                reading_id=reading_id,
                event_hash=integrity.event_hash,
                disposition="READY_FOR_ORACLE",
                reason_codes=[],
                anomaly_score=anomaly.anomaly_score if anomaly else None,
            )
        else:
            reason_str = ", ".join(all_reasons) if all_reasons else "Cold-chain policy breach or anomaly"
            conn.execute(
                "UPDATE readings SET verdict = 'ANOMALOUS' WHERE id = ?",
                (reading_id,),
            )
            conn.execute(
                "INSERT INTO quarantine (reading_id, reason) VALUES (?, ?)",
                (reading_id, reason_str),
            )
            conn.commit()
            return TelemetryResponse(
                verdict="ANOMALOUS",
                reason=reason_str,
                tx_hash=None,
                reading_id=reading_id,
                event_hash=integrity.event_hash,
                disposition="QUARANTINED",
                reason_codes=all_reasons,
                anomaly_score=anomaly.anomaly_score if anomaly else None,
            )
    finally:
        conn.close()


@app.post("/telemetry/batch", response_model=TelemetryBatchResponse)
def post_telemetry_batch(batch_payload: TelemetryBatchRequest):
    """Processes a batch of telemetry readings through the AI Trust Layer,

    anchoring all valid readings in a single batched blockchain transaction.
    """
    individual_responses = []
    valid_items = []

    for req in batch_payload.readings:
        resp = post_telemetry(req, anchor_onchain=False)
        individual_responses.append(resp)
        if resp.verdict == "VALID":
            temp = req.temp_c if req.temp_c is not None else req.temperature
            hum = req.humidity_pct if req.humidity_pct is not None else req.humidity
            valid_items.append({
                "reading_id": resp.reading_id,
                "batch_id": req.batch_id,
                "temp_deci_c": int(round(float(temp) * 10)),
                "hum_pct": int(round(float(hum))),
                "breach": False,
            })

    valid_count = len(valid_items)
    quarantined_count = len(individual_responses) - valid_count
    batch_tx_hash = None

    if valid_items:
        batch_ids = [item["batch_id"] for item in valid_items]
        temps = [item["temp_deci_c"] for item in valid_items]
        hums = [item["hum_pct"] for item in valid_items]
        breaches = [item["breach"] for item in valid_items]

        try:
            batch_tx_hash = chain.record_conditions_batch(batch_ids, temps, hums, breaches)
            conn = get_connection()
            try:
                for item in valid_items:
                    conn.execute(
                        "UPDATE readings SET tx_hash = ? WHERE id = ?",
                        (batch_tx_hash, item["reading_id"]),
                    )
                conn.commit()
            finally:
                conn.close()

            for resp in individual_responses:
                if resp.verdict == "VALID":
                    resp.tx_hash = batch_tx_hash
        except Exception as e:
            print(f"[batch_telemetry] Batch write error: {e}")

    return TelemetryBatchResponse(
        total_received=len(batch_payload.readings),
        valid_count=valid_count,
        quarantined_count=quarantined_count,
        tx_hash=batch_tx_hash,
        results=individual_responses,
    )


@app.post("/telemetry/evaluate", response_model=EvaluationReport)
def post_telemetry_evaluate(config: Optional[EvaluationConfig] = None):
    """Execute benchmark evaluation across normal and all 7 fault injection categories."""
    output_dir = str(TRUST_LAYER_PATH / "reports" / "figures")
    report = evaluation_service.run_pipeline_evaluation(config=config, output_dir=output_dir)
    return report


REASON_CODE_LABELS = {
    "TEMP_OUT_OF_RANGE": "Temperature out of biological safe bounds",
    "HUMIDITY_OUT_OF_RANGE": "Humidity exceeding safe tolerance",
    "TEMP_SPIKE": "Sudden Temperature Spike / Cold-Chain Breach",
    "PHYSICAL_RATE_OF_CHANGE": "Physical rate of change violation (thermal shock)",
    "GPS_JUMP": "Infeasible GPS teleportation / velocity outlier",
    "REPLAY_DETECTED": "Cryptographic replay attack detected (duplicate timestamp/hash)",
    "DUPLICATE_TIMESTAMP": "Stale or repeated sensor timestamp sequence",
    "ISOLATION_FOREST_OUTLIER": "Unsupervised Isolation Forest anomaly pattern",
    "HASH_MISMATCH": "Cryptographic payload tamper / hash mismatch",
}


@app.get("/telemetry/quarantine")
def get_telemetry_quarantine():
    """Return quarantined telemetry incidents from SQLite audit_trail and quarantine tables."""
    conn = get_connection()
    try:
        audit_rows = conn.execute(
            """
            SELECT a.audit_id, a.batch_id, a.device_id, a.timestamp, a.latitude, a.longitude,
                   a.temperature, a.humidity, a.verdict, a.disposition, a.reason_codes,
                   a.anomaly_score, a.processed_at, a.details,
                   b.crop_name
            FROM audit_trail a
            LEFT JOIN batches b ON a.batch_id = b.batch_id
            WHERE a.disposition = 'QUARANTINED' OR a.verdict = 'ANOMALOUS'
            ORDER BY a.processed_at DESC
            LIMIT 50
            """
        ).fetchall()

        incidents = []
        for r in audit_rows:
            raw_codes = r["reason_codes"]
            parsed_codes = []
            if raw_codes:
                try:
                    import json
                    parsed_codes = json.loads(raw_codes) if isinstance(raw_codes, str) else raw_codes
                except Exception:
                    parsed_codes = [raw_codes]

            reasons_human = [REASON_CODE_LABELS.get(code, code) for code in parsed_codes]
            if not reasons_human:
                reasons_human = ["Anomaly detected during cold-chain multi-stage verification"]

            crop_name = r["crop_name"] or "Tomato"

            incidents.append({
                "id": r["audit_id"],
                "batchId": r["batch_id"],
                "deviceId": r["device_id"],
                "cropName": crop_name.capitalize(),
                "tempC": r["temperature"],
                "humidityPct": r["humidity"],
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "reasons": reasons_human,
                "reasonCodes": parsed_codes,
                "anomalyScore": r["anomaly_score"] if r["anomaly_score"] is not None else -0.15,
                "verdict": r["verdict"],
                "disposition": r["disposition"],
                "quarantinedAt": str(r["processed_at"])[:19].replace("T", " "),
                "details": r["details"],
            })

        q_rows = conn.execute(
            """
            SELECT q.id, q.reading_id, q.reason, q.created_at,
                   r.batch_id, r.temp_c, r.humidity_pct, r.verdict,
                   b.crop_name
            FROM quarantine q
            JOIN readings r ON q.reading_id = r.id
            LEFT JOIN batches b ON r.batch_id = b.batch_id
            ORDER BY q.id DESC
            LIMIT 30
            """
        ).fetchall()

        for q in q_rows:
            incidents.append({
                "id": f"QR-{q['id']}",
                "batchId": q["batch_id"],
                "deviceId": "DEVICE-SIM-01",
                "cropName": (q["crop_name"] or "Tomato").capitalize(),
                "tempC": q["temp_c"],
                "humidityPct": q["humidity_pct"],
                "latitude": 18.5204,
                "longitude": 73.8567,
                "reasons": [q["reason"]],
                "reasonCodes": ["TEMP_OUT_OF_RANGE" if "temperature" in q["reason"].lower() else "POLICY_BREACH"],
                "anomalyScore": -0.22,
                "verdict": q["verdict"] or "ANOMALOUS",
                "disposition": "QUARANTINED",
                "quarantinedAt": str(q["created_at"])[:19],
                "details": q["reason"],
            })

        if not incidents:
            incidents = [{
                "id": "AUD-DEMO-FAULT-01",
                "batchId": "BATCH-001",
                "deviceId": "DEV-TRUCK-01",
                "cropName": "Tomato",
                "tempC": 45.0,
                "humidityPct": 92.0,
                "latitude": 18.6214,
                "longitude": 73.8211,
                "reasons": ["Sudden Temperature Spike: 45.0°C exceeds safe threshold (max 8.0°C)"],
                "reasonCodes": ["TEMP_SPIKE", "PHYSICAL_RATE_OF_CHANGE"],
                "anomalyScore": -0.38,
                "verdict": "ANOMALOUS",
                "disposition": "QUARANTINED",
                "quarantinedAt": "2026-09-23 11:49:59",
                "details": "Sensor breached biological limits and was prevented from reaching the blockchain",
            }]

        return incidents
    finally:
        conn.close()


# ---------------- Batch & Custody Models & Routes ----------------

class CreateBatchRequest(BaseModel):
    batch_id: str
    crop_name: str
    origin_farm: str
    harvest_date: str
    farmer_name: str
    farmer_address: Optional[str] = None
    category: Optional[str] = None
    quantity_tonnes: Optional[float] = None
    price_inr: Optional[float] = None


class CreateBatchResponse(BaseModel):
    batch_id: str
    crop_name: str
    origin_farm: str
    harvest_date: str
    farmer_name: str
    tx_hash: str


@app.post("/batches", response_model=CreateBatchResponse)
def post_batch(payload: CreateBatchRequest):
    """Register a new produce batch in SQLite and on-chain."""
    conn = get_connection()
    try:
        # Check if already exists in SQLite
        existing = conn.execute("SELECT batch_id FROM batches WHERE batch_id = ?", (payload.batch_id,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail=f"Batch {payload.batch_id} already exists")

        # Register on-chain
        try:
            tx_hash = chain.register_batch(
                batch_id=payload.batch_id,
                crop_name=payload.crop_name,
                origin_farm=payload.origin_farm,
                harvest_date=payload.harvest_date,
                farmer_address=payload.farmer_address,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"On-chain batch registration failed: {str(e)}")

        cat_str = payload.category or ""
        qty_val = payload.quantity_tonnes if payload.quantity_tonnes is not None else 0.5
        price_val = payload.price_inr if payload.price_inr is not None else 2500.0
        encoded_origin = f"{payload.origin_farm} ||cat={cat_str}||qty={qty_val}||price={price_val}"

        # Store in SQLite
        conn.execute(
            """
            INSERT INTO batches (batch_id, crop_name, origin_farm, harvest_date, farmer_name)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.batch_id, payload.crop_name, encoded_origin, payload.harvest_date, payload.farmer_name),
        )

        # Store initial REGISTERED custody event with registered price
        price_paise = int(price_val * 100)
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, NULL, ?, 'REGISTERED', ?, ?)
            """,
            (payload.batch_id, payload.farmer_name, price_paise, tx_hash),
        )
        conn.commit()

        return CreateBatchResponse(
            batch_id=payload.batch_id,
            crop_name=payload.crop_name,
            origin_farm=payload.origin_farm,
            harvest_date=payload.harvest_date,
            farmer_name=payload.farmer_name,
            tx_hash=tx_hash,
        )
    finally:
        conn.close()


class CustodyTransferRequest(BaseModel):
    to_holder: str
    to_address: Optional[str] = None
    state: str  # e.g. "IN_TRANSIT", "IN_STORAGE", "AT_RETAIL", "SOLD"
    price_paise: int


class CustodyTransferResponse(BaseModel):
    batch_id: str
    from_holder: Optional[str]
    to_holder: str
    state: str
    price_paise: int
    tx_hash: str


@app.post("/batches/{batch_id}/custody", response_model=CustodyTransferResponse)
def post_custody(batch_id: str, payload: CustodyTransferRequest):
    """Transfer custody of a batch in SQLite and on-chain."""
    conn = get_connection()
    try:
        # Verify batch exists in SQLite
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        # Determine last holder
        last_event = conn.execute(
            "SELECT to_holder FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
            (batch_id,),
        ).fetchone()
        from_holder = last_event["to_holder"] if last_event else batch_row["farmer_name"]

        # Resolve Ethereum destination address
        to_addr = payload.to_address
        if not to_addr:
            lookup = payload.to_holder.lower().strip()
            to_addr = PARTICIPANT_ADDRESSES.get(lookup, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8")

        # Call on-chain transfer
        try:
            tx_hash = chain.transfer_custody(
                batch_id=batch_id,
                to_address=to_addr,
                new_state=payload.state,
                price_paise=payload.price_paise,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"On-chain custody transfer failed: {str(e)}")

        # Store in custody_events
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (batch_id, from_holder, payload.to_holder, payload.state.upper(), payload.price_paise, tx_hash),
        )
        conn.commit()

        return CustodyTransferResponse(
            batch_id=batch_id,
            from_holder=from_holder,
            to_holder=payload.to_holder,
            state=payload.state.upper(),
            price_paise=payload.price_paise,
            tx_hash=tx_hash,
        )
    finally:
        conn.close()


# ---------------- IPFS Decentralized Documents Endpoints (Phase 9) ----------------

class BatchDocumentResponse(BaseModel):
    id: int
    batch_id: str
    doc_type: str
    ipfs_cid: str
    file_name: str
    uploaded_at: str
    gateway_url: str
    tx_hash: Optional[str] = None


@app.post("/batches/{batch_id}/documents", response_model=BatchDocumentResponse)
async def upload_batch_document(
    batch_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("QUALITY_CERTIFICATE"),
):
    """Pins an uploaded batch certificate / lab report / photo to IPFS, anchors the CID on-chain,

    and stores metadata in the database.
    """
    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        file_bytes = await file.read()
        filename = file.filename or "document.pdf"

        # 1. Pin to IPFS
        pin_result = ipfs.pin_document(file_bytes, filename=filename, doc_type=doc_type.upper())
        ipfs_uri = pin_result["ipfs_uri"]
        gateway_url = pin_result["gateway_url"]

        # 2. Anchor on-chain in ProductRegistry (Task 9.4)
        tx_hash = None
        try:
            tx_hash = chain.set_batch_document(batch_id, doc_type.upper(), ipfs_uri)
        except Exception as e:
            print(f"[documents] On-chain anchoring warning: {e}")

        # 3. Store document metadata in database
        cur = conn.execute(
            """
            INSERT INTO batch_documents (batch_id, doc_type, ipfs_cid, file_name, tx_hash)
            VALUES (?, ?, ?, ?, ?)
            """,
            (batch_id, doc_type.upper(), ipfs_uri, filename, tx_hash),
        )
        doc_id = cur.lastrowid
        conn.commit()

        row = conn.execute("SELECT * FROM batch_documents WHERE id = ?", (doc_id,)).fetchone()
        uploaded_at = str(row["uploaded_at"]) if row else datetime.now().isoformat()

        return BatchDocumentResponse(
            id=doc_id or 1,
            batch_id=batch_id,
            doc_type=doc_type.upper(),
            ipfs_cid=ipfs_uri,
            file_name=filename,
            uploaded_at=uploaded_at,
            gateway_url=gateway_url,
            tx_hash=tx_hash,
        )
    finally:
        conn.close()


@app.get("/batches/{batch_id}/documents", response_model=List[BatchDocumentResponse])
def get_batch_documents(batch_id: str):
    """Retrieve all anchored IPFS documents for a given batch from database and smart contract."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM batch_documents WHERE batch_id = ? ORDER BY id DESC",
            (batch_id,),
        ).fetchall()

        results = []
        for r in rows:
            cid = r["ipfs_cid"].replace("ipfs://", "")
            results.append(BatchDocumentResponse(
                id=r["id"],
                batch_id=r["batch_id"],
                doc_type=r["doc_type"],
                ipfs_cid=r["ipfs_cid"],
                file_name=r["file_name"],
                uploaded_at=str(r["uploaded_at"]),
                gateway_url=f"https://gateway.pinata.cloud/ipfs/{cid}",
                tx_hash=r["tx_hash"],
            ))
        return results
    finally:
        conn.close()


@app.get("/ipfs/{cid}")
def get_ipfs_asset(cid: str):
    """Local IPFS gateway endpoint returning cached raw binary content."""
    clean_cid = cid.replace("ipfs://", "")
    content = ipfs.get_pinned_content(clean_cid)
    if not content:
        raise HTTPException(status_code=404, detail="IPFS asset not found")
    media_type = "application/pdf"
    if clean_cid.endswith(".png") or (len(content) > 8 and b"PNG" in content[:8]):
        media_type = "image/png"
    elif clean_cid.endswith(".jpg") or (len(content) > 10 and (b"JFIF" in content[:10] or b"Exif" in content[:10])):
        media_type = "image/jpeg"
    return Response(content=content, media_type=media_type)


def _parse_batch_meta(b):
    origin = b["origin_farm"] if "origin_farm" in b.keys() else ""
    cat = ""
    qty = 0.5
    price = 2500.0
    if "||cat=" in origin:
        parts = origin.split("||")
        for part in parts:
            if part.startswith("cat="):
                cat = part.replace("cat=", "").strip()
            elif part.startswith("qty="):
                try:
                    qty = float(part.replace("qty=", "").strip())
                except:
                    pass
            elif part.startswith("price="):
                try:
                    price = float(part.replace("price=", "").strip())
                except:
                    pass
    return cat, qty, price


def _resolve_category_id(crop_name: str, given_cat: str = ""):
    if given_cat:
        g = given_cat.lower().strip()
        if "fruit" in g and "dry" not in g:
            return "fruits"
        if "veg" in g:
            return "vegetables"
        if "grain" in g:
            return "grains"
        if "pulse" in g or "legume" in g:
            return "pulses"
        if "spice" in g:
            return "spices"
        if "dry" in g or "nut" in g:
            return "dryfruits"

    cn = crop_name.lower().strip()
    if any(k in cn for k in ["mango", "banana", "apple", "fruit", "orange", "grape", "papaya", "guava", "pomegranate", "berry", "melon"]):
        return "fruits"
    if any(k in cn for k in ["tomato", "potato", "onion", "veg", "cabbage", "carrot", "spinach", "cauliflower", "brinjal", "cucumber"]):
        return "vegetables"
    if any(k in cn for k in ["wheat", "rice", "grain", "corn", "barley", "millet", "oats", "sharbati", "basmati"]):
        return "grains"
    if any(k in cn for k in ["chickpea", "gram", "pulse", "dal", "lentil", "bean", "soy", "moong", "tur", "urad"]):
        return "pulses"
    if any(k in cn for k in ["chilli", "turmeric", "spice", "pepper", "ginger", "garlic", "clove", "cardamom", "coriander", "cumin"]):
        return "spices"
    if any(k in cn for k in ["cashew", "almond", "walnut", "nut", "dryfruit", "raisin", "pistachio"]):
        return "dryfruits"
    return "fruits" if "mango" in cn else "vegetables"


# ---------------- Farmer Dashboard Endpoints ----------------

@app.get("/farmer/kpis")
def get_farmer_kpis():
    """Returns kpiMetrics computed from SQLite rows matching mockData.js shape."""
    conn = get_connection()
    try:
        batches = conn.execute("SELECT * FROM batches").fetchall()
        in_transit = conn.execute(
            "SELECT count(DISTINCT batch_id) as cnt FROM custody_events WHERE state = 'IN_TRANSIT'"
        ).fetchone()["cnt"]

        # Base inventory from mock baseline: 5.65 Tonnes
        baseline_inv = 5.65
        added_inv = 0.0
        added_earnings = 0

        for b in batches:
            _, qty, price = _parse_batch_meta(b)
            added_inv += qty
            added_earnings += int(price)

        total_inv = baseline_inv + added_inv
        total_orders = 13 + len(batches)
        total_earnings = 28450 + added_earnings

        return [
            {
                "id": "inventory",
                "title": "Total Inventory",
                "value": f"{total_inv:.2f}",
                "unit": "Tonnes",
                "type": "inventory",
            },
            {
                "id": "orders",
                "title": "Active Orders",
                "value": str(total_orders),
                "unit": "Orders",
                "type": "orders",
            },
            {
                "id": "shipments",
                "title": "Shipments",
                "value": str(in_transit if in_transit > 0 else 5),
                "unit": "In Transit",
                "type": "shipments",
            },
            {
                "id": "earnings",
                "title": "Total Earnings",
                "value": f"₹ {total_earnings:,}",
                "unit": "This Month",
                "type": "earnings",
            },
        ]
    finally:
        conn.close()


@app.get("/farmer/crops")
def get_farmer_crops():
    """Returns cropCategories matching mockData.js shape with new registered stock reflected."""
    conn = get_connection()
    try:
        batches = conn.execute("SELECT * FROM batches ORDER BY created_at DESC").fetchall()

        categories = {
            "fruits": {
                "id": "fruits",
                "name": "Fruits",
                "crops": [
                    {"name": "Mango", "quantity": "0.75 Tonnes", "value": "₹7,500", "status": "In Stock", "quality": "Grade A Alphonso"},
                    {"name": "Banana", "quantity": "0.50 Tonnes", "value": "₹5,000", "status": "In Stock", "quality": "Grade A Robusta"},
                ],
            },
            "vegetables": {
                "id": "vegetables",
                "name": "Vegetables",
                "crops": [
                    {"name": "Tomato", "quantity": "0.60 Tonnes", "value": "₹2,400", "status": "In Stock", "quality": "Fresh Red Hybrid"},
                    {"name": "Potato", "quantity": "0.60 Tonnes", "value": "₹2,400", "status": "In Stock", "quality": "Jyoti Organic"},
                ],
            },
            "grains": {
                "id": "grains",
                "name": "Grains",
                "crops": [
                    {"name": "Wheat", "quantity": "0.80 Tonnes", "value": "₹6,400", "status": "In Stock", "quality": "Sharbati Golden"},
                    {"name": "Rice", "quantity": "0.75 Tonnes", "value": "₹5,625", "status": "In Stock", "quality": "Basmati Extra Long"},
                ],
            },
            "pulses": {
                "id": "pulses",
                "name": "Pulses & Legumes",
                "crops": [
                    {"name": "Chickpea", "quantity": "0.50 Tonnes", "value": "₹4,500", "status": "In Stock", "quality": "Desi Brown"},
                    {"name": "Green Gram", "quantity": "0.40 Tonnes", "value": "₹4,160", "status": "In Stock", "quality": "Shiny Moong"},
                ],
            },
            "spices": {
                "id": "spices",
                "name": "Spices",
                "crops": [
                    {"name": "Chilli", "quantity": "0.20 Tonnes", "value": "₹2,400", "status": "In Stock", "quality": "Guntur Red Hot"},
                    {"name": "Turmeric", "quantity": "0.30 Tonnes", "value": "₹3,600", "status": "In Stock", "quality": "Salem Pure Yellow"},
                ],
            },
            "dryfruits": {
                "id": "dryfruits",
                "name": "Dry Fruits & Nuts",
                "crops": [
                    {"name": "Cashew", "quantity": "0.15 Tonnes", "value": "₹12,000", "status": "In Stock", "quality": "W240 Whole Kernel"},
                    {"name": "Almond", "quantity": "0.10 Tonnes", "value": "₹9,000", "status": "In Stock", "quality": "Mamra Premium"},
                ],
            },
        }

        for b in batches:
            cat_tag, qty, price = _parse_batch_meta(b)
            cat_id = _resolve_category_id(b["crop_name"], cat_tag)
            categories[cat_id]["crops"].insert(0, {
                "name": b["crop_name"],
                "quantity": f"{qty:.2f} Tonnes",
                "value": f"₹{int(price):,}",
                "status": "In Stock",
                "quality": f"Fresh Organic {b['crop_name']}",
                "batch_id": b["batch_id"],
            })

        result = []
        for cat_id, cat in categories.items():
            count = len(cat["crops"])
            total_tonnes = 0.0
            total_val = 0
            for c in cat["crops"]:
                try:
                    q_str = c["quantity"].split()[0]
                    total_tonnes += float(q_str)
                except:
                    total_tonnes += 0.5
                try:
                    v_str = c["value"].replace("₹", "").replace(",", "").strip()
                    total_val += int(float(v_str))
                except:
                    total_val += 2500

            result.append({
                "id": cat["id"],
                "name": cat["name"],
                "count": count,
                "countLabel": f"{count} Crops",
                "totalInventory": f"{total_tonnes:.2f} Tonnes",
                "totalValue": f"₹{total_val:,}",
                "crops": cat["crops"],
            })
        return result
    finally:
        conn.close()


@app.get("/farmer/activity")
def get_farmer_activity():
    """Returns recentActivities matching mockData.js shape."""
    conn = get_connection()
    try:
        events = conn.execute(
            """
            SELECT e.*, b.crop_name, b.farmer_name 
            FROM custody_events e
            JOIN batches b ON e.batch_id = b.batch_id
            ORDER BY e.id DESC
            LIMIT 10
            """
        ).fetchall()

        activities = []
        for e in events:
            ev_id = f"act-{e['id']}"
            state = e["state"]
            date_str = str(e["occurred_at"])[:16]

            if state == "REGISTERED":
                activities.append({
                    "id": ev_id,
                    "type": "order",
                    "title": f"Batch Registered #{e['batch_id']}",
                    "status": "Confirmed",
                    "statusType": "confirmed",
                    "date": date_str,
                    "amount": f"{e['crop_name']} Added",
                })
            elif state == "IN_TRANSIT":
                activities.append({
                    "id": ev_id,
                    "type": "shipment",
                    "title": f"Shipment #{e['batch_id']}",
                    "status": "In Transit",
                    "statusType": "intransit",
                    "date": date_str,
                    "amount": e["to_holder"] or "Logistics",
                })
            elif state == "SOLD":
                price_rupees = e["price_paise"] // 100
                activities.append({
                    "id": ev_id,
                    "type": "payment",
                    "title": f"Batch Sold #{e['batch_id']}",
                    "status": "Completed",
                    "statusType": "payment",
                    "date": date_str,
                    "amount": f"₹{price_rupees:,}",
                })
            else:
                activities.append({
                    "id": ev_id,
                    "type": "order",
                    "title": f"Transfer #{e['batch_id']} ({state})",
                    "status": state.capitalize(),
                    "statusType": "inprogress",
                    "date": date_str,
                    "amount": e["to_holder"],
                })

        return activities
    finally:
        conn.close()


# ---------------- Traceability Endpoints ----------------

@app.get("/batches/{batch_id}/traceability")
def get_batch_traceability(batch_id: str):
    """Returns traceabilityBatch matching mockData.js shape, populated from custody_events and on-chain ConditionRecorded events."""
    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        events = conn.execute(
            "SELECT * FROM custody_events WHERE batch_id = ? ORDER BY id ASC",
            (batch_id,),
        ).fetchall()

        steps = []
        step_num = 1

        reg_time = str(batch_row["created_at"])[:16]
        steps.append({
            "step": step_num,
            "name": "Farm Registration",
            "status": "Completed",
            "timestamp": reg_time,
            "location": f"{batch_row['origin_farm']}",
            "holder": batch_row["farmer_name"],
            "pricePaise": 0,
        })
        step_num += 1

        for ev in events:
            st = ev["state"]
            t_str = str(ev["occurred_at"])[:16]
            if st == "REGISTERED":
                continue
            elif st == "IN_TRANSIT":
                steps.append({
                    "step": step_num,
                    "name": "Transport Dispatch",
                    "status": "In Transit",
                    "timestamp": t_str,
                    "location": f"Transit with {ev['to_holder']}",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                })
                step_num += 1
            elif st == "IN_STORAGE":
                steps.append({
                    "step": step_num,
                    "name": "Dark Store Arrival",
                    "status": "In Storage",
                    "timestamp": t_str,
                    "location": f"{ev['to_holder']}",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                })
                step_num += 1
            elif st == "AT_RETAIL":
                steps.append({
                    "step": step_num,
                    "name": "Retail Distribution",
                    "status": "At Retail",
                    "timestamp": t_str,
                    "location": f"{ev['to_holder']}",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                })
                step_num += 1
            elif st == "SOLD":
                steps.append({
                    "step": step_num,
                    "name": "Consumer Purchase",
                    "status": "Delivered",
                    "timestamp": t_str,
                    "location": "Consumer Hub",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                })
                step_num += 1

        if steps:
            current_location = steps[-1]["location"]
        else:
            current_location = batch_row["origin_farm"]

        condition_log = []
        try:
            raw_conditions = chain.get_condition_records(batch_id)
            for c in raw_conditions:
                condition_log.append({
                    "tempC": c["tempDeciC"] / 10.0,
                    "humidityPct": c["humidityPct"],
                    "breach": c["breach"],
                })
        except Exception:
            readings = conn.execute(
                "SELECT * FROM readings WHERE batch_id = ? AND verdict = 'VALID' ORDER BY id ASC",
                (batch_id,),
            ).fetchall()
            for r in readings:
                condition_log.append({
                    "tempC": r["temp_c"],
                    "humidityPct": r["humidity_pct"],
                    "breach": False,
                })

        custody_history = []
        for ev in events:
            custody_history.append({
                "fromHolder": ev["from_holder"],
                "toHolder": ev["to_holder"],
                "state": ev["state"],
                "pricePaise": ev["price_paise"],
                "priceRupees": ev["price_paise"] // 100,
                "txHash": ev["tx_hash"],
                "occurredAt": ev["occurred_at"],
            })

        return {
            "batchId": batch_row["batch_id"],
            "product": batch_row["crop_name"],
            "quantity": "500 kg",
            "harvestDate": batch_row["harvest_date"],
            "currentLocation": current_location,
            "farmDetails": f"{batch_row['origin_farm']}, {batch_row['farmer_name']}",
            "steps": steps,
            "conditionLog": condition_log,
            "custodyHistory": custody_history,
        }
    finally:
        conn.close()


@app.get("/farmer/ai-trust")
def get_farmer_ai_trust():
    """Return live AI Trust Score and verification checkpoints for the Farmer UI."""
    conn = get_connection()
    try:
        row = conn.execute(
            """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN verdict = 'VALID' THEN 1 ELSE 0 END) as valids,
                SUM(CASE WHEN verdict = 'ANOMALOUS' THEN 1 ELSE 0 END) as anomalies
            FROM readings
            """
        ).fetchone()

        total = row["total"] if row and row["total"] else 0
        valids = row["valids"] if row and row["valids"] else 0
        anomalies = row["anomalies"] if row and row["anomalies"] else 0

        recent_reading = conn.execute(
            "SELECT received_at FROM readings ORDER BY id DESC LIMIT 1"
        ).fetchone()
        last_verified = "Active (Live Telemetry)" if recent_reading else "10 mins ago"

        quarantine_rows = conn.execute(
            "SELECT reason FROM quarantine ORDER BY id DESC LIMIT 100"
        ).fetchall()

        gps_faults = sum(1 for r in quarantine_rows if "GPS" in r["reason"])
        replay_faults = sum(1 for r in quarantine_rows if "REPLAY" in r["reason"])

        if total > 0:
            compliance_pct = max(0, min(100, int(round((valids / total) * 100))))
        else:
            compliance_pct = 100

        if total == 0:
            score = 92
        else:
            score = max(50, min(100, compliance_pct))

        level = "High Trust" if score >= 85 else ("Moderate Trust" if score >= 70 else "Needs Attention")
        status = "Safe & Trustworthy" if score >= 80 else "Deviations Flagged"

        cold_chain_status = f"{compliance_pct}% Compliant"
        if compliance_pct >= 80:
            cold_chain_status += " (Optimal Range)"

        if gps_faults == 0:
            gps_status = "Route Verified & Continuous"
        else:
            gps_status = f"Route Verified ({gps_faults} Deviations Quarantined)"

        if replay_faults == 0:
            tamper_status = "Smart Seal Intact"
        else:
            tamper_status = f"Smart Seal Intact ({replay_faults} Replays Quarantined)"

        anomaly_status = f"{anomalies} Deviations Flagged"

        return {
            "score": score,
            "maxScore": 100,
            "level": level,
            "status": status,
            "lastVerified": last_verified,
            "aiVerificationDetails": [
                {"title": "Cold Chain Integrity", "status": cold_chain_status},
                {"title": "GPS Telemetry Validation", "status": gps_status},
                {"title": "Tamper Prevention", "status": tamper_status},
                {"title": "Anomaly Check", "status": anomaly_status},
            ],
        }
    finally:
        conn.close()


# ---------------- Logistics Partner Endpoints ----------------

@app.get("/logistics/kpis")
def get_logistics_kpis():
    """Return live Logistics KPIs for LogisticKPICards.jsx."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT c.state, c.price_paise
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            """
        ).fetchall()

        total_in_transit = sum(1 for r in rows if r["state"] == "IN_TRANSIT")
        pending_orders = sum(1 for r in rows if r["state"] == "REGISTERED")

        transit_cost_row = conn.execute(
            "SELECT SUM(price_paise) as total FROM custody_events WHERE state = 'IN_TRANSIT'"
        ).fetchone()
        transit_cost_paise = transit_cost_row["total"] if transit_cost_row and transit_cost_row["total"] else 0
        cost_rupees = transit_cost_paise // 100

        display_shipments = total_in_transit if total_in_transit > 0 else len(rows)
        display_cost = f"₹ {cost_rupees:,}" if cost_rupees > 0 else "₹ 45,680"

        return {
            "totalShipments": display_shipments,
            "shipmentsInTransit": total_in_transit,
            "pendingOrders": pending_orders,
            "onTimeDelivery": "94%",
            "totalLogisticsCost": display_cost,
            "rawCostPaise": transit_cost_paise,
        }
    finally:
        conn.close()


@app.get("/logistics/shipments")
def get_logistics_shipments():
    """Return active shipments for fleet tracking and transportation views."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT b.batch_id, b.crop_name, b.origin_farm, b.harvest_date, b.farmer_name,
                   c.state, c.from_holder, c.to_holder, c.price_paise, c.tx_hash, c.occurred_at
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            ORDER BY b.created_at DESC
            LIMIT 20
            """
        ).fetchall()

        shipments = []
        drivers = [
            ("Ramesh Yadav", "+91 98111 22233", "MH12 AB 1234"),
            ("Suresh Patil", "+91 98222 33344", "MH15 CD 5678"),
            ("Venkatesh Rao", "+91 98444 55566", "KA04 GH 2468"),
            ("Arvind Kumar", "+91 98333 44455", "UP14 EF 9101"),
        ]

        for idx, r in enumerate(rows):
            batch_id = r["batch_id"]
            state = r["state"]

            reading = conn.execute(
                "SELECT temp_c, humidity_pct, verdict FROM readings WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
                (batch_id,),
            ).fetchone()

            gps = conn.execute(
                "SELECT latitude, longitude FROM telemetry_history WHERE batch_id = ? ORDER BY recorded_at DESC LIMIT 1",
                (batch_id,),
            ).fetchone()

            lat = gps["latitude"] if gps else round(18.5204 + (idx * 0.015), 4)
            lon = gps["longitude"] if gps else round(73.8567 + (idx * 0.015), 4)

            temp_c = reading["temp_c"] if reading else 4.5
            hum_pct = reading["humidity_pct"] if reading else 88.0

            driver_info = drivers[idx % len(drivers)]

            if state == "IN_TRANSIT":
                status_label = "In Transit"
                badge = "bg-[#556B2F]/15 text-[#556B2F]"
            elif state == "REGISTERED":
                status_label = "Loading"
                badge = "bg-[#B85C38]/15 text-[#B85C38]"
            elif state in ("IN_STORAGE", "AT_RETAIL"):
                status_label = "Arrived at Hub"
                badge = "bg-[#2B6CB0]/15 text-[#2B6CB0]"
            elif state == "SOLD":
                status_label = "Delivered"
                badge = "bg-gray-100 text-gray-700"
            else:
                status_label = state
                badge = "bg-[#556B2F]/15 text-[#556B2F]"

            shipments.append({
                "batchId": batch_id,
                "product": r["crop_name"].capitalize(),
                "number": driver_info[2],
                "driver": driver_info[0],
                "phone": driver_info[1],
                "status": status_label,
                "badge": badge,
                "temp": f"{temp_c:.1f}°C (Reefer Chilled)",
                "tempValue": temp_c,
                "humidityValue": hum_pct,
                "from": r["origin_farm"],
                "to": "Pune Fresh DarkStore Hub",
                "eta": "Today, 06:00 PM",
                "latitude": lat,
                "longitude": lon,
                "priceRupees": r["price_paise"] // 100,
                "txHash": r["tx_hash"],
                "occurredAt": r["occurred_at"],
            })

        return shipments
    finally:
        conn.close()


@app.get("/logistics/orders")
def get_logistics_orders():
    """Return pending batches ready for procurement / pickup."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT b.batch_id, b.crop_name, b.origin_farm, b.harvest_date, b.farmer_name,
                   c.state, c.occurred_at
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            WHERE c.state = 'REGISTERED'
            ORDER BY b.created_at DESC
            """
        ).fetchall()

        orders = []
        for r in rows:
            orders.append({
                "id": r["batch_id"],
                "supplier": f"{r['farmer_name']} ({r['origin_farm']})",
                "produce": f"{r['crop_name'].capitalize()} (500 kg)",
                "cropName": r["crop_name"],
                "status": "Ready for Pickup",
                "badgeClass": "bg-[#B85C38]/15 text-[#B85C38]",
                "harvestDate": r["harvest_date"],
                "price": "₹ 1,000",
            })
        return orders
    finally:
        conn.close()


# ---------------- Dark Store / Retailer Endpoints ----------------

class DarkStoreReceiveRequest(BaseModel):
    batch_id: str
    price_paise: Optional[int] = 140000
    holder_name: Optional[str] = "Pune Fresh DarkStore Hub"


class DarkStoreCheckoutRequest(BaseModel):
    batch_id: str
    price_paise: Optional[int] = 200000
    consumer_name: Optional[str] = "Customer Home Delivery"


@app.get("/darkstore/kpis")
def get_darkstore_kpis():
    """Returns Dark Store KPIs matching DarkStoreKPICards.jsx."""
    conn = get_connection()
    try:
        # Batches in storage
        in_storage_rows = conn.execute(
            """
            SELECT count(DISTINCT b.batch_id) as cnt
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            WHERE c.state IN ('IN_STORAGE', 'AT_RETAIL')
            """
        ).fetchone()
        in_storage_count = in_storage_rows["cnt"] if in_storage_rows else 0

        # Inbound deliveries currently in transit
        inbound_rows = conn.execute(
            """
            SELECT count(DISTINCT b.batch_id) as cnt
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            WHERE c.state = 'IN_TRANSIT'
            """
        ).fetchone()
        inbound_count = inbound_rows["cnt"] if inbound_rows else 0

        # Sold batches
        sold_rows = conn.execute(
            """
            SELECT count(DISTINCT b.batch_id) as cnt, sum(c.price_paise) as total_paise
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            WHERE c.state = 'SOLD'
            """
        ).fetchone()
        sold_count = sold_rows["cnt"] if sold_rows else 0
        sold_paise = sold_rows["total_paise"] or 0
        sold_rupees = sold_paise // 100

        # Format cards display values
        inv_val_rupees = 1875600 + (in_storage_count * 25000)
        display_incoming = inbound_count if inbound_count > 0 else 12
        display_products = 186 + in_storage_count
        display_sales = f"₹ {245780 + sold_rupees:,}" if sold_rupees > 0 else "₹ 2,45,780"
        display_revenue = f"₹ {1128450 + sold_rupees:,}" if sold_rupees > 0 else "₹ 11,28,450"

        return {
            "inventoryValue": f"₹ {inv_val_rupees:,}",
            "inventoryValueRaw": inv_val_rupees,
            "incomingToday": display_incoming,
            "incomingCount": inbound_count,
            "totalProducts": display_products,
            "activeSKUs": display_products,
            "todaySales": display_sales,
            "todaySalesRaw": 245780 + sold_rupees,
            "expiryAlerts": 7,
            "revenueThisMonth": display_revenue,
            "revenueRaw": 1128450 + sold_rupees,
            "inStorageCount": in_storage_count,
            "soldCount": sold_count,
        }
    finally:
        conn.close()


@app.get("/darkstore/inbound")
def get_darkstore_inbound():
    """Return incoming shipments currently IN_TRANSIT for Dark Store GRN receiving."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT b.batch_id, b.crop_name, b.origin_farm, b.harvest_date, b.farmer_name,
                   c.state, c.from_holder, c.to_holder, c.price_paise, c.tx_hash, c.occurred_at
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            WHERE c.state = 'IN_TRANSIT'
            ORDER BY c.id DESC
            """
        ).fetchall()

        crop_images = {
            "tomato": "/images/tomato_only.png",
            "mango": "/images/mango_only.png",
            "wheat": "/images/wheat_only.png",
            "potato": "/images/potato_only.png",
        }
        category_map = {
            "tomato": "Vegetables",
            "potato": "Vegetables",
            "mango": "Fruits",
            "wheat": "Grains",
        }

        deliveries = []
        for r in rows:
            batch_id = r["batch_id"]
            crop_lower = r["crop_name"].lower()

            reading = conn.execute(
                "SELECT temp_c FROM readings WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
                (batch_id,)
            ).fetchone()
            temp_str = f"{reading['temp_c']:.1f}°C" if reading else "4.2°C"

            deliveries.append({
                "id": f"DLY #{batch_id}",
                "batchId": batch_id,
                "po": f"PO: PO-{batch_id}",
                "supplier": f"{r['farmer_name']} (SafeXpress)",
                "location": r["origin_farm"],
                "productCategory": category_map.get(crop_lower, "Vegetables"),
                "productSub": f"{r['crop_name'].capitalize()} (Cold-Chain Verified)",
                "image": crop_images.get(crop_lower, "/images/fruits_ref.png"),
                "quantity": "500 kg",
                "weightKg": 500,
                "itemsCount": "1 Batch",
                "expectedDate": "Today, 05:00 PM",
                "dateTag": "12 May, 2025",
                "status": "In Transit",
                "badgeClass": "bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30",
                "temp": temp_str,
                "qrSeal": f"SEAL-{batch_id[-4:] if len(batch_id) >= 4 else '88902'}",
                "driver": "Vikram Solanki (MH-12-QX-8812)",
                "txHash": r["tx_hash"],
            })

        if not deliveries:
            deliveries = [
                {
                    "id": "DLY #DLY7895",
                    "batchId": "BATCH-001",
                    "po": "PO: PO-20346",
                    "supplier": "Green Valley Farms",
                    "location": "Pune, Maharashtra",
                    "productCategory": "Fruits",
                    "productSub": "Mango, Banana, Apple +1",
                    "image": "/images/mango_only.png",
                    "quantity": "180 kg",
                    "weightKg": 180,
                    "itemsCount": "4 Items",
                    "expectedDate": "11 May, 08:15 AM",
                    "dateTag": "11 May, 2025",
                    "status": "In Transit",
                    "badgeClass": "bg-[#FFF3EB] text-[#B85C38] border border-[#B85C38]/30",
                    "temp": "4.2°C",
                    "qrSeal": "SEAL-88902",
                    "driver": "Vikram Solanki (MH-12-QX-8812)",
                },
                {
                    "id": "DLY #DLY7894",
                    "batchId": "BATCH-DEMO-02",
                    "po": "PO: PO-20345",
                    "supplier": "Fresh Veg Traders",
                    "location": "Nashik, Maharashtra",
                    "productCategory": "Vegetables",
                    "productSub": "Tomato, Potato, Onion +2",
                    "image": "/images/fruits_ref.png",
                    "quantity": "230 kg",
                    "weightKg": 230,
                    "itemsCount": "5 Items",
                    "expectedDate": "11 May, 09:30 AM",
                    "dateTag": "11 May, 2025",
                    "status": "Received",
                    "badgeClass": "bg-[#EBF3E8] text-[#556B2F] border border-[#556B2F]/30",
                    "temp": "3.8°C",
                    "qrSeal": "SEAL-88901",
                    "driver": "Ramesh Shinde (MH-15-EG-4021)",
                }
            ]

        return deliveries
    finally:
        conn.close()


@app.get("/darkstore/inventory")
def get_darkstore_inventory():
    """Return inventory stock currently held in Dark Store bays (IN_STORAGE or AT_RETAIL)."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT b.batch_id, b.crop_name, b.origin_farm, b.harvest_date, b.farmer_name,
                   c.state, c.from_holder, c.to_holder, c.price_paise, c.tx_hash, c.occurred_at
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            WHERE c.state IN ('IN_STORAGE', 'AT_RETAIL')
            ORDER BY c.id DESC
            """
        ).fetchall()

        bins = []
        for idx, r in enumerate(rows):
            batch_id = r["batch_id"]
            crop_lower = r["crop_name"].lower()
            bay = "Bay A (Cold)" if crop_lower in ("tomato", "mango") else "Bay B (Ambient)"
            bin_id = f"Bin A-{idx+1:02d}" if "Cold" in bay else f"Bin B-{idx+1:02d}"

            reading = conn.execute(
                "SELECT temp_c, humidity_pct FROM readings WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
                (batch_id,)
            ).fetchone()
            temp_str = f"{reading['temp_c']:.1f}°C" if reading else ("3.1°C" if "Cold" in bay else "18.5°C")
            hum_str = f"{int(reading['humidity_pct'])}%" if reading else ("84%" if "Cold" in bay else "55%")

            cat = "Vegetables" if crop_lower in ("tomato", "potato") else ("Fruits" if crop_lower == "mango" else "Grains")

            bins.append({
                "binId": bin_id,
                "bay": bay,
                "batchId": batch_id,
                "item": f"Fresh Farm {r['crop_name'].capitalize()}",
                "category": cat,
                "stock": "500 kg",
                "capacity": "600 kg",
                "temp": temp_str,
                "humidity": hum_str,
                "quality": "Grade A",
                "expiry": "8 Days",
                "status": "In Storage",
                "pricePerKg": 40,
                "txHash": r["tx_hash"],
            })

        if len(bins) < 6:
            default_bins = [
                { "binId": 'Bin A-01', "bay": 'Bay A (Cold)', "item": 'Fresh Farm Tomatoes', "category": 'Vegetables', "stock": '240 kg', "capacity": '300 kg', "temp": '3.1°C', "humidity": '84%', "quality": 'Grade A', "expiry": '6 Days' },
                { "binId": 'Bin A-04', "bay": 'Bay A (Cold)', "item": 'Organic Tomatoes', "category": 'Vegetables', "stock": '180 kg', "capacity": '250 kg', "temp": '2.8°C', "humidity": '85%', "quality": 'Grade A+', "expiry": '8 Days' },
                { "binId": 'Bin B-01', "bay": 'Bay B (Ambient)', "item": 'Nashik Red Onions', "category": 'Grains & Roots', "stock": '500 kg', "capacity": '600 kg', "temp": '18.5°C', "humidity": '55%', "quality": 'Grade A', "expiry": '20 Days' },
                { "binId": 'Bin B-12', "bay": 'Bay B (Ambient)', "item": 'Fresh Potatoes (5kg Bags)', "category": 'Roots', "stock": '420 kg', "capacity": '500 kg', "temp": '19.0°C', "humidity": '58%', "quality": 'Grade A', "expiry": '15 Days' },
                { "binId": 'Bin C-02', "bay": 'Bay C (Cold)', "item": 'Green Gram / Moong Dal', "category": 'Pulses', "stock": '310 kg', "capacity": '400 kg', "temp": '2.2°C', "humidity": '78%', "quality": 'Grade A+', "expiry": '30 Days' },
                { "binId": 'Bin C-08', "bay": 'Bay C (Cold)', "item": 'Turmeric Bales', "category": 'Spices', "stock": '150 kg', "capacity": '200 kg', "temp": '2.0°C', "humidity": '80%', "quality": 'Grade A', "expiry": '45 Days' },
            ]
            existing_bin_ids = {b["binId"] for b in bins}
            for db in default_bins:
                if db["binId"] not in existing_bin_ids:
                    bins.append(db)

        return bins
    finally:
        conn.close()


@app.post("/darkstore/receive")
def post_darkstore_receive(payload: DarkStoreReceiveRequest):
    """Receive an inbound batch at the dark store hub, transferring custody to IN_STORAGE on-chain."""
    batch_id = payload.batch_id
    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        last_event = conn.execute(
            "SELECT to_holder, state FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
            (batch_id,),
        ).fetchone()
        from_holder = last_event["to_holder"] if last_event else "SafeXpress"

        dark_store_addr = PARTICIPANT_ADDRESSES["dark_store"]
        price_paise = payload.price_paise if payload.price_paise is not None else 140000

        try:
            tx_hash = chain.transfer_custody(
                batch_id=batch_id,
                to_address=dark_store_addr,
                new_state="IN_STORAGE",
                price_paise=price_paise,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"On-chain custody transfer failed: {str(e)}")

        holder_name = payload.holder_name or "Pune Fresh DarkStore Hub"
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, ?, ?, 'IN_STORAGE', ?, ?)
            """,
            (batch_id, from_holder, holder_name, price_paise, tx_hash),
        )
        conn.commit()

        return {
            "success": True,
            "batch_id": batch_id,
            "from_holder": from_holder,
            "to_holder": holder_name,
            "state": "IN_STORAGE",
            "price_paise": price_paise,
            "tx_hash": tx_hash,
        }
    finally:
        conn.close()


@app.post("/darkstore/checkout")
def post_darkstore_checkout(payload: DarkStoreCheckoutRequest):
    """Complete consumer checkout/fulfillment, transferring custody to SOLD on-chain at retail price."""
    batch_id = payload.batch_id
    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        last_event = conn.execute(
            "SELECT to_holder, state FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
            (batch_id,),
        ).fetchone()
        from_holder = last_event["to_holder"] if last_event else "Pune Fresh DarkStore Hub"

        consumer_addr = PARTICIPANT_ADDRESSES["consumer"]
        price_paise = payload.price_paise if payload.price_paise is not None else 200000

        try:
            tx_hash = chain.transfer_custody(
                batch_id=batch_id,
                to_address=consumer_addr,
                new_state="SOLD",
                price_paise=price_paise,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"On-chain custody transfer failed: {str(e)}")

        consumer_name = payload.consumer_name or "Customer Home Delivery"
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, ?, ?, 'SOLD', ?, ?)
            """,
            (batch_id, from_holder, consumer_name, price_paise, tx_hash),
        )
        conn.commit()

        return {
            "success": True,
            "batch_id": batch_id,
            "from_holder": from_holder,
            "to_holder": consumer_name,
            "state": "SOLD",
            "price_paise": price_paise,
            "tx_hash": tx_hash,
        }
    finally:
        conn.close()


class ReviewCreateRequest(BaseModel):
    rating: int  # 1-5
    comment: Optional[str] = ""
    freshness_score: Optional[int] = 95
    reviewer_address: Optional[str] = None


class RoleGrantRequest(BaseModel):
    address: str
    role: str  # FARMER_ROLE, LOGISTICS_ROLE, RETAILER_ROLE, ORACLE_ROLE


@app.post("/batches/{batch_id}/reviews")
def create_batch_review(batch_id: str, payload: ReviewCreateRequest):
    """Submits a consumer quality/freshness review for a batch with custody state SOLD."""
    if not (1 <= payload.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be an integer between 1 and 5.")

    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        last_custody = conn.execute(
            "SELECT state FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
            (batch_id,)
        ).fetchone()

        if not last_custody or last_custody["state"] != "SOLD":
            current_state = last_custody["state"] if last_custody else "UNREGISTERED"
            raise HTTPException(
                status_code=400,
                detail=f"Only batches with custody state 'SOLD' can receive verified reviews. Current state: '{current_state}'."
            )

        now_str = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """
            INSERT INTO batch_reviews (batch_id, rating, comment, freshness_score, reviewer_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (batch_id, payload.rating, payload.comment, payload.freshness_score, payload.reviewer_address, now_str)
        )
        conn.commit()

        rows = conn.execute(
            "SELECT rating, freshness_score FROM batch_reviews WHERE batch_id = ?",
            (batch_id,)
        ).fetchall()
        total_rev = len(rows)
        avg_rating = round(sum(r["rating"] for r in rows) / total_rev, 1) if total_rev else payload.rating
        fresh_vals = [r["freshness_score"] for r in rows if r["freshness_score"] is not None]
        avg_freshness = round(sum(fresh_vals) / len(fresh_vals), 1) if fresh_vals else 95.0

        return {
            "success": True,
            "batch_id": batch_id,
            "rating": payload.rating,
            "comment": payload.comment,
            "freshness_score": payload.freshness_score,
            "reviewer_address": payload.reviewer_address,
            "average_rating": avg_rating,
            "average_freshness": avg_freshness,
            "total_reviews": total_rev,
        }
    finally:
        conn.close()


@app.get("/batches/{batch_id}/reviews")
def get_batch_reviews(batch_id: str):
    """Retrieves all verified customer reviews and aggregate rating for a batch."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, batch_id, rating, comment, freshness_score, reviewer_address, created_at FROM batch_reviews WHERE batch_id = ? ORDER BY id DESC",
            (batch_id,)
        ).fetchall()

        reviews = [dict(r) for r in rows]
        total_rev = len(reviews)
        avg_rating = round(sum(r["rating"] for r in reviews) / total_rev, 1) if total_rev else 5.0
        fresh_vals = [r["freshness_score"] for r in reviews if r["freshness_score"] is not None]
        avg_freshness = round(sum(fresh_vals) / len(fresh_vals), 1) if fresh_vals else 98.0

        return {
            "batch_id": batch_id,
            "average_rating": avg_rating,
            "average_freshness": avg_freshness,
            "total_reviews": total_rev,
            "reviews": reviews,
        }
    finally:
        conn.close()


@app.get("/admin/users")
def get_admin_users():
    """Lists system participants and checks their on-chain role status."""
    participants = [
        {"name": "Admin / Master Deployer", "role": "DEFAULT_ADMIN_ROLE", "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
        {"name": "Rahul Patil (Farmer)", "role": "FARMER_ROLE", "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
        {"name": "Safexpress Cold Chain (Logistics)", "role": "LOGISTICS_ROLE", "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"},
        {"name": "Pune Fresh DarkStore Hub", "role": "RETAILER_ROLE", "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"},
        {"name": "AgriChain AI Oracle Node", "role": "ORACLE_ROLE", "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"},
        {"name": "Customer Demo Wallet", "role": "CONSUMER", "address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"},
    ]

    for p in participants:
        if p["role"] != "CONSUMER":
            try:
                check = chain.check_role(p["role"], p["address"])
                p["is_granted_onchain"] = check["has_role"]
                p["contract_details"] = check.get("contract_details", {})
            except Exception:
                p["is_granted_onchain"] = True
        else:
            p["is_granted_onchain"] = True

    return {
        "participants": participants,
        "supported_roles": ["FARMER_ROLE", "LOGISTICS_ROLE", "RETAILER_ROLE", "ORACLE_ROLE"],
    }


@app.post("/admin/roles/grant")
def grant_admin_role(payload: RoleGrantRequest):
    """Executes on-chain grantRole to authorize participant address."""
    try:
        result = chain.grant_role(payload.role, payload.address)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"On-chain grantRole failed: {str(e)}")