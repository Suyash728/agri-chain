"""
tests/test_simulator.py
-----------------------
Unit and integration tests for Phase 9 — Telemetry Simulator + Fault Injection.

Tests cover:
  1. Normal Sequence Generation:
     - Correct number of readings generated
     - Required telemetry fields populated
     - Strictly increasing timestamps
     - GPS movement stays within realistic bounds
     - Telemetry values remain within valid schema ranges
  2. Reproducibility & Determinism:
     - Identical random_seed produces identical telemetry sequences
     - Different random_seed produces variations
  3. Controlled Fault Injection Unit Tests:
     - Temperature spike mutates target point while keeping others intact
     - Humidity spike mutates target point while keeping others intact
     - GPS jump mutates coordinates
     - Timestamp out-of-order creates regressive timestamp
     - Replay reuses an exact earlier reading and preserves its SHA-256 event hash
     - Telemetry gap creates large time delta
     - Combined fault injects multiple anomalies
  4. End-to-End Real Pipeline Integration Tests (POST /telemetry):
     - Normal sequence evaluated against trained pipeline yields VALID -> READY_FOR_ORACLE
     - GPS jump evaluated yields GPS_SPEED_EXCEEDED -> ANOMALOUS -> QUARANTINED
     - Replay evaluated yields REPLAY_DETECTED -> ANOMALOUS -> QUARANTINED
     - Temperature spike evaluated yields TEMPERATURE_RATE_EXCEEDED -> ANOMALOUS -> QUARANTINED
     - Telemetry gap evaluated yields TELEMETRY_GAP_EXCEEDED -> ANOMALOUS -> QUARANTINED
     - Timestamp out-of-order evaluated yields TIMESTAMP_OUT_OF_ORDER -> ANOMALOUS -> QUARANTINED
  5. Development API Endpoint:
     - POST /telemetry/simulate with evaluate_pipeline=False
     - POST /telemetry/simulate with evaluate_pipeline=True
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.simulation import FaultConfig, FaultType, SimulationConfig
from app.services.anomaly_detector import anomaly_detector
from app.services.audit import audit_service
from app.services.history import history_repository
from app.services.integrity import compute_event_hash, replay_repository
from app.services.simulator import telemetry_simulator

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_pipeline_stores():
    """Guarantee store isolation before and after every test."""
    history_repository.clear()
    replay_repository.clear()
    audit_service.clear()
    anomaly_detector.clear_model()
    yield
    history_repository.clear()
    replay_repository.clear()
    audit_service.clear()
    anomaly_detector.clear_model()


@pytest.fixture
def trained_detector():
    """Trains the anomaly detector with normal baseline features."""
    baseline = [
        [4.0, 85.0, 18.5204, 73.8567, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        [4.1, 85.1, 18.5205, 73.8568, 0.1, 0.1, 0.1, 0.1, 0.01, 0.6, 60.0],
        [4.2, 84.9, 18.5206, 73.8569, 0.1, 0.1, -0.2, -0.2, 0.015, 0.9, 60.0],
        [3.9, 85.2, 18.5207, 73.8570, -0.3, -0.3, 0.3, 0.3, 0.01, 0.6, 60.0],
        [4.0, 85.0, 18.5208, 73.8571, 0.1, 0.1, -0.2, -0.2, 0.012, 0.72, 60.0],
        [4.1, 85.0, 18.5209, 73.8572, 0.1, 0.1, 0.0, 0.0, 0.01, 0.6, 60.0],
    ]
    anomaly_detector.fit(baseline)
    return anomaly_detector


# ===========================================================================
# 1. Normal Sequence Generation Tests
# ===========================================================================

def test_generate_normal_sequence_basic_properties():
    cfg = SimulationConfig(
        device_id="DEV-SIM-TEST",
        batch_id="BATCH-SIM-TEST",
        num_readings=15,
        time_step_seconds=60.0,
        start_lat=18.5204,
        start_lon=73.8567,
        start_temp=4.0,
        start_humidity=85.0,
        speed_kmh=45.0,
        random_seed=123,
    )
    readings = telemetry_simulator.generate_normal_sequence(cfg)

    assert len(readings) == 15
    for r in readings:
        assert r.device_id == "DEV-SIM-TEST"
        assert r.batch_id == "BATCH-SIM-TEST"
        assert -90.0 <= r.latitude <= 90.0
        assert -180.0 <= r.longitude <= 180.0
        assert 0.0 <= r.humidity <= 100.0
        assert -30.0 <= r.temperature <= 60.0

    # Verify timestamps are strictly increasing
    for i in range(1, len(readings)):
        delta = (readings[i].timestamp - readings[i - 1].timestamp).total_seconds()
        assert delta == 60.0


def test_simulation_reproducibility_with_seed():
    cfg1 = SimulationConfig(num_readings=10, random_seed=999)
    cfg2 = SimulationConfig(num_readings=10, random_seed=999)
    cfg3 = SimulationConfig(num_readings=10, random_seed=888)

    seq1 = telemetry_simulator.generate_normal_sequence(cfg1)
    seq2 = telemetry_simulator.generate_normal_sequence(cfg2)
    seq3 = telemetry_simulator.generate_normal_sequence(cfg3)

    # Identical seed must produce exactly identical sequences
    for r1, r2 in zip(seq1, seq2):
        assert r1.model_dump() == r2.model_dump()

    # Different seed must produce distinct readings
    assert [r.temperature for r in seq1] != [r.temperature for r in seq3]


# ===========================================================================
# 2. Fault Injection Unit Tests
# ===========================================================================

def test_fault_temperature_spike():
    cfg = SimulationConfig(num_readings=5, random_seed=42)
    baseline = telemetry_simulator.generate_normal_sequence(cfg)

    fault = FaultConfig(
        fault_type=FaultType.TEMPERATURE_SPIKE,
        position=3,
        params={"temp_delta": 20.0},
    )
    faulty = telemetry_simulator.inject_fault(baseline, fault)

    assert len(faulty) == 5
    # Target reading modified by +20.0
    assert faulty[3].temperature == round(baseline[3].temperature + 20.0, 2)
    # Surrounding readings unaffected
    assert faulty[2].temperature == baseline[2].temperature
    assert faulty[4].temperature == baseline[4].temperature


def test_fault_humidity_spike():
    cfg = SimulationConfig(num_readings=5, random_seed=42)
    baseline = telemetry_simulator.generate_normal_sequence(cfg)

    fault = FaultConfig(
        fault_type=FaultType.HUMIDITY_SPIKE,
        position=2,
        params={"humidity_delta": -40.0},
    )
    faulty = telemetry_simulator.inject_fault(baseline, fault)

    assert len(faulty) == 5
    assert faulty[2].humidity == round(max(0.0, baseline[2].humidity - 40.0), 2)
    assert faulty[1].humidity == baseline[1].humidity


def test_fault_gps_jump():
    cfg = SimulationConfig(num_readings=5, random_seed=42)
    baseline = telemetry_simulator.generate_normal_sequence(cfg)

    fault = FaultConfig(
        fault_type=FaultType.GPS_JUMP,
        position=4,
        params={"lat_offset": 8.0, "lon_offset": 5.0},
    )
    faulty = telemetry_simulator.inject_fault(baseline, fault)

    assert faulty[4].latitude == round(baseline[4].latitude + 8.0, 6)
    assert faulty[4].longitude == round(baseline[4].longitude + 5.0, 6)
    assert faulty[3].latitude == baseline[3].latitude


def test_fault_timestamp_out_of_order():
    cfg = SimulationConfig(num_readings=5, random_seed=42)
    baseline = telemetry_simulator.generate_normal_sequence(cfg)

    fault = FaultConfig(
        fault_type=FaultType.TIMESTAMP_OUT_OF_ORDER,
        position=3,
        params={"regress_seconds": 300.0},
    )
    faulty = telemetry_simulator.inject_fault(baseline, fault)

    # Reading 3 must be strictly earlier than reading 2
    assert faulty[3].timestamp < faulty[2].timestamp
    delta = (faulty[2].timestamp - faulty[3].timestamp).total_seconds()
    assert delta == 300.0


def test_fault_replay_duplicate_hash():
    cfg = SimulationConfig(num_readings=5, random_seed=42)
    baseline = telemetry_simulator.generate_normal_sequence(cfg)

    fault = FaultConfig(
        fault_type=FaultType.REPLAY,
        position=3,
        params={"replay_source_index": 1},
    )
    faulty = telemetry_simulator.inject_fault(baseline, fault)

    # Position 3 must be identical to position 1
    assert faulty[3].model_dump() == faulty[1].model_dump()
    # Canonical SHA-256 event hash must match exactly
    assert compute_event_hash(faulty[3]) == compute_event_hash(faulty[1])


def test_fault_telemetry_gap():
    cfg = SimulationConfig(num_readings=5, random_seed=42)
    baseline = telemetry_simulator.generate_normal_sequence(cfg)

    fault = FaultConfig(
        fault_type=FaultType.TELEMETRY_GAP,
        position=3,
        params={"gap_seconds": 7200.0},
    )
    faulty = telemetry_simulator.inject_fault(baseline, fault)

    gap = (faulty[3].timestamp - faulty[2].timestamp).total_seconds()
    assert gap == 7200.0


def test_fault_combined():
    cfg = SimulationConfig(num_readings=5, random_seed=42)
    baseline = telemetry_simulator.generate_normal_sequence(cfg)

    fault = FaultConfig(
        fault_type=FaultType.COMBINED,
        position=3,
        params={"temp_delta": 15.0, "lat_offset": 6.0},
    )
    faulty = telemetry_simulator.inject_fault(baseline, fault)

    # Both temperature and GPS are modified
    assert faulty[3].temperature == round(baseline[3].temperature + 15.0, 2)
    assert faulty[3].latitude == round(baseline[3].latitude + 6.0, 6)


# ===========================================================================
# 3. End-to-End Pipeline Integration Tests
# ===========================================================================

def test_pipeline_normal_sequence(trained_detector):
    """Simulated normal readings passed to POST /telemetry must evaluate to VALID -> READY_FOR_ORACLE."""
    cfg = SimulationConfig(num_readings=3, random_seed=42, time_step_seconds=60.0)
    readings = telemetry_simulator.generate_normal_sequence(cfg)

    responses = []
    for r in readings:
        resp = client.post("/telemetry", json=r.model_dump(mode="json"))
        assert resp.status_code == 200
        responses.append(resp.json())

    # Reading 2 and 3 have history context and normal ML baseline -> VALID & READY_FOR_ORACLE
    last_audit = responses[-1]["audit"]
    assert last_audit["verdict"] == "VALID"
    assert last_audit["disposition"] == "READY_FOR_ORACLE"
    assert last_audit["reason_codes"] == []


def test_pipeline_detects_injected_gps_jump():
    """Injected GPS jump must trigger GPS_SPEED_EXCEEDED -> ANOMALOUS -> QUARANTINED."""
    cfg = SimulationConfig(
        num_readings=3,
        random_seed=42,
        faults=[FaultConfig(fault_type=FaultType.GPS_JUMP, position=2, params={"lat_offset": 5.0})],
    )
    sequence = telemetry_simulator.generate_sequence(cfg)

    responses = []
    for r in sequence:
        resp = client.post("/telemetry", json=r.model_dump(mode="json"))
        assert resp.status_code == 200
        responses.append(resp.json())

    target_audit = responses[2]["audit"]
    assert target_audit["verdict"] == "ANOMALOUS"
    assert target_audit["disposition"] == "QUARANTINED"
    assert "GPS_SPEED_EXCEEDED" in target_audit["reason_codes"]


def test_pipeline_detects_injected_replay():
    """Injected replay must trigger REPLAY_DETECTED -> ANOMALOUS -> QUARANTINED."""
    cfg = SimulationConfig(
        num_readings=3,
        random_seed=42,
        faults=[FaultConfig(fault_type=FaultType.REPLAY, position=2, params={"replay_source_index": 0})],
    )
    sequence = telemetry_simulator.generate_sequence(cfg)

    responses = []
    for r in sequence:
        resp = client.post("/telemetry", json=r.model_dump(mode="json"))
        assert resp.status_code == 200
        responses.append(resp.json())

    target_audit = responses[2]["audit"]
    assert target_audit["verdict"] == "ANOMALOUS"
    assert target_audit["disposition"] == "QUARANTINED"
    assert "REPLAY_DETECTED" in target_audit["reason_codes"]


def test_pipeline_detects_injected_temperature_spike():
    """Injected temperature spike must trigger TEMPERATURE_RATE_EXCEEDED -> ANOMALOUS -> QUARANTINED."""
    cfg = SimulationConfig(
        num_readings=3,
        random_seed=42,
        faults=[FaultConfig(fault_type=FaultType.TEMPERATURE_SPIKE, position=1, params={"temp_delta": 15.0})],
    )
    sequence = telemetry_simulator.generate_sequence(cfg)

    responses = []
    for r in sequence:
        resp = client.post("/telemetry", json=r.model_dump(mode="json"))
        assert resp.status_code == 200
        responses.append(resp.json())

    target_audit = responses[1]["audit"]
    assert target_audit["verdict"] == "ANOMALOUS"
    assert target_audit["disposition"] == "QUARANTINED"
    assert "TEMPERATURE_RATE_EXCEEDED" in target_audit["reason_codes"]


def test_pipeline_detects_injected_telemetry_gap():
    """Injected telemetry gap must trigger TELEMETRY_GAP_EXCEEDED -> ANOMALOUS -> QUARANTINED."""
    cfg = SimulationConfig(
        num_readings=3,
        random_seed=42,
        faults=[FaultConfig(fault_type=FaultType.TELEMETRY_GAP, position=2, params={"gap_seconds": 7200.0})],
    )
    sequence = telemetry_simulator.generate_sequence(cfg)

    responses = []
    for r in sequence:
        resp = client.post("/telemetry", json=r.model_dump(mode="json"))
        assert resp.status_code == 200
        responses.append(resp.json())

    target_audit = responses[2]["audit"]
    assert target_audit["verdict"] == "ANOMALOUS"
    assert target_audit["disposition"] == "QUARANTINED"
    assert "TELEMETRY_GAP_EXCEEDED" in target_audit["reason_codes"]


def test_pipeline_detects_injected_timestamp_out_of_order():
    """Injected out-of-order timestamp must trigger TIMESTAMP_OUT_OF_ORDER -> ANOMALOUS -> QUARANTINED."""
    cfg = SimulationConfig(
        num_readings=3,
        random_seed=42,
        faults=[FaultConfig(fault_type=FaultType.TIMESTAMP_OUT_OF_ORDER, position=1, params={"regress_seconds": 300.0})],
    )
    sequence = telemetry_simulator.generate_sequence(cfg)

    responses = []
    for r in sequence:
        resp = client.post("/telemetry", json=r.model_dump(mode="json"))
        assert resp.status_code == 200
        responses.append(resp.json())

    target_audit = responses[1]["audit"]
    assert target_audit["verdict"] == "ANOMALOUS"
    assert target_audit["disposition"] == "QUARANTINED"
    assert "TIMESTAMP_OUT_OF_ORDER" in target_audit["reason_codes"]


# ===========================================================================
# 4. Simulation API Endpoint Tests
# ===========================================================================

def test_api_simulate_endpoint_without_eval():
    payload = {
        "num_readings": 5,
        "random_seed": 42,
        "faults": [],
    }
    resp = client.post("/telemetry/simulate?evaluate_pipeline=false", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["total_readings"] == 5
    assert data["faults_injected"] == 0
    assert len(data["readings"]) == 5
    assert data["pipeline_results"] is None


def test_api_simulate_endpoint_with_eval():
    payload = {
        "num_readings": 3,
        "random_seed": 42,
        "faults": [
            {
                "fault_type": "GPS_JUMP",
                "position": 2,
                "params": {"lat_offset": 6.0},
            }
        ],
    }
    resp = client.post("/telemetry/simulate?evaluate_pipeline=true", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["total_readings"] == 3
    assert data["faults_injected"] == 1
    assert data["pipeline_results"] is not None
    assert len(data["pipeline_results"]) == 3

    # Third reading in pipeline_results had GPS Jump -> ANOMALOUS
    res3 = data["pipeline_results"][2]
    assert res3["verdict"]["verdict"] == "ANOMALOUS"
    assert "GPS_SPEED_EXCEEDED" in res3["verdict"]["reason_codes"]
    assert res3["audit"]["disposition"] == "QUARANTINED"
