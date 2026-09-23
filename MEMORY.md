# MEMORY.md

**Read this file first, every session, before anything else.** It's the only
place this project's history lives between sessions — the model running you
has no memory of previous work beyond what's written here.

**Append only. Never delete or rewrite an existing entry.** If a decision
recorded here turns out to be wrong, add a new entry saying so and why —
don't erase the old one. The history of *why* something changed is as
valuable as the current state.

## Entry format

Copy this template for every new entry, filled in truthfully:

```
## [Phase N — name] — YYYY-MM-DD

**What was done:**
- ...

**Files changed:**
- ...

**Decisions made (and why):**
- ...

**Verified (DONE WHEN checks that actually passed):**
- ...

**Open questions / blockers for next session:**
- ...

**What's next:**
- ...
```

If a session ends mid-task (not at a clean phase boundary), still write an
entry — head it `## [Phase N — name] — YYYY-MM-DD (partial)` and be precise
in "Open questions / blockers" about exactly where you stopped, so the next
session doesn't have to rediscover it.

---

## [Phase 0 — Repo audit and planning docs created] — 2026-09-22

**What was done:**
- Audited the actual current state of the repo (not assumptions from earlier
  planning documents): confirmed `design/` is a working Vite + React 18 +
  Tailwind app (not the Next.js originally planned in
  `docs/proposal/KisanChain_Project_Context.md`), fully built by Google
  Stitch with all four role UIs (Farmer, Logistics Partner, Dark Store,
  Consumer) present, styled, and running entirely on mock data in
  `design/src/data/mockData.js` and `design/src/Consumer/data/consumerData.js`
  — confirmed zero `fetch()` or `axios` calls anywhere in `design/src/`.
- Confirmed `design/src/Farmer/Views/AITrustView.jsx` exists already, showing
  a mock "AI Trust Score" (92/100) — this is currently a decorative
  produce-quality score, **not** connected to the real per-reading anomaly
  verdict the AI trust layer will eventually produce. Worth remembering:
  wiring this view later means repurposing it to show something related but
  not identical to what it currently displays — don't assume it's a direct
  match to the `/telemetry` verdict without checking what the component
  actually expects.
- Wrote seven root-level planning documents (`AGENTS.md`, `PRD.md`,
  `ARCHITECTURE.md`, `RULES.md`, `PLAN.md`, `TASKS.md`, this file) to make
  the project buildable by a small local model (gpt-oss-20b / gemma-4-12b via
  opencode/Ollama) with no memory between sessions.

**Files changed:**
- Created: `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `PLAN.md`,
  `TASKS.md`, `MEMORY.md` (this file)
- Appended an integration note to `design/DESIGN.md` pointing to
  `ARCHITECTURE.md` for data-wiring (visual spec content unchanged)

- **Checked `design/src/data/mockData.js`'s `traceabilityBatch` and
  `design/src/Consumer/data/consumerData.js`'s `productJourneyTimeline`
  directly before writing `PRD.md`'s feature list** — neither has a price
  field; the existing Consumer journey UI is provenance-only (title, date,
  location, status). Displaying the farmer's price share to the consumer
  therefore needs a new UI element, which conflicts with the "wire, don't
  create" rule. Resolved by splitting it: price *data* is essential (E2, E8
  — recorded on-chain, verifiable via the API), price *display* on the
  Consumer screen is Optional (O14), explicitly flagged as worth doing
  anyway before a live demo since it's the project's differentiating
  feature. See `PRD.md` §5's note under the E6/E8 row.

**Decisions made (and why):**
- **Simplified the essential architecture significantly from
  `docs/proposal/KisanChain_Project_Context.md`'s target**: SQLite instead
  of Supabase, one consolidated smart contract instead of five, a local
  Hardhat node instead of Polygon Amoy testnet, rule-based validation
  instead of a trained ML model, one monolithic FastAPI backend instead of
  five services, and a single backend-held signing account instead of
  per-user MetaMask signing. Reason: the original plan is still correct as
  a target, but two weeks + a small local model + no parallel
  frontend/backend coordination made the full version too much surface
  area for a reliable first build. Full reasoning and the reversal path
  for each simplification is in `ARCHITECTURE.md` §1. Every deferred piece
  is preserved as an Optional item in `PRD.md` §5, not dropped.
- **No separate API contract document.** `design/src/data/mockData.js` (and
  `consumerData.js`) already define every data shape the frontend expects,
  since the UI was built against them. `ARCHITECTURE.md` §4 makes this the
  rule: match the mock shape exactly when building the real endpoint. This
  is also what makes the linear (non-split) build plan in `PLAN.md`
  possible — there's no contract to negotiate between tracks.
- **web3.py instead of ethers.js** for the backend's chain calls, to keep
  the backend single-language (Python), since introducing a second runtime
  for a two-week build adds coordination cost. ethers.js is deferred to
  the Optional tier (O2), which is also where per-user wallet signing
  lives — the two belong together.

**Verified (DONE WHEN checks that actually passed):**
- None yet — no build tasks from `TASKS.md` have started. This entry is
  planning-only.

**Open questions / blockers for next session:**
- None blocking. `TASKS.md` Phase 1, Task 1.1 is the next concrete action.
- Worth raising with the team before Phase 5: `design/src/Farmer/Modals/`
  and similar folders weren't individually inventoried file-by-file during
  this audit — Task 5.3 in `TASKS.md` names a likely file
  (`AddStockModal.jsx`) but says explicitly to confirm the exact name via
  `App.jsx`'s imports rather than trusting this note blindly.

**What's next:**
- Start `TASKS.md` Phase 1 (Environment) from Task 1.1.

---

## [Phase 3 — Backend API & Blockchain Integration] — 2026-09-23

**What was done:**
- Implemented Task 3.1: SQLite schema in `backend/db.py` for 5 tables (`batches`, `custody_events`, `readings`, `quarantine`, `policy`) and seeded demo policies for Tomato, Mango, Wheat.
- Implemented Task 3.2: Web3 client in `backend/chain.py` connecting to local Hardhat node (`http://127.0.0.1:8545`) and deployed `AgriChainCore` contract (`0x5FbDB2315678afecb367f032d93F642f64180aa3`). Handled Web3 v8 API and batch ID bytes32 conversions.
- Implemented Task 3.3: Rule-based AI trust validation layer in `backend/validation.py` validating temperature/humidity against policy table thresholds.
- Implemented Task 3.4: `POST /telemetry` in `backend/main.py` with raw readings logged first, AI trust verification, on-chain recording for VALID readings, and quarantine logging for ANOMALOUS readings.
- Implemented Task 3.5: `POST /batches` and `POST /batches/{batch_id}/custody` in `backend/main.py` with dual-write to SQLite and on-chain state updates.
- Implemented Task 3.6: Farmer dashboard endpoints (`GET /farmer/kpis`, `GET /farmer/crops`, `GET /farmer/activity`) matching the exact mock shape from `design/src/data/mockData.js`.
- Implemented Task 3.7: `GET /batches/{batch_id}/traceability` assembling the custody timeline from SQLite and cold-chain condition readings from on-chain `ConditionRecorded` events.

**Files changed:**
- `backend/db.py`: schema, seed policies, `init_db()`.
- `backend/chain.py`: Web3 contract client methods and event queries.
- `backend/validation.py`: policy threshold rule validation.
- `backend/main.py`: FastAPI endpoints for telemetry, batches, custody, farmer dashboards, and traceability.
- `contracts/scripts/deploy.cjs`: updated for ethers v6 syntax.
- `TASKS.md`: checked off Tasks 3.1 through 3.7.

**Decisions made (and why):**
- Used `bytes32` conversion with utf-8 left-padding for strings <= 32 chars and keccak256 fallback for long strings, allowing human-readable batch IDs like `DEMO-BATCH-001` on-chain.
- Defaulted participant addresses to Hardhat funded test accounts so API requests like `to_holder: "SafeXpress"` work seamlessly without needing frontend callers to know raw Ethereum hex addresses.
- Used SQLite `Row` factory for dict-like database row access.

**Verified (DONE WHEN checks that actually passed):**
- Task 3.1: `init_db()` created `agrichain.db` and verified all 5 tables and policy rows via SQLite.
- Task 3.2: `chain.register_batch` returned real transaction hash on local Hardhat chain and queried back exact batch data.
- Task 3.3: `validate_reading` returned `('VALID', None)` for 5.0°C and `('ANOMALOUS', ...)` for 42.0°C.
- Task 3.4: `POST /telemetry` returned VALID with real tx hash for in-bounds reading, and ANOMALOUS with quarantine insertion for 42.0°C reading.
- Task 3.5: Registered `DEMO-BATCH-001` and transferred custody to `SafeXpress` (`IN_TRANSIT`), verified on-chain state `1` and SQLite event history.
- Task 3.6: `GET /farmer/kpis`, `/farmer/crops`, `/farmer/activity` returned matching mock shapes with real database-calculated values.
- Task 3.7: `GET /batches/DEMO-BATCH-001/traceability` returned full batch journey, custody history with prices, and on-chain condition logs.

**Open questions / blockers for next session:**
- None. Phase 3 is 100% complete and verified against local Hardhat node.

**What's next:**
- Phase 4 — Simulator (Task 4.1: basic telemetry simulator script, Task 4.2: fault injection, Task 4.3: end-to-end isolated verification).

---

## [Phase 4 — Simulator & Fault Injection] — 2026-09-23

**What was done:**
- Implemented Task 4.1: Built `simulator/simulate.py` accepting `--batch-id`, `--crop-name`, `--duration`, `--interval`, `--endpoint`, and `--inject-fault`. Streams realistic cold-chain conditions to `POST /telemetry`.
- Implemented Task 4.2: Implemented `--inject-fault temp_spike` generating a mid-stream 45.0°C temperature anomaly that is caught and quarantined by the AI trust layer.
- Implemented Task 4.3: Performed isolated end-to-end verification against fresh batch `E2E-ISOLATED-001`. Verified count of raw readings (3), quarantined rows (1 naming 45.0°C), and smart contract events matching only the valid readings count (2).

**Files changed:**
- `simulator/simulate.py`: telemetry simulator CLI with fault injection.
- `TASKS.md`: checked off Tasks 4.1, 4.2, and 4.3.

**Decisions made (and why):**
- Configured realistic temperature and humidity bounds tailored per crop (Tomato, Mango, Wheat) so simulated telemetry behaves realistically within cold-chain tolerances.
- Injected faults mid-stream to emulate real-world sensor or refrigeration failures in transit.

**Verified (DONE WHEN checks that actually passed):**
- Task 4.1: Streamed readings for `SIM-BATCH-001` with duration 10s; verified `VALID` responses and matching rows in SQLite `readings` with `tx_hash`.
- Task 4.2: Ran with `--inject-fault temp_spike` on `FAULT-BATCH-001`; produced exactly 1 `ANOMALOUS` reading with `quarantine` row naming 45.0°C.
- Task 4.3: Ran isolated verification on fresh batch `E2E-ISOLATED-001`; checked SQLite `readings` (count=3, 2 VALID with tx_hash, 1 ANOMALOUS), `quarantine` (count=1), and on-chain `ConditionRecorded` events (count=2 matching valid readings only).

**Open questions / blockers for next session:**
- None. Phase 4 is 100% complete.

**What's next:**
- Phase 5 — Frontend wiring (Tasks 5.1–5.6: wire Farmer dashboard, batch registration modal, Consumer traceability view, and run final essential demo check).

---

## [Phase 5 — Frontend Wiring & Essential Build Verification] — 2026-09-23

**What was done:**
- Implemented Task 5.1 & 5.2: Wired Farmer dashboard KPI cards, crop overview, and recent activity in `design/src/App.jsx`, `design/src/Farmer/components/KPICards.jsx`, and `design/src/Farmer/Views/MyCropsView.jsx`. Components fetch live data from `http://localhost:8000/farmer/kpis`, `/farmer/crops`, and `/farmer/activity`.
- Implemented Task 5.3: Wired Farmer batch registration modal in `design/src/Farmer/Modals/AddStockModal.jsx` to `POST /batches`. Registered batches are written to SQLite and mined into the Hardhat blockchain, and dashboard KPIs update dynamically without a full page reload.
- Implemented Task 5.4: Created `backend/scripts/seed_demo_batch.py` to seed a full custody chain for demo batch `TM1256` (`REGISTERED -> IN_TRANSIT -> IN_STORAGE -> AT_RETAIL -> SOLD`), recording cold-chain telemetry and price transfers.
- Implemented Task 5.5 & 5.5b: Wired Consumer traceability view in `design/src/Consumer/Views/ProductJourneyView.jsx` and `BlockchainVerificationView.jsx` to fetch live data from `/batches/{batch_id}/traceability` and display the on-chain journey steps and the price trail badges.
- Implemented Task 5.6: Built and executed `backend/scripts/verify_phase5_e2e.py` verifying all five steps of the PRD §6 essential-tier success criteria against the running contract and backend.

**Files changed:**
- `design/src/App.jsx`: live state fetching for farmer KPIs, crops, activities, and batch refresh.
- `design/src/Farmer/components/KPICards.jsx`: dynamic rendering of inventory, orders, shipments, and earnings from live metrics.
- `design/src/Farmer/Views/MyCropsView.jsx`: accepts dynamic categories prop.
- `design/src/Farmer/Modals/AddStockModal.jsx`: submits new stock to `POST /batches` on blockchain with loading state.
- `design/src/Consumer/Views/ProductJourneyView.jsx`: fetches `/batches/{batch_id}/traceability` and displays live journey steps with price badges.
- `design/src/Consumer/Views/BlockchainVerificationView.jsx`: shows real on-chain transaction hash.
- `backend/scripts/seed_demo_batch.py`: seed script for demo batch `TM1256`.
- `backend/scripts/verify_phase5_e2e.py`: automated verification of PRD §6 five-step criteria.
- `TASKS.md`: checked off Tasks 5.1 through 5.6.

**Decisions made (and why):**
- Strict adherence to the `AGENTS.md` and `RULES.md` "wire, don't create" rule: preserved all existing styling, Tailwind classes, and component structures while injecting live backend API state.
- Completed Task 5.5b (price trail) by displaying formatted rupee badges along the journey timeline steps using Tailwind classes already present in the design.
- Built automated script `verify_phase5_e2e.py` to make the 5-step verification completely reproducible.

**Verified (DONE WHEN checks that actually passed):**
- Task 5.1 & 5.2: Farmer dashboard displays real data from SQLite (`6.50 Tonnes`, `13 Active Orders`, `5 Shipments`, `₹ 9,600 Total Earnings`) instead of mock numbers.
- Task 5.3: Registering a batch from `AddStockModal` created a real row in `batches` table, mined on-chain transaction, and refreshed KPI counts immediately.
- Task 5.4: `seed_demo_batch.py` executed all 4 transfers with prices; verified on-chain and via `GET /batches/TM1256/traceability`.
- Task 5.5 & 5.5b: Consumer product journey screen displays the 5 real steps with locations, dates, and stage price badges; blockchain verification screen displays real transaction hash.
- Task 5.6: `verify_phase5_e2e.py` passed 100% of all 5 steps specified in PRD §6:
  1. Valid telemetry recorded on-chain.
  2. High temperature spike (45°C) flagged ANOMALOUS and quarantined (not on-chain).
  3. Batch registered on-chain via farmer flow.
  4. Full custody transfer chain with prices on-chain.
  5. Traceability endpoint returns correct journey, conditions, and farmer price share (50.0%).
- Frontend build (`npm run build` in `design/`) succeeded cleanly with 0 errors.

**Essential Build Status:**
- **COMPLETE**: All essential-tier features (Phases 1–5, Tasks 1.1–5.6) are finished and fully verified.

---

## [Phase 6 — Planning & AI Trust Layer Audit] — 2026-09-23

**What was done:**
- Read and audited all project context in `docs/` (`proposal/`, `diagrams/`, `plan/`, `research/`), root markdown files (`PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `PLAN.md`, `TASKS.md`, `MEMORY.md`), and teammate Rutuja's `trust-layer/` contribution (commit `6ef98cf`).
- Verified that the 2-week Essential Build (Phases 1–5, Tasks 1.1–5.6) is 100% complete, tested, and verified on-chain.
- Thoroughly audited `trust-layer/` implementation:
  - 10 full modules covering schema validation, basic range limits, physical/temporal plausibility (Haversine GPS velocity, temperature/humidity rate-of-change, timestamp sequence consistency), 11-D time-series feature engineering, unsupervised Isolation Forest ML anomaly detection, SHA-256 fingerprinting with nonce/replay detection, deterministic verdict engine, off-chain quarantine & audit trail with operational dispositions (`READY_FOR_ORACLE`, `QUARANTINED`, `ON_HOLD`), synthetic telemetry simulation with 7 fault types, Oracle handoff contract (v1.0 schema), and publication-ready evaluation reporting (confusion matrix, precision/recall/F1 metrics).
  - Identified key integration points with `backend/` and `contracts/`: replacing simple threshold checks in `backend/validation.py` with the full AI trust pipeline, feeding approved `OracleHandoffPayload` events into `AgriChainCore.sol:recordCondition`, and binding `CropPolicy` to real crop policies.
  - Identified key enhancements needed for the AI Trust Layer to fulfill capstone and IEEE publication goals:
    1. Persistent SQLite storage for telemetry history and audit logs (replacing transient in-memory dictionaries).
    2. Dynamic binding between `CropPolicy` and database batch crop parameters.
    3. Potential v2 temporal model (LSTM-Autoencoder) for gradual sensor drift.
    4. Wiring `design/src/Farmer/Views/AITrustView.jsx` to live AI verification checkpoints and quarantine statistics.
- Formulated the next phased roadmap (Phases 6–10) in `PLAN.md` and actionable tasks for Phase 6 in `TASKS.md`.
- Formulated key architectural questions for the user regarding service topology (unified vs dual microservice) and immediate next development priorities.

**Files changed:**
- `MEMORY.md`: appended audit, findings, and Phase 6 planning entry.
- `PLAN.md`: updated with post-essential roadmap (Phases 6–10).
- `TASKS.md`: added Phase 6 tasks with runnable commands and "DONE WHEN" checks.
- `ARCHITECTURE.md`: updated to document AI Trust Layer pipeline and Oracle handoff integration.
- `README.md`: updated repository overview with current status and newly integrated modules.

**Decisions made (and why):**
- Structured `trust-layer` integration as Phase 6 because it fulfills core research Gap 5 from the guide's foundational survey, provides the necessary evaluation metrics for the IEEE publication, and cleanly bridges IoT ingestion to the smart contract.
- Mapped the 4 verification checkpoints in `design/src/Farmer/Views/AITrustView.jsx` (Cold Chain Integrity, GPS Telemetry Validation, Tamper Prevention, Anomaly Check) directly to the corresponding stages of `trust-layer` (Range/Plausibility, Haversine Speed, Cryptographic Integrity, Isolation Forest ML).
- **User Architecture Decision (Confirmed)**: Single Unified Service — import `trust-layer` directly into the FastAPI backend on port 8000, keeping local development simple with zero inter-service network overhead.
- **User Priority Decision (Confirmed)**: Execute Phase 6 (AI Trust Layer Integration & Evaluation) first.
- **User Enhancement Decision (Confirmed)**: Prioritize Dynamic Crop Policy Binding and Persistent SQLite Audit Storage for `trust-layer`.

**Verified (DONE WHEN checks that actually passed):**
- Full repository audit completed; documentation consistency verified across `docs/` and root `.md` files (`MEMORY.md`, `PLAN.md`, `TASKS.md`, `ARCHITECTURE.md`, `README.md`).
- **Task 6.1 Verified across all components**:
  - `contracts/`: `npx hardhat test` passed all 13 tests (578ms).
  - `design/`: `npm run build` compiled cleanly with 0 errors (2.50s).
  - `trust-layer/`: Installed all dependencies (`scikit-learn`, `scipy`, `numpy`, `pytest`, `httpx`, `matplotlib`); `pytest tests -v` passed all 143 tests with 0 failures (11.03s).
  - `backend/` + contracts + database: Started local Hardhat node (`0x5FbDB2315678afecb367f032d93F642f64180aa3`) and FastAPI backend (`http://127.0.0.1:8000`); executed `verify_phase5_e2e.py` with 100% pass across all 5 PRD §6 criteria.
  - `simulator/`: Registered `SIM-BATCH-001` and streamed telemetry with `--inject-fault temp_spike`; confirmed 2 VALID readings recorded on-chain and 1 ANOMALOUS reading quarantined.

**Open questions / blockers for next session:**
- None. All components are installed, verified, and running.

**What's next:**
- Phase 6 — AI Trust Layer Integration & Evaluation (Tasks 6.1–6.7).

---

## [Phase 6 — AI Trust Layer Integration & Evaluation] — 2026-09-23

**What was done:**
- Implemented Task 6.1: Installed full project dependencies into virtual environment (`scikit-learn`, `scipy`, `matplotlib`, `pytest`, `fastapi`, `uvicorn`, `web3`), verified all test suites across `contracts/` (13 tests passing) and `trust-layer/` (143 tests passing). Committed in `97f6d2a`.
- Implemented Task 6.2: Built persistent SQLite storage schema and repositories (`trust-layer/app/services/db.py`) storing `telemetry_history`, `audit_trail`, `replay_events`, and `replay_latest_timestamps`. Integrated into `history.py`, `audit.py`, and `integrity.py` with zero breaking changes to in-memory test mocks. Committed in `c98ace0`.
- Implemented Task 6.3: Implemented dynamic crop policy binding (`trust-layer/app/services/policy.py`) linking backend `policy` table (min/max temperature and humidity) to `CropPolicy` schema. Updated plausibility checks in `plausibility.py` to evaluate dynamic crop-specific ranges. Verified via `test_policy.py` (Tomato 15°C -> QUARANTINED, Wheat 15°C -> READY_FOR_ORACLE). Committed in `84a467a`.
- Implemented Task 6.4: Fully wired FastAPI ingestion endpoint `POST /telemetry` in `backend/main.py` through the AI Trust Layer pipeline (Basic Validation -> Plausibility Checks -> Feature Extraction -> Isolation Forest ML -> Cryptographic Integrity / Replay Detection -> Verdict Engine -> Audit Trail & History Persistence -> Oracle Handoff to smart contract). Valid readings are anchored on-chain with tx hash; anomalous readings (temperature spikes, GPS jumps, replay attacks) are quarantined off-chain with structured reason codes and 0 on-chain condition events. Verified via `verify_phase6_task4.py` and `verify_phase5_e2e.py`. Committed in `8e652d6`.
- Implemented Task 6.5: Upgraded root telemetry simulator (`simulator/simulate.py`) using `trust-layer/app/services/simulator.py` to support all 7 fault injection categories (`temp_spike`, `humidity_spike`, `gps_jump`, `timestamp_drift`, `replay_attack`, `telemetry_gap`, `composite`). Automatically advances starting timestamp and GPS coordinates past previous batch history to ensure physically continuous simulations. Verified against batch `BATCH-001` with `replay_attack`, `gps_jump`, and `temp_spike`. Committed in `14f02b0`.
- Implemented Task 6.6: Implemented `POST /telemetry/evaluate` in `backend/main.py` delegating to `trust-layer/app/services/evaluation.py`. Executed benchmark evaluation across 40 balanced sequence trials covering normal produce and all 7 fault categories. Achieved overall F1-score of 0.9722 (Precision: 0.9459, Recall: 1.0000, Latency: 31.80 ms) with 100% detection rate across all 7 fault types. Exported publication-ready figures (`confusion_matrix.png`, `fault_detection_rates.png`, `metrics_summary.png`, `verdict_distribution.png`) and summary tables (`benchmark_summary.md`, `benchmark_summary.json`) to `trust-layer/reports/figures/`. Committed in `ecdb697`.
- Implemented Task 6.7: Implemented `GET /farmer/ai-trust` in `backend/main.py` providing real-time AI trust score and verification checkpoints calculated from SQLite audit trail and quarantine records (Cold Chain Integrity %, GPS Telemetry Validation status, Tamper Prevention status, and Anomaly Check count). Wired `design/src/Farmer/Views/AITrustView.jsx` to fetch live data via `useEffect` with graceful fallback. Verified frontend build succeeds cleanly with 0 errors. Committed in `9dc7a9b`.

**Files changed:**
- `trust-layer/app/services/db.py`: persistent SQLite schema and connection helpers.
- `trust-layer/app/services/history.py`: SQLite-backed historical telemetry repository.
- `trust-layer/app/services/audit.py`: SQLite-backed audit trail and quarantine repository.
- `trust-layer/app/services/integrity.py`: SQLite-backed SHA-256 fingerprinting and replay repository.
- `trust-layer/app/services/policy.py`: dynamic crop policy loader from SQLite.
- `trust-layer/app/services/plausibility.py`: dynamic crop bounds evaluation.
- `trust-layer/app/services/evaluation.py`: benchmark evaluation reporting, figure exports, and markdown/JSON summary generation.
- `trust-layer/tests/test_policy.py`: unit tests for dynamic crop policy binding.
- `backend/main.py`: end-to-end pipeline ingestion, oracle handoff, `POST /telemetry/evaluate`, and `GET /farmer/ai-trust`.
- `simulator/simulate.py`: CLI simulator with all 7 fault types and history-aware timestamp advancement.
- `design/src/Farmer/Views/AITrustView.jsx`: live AI trust score and checkpoints fetch.
- `TASKS.md`: marked Tasks 6.1 through 6.7 complete.
- `MEMORY.md`: appended Phase 6 completion entry.

**Decisions made (and why):**
- Used Unified Service architecture (FastAPI backend on port 8000 importing `trust-layer`) per user confirmation.
- Retained strict backwards-compatibility with in-memory SQLite fixtures (`:memory:`) in unit tests so that `pytest` runs at full speed (147 tests in < 45s).
- Trained Isolation Forest on startup across both stationary produce (farm gate / warehouse) and transit produce (10–75 km/h) to prevent stationary readings from being falsely flagged as velocity outliers.
- Preserved exact design system and Tailwind styling in `design/src/Farmer/Views/AITrustView.jsx` while binding live data via React `useState` and `useEffect`.

**Verified (DONE WHEN checks that actually passed):**
- Task 6.1: 147 `trust-layer` pytest tests passed with 0 failures; 13 Hardhat smart contract tests passed.
- Task 6.2: SQLite tables `telemetry_history`, `audit_trail`, `replay_events` verified persisting across restarts.
- Task 6.3: Tomato 15°C flagged `QUARANTINED`, Wheat 15°C accepted `READY_FOR_ORACLE`.
- Task 6.4: `verify_phase6_task4.py` verified valid readings recorded on-chain, faults quarantined with 0 on-chain events.
- Task 6.5: `python simulator/simulate.py --batch-id BATCH-001 --fault replay_attack` flagged `REPLAY_ATTACK_DETECTED` with disposition `QUARANTINED`.
- Task 6.6: `POST /telemetry/evaluate` completed with F1-score 0.9722 >= 0.90; all 4 IEEE figures and markdown/JSON tables generated.
- Task 6.7: `GET /farmer/ai-trust` returns live audit checkpoints; `npm run build` in `design/` passed cleanly in 2.40s.
- `verify_phase5_e2e.py` passed 100% across all 5 PRD §6 essential build criteria.

**Phase 6 Status:**
- **COMPLETE**: Tasks 6.1 through 6.7 are finished, verified, and committed.

**What's next:**
- Phase 7 — Logistics Partner & Cold-Chain Transit Telemetry (Tasks 7.1–7.4: wire transit dashboard, GPS fleet status, dynamic custody handover modal).






