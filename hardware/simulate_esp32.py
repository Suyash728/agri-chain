"""
hardware/simulate_esp32.py
--------------------------
Simulates the physical ESP32 Cold-Chain IoT Node.
Transmits telemetry matching hardware/esp32_firmware/src/main.cpp.

Usage:
  python hardware/simulate_esp32.py --mode demo
  python hardware/simulate_esp32.py --mode fault
  python hardware/simulate_esp32.py --mode stream
"""

import argparse
import json
import time
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SERVER_URL = "http://127.0.0.1:8000/telemetry"
QUARANTINE_URL = "http://127.0.0.1:8000/telemetry/quarantine"
BATCH_ID = "BATCH-SOLD-TEST"
DEVICE_ID = "ESP32-COLDCHAIN-01"

def send_reading(temperature: float, humidity: float, is_fault: bool = False):
    payload = {
        "batch_id": BATCH_ID,
        "device_id": DEVICE_ID,
        "latitude": 19.9975,
        "longitude": 73.7898,
        "temperature": temperature,
        "humidity": humidity,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    print("\n" + "=" * 55)
    if is_fault:
        print("🚨 [GPIO 4 BUTTON PRESSED] Injecting 48.0°C Refrigeration Breach!")
    else:
        print("📦 [ESP32 HARDWARE] Sending Nominal Cold-Chain Telemetry")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(SERVER_URL, data=data, headers={"Content-Type": "application/json"})

    try:
        with urllib.request.urlopen(req) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            print(f"Status: {res.status} OK")
            print(f"Server Response: {json.dumps(res_data, indent=2)}")

            verdict = res_data.get("verdict")
            if isinstance(verdict, dict):
                action = verdict.get("action")
                reason = verdict.get("quarantine_reason")
            else:
                action = str(verdict)
                reason = res_data.get("reason") or res_data.get("quarantine_reason")

            tx_hash = res_data.get("tx_hash")

            if action in ("PASS", "VALID"):
                print(f"✅ Telemetry verified by AI Trust Layer! On-chain Tx: {tx_hash}")
            elif action in ("QUARANTINE", "FAIL"):
                print(f"🛡️ Anomaly caught by AI Trust Layer! Quarantined off-chain. Reason: {reason}")
            return res_data
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error {e.code}: {e.read().decode('utf-8')}")
        raise

def check_quarantine():
    with urllib.request.urlopen(QUARANTINE_URL) as res:
        records = json.loads(res.read().decode("utf-8"))
        print(f"\n[AI Trust Layer] Total quarantined readings in system: {len(records)}")
        return records

def main():
    parser = argparse.ArgumentParser(description="AgriChain ESP32 Hardware Simulator")
    parser.add_argument("--mode", choices=["demo", "fault", "stream"], default="demo", help="Simulation mode")
    parser.add_argument("--count", type=int, default=3, help="Readings count for stream mode")
    args = parser.parse_args()

    print("=======================================================")
    print("   AgriChain ESP32 IoT Cold-Chain Node Simulator       ")
    print("=======================================================")

    if args.mode == "demo":
        print("\n--- Step 1: Normal Cold-Chain Telemetry (Nominal 4.5°C) ---")
        send_reading(temperature=4.5, humidity=88.0, is_fault=False)
        time.sleep(1)

        print("\n--- Step 2: Simulating Physical GPIO 4 Button Push (48.0°C Breach) ---")
        fault_res = send_reading(temperature=48.0, humidity=92.5, is_fault=True)
        time.sleep(1)

        print("\n--- Step 3: Verifying Off-Chain Quarantine Log ---")
        q_records = check_quarantine()
        assert any(
            r.get("batchId") == BATCH_ID or r.get("batch_id") == BATCH_ID for r in q_records
        ), "Breach was not recorded in quarantine!"
        print("🎉 SUCCESS: Physical IoT ESP32 demonstration completed and verified!")

    elif args.mode == "fault":
        send_reading(temperature=48.0, humidity=92.5, is_fault=True)
        check_quarantine()

    elif args.mode == "stream":
        for i in range(args.count):
            temp = 4.0 + (i * 0.2)
            send_reading(temperature=temp, humidity=87.0, is_fault=False)
            if i < args.count - 1:
                print("Waiting 15 seconds for next transmission...")
                time.sleep(15)

if __name__ == "__main__":
    main()
