# AgriChain — AI Pre-Chain Trust Layer

Validates IoT telemetry before anything is anchored on-chain, so corrupt, implausible or replayed readings don't reach immutable storage. The backend imports this package directly (`backend/routers/telemetry.py`). More context is in [`../CLAUDE.md`](../CLAUDE.md) §8.

## Pipeline
```
reading ─► 1. schema & range checks (physical bounds, crop policy)
        ─► 2. plausibility (Haversine speed, temperature/humidity rate of change, timestamp order)
        ─► 3. 11-D feature vector (values, deltas, rates, distance, speed, time gap)
        ─► 4. Isolation Forest anomaly score
        ─► 5. integrity & replay detection (canonical SHA-256 fingerprint)
        ─► 6. verdict: VALID · BREACH (genuine policy violation, still anchored) · ANOMALOUS (quarantined) · INSUFFICIENT_EVIDENCE
```
Quarantined readings go into the backend's IsoLog hash chain (`GET /quarantine/verify-integrity`).

## Layout
```
trust-layer/
├── app/
│   ├── config.py      Thresholds, hyperparameters, SQLITE_DB_PATH
│   ├── schemas/       Telemetry, features, verdict, evaluation models
│   ├── routers/       Standalone FastAPI routes (health, telemetry)
│   └── services/      validator, plausibility, features, anomaly_detector, integrity, verdict, simulator, evaluation
├── tests/             147 tests
└── reports/figures/   Regenerated benchmark summary and charts
```

## Tests
```bash
cp backend/agrichain.db /tmp/tl.db && SQLITE_DB_PATH=/tmp/tl.db pytest trust-layer/tests/   # 147 passing
```
The suite writes to the database at `SQLITE_DB_PATH` (default `backend/agrichain.db`) and rewrites `reports/figures/benchmark_summary.*`, so point it at a copy.

## Evaluation (reproduced 2026-11-18)
`EvaluationService.run_pipeline_evaluation` covers seven fault types:
- temperature spike, humidity spike, GPS jump, timestamp disorder, replay, gap, combined;
- each injected at the last of 5 simulated readings.

| Config | Precision | Recall | F1 | False-positive rate (normal data) |
|---|---|---|---|---|
| Default (seed 42, 5 sequences per fault) | 94.59% | 100% | 0.9722 | **40%** |
| 20 sequences per fault | 95.24% | 100% | 0.9756 | 35% |
| **Isolation Forest disabled** | 100% | 100% | **1.000** | **0%** |

**The rules catch every synthetic fault; the Isolation Forest only adds false positives.** Its features include absolute latitude, longitude and temperature, and it is trained on 40 simulated readings, so real-device data is flagged almost every time. Next steps:
- rate/delta-only features;
- evaluation on real device traces;
- treating the model as advisory until it beats the rules alone.
