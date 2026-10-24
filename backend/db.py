import os
import time
import sqlite3
import logging
import pathlib
from typing import Optional, Any
from dotenv import load_dotenv

logger = logging.getLogger("agrichain.db")

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
    prev_hash     TEXT,
    entry_hash    TEXT,
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

CREATE TABLE IF NOT EXISTS spoilage_incidents (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id         TEXT UNIQUE NOT NULL,
    batch_id            TEXT NOT NULL REFERENCES batches(batch_id),
    crop_name           TEXT NOT NULL,
    stage               TEXT NOT NULL,
    failure_type        TEXT NOT NULL,
    severity            TEXT NOT NULL,
    loss_goods_kg       REAL NOT NULL,
    price_per_kg_paise  INTEGER NOT NULL,
    total_loss_paise    INTEGER NOT NULL,
    total_loss_inr      REAL NOT NULL,
    custodian_at_fault  TEXT NOT NULL,
    details             TEXT NOT NULL,
    status              TEXT NOT NULL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    phone         TEXT,
    role          TEXT NOT NULL,
    onchain_role  TEXT,
    address       TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

DEFAULT_USERS = [
    (
        "admin",
        "System Administrator",
        "admin@agrichain.io",
        "+91 98200 11000",
        "admin",
        "DEFAULT_ADMIN_ROLE",
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "ACTIVE",
    ),
    (
        "rahul_farmer",
        "Rahul Patil (Farmer)",
        "rahul@greenfarms.in",
        "+91 94231 45678",
        "farmer",
        "FARMER_ROLE",
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "ACTIVE",
    ),
    (
        "safexpress_logistics",
        "Safexpress Cold Chain (Logistics)",
        "dispatch@safexpress.com",
        "+91 98220 98765",
        "logistics",
        "LOGISTICS_ROLE",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "ACTIVE",
    ),
    (
        "pune_darkstore",
        "Pune Fresh DarkStore Hub",
        "anand@punefresh.in",
        "+91 99210 33445",
        "darkstore",
        "RETAILER_ROLE",
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "ACTIVE",
    ),
    (
        "priya_consumer",
        "Priya Sharma",
        "priya.sharma@gmail.com",
        "+91 98190 55667",
        "consumer",
        "CONSUMER",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "ACTIVE",
    ),
]

DEFAULT_POLICIES = [
    ("tomato", 2.0, 8.0, 85.0, 95.0),
    ("mango", 10.0, 15.0, 85.0, 90.0),
    ("wheat", 15.0, 25.0, 50.0, 70.0),
    ("Tomato", 2.0, 8.0, 85.0, 95.0),
    ("Mango", 10.0, 15.0, 85.0, 90.0),
    ("Wheat", 15.0, 25.0, 50.0, 70.0),
]

DEFAULT_SPOILAGE_INCIDENTS = [
    (
        "INC-SPOIL-2026-001",
        "TM1256",
        "Tomato",
        "IN_TRANSIT",
        "REEFER_COOLING_FAILURE",
        "CRITICAL",
        180.0,
        8000,
        1440000,
        14400.0,
        "Safexpress Cold Chain Logistics",
        "Reefer compressor failure during transit on NH-60. Temperature rose to 16.5°C (policy max 8.0°C). 180 kg degraded.",
        "CLAIM_PENDING",
    ),
    (
        "INC-SPOIL-2026-002",
        "BATCH-PO-2026-001",
        "Spinach",
        "IN_STORAGE",
        "HUMIDITY_SPIKE_SPOILAGE",
        "HIGH",
        45.0,
        5000,
        225000,
        2250.0,
        "Nashik Central Dark Store (DS-402)",
        "Condensation breach in storage Bay B. Excessive humidity (99%) caused leaf spoilage. 45 kg condemned and written off.",
        "DISCARDED_WRITTEN_OFF",
    ),
]


_POSTGRES_AVAILABLE: Optional[bool] = None
_POSTGRES_LAST_FAIL_TIME: float = 0.0
_POSTGRES_FAIL_COOLDOWN: float = 15.0  # retry connecting after 15 seconds cooldown


def is_postgres() -> bool:
    """Return True if DATABASE_URL is set and points to PostgreSQL."""
    global _POSTGRES_AVAILABLE, _POSTGRES_LAST_FAIL_TIME
    if _POSTGRES_AVAILABLE is False:
        if time.time() - _POSTGRES_LAST_FAIL_TIME < _POSTGRES_FAIL_COOLDOWN:
            return False
        _POSTGRES_AVAILABLE = None  # Cooldown expired: allow retry
    if "DATABASE_URL" not in os.environ:
        return False
    db_target = os.environ["DATABASE_URL"].strip()
    return db_target.startswith("postgresql://") or db_target.startswith("postgres://")


class PostgresCursorWrapper:
    """Adapts psycopg cursor to provide familiar SQLite-like API (? placeholders and lastrowid)."""

    def __init__(self, raw_cursor):
        self._cur = raw_cursor
        self.lastrowid: Optional[int] = None

    def execute(self, query: str, params: Any = None):
        # Convert ? placeholders to %s for PostgreSQL and escape literal % signs
        if "?" in query:
            clean_query = query.replace("%", "%%").replace("?", "%s")
        else:
            clean_query = query
        clean_query = clean_query.replace("datetime('now')", "CURRENT_TIMESTAMP")
        clean_query = clean_query.replace("ORDER BY rowid DESC", "ORDER BY created_at DESC")
        clean_query = clean_query.replace("ORDER BY rowid ASC", "ORDER BY created_at ASC")
        clean_query = clean_query.replace("ORDER BY rowid", "ORDER BY created_at")

        # Automatically append RETURNING id for inserts on tables with auto-increment IDs
        trimmed = clean_query.strip()
        if trimmed.upper().startswith("INSERT INTO") and "RETURNING" not in trimmed.upper():
            lower_q = trimmed.lower()
            if any(t in lower_q for t in ["readings", "custody_events", "quarantine", "batch_documents", "batch_reviews", "spoilage_incidents", "users"]):
                clean_query = trimmed.rstrip("; ") + " RETURNING id"
                self._cur.execute(clean_query, params)
                res = self._cur.fetchone()
                if res:
                    if isinstance(res, dict):
                        self.lastrowid = res.get("id")
                    elif isinstance(res, (list, tuple)):
                        self.lastrowid = res[0]
                return self

        self._cur.execute(clean_query, params)
        return self

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def close(self):
        if hasattr(self._cur, "close"):
            self._cur.close()

    def __iter__(self):
        return iter(self._cur)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


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
        try:
            if not self._conn.closed:
                import psycopg.pq
                status = self._conn.info.transaction_status
                if status == psycopg.pq.TransactionStatus.INTRANS:
                    self._conn.commit()
                elif status == psycopg.pq.TransactionStatus.INERROR:
                    self._conn.rollback()
        except Exception:
            pass
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
    global _POSTGRES_AVAILABLE, _POSTGRES_LAST_FAIL_TIME
    if is_postgres():
        try:
            import psycopg
            from psycopg.rows import dict_row
            db_url = os.environ["DATABASE_URL"]
            raw_conn = psycopg.connect(db_url, row_factory=dict_row, connect_timeout=5)
            _POSTGRES_AVAILABLE = True
            return PostgresConnectionWrapper(raw_conn)
        except Exception as e:
            _POSTGRES_AVAILABLE = False
            _POSTGRES_LAST_FAIL_TIME = time.time()
            print(f"[db] Warning: Failed to connect to PostgreSQL ({e}). Falling back to local SQLite.")

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str | pathlib.Path = DB_PATH) -> pathlib.Path | str:
    """Initialize database tables and seed default crop policies.

    Uses PostgreSQL migrations if DATABASE_URL is configured, else local SQLite.
    """
    if is_postgres():
        db_url = os.environ["DATABASE_URL"]
        try:
            conn = get_connection()
            if isinstance(conn, PostgresConnectionWrapper):
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
                conn.close()
                return db_url
            else:
                conn.close()
        except Exception as e:
            print(f"[db] Warning: Failed to initialize PostgreSQL ({e}). Falling back to local SQLite.")

    path = pathlib.Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(SQLITE_SCHEMA)

        # Migration: Ensure quarantine table has hash-chain columns (prev_hash, entry_hash)
        cursor = conn.execute("PRAGMA table_info(quarantine)")
        cols = [r[1] for r in cursor.fetchall()]
        if "prev_hash" not in cols:
            conn.execute("ALTER TABLE quarantine ADD COLUMN prev_hash TEXT")
        if "entry_hash" not in cols:
            conn.execute("ALTER TABLE quarantine ADD COLUMN entry_hash TEXT")

        # Backfill any legacy unhashed quarantine rows into an unbroken SHA-256 chain
        unhashed = conn.execute("SELECT id, reading_id, reason, created_at FROM quarantine WHERE entry_hash IS NULL ORDER BY id ASC").fetchall()
        if unhashed:
            import hashlib
            last_entry = conn.execute("SELECT entry_hash FROM quarantine WHERE entry_hash IS NOT NULL ORDER BY id DESC LIMIT 1").fetchone()
            curr_prev = last_entry[0] if last_entry and last_entry[0] else ("0" * 64)
            for r_id, rd_id, r_reason, r_created in unhashed:
                p_load = f"{curr_prev}:{rd_id}:{r_reason}:{r_created}"
                e_hash = hashlib.sha256(p_load.encode("utf-8")).hexdigest()
                conn.execute("UPDATE quarantine SET prev_hash = ?, entry_hash = ? WHERE id = ?", (curr_prev, e_hash, r_id))
                curr_prev = e_hash

        for crop_name, min_temp, max_temp, min_hum, max_hum in DEFAULT_POLICIES:
            conn.execute(
                """
                INSERT OR IGNORE INTO policy (crop_name, min_temp_c, max_temp_c, min_humidity, max_humidity)
                VALUES (?, ?, ?, ?, ?)
                """,
                (crop_name, min_temp, max_temp, min_hum, max_hum),
            )
        for inc in DEFAULT_SPOILAGE_INCIDENTS:
            conn.execute(
                """
                INSERT OR IGNORE INTO spoilage_incidents (
                    incident_id, batch_id, crop_name, stage, failure_type,
                    severity, loss_goods_kg, price_per_kg_paise, total_loss_paise,
                    total_loss_inr, custodian_at_fault, details, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                inc,
            )
        for user in DEFAULT_USERS:
            conn.execute(
                """
                INSERT OR IGNORE INTO users (
                    username, name, email, phone, role, onchain_role, address, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                user,
            )
        conn.commit()
    return path


def reset_system_data(preserve_policies: bool = True, db_path: str | pathlib.Path = DB_PATH) -> dict:
    """Purges all produce batches, custody events, telemetry readings, quarantine logs,
    spoilage incidents, reviews, documents, and telemetry audit records across SQLite & PostgreSQL.
    Preserves participant accounts, role delegations, and crop policies.
    """
    tables_to_clear = [
        "quarantine",
        "readings",
        "batch_reviews",
        "batch_documents",
        "spoilage_incidents",
        "custody_events",
        "batches",
        "telemetry_history",
        "audit_trail",
        "replay_events",
        "replay_latest_timestamps",
    ]
    counts = {}
    conn = get_connection(db_path=db_path)
    try:
        is_pg = isinstance(conn, PostgresConnectionWrapper)

        if not is_pg:
            try:
                conn.execute("PRAGMA foreign_keys = OFF")
            except Exception as e:
                logger.debug("Pragma foreign_keys off: %s", e)

        for table in tables_to_clear:
            try:
                cnt_res = conn.execute(f"SELECT COUNT(*) as cnt FROM {table}")
                row = cnt_res.fetchone()
                cnt = row["cnt"] if row else 0
                counts[table] = int(cnt)
            except Exception as e:
                logger.debug("Count table %s fallback: %s", table, e)
                counts[table] = 0

            try:
                if is_pg:
                    conn.execute(f"TRUNCATE TABLE {table} CASCADE")
                else:
                    conn.execute(f"DELETE FROM {table}")
            except Exception as e:
                print(f"[db] Warning: Could not clear table {table}: {e}")

        if not is_pg:
            try:
                conn.execute(
                    "DELETE FROM sqlite_sequence WHERE name IN ('quarantine', 'readings', 'batch_reviews', 'batch_documents', 'spoilage_incidents', 'custody_events')"
                )
            except Exception as e:
                logger.debug("sqlite_sequence reset: %s", e)
            try:
                conn.execute("PRAGMA foreign_keys = ON")
            except Exception as e:
                logger.debug("Pragma foreign_keys on: %s", e)

        if preserve_policies:
            for crop_name, min_temp, max_temp, min_hum, max_hum in DEFAULT_POLICIES:
                try:
                    if is_pg:
                        conn.execute(
                            """
                            INSERT INTO policy (crop_name, min_temp_c, max_temp_c, min_humidity, max_humidity)
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (crop_name) DO NOTHING
                            """,
                            (crop_name, min_temp, max_temp, min_hum, max_hum),
                        )
                    else:
                        conn.execute(
                            """
                            INSERT OR IGNORE INTO policy (crop_name, min_temp_c, max_temp_c, min_humidity, max_humidity)
                            VALUES (?, ?, ?, ?, ?)
                            """,
                            (crop_name, min_temp, max_temp, min_hum, max_hum),
                        )
                except Exception as e:
                    logger.debug("Policy insert fallback: %s", e)

        conn.commit()
    finally:
        conn.close()

    return {
        "success": True,
        "cleared_records": counts,
        "total_cleared": sum(counts.values()),
        "policies_preserved": preserve_policies,
    }

