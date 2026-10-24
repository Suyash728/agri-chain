"""
app/services/policy.py
----------------------
Dynamic Crop Policy loader for AI Trust Layer.
Connects to SQLite database to load crop-specific environmental limits from
the `batches` and `policy` tables in backend/agrichain.db.
"""

from typing import Optional

from app.schemas.policy import CropPolicy
from app.services.db import get_connection

DEFAULT_CONSERVATIVE_TOMATO_POLICY = CropPolicy(
    crop_type="Tomato (Default Conservative)",
    min_temp_c=2.0,
    max_temp_c=8.0,
    min_humidity=85.0,
    max_humidity=95.0,
)

CROP_FALLBACKS = {
    "tomato": (2.0, 8.0, 85.0, 95.0),
    "potato": (4.0, 12.0, 85.0, 95.0),
    "onion": (0.0, 5.0, 65.0, 75.0),
    "apple": (-1.0, 4.0, 90.0, 95.0),
    "mango": (10.0, 15.0, 85.0, 90.0),
    "wheat": (15.0, 25.0, 50.0, 70.0),
    "rice": (15.0, 25.0, 50.0, 70.0),
}


def get_crop_policy(
    batch_id: Optional[str] = None, 
    crop_name: Optional[str] = None, 
    db_path: Optional[str] = None
) -> CropPolicy:
    """
    Look up the crop policy for a given batch or crop from the SQLite database.
    Queries `batches` to find `crop_name` if not provided, then queries `policy` for limits.
    Falls back to substring matching or standard agricultural preservation limits.
    """
    resolved_crop = crop_name

    try:
        with get_connection(db_path) as conn:
            table_check = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='batches'"
            ).fetchone()

            if table_check and batch_id:
                batch_row = conn.execute(
                    "SELECT crop_name FROM batches WHERE batch_id = ?",
                    (batch_id,),
                ).fetchone()
                if batch_row and batch_row["crop_name"]:
                    resolved_crop = batch_row["crop_name"]

            if not resolved_crop:
                resolved_crop = crop_name

            if not resolved_crop:
                return DEFAULT_CONSERVATIVE_TOMATO_POLICY

            clean_crop = resolved_crop.strip().lower()

            # 1. Exact match in policy table
            policy_row = conn.execute(
                "SELECT min_temp_c, max_temp_c, min_humidity, max_humidity FROM policy WHERE lower(crop_name) = lower(?)",
                (clean_crop,),
            ).fetchone()

            # 2. Substring search if exact match not found
            if not policy_row:
                policy_rows = conn.execute(
                    "SELECT crop_name, min_temp_c, max_temp_c, min_humidity, max_humidity FROM policy"
                ).fetchall()
                for pr in policy_rows:
                    p_name = pr["crop_name"].lower()
                    if p_name in clean_crop or clean_crop in p_name:
                        policy_row = pr
                        break

            if policy_row:
                return CropPolicy(
                    crop_type=resolved_crop,
                    min_temp_c=float(policy_row["min_temp_c"]),
                    max_temp_c=float(policy_row["max_temp_c"]),
                    min_humidity=float(policy_row["min_humidity"]),
                    max_humidity=float(policy_row["max_humidity"]),
                )

            # 3. Known agricultural presets fallback
            for k, (t_min, t_max, h_min, h_max) in CROP_FALLBACKS.items():
                if k in clean_crop:
                    return CropPolicy(
                        crop_type=resolved_crop,
                        min_temp_c=t_min,
                        max_temp_c=t_max,
                        min_humidity=h_min,
                        max_humidity=h_max,
                    )

            return DEFAULT_CONSERVATIVE_TOMATO_POLICY
    except Exception:
        return DEFAULT_CONSERVATIVE_TOMATO_POLICY
