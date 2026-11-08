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

@router.get("/logistics/kpis")
def get_logistics_kpis():
    """Return live Logistics KPIs for LogisticKPICards.jsx."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT c.state, c.price_paise
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            """
        ).fetchall()

        total_in_transit = sum(1 for r in rows if r["state"] == "IN_TRANSIT")
        pending_orders = sum(1 for r in rows if r["state"] == "REGISTERED")

        transit_cost_row = conn.execute(
            "SELECT SUM(price_paise) as total FROM custody_events WHERE state = 'IN_TRANSIT'"
        ).fetchone()
        transit_cost_paise = transit_cost_row["total"] if transit_cost_row and transit_cost_row["total"] else 0
        cost_rupees = transit_cost_paise // 100

        total_readings = conn.execute("SELECT COUNT(*) as cnt FROM readings").fetchone()["cnt"]
        quarantine_cnt = conn.execute("SELECT COUNT(*) as cnt FROM quarantine").fetchone()["cnt"]
        if total_readings > 0:
            sla_pct = max(70, min(100, int(100 - (quarantine_cnt / total_readings * 100))))
        else:
            sla_pct = 98

        return {
            "totalShipments": total_in_transit,
            "shipmentsInTransit": total_in_transit,
            "pendingOrders": pending_orders,
            "onTimeDelivery": f"{sla_pct}%",
            "totalLogisticsCost": f"₹ {cost_rupees:,}",
            "rawCostPaise": transit_cost_paise,
        }
    finally:
        conn.close()


@router.get("/logistics/shipments")
def get_logistics_shipments():
    """Return active shipments for fleet tracking and transportation views."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT b.batch_id, b.crop_name, b.origin_farm, b.harvest_date, b.farmer_name,
                   c.state, c.from_holder, c.to_holder, c.price_paise, c.tx_hash, c.occurred_at
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            ORDER BY b.created_at DESC
            LIMIT 20
            """
        ).fetchall()

        shipments = []
        drivers = [
            ("Ramesh Yadav", "+91 98111 22233", "MH12 AB 1234"),
            ("Suresh Patil", "+91 98222 33344", "MH15 CD 5678"),
            ("Venkatesh Rao", "+91 98444 55566", "KA04 GH 2468"),
            ("Arvind Kumar", "+91 98333 44455", "UP14 EF 9101"),
        ]

        for idx, r in enumerate(rows):
            batch_id = r["batch_id"]
            state = (r["state"] or "").strip().upper()
            _, qty, price = _parse_batch_meta(r)
            qty_kg = int(qty * 1000)

            reading = conn.execute(
                "SELECT temp_c, humidity_pct, verdict FROM readings WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
                (batch_id,),
            ).fetchone()

            gps = conn.execute(
                "SELECT latitude, longitude FROM telemetry_history WHERE batch_id = ? ORDER BY recorded_at DESC LIMIT 1",
                (batch_id,),
            ).fetchone()

            lat = gps["latitude"] if gps else round(18.5204 + (idx * 0.015), 4)
            lon = gps["longitude"] if gps else round(73.8567 + (idx * 0.015), 4)

            temp_c = reading["temp_c"] if reading else 4.5
            hum_pct = reading["humidity_pct"] if reading else 88.0

            driver_info = drivers[idx % len(drivers)]

            clean_origin = r["origin_farm"].split("||")[0].strip()
            dest = "Pune Fresh DarkStore Hub"
            if state in ("IN_STORAGE", "AT_RETAIL"):
                dest = "Pune Fresh Retail DarkStore"
            elif state == "SOLD":
                dest = "Consumer Doorstep (Delivered)"

            is_quar = batch_id.startswith("QUARANTINE-") or (reading and reading["verdict"] in ("QUARANTINED", "ANOMALOUS")) or (reading and reading["temp_c"] and reading["temp_c"] >= 40.0)
            is_salvage = batch_id.startswith("TRANSIT-DEGRADE-") or (reading and reading["verdict"] == "BREACH_MINED_ON_CHAIN")
            is_replay = batch_id.startswith("REPLAY-")

            if is_quar:
                status_label = "Quarantined (Compressor Breakdown)"
                badge = "bg-red-100 text-red-800 font-extrabold border border-red-300"
            elif is_salvage:
                status_label = "Degraded (Salvage Lot Transferred)"
                badge = "bg-amber-100 text-amber-900 font-bold border border-amber-300"
            elif is_replay:
                status_label = "Halted (Sensor Spoofing Quarantined)"
                badge = "bg-purple-100 text-purple-900 font-bold border border-purple-300"
            elif state == "IN_TRANSIT":
                status_label = "In Transit"
                badge = "bg-[#2B6CB0]/15 text-[#2B6CB0]"
            elif state in ("REGISTERED", "PENDING"):
                status_label = "Awaiting Pickup"
                badge = "bg-[#B85C38]/15 text-[#B85C38]"
            elif state in ("CONFIRMED", "ACCEPTED"):
                status_label = "Scheduled for Dispatch"
                badge = "bg-[#556B2F]/15 text-[#556B2F]"
            elif state == "IN_STORAGE":
                status_label = "In Cold Storage"
                badge = "bg-[#556B2F]/15 text-[#556B2F]"
            elif state == "AT_RETAIL":
                status_label = "At Retail DarkStore"
                badge = "bg-[#354424]/15 text-[#354424]"
            elif state == "SOLD":
                status_label = "Delivered & Sold"
                badge = "bg-gray-100 text-gray-700"
            else:
                status_label = state
                badge = "bg-[#556B2F]/15 text-[#556B2F]"

            shipments.append({
                "batchId": batch_id,
                "product": r["crop_name"].capitalize(),
                "produce": r["crop_name"].capitalize(),
                "vehicle": driver_info[2],
                "number": driver_info[2],
                "driver": driver_info[0],
                "phone": driver_info[1],
                "quantity": f"{qty_kg} kg",
                "state": state,
                "status": status_label,
                "badge": badge,
                "temp": f"{temp_c:.1f}°C (Reefer Chilled)",
                "tempValue": temp_c,
                "humidityValue": hum_pct,
                "from": clean_origin,
                "to": dest,
                "eta": "Today, 06:00 PM" if state in ("IN_TRANSIT", "CONFIRMED") else ("Awaiting Dispatch" if state == "REGISTERED" else "Completed"),
                "latitude": lat,
                "longitude": lon,
                "coords": f"{lat:.4f}, {lon:.4f}",
                "priceRupees": r["price_paise"] // 100,
                "txHash": r["tx_hash"],
                "occurredAt": r["occurred_at"],
            })

        return shipments
    finally:
        conn.close()


@router.get("/logistics/orders")
def get_logistics_orders():
    """Return batches ready for procurement / pickup or in transit."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT b.batch_id, b.crop_name, b.origin_farm, b.harvest_date, b.farmer_name,
                   c.state, c.occurred_at
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            ORDER BY b.created_at DESC
            """
        ).fetchall()

        orders = []
        for r in rows:
            st = (r["state"] or "").strip().upper()
            if st in ["REGISTERED", "PENDING"]:
                status = "Ready for Pickup"
                badge = "bg-[#B85C38]/15 text-[#B85C38]"
            elif st in ["CONFIRMED", "ACCEPTED"]:
                status = "Confirmed"
                badge = "bg-[#556B2F]/15 text-[#556B2F]"
            elif st == "IN_TRANSIT":
                status = "In Transit"
                badge = "bg-[#2B6CB0]/15 text-[#2B6CB0]"
            else:
                status = "Delivered"
                badge = "bg-[#556B2F]/15 text-[#556B2F]"

            _, qty, price = _parse_batch_meta(r)
            price_str = f"₹ {int(price):,}" if price else "₹ 1,000"
            clean_origin = r["origin_farm"].split("||")[0].strip()

            orders.append({
                "id": r["batch_id"],
                "supplier": f"{r['farmer_name']} ({clean_origin})",
                "produce": f"{r['crop_name'].capitalize()} ({int(qty * 1000)} kg)",
                "cropName": r["crop_name"],
                "quantity": f"{int(qty * 1000)} kg",
                "status": status,
                "badgeClass": badge,
                "harvestDate": r["harvest_date"],
                "price": price_str,
                "priceInr": price,
            })
        return orders
    finally:
        conn.close()


@router.get("/logistics/available-produce")
def get_logistics_available_produce():
    """Returns registered farmer batches ready for pickup."""
    conn = get_connection()
    try:
        rows = conn.execute(
            """
            SELECT b.batch_id, b.crop_name, b.origin_farm, b.harvest_date, b.farmer_name,
                   c.state
            FROM batches b
            JOIN custody_events c ON c.id = (
                SELECT id FROM custody_events WHERE batch_id = b.batch_id ORDER BY id DESC LIMIT 1
            )
            WHERE c.state IN ('REGISTERED', 'CONFIRMED')
            ORDER BY b.created_at DESC
            """
        ).fetchall()

        items = []
        for idx, r in enumerate(rows):
            cat, qty, price = _parse_batch_meta(r)
            cat_id = _resolve_category_id(r["crop_name"], cat)
            icon = _resolve_crop_icon(r["crop_name"], cat)
            farm_clean = r["origin_farm"].split("||")[0].strip()

            items.append({
                "id": idx + 1,
                "batchId": r["batch_id"],
                "name": r["crop_name"].title(),
                "category": cat_id.capitalize(),
                "qty": f"{qty * 1000:.0f} kg ({qty:.2f} T)",
                "price": f"₹ {int(price):,} / Lot",
                "farm": f"{farm_clean} ({r['farmer_name']})",
                "status": "In Stock",
                "icon": icon,
            })
        return items
    finally:
        conn.close()


@router.get("/logistics/storage")
def get_logistics_storage():
    """Returns storage facilities and sensor monitoring from live readings."""
    conn = get_connection()
    try:
        latest_reading = conn.execute("SELECT temp_c FROM readings ORDER BY id DESC LIMIT 1").fetchone()
        readings_cnt = conn.execute("SELECT count(*) as cnt FROM readings").fetchone()["cnt"]
        batches_cnt = conn.execute("SELECT count(*) as cnt FROM batches").fetchone()["cnt"]

        if readings_cnt > 0 and latest_reading:
            current_temp = f"{latest_reading['temp_c']:.1f}°C (Active Telemetry)"
        else:
            current_temp = "Awaiting Telemetry"

        # Calculate actual inventory tonnage in transit or storage
        total_tonnes = 0.0
        if batches_cnt > 0:
            batches = conn.execute("SELECT origin_farm FROM batches").fetchall()
            for b in batches:
                _, qty, _ = _parse_batch_meta(b)
                total_tonnes += qty

        # If system is reset / empty, utilization is strictly 0
        if batches_cnt == 0:
            return [
                {
                    "name": "Nashik Warehouse Silo #1",
                    "capacity": "3,000 Tonnes",
                    "utilized": "0 Tonnes",
                    "pct": 0,
                    "temp": "18.2°C (Ambient Grain Silo)" if readings_cnt > 0 else "Awaiting Telemetry",
                    "location": "MIDC Ambad, Nashik",
                },
                {
                    "name": "Pune Cold Storage Reefer Hub",
                    "capacity": "2,500 Tonnes",
                    "utilized": "0 Tonnes",
                    "pct": 0,
                    "temp": current_temp,
                    "location": "Chakan Industrial Corridor, Pune",
                },
                {
                    "name": "Nagpur Central Transit Facility",
                    "capacity": "2,000 Tonnes",
                    "utilized": "0 Tonnes",
                    "pct": 0,
                    "temp": "19.5°C (Dry Storage)" if readings_cnt > 0 else "Awaiting Telemetry",
                    "location": "Kalamna Market, Nagpur",
                },
                {
                    "name": "Raipur Climate Controlled Hub",
                    "capacity": "2,500 Tonnes",
                    "utilized": "0 Tonnes",
                    "pct": 0,
                    "temp": "16.0°C (Humidity Controlled)" if readings_cnt > 0 else "Awaiting Telemetry",
                    "location": "Tatibandh, Raipur",
                },
            ]

        # Scaled realistic allocation across facilities when batches exist
        nashik_u = min(round(total_tonnes * 0.40, 2), 2900)
        pune_u = min(round(total_tonnes * 0.35, 2), 2400)
        nagpur_u = min(round(total_tonnes * 0.15, 2), 1900)
        raipur_u = min(round(total_tonnes * 0.10, 2), 2400)

        return [
            {
                "name": "Nashik Warehouse Silo #1",
                "capacity": "3,000 Tonnes",
                "utilized": f"{nashik_u:.2f} Tonnes",
                "pct": max(1, round(nashik_u / 3000 * 100)),
                "temp": "18.2°C (Ambient Grain Silo)",
                "location": "MIDC Ambad, Nashik",
            },
            {
                "name": "Pune Cold Storage Reefer Hub",
                "capacity": "2,500 Tonnes",
                "utilized": f"{pune_u:.2f} Tonnes",
                "pct": max(1, round(pune_u / 2500 * 100)),
                "temp": current_temp,
                "location": "Chakan Industrial Corridor, Pune",
            },
            {
                "name": "Nagpur Central Transit Facility",
                "capacity": "2,000 Tonnes",
                "utilized": f"{nagpur_u:.2f} Tonnes",
                "pct": max(1, round(nagpur_u / 2000 * 100)),
                "temp": "19.5°C (Dry Storage)",
                "location": "Kalamna Market, Nagpur",
            },
            {
                "name": "Raipur Climate Controlled Hub",
                "capacity": "2,500 Tonnes",
                "utilized": f"{raipur_u:.2f} Tonnes",
                "pct": max(1, round(raipur_u / 2500 * 100)),
                "temp": "16.0°C (Humidity Controlled)",
                "location": "Tatibandh, Raipur",
            },
        ]
    finally:
        conn.close()


@router.get("/logistics/category-allocations")
def get_logistics_category_allocations():
    """Returns warehouse category allocations dynamically calculated from registered batches."""
    conn = get_connection()
    try:
        batches = conn.execute("SELECT * FROM batches").fetchall()
        if not batches:
            return []

        cat_data = {}
        total_tonnes = 0.0

        for b in batches:
            cat, qty, price = _parse_batch_meta(b)
            c_name = _resolve_category_id(b["crop_name"], cat).capitalize()

            if "Fruit" in c_name or "Veg" in c_name:
                display_name = "Fruits & Vegetables (Tomato, Potato, Mango)"
            elif "Grain" in c_name:
                display_name = "Grains (Wheat & Rice)"
            elif "Pulse" in c_name or "Legume" in c_name:
                display_name = "Pulses & Legumes (Chickpea, Moong)"
            elif "Spice" in c_name:
                display_name = "Spices (Chilli, Turmeric)"
            else:
                display_name = f"{c_name} (Specialty Produce)"

            if display_name not in cat_data:
                cat_data[display_name] = {"qty_tonnes": 0.0, "val_inr": 0.0}

            cat_data[display_name]["qty_tonnes"] += qty
            cat_data[display_name]["val_inr"] += price
            total_tonnes += qty

        allocations = []
        for name, data in cat_data.items():
            pct = round((data["qty_tonnes"] / total_tonnes * 100)) if total_tonnes > 0 else 0
            allocations.append({
                "name": name,
                "qty": f"{data['qty_tonnes']:.2f} Tonnes",
                "val": f"₹{int(data['val_inr']):,}",
                "pct": pct,
            })

        allocations.sort(key=lambda x: x["pct"], reverse=True)
        return allocations
    finally:
        conn.close()


@router.get("/logistics/transactions")
def get_logistics_transactions():
    """Returns live on-chain custody and procurement settlement transactions."""
    conn = get_connection()
    try:
        events = conn.execute(
            """
            SELECT c.id, c.batch_id, c.state, c.from_holder, c.to_holder, c.price_paise,
                   c.tx_hash, c.occurred_at, b.crop_name
            FROM custody_events c
            JOIN batches b ON b.batch_id = c.batch_id
            WHERE c.price_paise > 0
            ORDER BY c.id DESC
            LIMIT 20
            """
        ).fetchall()

        txns = []
        # 1. Fetch carrier penalties from spoilage incidents
        penalties = conn.execute(
            """
            SELECT s.id, s.incident_id, s.batch_id, s.crop_name, s.total_loss_inr,
                   s.custodian_at_fault, s.created_at, s.details, s.status
            FROM spoilage_incidents s
            WHERE s.total_loss_inr > 0 AND s.custodian_at_fault IS NOT NULL
            ORDER BY s.id DESC
            LIMIT 10
            """
        ).fetchall()

        for p in penalties:
            p_amt = int(p["total_loss_inr"])
            txns.append({
                "id": f"SLA-{p['id']:04d}",
                "batchId": p["batch_id"],
                "crop": p["crop_name"].title(),
                "type": "SLA Carrier Penalty Deduction",
                "from": p["custodian_at_fault"],
                "to": "AgriChain Escrow & Farmer Settlement",
                "amount": f"- ₹ {p_amt:,}",
                "status": "Enforced On-Chain",
                "txHash": f"0x{hashlib.sha256(p['incident_id'].encode()).hexdigest()}",
                "date": str(p["created_at"])[:10],
            })

        for e in events:
            amt = e["price_paise"] // 100
            txns.append({
                "id": f"TXN-{e['id']:04d}",
                "batchId": e["batch_id"],
                "crop": e["crop_name"].title(),
                "type": "Procurement Handoff" if e["state"] == "IN_TRANSIT" else "Dark Store Settlement",
                "from": e["from_holder"],
                "to": e["to_holder"],
                "amount": f"₹ {amt:,}",
                "status": "Settled On-Chain",
                "txHash": e["tx_hash"],
                "date": e["occurred_at"],
            })
        return txns
    finally:
        conn.close()


