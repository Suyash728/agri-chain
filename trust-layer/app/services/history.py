"""
app/services/history.py
------------------------
In-memory history repository for storing and retrieving recent IoT telemetry.

PURPOSE
-------
Phase 3 physical and temporal plausibility checks require historical context
(i.e., comparing a current reading against the previous reading from the same
device and batch).

DESIGN DECISIONS
----------------
1. Isolated Repository Pattern: Keeps history data access behind a clear,
   modular interface (`get_last_reading`, `add_reading`, `clear`).
2. Isolated by (device_id, batch_id): Ensures readings from different devices
   or different batches are never cross-compared.
3. In-Memory Storage: Simple, fast, and light for Phase 3 without introducing
   heavy database dependencies. Can easily be swapped with a persistent store
    Persistent SQLite storage in backend/agrichain.db (Phase 6).
"""

from datetime import datetime, timezone
from typing import Optional
from app.schemas.telemetry import TelemetryPayload
from app.services.db import get_connection, init_trust_db


class TelemetryHistoryRepository:
    """
    SQLite-backed storage for recent telemetry readings per device/batch.
    """

    def __init__(self, db_path: Optional[str] = None) -> None:
        self.db_path = db_path
        init_trust_db(self.db_path)

    def get_last_reading(
        self, device_id: str, batch_id: Optional[str] = None
    ) -> Optional[TelemetryPayload]:
        """
        Retrieve the most recent telemetry payload for a device (and batch).
        """
        if not device_id:
            return None

        with get_connection(self.db_path) as conn:
            if batch_id is not None:
                row = conn.execute(
                    "SELECT * FROM telemetry_history WHERE device_id = ? AND batch_id = ?",
                    (device_id, batch_id),
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT * FROM telemetry_history WHERE device_id = ? ORDER BY recorded_at DESC LIMIT 1",
                    (device_id,),
                ).fetchone()

            if not row:
                return None

            raw_ts = row["timestamp"]
            ts = datetime.fromisoformat(raw_ts)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            return TelemetryPayload(
                device_id=row["device_id"],
                batch_id=row["batch_id"],
                timestamp=ts,
                temperature=float(row["temperature"]),
                humidity=float(row["humidity"]),
                latitude=float(row["latitude"]),
                longitude=float(row["longitude"]),
            )

    def add_reading(self, payload: TelemetryPayload) -> None:
        """
        Store or update a telemetry reading in history for (device_id, batch_id).
        """
        if payload and payload.device_id and payload.batch_id:
            ts = payload.timestamp
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            ts_str = ts.isoformat()

            with get_connection(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO telemetry_history (
                        device_id, batch_id, timestamp, temperature, humidity, latitude, longitude, recorded_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                    ON CONFLICT(device_id, batch_id) DO UPDATE SET
                        timestamp = excluded.timestamp,
                        temperature = excluded.temperature,
                        humidity = excluded.humidity,
                        latitude = excluded.latitude,
                        longitude = excluded.longitude,
                        recorded_at = datetime('now')
                    """,
                    (
                        payload.device_id,
                        payload.batch_id,
                        ts_str,
                        float(payload.temperature),
                        float(payload.humidity),
                        float(payload.latitude),
                        float(payload.longitude),
                    ),
                )
                conn.commit()

    def clear(self) -> None:
        """Clear all stored telemetry history (useful for testing)."""
        with get_connection(self.db_path) as conn:
            conn.execute("DELETE FROM telemetry_history")
            conn.commit()


# Shared singleton repository instance for the application runtime.
history_repository = TelemetryHistoryRepository()

