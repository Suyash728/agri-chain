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
    with TestClient(app) as test_client:
        yield test_client


def test_system_reset_endpoint_and_clean_slate(client):
    """Verifies that POST /admin/system-reset clears all batch inventory, custody trails,
    telemetry readings, and quarantine records, while preserving accounts and policies.
    """
    # Step 1: Register a temporary test batch to guarantee non-empty DB
    b_id = f"RESET-TEST-{int(time.time())}"
    reg_res = client.post("/batches", json={
        "batch_id": b_id,
        "crop_name": "Organic Tomatoes",
        "quantity_kg": 750.0,
        "origin_farm": "Nashik Organic Farm cluster 4",
        "farmer_name": "Rahul Patil",
        "harvest_date": "2026-10-23",
        "price_paise": 4000,
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"

    # Step 2: Trigger system reset
    reset_res = client.post("/admin/system-reset")
    assert reset_res.status_code == 200
    res_json = reset_res.json()
    assert res_json["status"] == "success"
    assert "report" in res_json
    report = res_json["report"]
    assert report["success"] is True
    assert report["policies_preserved"] is True
    assert "batches" in report["cleared_records"]

    # Step 3: Verify Farmer KPIs are 0
    kpi_res = client.get("/farmer/kpis")
    assert kpi_res.status_code == 200
    kpis = kpi_res.json()
    inv_kpi = next((k for k in kpis if k["id"] == "inventory"), None)
    assert inv_kpi is not None
    assert inv_kpi["value"] == "0.00"

    orders_kpi = next((k for k in kpis if k["id"] == "orders"), None)
    assert orders_kpi is not None
    assert orders_kpi["value"] == "0"

    # Step 4: Verify Logistics KPIs are 0
    log_res = client.get("/logistics/kpis")
    assert log_res.status_code == 200
    log_kpis = log_res.json()
    assert log_kpis["totalShipments"] == 0
    assert log_kpis["shipmentsInTransit"] == 0
    assert log_kpis["pendingOrders"] == 0

    # Step 5: Verify Dark Store KPIs are 0
    ds_res = client.get("/darkstore/kpis")
    assert ds_res.status_code == 200
    ds_kpis = ds_res.json()
    assert ds_kpis["totalProducts"] == 0
    assert ds_kpis["incomingCount"] == 0
    assert ds_kpis["inventoryValueRaw"] == 0

    # Step 6: Verify Participant Accounts and Roles remain intact
    users_res = client.get("/admin/users")
    assert users_res.status_code == 200
    users_data = users_res.json()
    assert "participants" in users_data
    assert len(users_data["participants"]) >= 5
    farmer_acc = next((p for p in users_data["participants"] if p["role"] == "FARMER_ROLE"), None)
    assert farmer_acc is not None
    assert farmer_acc["address"] == "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

    # Step 7: Verify God Mode returns clean slate without 404
    god_res = client.get("/demo/godmode/latest")
    assert god_res.status_code == 200
    god_data = god_res.json()
    assert god_data["success"] is True
    assert god_data["empty"] is True
    assert god_data["farmer"]["quantity_kg"] == 0.0

    # Step 8: Verify a new batch can immediately be registered on the clean slate
    fresh_id = f"FRESH-LOT-{int(time.time())}"
    fresh_res = client.post("/batches", json={
        "batch_id": fresh_id,
        "crop_name": "Ratnagiri Alphonso Mango",
        "quantity_kg": 300.0,
        "origin_farm": "Ratnagiri Coastal Orchards",
        "farmer_name": "Rahul Patil",
        "harvest_date": "2026-10-23",
        "price_paise": 6500,
    })
    assert fresh_res.status_code == 200
    fresh_data = fresh_res.json()
    assert fresh_data["batch_id"] == fresh_id
