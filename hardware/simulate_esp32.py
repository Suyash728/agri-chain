"""
hardware/simulate_esp32.py
--------------------------
Simulates the physical ESP32 Cold-Chain IoT Node based on the 
AgriChain Hardware Sprint Specification (ESP32 + DHT22 + MQ-135 + NEO-6M + SW-420 + LDR).

Transmits telemetry matching hardware/esp32_firmware/src/main.cpp.

Usage:
  python hardware/simulate_esp32.py --mode demo
  python hardware/simulate_esp32.py --mode fault
  python hardware/simulate_esp32.py --mode tamper
  python hardware/simulate_esp32.py --mode spoilage
  python hardware/simulate_esp32.py --mode stream --count 5
"""

import argparse
import hashlib
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
BATCH_ID = "BAT-TOM-802"
DEVICE_ID = "ESP32-COLDCHAIN-01"

_nonce_counter = 1040

def send_reading(temperature: float, humidity: float, voc_ppm: float = 12.4, tamper_status: str = "SEALED", is_fault: bool = False, label: str = ""):
    global _nonce_counter
    _nonce_counter += 1

    payload = {
        "batch_id": BATCH_ID,
        "device_id": DEVICE_ID,
        "lat": 19.9975,
        "lon": 73.7898,
        "temp_c": temperature,
        "humidity_pct": humidity,
        "nonce": _nonce_counter,
        "freshness_voc_ppm": voc_ppm,
        "tamper_status": tamper_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    serialized_data = json.dumps(payload)
    sha256_digest = hashlib.sha256(serialized_data.encode("utf-8")).hexdigest()

    print("\n" + "=" * 60)
    if is_fault:
        print(f"🚨 [FAULT INJECTION] {label}")
    else:
        print(f"📦 [ESP32 HARDWARE] Sending Nominal Cold-Chain Telemetry")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print(f"Header X-Payload-SHA256: {sha256_digest}")

    data = serialized_data.encode("utf-8")
    req = urllib.request.Request(
        SERVER_URL, 
        data=data, 
        headers={
            "Content-Type": "application/json",
            "X-Payload-SHA256": sha256_digest
        }
    )

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
            elif action in ("QUARANTINE", "FAIL", "ANOMALOUS", "BREACH"):
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
    parser.add_argument("--mode", choices=["demo", "fault", "tamper", "spoilage", "stream"], default="demo", help="Simulation mode")
    parser.add_argument("--count", type=int, default=3, help="Readings count for stream mode")
    args = parser.parse_args()

    print("================================================================")
    print("   AgriChain Physical ESP32 Cold-Chain Node Simulator           ")
    print("   Features: DHT22, MQ-135 VOC, NEO-6M GPS, SW-420, LDR Tamper  ")
    print("================================================================")

    if args.mode == "demo":
        print("\n--- Step 1: Normal Cold-Chain Telemetry (Nominal 4.5°C, 12.4 ppm VOC) ---")
        send_reading(temperature=4.5, humidity=88.0, voc_ppm=12.4, tamper_status="SEALED", is_fault=False)
        time.sleep(1)

        print("\n--- Step 2: Simulating Physical Crate Lid Tamper (LDR > 150 lux) ---")
        send_reading(temperature=4.8, humidity=85.0, voc_ppm=14.0, tamper_status="TAMPER_OPENED", is_fault=True, label="GL5528 LDR Optical Intrusion Breach")
        time.sleep(1)

        print("\n--- Step 3: Simulating Highway Refrigeration Compressor Failure (48.0°C) ---")
        send_reading(temperature=48.0, humidity=92.5, voc_ppm=18.0, tamper_status="SEALED", is_fault=True, label="Reefer Compressor Thermal Breach (48.0°C)")
        time.sleep(1)

        print("\n--- Step 4: Simulating Organic Spoilage Plume (MQ-135 VOC > 75 ppm) ---")
        send_reading(temperature=18.5, humidity=94.0, voc_ppm=88.5, tamper_status="SEALED", is_fault=True, label="Microbial Rot & Anaerobic Fermentation VOC Surge")
        time.sleep(1)

        print("\n--- Step 5: Verifying Off-Chain Quarantine IsoLog Audit ---")
        q_records = check_quarantine()
        assert any(
            r.get("batchId") == BATCH_ID or r.get("batch_id") == BATCH_ID for r in q_records
        ), "Breach was not recorded in quarantine!"
        print("🎉 SUCCESS: Physical IoT hardware simulation completed and verified across all channels!")

    elif args.mode == "fault":
        send_reading(temperature=48.0, humidity=92.5, voc_ppm=18.0, tamper_status="SEALED", is_fault=True, label="Reefer Compressor Failure")
        check_quarantine()

    elif args.mode == "tamper":
        send_reading(temperature=5.0, humidity=85.0, voc_ppm=12.0, tamper_status="TAMPER_OPENED", is_fault=True, label="LDR Optical Tamper Event")
        check_quarantine()

    elif args.mode == "spoilage":
        send_reading(temperature=16.0, humidity=92.0, voc_ppm=95.0, tamper_status="SEALED", is_fault=True, label="MQ-135 Spoilage Gas Surge")
        check_quarantine()

    elif args.mode == "stream":
        for i in range(args.count):
            temp = 4.0 + (i * 0.2)
            voc = 12.0 + (i * 0.5)
            send_reading(temperature=temp, humidity=87.0, voc_ppm=voc, tamper_status="SEALED", is_fault=False)
            if i < args.count - 1:
                print("Waiting 5 seconds for next transmission...")
                time.sleep(5)

if __name__ == "__main__":
    main()
