import pathlib
import sqlite3
from typing import Tuple, Optional

DB_PATH = pathlib.Path(__file__).resolve().parent / "agrichain.db"


def get_connection(path: pathlib.Path | str | None = None) -> sqlite3.Connection:
    """Return a sqlite3.Connection to agrichain.db."""
    db_path = pathlib.Path(path) if path else DB_PATH
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def _policy_for_crop(conn: sqlite3.Connection, crop_name: str):
    cur = conn.execute(
        "SELECT min_temp_c, max_temp_c, min_humidity, max_humidity FROM policy WHERE LOWER(crop_name) = LOWER(?)",
        (crop_name,),
    )
    row = cur.fetchone()
    if not row:
        raise ValueError(f"No policy defined for crop '{crop_name}'")
    return row["min_temp_c"], row["max_temp_c"], row["min_humidity"], row["max_humidity"]


def validate_reading(
    crop_name: str,
    temp_c: float,
    humidity_pct: float,
    db_path: pathlib.Path | str | None = None,
) -> Tuple[str, Optional[str]]:
    """Rule-based validation of a single telemetry reading against crop policy.

    Returns:
        (verdict, reason) where verdict is 'VALID' or 'ANOMALOUS'.
        If VALID, reason is None. If ANOMALOUS, reason names the numbers.
    """
    conn = get_connection(db_path)
    try:
        try:
            min_temp, max_temp, min_hum, max_hum = _policy_for_crop(conn, crop_name)
        except ValueError as e:
            return ("ANOMALOUS", str(e))
    finally:
        conn.close()

    temp_c = float(temp_c)
    humidity_pct = float(humidity_pct)

    if temp_c > max_temp:
        return ("ANOMALOUS", f"temperature {temp_c:.1f}°C above policy max {max_temp:.1f}°C")
    if temp_c < min_temp:
        return ("ANOMALOUS", f"temperature {temp_c:.1f}°C below policy min {min_temp:.1f}°C")
    if humidity_pct > max_hum:
        return ("ANOMALOUS", f"humidity {humidity_pct:.1f}% above policy max {max_hum:.1f}%")
    if humidity_pct < min_hum:
        return ("ANOMALOUS", f"humidity {humidity_pct:.1f}% below policy min {min_hum:.1f}%")

    return ("VALID", None)
