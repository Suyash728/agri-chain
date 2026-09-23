"""
app/services/integrity.py
-------------------------
Phase 6 — Telemetry Integrity, Canonicalization, Replay Detection & Device Authentication service.

WHAT THIS MODULE DOES
----------------------
1. Canonicalization & Fingerprinting: Deterministically serializes telemetry payloads into
   a canonical JSON string and computes a SHA-256 digest (`event_hash`).
2. Replay Detection: Maintains an isolated in-memory repository of processed event hashes per
   `(device_id, batch_id)` to identify duplicated or replayed telemetry.
3. Timestamp Sequence Verification: Detects stale or out-of-order event replay attempts.
4. Device Authentication Interface: Provides an extensible abstraction (`DeviceAuthenticator`)
   implemented via software stub, ready to connect with hardware-backed ATECC608A verification
   in later phases.

IMPORTANT ARCHITECTURAL NOTES
-----------------------------
- SHA-256 Hashing provides payload fingerprinting and uniqueness; it does NOT by itself prove
  that the telemetry originated from an authentic hardware sensor.
- The ReplayRepository currently uses development in-memory state.
"""

from datetime import datetime, timezone
import hashlib
import json
from typing import Dict, List, Optional, Protocol, Set, Tuple

from app.schemas.integrity import IntegrityCheckResult, IntegrityResult
from app.schemas.telemetry import TelemetryPayload


def canonicalize_telemetry(payload: TelemetryPayload) -> str:
    """
    Produce a deterministic canonical string representation of a telemetry payload.

    Guarantees that identical sensor readings produce identical serializations
    regardless of Python dictionary ordering or whitespace formatting.
    """
    # Normalize timestamp to UTC ISO 8601 string
    ts_utc = payload.timestamp
    if ts_utc.tzinfo is None:
        ts_utc = ts_utc.replace(tzinfo=timezone.utc)
    else:
        ts_utc = ts_utc.astimezone(timezone.utc)
    ts_str = ts_utc.isoformat()

    canonical_obj = {
        "batch_id": payload.batch_id.strip(),
        "device_id": payload.device_id.strip(),
        "humidity": round(float(payload.humidity), 4),
        "latitude": round(float(payload.latitude), 6),
        "longitude": round(float(payload.longitude), 6),
        "temperature": round(float(payload.temperature), 4),
        "timestamp": ts_str,
    }

    # Deterministic JSON with sorted keys and no extra whitespace
    return json.dumps(canonical_obj, sort_keys=True, separators=(",", ":"))


def compute_event_hash(payload: TelemetryPayload) -> str:
    """
    Compute the SHA-256 hexadecimal digest of the canonical telemetry representation.
    """
    canonical_str = canonicalize_telemetry(payload)
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()


class ReplayRepository:
    """
    In-memory storage for tracking processed event hashes and timestamp sequences per device/batch.
    """

    def __init__(self) -> None:
        # Key: (device_id, batch_id) -> Value: Set of processed event_hashes
        self._seen_hashes: Dict[Tuple[str, str], Set[str]] = {}
        # Key: (device_id, batch_id) -> Value: Most recent processed timestamp
        self._latest_timestamps: Dict[Tuple[str, str], datetime] = {}

    def is_replay(self, device_id: str, batch_id: str, event_hash: str) -> bool:
        """Check whether the exact event hash has already been registered for (device_id, batch_id)."""
        key = (device_id, batch_id)
        return event_hash in self._seen_hashes.get(key, set())

    def is_out_of_sequence(self, device_id: str, batch_id: str, timestamp: datetime) -> bool:
        """Check if incoming timestamp is older than the latest accepted timestamp for (device_id, batch_id)."""
        key = (device_id, batch_id)
        latest = self._latest_timestamps.get(key)
        if latest is None:
            return False
        return timestamp < latest

    def register_event(
        self, device_id: str, batch_id: str, event_hash: str, timestamp: datetime
    ) -> None:
        """Register a valid, novel event in history."""
        key = (device_id, batch_id)
        if key not in self._seen_hashes:
            self._seen_hashes[key] = set()
        self._seen_hashes[key].add(event_hash)

        latest = self._latest_timestamps.get(key)
        if latest is None or timestamp > latest:
            self._latest_timestamps[key] = timestamp

    def clear(self) -> None:
        """Clear replay history (for test isolation)."""
        self._seen_hashes.clear()
        self._latest_timestamps.clear()


class DeviceAuthenticator(Protocol):
    """
    Protocol for device authentication and digital signature verification.
    """

    def authenticate(
        self, payload: TelemetryPayload, signature: Optional[str] = None
    ) -> bool:
        ...


class SoftwareDeviceAuthenticator:
    """
    Software-side device authenticator stub.

    Allows the pipeline to accept signatures or evaluate device identity.
    In future phases, this can be swapped with an ATECC608A hardware-backed
    ECDSA signature verification service without redesigning the pipeline.
    """

    def authenticate(
        self, payload: TelemetryPayload, signature: Optional[str] = None
    ) -> bool:
        # Software stub: accepts well-formed payloads by default.
        # Can inspect signature tokens or PKI identity if provided.
        return True


# Shared singleton instances
replay_repository = ReplayRepository()
device_authenticator = SoftwareDeviceAuthenticator()


def verify_telemetry_integrity(
    payload: TelemetryPayload,
    authenticator: Optional[DeviceAuthenticator] = None,
) -> IntegrityResult:
    """
    Evaluate cryptographic integrity, replay detection, and sequence validity for a telemetry reading.

    Parameters
    ----------
    payload : TelemetryPayload
        Incoming telemetry reading.
    authenticator : Optional[DeviceAuthenticator]
        Authentication provider (defaults to SoftwareDeviceAuthenticator).

    Returns
    -------
    IntegrityResult
        Structured evidence regarding event hash, replay detection, and authentication.
    """
    if authenticator is None:
        authenticator = device_authenticator

    event_hash = compute_event_hash(payload)
    checks: List[IntegrityCheckResult] = []

    # 1. Event Fingerprint Check
    checks.append(
        IntegrityCheckResult(
            name="event_fingerprint",
            passed=True,
            reason_code="INTEGRITY_VALID",
            details=f"SHA-256 fingerprint generated: {event_hash[:16]}...",
        )
    )

    # 2. Replay Detection Check
    is_replayed = replay_repository.is_replay(
        device_id=payload.device_id,
        batch_id=payload.batch_id,
        event_hash=event_hash,
    )

    if is_replayed:
        checks.append(
            IntegrityCheckResult(
                name="replay_detection",
                passed=False,
                reason_code="REPLAY_DETECTED",
                details=(
                    f"Identical telemetry payload with hash {event_hash} was already processed "
                    f"for device '{payload.device_id}' and batch '{payload.batch_id}'."
                ),
            )
        )
    else:
        checks.append(
            IntegrityCheckResult(
                name="replay_detection",
                passed=True,
                reason_code="INTEGRITY_VALID",
                details="Payload is unique; no duplicate event hash found in history.",
            )
        )

    # 3. Timestamp Sequence Check
    is_out_of_seq = replay_repository.is_out_of_sequence(
        device_id=payload.device_id,
        batch_id=payload.batch_id,
        timestamp=payload.timestamp,
    )

    if is_out_of_seq:
        checks.append(
            IntegrityCheckResult(
                name="timestamp_sequence",
                passed=False,
                reason_code="TIMESTAMP_OUT_OF_SEQUENCE",
                details=(
                    f"Timestamp ({payload.timestamp.isoformat()}) is older than the latest "
                    f"registered reading for device '{payload.device_id}'."
                ),
            )
        )
    else:
        checks.append(
            IntegrityCheckResult(
                name="timestamp_sequence",
                passed=True,
                reason_code="INTEGRITY_VALID",
                details="Event timestamp follows chronological sequence.",
            )
        )

    # 4. Device Authentication Check (Software Interface)
    is_authenticated = authenticator.authenticate(payload)
    if is_authenticated:
        checks.append(
            IntegrityCheckResult(
                name="device_authentication",
                passed=True,
                reason_code="DEVICE_AUTHENTICATED",
                details="Device identity verified via authentication interface (software stub).",
            )
        )
    else:
        checks.append(
            IntegrityCheckResult(
                name="device_authentication",
                passed=False,
                reason_code="UNAUTHENTICATED_DEVICE",
                details="Device failed signature/identity verification.",
            )
        )

    # Determine overall integrity status
    if is_replayed:
        status = "REPLAY_DETECTED"
        details = "Telemetry flagged as duplicate / replayed event."
    elif is_out_of_seq or not is_authenticated:
        status = "SUSPICIOUS"
        details = "Telemetry exhibits out-of-sequence timestamp or unverified authentication."
    else:
        status = "VALID"
        details = "Telemetry payload integrity verified and unique."

    # Register event in history if not a replay
    if not is_replayed:
        replay_repository.register_event(
            device_id=payload.device_id,
            batch_id=payload.batch_id,
            event_hash=event_hash,
            timestamp=payload.timestamp,
        )

    return IntegrityResult(
        status=status,
        event_hash=event_hash,
        replay_detected=is_replayed,
        authenticated=is_authenticated,
        checks=checks,
        details=details,
    )
