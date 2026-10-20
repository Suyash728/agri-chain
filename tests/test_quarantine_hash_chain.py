"""
tests/test_quarantine_hash_chain.py
-----------------------------------
Verifies the cryptographic SHA-256 hash-chain implementation for off-chain quarantine audit logs,
inspired by IsoLog. Ensures:
1. Every quarantined reading is cryptographically linked to the previous record.
2. GET /quarantine/verify-integrity traverses the full chain and reports status: VALID.
3. Direct database tampering (modifying reason or breaking link) is immediately detected with broken_at_id.
"""

import sys
import time
import uuid
import hashlib
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "trust-layer"))

import pytest
from fastapi.testclient import TestClient
from main import app, get_connection


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_quarantine_hash_chain_integrity(client):
    """
    Test 1: Ingest anomalous readings and verify unbroken cryptographic hash chain.
    """
    batch_id = f"QTEST-{int(time.time())}"
    # Register batch
    client.post("/batches", json={
        "batch_id": batch_id,
        "crop_name": "tomato",
        "quantity_kg": 100.0,
        "origin_farm": "Test Farm",
        "farmer_name": "Test Farmer",
        "harvest_date": "2026-10-20",
        "price_paise": 2000,
    })

    # Ingest 2 distinct corrupt readings
    for spike_temp in [75.0, 92.5]:
        res = client.post("/telemetry", json={
            "batch_id": batch_id,
            "device_id": f"DEV-{batch_id}",
            "latitude": 18.5204,
            "longitude": 73.8567,
            "temp_c": spike_temp,
            "humidity_pct": 50.0,
            "crop_name": "tomato",
        })
        assert res.status_code == 200
        assert res.json()["verdict"] == "ANOMALOUS"

    # Verify integrity endpoint
    verify_res = client.get("/quarantine/verify-integrity")
    assert verify_res.status_code == 200
    report = verify_res.json()

    assert report["status"] == "VALID"
    assert report["tampered"] is False
    assert report["verified_records"] >= 2
    assert "unbroken SHA-256 hash chain" in report["message"]


def test_quarantine_tamper_detection(client):
    """
    Test 2: Simulate an attacker modifying an existing quarantine record in SQLite.
    Verify that verify_quarantine_integrity immediately flags tampering.
    """
    conn = get_connection()
    try:
        # Find latest quarantine entry
        latest = conn.execute("SELECT id, reason, entry_hash FROM quarantine ORDER BY id DESC LIMIT 1").fetchone()
        assert latest is not None
        target_id = latest["id"]
        original_reason = latest["reason"]

        # Deliberately tamper with the record content in SQLite
        tampered_reason = f"{original_reason} [MALICIOUS ALTERATION BY ATTACKER]"
        conn.execute("UPDATE quarantine SET reason = ? WHERE id = ?", (tampered_reason, target_id))
        conn.commit()

        # Integrity verification must now report TAMPERED
        verify_res = client.get("/quarantine/verify-integrity")
        assert verify_res.status_code == 200
        report = verify_res.json()

        assert report["status"] == "TAMPERED"
        assert report["tampered"] is True
        assert report["broken_at_id"] == target_id
        assert "tampering detected" in report["reason"]

        # Restore original state
        conn.execute("UPDATE quarantine SET reason = ? WHERE id = ?", (original_reason, target_id))
        conn.commit()

        # Re-verify restored state
        restored_res = client.get("/quarantine/verify-integrity")
        assert restored_res.json()["status"] == "VALID"
        assert restored_res.json()["tampered"] is False
    finally:
        conn.close()
