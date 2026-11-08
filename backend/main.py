import pathlib
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("agrichain")

import chain
import ipfs
from db import init_db, get_connection, DB_PATH, reset_system_data
from common import (
    PARTICIPANT_ADDRESSES,
    SENSOR_CORRUPTION_CODES,
    COLD_CHAIN_POLICY_BREACH_CODES,
    REASON_CODE_LABELS,
    ROLE_TO_ONCHAIN_MAP,
    format_local_timestamp,
    get_local_lan_ip,
    insert_quarantine_entry,
    _parse_batch_meta,
    _resolve_category_id,
    _resolve_crop_icon,
)
from schemas import *

# Ensure trust-layer is importable
TRUST_LAYER_PATH = pathlib.Path(__file__).resolve().parent.parent / "trust-layer"
if str(TRUST_LAYER_PATH) not in sys.path:
    sys.path.insert(0, str(TRUST_LAYER_PATH))

from app.services.anomaly_detector import anomaly_detector


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


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    init_db()
    try:
        init_baseline_anomaly_model()
    except Exception as e:
        print(f"Warning: could not fit baseline anomaly detector: {e}")
    yield


app = FastAPI(
    title="AgriChain Modular API",
    description="Decentralized IoT-Blockchain Supply Chain Framework with AI Gatekeeper",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend communication (Vite on localhost, LAN IP, and mobile devices)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register modular domain routers
from routers import (
    common_router,
    telemetry_router,
    batches_router,
    farmer_router,
    logistics_router,
    darkstore_router,
    consumer_router,
    admin_router,
    demo_router,
)

app.include_router(common_router, tags=["Common & System"])
app.include_router(telemetry_router, tags=["Telemetry & AI Trust"])
app.include_router(batches_router, tags=["Produce Batches & Custody"])
app.include_router(farmer_router, tags=["Farmer Portal"])
app.include_router(logistics_router, tags=["Logistics & Fleet"])
app.include_router(darkstore_router, tags=["Dark Store & Inbound GRN"])
app.include_router(consumer_router, tags=["Consumer & Provenance"])
app.include_router(admin_router, tags=["Admin & RBAC Governance"])
app.include_router(demo_router, tags=["Simulation & God Mode"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
