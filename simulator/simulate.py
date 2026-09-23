#!/usr/bin/env python3
"""
simulator/simulate.py
---------------------
AgriChain Multi-Fault IoT Telemetry Simulator.
Simulates real-world cold-chain sensor streams across various crops
with controlled injection of 7 physical, temporal, and cryptographic faults
evaluated in real-time by the AgriChain AI Trust Layer.
"""

import argparse
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure trust-layer is importable
ROOT_DIR = pathlib.Path(__file__).resolve().parent.parent
TRUST_LAYER_PATH = ROOT_DIR / "trust-layer"
if str(TRUST_LAYER_PATH) not in sys.path:
    sys.path.insert(0, str(TRUST_LAYER_PATH))

from app.schemas.simulation import FaultConfig, FaultType, SimulationConfig
from app.services.simulator import telemetry_simulator

# Crop default environmental set-points
CROP_DEFAULTS = {
    "tomato": {"temp": 4.5, "hum": 88.0},
    "mango": {"temp": 12.0, "hum": 87.0},
    "wheat": {"temp": 18.0, "hum": 60.0},
}

# Fault argument mapping to FaultType enum
FAULT_MAP = {
    "temp_spike": FaultType.TEMPERATURE_SPIKE,
    "temperature_spike": FaultType.TEMPERATURE_SPIKE,
    "humidity_spike": FaultType.HUMIDITY_SPIKE,
    "gps_jump": FaultType.GPS_JUMP,
    "timestamp_drift": FaultType.TIMESTAMP_OUT_OF_ORDER,
    "timestamp_out_of_order": FaultType.TIMESTAMP_OUT_OF_ORDER,
    "replay_attack": FaultType.REPLAY,
    "replay": FaultType.REPLAY,
    "telemetry_gap": FaultType.TELEMETRY_GAP,
    "composite": FaultType.COMBINED,
    "combined": FaultType.COMBINED,
}


def send_telemetry(endpoint: str, payload: dict) -> dict:
    """Send a single telemetry JSON payload via HTTP POST."""
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint, data=data, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def run_simulator(
    batch_id: str,
    crop_name: str = "tomato",
    duration_sec: int = 30,
    interval_sec: float = 2.0,
    endpoint: str = "http://localhost:8000/telemetry",
    fault_name: str | None = None,
    num_readings: int | None = None,
):
    """Streams telemetry readings for a configurable duration and injects faults."""
    crop_key = crop_name.lower().strip()
    crop_params = CROP_DEFAULTS.get(crop_key, {"temp": 4.5, "hum": 88.0})

    if num_readings is None:
        total_samples = max(3, int(duration_sec / interval_sec)) if duration_sec else 10
    else:
        total_samples = max(3, num_readings)

    # Resolve fault configuration
    faults = []
    fault_type = None
    fault_pos = -1
    if fault_name:
        lookup_key = fault_name.lower().strip()
        if lookup_key not in FAULT_MAP:
            raise ValueError(
                f"Unknown fault: '{fault_name}'. Choose from: {list(FAULT_MAP.keys())}"
            )
        fault_type = FAULT_MAP[lookup_key]
        # Position fault mid-stream so initial readings establish baseline
        fault_pos = max(1, total_samples // 2)
        faults.append(FaultConfig(fault_type=fault_type, position=fault_pos))

    print("=" * 70)
    print(f"Starting AgriChain Telemetry Stream for Batch: {batch_id}")
    print(f"Crop: {crop_name} (baseline temp={crop_params['temp']}°C, hum={crop_params['hum']}%)")
    print(f"Samples: {total_samples} | Interval: {interval_sec}s | Target: {endpoint}")
    if fault_name:
        print(f"Fault Injection Configured: {fault_name} -> {fault_type.value} at sample #{fault_pos + 1}")
    print("=" * 70)

    # Ensure start_time and GPS position advance smoothly past any previously recorded readings for this batch
    start_time = None
    start_lat = 18.5204
    start_lon = 73.8567
    try:
        from app.services.history import history_repository
        last_reading = history_repository.get_last_reading(device_id=f"DEV-{batch_id}", batch_id=batch_id)
        if last_reading:
            if last_reading.timestamp:
                start_time = last_reading.timestamp + timedelta(seconds=max(60.0, interval_sec))
            if last_reading.latitude is not None and last_reading.longitude is not None:
                start_lat = last_reading.latitude
                start_lon = last_reading.longitude
    except Exception:
        pass
    if start_time is None:
        start_time = datetime.now(timezone.utc)

    # Generate sequence via trust-layer simulator service
    sim_config = SimulationConfig(
        device_id=f"DEV-{batch_id}",
        batch_id=batch_id,
        num_readings=total_samples,
        time_step_seconds=max(60.0, interval_sec),  # Realistic time step for physical rates
        start_temp=crop_params["temp"],
        start_humidity=crop_params["hum"],
        start_lat=start_lat,
        start_lon=start_lon,
        start_time=start_time,
        faults=faults,
    )
    sequence = telemetry_simulator.generate_sequence(sim_config)

    start_wall_time = time.time()
    valid_count = 0
    anomalous_count = 0

    for idx, reading in enumerate(sequence):
        elapsed = int(time.time() - start_wall_time)
        payload = reading.model_dump(mode="json")
        payload["crop_name"] = crop_name

        is_injected_fault = (idx == fault_pos) and (fault_type is not None)
        tag = " [FAULT INJECTED]" if is_injected_fault else ""

        try:
            res = send_telemetry(endpoint, payload)
            verdict = res.get("verdict")
            disposition = res.get("disposition", "UNKNOWN")
            tx = res.get("tx_hash")
            reason = res.get("reason")
            reason_codes = res.get("reason_codes", [])

            loc_str = f"({reading.latitude:.4f}, {reading.longitude:.4f})"

            if verdict == "VALID":
                valid_count += 1
                short_tx = f"{tx[:12]}..." if tx else "None"
                print(
                    f"[{elapsed:02d}s] Sample #{idx + 1:02d}: Temp={reading.temperature:.1f}°C, "
                    f"Hum={reading.humidity:.1f}%, Loc={loc_str} -> "
                    f"VALID ({disposition}) [tx: {short_tx}]{tag}"
                )
            else:
                anomalous_count += 1
                codes_str = ", ".join(reason_codes) if reason_codes else (reason or "QUARANTINED")
                print(
                    f"[{elapsed:02d}s] Sample #{idx + 1:02d}: Temp={reading.temperature:.1f}°C, "
                    f"Hum={reading.humidity:.1f}%, Loc={loc_str} -> "
                    f"ANOMALOUS ({disposition}): {codes_str}{tag}"
                )

        except Exception as e:
            print(f"[{elapsed:02d}s] Sample #{idx + 1:02d}: Failed to send telemetry: {e}")

        # Sleep interval between sends (unless last sample)
        if idx < len(sequence) - 1 and interval_sec > 0:
            time.sleep(interval_sec)

    print("-" * 70)
    print(
        f"Stream completed. Total: {len(sequence)} samples "
        f"(VALID / READY_FOR_ORACLE: {valid_count}, ANOMALOUS / QUARANTINED: {anomalous_count})"
    )
    print("-" * 70)
    return {
        "total": len(sequence),
        "valid": valid_count,
        "anomalous": anomalous_count,
    }


def main():
    parser = argparse.ArgumentParser(
        description="AgriChain Multi-Fault IoT Telemetry Simulator"
    )
    parser.add_argument(
        "--batch-id", required=True, help="Batch ID to simulate readings for"
    )
    parser.add_argument(
        "--crop-name", default="tomato", help="Crop name: tomato, mango, wheat (default: tomato)"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=30,
        help="Duration in seconds (default: 30s)",
    )
    parser.add_argument(
        "--interval",
        type=float,
        default=1.0,
        help="Interval between transmissions in seconds (default: 1.0s)",
    )
    parser.add_argument(
        "--endpoint",
        default="http://localhost:8000/telemetry",
        help="Target /telemetry API endpoint",
    )
    parser.add_argument(
        "--fault",
        default=None,
        choices=[
            "temp_spike",
            "humidity_spike",
            "gps_jump",
            "timestamp_drift",
            "replay_attack",
            "telemetry_gap",
            "composite",
            # Aliases
            "temperature_spike",
            "timestamp_out_of_order",
            "replay",
            "combined",
        ],
        help="Inject deliberate fault into stream",
    )
    parser.add_argument(
        "--inject-fault",
        dest="fault",
        help="Alias for --fault",
    )
    parser.add_argument(
        "--num-readings",
        type=int,
        default=None,
        help="Exact number of readings to generate (overrides duration/interval count)",
    )

    args = parser.parse_args()
    run_simulator(
        batch_id=args.batch_id,
        crop_name=args.crop_name,
        duration_sec=args.duration,
        interval_sec=args.interval,
        endpoint=args.endpoint,
        fault_name=args.fault,
        num_readings=args.num_readings,
    )


if __name__ == "__main__":
    main()
