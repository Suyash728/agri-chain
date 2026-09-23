import pathlib
import sqlite3
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
from datetime import datetime, timezone, timedelta
import json

import chain
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


@app.post("/telemetry", response_model=TelemetryResponse)
def post_telemetry(payload: TelemetryRequest):
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


@app.post("/telemetry/evaluate", response_model=EvaluationReport)
def post_telemetry_evaluate(config: Optional[EvaluationConfig] = None):
    """Execute benchmark evaluation across normal and all 7 fault injection categories."""
    output_dir = str(TRUST_LAYER_PATH / "reports" / "figures")
    report = evaluation_service.run_pipeline_evaluation(config=config, output_dir=output_dir)
    return report


# ---------------- Batch & Custody Models & Routes ----------------

class CreateBatchRequest(BaseModel):
    batch_id: str
    crop_name: str
    origin_farm: str
    harvest_date: str
    farmer_name: str
    farmer_address: Optional[str] = None


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

        # Store in SQLite
        conn.execute(
            """
            INSERT INTO batches (batch_id, crop_name, origin_farm, harvest_date, farmer_name)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.batch_id, payload.crop_name, payload.origin_farm, payload.harvest_date, payload.farmer_name),
        )

        # Store initial REGISTERED custody event
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, NULL, ?, 'REGISTERED', 0, ?)
            """,
            (payload.batch_id, payload.farmer_name, tx_hash),
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


# ---------------- Farmer Dashboard Endpoints ----------------

@app.get("/farmer/kpis")
def get_farmer_kpis():
    """Returns kpiMetrics computed from SQLite rows matching mockData.js shape."""
    conn = get_connection()
    try:
        total_batches = conn.execute("SELECT count(*) as cnt FROM batches").fetchone()["cnt"]
        in_transit = conn.execute(
            "SELECT count(DISTINCT batch_id) as cnt FROM custody_events WHERE state = 'IN_TRANSIT'"
        ).fetchone()["cnt"]
        earnings_paise = conn.execute(
            "SELECT sum(price_paise) as total FROM custody_events"
        ).fetchone()["total"] or 0
        earnings_rupees = earnings_paise // 100
        inv_tonnes = total_batches * 0.50

        return [
            {
                "id": "inventory",
                "title": "Total Inventory",
                "value": f"{inv_tonnes:.2f}" if inv_tonnes > 0 else "0.00",
                "unit": "Tonnes",
                "type": "inventory",
            },
            {
                "id": "orders",
                "title": "Active Orders",
                "value": str(total_batches),
                "unit": "Orders",
                "type": "orders",
            },
            {
                "id": "shipments",
                "title": "Shipments",
                "value": str(in_transit),
                "unit": "In Transit",
                "type": "shipments",
            },
            {
                "id": "earnings",
                "title": "Total Earnings",
                "value": f"₹ {earnings_rupees:,}",
                "unit": "This Month",
                "type": "earnings",
            },
        ]
    finally:
        conn.close()


@app.get("/farmer/crops")
def get_farmer_crops():
    """Returns cropCategories matching mockData.js shape."""
    conn = get_connection()
    try:
        batches = conn.execute("SELECT * FROM batches ORDER BY created_at DESC").fetchall()

        crop_group_map = {
            "mango": ("fruits", "Fruits"),
            "banana": ("fruits", "Fruits"),
            "tomato": ("vegetables", "Vegetables"),
            "potato": ("vegetables", "Vegetables"),
            "wheat": ("grains", "Grains"),
            "rice": ("grains", "Grains"),
            "chickpea": ("pulses", "Pulses & Legumes"),
            "green gram": ("pulses", "Pulses & Legumes"),
            "chilli": ("spices", "Spices"),
            "turmeric": ("spices", "Spices"),
            "cashew": ("dryfruits", "Dry Fruits & Nuts"),
            "almond": ("dryfruits", "Dry Fruits & Nuts"),
        }

        categories = {
            "fruits": {"id": "fruits", "name": "Fruits", "crops": []},
            "vegetables": {"id": "vegetables", "name": "Vegetables", "crops": []},
            "grains": {"id": "grains", "name": "Grains", "crops": []},
            "pulses": {"id": "pulses", "name": "Pulses & Legumes", "crops": []},
            "spices": {"id": "spices", "name": "Spices", "crops": []},
            "dryfruits": {"id": "dryfruits", "name": "Dry Fruits & Nuts", "crops": []},
        }

        for b in batches:
            crop_key = b["crop_name"].lower().strip()
            cat_id, _ = crop_group_map.get(crop_key, ("vegetables", "Vegetables"))
            categories[cat_id]["crops"].append({
                "name": b["crop_name"],
                "quantity": "0.50 Tonnes",
                "value": "₹2,500",
                "status": "In Stock",
                "quality": f"Fresh Organic {b['crop_name']}",
            })

        result = []
        for cat_id, cat in categories.items():
            count = len(cat["crops"])
            total_tonnes = count * 0.50
            total_val = count * 2500
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