import os
import sqlite3
import pathlib
from typing import Optional, Any
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = pathlib.Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=ROOT_DIR / ".env")

DB_PATH = pathlib.Path(__file__).resolve().parent / "agrichain.db"
MIGRATION_PATH = pathlib.Path(__file__).resolve().parent / "migrations" / "001_initial_schema.sql"

# SQLite unified schema mirroring PostgreSQL 001_initial_schema.sql
SQLITE_SCHEMA = """
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

CREATE TABLE IF NOT EXISTS telemetry_history (
    device_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (device_id, batch_id)
);

CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    temperature REAL NOT NULL,
    humidity REAL NOT NULL,
    event_hash TEXT NOT NULL,
    verdict TEXT NOT NULL,
    disposition TEXT NOT NULL,
    reason_codes TEXT NOT NULL,
    anomaly_score REAL,
    processed_at TEXT NOT NULL,
    details TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS replay_events (
    device_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    event_hash TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (device_id, batch_id, event_hash)
);

CREATE TABLE IF NOT EXISTS replay_latest_timestamps (
    device_id TEXT NOT NULL,
    batch_id TEXT NOT NULL,
    latest_timestamp TEXT NOT NULL,
    PRIMARY KEY (device_id, batch_id)
);

CREATE TABLE IF NOT EXISTS batch_documents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id      TEXT NOT NULL REFERENCES batches(batch_id),
    doc_type      TEXT NOT NULL,
    ipfs_cid      TEXT NOT NULL,
    file_name     TEXT NOT NULL,
    uploaded_at   TEXT NOT NULL DEFAULT (datetime('now')),
    tx_hash       TEXT
);

CREATE TABLE IF NOT EXISTS batch_reviews (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id         TEXT NOT NULL REFERENCES batches(batch_id),
    rating           INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment          TEXT,
    freshness_score  INTEGER,
    reviewer_address TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
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


def is_postgres() -> bool:
    """Return True if DATABASE_URL is set and points to PostgreSQL."""
    db_url = os.getenv("DATABASE_URL", "").strip()
    return db_url.startswith("postgresql://") or db_url.startswith("postgres://")


class PostgresCursorWrapper:
    """Adapts psycopg cursor to provide familiar SQLite-like API (? placeholders and lastrowid)."""

    def __init__(self, raw_cursor):
        self._cur = raw_cursor
        self.lastrowid: Optional[int] = None

    def execute(self, query: str, params: Any = None):
        # Convert ? placeholders to %s for PostgreSQL
        clean_query = query.replace("?", "%s")
        clean_query = clean_query.replace("datetime('now')", "CURRENT_TIMESTAMP")

        # Automatically append RETURNING id for inserts on tables with auto-increment IDs
        trimmed = clean_query.strip()
        if trimmed.upper().startswith("INSERT INTO") and "RETURNING" not in trimmed.upper():
            lower_q = trimmed.lower()
            if any(t in lower_q for t in ["readings", "custody_events", "quarantine", "batch_documents", "batch_reviews"]):
                q_with_ret = trimmed.rstrip("; ") + " RETURNING id"
                try:
                    self._cur.execute(q_with_ret, params)
                    res = self._cur.fetchone()
                    if res:
                        if isinstance(res, dict):
                            self.lastrowid = res.get("id")
                        elif isinstance(res, (list, tuple)):
                            self.lastrowid = res[0]
                    return self
                except Exception:
                    pass

        self._cur.execute(clean_query, params)
        return self

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def __iter__(self):
        return iter(self._cur)


class PostgresConnectionWrapper:
    """Unified PostgreSQL connection wrapper supporting execute(), context manager, and commit()."""

    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        from psycopg.rows import dict_row
        return PostgresCursorWrapper(self._conn.cursor(row_factory=dict_row))

    def execute(self, query: str, params: Any = None):
        cur = self.cursor()
        cur.execute(query, params)
        return cur

    def executescript(self, sql_script: str):
        with self._conn.cursor() as cur:
            cur.execute(sql_script)
        self._conn.commit()

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()
        self.close()


def get_connection(db_path: str | pathlib.Path = DB_PATH):
    """Return a unified connection: PostgreSQL if DATABASE_URL is set, else local SQLite with Row factory."""
    if is_postgres():
        import psycopg
        from psycopg.rows import dict_row
        db_url = os.getenv("DATABASE_URL")
        raw_conn = psycopg.connect(db_url, row_factory=dict_row)
        return PostgresConnectionWrapper(raw_conn)
    else:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn


def init_db(db_path: str | pathlib.Path = DB_PATH) -> pathlib.Path | str:
    """Initialize database tables and seed default crop policies.

    Uses PostgreSQL migrations if DATABASE_URL is configured, else local SQLite.
    """
    if is_postgres():
        db_url = os.getenv("DATABASE_URL")
        with get_connection() as conn:
            # Read and execute PostgreSQL DDL
            if MIGRATION_PATH.exists():
                with open(MIGRATION_PATH, "r", encoding="utf-8") as f:
                    migration_sql = f.read()
                conn.executescript(migration_sql)
            # Seed default policies
            for crop_name, min_temp, max_temp, min_hum, max_hum in DEFAULT_POLICIES:
                conn.execute(
                    """
                    INSERT INTO policy (crop_name, min_temp_c, max_temp_c, min_humidity, max_humidity)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (crop_name) DO NOTHING
                    """,
                    (crop_name, min_temp, max_temp, min_hum, max_hum),
                )
            conn.commit()
        return db_url
    else:
        path = pathlib.Path(db_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(path) as conn:
            conn.executescript(SQLITE_SCHEMA)
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
