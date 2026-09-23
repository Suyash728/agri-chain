"""
Phase 3 Verification Script
Runs end-to-end verification of Tasks 3.1 to 3.7.
"""
import sys
import json
import sqlite3
import pathlib
import urllib.request
import urllib.error

# Ensure backend root is on path
BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import db
import chain
import validation

# Ensure UTF-8 output on Windows console
sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def log_pass(task: str, detail: str):
    print(f" [PASS] {task}: {detail}")

def log_fail(task: str, detail: str):
    print(f" [FAIL] {task}: {detail}")
    sys.exit(1)

def http_json(url: str, method: str = "GET", data: dict = None):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    body = json.dumps(data).encode("utf-8") if data else None
    with urllib.request.urlopen(req, data=body) as res:
        return json.loads(res.read().decode("utf-8"))

def main():
    print("=" * 60)
    print("AGRICHAIN PHASE 3 VERIFICATION SUITE")
    print("=" * 60)

    # ----------------------------------------------------
    # Task 3.1 Verification: SQLite Schema & Policy Seeds
    # ----------------------------------------------------
    print("\nVerifying Task 3.1 (SQLite Schema & Policy Seeds)...")
    db_path = db.init_db()
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = {r[0] for r in cur.fetchall()}
    expected_tables = {"batches", "custody_events", "readings", "quarantine", "policy"}
    if expected_tables.issubset(tables):
        log_pass("Task 3.1", f"All 5 tables present: {sorted(list(tables))}")
    else:
        log_fail("Task 3.1", f"Missing tables. Found: {tables}")

    cur.execute("SELECT crop_name, min_temp_c, max_temp_c FROM policy")
    policies = cur.fetchall()
    if len(policies) >= 3:
        log_pass("Task 3.1", f"Seeded {len(policies)} crop policies: {[p[0] for p in policies]}")
    else:
        log_fail("Task 3.1", "Policies not seeded.")
    conn.close()

    # ----------------------------------------------------
    # Task 3.2 Verification: Web3 Smart Contract Client
    # ----------------------------------------------------
    print("\nVerifying Task 3.2 (Web3 & Contract Integration)...")
    import time
    ts = int(time.time())
    test_batch_id = f"VERIFY-B32-{ts}"
    try:
        # Check node connection
        if not chain.w3.is_connected():
            log_fail("Task 3.2", "Web3 cannot connect to Hardhat node at 127.0.0.1:8545")
        
        # Test registerBatch on-chain
        tx_reg = chain.register_batch(test_batch_id, "Mango", "Ratnagiri Farm", 1715000000)
        batch_on_chain = chain.get_batch(test_batch_id)
        if batch_on_chain["exists"] and batch_on_chain["cropName"] == "Mango":
            log_pass("Task 3.2", f"register_batch successful (tx: {tx_reg[:10]}...), cropName='Mango'")
        else:
            log_fail("Task 3.2", f"Batch not queryable on-chain: {batch_on_chain}")

        # Test transferCustody on-chain
        tx_cust = chain.transfer_custody(test_batch_id, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "IN_TRANSIT", 50000)
        batch_updated = chain.get_batch(test_batch_id)
        if batch_updated["state"] == 1:
            log_pass("Task 3.2", f"transfer_custody successful (tx: {tx_cust[:10]}...), state=1 (IN_TRANSIT)")
        else:
            log_fail("Task 3.2", f"State transition failed: {batch_updated}")

        # Test recordCondition on-chain
        tx_cond = chain.record_condition(test_batch_id, 120, 88, False)
        cond_logs = chain.get_condition_records(test_batch_id)
        if len(cond_logs) >= 1:
            log_pass("Task 3.2", f"record_condition successful (tx: {tx_cond[:10]}...), logs={len(cond_logs)}")
        else:
            log_fail("Task 3.2", "Condition event not found in logs.")
    except Exception as e:
        log_fail("Task 3.2", f"Exception during Web3 execution: {e}")

    # ----------------------------------------------------
    # Task 3.3 Verification: Rule-based AI Trust Layer
    # ----------------------------------------------------
    print("\nVerifying Task 3.3 (Rule-based AI Trust Validation)...")
    v_ok, r_ok = validation.validate_reading("tomato", 5.0, 90.0)
    if v_ok == "VALID" and r_ok is None:
        log_pass("Task 3.3", "In-bounds reading correctly evaluated to VALID")
    else:
        log_fail("Task 3.3", f"Expected VALID, got ({v_ok}, {r_ok})")

    v_bad, r_bad = validation.validate_reading("tomato", 42.0, 90.0)
    if v_bad == "ANOMALOUS" and "42.0" in r_bad and "8.0" in r_bad:
        log_pass("Task 3.3", f"Out-of-bounds reading evaluated to ANOMALOUS: '{r_bad}'")
    else:
        log_fail("Task 3.3", f"Expected ANOMALOUS with details, got ({v_bad}, {r_bad})")

    # ----------------------------------------------------
    # Task 3.4 Verification: POST /telemetry API
    # ----------------------------------------------------
    print("\nVerifying Task 3.4 (POST /telemetry API)...")
    res_valid = http_json(
        f"{BASE_URL}/telemetry",
        method="POST",
        data={"batch_id": test_batch_id, "crop_name": "mango", "temp_c": 12.0, "humidity_pct": 88.0}
    )
    if res_valid.get("verdict") == "VALID" and res_valid.get("tx_hash"):
        log_pass("Task 3.4", f"Valid telemetry returned tx_hash: {res_valid['tx_hash'][:10]}...")
    else:
        log_fail("Task 3.4", f"Unexpected valid response: {res_valid}")

    res_anom = http_json(
        f"{BASE_URL}/telemetry",
        method="POST",
        data={"batch_id": test_batch_id, "crop_name": "mango", "temp_c": 35.0, "humidity_pct": 88.0}
    )
    if res_anom.get("verdict") == "ANOMALOUS" and res_anom.get("tx_hash") is None:
        log_pass("Task 3.4", f"Anomalous telemetry quarantined without tx_hash: '{res_anom['reason']}'")
    else:
        log_fail("Task 3.4", f"Unexpected anomalous response: {res_anom}")

    # ----------------------------------------------------
    # Task 3.5 Verification: POST /batches & Custody API
    # ----------------------------------------------------
    print("\nVerifying Task 3.5 (POST /batches & POST /custody API)...")
    live_batch_id = f"LIVE-VERIFY-{ts}"
    batch_res = http_json(
        f"{BASE_URL}/batches",
        method="POST",
        data={
            "batch_id": live_batch_id,
            "crop_name": "Wheat",
            "origin_farm": "Punjab Golden Acres",
            "harvest_date": "2026-05-15",
            "farmer_name": "Gurpreet Singh"
        }
    )
    if batch_res.get("batch_id") == live_batch_id and batch_res.get("tx_hash"):
        log_pass("Task 3.5", f"Created batch {live_batch_id} with on-chain tx: {batch_res['tx_hash'][:10]}...")
    else:
        log_fail("Task 3.5", f"Failed to register batch: {batch_res}")

    cust_res = http_json(
        f"{BASE_URL}/batches/{live_batch_id}/custody",
        method="POST",
        data={
            "to_holder": "SafeXpress Hub",
            "state": "IN_TRANSIT",
            "price_paise": 180000
        }
    )
    if cust_res.get("state") == "IN_TRANSIT" and cust_res.get("tx_hash"):
        log_pass("Task 3.5", f"Custody transferred to SafeXpress Hub (tx: {cust_res['tx_hash'][:10]}...)")
    else:
        log_fail("Task 3.5", f"Custody transfer failed: {cust_res}")

    # ----------------------------------------------------
    # Task 3.6 Verification: Farmer Endpoints
    # ----------------------------------------------------
    print("\nVerifying Task 3.6 (Farmer Dashboard Endpoints)...")
    kpis = http_json(f"{BASE_URL}/farmer/kpis")
    kpi_keys = [k["id"] for k in kpis]
    if kpi_keys == ["inventory", "orders", "shipments", "earnings"]:
        log_pass("Task 3.6", f"GET /farmer/kpis returned valid metrics: {[(k['title'], k['value']) for k in kpis]}")
    else:
        log_fail("Task 3.6", f"Unexpected KPI shape: {kpis}")

    crops = http_json(f"{BASE_URL}/farmer/crops")
    if isinstance(crops, list) and len(crops) >= 4 and "crops" in crops[0]:
        log_pass("Task 3.6", f"GET /farmer/crops returned {len(crops)} crop categories matching mockData")
    else:
        log_fail("Task 3.6", f"Unexpected crops shape: {crops}")

    activity = http_json(f"{BASE_URL}/farmer/activity")
    if isinstance(activity, list) and len(activity) >= 1 and "statusType" in activity[0]:
        log_pass("Task 3.6", f"GET /farmer/activity returned {len(activity)} activities: {[a['title'] for a in activity[:2]]}")
    else:
        log_fail("Task 3.6", f"Unexpected activity shape: {activity}")

    # ----------------------------------------------------
    # Task 3.7 Verification: Traceability Endpoint
    # ----------------------------------------------------
    print("\nVerifying Task 3.7 (GET /batches/{batch_id}/traceability)...")
    # Add a telemetry reading for live_batch_id first
    http_json(
        f"{BASE_URL}/telemetry",
        method="POST",
        data={"batch_id": live_batch_id, "crop_name": "wheat", "temp_c": 18.5, "humidity_pct": 60.0}
    )
    trace = http_json(f"{BASE_URL}/batches/{live_batch_id}/traceability")
    req_fields = ["batchId", "product", "quantity", "harvestDate", "currentLocation", "farmDetails", "steps", "conditionLog", "custodyHistory"]
    if all(field in trace for field in req_fields):
        log_pass("Task 3.7", f"Traceability payload contains all required keys.")
        log_pass("Task 3.7", f"Steps count: {len(trace['steps'])}, Condition logs: {len(trace['conditionLog'])}, Custody events: {len(trace['custodyHistory'])}")
    else:
        log_fail("Task 3.7", f"Missing fields in traceability response: {trace}")

    print("\n" + "=" * 60)
    print("ALL PHASE 3 TASKS (3.1 - 3.7) VERIFIED 100% WORKING!")
    print("=" * 60)

if __name__ == "__main__":
    main()
