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

@router.post("/batches", response_model=CreateBatchResponse)
def post_batch(payload: CreateBatchRequest):
    """Register a new produce batch in SQLite and on-chain."""
    conn = get_connection()
    try:
        # Check if already exists in SQLite
        existing = conn.execute("SELECT batch_id FROM batches WHERE batch_id = ?", (payload.batch_id,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail=f"Batch {payload.batch_id} already exists")

        # Register on-chain
        try:
            tx_hash = chain.register_batch(
                batch_id=payload.batch_id,
                crop_name=payload.crop_name,
                origin_farm=payload.origin_farm,
                harvest_date=payload.harvest_date,
                farmer_address=payload.farmer_address,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"On-chain batch registration failed: {str(e)}")

        cat_str = payload.category or ""
        qty_val = payload.quantity_tonnes if payload.quantity_tonnes is not None else 0.5
        price_val = payload.price_inr if payload.price_inr is not None else 2500.0
        encoded_origin = f"{payload.origin_farm} ||cat={cat_str}||qty={qty_val}||price={price_val}"

        # Store in SQLite
        conn.execute(
            """
            INSERT INTO batches (batch_id, crop_name, origin_farm, harvest_date, farmer_name)
            VALUES (?, ?, ?, ?, ?)
            """,
            (payload.batch_id, payload.crop_name, encoded_origin, payload.harvest_date, payload.farmer_name),
        )

        # Store initial REGISTERED custody event with registered price
        price_paise = int(price_val * 100)
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, NULL, ?, 'REGISTERED', ?, ?)
            """,
            (payload.batch_id, payload.farmer_name, price_paise, tx_hash),
        )
        conn.commit()

        return CreateBatchResponse(
            batch_id=payload.batch_id,
            crop_name=payload.crop_name,
            origin_farm=payload.origin_farm,
            harvest_date=payload.harvest_date,
            farmer_name=payload.farmer_name,
            tx_hash=tx_hash,
        )
    finally:
        conn.close()


@router.post("/batches/{batch_id}/custody", response_model=CustodyTransferResponse)
def post_custody(batch_id: str, payload: CustodyTransferRequest):
    """Transfer custody of a batch in SQLite and on-chain."""
    conn = get_connection()
    try:
        # Verify batch exists in SQLite
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        # Determine last holder
        last_event = conn.execute(
            "SELECT to_holder FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
            (batch_id,),
        ).fetchone()
        from_holder = last_event["to_holder"] if last_event else batch_row["farmer_name"]

        # Resolve Ethereum destination address
        to_addr = payload.to_address
        if not to_addr:
            lookup = payload.to_holder.lower().strip()
            to_addr = PARTICIPANT_ADDRESSES.get(lookup, "0x70997970C51812dc3A010C7d01b50e0d17dc79C8")

        # Call on-chain transfer
        try:
            tx_hash = chain.transfer_custody(
                batch_id=batch_id,
                to_address=to_addr,
                new_state=payload.state,
                price_paise=payload.price_paise,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"On-chain custody transfer failed: {str(e)}")

        # Store in custody_events
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (batch_id, from_holder, payload.to_holder, payload.state.upper(), payload.price_paise, tx_hash),
        )
        conn.commit()

        return CustodyTransferResponse(
            batch_id=batch_id,
            from_holder=from_holder,
            to_holder=payload.to_holder,
            state=payload.state.upper(),
            price_paise=payload.price_paise,
            tx_hash=tx_hash,
        )
    finally:
        conn.close()


@router.post("/batches/{batch_id}/documents", response_model=BatchDocumentResponse)
async def upload_batch_document(
    batch_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("QUALITY_CERTIFICATE"),
):
    """Pins an uploaded batch certificate / lab report / photo to IPFS, anchors the CID on-chain,

    and stores metadata in the database.
    """
    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        file_bytes = await file.read()
        filename = file.filename or "document.pdf"

        # 1. Pin to IPFS
        pin_result = ipfs.pin_document(file_bytes, filename=filename, doc_type=doc_type.upper())
        ipfs_uri = pin_result["ipfs_uri"]
        gateway_url = pin_result["gateway_url"]

        # 2. Anchor on-chain in ProductRegistry (Task 9.4)
        tx_hash = None
        try:
            tx_hash = chain.set_batch_document(batch_id, doc_type.upper(), ipfs_uri)
        except Exception as e:
            print(f"[documents] On-chain anchoring warning: {e}")

        # 3. Store document metadata in database
        cur = conn.execute(
            """
            INSERT INTO batch_documents (batch_id, doc_type, ipfs_cid, file_name, tx_hash)
            VALUES (?, ?, ?, ?, ?)
            """,
            (batch_id, doc_type.upper(), ipfs_uri, filename, tx_hash),
        )
        doc_id = cur.lastrowid
        conn.commit()

        row = conn.execute("SELECT * FROM batch_documents WHERE id = ?", (doc_id,)).fetchone()
        uploaded_at = str(row["uploaded_at"]) if row else datetime.now().isoformat()

        return BatchDocumentResponse(
            id=doc_id or 1,
            batch_id=batch_id,
            doc_type=doc_type.upper(),
            ipfs_cid=ipfs_uri,
            file_name=filename,
            uploaded_at=uploaded_at,
            gateway_url=gateway_url,
            tx_hash=tx_hash,
        )
    finally:
        conn.close()


@router.get("/batches/{batch_id}/documents", response_model=List[BatchDocumentResponse])
def get_batch_documents(batch_id: str):
    """Retrieve all anchored IPFS documents for a given batch from database and smart contract."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM batch_documents WHERE batch_id = ? ORDER BY id DESC",
            (batch_id,),
        ).fetchall()

        results = []
        for r in rows:
            cid = r["ipfs_cid"].replace("ipfs://", "")
            results.append(BatchDocumentResponse(
                id=r["id"],
                batch_id=r["batch_id"],
                doc_type=r["doc_type"],
                ipfs_cid=r["ipfs_cid"],
                file_name=r["file_name"],
                uploaded_at=str(r["uploaded_at"]),
                gateway_url=f"https://gateway.pinata.cloud/ipfs/{cid}",
                tx_hash=r["tx_hash"],
            ))
        return results
    finally:
        conn.close()


@router.get("/batches")
def list_all_batches():
    """Return all registered batches with current status, custodian, and clean metadata."""
    conn = get_connection()
    try:
        rows = conn.execute("SELECT * FROM batches ORDER BY created_at DESC").fetchall()
        result = []
        for r in rows:
            raw_farm = r["origin_farm"] or ""
            clean_farm = raw_farm.split("||")[0].strip()

            ev = conn.execute(
                "SELECT * FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
                (r["batch_id"],)
            ).fetchone()
            current_state = ev["state"] if ev else "REGISTERED"
            current_holder = ev["to_holder"] if ev else r["farmer_name"]
            price_inr = (ev["price_paise"] / 100.0) if (ev and ev["price_paise"]) else 2500.0

            # Parse quantity
            qty_str = "500 kg"
            if "||qty=" in raw_farm:
                for part in raw_farm.split("||"):
                    if part.startswith("qty="):
                        try:
                            q = float(part.replace("qty=", "").strip())
                            qty_str = f"{int(q * 1000)} kg" if q < 10 else f"{int(q)} kg"
                        except Exception:
                            pass

            result.append({
                "batch_id": r["batch_id"],
                "crop_name": r["crop_name"],
                "farmer_name": r["farmer_name"],
                "origin_farm": clean_farm,
                "harvest_date": r["harvest_date"],
                "current_state": current_state,
                "current_holder": current_holder,
                "quantity": qty_str,
                "price_inr": price_inr,
                "farmer_price_inr": (ev["price_paise"] / 100.0) if (ev and ev["state"] == "REGISTERED" and ev["price_paise"]) else price_inr,
            })
        return result
    finally:
        conn.close()


@router.get("/batches/{batch_id}")
def get_batch_by_id(batch_id: str):
    """Return single batch with current status, farmer base price, latest price, and suggested stage prices."""
    conn = get_connection()
    try:
        r = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        raw_farm = r["origin_farm"] or ""
        clean_farm = raw_farm.split("||")[0].strip()

        # Parse quantity and farmer price from metadata
        qty_val = 0.5
        farmer_meta_price = None
        if "||" in raw_farm:
            for part in raw_farm.split("||"):
                if part.startswith("qty="):
                    try:
                        qty_val = float(part.replace("qty=", "").strip())
                    except Exception:
                        pass
                elif part.startswith("price="):
                    try:
                        farmer_meta_price = float(part.replace("price=", "").strip())
                    except Exception:
                        pass

        qty_str = f"{int(qty_val * 1000)} kg" if qty_val < 10 else f"{int(qty_val)} kg"

        events = conn.execute(
            "SELECT * FROM custody_events WHERE batch_id = ? ORDER BY id ASC",
            (batch_id,)
        ).fetchall()

        farmer_price_inr = farmer_meta_price or 2500.0
        latest_price_inr = farmer_price_inr
        current_state = "REGISTERED"
        current_holder = r["farmer_name"]

        events_list = []
        for ev in events:
            price_val = (ev["price_paise"] / 100.0) if ev["price_paise"] else latest_price_inr
            if ev["state"] == "REGISTERED" and ev["price_paise"]:
                farmer_price_inr = price_val
            latest_price_inr = price_val
            current_state = ev["state"]
            current_holder = ev["to_holder"] or current_holder
            events_list.append({
                "id": ev["id"],
                "state": ev["state"],
                "from_holder": ev["from_holder"],
                "to_holder": ev["to_holder"],
                "price_inr": price_val,
                "price_paise": ev["price_paise"],
                "tx_hash": ev["tx_hash"],
                "occurred_at": str(ev["occurred_at"]) if ev["occurred_at"] else None,
            })

        # Calculate logical suggested markup for each supply chain stage:
        # Logistics: Farmer MRP + 15% freight (min 500, rounded to nearest 50)
        logistics_markup = max(500, round((farmer_price_inr * 0.15) / 50) * 50)
        suggested_logistics_price = round(farmer_price_inr + logistics_markup)

        # Dark Store: Latest Price (Logistics) + 12% cooling/storage (min 400, rounded to nearest 50)
        darkstore_markup = max(400, round((latest_price_inr * 0.12) / 50) * 50)
        suggested_darkstore_price = round(latest_price_inr + darkstore_markup)

        # Retail: Latest Price (Dark Store) + 18% consumer delivery (min 600, rounded to nearest 50)
        retail_markup = max(600, round((latest_price_inr * 0.18) / 50) * 50)
        suggested_retail_price = round(latest_price_inr + retail_markup)

        return {
            "batch_id": r["batch_id"],
            "crop_name": r["crop_name"],
            "farmer_name": r["farmer_name"],
            "origin_farm": clean_farm,
            "harvest_date": r["harvest_date"],
            "quantity": qty_str,
            "quantity_val": qty_val,
            "current_state": current_state,
            "current_holder": current_holder,
            "farmer_price_inr": farmer_price_inr,
            "latest_price_inr": latest_price_inr,
            "suggested_logistics_price_inr": suggested_logistics_price,
            "suggested_darkstore_price_inr": suggested_darkstore_price,
            "suggested_retail_price_inr": suggested_retail_price,
            "events": events_list,
        }
    finally:
        conn.close()


@router.get("/batches/{batch_id}/traceability")
def get_batch_traceability(batch_id: str):
    """Returns traceabilityBatch matching mockData.js shape, populated from custody_events and on-chain ConditionRecorded events."""
    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        raw_farm = batch_row["origin_farm"] or ""
        clean_farm = raw_farm.split("||")[0].strip()

        # Parse quantity in kg (e.g. 0.25 tonnes = 250 kg)
        qty_kg = 500.0
        if "||qty=" in raw_farm:
            for part in raw_farm.split("||"):
                if part.startswith("qty="):
                    try:
                        q = float(part.replace("qty=", "").strip())
                        qty_kg = q * 1000.0 if q < 20.0 else q
                    except Exception:
                        pass
        qty_str = f"{int(qty_kg)} kg" if qty_kg >= 1 else f"{qty_kg:.1f} kg"

        events = conn.execute(
            "SELECT * FROM custody_events WHERE batch_id = ? ORDER BY id ASC",
            (batch_id,),
        ).fetchall()

        # Extract stage lot values from events
        farm_price_inr = 0.0
        transit_price_inr = 0.0
        storage_price_inr = 0.0
        retail_price_inr = 0.0

        if events and events[0]["price_paise"]:
            farm_price_inr = events[0]["price_paise"] / 100.0
        if farm_price_inr <= 0 and "||price=" in raw_farm:
            for part in raw_farm.split("||"):
                if part.startswith("price="):
                    try:
                        farm_price_inr = float(part.replace("price=", "").strip())
                    except Exception:
                        pass

        for ev in events:
            st = ev["state"]
            amt = (ev["price_paise"] or 0) / 100.0
            if st == "IN_TRANSIT" and amt > 0:
                transit_price_inr = amt
            elif st in ("IN_STORAGE", "AT_RETAIL") and amt > 0:
                storage_price_inr = amt
            elif st == "SOLD" and amt > 0:
                retail_price_inr = amt

        # Compute Solution A: Normalized Unit Rates (₹/kg)
        if transit_price_inr > 0:
            transit_rate = round(transit_price_inr / qty_kg, 2)
        else:
            transit_rate = 32.0

        if farm_price_inr >= 1000:
            farm_rate = round(farm_price_inr / qty_kg, 2)
        elif farm_price_inr > 0 and farm_price_inr < 200:
            farm_rate = round(farm_price_inr, 2)
        else:
            farm_rate = max(15.0, round(transit_rate * 0.875, 2))

        if storage_price_inr > 0:
            storage_rate = round(storage_price_inr / qty_kg, 2)
        else:
            storage_rate = round(transit_rate * 1.08, 2)

        if retail_price_inr >= storage_price_inr and storage_price_inr > 0:
            # Whole lot checked out at retail
            pack_kg = qty_kg
            retail_rate = round(retail_price_inr / qty_kg, 2)
        elif retail_price_inr > 0:
            # Disaggregated consumer retail pack/crate (e.g. ₹650 for a 15 kg crate)
            pack_kg = max(5.0, round(retail_price_inr / max(25.0, storage_rate * 1.25), 0))
            retail_rate = round(retail_price_inr / pack_kg, 2)
        else:
            pack_kg = 15.0
            retail_rate = round(storage_rate * 1.25, 2)

        # Enforce progressive monotonic price trail
        transit_rate = max(transit_rate, round(farm_rate + 2.0, 2))
        storage_rate = max(storage_rate, round(transit_rate + 2.40, 2))
        retail_rate = max(retail_rate, round(storage_rate + 6.50, 2))

        # Build price transparency breakdown model
        farmer_share_pct = round((farm_rate / retail_rate) * 100.0, 1)
        logistics_share_pct = round(((transit_rate - farm_rate) / retail_rate) * 100.0, 1)
        darkstore_share_pct = round(((storage_rate - transit_rate) / retail_rate) * 100.0, 1)
        retail_share_pct = max(0.0, round(100.0 - (farmer_share_pct + logistics_share_pct + darkstore_share_pct), 1))

        price_trail = {
            "farmerRate": farm_rate,
            "logisticsRate": transit_rate,
            "darkstoreRate": storage_rate,
            "retailRate": retail_rate,
            "farmerSharePct": farmer_share_pct,
            "logisticsSharePct": logistics_share_pct,
            "darkstoreSharePct": darkstore_share_pct,
            "retailSharePct": retail_share_pct,
            "packKg": int(pack_kg),
            "batchQtyKg": int(qty_kg),
        }

        steps = []
        step_num = 1

        reg_time = format_local_timestamp(batch_row["created_at"])
        steps.append({
            "step": step_num,
            "name": "Farm Registration",
            "status": "Completed",
            "timestamp": reg_time,
            "location": clean_farm,
            "holder": batch_row["farmer_name"],
            "pricePaise": int(farm_rate * qty_kg * 100),
            "unitRateInr": farm_rate,
            "rateFormatted": f"₹{farm_rate:.2f} / kg",
            "stageDetail": f"Farm-Gate Base ({int(qty_kg)} kg Lot)",
        })
        step_num += 1

        latest_state = "REGISTERED"
        latest_holder = batch_row["farmer_name"]

        for ev in events:
            st = ev["state"]
            t_str = format_local_timestamp(ev["occurred_at"])
            latest_state = st
            if ev["to_holder"]:
                latest_holder = ev["to_holder"]

            if st == "REGISTERED":
                continue
            elif st in ("CONFIRMED", "ACCEPTED", "READY_FOR_PICKUP"):
                steps.append({
                    "step": step_num,
                    "name": "Procurement Confirmed",
                    "status": "Ready for Pickup",
                    "timestamp": t_str,
                    "location": f"Farm gate pickup with {ev['to_holder']}",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                    "unitRateInr": farm_rate,
                    "rateFormatted": f"₹{farm_rate:.2f} / kg",
                    "stageDetail": "Procurement Handoff",
                })
                step_num += 1
            elif st == "IN_TRANSIT":
                steps.append({
                    "step": step_num,
                    "name": "Transport Dispatch",
                    "status": "In Transit",
                    "timestamp": t_str,
                    "location": f"In Transit with {ev['to_holder']}",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                    "unitRateInr": transit_rate,
                    "rateFormatted": f"₹{transit_rate:.2f} / kg",
                    "stageDetail": f"Bulk Reefer Fleet (Lot: ₹{int(transit_price_inr):,})" if transit_price_inr > 0 else "Reefer Highway Transit",
                })
                step_num += 1
            elif st == "IN_STORAGE":
                steps.append({
                    "step": step_num,
                    "name": "Dark Store Intake (GRN)",
                    "status": "In Storage",
                    "timestamp": t_str,
                    "location": f"{ev['to_holder']} (Cold Storage Bay)",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                    "unitRateInr": storage_rate,
                    "rateFormatted": f"₹{storage_rate:.2f} / kg",
                    "stageDetail": f"Cold Hub Intake (Lot: ₹{int(storage_price_inr):,})" if storage_price_inr > 0 else "Cold Hub Storage",
                })
                step_num += 1
            elif st == "AT_RETAIL":
                steps.append({
                    "step": step_num,
                    "name": "Retail Distribution",
                    "status": "At Retail",
                    "timestamp": t_str,
                    "location": f"{ev['to_holder']}",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                    "unitRateInr": storage_rate,
                    "rateFormatted": f"₹{storage_rate:.2f} / kg",
                    "stageDetail": "Retail Merchandising",
                })
                step_num += 1
            elif st == "SOLD":
                steps.append({
                    "step": step_num,
                    "name": "Consumer Doorstep Delivery",
                    "status": "Delivered",
                    "timestamp": t_str,
                    "location": "Consumer Doorstep",
                    "holder": ev["to_holder"],
                    "pricePaise": ev["price_paise"],
                    "unitRateInr": retail_rate,
                    "rateFormatted": f"₹{retail_rate:.2f} / kg",
                    "stageDetail": f"Retail Pack ({int(pack_kg)} kg @ ₹{int(retail_price_inr):,})" if retail_price_inr < storage_price_inr and retail_price_inr > 0 else f"Final Delivery ({int(qty_kg)} kg)",
                })
                step_num += 1

        if len(steps) > 1:
            current_location = steps[-1]["location"]
        else:
            current_location = clean_farm

        condition_log = []
        try:
            raw_conditions = chain.get_condition_records(batch_id)
            for c in raw_conditions:
                condition_log.append({
                    "tempC": c["tempDeciC"] / 10.0,
                    "humidityPct": c["humidityPct"],
                    "breach": c["breach"],
                })
        except Exception:
            pass

        # If on-chain records are fewer than SQLite records, merge with SQLite readings
        readings = conn.execute(
            "SELECT * FROM readings WHERE batch_id = ? ORDER BY id ASC",
            (batch_id,),
        ).fetchall()
        if len(condition_log) < len(readings):
            condition_log = [
                {
                    "tempC": float(r["temp_c"]),
                    "humidityPct": float(r["humidity_pct"]),
                    "breach": (r["verdict"] in ("BREACH", "BREACH_MINED_ON_CHAIN") or "BREACH" in (r["verdict"] or "")),
                    "quarantined": (r["verdict"] == "QUARANTINED"),
                    "txHash": r["tx_hash"],
                }
                for r in readings
            ]

        custody_history = []
        for ev in events:
            custody_history.append({
                "fromHolder": ev["from_holder"],
                "toHolder": ev["to_holder"],
                "state": ev["state"],
                "pricePaise": ev["price_paise"],
                "priceRupees": ev["price_paise"] // 100,
                "txHash": ev["tx_hash"],
                "occurredAt": ev["occurred_at"],
            })

        # Compute dynamic Quality & Freshness score (inspired by ADOS consensus & telemetry health)
        breach_count = sum(1 for c in condition_log if c.get("breach", False))
        total_conditions = len(condition_log)
        if total_conditions == 0:
            quality_score = 98.0
            freshness_pct = 98
            quality_grade = "A+"
        else:
            breach_penalty = min(60.0, (breach_count / total_conditions) * 100.0)
            quality_score = max(35.0, round(99.0 - breach_penalty, 1))
            freshness_pct = int(quality_score)
            if quality_score >= 90:
                quality_grade = "A+"
            elif quality_score >= 80:
                quality_grade = "A"
            elif quality_score >= 65:
                quality_grade = "B"
            else:
                quality_grade = "C (Degraded)"

        return {
            "batchId": batch_row["batch_id"],
            "product": batch_row["crop_name"],
            "quantity": qty_str,
            "harvestDate": batch_row["harvest_date"],
            "currentLocation": current_location,
            "currentHolder": latest_holder,
            "currentState": latest_state,
            "farmDetails": f"{clean_farm}, {batch_row['farmer_name']}",
            "steps": steps,
            "conditionLog": condition_log,
            "custodyHistory": custody_history,
            "qualityScore": quality_score,
            "freshnessPct": freshness_pct,
            "qualityGrade": quality_grade,
            "priceTrail": price_trail,
        }
    finally:
        conn.close()


@router.post("/batches/{batch_id}/reviews")
def create_batch_review(batch_id: str, payload: ReviewCreateRequest):
    """Submits a consumer quality/freshness review for a batch with custody state SOLD."""
    if not (1 <= payload.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be an integer between 1 and 5.")

    conn = get_connection()
    try:
        batch_row = conn.execute("SELECT * FROM batches WHERE batch_id = ?", (batch_id,)).fetchone()
        if not batch_row:
            raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")

        last_custody = conn.execute(
            "SELECT state FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
            (batch_id,)
        ).fetchone()

        if not last_custody or last_custody["state"] != "SOLD":
            current_state = last_custody["state"] if last_custody else "UNREGISTERED"
            raise HTTPException(
                status_code=400,
                detail=f"Only batches with custody state 'SOLD' can receive verified reviews. Current state: '{current_state}'."
            )

        now_str = datetime.now(timezone.utc).isoformat()
        conn.execute(
            """
            INSERT INTO batch_reviews (batch_id, rating, comment, freshness_score, reviewer_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (batch_id, payload.rating, payload.comment, payload.freshness_score, payload.reviewer_address, now_str)
        )
        conn.commit()

        rows = conn.execute(
            "SELECT rating, freshness_score FROM batch_reviews WHERE batch_id = ?",
            (batch_id,)
        ).fetchall()
        total_rev = len(rows)
        avg_rating = round(sum(r["rating"] for r in rows) / total_rev, 1) if total_rev else payload.rating
        fresh_vals = [r["freshness_score"] for r in rows if r["freshness_score"] is not None]
        avg_freshness = round(sum(fresh_vals) / len(fresh_vals), 1) if fresh_vals else 95.0

        return {
            "success": True,
            "batch_id": batch_id,
            "rating": payload.rating,
            "comment": payload.comment,
            "freshness_score": payload.freshness_score,
            "reviewer_address": payload.reviewer_address,
            "average_rating": avg_rating,
            "average_freshness": avg_freshness,
            "total_reviews": total_rev,
        }
    finally:
        conn.close()


@router.get("/batches/{batch_id}/reviews")
def get_batch_reviews(batch_id: str):
    """Retrieves all verified customer reviews and aggregate rating for a batch."""
    conn = get_connection()
    try:
        rows = conn.execute(
            "SELECT id, batch_id, rating, comment, freshness_score, reviewer_address, created_at FROM batch_reviews WHERE batch_id = ? ORDER BY id DESC",
            (batch_id,)
        ).fetchall()

        reviews = [dict(r) for r in rows]
        total_rev = len(reviews)
        avg_rating = round(sum(r["rating"] for r in reviews) / total_rev, 1) if total_rev else 5.0
        fresh_vals = [r["freshness_score"] for r in reviews if r["freshness_score"] is not None]
        avg_freshness = round(sum(fresh_vals) / len(fresh_vals), 1) if fresh_vals else 98.0

        return {
            "batch_id": batch_id,
            "average_rating": avg_rating,
            "average_freshness": avg_freshness,
            "total_reviews": total_rev,
            "reviews": reviews,
        }
    finally:
        conn.close()


