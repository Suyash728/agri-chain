"""IoT device registry and device-to-batch linking.

A physical node (ESP32) or a virtual one (simulator, kind SIMULATED) is *linked* to one produce
batch at a time. Links are kept as a dated history (device_assignments) so readings can later be
allocated by time window; today the host bridge sends everything to the device's current batch.
Every telemetry packet that names a device is also stored in device_telemetry with the full IoT
context (shocks, tamper, GPS, VOC) that the core `readings` table does not keep.
"""
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from db import get_connection

logger = logging.getLogger("agrichain.iot")

ONLINE_WINDOW_S = 60.0
STATE_ORDER = ["REGISTERED", "IN_TRANSIT", "IN_STORAGE", "AT_RETAIL", "SOLD"]
STATE_LABELS = {
    "REGISTERED": "At farm gate",
    "IN_TRANSIT": "In transit",
    "IN_STORAGE": "At dark store",
    "AT_RETAIL": "At retail",
    "SOLD": "Sold",
}
VALID_KINDS = ("HARDWARE", "SIMULATED")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def infer_kind(device_id: str) -> str:
    return "SIMULATED" if device_id.upper().startswith(("SIM-", "DEV-", "VIRTUAL-")) else "HARDWARE"


# ------------------------------------------------------------------------------------------
# Registry
# ------------------------------------------------------------------------------------------
def register_device(conn, device_id: str, label: Optional[str] = None, kind: Optional[str] = None,
                    touch: bool = False) -> None:
    """Create or update a device. An explicitly given label/kind wins; otherwise existing values
    are kept (so a telemetry packet never downgrades a device registered as SIMULATED)."""
    explicit_kind = kind.upper() if kind and kind.upper() in VALID_KINDS else None
    existing = conn.execute("SELECT device_id FROM iot_devices WHERE device_id = ?", (device_id,)).fetchone()
    if existing:
        sets, params = [], []
        if label:
            sets.append("label = ?"); params.append(label)
        if explicit_kind:
            sets.append("kind = ?"); params.append(explicit_kind)
        if touch:
            sets.append("last_seen_epoch = ?"); params.append(time.time())
        if sets:
            conn.execute(f"UPDATE iot_devices SET {', '.join(sets)} WHERE device_id = ?", (*params, device_id))
        return
    conn.execute(
        "INSERT INTO iot_devices (device_id, label, kind, registered_at, last_seen_epoch) VALUES (?, ?, ?, ?, ?)",
        (device_id, label, explicit_kind or infer_kind(device_id), now_iso(), time.time() if touch else None),
    )


def batch_state(conn, batch_id: str) -> str:
    row = conn.execute(
        "SELECT state FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1", (batch_id,)
    ).fetchone()
    return (row["state"] if row else "REGISTERED") or "REGISTERED"


def _batch_summary(conn, batch_id: str) -> Optional[Dict[str, Any]]:
    row = conn.execute(
        "SELECT batch_id, crop_name, origin_farm, farmer_name FROM batches WHERE batch_id = ?", (batch_id,)
    ).fetchone()
    if not row:
        return None
    state = batch_state(conn, batch_id)
    return {
        "batchId": row["batch_id"],
        "cropName": row["crop_name"],
        "originFarm": row["origin_farm"],
        "farmerName": row["farmer_name"],
        "state": state,
        "stateLabel": STATE_LABELS.get(state, state.title()),
    }


def active_assignment(conn, device_id: str) -> Optional[Dict[str, Any]]:
    row = conn.execute(
        """
        SELECT id, device_id, batch_id, assigned_at, assigned_by FROM device_assignments
        WHERE device_id = ? AND unassigned_at IS NULL ORDER BY id DESC LIMIT 1
        """,
        (device_id,),
    ).fetchone()
    if not row:
        return None
    return {
        "deviceId": row["device_id"],
        "batchId": row["batch_id"],
        "assignedAt": row["assigned_at"],
        "assignedBy": row["assigned_by"],
        "batch": _batch_summary(conn, row["batch_id"]),
    }


def link_warnings(conn, batch_id: str) -> List[str]:
    """Non-blocking advice shown in the picker before/after linking."""
    warnings = []
    state = batch_state(conn, batch_id)
    if state == "SOLD":
        warnings.append("This batch is already sold — readings will be attached to a finished shipment.")
    elif state == "REGISTERED":
        warnings.append("This batch hasn't been dispatched yet (still at the farm gate).")
    others = conn.execute(
        "SELECT device_id FROM device_assignments WHERE batch_id = ? AND unassigned_at IS NULL", (batch_id,)
    ).fetchall()
    if others:
        warnings.append("Already monitored by " + ", ".join(r["device_id"] for r in others) + " (both will report).")
    return warnings


def assign_device(conn, device_id: str, batch_id: str, assigned_by: Optional[str] = None) -> Dict[str, Any]:
    """Link device -> batch. Closes the device's previous open link. Caller commits."""
    if not conn.execute("SELECT 1 FROM batches WHERE batch_id = ?", (batch_id,)).fetchone():
        raise LookupError(f"Batch {batch_id} not found")
    register_device(conn, device_id)
    current = active_assignment(conn, device_id)
    if current and current["batchId"] == batch_id:
        return {"changed": False, "previousBatchId": batch_id, "warnings": [], "assignment": current}
    warnings = link_warnings(conn, batch_id)
    ts = now_iso()
    conn.execute(
        "UPDATE device_assignments SET unassigned_at = ?, unassign_reason = ? WHERE device_id = ? AND unassigned_at IS NULL",
        (ts, f"relinked to {batch_id}", device_id),
    )
    conn.execute(
        "INSERT INTO device_assignments (device_id, batch_id, assigned_at, assigned_by) VALUES (?, ?, ?, ?)",
        (device_id, batch_id, ts, assigned_by),
    )
    return {
        "changed": True,
        "previousBatchId": current["batchId"] if current else None,
        "warnings": warnings,
        "assignment": active_assignment(conn, device_id),
    }


def unassign_device(conn, device_id: str, reason: Optional[str] = None) -> Optional[str]:
    current = active_assignment(conn, device_id)
    if not current:
        return None
    conn.execute(
        "UPDATE device_assignments SET unassigned_at = ?, unassign_reason = ? WHERE device_id = ? AND unassigned_at IS NULL",
        (now_iso(), reason or "unlinked", device_id),
    )
    return current["batchId"]


# ------------------------------------------------------------------------------------------
# Telemetry
# ------------------------------------------------------------------------------------------
def _num(v):
    try:
        return None if v is None else float(v)
    except (TypeError, ValueError):
        return None


def record_device_telemetry(payload, response) -> None:
    """Store the IoT view of an ingested packet. Best-effort: never breaks ingestion."""
    device_id = getattr(payload, "device_id", None)
    if not device_id:
        return
    conn = get_connection()
    try:
        # Only devices that registered explicitly (ESP32 bridge, simulators in --virtual mode) are
        # tracked, so ordinary simulator runs (device ids like DEV-<batch>) leave no sensor entries.
        if not conn.execute("SELECT 1 FROM iot_devices WHERE device_id = ?", (device_id,)).fetchone():
            return
        register_device(conn, device_id, touch=True)
        lat = payload.latitude if payload.latitude is not None else payload.lat
        lon = payload.longitude if payload.longitude is not None else payload.lon
        tamper = payload.tamper
        if tamper is None and payload.tamper_status:
            tamper = payload.tamper_status == "TAMPER_OPENED"
        temp = payload.temp_c if payload.temp_c is not None else payload.temperature
        hum = payload.humidity_pct if payload.humidity_pct is not None else payload.humidity
        conn.execute(
            """
            INSERT INTO device_telemetry (device_id, batch_id, received_at, measured_at, source, temp_c, humidity_pct,
                shocks, shock_delta, tamper, gps_fix, latitude, longitude, voc_ppm, light_lux, verdict, reading_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                device_id, payload.batch_id, now_iso(), payload.timestamp, payload.source or "live",
                _num(temp), _num(hum),
                payload.shocks, payload.shock_delta,
                None if tamper is None else int(bool(tamper)),
                None if payload.gps_fix is None else int(bool(payload.gps_fix)),
                _num(lat), _num(lon), _num(payload.freshness_voc_ppm), _num(payload.light_lux),
                getattr(response, "verdict", None), getattr(response, "reading_id", None),
            ),
        )
        conn.commit()
    except Exception as e:
        logger.warning("device telemetry not recorded for %s: %s", device_id, e)
    finally:
        conn.close()


def _telemetry_row(r) -> Dict[str, Any]:
    return {
        "deviceId": r["device_id"],
        "batchId": r["batch_id"],
        "receivedAt": r["received_at"],
        "measuredAt": r["measured_at"],
        "source": r["source"],
        "tempC": r["temp_c"],
        "humidityPct": r["humidity_pct"],
        "shocks": r["shocks"],
        "shockDelta": r["shock_delta"],
        "tamper": None if r["tamper"] is None else bool(r["tamper"]),
        "gpsFix": None if r["gps_fix"] is None else bool(r["gps_fix"]),
        "latitude": r["latitude"],
        "longitude": r["longitude"],
        "vocPpm": r["voc_ppm"],
        "lightLux": r["light_lux"],
        "verdict": r["verdict"],
    }


def device_summary(conn, device_row) -> Dict[str, Any]:
    last_seen = device_row["last_seen_epoch"]
    latest = conn.execute(
        "SELECT * FROM device_telemetry WHERE device_id = ? ORDER BY id DESC LIMIT 1", (device_row["device_id"],)
    ).fetchone()
    return {
        "deviceId": device_row["device_id"],
        "label": device_row["label"] or device_row["device_id"],
        "kind": device_row["kind"],
        "online": bool(last_seen and time.time() - float(last_seen) < ONLINE_WINDOW_S),
        "lastSeenSecondsAgo": None if not last_seen else int(time.time() - float(last_seen)),
        "assignment": active_assignment(conn, device_row["device_id"]),
        "latest": _telemetry_row(latest) if latest else None,
    }


def batch_iot(conn, batch_id: str, recent: int = 20) -> Optional[Dict[str, Any]]:
    """Linked devices + latest device telemetry for a batch, or None if it never had a device."""
    linked = conn.execute(
        """
        SELECT d.* FROM iot_devices d JOIN device_assignments a ON a.device_id = d.device_id
        WHERE a.batch_id = ? AND a.unassigned_at IS NULL ORDER BY a.id
        """,
        (batch_id,),
    ).fetchall()
    rows = conn.execute(
        "SELECT * FROM device_telemetry WHERE batch_id = ? ORDER BY id DESC LIMIT ?", (batch_id, recent)
    ).fetchall()
    if not linked and not rows:
        return None
    devices = []
    for d in linked:
        last_seen = d["last_seen_epoch"]
        devices.append({
            "deviceId": d["device_id"],
            "label": d["label"] or d["device_id"],
            "kind": d["kind"],
            "online": bool(last_seen and time.time() - float(last_seen) < ONLINE_WINDOW_S),
            "lastSeenSecondsAgo": None if not last_seen else int(time.time() - float(last_seen)),
        })
    latest = _telemetry_row(rows[0]) if rows else None
    # Most recent GPS fix may be older than the latest packet
    last_fix = next((r for r in rows if r["gps_fix"] and r["latitude"] is not None), None)
    return {
        "batchId": batch_id,
        "linked": bool(devices),
        "devices": devices,
        "live": any(d["online"] for d in devices),
        "latest": latest,
        "lastFix": {"latitude": last_fix["latitude"], "longitude": last_fix["longitude"],
                    "receivedAt": last_fix["received_at"]} if last_fix else None,
        "shockEvents": sum((r["shock_delta"] or 0) for r in rows),
        "tamperSeen": any(r["tamper"] for r in rows),
        "recent": [_telemetry_row(r) for r in reversed(rows)],
    }
