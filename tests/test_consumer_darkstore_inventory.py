"""
tests/test_consumer_darkstore_inventory.py
-----------------------------------------
Verifies that the Consumer marketplace strictly displays actual batches available
through the Dark Store (custody state IN_STORAGE or AT_RETAIL) and eliminates mock/hardcoded items.
"""

import sys
import time
import uuid
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "trust-layer"))

import pytest
from fastapi.testclient import TestClient
from main import app
from db import get_connection


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_consumer_products_only_returns_darkstore_inventory(client):
    """Verifies GET /consumer/products queries actual Dark Store stock only."""
    res = client.get("/consumer/products")
    assert res.status_code == 200
    products = res.json()
    assert isinstance(products, list)

    conn = get_connection()
    try:
        # Check that every single returned product maps to a real batch in IN_STORAGE or AT_RETAIL
        for p in products:
            b_id = p["batchId"]
            assert not b_id.startswith("BATCH-CAT-"), f"Found synthetic catalog batch: {b_id}"
            assert not b_id.startswith("QUARANTINE-"), f"Found quarantined batch in marketplace: {b_id}"

            # Verify latest custody event
            ev = conn.execute(
                "SELECT state FROM custody_events WHERE batch_id = ? ORDER BY id DESC LIMIT 1",
                (b_id,)
            ).fetchone()
            assert ev is not None, f"Batch {b_id} has no custody event"
            assert ev["state"] in ("IN_STORAGE", "AT_RETAIL"), f"Batch {b_id} in invalid consumer state: {ev['state']}"

            # Verify no quarantine
            quar = conn.execute(
                "SELECT 1 FROM readings WHERE batch_id = ? AND verdict IN ('QUARANTINED', 'ANOMALOUS') LIMIT 1",
                (b_id,)
            ).fetchone()
            assert quar is None, f"Batch {b_id} is quarantined but shown in marketplace"
    finally:
        conn.close()


def test_lifecycle_darkstore_intake_to_consumer_checkout(client):
    """
    Verifies full lifecycle:
    1. Newly registered batch (REGISTERED) does NOT appear in Consumer products.
    2. In-transit batch (IN_TRANSIT) does NOT appear in Consumer products.
    3. Receiving batch at Dark Store (IN_STORAGE) IMMEDIATELY makes it appear in Consumer products.
    4. Consumer checkout advances custody to SOLD and removes it from Consumer products.
    5. Sold batch appears in Consumer orders history.
    """
    test_batch_id = f"TEST-DS-LINK-{int(time.time())}"
    conn = get_connection()
    try:
        # Step 1: Register produce batch
        res_reg = client.post("/batches", json={
            "batch_id": test_batch_id,
            "crop_name": "Organic Field Tomatoes",
            "quantity_kg": 200.0,
            "origin_farm": "Nashik Organic Farm Cluster 4",
            "farmer_name": "Rahul Patil",
            "harvest_date": "2026-10-24",
            "price_paise": 4000,
        })
        assert res_reg.status_code == 200

        # Verify NOT in consumer products
        prods_reg = client.get("/consumer/products").json()
        assert not any(p["batchId"] == test_batch_id for p in prods_reg)

        # Step 2: Logistics pickup -> IN_TRANSIT
        conn.execute(
            """
            INSERT INTO custody_events (batch_id, from_holder, to_holder, state, price_paise, tx_hash)
            VALUES (?, 'Rahul Patil', 'Safexpress Cold Chain Logistics', 'IN_TRANSIT', 6000, ?)
            """,
            (test_batch_id, f"0x{uuid.uuid4().hex}")
        )
        conn.commit()

        # Verify NOT in consumer products
        prods_trans = client.get("/consumer/products").json()
        assert not any(p["batchId"] == test_batch_id for p in prods_trans)

        # Step 3: Dark Store GRN intake -> IN_STORAGE
        res_recv = client.post("/darkstore/receive", json={"batch_id": test_batch_id})
        assert res_recv.status_code == 200

        # Verify IMMEDIATELY appears in consumer products
        prods_stored = client.get("/consumer/products").json()
        matched = next((p for p in prods_stored if p["batchId"] == test_batch_id), None)
        assert matched is not None, f"Batch {test_batch_id} did not appear in /consumer/products after Dark Store intake"
        assert matched["name"] == "Organic Field Tomatoes"
        assert matched["category"] == "vegetables"
        assert matched["status"] == "IN_STORAGE"

        # Step 4: Consumer Checkout
        res_checkout = client.post("/consumer/checkout", json={
            "items": [
                {
                    "id": matched["id"],
                    "batchId": test_batch_id,
                    "name": matched["name"],
                    "price": matched["price"],
                    "quantity": 1,
                    "weight": matched["weight"],
                }
            ],
            "delivery_address": "Kothrud, Pune",
            "total_amount": matched["price"],
        })
        assert res_checkout.status_code == 200

        # Verify batch is now SOLD and NO LONGER appears in available consumer products
        prods_after = client.get("/consumer/products").json()
        assert not any(p["batchId"] == test_batch_id for p in prods_after), f"Batch {test_batch_id} still listed after SOLD checkout"

        # Step 5: Check consumer orders history contains the batch
        orders = client.get("/consumer/orders").json()
        matched_order = next((o for o in orders if o.get("batchId") == test_batch_id), None)
        assert matched_order is not None, f"Batch {test_batch_id} not found in consumer order history"
        assert matched_order["status"] == "Delivered"

    finally:
        # Cleanup test batch
        conn.execute("DELETE FROM batch_reviews WHERE batch_id = ?", (test_batch_id,))
        conn.execute("DELETE FROM readings WHERE batch_id = ?", (test_batch_id,))
        conn.execute("DELETE FROM custody_events WHERE batch_id = ?", (test_batch_id,))
        conn.execute("DELETE FROM batches WHERE batch_id = ?", (test_batch_id,))
        conn.commit()
        conn.close()
