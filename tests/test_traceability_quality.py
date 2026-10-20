"""
tests/test_traceability_quality.py
----------------------------------
Verifies that GET /batches/{batch_id}/traceability exposes:
1. Dynamic Quality Score (qualityScore, e.g. 35.0 to 99.0)
2. Freshness percentage (freshnessPct, 0 to 100)
3. Quality Grade (qualityGrade, e.g. A+, A, B, C)
All dynamically computed from the verifiable condition log.
"""

import sys
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "trust-layer"))

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_batch_traceability_quality_scoring(client):
    batch_id = f"QTRA-{int(time.time())}"
    # Register batch
    reg_res = client.post("/batches", json={
        "batch_id": batch_id,
        "crop_name": "Organic Tomatoes",
        "quantity_kg": 250.0,
        "origin_farm": "Nashik Valley Orchards",
        "farmer_name": "Suresh Kale",
        "harvest_date": "2026-10-20",
        "price_paise": 3000,
    })
    assert reg_res.status_code == 200

    # Query traceability
    trace_res = client.get(f"/batches/{batch_id}/traceability")
    assert trace_res.status_code == 200
    data = trace_res.json()

    assert data["batchId"] == batch_id
    assert "qualityScore" in data
    assert "freshnessPct" in data
    assert "qualityGrade" in data

    assert 0 <= data["freshnessPct"] <= 100
    assert 0.0 <= data["qualityScore"] <= 100.0
    assert data["qualityGrade"] in ("A+", "A", "B", "C (Degraded)")
