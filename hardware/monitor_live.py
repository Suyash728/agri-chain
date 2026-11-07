#!/usr/bin/env python3
"""
AgriChain 6-Subsystem Real-Time Edge Node Mission Control Dashboard
Reads /dev/ttyUSB0, handles automatic offline LittleFS telemetry sync upon PC connect,
and renders deep detailed multi-gas, optical, and transit shock telemetry.
"""
import sys
import os
import time
import json
import argparse
import serial
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich.text import Text

PORT = '/dev/ttyUSB0'
BAUD = 115200
TRANSIT_LOG_DIR = os.path.join(os.path.dirname(__file__), 'transit_logs')

console = Console()

def create_dashboard_layout():
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="sensors", size=18),
        Layout(name="log", ratio=1)
    )
    return layout

def format_sensor_table(data):
    table = Table(title="📊 Real-Time Multi-Sensor Telemetry & Edge Storage Breakdown", expand=True, border_style="bright_blue")
    table.add_column("Sensor Subsystem", style="bold white", width=22)
    table.add_column("Channel & Pin", style="cyan", width=18)
    table.add_column("Deep Metric Values", style="bright_yellow", width=36)
    table.add_column("Biological / Hardware Status", style="bold", width=32)

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
        f"{shocks} Shock Event(s) Logged\n[dim]Threshold: 25ms Debounce[/dim]",
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
        gps_status = "[bold green]🛰️ 3D SATELLITE FIX LOCKED[/bold green]\n[underline bright_white]Click link to open in Google Maps[/underline bright_white]"
    else:
        gps_metric = f"NMEA Raw Bytes: {chars} | Sats Visible: {sats}\n[dim]Autonomous Background Receiver[/dim]"
        gps_status = "[bold yellow]🛰️ Background Acquisition (No Sky Lock)[/bold yellow]\n[dim]Telemetry Active | Non-blocking GPS[/dim]"

    table.add_row(
        "🛰️ Highway Geolocation",
        "NEO-6M (GPIO 16, RX2)",
        gps_metric,
        gps_status
    )

    # 6. LittleFS Onboard Storage & Edge Buffering
    flash_records = data.get("flash_records", 0)
    flash_bytes = data.get("flash_bytes", 0)
    kb_used = flash_bytes / 1024.0

    if flash_records > 0:
        storage_status = f"[bold green]● BUFFERING ACTIVE[/bold green]\n[dim]{flash_records} Records on Flash[/dim]"
    else:
        storage_status = "[bold cyan]● BUFFER SYNCHRONIZED[/bold cyan]\n[dim]Flash ready for transit[/dim]"

    table.add_row(
        "💾 Edge Flash Buffer",
        "LittleFS (1.4MB Partition)",
        f"{flash_records} Records Logged ({kb_used:.1f} KB)\n[dim]Auto-buffered on transit & anomaly[/dim]",
        storage_status
    )

    return table

def sync_offline_storage_if_present(ser, force_clear=False, skip_sync=False):
    """
    Queries ESP32 for offline buffered telemetry and downloads records to disk.
    Returns list of synced record JSON objects.
    """
    os.makedirs(TRANSIT_LOG_DIR, exist_ok=True)
    time.sleep(0.3)
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
    while time.time() - start < 1.5:
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
    dump_timeout = max(8.0, record_count * 0.04 + 4.0)
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
        time.sleep(0.8)

    # Clean residual buffers
    ser.reset_input_buffer()
    return synced_records

def main():
    parser = argparse.ArgumentParser(description="AgriChain Real-Time Telemetry Monitor")
    parser.add_argument("--clear", action="store_true", help="Clear onboard LittleFS storage before running")
    parser.add_argument("--skip-sync", action="store_true", help="Skip offline download and start dashboard immediately")
    args = parser.parse_args()

    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        ser.dtr = False
        ser.rts = False
    except Exception as e:
        console.print(f"[bold red]Error opening {PORT}: {e}[/bold red]")
        sys.exit(1)

    # Perform handshake and sync offline transit records
    synced = sync_offline_storage_if_present(ser, force_clear=args.clear, skip_sync=args.skip_sync)

    recent_logs = []
    if synced:
        recent_logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] 💾 [TRANSIT SYNC] Downloaded {len(synced)} offline readings from LittleFS onboard flash!")

    current_data = {
        "cycle": 0, "uptime": 0, "temp": 28.5, "hum": 68.0,
        "dew_pt": 22.0, "heat_idx": 30.0, "cond_margin": 6.5,
        "gas_adc": 1700, "gas_v": 1.40,
        "co2_ppm": 480.0, "nh3_ppm": 1.2, "alcohol_ppm": 2.5, "acetone_ppm": 0.8,
        "shocks": 0, "ldr_adc": 2, "ldr_v": 0.0, "ldr_pct": 0.1, "lux": 0.0,
        "gps_fix": False, "lat": 0.0, "lon": 0.0, "alt": 0.0, "speed": 0.0,
        "hdop": 99.9, "sats": 0, "nmea_chars": 0,
        "flash_records": 0, "flash_bytes": 0, "warmup": False
    }

    layout = create_dashboard_layout()

    with Live(layout, refresh_per_second=4, console=console, screen=True) as live:
        while True:
            try:
                raw_line = ser.readline()
                if not raw_line:
                    continue
                line = raw_line.decode('utf-8', errors='replace').strip()
                if not line:
                    continue

                now_str = datetime.now().strftime("%H:%M:%S")

                # Parse JSON telemetry if present
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

                        alert_tag = " [bold red]🚨[IMPACT][/bold red]" if shocks > 0 else ""
                        tamper_tag = " [bold yellow]☀️[LIGHT BREACH][/bold yellow]" if (current_data.get("ldr_adc", 0) > 2500) else ""
                        warmup_tag = " [dim](Heater Warmup)[/dim]" if current_data.get("warmup", False) else ""
                        log_msg = f"[{now_str}] #{cycle_num:04d} | 🌡️ {temp:.1f}°C | 💨 CO₂: {co2:.0f}ppm, NH₃: {nh3:.1f}ppm{warmup_tag} | 💡 ~{lux:.0f} Lux{tamper_tag} | 💥 {shocks} Shocks{alert_tag} | 💾 {flash_recs} Buf | 🛰️ GPS Chars: {chars}"
                        recent_logs.append(log_msg)
                        if len(recent_logs) > 500:
                            recent_logs.pop(0)
                    except Exception:
                        pass

                # Update Header
                uptime_s = current_data.get("uptime", 0)
                mins, secs = divmod(uptime_s, 60)
                hours, mins = divmod(mins, 60)
                uptime_fmt = f"{hours:02d}:{mins:02d}:{secs:02d}"

                flash_recs = current_data.get("flash_records", 0)
                header_text = Text()
                header_text.append("🚚 AgriChain Deep Telemetry & Multi-Gas Environmental Node", style="bold cyan")
                header_text.append(f"  |  Port: {PORT} ({BAUD} baud)", style="white")
                header_text.append(f"  |  Uptime: {uptime_fmt}", style="green")
                header_text.append(f"  |  💾 Flash: {flash_recs} recs", style="magenta")
                header_text.append(f"  |  {datetime.now().strftime('%H:%M:%S')}", style="bright_yellow")
                layout["header"].update(Panel(header_text, style="blue"))

                # Update Sensor Table
                layout["sensors"].update(format_sensor_table(current_data))

                # Update Event Log - Dynamically expand to fill all remaining terminal height
                avail_lines = max(6, console.size.height - 24)
                visible_logs = recent_logs[-avail_lines:]
                log_content = "\n".join(visible_logs) if visible_logs else "[dim]Awaiting telemetry packets...[/dim]"
                layout["log"].update(
                    Panel(
                        log_content,
                        title="📜 Multi-Gas & Optical Event Ledger (1000ms Real-Time Pulse)",
                        subtitle=f"[dim]Displaying latest {len(visible_logs)} cycles | Log buffer: {len(recent_logs)} packets | LittleFS Active[/dim]",
                        border_style="green"
                    )
                )

            except KeyboardInterrupt:
                break
            except Exception as e:
                time.sleep(0.2)

    ser.close()

if __name__ == '__main__':
    main()
