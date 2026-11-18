#!/usr/bin/env python3
"""
AgriChain 7-Subsystem Real-Time Edge Node Mission Control Dashboard
Features:
- Live serial telemetry from the ESP32 (default /dev/ttyUSB0, 115200 baud)
- Connects WITHOUT resetting the board, so the device's uptime/time anchor survives the plug-in
- Two-phase LittleFS sync: records are written to transit_logs/ and fsync'd BEFORE the device
  is told (CMD:ACK:<n>) to delete them; any mismatch leaves the flash untouched
- Record timestamps come from the device clock (GPS UTC or host-set time), not from the sync time
- Durable outbox: synced batches are queued on disk and retried until POST /telemetry/batch succeeds
- Live forwarding to POST /telemetry (paused while an offline backlog is still uploading, so the
  backend always receives readings in chronological order)
- Automatic reconnect on USB disconnect; clear permission / missing-device diagnostics
- Interactive keys: P pause, S sync, C clear (press twice), M maps, B cycle batch, Q quit
"""
import sys
import os
import re
import time
import json
import hashlib
import argparse
import select
import termios
import tty
import threading
import queue
import urllib.request
import urllib.error
import webbrowser
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Optional

import serial
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich.text import Text

DEFAULT_PORT = '/dev/ttyUSB0'
BAUD = 115200
DEFAULT_BACKEND = 'http://localhost:8000'
DEVICE_ID = 'ESP32-PENTAD-01'
TRANSIT_LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'transit_logs')
OUTBOX_DIR = os.path.join(TRANSIT_LOG_DIR, 'outbox')
CHAIN_STATE_PATH = os.path.join(TRANSIT_LOG_DIR, 'chain_state.json')
CHAIN_GENESIS = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
# Firmware record framing: <body>,"prev":"<16 hex>","hash":"<64 hex>"}   with hash = SHA256(prev_full | body)
CHAIN_RE = re.compile(r'^(\{.*),"prev":"([0-9a-f]{16})","hash":"([0-9a-f]{64})"\}$')
MIN_VALID_EPOCH = 1704067200          # 2024-01-01T00:00:00Z; device ts below this means "clock not set"
LDR_TAMPER_ADC = 2500                 # fallback for records from firmware without the "tamper" field
BATCH_CHUNK = 25                      # readings per POST /telemetry/batch request
OUTBOX_RETRY_S = 15.0
LIVE_FORWARD_INTERVAL_S = 2.0
RECONNECT_INTERVAL_S = 2.0

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


def now_hms():
    return datetime.now().strftime("%H:%M:%S")


# ==============================================================================
# RECORD -> BACKEND SCHEMA MAPPING (pure functions; see backend/schemas.py TelemetryRequest)
# ==============================================================================
@dataclass
class ClockAnchor:
    """Device boot/uptime observed at a known host wall-clock instant (taken from CMD:STATUS)."""
    boot: Optional[int]
    up_ms: Optional[int]
    host_time: float


def resolve_timestamp(rec, anchor: Optional[ClockAnchor]):
    """Return (iso_timestamp_or_None, method) for a device record.

    1. Device wall clock (GPS UTC or host-set) recorded with the reading.
    2. Same boot session as the anchor: host time minus elapsed device uptime.
    3. Otherwise unknown -> None (the backend applies its own ordering policy).
    """
    ts = rec.get("ts") or 0
    if isinstance(ts, (int, float)) and ts >= MIN_VALID_EPOCH:
        return datetime.fromtimestamp(ts, timezone.utc).isoformat(), f"device_{rec.get('ts_src', 'clock')}"
    if (anchor is not None and anchor.boot is not None and anchor.up_ms is not None
            and rec.get("boot") == anchor.boot and isinstance(rec.get("up_ms"), (int, float))
            and rec["up_ms"] <= anchor.up_ms):
        t = anchor.host_time - (anchor.up_ms - rec["up_ms"]) / 1000.0
        return datetime.fromtimestamp(t, timezone.utc).isoformat(), "uptime_anchor"
    return None, "unknown"


def tamper_status_for(rec, prev_shocks: Optional[int] = None):
    """Map hardware flags to the values the backend acts on (backend/routers/telemetry.py)."""
    tamper = rec.get("tamper")
    if tamper is None:
        tamper = rec.get("ldr_adc", 0) > LDR_TAMPER_ADC
    if tamper:
        return "TAMPER_OPENED"
    delta = rec.get("shock_delta")
    if delta is None and prev_shocks is not None:   # legacy records carry only the cumulative counter
        delta = max(0, rec.get("shocks", 0) - prev_shocks)
    if delta and delta > 0:
        return "SHOCK_DETECTED"
    return "SEALED"


def voc_ppm_for(rec):
    """Only forward a gas reading the firmware marks as calibrated and past heater warm-up.

    Uncalibrated MQ-135 output (nominal R0) reads ~50-200 ppm in clean room air, which would
    trip the backend's 50 ppm spoilage threshold on every reading.
    """
    if rec.get("gas_cal") is True and not rec.get("warmup", False):
        return rec.get("alcohol_ppm")
    return None


def to_backend_reading(rec, batch_info, timestamp_iso, last_fix, prev_shocks=None):
    lat, lon = (rec.get("lat"), rec.get("lon")) if rec.get("gps_fix") else (last_fix or (None, None))
    return {
        "batch_id": batch_info["batch_id"],
        "crop_name": batch_info["crop_name"],
        "temp_c": rec.get("temp"),
        "humidity_pct": rec.get("hum"),
        "device_id": DEVICE_ID,
        "latitude": lat,
        "longitude": lon,
        "freshness_voc_ppm": voc_ppm_for(rec),
        "tamper_status": tamper_status_for(rec, prev_shocks),
        "timestamp": timestamp_iso,
    }


def build_batch_readings(records, batch_info, anchor):
    """Convert synced flash records (oldest first) into backend readings."""
    readings, last_fix, prev_shocks, prev_boot = [], None, None, None
    for rec in records:
        if "_unparseable" in rec or rec.get("temp") is None or rec.get("hum") is None:
            continue
        if rec.get("boot") != prev_boot:          # shock counter restarts with each boot
            prev_shocks, prev_boot = None, rec.get("boot")
        ts_iso, _ = resolve_timestamp(rec, anchor)
        readings.append(to_backend_reading(rec, batch_info, ts_iso, last_fix, prev_shocks))
        if rec.get("gps_fix"):
            last_fix = (rec.get("lat"), rec.get("lon"))
        prev_shocks = rec.get("shocks", prev_shocks)
    return readings


# ==============================================================================
# HASH-CHAIN VERIFICATION (raw record lines, exactly as stored on the device)
# ==============================================================================
def chain_link(prev_full_hex, body):
    return hashlib.sha256(f"{prev_full_hex}|{body}".encode("utf-8")).hexdigest()


def verify_chain(raw_lines, start_head=None):
    """Recompute the device's SHA-256 chain over synced records (oldest first).

    The first chained record is verified against `start_head` (the last hash this host saw from
    the device) or the genesis value. A later record whose `prev` does not match its predecessor
    is a *gap* (records removed on-device, e.g. CLEAR or rotation); a record whose `prev` matches
    but whose hash does not recompute is *tampered* (content changed after it was written).
    """
    res = {"total": len(raw_lines), "verified": 0, "legacy": 0, "gaps": [], "tampered": [],
           "start": "none", "last_head": None}
    prev = None
    for i, raw in enumerate(raw_lines):
        m = CHAIN_RE.match(raw)
        if not m:
            res["legacy"] += 1
            prev = None
            continue
        body, prev_hint, claimed = m.groups()
        if prev is None:
            anchors = [(start_head, "previous_sync"), (CHAIN_GENESIS, "genesis")]
            matched = next((label for h, label in anchors
                            if h and h.startswith(prev_hint) and chain_link(h, body) == claimed), None)
            if res["start"] == "none":
                res["start"] = matched or "unanchored"
            if matched:
                res["verified"] += 1
            elif res["verified"] or res["start"] != "unanchored":
                res["gaps"].append(i)
        elif not prev.startswith(prev_hint):
            res["gaps"].append(i)
        elif chain_link(prev, body) == claimed:
            res["verified"] += 1
        else:
            res["tampered"].append(i)
        prev = claimed
        res["last_head"] = claimed
    return res


def describe_chain(res):
    chained = res["total"] - res["legacy"]
    parts = [f"{res['verified']}/{chained} chained records verified"]
    if res["start"] == "previous_sync":
        parts.append("continues from last sync")
    elif res["start"] == "genesis":
        parts.append("starts at genesis")
    elif res["start"] == "unanchored":
        parts.append("start not linked to a known head (first sync, or records dropped on device)")
    if res["gaps"]:
        parts.append(f"{len(res['gaps'])} gap(s)")
    if res["tampered"]:
        parts.append(f"⚠️ {len(res['tampered'])} TAMPERED record(s) at {res['tampered'][:5]}")
    if res["legacy"]:
        parts.append(f"{res['legacy']} legacy/unchained")
    return "; ".join(parts)


def load_chain_head(device_id=DEVICE_ID):
    try:
        with open(CHAIN_STATE_PATH, encoding="utf-8") as f:
            return json.load(f).get(device_id, {}).get("head")
    except (OSError, ValueError):
        return None


def save_chain_head(head, device_id=DEVICE_ID):
    try:
        with open(CHAIN_STATE_PATH, encoding="utf-8") as f:
            state = json.load(f)
    except (OSError, ValueError):
        state = {}
    state[device_id] = {"head": head, "updated": datetime.now(timezone.utc).isoformat()}
    _write_durable(CHAIN_STATE_PATH, json.dumps(state, indent=2))


# ==============================================================================
# SERIAL LINK WITH RECONNECT
# ==============================================================================
class LinkLost(Exception):
    pass


def describe_serial_error(port, exc):
    msg = str(exc)
    if "Permission denied" in msg or getattr(exc, "errno", None) == 13:
        return (f"permission denied on {port} — add your user to the 'uucp' (Arch) or 'dialout' "
                f"(Debian/Ubuntu) group, then log out and back in")
    if "No such file" in msg or "could not open port" in msg and "2]" in msg:
        return f"{port} not found — is the ESP32 plugged in?"
    if "busy" in msg.lower() or "Resource temporarily unavailable" in msg:
        return f"{port} is in use by another program (close any other serial monitor)"
    return msg


class SerialLink:
    def __init__(self, port, baud=BAUD):
        self.port = port
        self.baud = baud
        self.ser = None
        self.last_error = ""

    @property
    def connected(self):
        return self.ser is not None

    def open(self):
        try:
            # pyserial asserts DTR and RTS together on open, which leaves the DevKit's auto-reset
            # transistors off. Never toggle them afterwards: a reset would lose the device's
            # uptime anchor and wall-clock time for records buffered during transit.
            self.ser = serial.Serial(self.port, self.baud, timeout=0.25, exclusive=True)
            self.last_error = ""
            return True
        except (serial.SerialException, OSError, ValueError) as e:
            self.ser = None
            self.last_error = describe_serial_error(self.port, e)
            return False

    def close(self):
        if self.ser is not None:
            try:
                self.ser.close()
            except Exception:
                pass
        self.ser = None

    def write_line(self, text):
        if self.ser is None:
            raise LinkLost("not connected")
        try:
            self.ser.write((text + "\n").encode("ascii"))
            self.ser.flush()
        except (serial.SerialException, OSError) as e:
            self.close()
            raise LinkLost(str(e))

    def read_line(self):
        if self.ser is None:
            raise LinkLost("not connected")
        try:
            raw = self.ser.readline()
        except (serial.SerialException, OSError, TypeError) as e:
            # TypeError: pyserial raises it internally when the fd disappears mid-read
            self.close()
            raise LinkLost(str(e))
        return raw.decode("utf-8", errors="replace").strip() if raw else ""

    def drain(self, seconds=0.3):
        if self.ser is None:
            return
        try:
            time.sleep(seconds)
            self.ser.reset_input_buffer()
        except (serial.SerialException, OSError) as e:
            self.close()
            raise LinkLost(str(e))


def wait_for(link, prefixes, timeout, on_json=None):
    """Read lines until one starts with any of `prefixes`; live JSON lines go to on_json."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        line = link.read_line()
        if not line:
            continue
        if line.startswith(tuple(prefixes)):
            return line
        if on_json and line.startswith("JSON:"):
            on_json(line)
    return None


def query_status(link, on_json=None, tries=3):
    """Returns (status_dict, ClockAnchor) or (None, None)."""
    for _ in range(tries):
        link.write_line("CMD:STATUS")
        line = wait_for(link, ["STATUS:"], 1.5, on_json)
        if line:
            try:
                st = json.loads(line[len("STATUS:"):])
            except ValueError:
                continue
            return st, ClockAnchor(st.get("boot"), st.get("up_ms"), time.time())
    return None, None


def set_device_time(link, on_json=None):
    link.write_line(f"CMD:TIME:{int(time.time())}")
    line = wait_for(link, ["TIME:"], 1.5, on_json)
    return line is not None and line.startswith("TIME:OK")


@dataclass
class SyncResult:
    ok: bool
    records: list = field(default_factory=list)
    anchor: Optional[ClockAnchor] = None
    path: Optional[str] = None
    acked: bool = False
    message: str = ""
    chain: Optional[dict] = None


def _write_durable(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def sync_flash(link, log: Callable[[str], None], on_json=None) -> SyncResult:
    """Two-phase sync: dump -> save to disk (fsync) -> verify count -> CMD:ACK:<n>."""
    status, anchor = query_status(link, on_json)
    if status is None:
        return SyncResult(False, message="device did not answer CMD:STATUS")
    expected = int(status.get("records", 0))
    if expected == 0:
        return SyncResult(True, anchor=anchor, message="flash buffer empty")
    if "boot" not in status:
        return SyncResult(False, anchor=anchor,
                          message="device firmware predates two-phase sync (no ACK support); reflash before syncing")

    log(f"📦 {expected} offline records in ESP32 flash — downloading…")
    link.write_line("CMD:SYNC")
    if not wait_for(link, ["OFFLINE_DUMP_START:"], 5.0, on_json):
        return SyncResult(False, anchor=anchor, message="no OFFLINE_DUMP_START from device")

    raw_lines, complete = [], None
    deadline = time.time() + max(15.0, expected * 0.06 + 10.0)   # ~500 B/record at 11.5 kB/s
    while time.time() < deadline:
        line = link.read_line()
        if not line:
            continue
        if line.startswith("OFFLINE_JSON:"):
            raw_lines.append(line[len("OFFLINE_JSON:"):])
        elif line.startswith("OFFLINE_DUMP_COMPLETE:"):
            try:
                complete = int(line.split(":", 1)[1])
            except ValueError:
                complete = -1
            break
        elif on_json and line.startswith("JSON:"):
            on_json(line)

    records = []
    for raw in raw_lines:
        try:
            records.append(json.loads(raw))
        except ValueError:
            records.append({"_unparseable": raw})   # kept verbatim for the audit trail
    unparseable = sum(1 for r in records if "_unparseable" in r)

    os.makedirs(TRANSIT_LOG_DIR, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    path = os.path.join(TRANSIT_LOG_DIR, f"transit_dump_{stamp}.jsonl")
    # Store the device's exact bytes: re-serialising would make the hash chain unverifiable later.
    _write_durable(path, "".join(raw + "\n" for raw in raw_lines))
    chain = verify_chain(raw_lines, load_chain_head())
    meta = {
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "port": link.port,
        "device_status": status,
        "anchor": {"boot": anchor.boot, "up_ms": anchor.up_ms, "host_time": anchor.host_time},
        "announced": expected,
        "device_complete_count": complete,
        "received_lines": len(raw_lines),
        "unparseable_lines": unparseable,
        "chain": chain,
        "acked": False,
    }
    log(f"🔒 [CHAIN] {describe_chain(chain)}")

    result = SyncResult(False, records=records, anchor=anchor, path=path)
    if complete is None:
        result.message = f"dump timed out after {len(raw_lines)} lines; flash NOT cleared"
    elif complete != len(raw_lines):
        result.message = f"received {len(raw_lines)} of {complete} lines; flash NOT cleared"
    else:
        link.write_line(f"CMD:ACK:{complete}")
        reply = wait_for(link, ["OFFLINE_SYNC_COMPLETE", "OFFLINE_ACK_REJECTED"], 10.0, on_json)
        result.acked = reply == "OFFLINE_SYNC_COMPLETE:OK"
        result.ok = result.acked
        result.message = ("flash cleared after verified download" if result.acked
                          else f"device rejected ACK ({reply}); flash NOT cleared")
        if unparseable:
            result.message += f"; {unparseable} corrupt line(s) kept verbatim in the dump"
        if result.acked and chain["last_head"]:
            save_chain_head(chain["last_head"])   # next sync must continue from here
    result.chain = chain
    meta["acked"] = result.acked
    _write_durable(path[:-len(".jsonl")] + ".meta.json", json.dumps(meta, indent=2))
    return result


# ==============================================================================
# DURABLE OUTBOX + BACKEND WORKER
# ==============================================================================
def enqueue_outbox(readings, name):
    if not readings:
        return None
    os.makedirs(OUTBOX_DIR, exist_ok=True)
    path = os.path.join(OUTBOX_DIR, f"{name}.json")
    _write_durable(path, json.dumps({"readings": readings}))
    return path


def outbox_files():
    try:
        return sorted(os.path.join(OUTBOX_DIR, f) for f in os.listdir(OUTBOX_DIR) if f.endswith(".json"))
    except FileNotFoundError:
        return []


def post_json(url, payload, timeout):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def backend_worker(backend_url, telemetry_queue, backend_state, events, stop_event):
    """Single thread for all backend traffic so offline backlog and live readings stay ordered.

    The offline outbox always goes first; while it is non-empty, live readings are not forwarded
    (they would otherwise land with newer timestamps than the backlog behind them).
    """
    batch_url = f"{backend_url}/telemetry/batch"
    live_url = f"{backend_url}/telemetry"
    next_outbox_try = 0.0
    while not stop_event.is_set():
        pending = outbox_files()
        backend_state["outbox"] = len(pending)
        if pending and time.time() >= next_outbox_try:
            path = pending[0]
            try:
                with open(path, encoding="utf-8") as f:
                    readings = json.load(f).get("readings", [])
            except (OSError, ValueError) as e:
                events.put(f"⚠️ [OUTBOX] Unreadable {os.path.basename(path)} ({e}); moved aside")
                os.replace(path, path + ".bad")
                continue
            chunk, rest = readings[:BATCH_CHUNK], readings[BATCH_CHUNK:]
            try:
                t0 = time.time()
                resp = post_json(batch_url, {"readings": chunk}, timeout=60.0)
                backend_state.update(online=True, latency_ms=(time.time() - t0) * 1000.0)
                if rest:
                    _write_durable(path, json.dumps({"readings": rest}))
                else:
                    os.remove(path)
                tx = resp.get("tx_hash") or "N/A"
                events.put(f"⛓️ [AI ORACLE] Offline batch: {resp.get('valid_count', 0)} valid / "
                           f"{resp.get('quarantined_count', 0)} quarantined of {len(chunk)} "
                           f"(TX: {tx[:16]}) — {len(rest)} left in {os.path.basename(path)}")
            except urllib.error.HTTPError as e:
                if 400 <= e.code < 500:
                    # The backend will never accept this payload; retrying would block the queue forever.
                    os.replace(path, path + ".rejected")
                    events.put(f"❌ [OUTBOX] Backend rejected {os.path.basename(path)} (HTTP {e.code}); "
                               f"moved to .rejected for inspection")
                else:
                    backend_state.update(online=False, verdict="OFFLINE")
                    next_outbox_try = time.time() + OUTBOX_RETRY_S
                    events.put(f"📮 [OUTBOX] Backend error HTTP {e.code}; retrying in {OUTBOX_RETRY_S:.0f}s")
            except (urllib.error.URLError, OSError, ValueError) as e:
                backend_state.update(online=False, verdict="OFFLINE")
                next_outbox_try = time.time() + OUTBOX_RETRY_S
                events.put(f"📮 [OUTBOX] Backend unavailable ({getattr(e, 'reason', e)}); "
                           f"{len(readings)} readings queued, retrying in {OUTBOX_RETRY_S:.0f}s")
            continue

        try:
            item = telemetry_queue.get(timeout=0.2)
        except queue.Empty:
            continue
        if item is None:
            break
        if pending:
            continue  # backlog still uploading; keep chronological order at the backend
        packet, batch_info = item
        ts_iso, _ = resolve_timestamp(packet, None)
        payload = to_backend_reading(packet, batch_info, ts_iso or datetime.now(timezone.utc).isoformat(),
                                     backend_state.get("last_fix"))
        try:
            t0 = time.time()
            res = post_json(live_url, payload, timeout=3.0)
            backend_state.update(
                online=True,
                verdict=res.get("verdict", "VALID"),
                tx_hash=res.get("tx_hash") or "",
                reason=res.get("reason") or "",
                anomaly_score=res.get("anomaly_score", 0.0),
                latency_ms=(time.time() - t0) * 1000.0,
            )
        except (urllib.error.URLError, OSError, ValueError):
            backend_state.update(online=False, verdict="OFFLINE")


# ==============================================================================
# DASHBOARD RENDERING
# ==============================================================================
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
    dht_badge = ("[bold green]● DHT11 reading live[/bold green]" if data.get("dht_ok", True)
                 else "[bold yellow]⚠️ DHT11 read failed — holding last value[/bold yellow]")

    table.add_row(
        "🌡️ Microclimate",
        "DHT11 (GPIO 4)",
        f"{temp:.1f}°C ({deci_c} deci-°C) | {hum:.1f}% RH\nDew Point: {dew_pt:.1f}°C | Heat Index: {heat_idx:.1f}°C",
        f"{dht_badge}\n{dew_badge}"
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
    elif data.get("gas_cal") is not True:
        gas_badge = "[bold yellow]⚠️ Uncalibrated R0 — run --calibrate-r0[/bold yellow]"
    elif data.get("gas_sat"):
        gas_badge = "[bold red]🚨 SENSOR AT ADC CEILING (very high VOC)[/bold red]"
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
    shock_delta = data.get("shock_delta", 0)
    if shock_delta > 0:
        shock_status = f"[bold red]🚨 {shock_delta} NEW IMPACT(S) THIS SECOND[/bold red]"
    elif shocks > 0:
        shock_status = "[bold yellow]🛡️ Stable now (earlier impacts logged)[/bold yellow]"
    else:
        shock_status = "[bold green]🛡️ Stable & Secure[/bold green]"
    table.add_row(
        "💥 Mechanical Shock",
        "SW-420 (GPIO 32, IRQ)",
        f"{shocks} Shock Event(s) Since Boot\n[dim]Hardware IRQ • 25ms Debounce[/dim]",
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
    ts_src = data.get("ts_src", "none")

    if flash_records > 0:
        storage_status = f"[bold green]● BUFFERING ACTIVE[/bold green]\n[dim]{flash_records} Records on Flash[/dim]"
    else:
        storage_status = "[bold cyan]● BUFFER SYNCHRONIZED[/bold cyan]\n[dim]Flash ready for transit[/dim]"

    table.add_row(
        "💾 Edge Security Buffer",
        "LittleFS Partition\nmbedTLS SHA-256",
        f"Flash: {flash_records} recs ({kb_used:.1f} KB) | Clock: {ts_src}\nSHA-256 Hash: [bright_cyan]{rec_hash[:16]}…[/bright_cyan]",
        storage_status
    )

    # 7. AI Trust Layer & Blockchain Oracle
    is_online = backend_state.get("online", False)
    ai_verdict = backend_state.get("verdict", "PENDING")
    tx_hash = backend_state.get("tx_hash", "")
    latency = backend_state.get("latency_ms", 0.0)
    reason = backend_state.get("reason", "")
    outbox = backend_state.get("outbox", 0)

    if outbox:
        oracle_status = f"[bold yellow]📮 UPLOADING OFFLINE BACKLOG[/bold yellow]\n[dim]{outbox} batch file(s) queued[/dim]"
    elif is_online:
        if ai_verdict == "VALID":
            oracle_status = f"[bold green]● ANCHORED ON-CHAIN[/bold green]\n[dim]TX: {tx_hash[:16]}...[/dim]"
        elif ai_verdict == "ANOMALOUS":
            oracle_status = f"[bold red]🚨 AI QUARANTINED[/bold red]\n[dim]{reason[:26] if reason else 'Policy Breach'}[/dim]"
        else:
            oracle_status = "[bold cyan]● EVALUATING INGESTION[/bold cyan]\n[dim]AI Trust Pipe Active[/dim]"
    else:
        oracle_status = "[bold yellow]● STANDALONE MODE[/bold yellow]\n[dim]Hardware SHA-256 Local Ledger[/dim]"

    if is_online:
        oracle_metric = (
            f"Lot: [bold white]{batch_info['batch_id']}[/bold white] ({batch_info['crop_name']})\n"
            f"AI Model: Isolation Forest + Heuristics | Ingestion: {latency:.1f}ms"
        )
    else:
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


# ==============================================================================
# KEYBOARD
# ==============================================================================
def keyboard_listener(cmd_queue, stop_event):
    """Daemon thread reading non-blocking keypresses via termios/tty on Linux."""
    if not sys.stdin.isatty():
        return
    fd = sys.stdin.fileno()
    try:
        old_settings = termios.tcgetattr(fd)
    except termios.error:
        return

    try:
        tty.setcbreak(fd)
        while not stop_event.is_set():
            r, _, _ = select.select([sys.stdin], [], [], 0.1)
            if r:
                ch = sys.stdin.read(1)
                if ch:
                    cmd_queue.put(ch.lower())
    finally:
        try:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        except termios.error:
            pass


# ==============================================================================
# MQ-135 CALIBRATION
# ==============================================================================
def run_calibration(link, reset=False):
    """One-shot R0 calibration. Returns a process exit code."""
    try:
        link.drain(0.3)
        if reset:
            link.write_line("CMD:CAL_R0:RESET")
            reply = wait_for(link, ["CAL:"], 3.0)
            console.print(f"[cyan]{reply or 'no reply from device'}[/cyan]")
            return 0 if reply == "CAL:RESET" else 1

        console.print(Panel(
            "Calibrating MQ-135 R0. The sensor must be in [bold]clean outdoor-quality air[/bold] (no produce, "
            "no people breathing on it), powered for at least 20 minutes — a brand-new sensor needs a "
            "24–48 h burn-in first. R0 = smoothed compensated Rs ÷ 3.6 (datasheet clean-air ratio).",
            border_style="yellow"))
        while True:
            st, _ = query_status(link)
            if st is None:
                console.print("[bold red]❌ Device did not answer CMD:STATUS[/bold red]")
                return 1
            if "gas_cal" not in st:
                console.print("[bold red]❌ Device firmware has no calibration support; reflash first[/bold red]")
                return 1
            if not st.get("warmup"):
                break
            console.print("[yellow]⏳ Heater still in its warm-up window; waiting…[/yellow]")
            time.sleep(5)
        console.print(f"Current R0: {st.get('r0')} kΩ (calibrated: {st.get('gas_cal')})")
        link.write_line("CMD:CAL_R0")
        reply = wait_for(link, ["CAL:"], 3.0)
        if reply and reply.startswith("CAL:OK:"):
            console.print(f"[bold green]✅ Stored R0 = {reply.split(':')[2]} kΩ on the device. "
                          f"Gas readings are now marked gas_cal=true and will be forwarded.[/bold green]")
            return 0
        console.print(f"[bold red]❌ Calibration failed: {reply or 'no reply'}[/bold red]")
        return 1
    except LinkLost as e:
        console.print(f"[bold red]❌ Lost {link.port}: {e}[/bold red]")
        return 1
    finally:
        link.close()


# ==============================================================================
# MAIN
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="AgriChain Real-Time Telemetry Monitor")
    parser.add_argument("--port", default=DEFAULT_PORT, help=f"Serial port (default {DEFAULT_PORT})")
    parser.add_argument("--backend", default=DEFAULT_BACKEND, help=f"FastAPI base URL (default {DEFAULT_BACKEND})")
    parser.add_argument("--clear", action="store_true", help="Delete onboard LittleFS records WITHOUT downloading them")
    parser.add_argument("--skip-sync", action="store_true", help="Skip offline download and start dashboard immediately")
    parser.add_argument("--batch", type=str, default="BAT-MGO-701", help="Default active produce lot ID")
    parser.add_argument("--calibrate-r0", action="store_true",
                        help="Calibrate MQ-135 R0 in clean air (sensor pre-heated), store it on the device, and exit")
    parser.add_argument("--reset-r0", action="store_true", help="Erase the stored MQ-135 calibration and exit")
    args = parser.parse_args()

    batch_idx = next((i for i, b in enumerate(BATCH_PRESETS) if b["batch_id"] == args.batch), 0)

    console.print(Panel(
        Text.assemble(
            ("🚚 AgriChain Edge Node Mission Control\n", "bold bright_cyan"),
            ("Establishing hardware link with ESP32 on ", "dim white"),
            (f"{args.port} @ {BAUD} baud\n", "bright_yellow"),
            ("Two-Phase LittleFS Sync • Durable Outbox • AI Trust Pipeline • Interactive Hotkeys", "dim cyan")
        ),
        border_style="cyan"
    ))

    link = SerialLink(args.port)
    if not link.open():
        console.print(f"[bold red]❌ Cannot open {args.port}: {link.last_error}[/bold red]")
        sys.exit(1)

    if args.calibrate_r0 or args.reset_r0:
        sys.exit(run_calibration(link, reset=args.reset_r0))

    recent_logs = []
    events = queue.Queue()          # log lines from worker threads

    def log(msg):
        recent_logs.append(f"[{now_hms()}] {msg}")
        if len(recent_logs) > 500:
            del recent_logs[:len(recent_logs) - 500]

    current_data = {
        "cycle": 0, "uptime": 0, "temp": 0.0, "hum": 0.0,
        "dew_pt": 0.0, "heat_idx": 0.0, "cond_margin": 99.0,
        "gas_adc": 0, "gas_v": 0.0,
        "co2_ppm": 400.0, "nh3_ppm": 0.0, "alcohol_ppm": 0.0, "acetone_ppm": 0.0,
        "shocks": 0, "shock_delta": 0, "ldr_adc": 0, "ldr_v": 0.0, "ldr_pct": 0.0, "lux": 0.0,
        "gps_fix": False, "lat": 0.0, "lon": 0.0, "alt": 0.0, "speed": 0.0,
        "hdop": 99.9, "sats": 0, "nmea_chars": 0,
        "flash_records": 0, "flash_bytes": 0, "warmup": False,
        "hash": "0000000000000000", "ts_src": "none",
    }
    backend_state = {
        "online": False, "verdict": "PENDING", "tx_hash": "", "reason": "",
        "anomaly_score": 0.0, "latency_ms": 0.0, "outbox": len(outbox_files()), "last_fix": None,
    }

    def on_json(line):
        try:
            current_data.update(json.loads(line[5:]))
        except ValueError:
            pass

    def handshake(log_fn, allow_clear):
        """Run on every (re)connect: set device clock, then sync or clear flash."""
        link.drain(0.3)
        if allow_clear and args.clear:
            link.write_line("CMD:CLEAR")
            ok = wait_for(link, ["OFFLINE_BUFFER_CLEARED"], 5.0, on_json)
            log_fn("🧹 LittleFS flash buffer cleared." if ok else "⚠️ CLEAR not confirmed by device")
        if set_device_time(link, on_json):
            log_fn("🕒 Device clock set from host (GPS UTC takes over once locked)")
        else:
            log_fn("⚠️ Device did not confirm CMD:TIME (old firmware?) — offline timestamps may be unknown")
        if args.skip_sync or (allow_clear and args.clear):
            return
        do_sync(log_fn)

    def do_sync(log_fn):
        res = sync_flash(link, log_fn, on_json)
        if res.records:
            log_fn(f"💾 [TRANSIT SYNC] {len(res.records)} records saved to {os.path.relpath(res.path)}")
            readings = build_batch_readings(res.records, BATCH_PRESETS[batch_idx], res.anchor)
            unknown_ts = sum(1 for r in readings if r["timestamp"] is None)
            if enqueue_outbox(readings, os.path.basename(res.path)[:-len(".jsonl")]):
                note = f" ({unknown_ts} with unknown time)" if unknown_ts else ""
                log_fn(f"📮 [OUTBOX] {len(readings)} readings queued for /telemetry/batch{note}")
        log_fn(("✅ " if res.ok else "⚠️ ") + f"[SYNC] {res.message}")

    try:
        handshake(lambda m: console.print(f"[cyan]{m}[/cyan]"), allow_clear=True)
    except LinkLost as e:
        console.print(f"[bold red]❌ Lost {args.port} during handshake: {e}[/bold red]")

    cmd_queue = queue.Queue()
    telemetry_queue = queue.Queue(maxsize=100)
    stop_event = threading.Event()

    t_key = threading.Thread(target=keyboard_listener, args=(cmd_queue, stop_event), daemon=True)
    t_key.start()
    t_back = threading.Thread(target=backend_worker,
                              args=(args.backend, telemetry_queue, backend_state, events, stop_event), daemon=True)
    t_back.start()

    stream_paused = False
    last_shock_count = None
    last_tamper = False
    last_forward_time = 0.0
    last_reconnect_try = 0.0
    clear_armed_until = 0.0
    layout = create_dashboard_layout()

    try:
        with Live(layout, refresh_per_second=4, console=console, screen=True):
            while True:
                # 0. Drain worker-thread log events
                while not events.empty():
                    log(events.get_nowait())

                # 1. Hotkeys
                while not cmd_queue.empty():
                    key = cmd_queue.get_nowait()
                    if key == 'q':
                        log("👋 [SHUTDOWN] Exiting AgriChain mission control cleanly...")
                        return
                    if key == 'b':
                        batch_idx = (batch_idx + 1) % len(BATCH_PRESETS)
                        active_b = BATCH_PRESETS[batch_idx]
                        log(f"🌾 [BATCH SWITCH] Active produce lot set to {active_b['batch_id']} ({active_b['crop_name']})")
                        continue
                    if key == 'm':
                        if current_data.get("gps_fix"):
                            webbrowser.open(f"https://www.google.com/maps?q={current_data['lat']:.6f},{current_data['lon']:.6f}")
                            log("🗺️ [MAPS] Opened Google Maps coordinates in browser!")
                        else:
                            log("🛰️ [MAPS] GPS acquisition active (No 3D fix locked yet). Place antenna near sky.")
                        continue
                    if not link.connected:
                        log("🔌 [CONTROL] Device disconnected — command ignored")
                        continue
                    try:
                        if key == 'p':
                            stream_paused = not stream_paused
                            link.write_line("CMD:PAUSE" if stream_paused else "CMD:RESUME")
                            log("🕹️ [CONTROL] " + ("⏸️ PAUSED (Telemetry frozen)" if stream_paused else "▶️ RESUMED (Streaming 1 Hz)"))
                        elif key == 's':
                            log("💾 [SYNC] Manually triggering LittleFS flash sync (dashboard pauses during download)...")
                            do_sync(log)
                        elif key == 'c':
                            if time.time() < clear_armed_until:
                                link.write_line("CMD:CLEAR")
                                ok = wait_for(link, ["OFFLINE_BUFFER_CLEARED"], 5.0, on_json)
                                clear_armed_until = 0.0
                                if ok:
                                    current_data["flash_records"] = 0
                                    current_data["flash_bytes"] = 0
                                log("🧹 [FLASH] LittleFS records deleted without download." if ok else "⚠️ [FLASH] CLEAR not confirmed")
                            else:
                                clear_armed_until = time.time() + 3.0
                                log("⚠️ [FLASH] Press [C] again within 3s to DELETE flash records without downloading them")
                    except LinkLost:
                        pass  # handled by the reconnect logic below

                # 2. Serial ingestion / reconnect
                if not link.connected:
                    if time.time() - last_reconnect_try >= RECONNECT_INTERVAL_S:
                        last_reconnect_try = time.time()
                        if link.open():
                            log(f"🔌 [LINK] Reconnected to {args.port}")
                            try:
                                handshake(log, allow_clear=False)
                                if stream_paused:
                                    link.write_line("CMD:PAUSE")
                            except LinkLost as e:
                                log(f"🔌 [LINK] Lost again during handshake: {e}")
                    else:
                        time.sleep(0.1)
                else:
                    try:
                        line = link.read_line()
                    except LinkLost as e:
                        log(f"🔌 [LINK] Disconnected from {args.port} ({e}); retrying every {RECONNECT_INTERVAL_S:.0f}s")
                        line = ""
                    if line.startswith("JSON:"):
                        try:
                            parsed = json.loads(line[5:])
                        except ValueError:
                            parsed = None
                        if parsed is not None:
                            current_data.update(parsed)
                            if parsed.get("gps_fix"):
                                backend_state["last_fix"] = (parsed.get("lat"), parsed.get("lon"))

                            shocks = parsed.get("shocks", 0)
                            shock_delta = parsed.get("shock_delta")
                            if shock_delta is None:
                                shock_delta = 0 if last_shock_count is None else max(0, shocks - last_shock_count)
                            last_shock_count = shocks
                            tamper = parsed.get("tamper", parsed.get("ldr_adc", 0) > LDR_TAMPER_ADC)

                            if shock_delta > 0:
                                sys.stdout.write('\a')
                                sys.stdout.flush()
                            if tamper and not last_tamper:
                                sys.stdout.write('\a\a')
                                sys.stdout.flush()

                            alert_tag = " [bold red]🚨[IMPACT][/bold red]" if shock_delta > 0 else ""
                            tamper_tag = " [bold yellow]☀️[LIGHT BREACH][/bold yellow]" if tamper else ""
                            rec_hash = parsed.get("hash", "N/A")
                            log(f"#{parsed.get('cycle', 0):04d} | 🌡️ {parsed.get('temp', 0.0):.1f}°C | "
                                f"💨 CO₂:{parsed.get('co2_ppm', 0.0):.0f}ppm | 💡 ~{parsed.get('lux', 0.0):.0f}Lx{tamper_tag} | "
                                f"💥 {shocks} Shk{alert_tag} | 💾 {parsed.get('flash_records', 0)} Buf | 🔒 #{rec_hash[:8]}")

                            # Forward to FastAPI: every 2s, immediately on a new impact or lid opening
                            is_event = shock_delta > 0 or (tamper and not last_tamper)
                            last_tamper = tamper
                            if is_event or time.time() - last_forward_time >= LIVE_FORWARD_INTERVAL_S:
                                last_forward_time = time.time()
                                packet = dict(parsed, shock_delta=shock_delta, tamper=tamper)
                                try:
                                    telemetry_queue.put_nowait((packet, BATCH_PRESETS[batch_idx]))
                                except queue.Full:
                                    pass  # backend far behind; live packets are best-effort (flash holds the record)
                    elif line.startswith(("STORAGE_", "OFFLINE_ACK_REJECTED", "CMD_")):
                        log(f"📟 [DEVICE] {line}")

                # 3. Header
                uptime_s = int(current_data.get("uptime", 0))
                mins, secs = divmod(uptime_s, 60)
                hours, mins = divmod(mins, 60)
                active_batch = BATCH_PRESETS[batch_idx]

                header_text = Text()
                header_text.append("🚚 AgriChain Mission Control", style="bold cyan")
                header_text.append(f"  |  Port: {args.port}", style="white")
                if link.connected:
                    header_text.append(f"  |  Uptime: {hours:02d}:{mins:02d}:{secs:02d}", style="green")
                else:
                    header_text.append(f"  |  🔌 DISCONNECTED ({link.last_error or 'reconnecting'})", style="bold red")
                header_text.append(f"  |  💾 Flash: {current_data.get('flash_records', 0)} recs", style="magenta")
                header_text.append(f"  |  Active Lot: {active_batch['batch_id']}", style="bold bright_yellow")
                if stream_paused:
                    header_text.append("  |  ⏸️ PAUSED", style="bold red")
                elif link.connected:
                    header_text.append("  |  ▶️ LIVE 1Hz", style="bold green")
                layout["header"].update(Panel(header_text, style="blue"))

                # 4. Sensor table
                layout["sensors"].update(format_sensor_table(current_data, active_batch, backend_state))

                # 5. Event ledger
                avail_lines = max(5, console.size.height - 27)
                visible_logs = recent_logs[-avail_lines:]
                log_content = "\n".join(visible_logs) if visible_logs else "[dim]Awaiting telemetry packets...[/dim]"
                layout["log"].update(
                    Panel(
                        log_content,
                        title="📜 Multi-Gas, Shock & Optical Event Ledger (1000ms Real-Time Pulse)",
                        subtitle=f"[dim]Displaying latest {len(visible_logs)} lines | Log buffer: {len(recent_logs)} | Outbox: {backend_state.get('outbox', 0)} file(s)[/dim]",
                        border_style="green"
                    )
                )

                # 6. Footer
                footer_text = Text()
                for k, label in (("[P] ", "Pause/Resume  "), ("[S] ", "Sync Flash  "), ("[C] ", "Clear Flash (x2)  "),
                                 ("[M] ", "Maps Link  ")):
                    footer_text.append(k, style="bold bright_cyan")
                    footer_text.append(label, style="white")
                footer_text.append("[B] ", style="bold bright_cyan")
                footer_text.append(f"Cycle Produce Lot ({active_batch['batch_id']})  ", style="bold bright_yellow")
                footer_text.append("[Q] ", style="bold bright_red")
                footer_text.append("Quit", style="white")
                layout["footer"].update(Panel(footer_text, style="bright_blue"))
    except KeyboardInterrupt:
        pass
    finally:
        stop_event.set()
        t_key.join(timeout=0.5)   # restores the terminal from cbreak mode
        link.close()
        pending = len(outbox_files())
        if pending:
            console.print(f"[yellow]📮 {pending} outbox file(s) in {os.path.relpath(OUTBOX_DIR)} will upload next time the monitor runs.[/yellow]")


if __name__ == '__main__':
    main()
