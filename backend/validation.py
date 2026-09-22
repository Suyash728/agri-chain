import os
import sqlite3
from pathlib import Path

# Path to SQLite DB.  The default location mirrors db.py’s default.
_DB_PATH = Path.cwd() / "data" / "db.sqlite"

# Helper: open a connection

def get_connection(path: Path | str | None = None) -> sqlite3.Connection:
    """Return a sqlite3.Connection to the agri‑chain database.

    The function accepts a Path, str, or None.  When *None* it falls back to
    ``data/db.sqlite`` relative to the current working directory.
    """
    db_path = Path(path) if path else _DB_PATH
    return sqlite3.connect(db_path)

# Policy lookup used by the rule‑based AI trust layer

def _policy_for_crop(conn: sqlite3.Connection, crop_name: str):
    cur = conn.execute(
        "SELECT min_temp_c, max_temp_c, min_humidity, max_humidity FROM policy WHERE crop_name = ?", (crop_name,)
    )
    row = cur.fetchone()
    if not row:
        raise ValueError(f"No policy defined for crop '{crop_name}'")
    return row  # (min_temp_c, max_temp_c, min_humidity, max_humidity)


def validate_reading(crop_name: str, temp_c: float, humidity_pct: float):
    """Rule‑based validation of a single telemetry reading.

    Returns a tuple ``(verdict, reason)`` where *verdict* is ``"VALID"`` or
    ``"ANOMALOUS"``.  For a valid reading *reason* is ``None``.
    """
    conn = get_connection()
    try:
        min_temp, max_temp, min_humidity, max_humidity = _policy_for_crop(conn, crop_name)
    finally:
        conn.close()

    if not (min_temp <= temp_c <= max_temp):
        return ("ANOMALOUS", f"temperature {temp_c}°C outside policy [{min_temp}, {max_temp}]°C")
    if not (min_humidity <= humidity_pct <= max_humidity):
        return ("ANOMALOUS", f"humidity {humidity_pct}% outside policy [{min_humidity}, {max_humidity}]%")
    return ("VALID", None)

# End of validation.py
