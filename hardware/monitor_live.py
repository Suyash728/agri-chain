#!/usr/bin/env python3
"""
AgriChain 5-Channel Real-Time Edge Node Mission Control Dashboard
Reads /dev/ttyUSB0 and renders rich detailed per-sensor telemetry.
"""
import sys
import time
import json
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

console = Console()

def create_dashboard_layout():
    layout = Layout()
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="sensors", size=15),
        Layout(name="log", size=10)
    )
    return layout

def format_sensor_table(data):
    table = Table(title="📊 Real-Time Multi-Sensor Telemetry Breakdown", expand=True, border_style="bright_blue")
    table.add_column("Sensor Subsystem", style="bold white", width=24)
    table.add_column("Pin / Channel", style="cyan", width=18)
    table.add_column("Metric Values", style="bright_yellow", width=28)
    table.add_column("Hardware Status", style="bold", width=30)

    # 1. DHT11
    temp = data.get("temp", 0.0)
    hum = data.get("hum", 0.0)
    deci_c = int(round(temp * 10))
    temp_status = "[bold green]● IN STORAGE POLICY[/bold green]" if temp < 35.0 else "[bold red]⚠️ HIGH TEMP ALERT[/bold red]"
    table.add_row(
        "🌡️ Microclimate",
        "DHT11 (GPIO 4)",
        f"{temp:.1f} °C ({deci_c} deci-°C)\n{hum:.1f} % RH",
        f"{temp_status}\n[dim]Capacitive Hygrothermal[/dim]"
    )

    # 2. MQ-135
    gas_v = data.get("gas_v", 0.0)
    gas_adc = data.get("gas_adc", 0)
    gas_status = "[bold green]🍃 Fresh Ambient Air[/bold green]" if gas_v < 1.60 else "[bold red]⚠️ VOC Spike / Respiration[/bold red]"
    table.add_row(
        "💨 Spoilage & Respiration",
        "MQ-135 (GPIO 34, ADC1)",
        f"{gas_v:.2f} V\nADC: {gas_adc} / 4095",
        f"{gas_status}\n[dim]SnO2 Chemiresistive Headspace[/dim]"
    )

    # 3. SW-420
    shocks = data.get("shocks", 0)
    shock_status = "[bold green]🛡️ Stable & Secure[/bold green]" if shocks == 0 else f"[bold red]🚨 {shocks} POTHOLE/IMPACT(S)[/bold red]"
    table.add_row(
        "💥 Transit Shock Switch",
        "SW-420 (GPIO 27, IRQ)",
        f"{shocks} Shock Event(s)",
        f"{shock_status}\n[dim]Sub-µs Falling Edge Interrupt[/dim]"
    )

    # 4. LDR
    ldr_v = data.get("ldr_v", 0.0)
    ldr_adc = data.get("ldr_adc", 0)
    if ldr_adc < 600:
        ldr_status = "[bold cyan]🌑 Sealed Crate (Pitch Dark)[/bold cyan]"
    elif ldr_adc < 2800:
        ldr_status = "[bold yellow]⛅ Ambient Light Detected[/bold yellow]"
    else:
        ldr_status = "[bold red]☀️ LID OPEN / BREACH ALERT![/bold red]"
    table.add_row(
        "💡 Optical Anti-Tamper",
        "LDR (GPIO 35, ADC1)",
        f"{ldr_v:.2f} V\nADC: {ldr_adc} / 4095",
        f"{ldr_status}\n[dim]Cadmium-Sulfide Photoresistor[/dim]"
    )

    # 5. NEO-6M GPS
    gps_fix = data.get("gps_fix", False)
    sats = data.get("sats", 0)
    chars = data.get("nmea_chars", 0)
    if gps_fix:
        lat = data.get("lat", 0.0)
        lon = data.get("lon", 0.0)
        alt = data.get("alt", 0.0)
        maps_url = f"https://www.google.com/maps?q={lat:.6f},{lon:.6f}"
        gps_metric = f"Lat: {lat:.6f}, Lon: {lon:.6f}\nAlt: {alt:.1f}m | Sats: {sats}\n[link={maps_url}][bold cyan]{maps_url}[/bold cyan][/link]"
        gps_status = "[bold green]🛰️ 3D SATELLITE FIX LOCKED[/bold green]\n[underline bright_white]Click link to open in Browser[/underline bright_white]"
    else:
        gps_metric = f"NMEA Raw Bytes: {chars}\nVisible Satellites: {sats}\n[dim]Awaiting 4-satellite lock...[/dim]"
        gps_status = "[bold yellow]🛰️ Searching for Satellites...[/bold yellow]\n[dim]Place antenna near window/sky[/dim]"
    table.add_row(
        "🛰️ Highway Geolocation",
        "NEO-6M (GPIO 16, RX2)",
        gps_metric,
        gps_status
    )

    return table

def main():
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        ser.dtr = False
        ser.rts = False
        time.sleep(0.1)
        ser.reset_input_buffer()
    except Exception as e:
        console.print(f"[bold red]Error opening {PORT}: {e}[/bold red]")
        sys.exit(1)

    recent_logs = []
    current_data = {
        "cycle": 0, "uptime": 0, "temp": 30.0, "hum": 75.0,
        "gas_adc": 1700, "gas_v": 1.40, "shocks": 0,
        "ldr_adc": 2, "ldr_v": 0.0, "gps_fix": False,
        "lat": 0.0, "lon": 0.0, "alt": 0.0, "sats": 0, "nmea_chars": 0
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

                        # Generate log entry
                        cycle_num = current_data.get("cycle", 0)
                        temp = current_data.get("temp", 0.0)
                        gas_v = current_data.get("gas_v", 0.0)
                        shocks = current_data.get("shocks", 0)
                        ldr_v = current_data.get("ldr_v", 0.0)
                        chars = current_data.get("nmea_chars", 0)

                        alert_tag = " [bold red]🚨[IMPACT][/bold red]" if shocks > 0 else ""
                        log_msg = f"[{now_str}] Cycle #{cycle_num:04d} | 🌡️ {temp:.1f}°C | 💨 {gas_v:.2f}V | 💡 {ldr_v:.2f}V | 💥 {shocks} Shocks{alert_tag} | 🛰️ GPS Chars: {chars}"
                        recent_logs.append(log_msg)
                        if len(recent_logs) > 8:
                            recent_logs.pop(0)
                    except Exception:
                        pass
                elif line.startswith("[#") and not line.startswith("JSON:"):
                    pass # Handled by JSON stream

                # Update Header
                uptime_s = current_data.get("uptime", 0)
                mins, secs = divmod(uptime_s, 60)
                hours, mins = divmod(mins, 60)
                uptime_fmt = f"{hours:02d}:{mins:02d}:{secs:02d}"

                header_text = Text()
                header_text.append("🚚 AgriChain IoT Edge Node — Live Mission Control", style="bold cyan")
                header_text.append(f"  |  Port: {PORT} ({BAUD} baud)", style="white")
                header_text.append(f"  |  Uptime: {uptime_fmt}", style="green")
                header_text.append(f"  |  Time: {datetime.now().strftime('%H:%M:%S')}", style="bright_yellow")
                layout["header"].update(Panel(header_text, style="blue"))

                # Update Sensor Table
                layout["sensors"].update(format_sensor_table(current_data))

                # Update Event Log
                log_content = "\n".join(recent_logs) if recent_logs else "[dim]Waiting for telemetry packets...[/dim]"
                layout["log"].update(Panel(log_content, title="📜 Telemetry Pulse & Event Ledger (1000ms Interval)", border_style="green"))

            except KeyboardInterrupt:
                break
            except Exception as e:
                time.sleep(0.2)

    ser.close()

if __name__ == '__main__':
    main()
