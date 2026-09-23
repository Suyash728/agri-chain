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
   (e.g., Redis, PostgreSQL, TimescaleDB) in future phases.
"""

from typing import Dict, Optional, Tuple
from app.schemas.telemetry import TelemetryPayload


class TelemetryHistoryRepository:
    """
    In-memory storage for recent telemetry readings per device/batch.
    """

    def __init__(self) -> None:
        # Key: (device_id, batch_id) -> Value: TelemetryPayload (latest reading)
        self._store: Dict[Tuple[str, str], TelemetryPayload] = {}

    def get_last_reading(
        self, device_id: str, batch_id: Optional[str] = None
    ) -> Optional[TelemetryPayload]:
        """
        Retrieve the most recent telemetry payload for a device (and batch).

        Parameters
        ----------
        device_id : str
            The device identifier.
        batch_id : Optional[str]
            The batch identifier. If provided, ensures batch isolation.

        Returns
        -------
        Optional[TelemetryPayload]
            The previous reading if found, else None.
        """
        if not device_id:
            return None

        if batch_id is not None:
            return self._store.get((device_id, batch_id))

        # Fallback: search for any key matching device_id if batch_id is omitted
        for (d_id, _), payload in self._store.items():
            if d_id == device_id:
                return payload
        return None

    def add_reading(self, payload: TelemetryPayload) -> None:
        """
        Store a new telemetry reading in history for (device_id, batch_id).

        Parameters
        ----------
        payload : TelemetryPayload
            The validated telemetry payload to record.
        """
        if payload and payload.device_id and payload.batch_id:
            key = (payload.device_id, payload.batch_id)
            self._store[key] = payload

    def clear(self) -> None:
        """Clear all stored telemetry history (useful for testing)."""
        self._store.clear()


# Shared singleton repository instance for the application runtime.
history_repository = TelemetryHistoryRepository()
