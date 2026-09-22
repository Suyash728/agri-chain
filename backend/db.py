SCHEMA = """CREATE TABLE batches (
    batch_id      TEXT PRIMARY KEY,
    crop_name     TEXT NOT NULL,
    origin_farm   TEXT NOT NULL,
    harvest_date  TEXT NOT NULL,
    farmer_name   TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE custody_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id      TEXT NOT NULL REFERENCES batches(batch_id),
    from_holder   TEXT,
    to_holder     TEXT NOT NULL,
    state         TEXT NOT NULL,
    price_paise   INTEGER NOT NULL,
    tx_hash       TEXT,
    occurred_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE readings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id      TEXT NOT NULL REFERENCES batches(batch_id),
    temp_c        REAL NOT NULL,
    humidity_pct  REAL NOT NULL,
    verdict       TEXT NOT NULL,
    tx_hash       TEXT,
    received_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quarantine (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id    INTEGER NOT NULL REFERENCES readings(id),
    reason        TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE policy (
    crop_name     TEXT PRIMARY KEY,
    min_temp_c    REAL NOT NULL,
    max_temp_c    REAL NOT NULL,
    min_humidity  REAL NOT NULL,
    max_humidity  REAL NOT NULL
);
"""


import sqlite3
import pathlib


def init_db(db_path: str = "data/db.sqlite") -> pathlib.Path:
    """Create the SQLite database and all tables defined by SCHEMA.

    The default database file is ``data/db.sqlite`` relative to the project root. The
    directory will be created automatically.
    """
    path = pathlib.Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.executescript(SCHEMA)
    return path
