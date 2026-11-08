import socket
import hashlib
import json
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple, Dict, Any
from db import get_connection

PARTICIPANT_ADDRESSES = {
    "farmer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "logistics": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "safexpress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "dark_store": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "retailer": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "consumer": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
}


def format_local_timestamp(dt_val, fmt="%Y-%m-%d %H:%M") -> str:
    """Converts a database datetime or ISO string from UTC to local system time (IST, UTC+5:30)."""
    if not dt_val:
        return ""
    if isinstance(dt_val, str):
        try:
            clean_str = dt_val.replace("Z", "+00:00")
            dt_val = datetime.fromisoformat(clean_str)
        except Exception:
            return dt_val[:16]
    if isinstance(dt_val, datetime):
        if dt_val.tzinfo is None:
            dt_val = dt_val.replace(tzinfo=timezone.utc)
        local_dt = dt_val.astimezone()
        return local_dt.strftime(fmt)
    return str(dt_val)[:16]


def get_local_lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"


SENSOR_CORRUPTION_CODES = {
    # Cryptographic & Replay tampering
    "REPLAY_DETECTED",
    "REPLAY_ATTACK_DETECTED",
    "SIGNATURE_INVALID",
    "UNAUTHENTICATED_DEVICE",
    "HASH_MISMATCH",
    "PAYLOAD_HASH_MISMATCH",
    # Temporal & Chronology corruption
    "TIMESTAMP_OUT_OF_ORDER",
    "TIMESTAMP_OUT_OF_SEQUENCE",
    "DUPLICATE_TIMESTAMP",
    "TELEMETRY_GAP_EXCEEDED",
    # Impossible physical jumps (spoofing / hardware sensor failure)
    "GPS_SPEED_EXCEEDED",
    "TEMPERATURE_RATE_EXCEEDED",
    "HUMIDITY_RATE_EXCEEDED",
    # ML statistical anomaly (multivariate sensor malfunction)
    "ML_ANOMALY",
    "ISOLATION_FOREST_OUTLIER",
    # Out-of-bounds sensor limits (sensor hardware failure)
    "TEMPERATURE_OUT_OF_RANGE",
    "HUMIDITY_OUT_OF_RANGE",
    "LATITUDE_OUT_OF_RANGE",
    "LONGITUDE_OUT_OF_RANGE",
    "BATCH_ID_OUT_OF_RANGE",
    "DEVICE_ID_OUT_OF_RANGE",
    "TIMESTAMP_OUT_OF_RANGE",
    "BLOCKCHAIN_RECORDING_FAILED",
}


COLD_CHAIN_POLICY_BREACH_CODES = {
    "TEMPERATURE_OUT_OF_POLICY",
    "HUMIDITY_OUT_OF_POLICY",
    "CRATE_TAMPER_DETECTED",
    "TRANSIT_MECHANICAL_SHOCK_DETECTED",
    "ORGANIC_SPOILAGE_GAS_SURGE",
}


def insert_quarantine_entry(conn, reading_id: int, reason: str) -> tuple[str, str]:
    """
    Inserts an immutable, hash-chained quarantine log entry.
    Inspired by IsoLog tamper-evident audit logs:
    entry_hash = SHA256(prev_hash:reading_id:reason:created_at)
    """
    latest = conn.execute(
        "SELECT entry_hash FROM quarantine WHERE entry_hash IS NOT NULL ORDER BY id DESC LIMIT 1"
    ).fetchone()
    prev_hash = latest["entry_hash"] if (latest and latest["entry_hash"]) else ("0" * 64)

    ts_str = datetime.now(timezone.utc).isoformat()
    payload = f"{prev_hash}:{reading_id}:{reason}:{ts_str}"
    entry_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

    conn.execute(
        """
        INSERT INTO quarantine (reading_id, reason, prev_hash, entry_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (reading_id, reason, prev_hash, entry_hash, ts_str),
    )
    return prev_hash, entry_hash


REASON_CODE_LABELS = {
    "TEMP_OUT_OF_RANGE": "Temperature out of biological safe bounds",
    "HUMIDITY_OUT_OF_RANGE": "Humidity exceeding safe tolerance",
    "TEMP_SPIKE": "Sudden Temperature Spike / Cold-Chain Breach",
    "PHYSICAL_RATE_OF_CHANGE": "Physical rate of change violation (thermal shock)",
    "GPS_JUMP": "Infeasible GPS teleportation / velocity outlier",
    "REPLAY_DETECTED": "Cryptographic replay attack detected (duplicate timestamp/hash)",
    "REPLAY_ATTACK_DETECTED": "Cryptographic replay attack detected (duplicate timestamp/hash)",
    "DUPLICATE_TIMESTAMP": "Stale or repeated sensor timestamp sequence",
    "ISOLATION_FOREST_OUTLIER": "Unsupervised Isolation Forest anomaly pattern",
    "HASH_MISMATCH": "Cryptographic payload tamper / hash mismatch",
    "TEMPERATURE_OUT_OF_POLICY": "Physical cold-chain policy violation: temperature exceeded crop threshold",
    "HUMIDITY_OUT_OF_POLICY": "Physical cold-chain policy violation: humidity exceeded crop threshold",
    "TEMPERATURE_RATE_EXCEEDED": "Physical rate of change violation (sensor thermal spike)",
    "HUMIDITY_RATE_EXCEEDED": "Physical rate of change violation (sensor humidity spike)",
    "GPS_SPEED_EXCEEDED": "Infeasible GPS velocity / teleportation outlier",
}


def _parse_batch_meta(b):
    origin = b["origin_farm"] if "origin_farm" in b.keys() else ""
    cat = ""
    qty = 0.5
    price = 2500.0
    if "||cat=" in origin:
        parts = origin.split("||")
        for part in parts:
            if part.startswith("cat="):
                cat = part.replace("cat=", "").strip()
            elif part.startswith("qty="):
                try:
                    qty = float(part.replace("qty=", "").strip())
                except:
                    pass
            elif part.startswith("price="):
                try:
                    price = float(part.replace("price=", "").strip())
                except:
                    pass
    return cat, qty, price


def _resolve_category_id(crop_name: str, given_cat: str = ""):
    if given_cat:
        g = given_cat.lower().strip()
        if "fruit" in g and "dry" not in g:
            return "fruits"
        if "veg" in g:
            return "vegetables"
        if "grain" in g:
            return "grains"
        if "pulse" in g or "legume" in g:
            return "pulses"
        if "spice" in g:
            return "spices"
        if "dry" in g or "nut" in g:
            return "dryfruits"

    cn = crop_name.lower().strip()
    if any(k in cn for k in ["mango", "banana", "apple", "fruit", "orange", "grape", "papaya", "guava", "pomegranate", "berry", "melon"]):
        return "fruits"
    if any(k in cn for k in ["tomato", "potato", "onion", "veg", "cabbage", "carrot", "spinach", "cauliflower", "brinjal", "cucumber"]):
        return "vegetables"
    if any(k in cn for k in ["wheat", "rice", "grain", "corn", "barley", "millet", "oats", "sharbati", "basmati"]):
        return "grains"
    if any(k in cn for k in ["chickpea", "gram", "pulse", "dal", "lentil", "bean", "soy", "moong", "tur", "urad"]):
        return "pulses"
    if any(k in cn for k in ["chilli", "turmeric", "spice", "pepper", "ginger", "garlic", "clove", "cardamom", "coriander", "cumin"]):
        return "spices"
    if any(k in cn for k in ["cashew", "almond", "walnut", "nut", "dryfruit", "raisin", "pistachio"]):
        return "dryfruits"
    return "fruits" if "mango" in cn else "vegetables"


def _resolve_crop_icon(crop_name: str, given_cat: str = "") -> str:
    cn = (crop_name or "").lower().strip()

    if "tomato" in cn:
        return "/images/tomato_only.png"
    if "potato" in cn:
        return "/images/potato_only.png"
    if "mango" in cn:
        return "/images/mango_only.png"
    if "banana" in cn:
        return "/images/banana_only.png"
    if "apple" in cn:
        return "/images/apple.png"
    if "turmeric" in cn:
        return "/images/turmeric_only.png"
    if "chilli" in cn or "chili" in cn:
        return "/images/chilli_only.png"
    if "wheat" in cn or "sharbati" in cn:
        return "/images/wheat_only.png"
    if "rice" in cn or "basmati" in cn:
        return "/images/rice_only.png"
    if "chickpea" in cn:
        return "/images/chickpea_only.png"
    if "moong" in cn or "green gram" in cn or "greengram" in cn:
        return "/images/greengram_only.png"
    if "toor" in cn or "tur" in cn:
        return "/images/toor_dal.png"
    if "cashew" in cn:
        return "/images/cashew_only.png"
    if "almond" in cn:
        return "/images/almond_only.png"
    if any(k in cn for k in ["orange", "strawberr", "berry", "grape", "fruit"]):
        return "/images/fruits_ref.png"
    if any(k in cn for k in ["onion", "spinach", "capsicum", "carrot", "veg"]):
        return "/images/vegetables_ref.png"

    # Category fallback
    cat_id = _resolve_category_id(crop_name, given_cat)
    if cat_id == "fruits":
        return "/images/fruits_ref.png"
    if cat_id == "vegetables":
        return "/images/vegetables_ref.png"
    if cat_id == "grains":
        return "/images/grains_ref.png"
    if cat_id == "pulses":
        return "/images/pulses_ref.png"
    if cat_id == "spices":
        return "/images/spices_ref.png"
    if cat_id == "dryfruits":
        return "/images/dryfruits_ref.png"

    return "/images/vegetables_ref.png"


ROLE_TO_ONCHAIN_MAP = {
    "farmer": "FARMER_ROLE",
    "logistics": "LOGISTICS_ROLE",
    "darkstore": "RETAILER_ROLE",
    "retailer": "RETAILER_ROLE",
    "admin": "DEFAULT_ADMIN_ROLE",
    "consumer": "CONSUMER",
}


