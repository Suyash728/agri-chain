"""IoT device registry and device-to-batch linking (logistics & dark store tracking)."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

import iot
from common import _resolve_crop_icon
from db import get_connection

router = APIRouter()


class DeviceRegisterRequest(BaseModel):
    device_id: str
    label: Optional[str] = None
    kind: Optional[str] = None  # HARDWARE | SIMULATED (inferred from the id when omitted)


class DeviceAssignRequest(BaseModel):
    batch_id: str
    assigned_by: Optional[str] = None


class DeviceUnassignRequest(BaseModel):
    reason: Optional[str] = None


def _require_device(conn, device_id: str):
    row = conn.execute("SELECT * FROM iot_devices WHERE device_id = ?", (device_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Device {device_id} is not registered")
    return row


@router.get("/devices")
def list_devices():
    """All registered sensors with online status, current batch and latest reading."""
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM iot_devices ORDER BY kind, device_id").fetchall()
        return [iot.device_summary(conn, r) for r in rows]
    finally:
        conn.close()


@router.post("/devices/register")
def register_device(payload: DeviceRegisterRequest):
    """Called by the ESP32 bridge / simulators on start-up (needs X-Device-Key in production)."""
    device_id = payload.device_id.strip()
    if not device_id:
        raise HTTPException(status_code=400, detail="device_id is required")
    conn = get_connection()
    try:
        iot.register_device(conn, device_id, label=payload.label, kind=payload.kind, touch=True)
        conn.commit()
        return iot.device_summary(conn, _require_device(conn, device_id))
    finally:
        conn.close()


@router.get("/devices/{device_id}/assignment")
def get_assignment(device_id: str):
    """Current batch for a device (`assignment` is null when unlinked). Polled by the bridge."""
    conn = get_connection()
    try:
        _require_device(conn, device_id)
        return {"deviceId": device_id, "assignment": iot.active_assignment(conn, device_id)}
    finally:
        conn.close()


@router.post("/devices/{device_id}/assign")
def assign_device(device_id: str, payload: DeviceAssignRequest):
    conn = get_connection()
    try:
        try:
            result = iot.assign_device(conn, device_id, payload.batch_id.strip(), payload.assigned_by)
        except LookupError as e:
            raise HTTPException(status_code=404, detail=str(e))
        conn.commit()
        return {"deviceId": device_id, **result}
    finally:
        conn.close()


@router.post("/devices/{device_id}/unassign")
def unassign_device(device_id: str, payload: Optional[DeviceUnassignRequest] = None):
    conn = get_connection()
    try:
        _require_device(conn, device_id)
        previous = iot.unassign_device(conn, device_id, payload.reason if payload else None)
        conn.commit()
        return {"deviceId": device_id, "previousBatchId": previous, "assignment": None}
    finally:
        conn.close()


@router.get("/devices/{device_id}/history")
def assignment_history(device_id: str, limit: int = Query(50, ge=1, le=500)):
    """Dated link history (the basis for time-window allocation of offline readings later)."""
    conn = get_connection()
    try:
        _require_device(conn, device_id)
        rows = conn.execute(
            """
            SELECT batch_id, assigned_at, unassigned_at, assigned_by, unassign_reason
            FROM device_assignments WHERE device_id = ? ORDER BY id DESC LIMIT ?
            """,
            (device_id, limit),
        ).fetchall()
        return [
            {"batchId": r["batch_id"], "assignedAt": r["assigned_at"], "unassignedAt": r["unassigned_at"],
             "assignedBy": r["assigned_by"], "reason": r["unassign_reason"]}
            for r in rows
        ]
    finally:
        conn.close()


@router.get("/iot/assignable-batches")
def assignable_batches(include_sold: bool = False):
    """Batches for the sensor picker, grouped client-side by custody state."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT batch_id, crop_name, origin_farm, farmer_name, created_at FROM batches ORDER BY created_at DESC"
        ).fetchall()
        out = []
        for r in rows:
            state = iot.batch_state(conn, r["batch_id"])
            if state == "SOLD" and not include_sold:
                continue
            linked = conn.execute(
                "SELECT device_id FROM device_assignments WHERE batch_id = ? AND unassigned_at IS NULL",
                (r["batch_id"],),
            ).fetchall()
            out.append({
                "batchId": r["batch_id"],
                "cropName": r["crop_name"],
                "originFarm": r["origin_farm"],
                "farmerName": r["farmer_name"],
                "image": _resolve_crop_icon(r["crop_name"]),
                "state": state,
                "stateLabel": iot.STATE_LABELS.get(state, state.title()),
                "linkedDevices": [x["device_id"] for x in linked],
            })
        order = {s: i for i, s in enumerate(["IN_TRANSIT", "IN_STORAGE", "AT_RETAIL", "REGISTERED", "SOLD"])}
        out.sort(key=lambda b: order.get(b["state"], 9))
        return out
    finally:
        conn.close()


@router.get("/batches/{batch_id}/iot")
def batch_iot(batch_id: str, recent: int = Query(20, ge=1, le=200)):
    """Sensor view of one batch: linked devices, latest reading, last GPS fix, recent history."""
    conn = get_connection()
    try:
        if not conn.execute("SELECT 1 FROM batches WHERE batch_id = ?", (batch_id,)).fetchone():
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
        return iot.batch_iot(conn, batch_id, recent) or {
            "batchId": batch_id, "linked": False, "devices": [], "live": False, "latest": None,
            "lastFix": None, "shockEvents": 0, "tamperSeen": False, "recent": [],
        }
    finally:
        conn.close()
