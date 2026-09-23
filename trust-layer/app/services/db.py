"""
app/services/db.py
------------------
SQLite database management for the AI Trust Layer.
Persists telemetry history, immutable audit trails, and cryptographic replay records.
"""

import json
import os
import pathlib
import sqlite3
from typing import Optional

from app.config import SQLITE_DB_PATH

SCHEMA = """
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
"""


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Return a sqlite3 connection with Row factory and WAL enabled."""
    target_path = db_path or SQLITE_DB_PATH
    if target_path != ":memory:":
        pathlib.Path(target_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(target_path, timeout=15.0)
    conn.row_factory = sqlite3.Row
    if target_path != ":memory:":
        try:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA busy_timeout = 5000")
        except Exception:
            pass
    return conn


def init_trust_db(db_path: Optional[str] = None) -> None:
    """Initialize SQLite tables for telemetry history, audit trail, and replay events."""
    conn = get_connection(db_path)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def get_crop_policy(batch_id: Optional[str] = None, db_path: Optional[str] = None):
    """Convenience alias importing get_crop_policy from app.services.policy."""
    from app.services.policy import get_crop_policy as _get_crop_policy
    return _get_crop_policy(batch_id=batch_id, db_path=db_path)
