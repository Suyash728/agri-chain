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

from db import reset_system_data

@router.get("/admin/users")
def get_admin_users():
    """Lists system participants and checks their on-chain role status from SQLite database."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, username, name, email, phone, role, onchain_role, address, status, created_at FROM users ORDER BY id ASC"
        )
        rows = cur.fetchall()
        users = []
        participants = []

        for r in rows:
            u = (
                dict(r)
                if hasattr(r, "keys")
                else {
                    "id": r[0],
                    "username": r[1],
                    "name": r[2],
                    "email": r[3],
                    "phone": r[4],
                    "role": r[5],
                    "onchain_role": r[6],
                    "address": r[7],
                    "status": r[8],
                    "created_at": r[9],
                }
            )
            onchain_role = u.get("onchain_role") or "CONSUMER"
            addr = u.get("address", "")
            is_granted = True
            contract_details = {}

            if onchain_role != "CONSUMER" and addr and addr.startswith("0x"):
                try:
                    check = chain.check_role(onchain_role, addr)
                    is_granted = check["has_role"]
                    contract_details = check.get("contract_details", {})
                except Exception as e:
                    logger.debug("On-chain role check error: %s", e)
                    is_granted = True

            u["is_granted_onchain"] = is_granted
            u["contract_details"] = contract_details
            users.append(u)

            # Backwards compatibility for existing participants consumer/tests
            participants.append(
                {
                    "id": u["id"],
                    "name": u["name"],
                    "username": u["username"],
                    "email": u["email"],
                    "phone": u["phone"],
                    "role": onchain_role,
                    "portal_role": u["role"],
                    "address": addr,
                    "status": u["status"],
                    "is_granted_onchain": is_granted,
                    "contract_details": contract_details,
                }
            )
    finally:
        conn.close()

    return {
        "users": users,
        "participants": participants,
        "supported_roles": ["FARMER_ROLE", "LOGISTICS_ROLE", "RETAILER_ROLE", "ORACLE_ROLE", "DEFAULT_ADMIN_ROLE"],
        "portal_roles": ["farmer", "logistics", "darkstore", "consumer", "admin"],
    }


@router.post("/admin/users", status_code=201)
def add_admin_user(payload: CreateUserRequest):
    """Adds a new system participant to SQLite database and grants on-chain role if applicable."""
    norm_role = payload.role.strip().lower()
    if norm_role not in ROLE_TO_ONCHAIN_MAP:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role '{payload.role}'. Supported roles: {list(ROLE_TO_ONCHAIN_MAP.keys())}",
        )

    onchain_role = ROLE_TO_ONCHAIN_MAP[norm_role]
    address = (payload.address or "").strip()
    if not address or not address.startswith("0x") or len(address) < 40:
        # Generate deterministic mock test address from email if missing
        import hashlib
        addr_hash = hashlib.sha256(payload.email.encode("utf-8")).hexdigest()[:40]
        address = f"0x{addr_hash}"

    username = payload.username or payload.email.split("@")[0].lower()
    import re
    username = re.sub(r"[^a-zA-Z0-9_]", "_", username)

    conn = get_connection()
    try:
        cur = conn.cursor()
        existing_email = cur.execute(
            "SELECT id FROM users WHERE email = ?",
            (payload.email.strip().lower(),),
        ).fetchone()
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=f"A user with email '{payload.email.strip()}' already exists.",
            )

        existing_user = cur.execute(
            "SELECT id FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if existing_user:
            username = f"{username}_{int(time.time()) % 10000}"

        cur.execute(
            """
            INSERT INTO users (username, name, email, phone, role, onchain_role, address, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
            """,
            (
                username,
                payload.name.strip(),
                payload.email.strip().lower(),
                payload.phone,
                norm_role,
                onchain_role,
                address,
            ),
        )
        user_id = cur.lastrowid
        conn.commit()

        # Attempt on-chain role grant
        onchain_tx = None
        if payload.grant_onchain and onchain_role != "CONSUMER":
            try:
                res = chain.grant_role(onchain_role, address)
                onchain_tx = res.get("tx_hash")
            except Exception as e:
                logger.debug("On-chain role grant error during user creation: %s", e)
    finally:
        conn.close()

    return {
        "success": True,
        "message": f"User '{payload.name}' created successfully.",
        "user": {
            "id": user_id,
            "username": username,
            "name": payload.name.strip(),
            "email": payload.email.strip().lower(),
            "phone": payload.phone,
            "role": norm_role,
            "onchain_role": onchain_role,
            "address": address,
            "status": "ACTIVE",
            "is_granted_onchain": onchain_tx is not None or onchain_role == "CONSUMER",
            "onchain_tx": onchain_tx,
        },
    }


@router.put("/admin/users/{user_id}")
def update_admin_user(user_id: int, payload: UpdateUserRequest):
    """Updates an existing system user in the database and updates on-chain roles if changed."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        row = cur.execute(
            "SELECT id, username, name, email, phone, role, onchain_role, address, status FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")

        current_user = dict(row)
        new_name = payload.name.strip() if payload.name else current_user["name"]
        new_email = payload.email.strip().lower() if payload.email else current_user["email"]
        new_phone = payload.phone if payload.phone is not None else current_user["phone"]
        new_status = payload.status.upper() if payload.status else current_user["status"]
        new_address = payload.address.strip() if payload.address else current_user["address"]

        new_role = current_user["role"]
        new_onchain_role = current_user["onchain_role"]

        if payload.role:
            norm_role = payload.role.strip().lower()
            if norm_role in ROLE_TO_ONCHAIN_MAP:
                new_role = norm_role
                new_onchain_role = ROLE_TO_ONCHAIN_MAP[norm_role]
                # Revoke old role if changed
                if current_user["onchain_role"] != new_onchain_role and current_user["onchain_role"] != "CONSUMER":
                    try:
                        chain.revoke_role(current_user["onchain_role"], current_user["address"])
                    except Exception as e:
                        logger.debug("Revoke old role error: %s", e)
                # Grant new role
                if new_onchain_role != "CONSUMER":
                    try:
                        chain.grant_role(new_onchain_role, new_address)
                    except Exception as e:
                        logger.debug("Grant new role error: %s", e)

        cur.execute(
            """
            UPDATE users 
            SET name = ?, email = ?, phone = ?, role = ?, onchain_role = ?, address = ?, status = ?
            WHERE id = ?
            """,
            (new_name, new_email, new_phone, new_role, new_onchain_role, new_address, new_status, user_id),
        )
        conn.commit()
    finally:
        conn.close()

    return {
        "success": True,
        "message": f"User #{user_id} updated successfully.",
        "user": {
            "id": user_id,
            "username": current_user["username"],
            "name": new_name,
            "email": new_email,
            "phone": new_phone,
            "role": new_role,
            "onchain_role": new_onchain_role,
            "address": new_address,
            "status": new_status,
        },
    }


@router.delete("/admin/users/{user_id}")
def delete_admin_user(user_id: int):
    """Deletes a system participant from SQLite and revokes their on-chain role."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        row = cur.execute(
            "SELECT id, username, name, onchain_role, address FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found.")

        u = dict(row)
        if u["onchain_role"] and u["onchain_role"] != "CONSUMER" and u["address"]:
            try:
                chain.revoke_role(u["onchain_role"], u["address"])
            except Exception as e:
                logger.debug("Revoke on delete error: %s", e)

        cur.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()

    return {
        "success": True,
        "message": f"User '{u['name']}' (#{user_id}) removed from system successfully.",
        "deleted_user_id": user_id,
    }


@router.post("/auth/login")
def auth_login(payload: AuthLoginRequest):
    """Authenticates or quick-switches into a participant user account."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        user_row = None

        if payload.username_or_email:
            ident = payload.username_or_email.strip().lower()
            cur.execute(
                "SELECT id, username, name, email, phone, role, onchain_role, address, status FROM users WHERE lower(username) = ? OR lower(email) = ?",
                (ident, ident),
            )
            user_row = cur.fetchone()

        if not user_row and payload.role:
            norm_role = payload.role.strip().lower()
            cur.execute(
                "SELECT id, username, name, email, phone, role, onchain_role, address, status FROM users WHERE lower(role) = ? AND status = 'ACTIVE' ORDER BY id ASC LIMIT 1",
                (norm_role,),
            )
            user_row = cur.fetchone()

        if not user_row:
            norm_role = (payload.role or "consumer").lower()
            fallback_names = {
                "farmer": "Rahul Patil (Farmer)",
                "logistics": "Safexpress Logistics",
                "darkstore": "Pune Fresh DarkStore Hub",
                "consumer": "Priya Sharma",
                "admin": "System Administrator",
            }
            return {
                "success": True,
                "user": {
                    "id": 999,
                    "username": f"guest_{norm_role}",
                    "name": fallback_names.get(norm_role, norm_role.title()),
                    "email": f"{norm_role}@agrichain.io",
                    "role": norm_role,
                    "onchain_role": ROLE_TO_ONCHAIN_MAP.get(norm_role, "CONSUMER"),
                    "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                    "status": "ACTIVE",
                },
                "token": f"agrichain_token_{norm_role}_{int(time.time())}",
            }

        user = dict(user_row)
        if user["status"] != "ACTIVE":
            raise HTTPException(
                status_code=403,
                detail="This account is deactivated. Please contact an administrator.",
            )

        token = f"agrichain_token_{user['username']}_{int(time.time())}"
        return {
            "success": True,
            "message": f"Welcome back, {user['name']}!",
            "user": user,
            "token": token,
        }
    finally:
        conn.close()


@router.post("/auth/logout")
def auth_logout():
    """Terminates active session."""
    return {"success": True, "message": "Logged out successfully."}


@router.get("/auth/users")
def get_auth_users():
    """Lists available login personas and users for quick switching."""
    conn = get_connection()
    try:
        cur = conn.cursor()
        rows = cur.execute(
            "SELECT id, username, name, email, phone, role, onchain_role, address, status FROM users WHERE status = 'ACTIVE' ORDER BY id ASC"
        ).fetchall()
        return {"users": [dict(r) for r in rows]}
    finally:
        conn.close()


@router.post("/admin/roles/grant")
def grant_admin_role(payload: RoleGrantRequest):
    """Executes on-chain grantRole to authorize participant address."""
    try:
        result = chain.grant_role(payload.role, payload.address)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"On-chain grantRole failed: {str(e)}")


@router.post("/admin/roles/revoke")
def revoke_admin_role(payload: RoleGrantRequest):
    """Executes on-chain revokeRole to deauthorize participant address."""
    try:
        result = chain.revoke_role(payload.role, payload.address)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"On-chain revokeRole failed: {str(e)}")


@router.get("/admin/contracts/status")
def get_admin_contracts_status():
    """Returns emergency circuit-breaker paused status across all modular smart contracts."""
    try:
        return chain.get_contracts_pause_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check contract pause status: {str(e)}")


@router.post("/admin/contracts/pause")
def pause_admin_contract(payload: ContractPauseRequest):
    """Executes emergency circuit-breaker pause on a contract (DEFAULT_ADMIN_ROLE)."""
    try:
        return chain.pause_contract(payload.contract)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pause contract: {str(e)}")


@router.post("/admin/contracts/unpause")
def unpause_admin_contract(payload: ContractPauseRequest):
    """Restores operations on a paused contract (DEFAULT_ADMIN_ROLE)."""
    try:
        return chain.unpause_contract(payload.contract)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unpause contract: {str(e)}")


@router.post("/admin/system-reset")
def post_admin_system_reset():
    """Resets all batch inventory, custody events, telemetry readings,
    quarantine logs, reviews, documents, and spoilage records to a clean slate.
    Preserves participant accounts, role delegations, and crop policies.
    """
    try:
        report = reset_system_data(preserve_policies=True)
        return {
            "status": "success",
            "message": "System data cleared successfully. Framework is on a clean fresh slate.",
            "report": report,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"System reset failed: {str(e)}")


@router.post("/admin/seed-demo-data")
def post_admin_seed_demo_data(reset_first: bool = True):
    """Feeds the optimal multi-role demonstration dataset across blockchain & database."""
    try:
        from seeder import seed_optimal_demo_dataset
        report = seed_optimal_demo_dataset(reset_first=reset_first)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed demonstration dataset: {str(e)}")


