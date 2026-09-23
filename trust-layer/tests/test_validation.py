"""
tests/test_validation.py
------------------------
Phase 2 tests for the basic range validation pipeline.

HOW TO RUN
----------
From the project root directory:

    pytest tests/ -v

The -v flag prints each test name and its pass/fail result.

HOW THESE TESTS WORK
---------------------
FastAPI provides a TestClient (built on top of httpx) that lets us send
HTTP requests to the application without starting a real server. This
makes tests fast, isolated, and reproducible.

We import our FastAPI `app` instance and wrap it with TestClient. Each
test function:
  1. Builds a JSON payload (valid or intentionally broken).
  2. POSTs it to /telemetry.
  3. Asserts the expected HTTP status code and response body content.

COVERED CASES
-------------
  test_valid_telemetry          — completely valid payload → 200
  test_humidity_below_zero      — humidity = -5        → 422
  test_humidity_above_100       — humidity = 110       → 422
  test_invalid_latitude         — latitude = 95        → 422
  test_invalid_longitude        — longitude = 200      → 422
  test_temperature_too_low      — temperature = -50    → 422
  test_temperature_too_high     — temperature = 80     → 422
  test_empty_batch_id           — batch_id = ""        → 422
  test_empty_device_id          — device_id = ""       → 422
  test_invalid_timestamp        — timestamp = "not-a-date" → 422
  test_multiple_failures        — two bad fields at once → 422 with 2 failures
  test_validation_result_fields — verify response body structure on success
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

# ---------------------------------------------------------------------------
# One shared TestClient for all tests.
# Creating it once is fine because FastAPI apps are stateless — each request
# is independent.
# ---------------------------------------------------------------------------
client = TestClient(app)

# ---------------------------------------------------------------------------
# A reusable "golden" valid payload.
# Individual tests override only the field they want to break.
# ---------------------------------------------------------------------------
VALID_PAYLOAD = {
    "batch_id": "BATCH-2026-001",
    "device_id": "DEV-042",
    "latitude": 18.5204,
    "longitude": 73.8567,
    "temperature": 4.5,
    "humidity": 85.0,
    "timestamp": "2026-09-21T10:00:00Z",
}


# ===========================================================================
# Helper
# ===========================================================================

def post_telemetry(payload: dict):
    """POST payload to /telemetry and return the Response object."""
    return client.post("/telemetry", json=payload)


# ===========================================================================
# Happy-path test
# ===========================================================================

class TestValidTelemetry:
    def test_valid_telemetry_returns_200(self):
        """A completely valid payload must return HTTP 200."""
        response = post_telemetry(VALID_PAYLOAD)
        assert response.status_code == 200

    def test_valid_telemetry_response_structure(self):
        """The success response must contain the expected fields."""
        response = post_telemetry(VALID_PAYLOAD)
        body = response.json()
        assert body["status"] == "received"
        assert body["batch_id"] == VALID_PAYLOAD["batch_id"]
        assert body["device_id"] == VALID_PAYLOAD["device_id"]
        # Validation sub-object must be present and show passed=True
        assert body["validation"]["passed"] is True
        assert body["validation"]["stage"] == "basic_range_validation"


# ===========================================================================
# Humidity tests
# ===========================================================================

class TestHumidityValidation:
    def test_humidity_below_zero_returns_422(self):
        """humidity = -5 is physically impossible → 422."""
        payload = {**VALID_PAYLOAD, "humidity": -5.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_humidity_below_zero_failure_field(self):
        """
        The 422 body must identify 'humidity' as the failing field.

        NOTE: humidity has ge=0 in the Pydantic schema, so Pydantic catches
        this before our validator runs. Pydantic's 422 uses a *list* for
        detail (not our custom dict). We check the Pydantic 'loc' field.
        """
        payload = {**VALID_PAYLOAD, "humidity": -5.0}
        body = post_telemetry(payload).json()
        # Pydantic format: detail is a list of error dicts with a 'loc' key.
        detail = body["detail"]
        assert isinstance(detail, list), "Expected Pydantic error list"
        failed_fields = [err["loc"][-1] for err in detail]
        assert "humidity" in failed_fields

    def test_humidity_above_100_returns_422(self):
        """humidity = 110 exceeds 100% → 422."""
        payload = {**VALID_PAYLOAD, "humidity": 110.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_humidity_above_100_failure_field(self):
        """
        The 422 body must identify 'humidity' as the failing field.
        Same Pydantic list-format as below-zero case.
        """
        payload = {**VALID_PAYLOAD, "humidity": 110.0}
        body = post_telemetry(payload).json()
        detail = body["detail"]
        assert isinstance(detail, list), "Expected Pydantic error list"
        failed_fields = [err["loc"][-1] for err in detail]
        assert "humidity" in failed_fields

    def test_humidity_at_boundary_zero_is_valid(self):
        """humidity = 0.0 is on the boundary → must pass (200)."""
        payload = {**VALID_PAYLOAD, "humidity": 0.0}
        assert post_telemetry(payload).status_code == 200

    def test_humidity_at_boundary_100_is_valid(self):
        """humidity = 100.0 is on the boundary → must pass (200)."""
        payload = {**VALID_PAYLOAD, "humidity": 100.0}
        assert post_telemetry(payload).status_code == 200


# ===========================================================================
# Latitude tests
# ===========================================================================

class TestLatitudeValidation:
    def test_latitude_above_90_returns_422(self):
        """latitude = 95 is outside [-90, 90] → 422."""
        # NOTE: Pydantic schema also enforces ge/le on latitude,
        # so this may be caught at schema level (also 422). That is fine —
        # the status code is still 422 regardless of which layer caught it.
        payload = {**VALID_PAYLOAD, "latitude": 95.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_latitude_below_minus_90_returns_422(self):
        """latitude = -95 is outside [-90, 90] → 422."""
        payload = {**VALID_PAYLOAD, "latitude": -95.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_latitude_at_boundary_90_is_valid(self):
        """latitude = 90.0 is the exact upper boundary → must pass."""
        payload = {**VALID_PAYLOAD, "latitude": 90.0}
        assert post_telemetry(payload).status_code == 200

    def test_latitude_at_boundary_minus_90_is_valid(self):
        """latitude = -90.0 is the exact lower boundary → must pass."""
        payload = {**VALID_PAYLOAD, "latitude": -90.0}
        assert post_telemetry(payload).status_code == 200


# ===========================================================================
# Longitude tests
# ===========================================================================

class TestLongitudeValidation:
    def test_longitude_above_180_returns_422(self):
        """longitude = 200 is outside [-180, 180] → 422."""
        payload = {**VALID_PAYLOAD, "longitude": 200.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_longitude_below_minus_180_returns_422(self):
        """longitude = -200 is outside [-180, 180] → 422."""
        payload = {**VALID_PAYLOAD, "longitude": -200.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_longitude_at_boundary_180_is_valid(self):
        """longitude = 180.0 is the exact upper boundary → must pass."""
        payload = {**VALID_PAYLOAD, "longitude": 180.0}
        assert post_telemetry(payload).status_code == 200


# ===========================================================================
# Temperature tests
# ===========================================================================

class TestTemperatureValidation:
    def test_temperature_too_low_returns_422(self):
        """temperature = -50°C is below the -30°C cold-chain minimum → 422."""
        payload = {**VALID_PAYLOAD, "temperature": -50.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_temperature_too_low_failure_field(self):
        """The 422 body must identify 'temperature' as the failing field."""
        payload = {**VALID_PAYLOAD, "temperature": -50.0}
        body = post_telemetry(payload).json()
        failed_fields = [f["field"] for f in body["detail"]["failures"]]
        assert "temperature" in failed_fields

    def test_temperature_too_high_returns_422(self):
        """temperature = 80°C exceeds the 60°C cold-chain maximum → 422."""
        payload = {**VALID_PAYLOAD, "temperature": 80.0}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_temperature_too_high_failure_field(self):
        """The 422 body must identify 'temperature' as the failing field."""
        payload = {**VALID_PAYLOAD, "temperature": 80.0}
        body = post_telemetry(payload).json()
        failed_fields = [f["field"] for f in body["detail"]["failures"]]
        assert "temperature" in failed_fields

    def test_temperature_at_minimum_boundary_is_valid(self):
        """temperature = -30°C is the exact lower boundary → must pass."""
        payload = {**VALID_PAYLOAD, "temperature": -30.0}
        assert post_telemetry(payload).status_code == 200

    def test_temperature_at_maximum_boundary_is_valid(self):
        """temperature = 60°C is the exact upper boundary → must pass."""
        payload = {**VALID_PAYLOAD, "temperature": 60.0}
        assert post_telemetry(payload).status_code == 200


# ===========================================================================
# batch_id and device_id tests
# ===========================================================================

class TestIdentifierValidation:
    def test_empty_batch_id_returns_422(self):
        """batch_id = '' is an empty string → 422."""
        payload = {**VALID_PAYLOAD, "batch_id": ""}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_empty_batch_id_failure_field(self):
        """The 422 body must identify 'batch_id' as the failing field."""
        payload = {**VALID_PAYLOAD, "batch_id": ""}
        body = post_telemetry(payload).json()
        failed_fields = [f["field"] for f in body["detail"]["failures"]]
        assert "batch_id" in failed_fields

    def test_whitespace_batch_id_returns_422(self):
        """batch_id = '   ' (whitespace only) is semantically empty → 422."""
        payload = {**VALID_PAYLOAD, "batch_id": "   "}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_empty_device_id_returns_422(self):
        """device_id = '' is an empty string → 422."""
        payload = {**VALID_PAYLOAD, "device_id": ""}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_empty_device_id_failure_field(self):
        """The 422 body must identify 'device_id' as the failing field."""
        payload = {**VALID_PAYLOAD, "device_id": ""}
        body = post_telemetry(payload).json()
        failed_fields = [f["field"] for f in body["detail"]["failures"]]
        assert "device_id" in failed_fields

    def test_whitespace_device_id_returns_422(self):
        """device_id = '   ' (whitespace only) is semantically empty → 422."""
        payload = {**VALID_PAYLOAD, "device_id": "   "}
        response = post_telemetry(payload)
        assert response.status_code == 422


# ===========================================================================
# Timestamp tests
# ===========================================================================

class TestTimestampValidation:
    def test_invalid_timestamp_returns_422(self):
        """A non-datetime string for timestamp → Pydantic raises 422."""
        payload = {**VALID_PAYLOAD, "timestamp": "not-a-date"}
        response = post_telemetry(payload)
        assert response.status_code == 422

    def test_missing_timestamp_returns_422(self):
        """Omitting timestamp entirely → Pydantic raises 422."""
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "timestamp"}
        response = post_telemetry(payload)
        assert response.status_code == 422


# ===========================================================================
# Multi-failure test
# ===========================================================================

class TestMultipleFailures:
    def test_two_bad_fields_returns_two_failures(self):
        """
        If both temperature AND batch_id are invalid, the response must list
        both failures (not just the first one).

        We use temperature + batch_id (empty string) rather than
        temperature + humidity because humidity is caught by Pydantic's
        ge/le constraint before our validator runs (which would produce a
        list-format detail rather than our custom dict format). Temperature
        and batch_id are both validated by our validator, so we get our
        structured failures dict with a 'failures' list.
        """
        payload = {**VALID_PAYLOAD, "temperature": 200.0, "batch_id": ""}
        response = post_telemetry(payload)
        assert response.status_code == 422
        body = response.json()
        # Our validator produces: {"detail": {"failures": [...], ...}}
        assert isinstance(body["detail"], dict), (
            "Expected our custom validator error dict, not Pydantic list"
        )
        failed_fields = [f["field"] for f in body["detail"]["failures"]]
        assert "temperature" in failed_fields
        assert "batch_id" in failed_fields
        assert len(body["detail"]["failures"]) == 2
