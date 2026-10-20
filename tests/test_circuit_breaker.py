"""
tests/test_circuit_breaker.py
-----------------------------
Verifies smart contract emergency circuit-breaker (Pausable) functionality:
1. GET /admin/contracts/status checks paused status of contracts.
2. POST /admin/contracts/pause pauses a contract on-chain via DEFAULT_ADMIN_ROLE.
3. Mutations on paused contract fail / revert.
4. POST /admin/contracts/unpause restores normal operations.
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


def test_circuit_breaker_pause_and_unpause_api(client):
    target = "ProductRegistry"

    # Step 1: Check initial status
    res = client.get("/admin/contracts/status")
    assert res.status_code == 200
    status = res.json()
    assert target in status

    # Step 2: Pause ProductRegistry
    pause_res = client.post("/admin/contracts/pause", json={"contract": target})
    assert pause_res.status_code == 200
    assert pause_res.json()["paused"] is True
    assert pause_res.json()["success"] is True

    # Verify status reflects paused
    status_paused = client.get("/admin/contracts/status").json()
    assert status_paused[target] is True

    # Step 3: Attempting to register a batch should fail while paused
    batch_id = f"PAUSED-TEST-{int(time.time())}"
    fail_res = client.post("/batches", json={
        "batch_id": batch_id,
        "crop_name": "tomato",
        "quantity_kg": 100.0,
        "origin_farm": "Test Farm",
        "farmer_name": "Test Farmer",
        "harvest_date": "2026-10-20",
        "price_paise": 2000,
    })
    # Should fail with 500 or error detailing pause revert
    assert fail_res.status_code in (400, 500)
    assert "EnforcedPause" in fail_res.text or "pause" in fail_res.text.lower() or "reverted" in fail_res.text.lower()

    # Step 4: Unpause contract
    unpause_res = client.post("/admin/contracts/unpause", json={"contract": target})
    assert unpause_res.status_code == 200
    assert unpause_res.json()["paused"] is False

    # Status must now show not paused
    status_unpaused = client.get("/admin/contracts/status").json()
    assert status_unpaused[target] is False

    # Step 5: Operations succeed once unpaused
    succ_res = client.post("/batches", json={
        "batch_id": batch_id,
        "crop_name": "tomato",
        "quantity_kg": 100.0,
        "origin_farm": "Test Farm",
        "farmer_name": "Test Farmer",
        "harvest_date": "2026-10-20",
        "price_paise": 2000,
    })
    assert succ_res.status_code == 200
    assert succ_res.json()["batch_id"] == batch_id
