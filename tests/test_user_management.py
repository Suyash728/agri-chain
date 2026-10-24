import pytest
from fastapi.testclient import TestClient
import sys
import pathlib

ROOT_DIR = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT_DIR / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "backend"))

from main import app

client = TestClient(app)


def test_list_users():
    res = client.get("/admin/users")
    assert res.status_code == 200
    data = res.json()
    assert "users" in data
    assert "participants" in data
    assert len(data["users"]) >= 5
    # Verify Rahul farmer exists
    farmer_user = next((u for u in data["users"] if u["role"] == "farmer"), None)
    assert farmer_user is not None
    assert "Rahul Patil" in farmer_user["name"]


def test_create_update_delete_user():
    # 1. Create User
    new_user_payload = {
        "name": "Kavita Deshmukh",
        "email": "kavita.test@agrohub.in",
        "role": "farmer",
        "phone": "+91 91234 56789",
        "grant_onchain": False,
    }
    create_res = client.post("/admin/users", json=new_user_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    assert created_data["success"] is True
    user = created_data["user"]
    user_id = user["id"]
    assert user["name"] == "Kavita Deshmukh"
    assert user["role"] == "farmer"

    # 2. Update User
    update_res = client.put(f"/admin/users/{user_id}", json={
        "name": "Kavita Deshmukh (Lead Grower)",
        "phone": "+91 91234 99999",
    })
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["user"]["name"] == "Kavita Deshmukh (Lead Grower)"
    assert updated_data["user"]["phone"] == "+91 91234 99999"

    # 3. Delete User
    del_res = client.delete(f"/admin/users/{user_id}")
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 4. Verify 404 after deletion
    del_again = client.delete(f"/admin/users/{user_id}")
    assert del_again.status_code == 404


def test_auth_login_and_logout():
    # Login by role
    login_res = client.post("/auth/login", json={"role": "farmer"})
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["success"] is True
    assert data["user"]["role"] == "farmer"
    assert "token" in data

    # Login by username
    login_user = client.post("/auth/login", json={"username_or_email": "admin"})
    assert login_user.status_code == 200
    assert login_user.json()["user"]["role"] == "admin"

    # Logout
    logout_res = client.post("/auth/logout")
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True
