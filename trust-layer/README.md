# AgriChain — AI Pre-Chain Trust Layer

> **Pre-Chain Oracle Gatekeeper: Validates IoT Telemetry using Machine Learning & Cryptographic Integrity before On-Chain Anchoring.**

---

## 1. Overview & Pipeline

The **AI Trust Layer** sits between IoT sensor devices and the blockchain. It prevents corrupt, implausible, or spoofed sensor data from consuming on-chain gas or entering immutable storage.

```
IoT Sensors / Telemetry Simulator
              │
              ▼
    [ AI Trust Pipeline ]
      1. Schema & Bound Validation (Pydantic models & static crop boundaries)
      2. Physical & Temporal Plausibility (Haversine GPS velocity, max rate-of-change, sequence)
      3. 11-D Feature Engineering (Dynamic rolling vectors, temperature/humidity acceleration)
      4. ML Anomaly Detection (Unsupervised Isolation Forest, F1 = 0.9722)
      5. Cryptographic Integrity (Canonical SHA-256 fingerprinting & replay detection)
      6. Verdict & Disposition Engine:
           ├── VALID + READY_FOR_ORACLE ──► Downstream Oracle / ColdChainMonitor.sol
           └── ANOMALOUS + QUARANTINED ───► IsoLog SHA-256 Hash-Chained Quarantine Log
```

---

## 2. Decision Matrix & Eligibility Gate

| Verdict | Disposition | Oracle Action | System Response |
|---|---|---|---|
| **`VALID`** | **`READY_FOR_ORACLE`** | **Approved** | Batched for on-chain commit via `ColdChainMonitor.recordConditionsBatch` |
| **`ANOMALOUS`** | **`QUARANTINED`** | **Rejected** | Persisted to off-chain quarantine audit log with reason codes |
| **`INSUFFICIENT_EVIDENCE`**| **`ON_HOLD`** | **Rejected** | Held pending historical sequence points |
| Any mismatch / Tamper | Tampered | **Rejected** | Triggers circuit breaker and security alert |

---

## 3. Directory Layout

```
trust-layer/
├── app/
│   ├── main.py                   FastAPI service entry point
│   ├── config.py                 Hyperparameters & thresholds
│   ├── schemas/                  Pydantic data models (telemetry, features, verdict, oracle handoff v1.0)
│   ├── routers/                  Telemetry ingestion, health, and benchmark routes
│   └── services/                 Range check, plausibility, feature extractor, Isolation Forest, simulator
├── tests/                        147 unit & integration tests covering all validation stages
└── requirements.txt
```

---

## 4. Running the Tests

```bash
# Run complete AI Trust Layer test suite (147 tests)
pytest trust-layer/tests/ -v
```
