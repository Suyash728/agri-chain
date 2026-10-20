"""
tests/test_breach_vs_anomaly.py
--------------------------------
Comprehensive test suite verifying the strict separation between:
1. Genuine Cold-Chain Policy Breaches (Plausible data violating temperature limits -> RECORDED_ON_CHAIN_BREACH with breach=True and custodian attribution)
2. Corrupted / Attack Data (Impossible physical spikes, invalid sensor data -> QUARANTINED off-chain, tx_hash=None)
"""

import sys
import time
import uuid
from pathlib import Path

# Add backend and trust-layer to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "trust-layer"))

import pytest
from fastapi.testclient import TestClient
from main import app, get_connection


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


@pytest.fixture(scope="module")
def active_batch(client):
    """Creates and registers a test batch on both blockchain and DB."""
    batch_id = f"TEST-BR-{int(time.time())}-{uuid.uuid4().hex[:4].upper()}"
    payload = {
        "batch_id": batch_id,
        "crop_name": "tomato",
        "quantity_kg": 500.0,
        "origin_farm": "Baramati Organic Farms",
        "farmer_name": "Rahul Patil",
        "harvest_date": "2026-10-20",
        "price_paise": 2500,  # ₹25.00/kg
    }
    res = client.post("/batches", json=payload)
    assert res.status_code == 200, f"Batch registration failed: {res.text}"
    return batch_id


def test_genuine_cold_chain_breach_recorded_on_chain(client, active_batch):
    """
    Test 1: Plausible temperature telemetry that violates cold-chain storage limits.
    Expected outcome:
      - verdict == 'BREACH'
      - disposition == 'RECORDED_ON_CHAIN_BREACH'
      - tx_hash != None (mined on Hardhat EVM)
      - DB reading updated to verdict='BREACH'
      - Automatic spoilage incident recorded in spoilage_incidents
    """
    # Tomato policy max temp is typically 10-12°C. 24.5°C is a severe thermal breach, but physically plausible.
    payload = {
        "batch_id": active_batch,
        "device_id": f"DEV-{active_batch}",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "temp_c": 24.5,
        "humidity_pct": 65.0,
        "crop_name": "tomato",
    }

    res = client.post("/telemetry", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["verdict"] == "BREACH", f"Expected BREACH, got {data['verdict']}"
    assert data["disposition"] == "RECORDED_ON_CHAIN_BREACH"
    assert data["tx_hash"] is not None and len(data["tx_hash"]) in (64, 66)
    assert any("POLICY" in r or "TEMP" in r for r in data["reason_codes"])

    # Verify database state
    conn = get_connection()
    try:
        reading_row = conn.execute(
            "SELECT verdict, tx_hash FROM readings WHERE id = ?",
            (data["reading_id"],)
        ).fetchone()
        assert reading_row is not None
        assert reading_row["verdict"] == "BREACH"
        assert reading_row["tx_hash"] == data["tx_hash"]

        # Verify automatic spoilage incident creation
        spoil_row = conn.execute(
            "SELECT * FROM spoilage_incidents WHERE batch_id = ?",
            (active_batch,)
        ).fetchone()
        assert spoil_row is not None
        assert spoil_row["failure_type"] == "THERMAL_BREACH"
        assert spoil_row["loss_goods_kg"] > 0
        assert spoil_row["total_loss_paise"] > 0
    finally:
        conn.close()


def test_corrupted_sensor_spike_quarantined_off_chain(client, active_batch):
    """
    Test 2: Physically impossible sensor data (e.g. 88.5°C ambient reading from a field sensor).
    Expected outcome:
      - verdict == 'ANOMALOUS'
      - disposition == 'QUARANTINED'
      - tx_hash == None (EVM blockchain is not polluted)
      - Entry recorded in SQLite quarantine table with reason
    """
    payload = {
        "batch_id": active_batch,
        "device_id": f"DEV-{active_batch}",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "temp_c": 88.5,  # Physically absurd spike
        "humidity_pct": 50.0,
        "crop_name": "tomato",
    }

    res = client.post("/telemetry", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["verdict"] == "ANOMALOUS", f"Expected ANOMALOUS, got {data['verdict']}"
    assert data["disposition"] == "QUARANTINED"
    assert data["tx_hash"] is None, "Corrupted telemetry must not be mined on-chain"

    # Verify SQLite quarantine table contains the incident
    conn = get_connection()
    try:
        quarantine_row = conn.execute(
            "SELECT * FROM quarantine WHERE reading_id = ?",
            (data["reading_id"],)
        ).fetchone()
        assert quarantine_row is not None
        assert "TEMP" in quarantine_row["reason"] or "OUT_OF_RANGE" in quarantine_row["reason"] or "88.5" in quarantine_row["reason"] or "range" in quarantine_row["reason"].lower()
    finally:
        conn.close()
