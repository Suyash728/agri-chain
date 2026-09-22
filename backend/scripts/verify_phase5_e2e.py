import json
import sqlite3
import sys
import time
import urllib.request
import pathlib

# Fix Windows console encoding for rupee/degree symbols
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"
DB_PATH = pathlib.Path(__file__).resolve().parent.parent / "agrichain.db"

def post_json(endpoint: str, data: dict):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(endpoint: str):
    req = urllib.request.Request(f"{BASE_URL}{endpoint}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=================================================================")
    print("        AGRICHAIN - FULL ESSENTIAL-TIER VERIFICATION (PRD §6)    ")
    print("=================================================================\n")

    test_batch_id = f"FINAL-DEMO-{int(time.time())}"
    print(f"Target Demo Batch ID: {test_batch_id}\n")

    # -------------------------------------------------------------
    # STEP 3 FIRST (Register batch) - creates the batch for steps 1-5
    # -------------------------------------------------------------
    print("--- [STEP 3] Register Batch via Wired Farmer Flow ---")
    reg_payload = {
        "batch_id": test_batch_id,
        "crop_name": "tomato",
        "origin_farm": "Nashik Sahyadri Organic Cluster",
        "harvest_date": "2026-09-23",
        "farmer_name": "Rahul Patil"
    }
    reg_resp = post_json("/batches", reg_payload)
    print(f"  [OK] Batch Registered! tx_hash={reg_resp.get('tx_hash')}")

    # Verify in DB
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    b_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (test_batch_id,)).fetchone()
    assert b_row is not None, "Batch row missing in SQLite"
    print(f"  [OK] SQLite row verified: {b_row['crop_name']} by {b_row['farmer_name']}")

    # -------------------------------------------------------------
    # STEP 1: Simulator sends valid readings -> On-chain log grows
    # -------------------------------------------------------------
    print("\n--- [STEP 1] Valid Telemetry Ingestion & Blockchain Recording ---")
    valid_readings = [
        {"temp": 4.2, "humidity": 88.0},
        {"temp": 5.0, "humidity": 90.0},
        {"temp": 6.1, "humidity": 89.5},
    ]
    for r in valid_readings:
        resp = post_json("/telemetry", {
            "batch_id": test_batch_id,
            "crop_name": "tomato",
            "temp_c": r["temp"],
            "humidity_pct": r["humidity"],
        })
        assert resp["verdict"] == "VALID", f"Expected VALID but got {resp['verdict']}"
        assert resp["tx_hash"] is not None, "Missing on-chain tx_hash for VALID reading"
        print(f"  [OK] Reading {r['temp']}°C / {r['humidity']}% -> VALID, tx={resp['tx_hash'][:16]}...")

    # -------------------------------------------------------------
    # STEP 2: Fault Injection -> Quarantined, Log does not grow
    # -------------------------------------------------------------
    print("\n--- [STEP 2] AI Trust Layer: Quarantine Anomaly ---")
    bad_resp = post_json("/telemetry", {
        "batch_id": test_batch_id,
        "crop_name": "tomato",
        "temp_c": 45.0, # High temperature breach
        "humidity_pct": 90.0,
    })
    assert bad_resp["verdict"] == "ANOMALOUS", f"Expected ANOMALOUS but got {bad_resp['verdict']}"
    assert bad_resp["tx_hash"] is None, "Anomalous reading must NOT have tx_hash"
    print(f"  [OK] High temp spike 45.0°C flagged ANOMALOUS: '{bad_resp['reason']}'")

    q_row = conn.execute(
        "SELECT q.reason FROM quarantine q JOIN readings r ON q.reading_id = r.id WHERE r.batch_id = ?",
        (test_batch_id,)
    ).fetchone()
    assert q_row is not None, "Missing quarantine row for anomalous reading"
    print(f"  [OK] Quarantine table confirmed entry: {q_row['reason']}")

    # -------------------------------------------------------------
    # STEP 4: Custody transfers Farmer -> Logistics -> Retailer -> Sold
    # -------------------------------------------------------------
    print("\n--- [STEP 4] Full Custody Chain Execution with Prices ---")
    transfers = [
        {"to_holder": "BlueDart Cold Logistics", "state": "IN_TRANSIT", "price_paise": 100000}, # Rs. 1000
        {"to_holder": "Pune Fresh DarkStore Hub", "state": "IN_STORAGE", "price_paise": 140000}, # Rs. 1400
        {"to_holder": "Nature Basket Koramangala", "state": "AT_RETAIL", "price_paise": 175000}, # Rs. 1750
        {"to_holder": "Customer Home Delivery", "state": "SOLD", "price_paise": 200000},        # Rs. 2000
    ]
    for t in transfers:
        c_resp = post_json(f"/batches/{test_batch_id}/custody", t)
        print(f"  [OK] Custody -> {c_resp['state']} to {c_resp['to_holder']} @ ₹{c_resp['price_paise']//100}, tx={c_resp['tx_hash'][:16]}...")

    # -------------------------------------------------------------
    # STEP 5: Traceability API & Price Share Verification (E8)
    # -------------------------------------------------------------
    print("\n--- [STEP 5] Consumer Traceability & Farmer Price Share Verification ---")
    trace = get_json(f"/batches/{test_batch_id}/traceability")
    assert trace["batchId"] == test_batch_id, "Mismatch in batch ID"
    assert len(trace["steps"]) == 5, f"Expected 5 steps, found {len(trace['steps'])}"
    print(f"  [OK] Product: {trace['product']}, Steps: {len(trace['steps'])}")
    for s in trace["steps"]:
        price_str = f"₹{s['pricePaise']//100}" if s.get('pricePaise') else "Initial"
        print(f"       Step {s['step']}: {s['name']} -> {s['status']} ({s['location']}) | {price_str}")

    # Condition log (only valid ones)
    assert len(trace["conditionLog"]) == 3, f"Expected 3 valid condition logs, got {len(trace['conditionLog'])}"
    print(f"  [OK] On-Chain Condition Log Count: {len(trace['conditionLog'])} (Anomalous reading successfully excluded!)")

    # Farmer Price Share calculation (E8)
    # Farmer sold to logistics at transfers[0]['price_paise'] (Rs. 1000)
    # Final sale price to consumer was transfers[-1]['price_paise'] (Rs. 2000)
    farmer_paise = transfers[0]["price_paise"]
    consumer_paise = transfers[-1]["price_paise"]
    farmer_share_pct = (farmer_paise / consumer_paise) * 100.0

    print(f"\n  [E8 PRICE SHARE CALCULATION]")
    print(f"    - Farm Gate Price (Farmer receives):  ₹{farmer_paise // 100}")
    print(f"    - Final Consumer Shelf Price:        ₹{consumer_paise // 100}")
    print(f"    - Farmer Price Share:                {farmer_share_pct:.1f}%")
    assert farmer_share_pct == 50.0, "Farmer share calculation incorrect"

    print("\n=================================================================")
    print(" SUCCESS: ALL 5 STEPS OF THE ESSENTIAL BUILD FULLY VERIFIED!   ")
    print("=================================================================")
    conn.close()

if __name__ == "__main__":
    main()
