# Track B – AI Trust Layer (Owner: TRACK B)

## Overview
Provide a FastAPI service that receives sensor data, runs an Isolation‑Forest model (and optionally an LSTM‑AE), and decides if the event is *valid* for blockchain submission.

---

### 1. Model Training (max 3 days)
**Task** – Train Isolation‑Forest on a labelled dataset (clean + injected faults).  Save the model as `model.pkl`.

| Dep. | Done When | Owner |
|------|-----------|-------|
| None | `python train.py --out model.pkl` produces a `model.pkl` file | `TRACK B` |

### 2. FastAPI Endpoint (max 2 days)
**Task** – Implement `/trust` endpoint that loads `model.pkl`, scores the input, and returns the JSON format defined in the API contract.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 1 | `curl -X POST http://localhost:8000/trust -H 'Content-Type: application/json' -d @sample.json` returns `valid:false` for a known bad sample | `TRACK B` |

### 3. Quarantine Store (max 1 day)
**Task** – On `valid:false`, write the raw event to Supabase table `quarantine` with a reason field.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 2 | `SELECT * FROM quarantine` contains the anomalous record | `TRACK B` |

### 4. Optional LSTM‑AE Integration (max 3 days)
**Task** – Add a second model file `lstm_ae.pkl` and update `/trust` to return both scores when enabled.

| Dep. | Done When | Owner |
|------|-----------|-------|
| None | `curl -X POST http://localhost:8000/trust -d @sample.json` returns an additional field `lstmScore` | `TRACK B` |
