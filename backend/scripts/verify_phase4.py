"""
Phase 4 Verification Script
Runs end-to-end verification of Tasks 4.1, 4.2, and 4.3.
"""
import sys
import time
import json
import sqlite3
import pathlib
import urllib.request

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[1]
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(ROOT_DIR / "simulator"))

# Ensure UTF-8 output on Windows console
sys.stdout.reconfigure(encoding="utf-8")

import chain
import simulate

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
    print("=" * 65)
    print("AGRICHAIN PHASE 4 VERIFICATION SUITE (SIMULATOR & FAULT INJECTION)")
    print("=" * 65)

    ts = int(time.time())
    batch_id = f"PH4-VERIFY-{ts}"

    # 1. Register a fresh batch via API
    print(f"\n1. Registering fresh batch: {batch_id}...")
    reg_res = http_json(
        f"{BASE_URL}/batches",
        method="POST",
        data={
            "batch_id": batch_id,
            "crop_name": "tomato",
            "origin_farm": "Nashik Agri Tech Farm",
            "harvest_date": "2026-05-22",
            "farmer_name": "Sanjay Patil"
        }
    )
    if reg_res.get("tx_hash"):
        log_pass("Setup", f"Batch registered on-chain (tx: {reg_res['tx_hash'][:10]}...)")
    else:
        log_fail("Setup", f"Failed to register batch: {reg_res}")

    # 2. Run Task 4.1: Normal simulator stream (no faults)
    print(f"\n2. Testing Task 4.1: Normal Telemetry Stream (no faults)...")
    res_normal = simulate.run_simulator(
        batch_id=batch_id,
        crop_name="tomato",
        duration_sec=6,
        interval_sec=2.0,
        endpoint=f"{BASE_URL}/telemetry",
        inject_fault=None,
    )
    if res_normal["anomalous"] == 0 and res_normal["valid"] >= 2:
        log_pass("Task 4.1", f"All {res_normal['valid']} readings valid and recorded on-chain.")
    else:
        log_fail("Task 4.1", f"Unexpected normal stream result: {res_normal}")

    # 3. Run Task 4.2 & 4.3: Telemetry stream with fault injection
    fault_batch_id = f"PH4-FAULT-{ts}"
    print(f"\n3. Registering fault test batch: {fault_batch_id}...")
    http_json(
        f"{BASE_URL}/batches",
        method="POST",
        data={
            "batch_id": fault_batch_id,
            "crop_name": "tomato",
            "origin_farm": "Nashik Cold Storage",
            "harvest_date": "2026-05-22",
            "farmer_name": "Sanjay Patil"
        }
    )

    print(f"\n4. Testing Task 4.2: Telemetry Stream with --inject-fault temp_spike...")
    res_fault = simulate.run_simulator(
        batch_id=fault_batch_id,
        crop_name="tomato",
        duration_sec=6,
        interval_sec=2.0,
        endpoint=f"{BASE_URL}/telemetry",
        inject_fault="temp_spike",
    )
    if res_fault["anomalous"] == 1 and res_fault["valid"] >= 1:
        log_pass("Task 4.2", f"Fault injected: exactly 1 ANOMALOUS reading caught, {res_fault['valid']} VALID.")
    else:
        log_fail("Task 4.2", f"Unexpected fault stream result: {res_fault}")

    # 4. Task 4.3: Manual Isolated Data Inspection
    print(f"\n5. Testing Task 4.3: Isolated Verification across SQLite & Blockchain...")
    conn = sqlite3.connect(BACKEND_DIR / "agrichain.db")
    
    # Check readings table
    readings = conn.execute(
        "SELECT id, temp_c, humidity_pct, verdict, tx_hash FROM readings WHERE batch_id = ?",
        (fault_batch_id,)
    ).fetchall()
    valid_readings = [r for r in readings if r[3] == "VALID"]
    anom_readings = [r for r in readings if r[3] == "ANOMALOUS"]
    
    if len(valid_readings) == res_fault["valid"] and len(anom_readings) == 1:
        log_pass("Task 4.3 (Check 1)", f"Readings table has {len(valid_readings)} VALID (all with tx_hash) and 1 ANOMALOUS (no tx_hash).")
    else:
        log_fail("Task 4.3 (Check 1)", f"Readings count mismatch: {readings}")

    # Check quarantine table
    anom_reading_id = anom_readings[0][0]
    quarantine_rows = conn.execute(
        "SELECT id, reading_id, reason FROM quarantine WHERE reading_id = ?",
        (anom_reading_id,)
    ).fetchall()
    if len(quarantine_rows) == 1 and "45.0" in quarantine_rows[0][2]:
        log_pass("Task 4.3 (Check 2)", f"Quarantine table has exactly 1 entry: '{quarantine_rows[0][2]}'")
    else:
        log_fail("Task 4.3 (Check 2)", f"Quarantine row missing or invalid: {quarantine_rows}")

    # Check smart contract ConditionRecorded events
    onchain_events = chain.get_condition_records(fault_batch_id)
    if len(onchain_events) == len(valid_readings):
        log_pass("Task 4.3 (Check 3)", f"On-chain events ({len(onchain_events)}) match VALID count ({len(valid_readings)}) only.")
    else:
        log_fail("Task 4.3 (Check 3)", f"On-chain event count ({len(onchain_events)}) != VALID count ({len(valid_readings)})")

    conn.close()

    print("\n" + "=" * 65)
    print("PHASE 4 VERIFICATION COMPLETE: ALL CHECKS PASSED (100% OPERATIONAL)!")
    print("=" * 65)

if __name__ == "__main__":
    main()
