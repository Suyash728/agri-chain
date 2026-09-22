# Track A – IoT Simulation & Ingestion (Owner: TRACK A)

## Overview
Simulate a fleet of IoT devices that emit sensor readings (location, temp, humidity).  These readings hit a FastAPI ingestion service, which validates the payload format and forwards to the AI trust layer.

---

### 1. Simulated Sensor Emit (max 1 day)
**Task** – Write a Python script that emits a CSV file of 100 readings per device with realistic GPS movement and temperature patterns.

| Dep. | Done When | Owner |
|------|-----------|-------|
| None | `python emit.py --output data.csv` produces 100 lines with fields: batchId, sensorId, timestamp, lat, lng, temperature, humidity | `TRACK A` |

### 2. FastAPI Ingestion (max 2 days)
**Task** – Implement `/ingest` endpoint (see API contract).  Persist raw event in Supabase.  Return `eventId`.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 1 | `curl -X POST http://localhost:8000/ingest -H 'Content-Type: application/json' -d @data.json` returns 200 with eventId | `TRACK A` |

### 3. Forward to AI Trust (max 1 day)
**Task** – Call AI Trust API `POST /trust` from ingestion.  Store the response in Supabase table `ingestion_status`.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 2 | `SELECT * FROM ingestion_status` shows valid=false rows for anomalous events | `TRACK A` |

### 4. Integration Test (max 1 day)
**Task** – Ensure ingestion → AI → quarantine works end‑to‑end for a sample batch.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 3 | `curl http://localhost:8000/batch/sample‑id` returns status and events | `TRACK A` |
