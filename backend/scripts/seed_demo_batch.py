import json
import urllib.request
import sys

BASE_URL = "http://127.0.0.1:8000"

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

def seed():
    batch_id = "TM1256"
    print(f"1. Registering demo batch {batch_id}...")
    try:
        b_res = post_json("/batches", {
            "batch_id": batch_id,
            "crop_name": "tomato",
            "origin_farm": "Nashik Organic Farm cluster 4",
            "harvest_date": "2026-09-20",
            "farmer_name": "Rahul Patil"
        })
        print(f"   Batch registered: tx_hash={b_res.get('tx_hash')}")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        if "already exists" in err_body:
            print(f"   Batch {batch_id} already exists, continuing...")
        else:
            print(f"   Error registering batch: {err_body}")
            raise

    print("2. Sending cold-chain telemetry readings...")
    readings = [
        {"batch_id": batch_id, "crop_name": "tomato", "temp_c": 4.5, "humidity_pct": 89.0},
        {"batch_id": batch_id, "crop_name": "tomato", "temp_c": 5.2, "humidity_pct": 91.0},
        {"batch_id": batch_id, "crop_name": "tomato", "temp_c": 4.8, "humidity_pct": 90.0},
    ]
    for r in readings:
        t_res = post_json("/telemetry", r)
        print(f"   Telemetry reading temp={r['temp_c']}C: verdict={t_res['verdict']} tx={t_res.get('tx_hash')}")

    print("3. Performing custody transfers...")
    transfers = [
        {
            "to_holder": "Green Valley Cold-Chain Logistics",
            "state": "IN_TRANSIT",
            "price_paise": 120000, # Rs. 1,200
        },
        {
            "to_holder": "Central Dark Store Pune Hub 2",
            "state": "IN_STORAGE",
            "price_paise": 155000, # Rs. 1,550
        },
        {
            "to_holder": "QuickMart Fresh Retail Outlet",
            "state": "AT_RETAIL",
            "price_paise": 185000, # Rs. 1,850
        },
        {
            "to_holder": "Consumer Doorstep Delivery",
            "state": "SOLD",
            "price_paise": 220000, # Rs. 2,200
        }
    ]

    for t in transfers:
        c_res = post_json(f"/batches/{batch_id}/custody", t)
        print(f"   Transfer -> {c_res['state']} ({c_res['to_holder']}) price=Rs.{c_res['price_paise']//100} tx={c_res.get('tx_hash')}")

    print("4. Fetching traceability response...")
    trace = get_json(f"/batches/{batch_id}/traceability")
    print("\nTraceability result:")
    print(f"  Batch: {trace['batchId']}")
    print(f"  Product: {trace['product']}")
    print(f"  Current Location: {trace['currentLocation']}")
    print(f"  Steps ({len(trace['steps'])} total):")
    for s in trace["steps"]:
        print(f"    - Step {s['step']}: {s['name']} | {s['location']} | {s['status']} | Rs.{s.get('pricePaise', 0)//100}")

    print(f"  Condition Log ({len(trace['conditionLog'])} records on-chain):")
    for cl in trace["conditionLog"]:
        print(f"    - Temp: {cl['tempC']}C, Humidity: {cl['humidityPct']}%, Breach: {cl['breach']}")

    print("\nDONE: Task 5.4 Seed Verified Successfully!")

if __name__ == "__main__":
    seed()
