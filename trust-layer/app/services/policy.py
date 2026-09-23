"""
app/services/policy.py
----------------------
Dynamic Crop Policy loader for AI Trust Layer.
Connects to SQLite database to load crop-specific environmental limits from
the `batches` and `policy` tables in backend/agrichain.db.
"""

import sqlite3
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


def get_crop_policy(batch_id: Optional[str] = None, db_path: Optional[str] = None) -> CropPolicy:
    """
    Look up the crop policy for a given batch from the SQLite database.
    Queries `batches` to find `crop_name`, then queries `policy` for that crop's limits.
    Falls back to default conservative tomato policy (2.0°C - 8.0°C, 85% - 95%) if batch or policy not found.
    """
    if not batch_id:
        return DEFAULT_CONSERVATIVE_TOMATO_POLICY

    try:
        with get_connection(db_path) as conn:
            # Check if batches table exists
            table_check = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='batches'"
            ).fetchone()
            if not table_check:
                return DEFAULT_CONSERVATIVE_TOMATO_POLICY

            batch_row = conn.execute(
                "SELECT crop_name FROM batches WHERE batch_id = ?",
                (batch_id,),
            ).fetchone()

            crop_name = batch_row["crop_name"] if batch_row else None
            if not crop_name:
                return DEFAULT_CONSERVATIVE_TOMATO_POLICY

            policy_row = conn.execute(
                "SELECT min_temp_c, max_temp_c, min_humidity, max_humidity FROM policy WHERE lower(crop_name) = lower(?)",
                (crop_name,),
            ).fetchone()

            if policy_row:
                return CropPolicy(
                    crop_type=crop_name,
                    min_temp_c=float(policy_row["min_temp_c"]),
                    max_temp_c=float(policy_row["max_temp_c"]),
                    min_humidity=float(policy_row["min_humidity"]),
                    max_humidity=float(policy_row["max_humidity"]),
                )
            return DEFAULT_CONSERVATIVE_TOMATO_POLICY
    except Exception:
        return DEFAULT_CONSERVATIVE_TOMATO_POLICY
