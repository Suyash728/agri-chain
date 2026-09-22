import sqlite3
import pathlib

DB_PATH = pathlib.Path(__file__).resolve().parent / "agrichain.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS batches (
    batch_id      TEXT PRIMARY KEY,
    crop_name     TEXT NOT NULL,
    origin_farm   TEXT NOT NULL,
    harvest_date  TEXT NOT NULL,
    farmer_name   TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custody_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id      TEXT NOT NULL REFERENCES batches(batch_id),
    from_holder   TEXT,
    to_holder     TEXT NOT NULL,
    state         TEXT NOT NULL,
    price_paise   INTEGER NOT NULL,
    tx_hash       TEXT,
    occurred_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS readings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id      TEXT NOT NULL REFERENCES batches(batch_id),
    temp_c        REAL NOT NULL,
    humidity_pct  REAL NOT NULL,
    verdict       TEXT NOT NULL,
    tx_hash       TEXT,
    received_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quarantine (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id    INTEGER NOT NULL REFERENCES readings(id),
    reason        TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS policy (
    crop_name     TEXT PRIMARY KEY,
    min_temp_c    REAL NOT NULL,
    max_temp_c    REAL NOT NULL,
    min_humidity  REAL NOT NULL,
    max_humidity  REAL NOT NULL
);
"""

DEFAULT_POLICIES = [
    ("tomato", 2.0, 8.0, 85.0, 95.0),
    ("mango", 10.0, 15.0, 85.0, 90.0),
    ("wheat", 15.0, 25.0, 50.0, 70.0),
    ("Tomato", 2.0, 8.0, 85.0, 95.0),
    ("Mango", 10.0, 15.0, 85.0, 90.0),
    ("Wheat", 15.0, 25.0, 50.0, 70.0),
]


def init_db(db_path: str | pathlib.Path = DB_PATH) -> pathlib.Path:
    """Create the SQLite database, all five tables, and seed default policies."""
    path = pathlib.Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(SCHEMA)
        for crop_name, min_temp, max_temp, min_hum, max_hum in DEFAULT_POLICIES:
            conn.execute(
                """
                INSERT OR IGNORE INTO policy (crop_name, min_temp_c, max_temp_c, min_humidity, max_humidity)
                VALUES (?, ?, ?, ?, ?)
                """,
                (crop_name, min_temp, max_temp, min_hum, max_hum),
            )
        conn.commit()
    return path


def get_connection(db_path: str | pathlib.Path = DB_PATH) -> sqlite3.Connection:
    """Return a sqlite3.Connection with Row factory enabled."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn
