import math
import time
import json
import uuid
import socket
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Union, Dict, Any

from fastapi import APIRouter, HTTPException, Query, Body, File, UploadFile, Form, Response
from pydantic import BaseModel

import chain
import ipfs
from db import get_connection, DB_PATH
from common import (
    PARTICIPANT_ADDRESSES,
    SENSOR_CORRUPTION_CODES,
    COLD_CHAIN_POLICY_BREACH_CODES,
    REASON_CODE_LABELS,
    ROLE_TO_ONCHAIN_MAP,
    format_local_timestamp,
    get_local_lan_ip,
    insert_quarantine_entry,
    _parse_batch_meta,
    _resolve_category_id,
    _resolve_crop_icon,
)
from schemas import *

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/network/info")
def network_info():
    ip = get_local_lan_ip()
    return {
        "lan_ip": ip,
        "frontend_port": 3000,
        "backend_port": 8000,
        "client_url": f"http://{ip}:3000",
        "api_url": f"http://{ip}:8000"
    }


@router.get("/notifications/all-users")
def get_universal_notifications(role: Optional[str] = None):
    """
    Returns multi-role tailored notifications for all 5 roles:
    Farmer, Logistics Partner, Dark Store, Consumer, and Admin.
    Dynamically generated from real database events:
    - Registered farm batches & upcoming harvest arrivals
    - On-chain custody transitions (registration, dispatch, delivery, sale)
    - Pre-chain AI trust quarantine and cold-chain breach alerts
    - Spoilage claims, write-offs, and financial impact
    - Verified consumer ratings and reviews
    - Node operational and network readiness alerts
    """
    conn = get_connection()
    try:
        role_filter = (role or "").strip().lower()
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

        spoilage_rows = conn.execute(
            "SELECT * FROM spoilage_incidents ORDER BY id DESC LIMIT 15"
        ).fetchall()
        quarantine_rows = conn.execute(
            """
            SELECT q.*, r.batch_id, r.temp_c, r.humidity_pct, b.crop_name
            FROM quarantine q
            JOIN readings r ON q.reading_id = r.id
            LEFT JOIN batches b ON r.batch_id = b.batch_id
            ORDER BY q.id DESC LIMIT 15
            """
        ).fetchall()
        custody_rows = conn.execute(
            """
            SELECT c.*, b.crop_name, b.farmer_name, b.origin_farm
            FROM custody_events c
            JOIN batches b ON c.batch_id = b.batch_id
            ORDER BY c.id DESC LIMIT 25
            """
        ).fetchall()
        review_rows = conn.execute(
            """
            SELECT rv.*, b.crop_name
            FROM batch_reviews rv
            JOIN batches b ON rv.batch_id = b.batch_id
            ORDER BY rv.id DESC LIMIT 10
            """
        ).fetchall()
        batch_rows = conn.execute(
            """
            SELECT b.* FROM batches b ORDER BY b.created_at DESC LIMIT 20
            """
        ).fetchall()

        notifications = []

        # ---------------- 1. FARMER NOTIFICATIONS ----------------
        if not role_filter or role_filter in ("farmer", "all"):
            notifications.append({
                "id": "notif-farmer-system-ready",
                "recipient_role": "farmer",
                "category": "SYSTEM_READY",
                "title": "AgriChain Farm Node Connected",
                "desc": "Farm node linked with ProductRegistry.sol. Ready to tokenize organic harvests and trace custody.",
                "time": now_str,
                "icon": "ShieldCheck",
                "color": "text-[#3D5220]",
                "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
            })

            for b in batch_rows:
                notifications.append({
                    "id": f"notif-farmer-batch-{b['batch_id']}",
                    "recipient_role": "farmer",
                    "category": "BATCH_ONCHAIN",
                    "title": f"Harvest Registered: #{b['batch_id']}",
                    "desc": f"Batch {b['crop_name']} anchored on blockchain for farmer {b['farmer_name']}. Ready for procurement pickup.",
                    "time": format_local_timestamp(b["created_at"]),
                    "icon": "ShieldCheck",
                    "color": "text-[#3D5220]",
                    "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                })

            for sp in spoilage_rows:
                notifications.append({
                    "id": f"notif-farmer-spoil-{sp['incident_id']}",
                    "recipient_role": "farmer",
                    "category": "FAILURE_LOSS",
                    "title": f"Crop Loss Alert: Batch #{sp['batch_id']} ({sp['crop_name']})",
                    "desc": f"Transit failure at {sp['stage']}. {sp['loss_goods_kg']} kg degraded. Net impact: -₹{sp['total_loss_inr']:,.2f}. Fault: {sp['custodian_at_fault']}.",
                    "loss_goods_kg": sp["loss_goods_kg"],
                    "loss_money_inr": sp["total_loss_inr"],
                    "time": format_local_timestamp(sp["created_at"]),
                    "icon": "AlertTriangle",
                    "color": "text-red-600",
                    "bgColor": "bg-red-50 border-red-200",
                })

            for q in quarantine_rows:
                notifications.append({
                    "id": f"notif-farmer-quar-{q['id']}",
                    "recipient_role": "farmer",
                    "category": "AI_BREACH_ALERT",
                    "title": f"AI Cold-Chain Quarantine: #{q['batch_id']}",
                    "desc": f"Reading quarantined by AI Trust Layer: {q['reason']} ({q['temp_c']}°C, {q['humidity_pct']}% RH). SHA-256 IsoLog chained.",
                    "time": format_local_timestamp(q["created_at"]),
                    "icon": "AlertTriangle",
                    "color": "text-rose-600",
                    "bgColor": "bg-rose-50 border-rose-200",
                })

            for c in custody_rows:
                state = c["state"]
                price_inr = (c["price_paise"] or 0) / 100.0
                if state == "REGISTERED":
                    notifications.append({
                        "id": f"notif-farmer-cust-{c['id']}",
                        "recipient_role": "farmer",
                        "category": "BATCH_ONCHAIN",
                        "title": f"Batch Registered On-Chain: #{c['batch_id']}",
                        "desc": f"{c['crop_name']} origin lot anchored on ProductRegistry.sol. Base rate: ₹{price_inr:,.2f}.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "ShieldCheck",
                        "color": "text-[#3D5220]",
                        "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                    })
                elif state == "IN_TRANSIT":
                    notifications.append({
                        "id": f"notif-farmer-cust-{c['id']}",
                        "recipient_role": "farmer",
                        "category": "DISPATCH",
                        "title": f"Produce Dispatched: #{c['batch_id']}",
                        "desc": f"Handed off to carrier {c['to_holder']}. Stage transfer markup logged: ₹{price_inr:,.2f}.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "Truck",
                        "color": "text-[#B85C38]",
                        "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                    })
                elif state == "SOLD":
                    notifications.append({
                        "id": f"notif-farmer-cust-{c['id']}",
                        "recipient_role": "farmer",
                        "category": "FINAL_SALE",
                        "title": f"Retail Sale Complete: #{c['batch_id']}",
                        "desc": f"Batch #{c['batch_id']} reached consumer doorstep. Farmer fair-share guaranteed payout settled.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "CheckCircle2",
                        "color": "text-purple-600",
                        "bgColor": "bg-purple-50 border-purple-200",
                    })

            for rv in review_rows:
                notifications.append({
                    "id": f"notif-farmer-rev-{rv['id']}",
                    "recipient_role": "farmer",
                    "category": "VERIFIED_REVIEW",
                    "title": f"Consumer Review Received: #{rv['batch_id']}",
                    "desc": f"Rated {rv['rating']}★ (Freshness {rv['freshness_score']}%): \"{rv['comment']}\"",
                    "time": format_local_timestamp(rv["created_at"]),
                    "icon": "ShieldCheck",
                    "color": "text-amber-600",
                    "bgColor": "bg-amber-50 border-amber-200",
                })

        # ---------------- 2. LOGISTICS PARTNER NOTIFICATIONS ----------------
        if not role_filter or role_filter in ("logistics", "all"):
            notifications.append({
                "id": "notif-logistics-system-ready",
                "recipient_role": "logistics",
                "category": "SYSTEM_READY",
                "title": "SafeXpress Reefer Fleet Active",
                "desc": "Cold-chain telemetry oracle connected. Multi-sensor climate logging running at 100% compliance.",
                "time": now_str,
                "icon": "Truck",
                "color": "text-[#3D5220]",
                "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
            })

            for b in batch_rows:
                notifications.append({
                    "id": f"notif-logistics-proc-{b['batch_id']}",
                    "recipient_role": "logistics",
                    "category": "PROCUREMENT_ORDER",
                    "title": f"Procurement Order Ready: #{b['batch_id']}",
                    "desc": f"Pickup available for {b['crop_name']} from {b['farmer_name']} ({b['origin_farm'].split('||')[0].strip()}). Assign reefer vehicle.",
                    "time": format_local_timestamp(b["created_at"]),
                    "icon": "Truck",
                    "color": "text-[#3D5220]",
                    "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                })

            for sp in spoilage_rows:
                is_transit = sp["stage"] == "IN_TRANSIT" or "logistics" in str(sp["custodian_at_fault"]).lower()
                notifications.append({
                    "id": f"notif-logistics-spoil-{sp['incident_id']}",
                    "recipient_role": "logistics",
                    "category": "LIABILITY_PENALTY" if is_transit else "NETWORK_ALERT",
                    "title": f"{'Transit SLA Penalty' if is_transit else 'Supply Chain Spoilage'}: #{sp['batch_id']}",
                    "desc": f"{sp['details']} Carrier penalty liability: ₹{sp['total_loss_inr']:,.2f}.",
                    "loss_goods_kg": sp["loss_goods_kg"],
                    "loss_money_inr": sp["total_loss_inr"],
                    "time": format_local_timestamp(sp["created_at"]),
                    "icon": "Truck",
                    "color": "text-amber-700",
                    "bgColor": "bg-amber-50 border-amber-200",
                })

            for q in quarantine_rows:
                notifications.append({
                    "id": f"notif-logistics-quar-{q['id']}",
                    "recipient_role": "logistics",
                    "category": "TELEMETRY_ALERT",
                    "title": f"Reefer Telematics Alert: #{q['batch_id']}",
                    "desc": f"IoT Sensor Violation: {q['reason']} (Temp: {q['temp_c']}°C, Humidity: {q['humidity_pct']}%).",
                    "time": format_local_timestamp(q["created_at"]),
                    "icon": "AlertTriangle",
                    "color": "text-rose-600",
                    "bgColor": "bg-rose-50 border-rose-200",
                })

            for c in custody_rows:
                state = c["state"]
                if state == "REGISTERED":
                    notifications.append({
                        "id": f"notif-logistics-cust-{c['id']}",
                        "recipient_role": "logistics",
                        "category": "PROCUREMENT_ORDER",
                        "title": f"Procurement Order Ready: #{c['batch_id']}",
                        "desc": f"Pickup available from {c['farmer_name']} ({c['origin_farm'].split('||')[0].strip()}).",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "Truck",
                        "color": "text-[#3D5220]",
                        "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                    })
                elif state == "IN_STORAGE":
                    notifications.append({
                        "id": f"notif-logistics-cust-{c['id']}",
                        "recipient_role": "logistics",
                        "category": "DELIVERY_COMPLETE",
                        "title": f"Delivery Confirmed at Dark Store: #{c['batch_id']}",
                        "desc": f"Shipment accepted into custody by {c['to_holder']}. Handoff verified on-chain.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "CheckCircle2",
                        "color": "text-emerald-700",
                        "bgColor": "bg-emerald-50 border-emerald-200",
                    })

        # ---------------- 3. DARK STORE NOTIFICATIONS ----------------
        if not role_filter or role_filter in ("darkstore", "all"):
            notifications.append({
                "id": "notif-darkstore-system-ready",
                "recipient_role": "darkstore",
                "category": "SYSTEM_READY",
                "title": "Dark Store Intake Bays Active",
                "desc": "Pune Fresh DarkStore facility online. Cold bays 1-4 climate-controlled at 4.0°C and ready for GRN intake.",
                "time": now_str,
                "icon": "ShieldCheck",
                "color": "text-[#3D5220]",
                "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
            })

            for b in batch_rows:
                notifications.append({
                    "id": f"notif-darkstore-inbound-sched-{b['batch_id']}",
                    "recipient_role": "darkstore",
                    "category": "INBOUND_SCHEDULED",
                    "title": f"Incoming Harvest Lot: #{b['batch_id']}",
                    "desc": f"Farmer {b['farmer_name']} registered {b['crop_name']}. Scheduled for warehouse intake bay allocation.",
                    "time": format_local_timestamp(b["created_at"]),
                    "icon": "Package",
                    "color": "text-[#3D5220]",
                    "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                })

            for q in quarantine_rows:
                notifications.append({
                    "id": f"notif-darkstore-quar-{q['id']}",
                    "recipient_role": "darkstore",
                    "category": "STORAGE_ALERT",
                    "title": f"Cold-Chain Quality Alert: #{q['batch_id']}",
                    "desc": f"Sensor anomaly detected ({q['temp_c']}°C, {q['humidity_pct']}% RH). Pre-intake bay inspection required.",
                    "time": format_local_timestamp(q["created_at"]),
                    "icon": "AlertTriangle",
                    "color": "text-rose-600",
                    "bgColor": "bg-rose-50 border-rose-200",
                })

            for sp in spoilage_rows:
                notifications.append({
                    "id": f"notif-darkstore-spoil-{sp['incident_id']}",
                    "recipient_role": "darkstore",
                    "category": "INVENTORY_WRITE_OFF",
                    "title": f"Inbound Write-Off: Batch #{sp['batch_id']} ({sp['crop_name']})",
                    "desc": f"{sp['loss_goods_kg']} kg damaged during transit. Inventory write-off: -₹{sp['total_loss_inr']:,.2f}. Return GRN logged.",
                    "loss_goods_kg": sp["loss_goods_kg"],
                    "loss_money_inr": sp["total_loss_inr"],
                    "time": format_local_timestamp(sp["created_at"]),
                    "icon": "AlertCircle",
                    "color": "text-rose-700",
                    "bgColor": "bg-rose-50 border-rose-200",
                })

            for c in custody_rows:
                state = c["state"]
                price_inr = (c["price_paise"] or 0) / 100.0
                if state == "IN_TRANSIT":
                    notifications.append({
                        "id": f"notif-darkstore-cust-{c['id']}",
                        "recipient_role": "darkstore",
                        "category": "INBOUND_SCHEDULED",
                        "title": f"Inbound Shipment In Transit: #{c['batch_id']}",
                        "desc": f"Reefer vehicle en route from {c['from_holder']}. Estimated arrival at loading bay.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "Truck",
                        "color": "text-[#B85C38]",
                        "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                    })
                elif state == "IN_STORAGE":
                    notifications.append({
                        "id": f"notif-darkstore-cust-{c['id']}",
                        "recipient_role": "darkstore",
                        "category": "GRN_RECEIVED",
                        "title": f"GRN Received & Stored: #{c['batch_id']}",
                        "desc": f"{c['crop_name']} verified and allocated to cold bay. Intake valuation: ₹{price_inr:,.2f}.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "ShieldCheck",
                        "color": "text-emerald-700",
                        "bgColor": "bg-emerald-50 border-emerald-200",
                    })
                elif state == "SOLD":
                    notifications.append({
                        "id": f"notif-darkstore-cust-{c['id']}",
                        "recipient_role": "darkstore",
                        "category": "RETAIL_SALE",
                        "title": f"Consumer Sale Finalized: #{c['batch_id']}",
                        "desc": f"Produce lot checked out and sold at retail price of ₹{price_inr:,.2f}.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "CheckCircle2",
                        "color": "text-[#3D5220]",
                        "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                    })

        # ---------------- 4. CONSUMER NOTIFICATIONS ----------------
        if not role_filter or role_filter in ("consumer", "all"):
            notifications.append({
                "id": "notif-consumer-system-ready",
                "recipient_role": "consumer",
                "category": "SYSTEM_READY",
                "title": "100% Farm Freshness Guarantee Active",
                "desc": "Welcome to AgriChain! All produce is harvested within 24 hours from verified organic farms in Maharashtra.",
                "time": now_str,
                "icon": "ShieldCheck",
                "color": "text-[#3D5220]",
                "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
            })

            for b in batch_rows:
                notifications.append({
                    "id": f"notif-consumer-batch-{b['batch_id']}",
                    "recipient_role": "consumer",
                    "category": "FRESH_ARRIVALS",
                    "title": f"Fresh Harvest Available: {b['crop_name']}",
                    "desc": f"Direct farm harvest #{b['batch_id']} from {b['farmer_name']} ({b['origin_farm'].split('||')[0].strip()}) is now available for doorstep delivery.",
                    "time": format_local_timestamp(b["created_at"]),
                    "icon": "ShieldCheck",
                    "color": "text-[#3D5220]",
                    "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                })

            for q in quarantine_rows:
                notifications.append({
                    "id": f"notif-consumer-quar-{q['id']}",
                    "recipient_role": "consumer",
                    "category": "QUALITY_AUDIT",
                    "title": f"Quality Shield Audit: #{q['batch_id']}",
                    "desc": f"AI Trust Layer intercepted sub-optimal cold-chain conditions. 100% farm freshness guarantee applied.",
                    "time": format_local_timestamp(q["created_at"]),
                    "icon": "ShieldCheck",
                    "color": "text-emerald-700",
                    "bgColor": "bg-emerald-50 border-emerald-200",
                })

            for sp in spoilage_rows:
                consumer_refund = min(2200.0, float(sp["total_loss_inr"]))
                notifications.append({
                    "id": f"notif-consumer-spoil-{sp['incident_id']}",
                    "recipient_role": "consumer",
                    "category": "SAFETY_RECALL_REFUND",
                    "title": f"AgriChain Freshness Recall: #{sp['batch_id']}",
                    "desc": f"Cold-chain temperature breach detected in transit ({sp['crop_name']}). Intercepted before delivery. ₹{consumer_refund:,.2f} refunded.",
                    "refund_inr": consumer_refund,
                    "time": format_local_timestamp(sp["created_at"]),
                    "icon": "ShieldCheck",
                    "color": "text-emerald-700",
                    "bgColor": "bg-emerald-50 border-emerald-200",
                })

            for c in custody_rows:
                state = c["state"]
                if state == "IN_STORAGE":
                    notifications.append({
                        "id": f"notif-consumer-cust-{c['id']}",
                        "recipient_role": "consumer",
                        "category": "FRESH_ARRIVALS",
                        "title": f"Fresh Harvest in Stock: {c['crop_name']}",
                        "desc": f"Direct farm harvest #{c['batch_id']} from {c['farmer_name']} is now available for doorstep delivery.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "ShieldCheck",
                        "color": "text-[#3D5220]",
                        "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                    })
                elif state == "SOLD":
                    notifications.append({
                        "id": f"notif-consumer-cust-{c['id']}",
                        "recipient_role": "consumer",
                        "category": "ORDER_DELIVERED",
                        "title": f"Order Delivered: #{c['batch_id']}",
                        "desc": f"Your farm-fresh {c['crop_name']} has been delivered. View immutable QR provenance on-chain.",
                        "time": format_local_timestamp(c["occurred_at"]),
                        "icon": "CheckCircle2",
                        "color": "text-emerald-700",
                        "bgColor": "bg-emerald-50 border-emerald-200",
                    })

            for rv in review_rows:
                notifications.append({
                    "id": f"notif-consumer-rev-{rv['id']}",
                    "recipient_role": "consumer",
                    "category": "REVIEW_CONFIRMED",
                    "title": f"Verified Review Published: #{rv['batch_id']}",
                    "desc": f"Thank you for rating your produce! Your {rv['rating']}★ review is published on the blockchain.",
                    "time": format_local_timestamp(rv["created_at"]),
                    "icon": "ShieldCheck",
                    "color": "text-amber-600",
                    "bgColor": "bg-amber-50 border-amber-200",
                })

        # ---------------- 5. ADMIN / MASTER GOVERNANCE NOTIFICATIONS ----------------
        if not role_filter or role_filter in ("admin", "all"):
            notifications.append({
                "id": "notif-admin-gov-1",
                "recipient_role": "admin",
                "category": "SECURITY_AUDIT",
                "title": "Smart Contract RBAC Integrity Verified",
                "desc": "DEFAULT_ADMIN_ROLE and circuit breaker contracts synchronized with Hardhat RPC.",
                "time": now_str,
                "icon": "ShieldCheck",
                "color": "text-purple-600",
                "bgColor": "bg-purple-50 border-purple-200",
            })
            for b in batch_rows:
                notifications.append({
                    "id": f"notif-admin-batch-{b['batch_id']}",
                    "recipient_role": "admin",
                    "category": "PRODUCT_REGISTRY",
                    "title": f"Product Registry Anchor: #{b['batch_id']}",
                    "desc": f"Batch {b['crop_name']} tokenized under farmer role. Contract ProductRegistry.sol verified.",
                    "time": format_local_timestamp(b["created_at"]),
                    "icon": "ShieldCheck",
                    "color": "text-[#3D5220]",
                    "bgColor": "bg-[#FAF7F0] border-[#E6E1D5]",
                })
            for q in quarantine_rows[:3]:
                notifications.append({
                    "id": f"notif-admin-quar-{q['id']}",
                    "recipient_role": "admin",
                    "category": "PRE_CHAIN_SECURITY",
                    "title": f"Pre-Chain Quarantine Flagged: #{q['batch_id']}",
                    "desc": f"Anomaly isolated before on-chain commit. Reason: {q['reason']}.",
                    "time": format_local_timestamp(q["created_at"]),
                    "icon": "AlertTriangle",
                    "color": "text-rose-600",
                    "bgColor": "bg-rose-50 border-rose-200",
                })
            for sp in spoilage_rows[:3]:
                notifications.append({
                    "id": f"notif-admin-spoil-{sp['incident_id']}",
                    "recipient_role": "admin",
                    "category": "SLA_BREACH",
                    "title": f"Supply Chain SLA Claim Logged: #{sp['batch_id']}",
                    "desc": f"Liable: {sp['custodian_at_fault']}. Financial write-off: ₹{sp['total_loss_inr']:,.2f}.",
                    "time": format_local_timestamp(sp["created_at"]),
                    "icon": "AlertTriangle",
                    "color": "text-amber-700",
                    "bgColor": "bg-amber-50 border-amber-200",
                })

        # Deduplicate notifications by id preserving first occurrence
        seen_ids = set()
        deduped = []
        for n in notifications:
            if n["id"] not in seen_ids:
                seen_ids.add(n["id"])
                deduped.append(n)

        # Sort notifications by time descending (newest first)
        deduped.sort(key=lambda x: x.get("time", ""), reverse=True)
        return deduped
    finally:
        conn.close()


@router.get("/notifications/count")
def get_notifications_count(role: Optional[str] = None):
    """Return count of active notifications for a given role."""
    notifs = get_universal_notifications(role=role)
    return {"count": len(notifs), "role": role or "all"}


@router.get("/ipfs/{cid}")
def get_ipfs_asset(cid: str):
    """Local IPFS gateway endpoint returning cached raw binary content."""
    clean_cid = cid.replace("ipfs://", "")
    content = ipfs.get_pinned_content(clean_cid)
    if not content:
        raise HTTPException(status_code=404, detail="IPFS asset not found")
    media_type = "application/pdf"
    if clean_cid.endswith(".png") or (len(content) > 8 and b"PNG" in content[:8]):
        media_type = "image/png"
    elif clean_cid.endswith(".jpg") or (len(content) > 10 and (b"JFIF" in content[:10] or b"Exif" in content[:10])):
        media_type = "image/jpeg"
    return Response(content=content, media_type=media_type)


