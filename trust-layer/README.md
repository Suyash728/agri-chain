# AgriChain — AI Trust Layer

> **B.Tech Project**: Blockchain Traceability with an AI Trust Layer
> **Current Phase**: Phase 10 — AI Trust Layer → Oracle Handoff Interface ✅

---

## What is the AI Trust Layer?

The **AI Trust Layer** sits between the IoT sensor network and the blockchain in an agricultural supply chain system. Its job is to act as a gatekeeper:

- IoT devices (sensors attached to refrigerated trucks, cold-storage warehouses, dark stores, etc.) continuously emit telemetry — temperature, humidity, GPS location, and timestamps.
- The AI Trust Layer validates payload schema, checks physical plausibility, extracts dynamic time-series features, evaluates telemetry with an unsupervised Isolation Forest ML model, checks cryptographic payload integrity & replay state, computes an explainable **Trust Verdict** (`VALID`, `ANOMALOUS`, or `INSUFFICIENT_EVIDENCE`), and assigns an immutable operational **Audit Disposition** (`READY_FOR_ORACLE`, `QUARANTINED`, or `ON_HOLD`).
- **Phase 9** provides a synthetic telemetry simulation and controlled fault injection framework to test and evaluate the entire pipeline end-to-end without physical hardware.
- **Phase 10** provides a clean, stable handoff contract (`OracleHandoffPayload`, schema v1.0) and interface that downstream blockchain/Oracle components can consume. Only verified events satisfying `verdict == VALID` and `disposition == READY_FOR_ORACLE` are approved for handoff.

```
IoT Sensors / Telemetry Simulator (Phase 9)
    │
    ▼
AI Trust Layer  ◄─── This project
    │
    ├── Phase 1: Schema Validation (Pydantic)
    ├── Phase 2: Basic Range Validation (Static bounds)
    ├── Phase 3: Physical & Temporal Plausibility (Historical sequence evidence)
    ├── Phase 4: Time-Series Feature Engineering (Dynamic 11-D feature vector)
    ├── Phase 5: ML Anomaly Detection — Isolation Forest (Unsupervised statistical outlier detection)
    ├── Phase 6: Integrity & Replay Detection (SHA-256 fingerprinting, replay checks, sequence tracking)
    ├── Phase 7: Trust/Verdict Engine (Deterministic aggregation & explainable decision rules)
    ├── Phase 8: Quarantine & Audit Trail (Immutable off-chain audit logs & operational dispositions)
    │    │
    │    ├── QUARANTINED ───────────────► Off-chain Quarantine Inspection
    │    └── ON_HOLD ───────────────────► Pending Evidence Collection
    │
    └── Phase 10: Oracle Handoff Interface (Clean data contract v1.0)
         │
         └── VALID + READY_FOR_ORACLE ──► Downstream Oracle / Blockchain Layer
```

> **IMPORTANT DISTINCTION**: The verdict `VALID` indicates that the currently implemented basic, physical, ML, and cryptographic integrity checks found no confirmed anomalies and that required evidence was fully available. It is not an arbitrary numerical "trust score" or mathematical proof of physical ground truth.

---

## Phase History

| Phase | Status | What it does |
|-------|--------|-------------|
| **Phase 1** | ✅ Complete | FastAPI foundation — schema validation, health endpoint |
| **Phase 2** | ✅ Complete | Basic range validation — rejects out-of-range sensor values |
| **Phase 3** | ✅ Complete | Physical & temporal plausibility (GPS speed, temp/humidity rate of change, timestamp sequence checks) |
| **Phase 4** | ✅ Complete | Time-series feature engineering (deltas, rates, velocities, elapsed times, feature vectors) |
| **Phase 5** | ✅ Complete | ML anomaly detection — unsupervised Isolation Forest with scikit-learn |
| **Phase 6** | ✅ Complete | Telemetry integrity & replay detection (SHA-256 fingerprinting, duplicate detection, sequence tracking) |
| **Phase 7** | ✅ Complete | Trust/Verdict Engine — deterministic evidence aggregation & explainable decision rules |
| **Phase 8** | ✅ Complete | Off-chain quarantine & audit trail — immutable records, operational dispositions, query endpoints |
| **Phase 9** | ✅ Complete | Telemetry simulator & fault injection — synthetic generation, controlled anomalies, reproducibility |
| **Phase 10** | ✅ Complete | AI Trust Layer → Oracle handoff interface — stable contract v1.0, strict eligibility gate |

---

## Phase 10: Oracle Handoff Interface

Phase 10 establishes the boundary contract between this AI Trust Layer and the teammate's downstream Oracle/blockchain module:

### 1. Responsibility Boundary

- **AI Trust Layer Guarantees**:
  - Telemetry passed all schema, physical, ML, and cryptographic integrity checks.
  - Preserves exact canonical SHA-256 `event_hash` from Phase 6.
  - Enforces strict eligibility: `verdict == VALID` and `disposition == READY_FOR_ORACLE`.
  - Conforms to stable schema version `1.0`.
- **Downstream Oracle/Blockchain Responsibilities**:
  - Transaction submission, gas fees, wallet signatures, Polygon network confirmations, smart contract execution, and on-chain immutability.
- **Zero Blockchain Side-Effects**: This AI module contains no Web3, Solidity, MetaMask, or mock blockchain transaction calls.

### 2. Strict Eligibility Policy

| Verdict | Disposition | Oracle Handoff Result |
|---|---|---|
| **`VALID`** | **`READY_FOR_ORACLE`** | **APPROVED** $\to$ Returns `OracleHandoffPayload` (HTTP 200) |
| **`ANOMALOUS`** | **`QUARANTINED`** | **REJECTED** $\to$ Raises `OracleHandoffIneligibleError` (HTTP 400) |
| **`INSUFFICIENT_EVIDENCE`** | **`ON_HOLD`** | **REJECTED** $\to$ Raises `OracleHandoffIneligibleError` (HTTP 400) |
| Any tampered combination | Any mismatch | **REJECTED** $\to$ Raises `OracleHandoffIneligibleError` (HTTP 400) |

---

## Project Structure

```
AgriChain-AI-Trust-Layer/
│
├── app/
│   ├── main.py                   ← FastAPI entry point (v0.10.0)
│   ├── config.py                 ← Configuration & ML hyperparameters
│   │
│   ├── schemas/
│   │   ├── telemetry.py          ← TelemetryPayload Pydantic schema
│   │   ├── validation.py         ← ValidationResult and FieldFailure models
│   │   ├── plausibility.py       ← PlausibilityResult and PlausibilityCheckResult models
│   │   ├── policy.py             ← CropPolicy schema interface
│   │   ├── features.py           ← TelemetryFeatures model and vector generator
│   │   ├── anomaly.py            ← AnomalyResult schema
│   │   ├── integrity.py          ← IntegrityResult and IntegrityCheckResult schemas
│   │   ├── verdict.py            ← VerdictResult and VerdictEvidence schemas
│   │   ├── audit.py              ← AuditRecord schema and disposition states
│   │   ├── simulation.py         ← SimulationConfig, FaultConfig, FaultType schemas
│   │   └── oracle.py             ← OracleHandoffPayload, OracleHandoffRejection schemas
│   │
│   ├── routers/
│   │   ├── health.py             ← GET /health
│   │   └── telemetry.py          ← Ingestion, simulation, quarantine, audit, and oracle-handoff endpoints
│   │
│   └── services/
│       ├── validator.py          ← Phase 2: Basic range validation
│       ├── history.py            ← Phase 3: Telemetry history repository
│       ├── plausibility.py       ← Phase 3: Physical & temporal plausibility checks
│       ├── features.py           ← Phase 4: Time-series feature extraction service
│       ├── anomaly_detector.py   ← Phase 5: Isolation Forest ML anomaly detector
│       ├── integrity.py          ← Phase 6: Canonicalization, hashing, replay & authentication
│       ├── verdict.py            ← Phase 7: Trust/Verdict Engine
│       ├── audit.py              ← Phase 8: Off-chain quarantine & audit trail repository
│       ├── simulator.py          ← Phase 9: Telemetry simulator & fault injection engine
│       └── oracle_handoff.py     ← Phase 10: Oracle handoff interface and eligibility service
│
├── tests/
│   ├── test_validation.py        ← Phase 2 range validation tests (30 tests)
│   ├── test_plausibility.py      ← Phase 3 physical/temporal tests (13 tests)
│   ├── test_features.py          ← Phase 4 feature engineering tests (11 tests)
│   ├── test_anomaly.py           ← Phase 5 Isolation Forest ML tests (11 tests)
│   ├── test_integrity.py         ← Phase 6 integrity & replay detection tests (12 tests)
│   ├── test_verdict.py           ← Phase 7 Trust/Verdict Engine tests (14 tests)
│   ├── test_audit.py             ← Phase 8 Quarantine & Audit Trail tests (12 tests)
│   ├── test_simulator.py         ← Phase 9 Simulator & Fault Injection tests (17 tests)
│   └── test_oracle_handoff.py    ← Phase 10 Oracle Handoff Interface tests (12 tests)
│
├── requirements.txt
└── README.md
```

---

## Running the Server & Tests

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run All Tests

```bash
pytest tests/ -v
```

Expected output: **132 passed** (30 Phase 2 + 13 Phase 3 + 11 Phase 4 + 11 Phase 5 + 12 Phase 6 + 14 Phase 7 + 12 Phase 8 + 17 Phase 9 + 12 Phase 10).

### 3. Start Application Server

```bash
uvicorn app.main:app --reload
```

---

## API Reference & Examples

### GET /telemetry/oracle-handoff/{event_hash}

#### Response for Approved Event (`VALID` + `READY_FOR_ORACLE`)

```json
{
  "schema_version": "1.0",
  "event_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
  "batch_id": "BATCH-2026-001",
  "device_id": "DEV-042",
  "timestamp": "2026-09-21T10:02:00+00:00",
  "latitude": 18.525,
  "longitude": 73.8567,
  "temperature": 4.8,
  "humidity": 84.0,
  "verdict": "VALID",
  "disposition": "READY_FOR_ORACLE",
  "reason_codes": [],
  "anomaly_score": 0.1842,
  "approved_at": "2026-09-21T10:02:00.654321+00:00",
  "notes": "Approved for downstream Oracle handoff."
}
```

#### Complete AI Trust Layer Response (with Verdict & Audit Record)

```json
{
  "status": "received",
  "message": "Telemetry ingested, evaluated across AI trust pipeline, and recorded in audit trail.",
  "batch_id": "BATCH-2026-001",
  "device_id": "DEV-042",
  "timestamp": "2026-09-21T10:02:00+00:00",
  "validation": { "stage": "basic_range_validation", "passed": true },
  "plausibility": { "plausible": true, "stage": "physical_temporal_plausibility", "checks": [...] },
  "features": {
    "temperature": 4.8,
    "humidity": 84.0,
    "latitude": 18.525,
    "longitude": 73.8567,
    "temperature_change": 0.3,
    "temperature_rate": 0.15,
    "humidity_change": -1.0,
    "humidity_rate": -0.5,
    "distance_from_previous": 0.512,
    "implied_speed": 15.36,
    "time_since_previous": 120.0
  },
  "anomaly_detection": {
    "status": "NORMAL",
    "prediction": 1,
    "anomaly_score": 0.1842,
    "model": "IsolationForest"
  },
  "integrity": {
    "status": "VALID",
    "event_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "replay_detected": false,
    "authenticated": true
  },
  "verdict": {
    "verdict": "VALID",
    "reason_codes": [],
    "details": "All physical, temporal, ML, and integrity trust checks passed successfully."
  },
  "audit": {
    "audit_id": "c71a3962-e939-4469-8094-35805e26922b",
    "batch_id": "BATCH-2026-001",
    "device_id": "DEV-042",
    "timestamp": "2026-09-21T10:02:00+00:00",
    "event_hash": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
    "verdict": "VALID",
    "disposition": "READY_FOR_ORACLE",
    "reason_codes": [],
    "anomaly_score": 0.1842,
    "processed_at": "2026-09-21T10:02:00.123456+00:00",
    "details": "Telemetry verified across all trust layers and ready for blockchain Oracle transmission."
  }
}
```
