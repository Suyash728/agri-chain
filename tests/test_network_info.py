import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "backend"))
sys.path.insert(0, str(ROOT_DIR / "trust-layer"))

import pytest
from fastapi.testclient import TestClient
from main import app


def test_network_info_endpoint():
    client = TestClient(app)
    response = client.get("/network/info")
    assert response.status_code == 200
    data = response.json()
    assert "lan_ip" in data
    assert "frontend_port" in data
    assert "backend_port" in data
    assert data["frontend_port"] == 3000
    assert data["backend_port"] == 8000
    assert data["client_url"].startswith("http://")
    assert data["client_url"].endswith(":3000")
    assert data["api_url"].startswith("http://")
    assert data["api_url"].endswith(":8000")
