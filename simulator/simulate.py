#!/usr/bin/env python3
"""AgriChain IoT Telemetry Simulator

Simulates real-world cold-chain sensor readings (temperature and humidity)
streamed to the AgriChain backend /telemetry endpoint.
"""
import sys
import time
import json
import random
import argparse
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PLAUSIBLE_RANGES = {
    "tomato": {"temp_min": 3.0, "temp_max": 6.5, "hum_min": 86.0, "hum_max": 93.0},
    "mango": {"temp_min": 11.0, "temp_max": 14.0, "hum_min": 86.0, "hum_max": 89.0},
    "wheat": {"temp_min": 17.0, "temp_max": 22.0, "hum_min": 55.0, "hum_max": 65.0},
}


def send_telemetry(endpoint: str, payload: dict) -> dict:
    """Send a single telemetry JSON payload via HTTP POST."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def run_simulator(
    batch_id: str,
    crop_name: str = "tomato",
    duration_sec: int = 30,
    interval_sec: float = 2.0,
    endpoint: str = "http://localhost:8000/telemetry",
    inject_fault: str | None = None,
):
    """Streams telemetry readings for a configurable duration."""
    print("=" * 65)
    print(f"Starting AgriChain Telemetry Stream for Batch: {batch_id}")
    print(f"Crop: {crop_name} | Duration: {duration_sec}s | Interval: {interval_sec}s")
    print(f"Endpoint: {endpoint}")
    if inject_fault:
        print(f"Fault injection enabled: {inject_fault}")
    print("=" * 65)

    crop_key = crop_name.lower().strip()
    ranges = PLAUSIBLE_RANGES.get(crop_key, {"temp_min": 18.0, "temp_max": 22.0, "hum_min": 55.0, "hum_max": 65.0})

    start_time = time.time()
    end_time = start_time + duration_sec
    sample_idx = 0
    total_samples = max(1, int(duration_sec / interval_sec))

    # Pick a sample mid-stream for fault injection if requested
    fault_sample_idx = max(2, total_samples // 2) if inject_fault else -1

    valid_count = 0
    anomalous_count = 0

    while time.time() < end_time and sample_idx < total_samples:
        sample_idx += 1
        elapsed = int(time.time() - start_time)

        # Generate reading
        if inject_fault and sample_idx == fault_sample_idx:
            if inject_fault == "temp_spike":
                temp_c = 45.0  # Serious cold-chain breach
                hum_pct = round(random.uniform(ranges["hum_min"], ranges["hum_max"]), 1)
            elif inject_fault == "humidity_spike":
                temp_c = round(random.uniform(ranges["temp_min"], ranges["temp_max"]), 1)
                hum_pct = 99.0
            else:
                temp_c = 48.0
                hum_pct = 98.0
            is_fault = True
        else:
            temp_c = round(random.uniform(ranges["temp_min"], ranges["temp_max"]), 1)
            hum_pct = round(random.uniform(ranges["hum_min"], ranges["hum_max"]), 1)
            is_fault = False

        payload = {
            "batch_id": batch_id,
            "crop_name": crop_name,
            "temp_c": temp_c,
            "humidity_pct": hum_pct,
        }

        try:
            res = send_telemetry(endpoint, payload)
            verdict = res.get("verdict")
            tx = res.get("tx_hash")
            reason = res.get("reason")

            tag = " [FAULT INJECTED]" if is_fault else ""
            if verdict == "VALID":
                valid_count += 1
                short_tx = f"{tx[:10]}..." if tx else "None"
                print(f"[{elapsed:02d}s] Sample #{sample_idx}: Temp={temp_c:.1f}°C, Hum={hum_pct:.1f}% -> VALID (tx: {short_tx}){tag}")
            else:
                anomalous_count += 1
                print(f"[{elapsed:02d}s] Sample #{sample_idx}: Temp={temp_c:.1f}°C, Hum={hum_pct:.1f}% -> ANOMALOUS: {reason}{tag}")

        except Exception as e:
            print(f"[{elapsed:02d}s] Sample #{sample_idx}: Failed to send telemetry: {e}")

        # Sleep interval
        if sample_idx < total_samples:
            time.sleep(interval_sec)

    print("-" * 65)
    print(f"Stream completed. Total samples: {sample_idx} (VALID: {valid_count}, ANOMALOUS: {anomalous_count})")
    print("-" * 65)
    return {"total": sample_idx, "valid": valid_count, "anomalous": anomalous_count}


def main():
    parser = argparse.ArgumentParser(description="AgriChain Telemetry Simulator")
    parser.add_argument("--batch-id", required=True, help="Batch ID to simulate readings for")
    parser.add_argument("--crop-name", default="tomato", help="Crop name (default: tomato)")
    parser.add_argument("--duration", type=int, default=30, help="Duration in seconds (default: 30)")
    parser.add_argument("--interval", type=float, default=2.0, help="Interval between readings in seconds (default: 2.0)")
    parser.add_argument("--endpoint", default="http://localhost:8000/telemetry", help="Target /telemetry API endpoint")
    parser.add_argument("--inject-fault", default=None, choices=["temp_spike", "humidity_spike"], help="Inject deliberate fault")

    args = parser.parse_args()
    run_simulator(
        batch_id=args.batch_id,
        crop_name=args.crop_name,
        duration_sec=args.duration,
        interval_sec=args.interval,
        endpoint=args.endpoint,
        inject_fault=args.inject_fault,
    )


if __name__ == "__main__":
    main()
