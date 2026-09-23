import json
import sqlite3
import sys
import time
import urllib.request
import pathlib

# Ensure proper stdout encoding on all platforms
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
    print("==========================================================================")
    print("      AGRICHAIN PHASE 7 - END-TO-END MULTI-ROLE WORKFLOW VERIFICATION     ")
    print("==========================================================================\n")

    test_batch_id = f"P7-DEMO-{int(time.time())}"
    print(f"[*] Target Produce Batch: {test_batch_id}\n")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # -------------------------------------------------------------
    # STEP 1: Farmer Registers Produce Batch
    # -------------------------------------------------------------
    print("--- [STEP 1] Farmer Registration Flow ---")
    reg_payload = {
        "batch_id": test_batch_id,
        "crop_name": "tomato",
        "origin_farm": "Sahyadri Farms Cluster, Nashik",
        "harvest_date": "2026-09-23",
        "farmer_name": "Devendra Patil"
    }
    reg_resp = post_json("/batches", reg_payload)
    assert reg_resp.get("tx_hash"), "Missing transaction hash in batch registration"
    print(f"  [OK] Batch registered on-chain: tx={reg_resp['tx_hash'][:18]}...")

    # Verify SQLite record
    b_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (test_batch_id,)).fetchone()
    assert b_row is not None, "Batch record not found in SQLite"
    print(f"  [OK] SQLite record confirmed: {b_row['crop_name']} by {b_row['farmer_name']}")

    # Verify Farmer Activity reflects new batch
    activities = get_json("/farmer/activity")
    assert any(test_batch_id in a.get("title", "") for a in activities), "Batch missing in farmer activity"
    print("  [OK] Farmer Activity feed updated with registration event")

    # -------------------------------------------------------------
    # STEP 2: Logistics Partner Pickup & In-Transit Telemetry
    # -------------------------------------------------------------
    print("\n--- [STEP 2] Logistics Partner Dispatch & Telemetry Streaming ---")
    
    # Verify batch is in procurement queue
    orders = get_json("/logistics/orders")
    assert any(o.get("id") == test_batch_id for o in orders), "Batch missing from logistics orders"
    print(f"  [OK] Batch {test_batch_id} listed in Procurement Orders ready for pickup")

    # Dispatch / Pick up batch into IN_TRANSIT
    pickup_resp = post_json(f"/batches/{test_batch_id}/custody", {
        "to_holder": "Safexpress Cold Chain Logistics",
        "state": "IN_TRANSIT",
        "price_paise": 100000 # ₹1,000
    })
    assert pickup_resp.get("tx_hash"), "Missing tx_hash in custody dispatch"
    assert pickup_resp.get("state") == "IN_TRANSIT", "Custody state not IN_TRANSIT"
    print(f"  [OK] Custody transferred to IN_TRANSIT on-chain: tx={pickup_resp['tx_hash'][:18]}...")

    # Stream 2 valid cold-chain sensor readings
    valid_readings = [
        {"temp": 4.5, "humidity": 88.0},
        {"temp": 4.8, "humidity": 87.5}
    ]
    for r in valid_readings:
        t_resp = post_json("/telemetry", {
            "batch_id": test_batch_id,
            "crop_name": "tomato",
            "temp_c": r["temp"],
            "humidity_pct": r["humidity"]
        })
        assert t_resp["verdict"] == "VALID", f"Expected VALID but got {t_resp['verdict']}"
        assert t_resp["tx_hash"] is not None, "Valid reading missing on-chain condition tx_hash"
        print(f"  [OK] Streamed reading {r['temp']}°C / {r['humidity']}% -> VALID (tx={t_resp['tx_hash'][:16]}...)")

    # Verify active fleet tracking view
    shipments = get_json("/logistics/shipments")
    matched_shipment = next((s for s in shipments if s.get("batchId") == test_batch_id), None)
    assert matched_shipment is not None, "Batch not found in logistics active shipments"
    assert matched_shipment.get("status") == "In Transit", "Shipment status is not In Transit"
    print(f"  [OK] Active fleet corridor tracking verified: vehicle={matched_shipment.get('number')}, driver={matched_shipment.get('driver')}")

    # -------------------------------------------------------------
    # STEP 3: AI Trust Layer Quarantines Injected Sensor Breach
    # -------------------------------------------------------------
    print("\n--- [STEP 3] AI Trust Layer: Multi-Fault Sensor Quarantine ---")
    fault_resp = post_json("/telemetry", {
        "batch_id": test_batch_id,
        "crop_name": "tomato",
        "temp_c": 46.5, # Critical thermal breach
        "humidity_pct": 92.0
    })
    assert fault_resp["verdict"] == "ANOMALOUS", f"Expected ANOMALOUS but got {fault_resp['verdict']}"
    assert fault_resp.get("disposition") == "QUARANTINED", "Expected disposition QUARANTINED"
    assert fault_resp.get("tx_hash") is None, "Anomalous reading must NEVER be mined on-chain"
    print(f"  [OK] Thermal breach (46.5°C) caught: verdict={fault_resp['verdict']}, disposition={fault_resp['disposition']}")

    # Verify incident appears in Quarantine Audit log
    quarantined_logs = get_json("/telemetry/quarantine")
    matched_incident = next((q for q in quarantined_logs if q.get("batchId") == test_batch_id), None)
    assert matched_incident is not None, "Quarantined incident missing in /telemetry/quarantine"
    print(f"  [OK] Quarantine Audit log verified: reasons={matched_incident.get('reasons')}")

    # -------------------------------------------------------------
    # STEP 4: Dark Store Inbound GRN & Storage Allocation
    # -------------------------------------------------------------
    print("\n--- [STEP 4] Dark Store Hub: Inbound GRN & Bay Inventory ---")
    inbound_list = get_json("/darkstore/inbound")
    assert any(d.get("batchId") == test_batch_id for d in inbound_list), "Batch missing in /darkstore/inbound"
    print(f"  [OK] Inbound GRN view displays incoming batch {test_batch_id}")

    # Receive delivery into dark store hub
    receive_resp = post_json("/darkstore/receive", {
        "batch_id": test_batch_id,
        "price_paise": 140000, # ₹1,400
        "holder_name": "Pune Fresh DarkStore Hub"
    })
    assert receive_resp.get("success") is True, "Failed to receive inbound batch"
    assert receive_resp.get("state") == "IN_STORAGE", "Custody state not IN_STORAGE"
    print(f"  [OK] Batch received into IN_STORAGE on-chain: tx={receive_resp['tx_hash'][:18]}...")

    # Verify inventory bins view has batch in storage bay
    inv_bins = get_json("/darkstore/inventory")
    matched_bin = next((b for b in inv_bins if b.get("batchId") == test_batch_id), None)
    assert matched_bin is not None, "Batch missing from dark store inventory bins"
    print(f"  [OK] Micro-Inventory rack allocated: bin={matched_bin.get('binId')}, bay={matched_bin.get('bay')}, temp={matched_bin.get('temp')}")

    # -------------------------------------------------------------
    # STEP 5: Quick-Commerce Consumer Checkout
    # -------------------------------------------------------------
    print("\n--- [STEP 5] Consumer Purchase & Retail Fulfillment ---")
    checkout_resp = post_json("/darkstore/checkout", {
        "batch_id": test_batch_id,
        "price_paise": 200000, # ₹2,000 retail
        "consumer_name": "Customer Home Delivery (Blinkit Order #882)"
    })
    assert checkout_resp.get("success") is True, "Failed to complete consumer checkout"
    assert checkout_resp.get("state") == "SOLD", "Custody state not SOLD"
    print(f"  [OK] Customer checkout completed on-chain: state=SOLD, tx={checkout_resp['tx_hash'][:18]}...")

    # Verify Dark Store KPIs updated
    ds_kpis = get_json("/darkstore/kpis")
    assert ds_kpis.get("soldCount", 0) > 0, "Dark Store sold count not updated"
    print(f"  [OK] Dark Store KPIs reflect sale: todaySales={ds_kpis.get('todaySales')}, revenue={ds_kpis.get('revenueThisMonth')}")

    # -------------------------------------------------------------
    # STEP 6: Full 4-Role Cross-Stakeholder Traceability Audit
    # -------------------------------------------------------------
    print("\n--- [STEP 6] Cross-Role Traceability & Fair Price Audit ---")
    trace = get_json(f"/batches/{test_batch_id}/traceability")
    assert trace.get("batchId") == test_batch_id, "Traceability batch ID mismatch"

    steps = trace.get("steps", [])
    assert len(steps) == 4, f"Expected 4 lifecycle stages but got {len(steps)}"
    step_names = [s["name"] for s in steps]
    print(f"  [OK] Complete 4-stage lifecycle timeline: {' -> '.join(step_names)}")

    # Price trail verification
    custody_hist = trace.get("custodyHistory", [])
    prices_rupees = [c.get("priceRupees", 0) for c in custody_hist]
    print(f"  [OK] Transparent Price Trail: {' -> '.join(f'₹{p:,}' for p in prices_rupees)}")
    assert prices_rupees == [0, 1000, 1400, 2000], f"Unexpected price sequence: {prices_rupees}"

    farmer_price = prices_rupees[1] # ₹1,000 at farm gate pickup
    retail_price = prices_rupees[3] # ₹2,000 consumer purchase
    farmer_share = (farmer_price / retail_price) * 100.0
    print(f"  [OK] Proven Farmer Fair Price Share: {farmer_share:.1f}% (₹{farmer_price:,} / ₹{retail_price:,})")
    assert farmer_share >= 50.0, "Farmer price share should be >= 50%"

    # Cold chain conditions audit
    condition_logs = trace.get("conditionLog", [])
    print(f"  [OK] On-chain immutable condition logs: {len(condition_logs)} recorded (matching valid telemetry only)")
    assert len(condition_logs) == 2, f"Expected 2 on-chain condition events, found {len(condition_logs)}"

    print("\n==========================================================================")
    print("      SUCCESS: ALL 6 MULTI-ROLE WORKFLOW CHECKS PASSED WITH 0 ERRORS!     ")
    print("==========================================================================")


if __name__ == "__main__":
    main()
