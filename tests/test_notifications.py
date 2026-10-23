import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "trust-layer"))

import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_dynamic_notifications_by_role(client):
    """Verify that /notifications/all-users and /notifications/count return dynamic, role-tailored events."""
    for role in ["farmer", "logistics", "darkstore", "consumer"]:
        # 1. Test count endpoint
        count_res = client.get(f"/notifications/count?role={role}")
        assert count_res.status_code == 200
        count_data = count_res.json()
        assert "count" in count_data
        assert count_data["role"] == role
        assert isinstance(count_data["count"], int)

        # 2. Test list endpoint
        list_res = client.get(f"/notifications/all-users?role={role}")
        assert list_res.status_code == 200
        items = list_res.json()
        assert isinstance(items, list)
        assert len(items) == count_data["count"]

        # 3. Verify notification item schema
        for item in items:
            assert "id" in item
            assert "title" in item
            assert "desc" in item
            assert "recipient_role" in item
            assert item["recipient_role"] == role
            assert "time" in item

def test_universal_notifications_all(client):
    """Verify universal view aggregates notifications across all roles without error."""
    res = client.get("/notifications/all-users?role=all")
    assert res.status_code == 200
    all_notifs = res.json()
    assert isinstance(all_notifs, list)

    count_res = client.get("/notifications/count?role=all")
    assert count_res.status_code == 200
    assert count_res.json()["count"] == len(all_notifs)
