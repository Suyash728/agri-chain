#!/usr/bin/env python3
"""AgriChain SQLite to PostgreSQL (Supabase) Migration Script.

Reads all records from local SQLite (agrichain.db) and migrates them
to a target PostgreSQL / Supabase database with ON CONFLICT upserting,
verifying 0 row count discrepancies across all tables.

Usage:
    python backend/scripts/migrate_sqlite_to_supabase.py [--target-url <POSTGRES_URL>] [--dry-run]
"""

import os
import sys
import argparse
import sqlite3
import pathlib
from typing import Dict, Any, List

# Ensure proper stdout encoding on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = pathlib.Path(__file__).resolve().parents[2]
BACKEND_DIR = ROOT_DIR / "backend"
DEFAULT_SQLITE_PATH = BACKEND_DIR / "agrichain.db"
MIGRATION_SQL_PATH = BACKEND_DIR / "migrations" / "001_initial_schema.sql"

# Add backend to sys.path
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TABLES_IN_ORDER = [
    "policy",
    "batches",
    "custody_events",
    "readings",
    "quarantine",
    "telemetry_history",
    "audit_trail",
    "replay_events",
    "replay_latest_timestamps",
    "batch_documents",
    "batch_reviews",
]


def get_sqlite_records(sqlite_path: pathlib.Path, table: str) -> List[Dict[str, Any]]:
    """Fetch all rows from a SQLite table as a list of dicts."""
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    try:
        # Check if table exists
        check = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
            (table,),
        ).fetchone()
        if not check:
            return []
        rows = conn.execute(f"SELECT * FROM {table}").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def migrate_to_postgres(target_url: str, sqlite_path: pathlib.Path, dry_run: bool = False):
    """Executes schema migration and data transfer from SQLite to PostgreSQL."""
    import psycopg
    from psycopg.rows import dict_row

    print("==========================================================================")
    print("      AGRICHAIN - SQLITE TO SUPABASE / POSTGRESQL MIGRATION               ")
    print("==========================================================================\n")
    print(f"[*] Source Database: {sqlite_path}")
    print(f"[*] Target Database: {target_url.split('@')[-1] if '@' in target_url else target_url}")
    print(f"[*] Dry-Run Mode:    {dry_run}\n")

    if dry_run:
        print("--- [DRY-RUN INSPECTION] Reading SQLite Source Records ---")
        total_rows = 0
        for table in TABLES_IN_ORDER:
            rows = get_sqlite_records(sqlite_path, table)
            total_rows += len(rows)
            print(f"  - {table:<25}: {len(rows):>5} rows")
        print(f"\n[OK] Dry-run complete. Total records to migrate: {total_rows}")
        return True

    # 1. Initialize Schema in target PostgreSQL
    print("--- [STEP 1] Initializing PostgreSQL Target Schema ---")
    with open(MIGRATION_SQL_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    with psycopg.connect(target_url, row_factory=dict_row) as pg_conn:
        with pg_conn.cursor() as cur:
            cur.execute(schema_sql)
        pg_conn.commit()
    print("  [OK] Target schema initialized successfully from 001_initial_schema.sql")

    # 2. Transfer Data per Table with ON CONFLICT Upserts
    print("\n--- [STEP 2] Migrating Data Rows ---")
    source_counts = {}
    target_counts = {}

    with psycopg.connect(target_url, row_factory=dict_row) as pg_conn:
        for table in TABLES_IN_ORDER:
            records = get_sqlite_records(sqlite_path, table)
            source_counts[table] = len(records)

            if not records:
                print(f"  - {table:<25}: 0 rows (skipped)")
                continue

            columns = list(records[0].keys())
            cols_str = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))

            # Conflict target resolution
            if table == "policy":
                conflict_clause = "ON CONFLICT (crop_name) DO UPDATE SET min_temp_c = EXCLUDED.min_temp_c, max_temp_c = EXCLUDED.max_temp_c, min_humidity = EXCLUDED.min_humidity, max_humidity = EXCLUDED.max_humidity"
            elif table == "batches":
                conflict_clause = "ON CONFLICT (batch_id) DO UPDATE SET crop_name = EXCLUDED.crop_name, origin_farm = EXCLUDED.origin_farm, harvest_date = EXCLUDED.harvest_date, farmer_name = EXCLUDED.farmer_name"
            elif table in ("custody_events", "readings", "quarantine", "batch_documents", "batch_reviews"):
                update_assignments = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns if col != "id"])
                conflict_clause = f"ON CONFLICT (id) DO UPDATE SET {update_assignments}"
            elif table == "telemetry_history":
                conflict_clause = "ON CONFLICT (device_id, batch_id) DO UPDATE SET temperature = EXCLUDED.temperature, humidity = EXCLUDED.humidity, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, timestamp = EXCLUDED.timestamp"
            elif table == "audit_trail":
                conflict_clause = "ON CONFLICT (audit_id) DO UPDATE SET verdict = EXCLUDED.verdict, disposition = EXCLUDED.disposition, details = EXCLUDED.details"
            elif table == "replay_events":
                conflict_clause = "ON CONFLICT (device_id, batch_id, event_hash) DO NOTHING"
            elif table == "replay_latest_timestamps":
                conflict_clause = "ON CONFLICT (device_id, batch_id) DO UPDATE SET latest_timestamp = EXCLUDED.latest_timestamp"
            else:
                conflict_clause = ""

            insert_sql = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders}) {conflict_clause}"

            with pg_conn.cursor() as cur:
                for row_dict in records:
                    values = [row_dict[col] for col in columns]
                    cur.execute(insert_sql, values)

            pg_conn.commit()
            print(f"  - {table:<25}: Migrated {len(records)} rows")

        # 3. Synchronize Serial Primary Key Sequences
        print("\n--- [STEP 3] Synchronizing Serial Auto-Increment Sequences ---")
        serial_tables = ["custody_events", "readings", "quarantine", "batch_documents", "batch_reviews"]
        with pg_conn.cursor() as cur:
            for st in serial_tables:
                cur.execute(f"SELECT MAX(id) FROM {st}")
                max_id = cur.fetchone()["max"]
                if max_id:
                    cur.execute(f"SELECT setval(pg_get_serial_sequence('{st}', 'id'), %s)", (max_id,))
                    print(f"  [OK] Sequence for {st}.id synchronized to {max_id}")
        pg_conn.commit()

        # 4. Verify Row Counts Matching Exactly
        print("\n--- [STEP 4] Row Count Discrepancy Verification ---")
        discrepancies = 0
        with pg_conn.cursor() as cur:
            for table in TABLES_IN_ORDER:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                t_count = cur.fetchone()["count"]
                target_counts[table] = t_count
                s_count = source_counts[table]

                status = "MATCH" if s_count == t_count else "MISMATCH"
                if status == "MISMATCH":
                    discrepancies += 1
                print(f"  {table:<25}: Source={s_count:>5} | Target={t_count:>5} [{status}]")

        print("\n==========================================================================")
        if discrepancies == 0:
            print("  SUCCESS: MIGRATION COMPLETE! 0 ROW COUNT DISCREPANCIES DETECTED.")
        else:
            print(f"  WARNING: {discrepancies} TABLE(S) HAVE ROW COUNT DISCREPANCIES!")
        print("==========================================================================")

        assert discrepancies == 0, f"Encountered {discrepancies} table row count discrepancies"
        return True


def main():
    parser = argparse.ArgumentParser(description="Migrate AgriChain SQLite database to Supabase PostgreSQL.")
    parser.add_argument(
        "--target-url",
        default=os.getenv("DATABASE_URL"),
        help="Target PostgreSQL connection URL (e.g. postgresql://user:pass@host:5432/dbname)",
    )
    parser.add_argument(
        "--sqlite-path",
        default=str(DEFAULT_SQLITE_PATH),
        help="Path to local agrichain.db",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Inspect SQLite records and print migration plan without writing to PostgreSQL",
    )
    args = parser.parse_args()

    sqlite_path = pathlib.Path(args.sqlite_path)
    if not sqlite_path.exists():
        print(f"Error: SQLite database not found at {sqlite_path}")
        sys.exit(1)

    target_url = args.target_url
    if not target_url and not args.dry_run:
        print("[!] No --target-url or DATABASE_URL provided. Executing in --dry-run mode:")
        args.dry_run = True

    try:
        migrate_to_postgres(target_url=target_url or "sqlite://dry_run", sqlite_path=sqlite_path, dry_run=args.dry_run)
    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
