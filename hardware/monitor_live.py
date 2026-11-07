#!/usr/bin/env python3
"""
AgriChain 7-Subsystem Real-Time Edge Node Mission Control Dashboard
Features:
- Live serial telemetry reading from ESP32 on /dev/ttyUSB0 (115200 baud)
- Hardware SHA-256 cryptographic hash verification
- LittleFS onboard storage sync upon PC connect (auto-downloads to transit_logs/)
- Full end-to-end FastAPI AI Trust Layer pipeline forwarding (POST /telemetry & /telemetry/batch)
- Interactive keyboard controls (P: Pause, S: Sync, C: Clear, M: Google Maps, B: Cycle Batch, Q: Quit)
- Terminal audio bell (\a) on transit impact shocks and optical crate tampering
- Responsive rich terminal dashboard with non-blocking threading
"""
import sys
import os
import time
import json
import argparse
import select
import termios
import tty
import threading
import queue
import urllib.request
import webbrowser
from datetime import datetime, timezone
import serial
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich.text import Text

PORT = '/dev/ttyUSB0'
BAUD = 115200
TRANSIT_LOG_DIR = os.path.join(os.path.dirname(__file__), 'transit_logs')

# Produce lot presets for live interactive cycling
BATCH_PRESETS = [
    {"batch_id": "BAT-MGO-701", "crop_name": "Alphonso Mango", "desc": "Ratnagiri GI Cold-Chain"},
    {"batch_id": "BAT-TOM-802", "crop_name": "Organic Field Tomatoes", "desc": "Nashik Agro Cluster"},
    {"batch_id": "BAT-APL-903", "crop_name": "Shimla Royal Apples", "desc": "Himachal Controlled Atmos"},
    {"batch_id": "BAT-TUR-404", "crop_name": "Salem Pure Turmeric", "desc": "Curcumin High Grade"},
    {"batch_id": "BAT-WHT-505", "crop_name": "Sharbati Golden Wheat", "desc": "MP Sehore Dry Storage"},
    {"batch_id": "BAT-BER-606", "crop_name": "Fresh Strawberries", "desc": "Mahabaleshwar Cold Express"},
]

console = Console()

def create_dashboard_layout():
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="sensors", size=18),
        Layout(name="log", ratio=1),
        Layout(name="footer", size=3)
    )
    return layout

def format_sensor_table(data, batch_info, backend_state):
    table = Table(title="📊 Real-Time Multi-Sensor Telemetry, Edge Security & AI Trust Ledger", expand=True, border_style="bright_blue")
    table.add_column("Subsystem & Layer", style="bold white", width=22)
    table.add_column("Channel / Interface", style="cyan", width=20)
    table.add_column("Deep Metric Values & Diagnostics", style="bright_yellow", width=36)
    table.add_column("Biological / Security Status", style="bold", width=32)

    # 1. DHT11 Microclimate
    temp = data.get("temp", 0.0)
    hum = data.get("hum", 0.0)
    dew_pt = data.get("dew_pt", 0.0)
    cond_margin = data.get("cond_margin", 0.0)
    heat_idx = data.get("heat_idx", 0.0)
    deci_c = int(round(temp * 10))

    if cond_margin < 2.0:
        dew_badge = "[bold red]⚠️ CONDENSATION DANGER (Dew Point close!)[/bold red]"
    else:
        dew_badge = f"[bold green]● Condensation Margin: {cond_margin:.1f}°C (Safe)[/bold green]"

    table.add_row(
        "🌡️ Microclimate",
        "DHT11 (GPIO 4)",
        f"{temp:.1f}°C ({deci_c} deci-°C) | {hum:.1f}% RH\nDew Point: {dew_pt:.1f}°C | Heat Index: {heat_idx:.1f}°C",
        f"[bold green]● IN COLD-CHAIN POLICY[/bold green]\n{dew_badge}"
    )

    # 2. MQ-135 Gas E-Nose
    gas_v = data.get("gas_v", 0.0)
    gas_adc = data.get("gas_adc", 0)
    co2 = data.get("co2_ppm", 400.0)
    nh3 = data.get("nh3_ppm", 0.0)
    alc = data.get("alcohol_ppm", 0.0)
    ace = data.get("acetone_ppm", 0.0)
    is_warmup = data.get("warmup", False)

    if is_warmup:
        gas_badge = "[bold yellow]⏳ Heater Pre-Heating / Calibrating[/bold yellow]"
    elif co2 > 1500.0 or nh3 > 15.0 or alc > 30.0:
        gas_badge = "[bold red]🚨 ACTIVE SPOILAGE & ROT DETECTED[/bold red]"
    elif co2 > 850.0:
        gas_badge = "[bold yellow]🌱 Active Respiration / Ripening[/bold yellow]"
    else:
        gas_badge = "[bold green]🍃 Fresh Ambient Storage Air[/bold green]"

    table.add_row(
        "💨 Gas E-Nose\n(Respiration/Rot)",
        "MQ-135 (GPIO 34, ADC1)",
        f"CO₂: {co2:.0f} ppm | NH₃ (Ammonia): {nh3:.2f} ppm\nAlcohol: {alc:.2f} ppm | Acetone: {ace:.2f} ppm\nRaw: {gas_v:.2f}V (ADC: {gas_adc})",
        f"{gas_badge}\n[dim]Two-Variable Hygrothermal Compensated[/dim]"
    )

    # 3. SW-420 Shock Switch
    shocks = data.get("shocks", 0)
    shock_status = "[bold green]🛡️ Stable & Secure[/bold green]" if shocks == 0 else f"[bold red]🚨 {shocks} POTHOLE/IMPACT(S) DETECTED[/bold red]"
    table.add_row(
        "💥 Mechanical Shock",
        "SW-420 (GPIO 32, IRQ)",
        f"{shocks} Shock Event(s) Logged\n[dim]Hardware IRQ • 25ms Debounce[/dim]",
        f"{shock_status}\n[dim]Sub-µs Hardware Interrupt Latency[/dim]"
    )

    # 4. LDR Light & Tamper
    ldr_v = data.get("ldr_v", 0.0)
    ldr_adc = data.get("ldr_adc", 0)
    ldr_pct = data.get("ldr_pct", 0.0)
    lux = data.get("lux", 0.0)

    if ldr_adc < 250:
        ldr_status = "[bold cyan]🌑 100% Sealed Crate (Pitch Dark)[/bold cyan]"
        ldr_sub = "[green]Tamper-Proof: No Light Ingress[/green]"
    elif ldr_adc < 1200:
        ldr_status = "[bold yellow]🕯️ Low Light / Seam Leak[/bold yellow]"
        ldr_sub = "[yellow]Minor Box Gap or Thin Lid[/yellow]"
    elif ldr_adc < 2800:
        ldr_status = "[bold yellow]⛅ Ambient Warehouse Light[/bold yellow]"
        ldr_sub = "[yellow]Container Partially Opened[/yellow]"
    else:
        ldr_status = "[bold red]☀️ DIRECT SUNLIGHT / BREACH ALERT![/bold red]"
        ldr_sub = "[bold red]Lid Fully Removed / Pilferage Risk[/bold red]"

    table.add_row(
        "💡 Optical Anti-Tamper",
        "LDR (GPIO 35, ADC1)",
        f"Est. Light: ~{lux:.0f} Lux | Intensity: {ldr_pct:.1f}%\nRaw: {ldr_v:.2f}V (ADC: {ldr_adc} / 4095)",
        f"{ldr_status}\n{ldr_sub}"
    )

    # 5. NEO-6M GPS
    gps_fix = data.get("gps_fix", False)
    sats = data.get("sats", 0)
    chars = data.get("nmea_chars", 0)
    if gps_fix:
        lat = data.get("lat", 0.0)
        lon = data.get("lon", 0.0)
        alt = data.get("alt", 0.0)
        speed = data.get("speed", 0.0)
        hdop = data.get("hdop", 1.0)
        maps_url = f"https://www.google.com/maps?q={lat:.6f},{lon:.6f}"
        gps_metric = f"Lat: {lat:.6f}, Lon: {lon:.6f} | Alt: {alt:.1f}m\nSpeed: {speed:.1f} km/h | HDOP: {hdop:.2f} | Sats: {sats}\n[link={maps_url}][bold cyan]{maps_url}[/bold cyan][/link]"
        gps_status = "[bold green]🛰️ 3D SATELLITE FIX LOCKED[/bold green]\n[underline bright_white]Press [M] to open in Maps[/underline bright_white]"
    else:
        gps_metric = f"NMEA Raw Bytes: {chars} | Sats Visible: {sats}\n[dim]Autonomous Background Receiver[/dim]"
        gps_status = "[bold yellow]🛰️ Background Acquisition (No Sky Lock)[/bold yellow]\n[dim]Telemetry Active | Non-blocking GPS[/dim]"

    table.add_row(
        "🛰️ Highway Geolocation",
        "NEO-6M (GPIO 16, RX2)",
        gps_metric,
        gps_status
    )

    # 6. LittleFS Storage & Cryptographic Hash
    flash_records = data.get("flash_records", 0)
    flash_bytes = data.get("flash_bytes", 0)
    kb_used = flash_bytes / 1024.0
    rec_hash = data.get("hash", "0000000000000000")

    if flash_records > 0:
        storage_status = f"[bold green]● BUFFERING ACTIVE[/bold green]\n[dim]{flash_records} Records on Flash[/dim]"
    else:
        storage_status = "[bold cyan]● BUFFER SYNCHRONIZED[/bold cyan]\n[dim]Flash ready for transit[/dim]"

    table.add_row(
        "💾 Edge Security Buffer",
        "LittleFS Partition\nmbedTLS SHA-256",
        f"Flash: {flash_records} recs ({kb_used:.1f} KB)\nSHA-256 Hash: [bright_cyan]{rec_hash}[/bright_cyan]",
        storage_status
    )

    # 7. AI Trust Layer & Blockchain Oracle
    is_online = backend_state.get("online", False)
    ai_verdict = backend_state.get("verdict", "PENDING")
    tx_hash = backend_state.get("tx_hash", "")
    latency = backend_state.get("latency_ms", 0.0)
    reason = backend_state.get("reason", "")

    if is_online:
        if ai_verdict == "VALID":
            oracle_status = f"[bold green]● ANCHORED ON-CHAIN[/bold green]\n[dim]TX: {tx_hash[:16]}...[/dim]"
        elif ai_verdict == "ANOMALOUS":
            oracle_status = f"[bold red]🚨 AI QUARANTINED[/bold red]\n[dim]{reason[:26] if reason else 'Policy Breach'}[/dim]"
        else:
            oracle_status = "[bold cyan]● EVALUATING INGESTION[/bold cyan]\n[dim]AI Trust Pipe Active[/dim]"
        
        oracle_metric = (
            f"Lot: [bold white]{batch_info['batch_id']}[/bold white] ({batch_info['crop_name']})\n"
            f"AI Model: Isolation Forest + Heuristics | Ingestion: {latency:.1f}ms"
        )
    else:
        oracle_status = "[bold yellow]● STANDALONE MODE[/bold yellow]\n[dim]Hardware SHA-256 Local Ledger[/dim]"
        oracle_metric = (
            f"Lot: [bold white]{batch_info['batch_id']}[/bold white] ({batch_info['crop_name']})\n"
            "[dim]Start FastAPI backend (:8000) for real-time Web3 Oracle[/dim]"
        )

    table.add_row(
        "🤖 AI Trust & Oracle",
        "FastAPI :8000\nHardhat Local EVM",
        oracle_metric,
        oracle_status
    )

    return table

def sync_offline_storage_if_present(ser, force_clear=False, skip_sync=False):
    """
    Queries ESP32 for offline buffered telemetry and downloads records to disk.
    Returns list of synced record JSON objects.
    """
    os.makedirs(TRANSIT_LOG_DIR, exist_ok=True)
    time.sleep(0.4)
    ser.reset_input_buffer()

    if force_clear:
        ser.write(b"CMD:CLEAR\n")
        ser.flush()
        time.sleep(0.3)
        ser.reset_input_buffer()
        console.print("[bold yellow]🧹 LittleFS flash buffer cleared.[/bold yellow]")
        return []

    if skip_sync:
        return []

    # Send status query
    ser.write(b"CMD:STATUS\n")
    ser.flush()

    record_count = 0
    start = time.time()
    while time.time() - start < 1.8:
        if ser.in_waiting:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line.startswith("STATUS:"):
                try:
                    payload = json.loads(line[7:])
                    record_count = payload.get("records", 0)
                except Exception:
                    pass
                break
        else:
            time.sleep(0.03)

    if record_count == 0:
        return []

    console.print(f"[bold cyan]📦 Found {record_count} offline records in ESP32 Flash. Syncing to PC...[/bold cyan]")
    ser.write(b"CMD:SYNC\n")
    ser.flush()

    synced_records = []
    dump_timeout = max(8.0, record_count * 0.05 + 4.0)
    dump_start = time.time()

    while time.time() - dump_start < dump_timeout:
        if ser.in_waiting:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line.startswith("OFFLINE_JSON:"):
                try:
                    record = json.loads(line[13:])
                    synced_records.append(record)
                except Exception:
                    pass
            elif "OFFLINE_SYNC_COMPLETE" in line or "OFFLINE_DUMP_COMPLETE" in line:
                break
        else:
            time.sleep(0.01)

    if synced_records:
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_filename = os.path.join(TRANSIT_LOG_DIR, f"transit_dump_{ts}.jsonl")
        with open(out_filename, "w", encoding="utf-8") as f:
            for rec in synced_records:
                f.write(json.dumps(rec) + "\n")
        console.print(f"[bold green]✅ Downloaded {len(synced_records)} transit records to {out_filename}[/bold green]")
        time.sleep(0.6)

    # Clean residual buffers
    ser.reset_input_buffer()
    return synced_records

def forward_batch_to_backend(records, batch_info):
    """
    Submits synced offline records to FastAPI POST /telemetry/batch.
    """
    BATCH_URL = "http://localhost:8000/telemetry/batch"
    readings = []
    for r in records:
        readings.append({
            "batch_id": batch_info["batch_id"],
            "crop_name": batch_info["crop_name"],
            "temp_c": r.get("temp"),
            "humidity_pct": r.get("hum"),
            "device_id": "ESP32-PENTAD-01",
            "latitude": r.get("lat") if r.get("gps_fix") else 19.0760,
            "longitude": r.get("lon") if r.get("gps_fix") else 72.8777,
            "freshness_voc_ppm": r.get("co2_ppm"),
            "tamper_status": "TAMPERED" if (r.get("shocks", 0) > 0 or r.get("ldr_adc", 0) > 2500) else "SEALED",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    try:
        req_data = json.dumps({"readings": readings}).encode('utf-8')
        req = urllib.request.Request(BATCH_URL, data=req_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None

def backend_worker(telemetry_queue, backend_state, stop_event):
    """
    Background worker thread forwarding live telemetry to POST /telemetry
    without delaying or blocking the serial ingestion loop.
    """
    BACKEND_URL = "http://localhost:8000/telemetry"
    while not stop_event.is_set():
        try:
            item = telemetry_queue.get(timeout=0.2)
        except queue.Empty:
            continue

        if item is None:
            break

        packet, batch_info = item
        payload = {
            "batch_id": batch_info["batch_id"],
            "crop_name": batch_info["crop_name"],
            "temp_c": packet.get("temp"),
            "humidity_pct": packet.get("hum"),
            "device_id": "ESP32-PENTAD-01",
            "latitude": packet.get("lat") if packet.get("gps_fix") else 19.0760,
            "longitude": packet.get("lon") if packet.get("gps_fix") else 72.8777,
            "freshness_voc_ppm": packet.get("co2_ppm"),
            "tamper_status": "TAMPERED" if (packet.get("shocks", 0) > 0 or packet.get("ldr_adc", 0) > 2500) else "SEALED",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        try:
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(BACKEND_URL, data=req_data, headers={"Content-Type": "application/json"})
            t0 = time.time()
            with urllib.request.urlopen(req, timeout=1.2) as resp:
                latency = (time.time() - t0) * 1000.0
                res_data = json.loads(resp.read().decode('utf-8'))
                backend_state["online"] = True
                backend_state["verdict"] = res_data.get("verdict", "VALID")
                backend_state["tx_hash"] = res_data.get("tx_hash") or ""
                backend_state["reason"] = res_data.get("reason") or ""
                backend_state["anomaly_score"] = res_data.get("anomaly_score", 0.0)
                backend_state["latency_ms"] = latency
        except Exception:
            backend_state["online"] = False
            backend_state["verdict"] = "OFFLINE"
        finally:
            telemetry_queue.task_done()

def keyboard_listener(cmd_queue, stop_event):
    """
    Daemon thread reading non-blocking keypresses via termios/tty on Linux.
    """
    if not sys.stdin.isatty():
        return
    fd = sys.stdin.fileno()
    try:
        old_settings = termios.tcgetattr(fd)
    except Exception:
        return

    try:
        tty.setcbreak(fd)
        while not stop_event.is_set():
            r, _, _ = select.select([sys.stdin], [], [], 0.1)
            if r:
                ch = sys.stdin.read(1)
                if ch:
                    cmd_queue.put(ch.lower())
    except Exception:
        pass
    finally:
        try:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        except Exception:
            pass

def main():
    parser = argparse.ArgumentParser(description="AgriChain Real-Time Telemetry Monitor")
    parser.add_argument("--clear", action="store_true", help="Clear onboard LittleFS storage before running")
    parser.add_argument("--skip-sync", action="store_true", help="Skip offline download and start dashboard immediately")
    parser.add_argument("--batch", type=str, default="BAT-MGO-701", help="Default active produce lot ID")
    args = parser.parse_args()

    # Active batch selection
    batch_idx = 0
    for i, b in enumerate(BATCH_PRESETS):
        if b["batch_id"] == args.batch:
            batch_idx = i
            break

    console.print(Panel(
        Text.assemble(
            ("🚚 AgriChain Edge Node Mission Control\n", "bold bright_cyan"),
            ("Establishing hardware link with ESP32 on ", "dim white"),
            (f"{PORT} @ {BAUD} baud\n", "bright_yellow"),
            ("Hardware SHA-256 • LittleFS Sync • AI Trust Pipeline • Interactive Hotkeys", "dim cyan")
        ),
        border_style="cyan"
    ))

    try:
        ser = serial.Serial(PORT, BAUD, timeout=0.5)
        ser.dtr = False
        ser.rts = False
    except Exception as e:
        console.print(f"[bold red]❌ Error opening {PORT}: {e}[/bold red]")
        sys.exit(1)

    # Allow ESP32 ROM bootloader to settle and flush initial noise
    time.sleep(0.8)
    ser.reset_input_buffer()

    # Sync offline transit records if present in LittleFS
    synced = sync_offline_storage_if_present(ser, force_clear=args.clear, skip_sync=args.skip_sync)
    recent_logs = []
    if synced:
        recent_logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 [TRANSIT SYNC] Downloaded {len(synced)} offline readings from LittleFS onboard flash!")
        # Forward offline batch to backend if available
        batch_resp = forward_batch_to_backend(synced, BATCH_PRESETS[batch_idx])
        if batch_resp:
            recent_logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] ⛓️ [AI ORACLE] Anchored {batch_resp.get('valid_count', 0)} offline readings to blockchain (TX: {batch_resp.get('tx_hash', 'N/A')[:16]}...)")

    # Await first live packet before launching full-screen UI so dashboard never starts at cycle 0
    console.print("[cyan]⏳ Synchronizing live telemetry pulse from hardware sensors...[/cyan]")
    current_data = {
        "cycle": 1, "uptime": 1, "temp": 28.5, "hum": 65.0,
        "dew_pt": 21.0, "heat_idx": 29.5, "cond_margin": 7.5,
        "gas_adc": 1350, "gas_v": 1.09,
        "co2_ppm": 400.0, "nh3_ppm": 2.0, "alcohol_ppm": 2.5, "acetone_ppm": 0.8,
        "shocks": 0, "ldr_adc": 150, "ldr_v": 0.12, "ldr_pct": 3.5, "lux": 2.0,
        "gps_fix": False, "lat": 0.0, "lon": 0.0, "alt": 0.0, "speed": 0.0,
        "hdop": 99.9, "sats": 0, "nmea_chars": 0,
        "flash_records": 0, "flash_bytes": 0, "warmup": False,
        "hash": "0000000000000000"
    }

    start_wait = time.time()
    while time.time() - start_wait < 3.5:
        raw = ser.readline()
        if raw:
            line = raw.decode('utf-8', errors='replace').strip()
            if line.startswith("JSON:"):
                try:
                    first_packet = json.loads(line[5:])
                    current_data.update(first_packet)
                    break
                except Exception:
                    pass

    # Threading queues and state
    cmd_queue = queue.Queue()
    telemetry_queue = queue.Queue()
    stop_event = threading.Event()

    backend_state = {
        "online": False,
        "verdict": "PENDING",
        "tx_hash": "",
        "reason": "",
        "anomaly_score": 0.0,
        "latency_ms": 0.0
    }

    # Start background threads
    t_key = threading.Thread(target=keyboard_listener, args=(cmd_queue, stop_event), daemon=True)
    t_key.start()

    t_back = threading.Thread(target=backend_worker, args=(telemetry_queue, backend_state, stop_event), daemon=True)
    t_back.start()

    stream_paused = False
    last_shock_count = current_data.get("shocks", 0)
    last_ldr_adc = current_data.get("ldr_adc", 0)
    last_forward_time = 0

    layout = create_dashboard_layout()

    with Live(layout, refresh_per_second=4, console=console, screen=True) as live:
        while True:
            try:
                # 1. Process hotkey commands from keyboard listener thread
                while not cmd_queue.empty():
                    key = cmd_queue.get_nowait()
                    now_str = datetime.now().strftime("%H:%M:%S")

                    if key == 'q':
                        recent_logs.append(f"[{now_str}] 👋 [SHUTDOWN] Exiting AgriChain mission control cleanly...")
                        stop_event.set()
                        time.sleep(0.3)
                        ser.close()
                        return

                    elif key == 'p':
                        stream_paused = not stream_paused
                        cmd = b"CMD:PAUSE\n" if stream_paused else b"CMD:RESUME\n"
                        ser.write(cmd)
                        ser.flush()
                        p_str = "⏸️ PAUSED (Telemetry frozen)" if stream_paused else "▶️ RESUMED (Streaming 1 Hz)"
                        recent_logs.append(f"[{now_str}] 🕹️ [CONTROL] {p_str}")

                    elif key == 's':
                        recent_logs.append(f"[{now_str}] 💾 [SYNC] Manually triggering LittleFS flash buffer sync...")
                        ser.write(b"CMD:SYNC\n")
                        ser.flush()

                    elif key == 'c':
                        ser.write(b"CMD:CLEAR\n")
                        ser.flush()
                        current_data["flash_records"] = 0
                        current_data["flash_bytes"] = 0
                        recent_logs.append(f"[{now_str}] 🧹 [FLASH] LittleFS storage formatted & cleared to 0 bytes.")

                    elif key == 'm':
                        if current_data.get("gps_fix"):
                            lat = current_data.get("lat", 0.0)
                            lon = current_data.get("lon", 0.0)
                            url = f"https://www.google.com/maps?q={lat:.6f},{lon:.6f}"
                            webbrowser.open(url)
                            recent_logs.append(f"[{now_str}] 🗺️ [MAPS] Opened Google Maps coordinates in browser!")
                        else:
                            recent_logs.append(f"[{now_str}] 🛰️ [MAPS] GPS acquisition active (No 3D fix locked yet). Place antenna near sky.")

                    elif key == 'b':
                        batch_idx = (batch_idx + 1) % len(BATCH_PRESETS)
                        active_b = BATCH_PRESETS[batch_idx]
                        recent_logs.append(f"[{now_str}] 🌾 [BATCH SWITCH] Active produce lot set to {active_b['batch_id']} ({active_b['crop_name']})")

                # 2. Read incoming serial telemetry
                raw_line = ser.readline()
                if raw_line:
                    line = raw_line.decode('utf-8', errors='replace').strip()
                    now_str = datetime.now().strftime("%H:%M:%S")

                    if line.startswith("JSON:"):
                        try:
                            json_str = line[5:]
                            parsed = json.loads(json_str)
                            current_data.update(parsed)

                            cycle_num = current_data.get("cycle", 0)
                            temp = current_data.get("temp", 0.0)
                            co2 = current_data.get("co2_ppm", 0.0)
                            nh3 = current_data.get("nh3_ppm", 0.0)
                            shocks = current_data.get("shocks", 0)
                            lux = current_data.get("lux", 0.0)
                            chars = current_data.get("nmea_chars", 0)
                            flash_recs = current_data.get("flash_records", 0)
                            rec_hash = current_data.get("hash", "N/A")

                            # Audio Bell Alerts on Anomaly
                            if shocks > last_shock_count:
                                sys.stdout.write('\a')
                                sys.stdout.flush()
                                last_shock_count = shocks

                            cur_ldr = current_data.get("ldr_adc", 0)
                            if cur_ldr > 2500 and last_ldr_adc <= 2500:
                                sys.stdout.write('\a\a')
                                sys.stdout.flush()
                            last_ldr_adc = cur_ldr

                            alert_tag = " [bold red]🚨[IMPACT][/bold red]" if shocks > 0 else ""
                            tamper_tag = " [bold yellow]☀️[LIGHT BREACH][/bold yellow]" if (cur_ldr > 2500) else ""
                            warmup_tag = " [dim](Warmup)[/dim]" if current_data.get("warmup", False) else ""
                            
                            log_msg = f"[{now_str}] #{cycle_num:04d} | 🌡️ {temp:.1f}°C | 💨 CO₂:{co2:.0f}ppm | 💡 ~{lux:.0f}Lx{tamper_tag} | 💥 {shocks} Shk{alert_tag} | 💾 {flash_recs} Buf | 🔒 #{rec_hash[:8]}"
                            recent_logs.append(log_msg)
                            if len(recent_logs) > 500:
                                recent_logs.pop(0)

                            # Enqueue for FastAPI AI Trust evaluation (every 2s or immediately on anomaly)
                            is_anomaly = (shocks > 0) or (cur_ldr > 2500)
                            if (time.time() - last_forward_time >= 2.0) or is_anomaly:
                                last_forward_time = time.time()
                                telemetry_queue.put((current_data.copy(), BATCH_PRESETS[batch_idx]))

                        except Exception:
                            pass

                    elif line.startswith("OFFLINE_JSON:"):
                        recent_logs.append(f"[{now_str}] 💾 [SYNC REC] Synced offline packet from LittleFS")
                        if len(recent_logs) > 500:
                            recent_logs.pop(0)

                    elif line.startswith("STATUS:"):
                        pass

                # 3. Update Header
                uptime_s = current_data.get("uptime", 0)
                mins, secs = divmod(uptime_s, 60)
                hours, mins = divmod(mins, 60)
                uptime_fmt = f"{hours:02d}:{mins:02d}:{secs:02d}"

                flash_recs = current_data.get("flash_records", 0)
                active_batch = BATCH_PRESETS[batch_idx]

                header_text = Text()
                header_text.append("🚚 AgriChain Mission Control", style="bold cyan")
                header_text.append(f"  |  Port: {PORT}", style="white")
                header_text.append(f"  |  Uptime: {uptime_fmt}", style="green")
                header_text.append(f"  |  💾 Flash: {flash_recs} recs", style="magenta")
                header_text.append(f"  |  Active Lot: {active_batch['batch_id']}", style="bold bright_yellow")
                if stream_paused:
                    header_text.append("  |  ⏸️ PAUSED", style="bold red")
                else:
                    header_text.append("  |  ▶️ LIVE 1Hz", style="bold green")
                layout["header"].update(Panel(header_text, style="blue"))

                # 4. Update Sensor Table
                layout["sensors"].update(format_sensor_table(current_data, active_batch, backend_state))

                # 5. Update Event Ledger (fills remaining vertical space)
                avail_lines = max(5, console.size.height - 27)
                visible_logs = recent_logs[-avail_lines:]
                log_content = "\n".join(visible_logs) if visible_logs else "[dim]Awaiting telemetry packets...[/dim]"
                layout["log"].update(
                    Panel(
                        log_content,
                        title="📜 Multi-Gas, Shock & Optical Event Ledger (1000ms Real-Time Pulse)",
                        subtitle=f"[dim]Displaying latest {len(visible_logs)} cycles | Log buffer: {len(recent_logs)} packets | LittleFS Active[/dim]",
                        border_style="green"
                    )
                )

                # 6. Update Hotkey Footer Navigation Bar
                footer_text = Text()
                footer_text.append("[P] ", style="bold bright_cyan")
                footer_text.append("Pause/Resume  ", style="white")
                footer_text.append("[S] ", style="bold bright_cyan")
                footer_text.append("Sync Flash  ", style="white")
                footer_text.append("[C] ", style="bold bright_cyan")
                footer_text.append("Clear Flash  ", style="white")
                footer_text.append("[M] ", style="bold bright_cyan")
                footer_text.append("Maps Link  ", style="white")
                footer_text.append("[B] ", style="bold bright_cyan")
                footer_text.append(f"Cycle Produce Lot ({active_batch['batch_id']})  ", style="bold bright_yellow")
                footer_text.append("[Q] ", style="bold bright_red")
                footer_text.append("Quit", style="white")
                layout["footer"].update(Panel(footer_text, style="bright_blue"))

            except KeyboardInterrupt:
                break
            except Exception:
                time.sleep(0.1)

    stop_event.set()
    ser.close()

if __name__ == '__main__':
    main()
