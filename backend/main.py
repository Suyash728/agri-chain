import pathlib
import sqlite3
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import chain
from db import get_connection, init_db
from validation import validate_reading

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


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------- Telemetry Models & Route ----------------

class TelemetryRequest(BaseModel):
    batch_id: str
    crop_name: str
    temp_c: float
    humidity_pct: float


class TelemetryResponse(BaseModel):
    verdict: str
    reason: Optional[str] = None
    tx_hash: Optional[str] = None
    reading_id: int


@app.post("/telemetry", response_model=TelemetryResponse)
def post_telemetry(payload: TelemetryRequest):
    """Ingest a telemetry reading with AI trust validation and quarantine."""
    conn = get_connection()
    try:
        cur = conn.execute(
            """
            INSERT INTO readings (batch_id, temp_c, humidity_pct, verdict, tx_hash)
            VALUES (?, ?, ?, 'PENDING', NULL)
            """,
            (payload.batch_id, payload.temp_c, payload.humidity_pct),
        )
        reading_id = cur.lastrowid
        conn.commit()

        verdict, reason = validate_reading(payload.crop_name, payload.temp_c, payload.humidity_pct)

        if verdict == "VALID":
            temp_deci_c = int(round(payload.temp_c * 10))
            humidity_pct_int = int(round(payload.humidity_pct))
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
            )
        else:
            conn.execute(
                "UPDATE readings SET verdict = 'ANOMALOUS' WHERE id = ?",
                (reading_id,),
            )
            conn.execute(
                "INSERT INTO quarantine (reading_id, reason) VALUES (?, ?)",
                (reading_id, reason or "Violated cold-chain threshold"),
            )
            conn.commit()
            return TelemetryResponse(
                verdict="ANOMALOUS",
                reason=reason,
                tx_hash=None,
                reading_id=reading_id,
            )
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