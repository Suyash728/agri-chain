#!/usr/bin/env python3
"""
backend/scripts/verify_phase6_task4.py
--------------------------------------
Verification script for Task 6.4:
Connect backend ingestion to AI Trust Pipeline & Oracle handoff.

DONE WHEN criteria:
1. Posting valid telemetry updates Hardhat blockchain condition events and SQLite audit records.
2. Posting anomalies (temp spike, GPS jump, replay attack) inserts quarantine records and leaves on-chain event count unchanged.
"""

import sys
import json
import time
import urllib.request
import urllib.error
import sqlite3
import pathlib

# Ensure backend root is on sys.path
BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import chain
from db import DB_PATH

BASE_URL = "http://127.0.0.1:8000"


def post_json(path: str, payload: dict) -> dict:
    url = f"{BASE_URL}{path}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    print("=" * 65)
    print("VERIFYING TASK 6.4: AI Trust Pipeline & Oracle Handoff Ingestion")
    print("=" * 65)

    batch_id = f"TASK64-{int(time.time())}"
    print(f"\n1. Registering test batch: {batch_id} (crop: tomato)...")
    reg_resp = post_json(
        "/batches",
        {
            "batch_id": batch_id,
            "crop_name": "tomato",
            "origin_farm": "Nashik AI Cluster Farm",
            "harvest_date": "2026-09-23",
            "farmer_name": "Suresh Patil",
        },
    )
    print(f"   [OK] Registered on-chain: tx_hash={reg_resp['tx_hash'][:16]}...")

    # Count initial on-chain conditions
    initial_conditions = chain.get_condition_records(batch_id)
    assert len(initial_conditions) == 0, f"Expected 0 conditions, got {len(initial_conditions)}"
    print(f"   [OK] Initial on-chain condition count: {len(initial_conditions)}")

    # -----------------------------------------------------------------
    # STEP 2: Post valid reading
    # -----------------------------------------------------------------
    print("\n2. Ingesting VALID telemetry reading (temp=4.5°C, hum=88.0%)...")
    val_resp = post_json(
        "/telemetry",
        {
            "batch_id": batch_id,
            "crop_name": "tomato",
            "temp_c": 4.5,
            "humidity_pct": 88.0,
            "device_id": f"DEV-{batch_id}",
            "latitude": 18.5204,
            "longitude": 73.8567,
        },
    )
    print(f"   Response: verdict={val_resp['verdict']}, disposition={val_resp.get('disposition')}, tx={val_resp.get('tx_hash')[:16]}...")
    assert val_resp["verdict"] == "VALID", f"Expected VALID, got {val_resp['verdict']}"
    assert val_resp["tx_hash"] is not None, "Missing tx_hash for valid telemetry"
    assert val_resp.get("disposition") == "READY_FOR_ORACLE", f"Expected READY_FOR_ORACLE, got {val_resp.get('disposition')}"

    # Verify on-chain condition count increased to 1
    conditions_after_valid = chain.get_condition_records(batch_id)
    assert len(conditions_after_valid) == 1, f"Expected 1 condition, got {len(conditions_after_valid)}"
    print(f"   [OK] On-chain condition logged! Count={len(conditions_after_valid)}, temp={conditions_after_valid[0]['tempDeciC'] / 10.0}°C")

    # Verify SQLite audit trail & history
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    audit_row = conn.execute("SELECT * FROM audit_trail WHERE batch_id = ?", (batch_id,)).fetchone()
    assert audit_row is not None, "Missing audit_trail entry"
    assert audit_row["verdict"] == "VALID"
    print(f"   [OK] SQLite audit_trail confirmed: verdict={audit_row['verdict']}, event_hash={audit_row['event_hash'][:16]}...")

    # -----------------------------------------------------------------
    # STEP 3: Post Temperature Spike Anomaly (42.0°C for Tomato)
    # -----------------------------------------------------------------
    print("\n3. Ingesting FAULT: Temperature spike (42.0°C)...")
    spike_resp = post_json(
        "/telemetry",
        {
            "batch_id": batch_id,
            "crop_name": "tomato",
            "temp_c": 42.0,
            "humidity_pct": 88.0,
            "device_id": f"DEV-{batch_id}",
            "latitude": 18.5204,
            "longitude": 73.8567,
        },
    )
    print(f"   Response: verdict={spike_resp['verdict']}, disposition={spike_resp.get('disposition')}, reason={spike_resp.get('reason')}")
    assert spike_resp["verdict"] == "ANOMALOUS", f"Expected ANOMALOUS, got {spike_resp['verdict']}"
    assert spike_resp["tx_hash"] is None, "Anomalous reading must NOT have tx_hash"
    assert spike_resp.get("disposition") == "QUARANTINED"
    assert "TEMPERATURE_OUT_OF_POLICY" in spike_resp.get("reason_codes", []) or "TEMPERATURE_RATE_EXCEEDED" in spike_resp.get("reason_codes", [])

    # Verify on-chain condition count did NOT increase
    conditions_after_spike = chain.get_condition_records(batch_id)
    assert len(conditions_after_spike) == 1, f"On-chain count should remain 1, got {len(conditions_after_spike)}"
    print(f"   [OK] On-chain count unchanged: {len(conditions_after_spike)}")

    # Verify quarantine row in SQLite
    q_spike = conn.execute(
        "SELECT q.reason FROM quarantine q JOIN readings r ON q.reading_id = r.id WHERE r.id = ?",
        (spike_resp["reading_id"],),
    ).fetchone()
    assert q_spike is not None, "Missing quarantine row for temperature spike"
    print(f"   [OK] Quarantine table confirmed entry: {q_spike['reason']}")

    # -----------------------------------------------------------------
    # STEP 4: Post GPS Jump Anomaly
    # -----------------------------------------------------------------
    print("\n4. Ingesting FAULT: GPS Jump (displacement to Delhi 28.61, 77.20)...")
    jump_time = "2026-09-23T12:00:00+00:00"
    gps_resp = post_json(
        "/telemetry",
        {
            "batch_id": batch_id,
            "crop_name": "tomato",
            "temp_c": 5.0,
            "humidity_pct": 88.0,
            "device_id": f"DEV-{batch_id}",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "timestamp": jump_time,
        },
    )
    print(f"   Response: verdict={gps_resp['verdict']}, disposition={gps_resp.get('disposition')}, reasons={gps_resp.get('reason_codes')}")
    assert gps_resp["verdict"] == "ANOMALOUS"
    assert gps_resp["tx_hash"] is None
    assert gps_resp.get("disposition") == "QUARANTINED"
    assert "GPS_SPEED_EXCEEDED" in gps_resp.get("reason_codes", [])

    # Verify on-chain condition count did NOT increase
    conditions_after_gps = chain.get_condition_records(batch_id)
    assert len(conditions_after_gps) == 1, f"On-chain count should remain 1, got {len(conditions_after_gps)}"
    print(f"   [OK] On-chain count unchanged: {len(conditions_after_gps)}")

    # -----------------------------------------------------------------
    # STEP 5: Post Replay Attack
    # -----------------------------------------------------------------
    print("\n5. Ingesting FAULT: Replay Attack (resending identical reading 4)...")
    replay_resp = post_json(
        "/telemetry",
        {
            "batch_id": batch_id,
            "crop_name": "tomato",
            "temp_c": 5.0,
            "humidity_pct": 88.0,
            "device_id": f"DEV-{batch_id}",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "timestamp": jump_time,
        },
    )
    print(f"   Response: verdict={replay_resp['verdict']}, disposition={replay_resp.get('disposition')}, reasons={replay_resp.get('reason_codes')}")
    assert replay_resp["verdict"] == "ANOMALOUS"
    assert replay_resp["tx_hash"] is None
    assert replay_resp.get("disposition") == "QUARANTINED"
    assert "REPLAY_DETECTED" in replay_resp.get("reason_codes", []) or "DUPLICATE_TIMESTAMP" in replay_resp.get("reason_codes", [])

    # Verify on-chain condition count did NOT increase
    conditions_after_replay = chain.get_condition_records(batch_id)
    assert len(conditions_after_replay) == 1, f"On-chain count should remain 1, got {len(conditions_after_replay)}"
    print(f"   [OK] On-chain count unchanged: {len(conditions_after_replay)}")

    conn.close()

    print("\n" + "=" * 65)
    print("TASK 6.4 VERIFICATION PASSED! ALL CHECKS CONFIRMED.")
    print("=" * 65)


if __name__ == "__main__":
    main()
