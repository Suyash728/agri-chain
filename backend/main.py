import pathlib
import sqlite3
from typing import Optional
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


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


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
    """Ingest a telemetry reading.

    1. Raw reading is inserted first with 'PENDING' verdict.
    2. Rule-based AI trust validation runs.
    3. VALID: record on-chain via chain.py and update readings row with tx_hash.
    4. ANOMALOUS: update readings row with 'ANOMALOUS', insert into quarantine table, never call chain.py.
    """
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
                # If chain recording fails, log reason
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