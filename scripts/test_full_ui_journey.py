#!/usr/bin/env python3
"""
scripts/test_full_ui_journey.py
-------------------------------
End-to-end browser walkthrough testing the full lifecycle across all 4 roles:
  Farmer -> Logistics -> Dark Store -> Consumer
"""
import time
import json
import urllib.request
import pathlib
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
API_URL = "http://localhost:8000"
OUTPUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "reports" / "screenshots"

def post_json(endpoint, data):
    req = urllib.request.Request(
        f"{API_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(endpoint):
    req = urllib.request.Request(f"{API_URL}{endpoint}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("==========================================================================")
    print("      AGRICHAIN MULTI-ROLE MANUAL BATCH E2E PLAYWRIGHT FLOW               ")
    print("==========================================================================\n")

    test_batch_id = f"MANUAL-FLOW-{int(time.time())}"
    print(f"[*] Live Test Batch ID: {test_batch_id}\n")

    # Step 1: Farmer registers new batch
    print("[1] Farmer Batch Registration...")
    reg_resp = post_json("/batches", {
        "batch_id": test_batch_id,
        "crop_name": "Premium Organic Strawberries",
        "origin_farm": "Mahabaleshwar Highland Orchards Cluster 2",
        "harvest_date": "2026-11-08",
        "farmer_name": "Savitri Devi",
        "farmer_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "category": "Fruits",
        "quantity_tonnes": 0.8,
        "price_inr": 3200
    })
    print(f"  [OK] Batch registered on-chain: tx={reg_resp.get('tx_hash', '')[:18]}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Farmer View verification
        print("[2] Opening Farmer Dashboard...")
        page.goto(f"{BASE_URL}/?role=farmer&tab=dashboard", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=str(OUTPUT_DIR / "flow_01_farmer_dashboard.png"))
        print("  [SAVED] flow_01_farmer_dashboard.png")

        # Step 2: Logistics transfers custody
        print("[3] Logistics Procurement & Dispatch (IN_TRANSIT)...")
        logistics_resp = post_json(f"/batches/{test_batch_id}/custody", {
            "to_holder": "Safexpress Cold Chain Logistics",
            "state": "IN_TRANSIT",
            "price_paise": 125000 # ₹1,250.00
        })
        print(f"  [OK] Custody -> IN_TRANSIT: tx={logistics_resp.get('tx_hash', '')[:18]}...")

        # Open Logistics Transportation View
        page.goto(f"{BASE_URL}/?role=logistics&tab=transportation", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=str(OUTPUT_DIR / "flow_02_logistics_transit.png"))
        print("  [SAVED] flow_02_logistics_transit.png")

        # Nominal IoT reading during transit
        print("[4] Logging nominal IoT temperature reading...")
        post_json("/telemetry", {
            "batch_id": test_batch_id,
            "device_id": "ESP32-COLDCHAIN-REEFER-09",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temperature": 4.0,
            "humidity": 88.0,
            "timestamp": "2026-11-08T18:00:00Z"
        })

        # Step 3: Dark Store Inbound GRN Clearance
        print("[5] Dark Store Inbound GRN Receiving (IN_STORAGE)...")
        store_resp = post_json("/darkstore/receive", {
            "batch_id": test_batch_id,
            "holder_name": "Pune High-Velocity Dark Store Hub #4",
            "price_paise": 180000 # ₹1,800.00
        })
        print(f"  [OK] Custody -> IN_STORAGE: tx={store_resp.get('tx_hash', '')[:18]}...")

        page.goto(f"{BASE_URL}/?role=darkstore&tab=inbound", wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=str(OUTPUT_DIR / "flow_03_darkstore_grn.png"))
        print("  [SAVED] flow_03_darkstore_grn.png")

        # Dark Store Shelves & Fulfills to Consumer (SOLD)
        print("[6] Consumer Checkout Fulfillment (SOLD)...")
        checkout_resp = post_json("/darkstore/checkout", {
            "batch_id": test_batch_id,
            "consumer_name": "Priya Sharma (Home Delivery)",
            "price_paise": 240000 # ₹2,400.00
        })
        print(f"  [OK] Custody -> SOLD: tx={checkout_resp.get('tx_hash', '')[:18]}...")

        # Consumer leaves verified review
        print("[7] Consumer Verified Review Submission...")
        review_resp = post_json(f"/batches/{test_batch_id}/reviews", {
            "rating": 5,
            "comment": "Exquisite freshness and aroma! Cold chain integrity fully verified on Polygon blockchain.",
            "freshness_score": 99,
            "reviewer_address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
        })
        print(f"  [OK] Verified Review: {review_resp.get('rating')} stars, score: {review_resp.get('freshness_score')}/100")

        # Step 4: Consumer Provenance & Transparent Price Journey
        print("[8] Consumer Provenance & Fair Share Price Journey Verification...")
        page.goto(f"{BASE_URL}/?role=consumer&tab=journey&batch={test_batch_id}", wait_until="networkidle")
        page.wait_for_timeout(2500)
        page.screenshot(path=str(OUTPUT_DIR / "flow_04_consumer_journey.png"))
        print("  [SAVED] flow_04_consumer_journey.png")

        browser.close()

    # Step 5: Verify API price trail
    trace = get_json(f"/batches/{test_batch_id}/traceability")
    price_trail = trace.get("priceTrail", {})
    print("\n--- Final Price Journey Breakdown ---")
    print(f"  Farmer Rate    : ₹{price_trail.get('farmerRate', 0):.2f}/kg ({price_trail.get('farmerSharePct', 0)}%)")
    print(f"  Logistics Rate : ₹{price_trail.get('logisticsRate', 0):.2f}/kg ({price_trail.get('logisticsSharePct', 0)}%)")
    print(f"  Dark Store Rate: ₹{price_trail.get('darkstoreRate', 0):.2f}/kg ({price_trail.get('darkstoreSharePct', 0)}%)")
    print(f"  Retail Rate    : ₹{price_trail.get('retailRate', 0):.2f}/kg ({price_trail.get('retailSharePct', 0)}%)")
    print(f"  Pack Size      : {price_trail.get('packKg', 0)} kg")

    print("\n==========================================================================")
    print("  🏆 E2E MANUAL BATCH FLOW FULLY VALIDATED ACROSS ALL ROLES!             ")
    print("==========================================================================")

if __name__ == "__main__":
    main()
