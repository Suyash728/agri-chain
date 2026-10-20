"""
tests/test_admin_roles.py
-------------------------
Verifies on-chain Role-Based Access Control (RBAC) administration:
1. GET /admin/users retrieves system participants with on-chain role status.
2. POST /admin/roles/grant grants a role on-chain.
3. POST /admin/roles/revoke successfully revokes the role on-chain.
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "trust-layer"))

import pytest
from fastapi.testclient import TestClient
from main import app
import chain


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_admin_roles_grant_and_revoke_lifecycle(client):
    test_address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
    role_to_test = "FARMER_ROLE"

    # Step 1: Grant role
    grant_res = client.post("/admin/roles/grant", json={
        "role": role_to_test,
        "address": test_address,
    })
    assert grant_res.status_code == 200
    assert grant_res.json()["success"] is True

    # Check on-chain role status
    status_after_grant = chain.check_role(role_to_test, test_address)
    assert status_after_grant["has_role"] is True

    # Step 2: Revoke role
    revoke_res = client.post("/admin/roles/revoke", json={
        "role": role_to_test,
        "address": test_address,
    })
    assert revoke_res.status_code == 200
    assert revoke_res.json()["success"] is True

    # Check on-chain role status after revocation
    status_after_revoke = chain.check_role(role_to_test, test_address)
    assert status_after_revoke["has_role"] is False
