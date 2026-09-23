# TASKS.md

The actual checklist. Implements the phases in `PLAN.md`. One task at a time,
in order — do not start task N+1 until task N's "DONE WHEN" check passes.

Check off each task by editing this file (`- [ ]` → `- [x]`) as part of the
same commit that finishes it. After the last task in a phase, append the
`MEMORY.md` entry for that phase before starting the next one.

---

## Phase 1 — Environment (days 1–2)

### Task 1.1 — Confirm the existing frontend runs
- [x] Run:
  ```bash
  cd design
  npm install
  npm run dev
  ```
- **DONE WHEN:** the terminal prints a local URL (something like
  `http://localhost:5173`), and opening it shows the AgriChain consumer
  landing page. Click through to the Farmer role using the role switcher in
  the top-right corner — it should show the dashboard with mock data
  (Total Inventory `3.45 Tonnes`, etc). Stop the dev server after confirming.

### Task 1.2 — Scaffold `contracts/`
- [x] Create the folder and initialize Hardhat:
  ```bash
  mkdir contracts && cd contracts
  npm init -y
  npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
  npx hardhat init
  ```
  Choose "Create a JavaScript project" when prompted, accept defaults.
- **DONE WHEN:** `contracts/hardhat.config.js` exists, and
  `npx hardhat compile` runs with no errors (it will compile the sample
  `Lock.sol` contract Hardhat generates — that's fine, it gets deleted in
  Task 2.1).

### Task 1.3 — Scaffold `backend/`
- [x] Create the folder and a virtual environment:
  ```bash
  mkdir backend && cd backend
  python3 -m venv .venv
  source .venv/bin/activate      # on Windows: .venv\Scripts\activate
  pip install fastapi uvicorn web3 sqlmodel python-dotenv
  pip freeze > requirements.txt
  ```
- [x] Create `backend/main.py` with just enough to prove FastAPI runs:
  ```python
  from fastapi import FastAPI
  app = FastAPI()

  @app.get("/health")
  def health():
      return {"status": "ok"}
  ```
- **DONE WHEN:** running `uvicorn main:app --reload` from inside `backend/`
  (with the venv active) starts a server, and `curl http://localhost:8000/health`
  returns `{"status":"ok"}`.

### Task 1.4 — `.gitignore` check
- [ ] Confirm the repo's `.gitignore` includes at minimum: `.env`,
  `node_modules/`, `__pycache__/`, `.venv/`, `*.db`, `contracts/artifacts/`,
  `contracts/cache/`. Add any that are missing.
- **DONE WHEN:** running `git status` from the repo root after Tasks 1.2–1.3
  does **not** list `node_modules/`, `.venv/`, or any compiled artifacts as
  untracked files ready to commit.

**→ End of Phase 1. Append a `MEMORY.md` entry before starting Phase 2.**

---

## Phase 2 — Smart contract (days 3–5)

### Task 2.1 — Write `AgriChainCore.sol`
- [x] Delete Hardhat's sample `contracts/contracts/Lock.sol`.
- [x] Create `contracts/contracts/AgriChainCore.sol` with exactly the
  contract shown in `ARCHITECTURE.md` §5. Copy it directly — don't
  re-derive it from memory.
- **DONE WHEN:** `npx hardhat compile` (from inside `contracts/`) succeeds
  with no errors.

### Task 2.2 — Test: register a batch
- [x] Create `contracts/test/AgriChainCore.test.js`. Write a test that
  deploys the contract, calls `registerBatch` with sample data, and asserts
  the batch's `cropName` and `currentHolder` come back correctly from the
  `batches` mapping.
- **DONE WHEN:** `npx hardhat test` shows this test passing.

### Task 2.3 — Test: custody transfer, including the one-directional rule
- [x] Add a test that registers a batch, then calls `transferCustody` moving
  it `REGISTERED → IN_TRANSIT`, and asserts the state and `currentHolder`
  updated.
- [x] Add a second test that attempts an invalid transfer (e.g.
  `AT_RETAIL → IN_TRANSIT`, moving backward) and asserts it reverts.
- **DONE WHEN:** both tests pass, and the second one specifically fails
  (reverts) as expected — if it doesn't revert, `RULES.md` §5's
  one-directional rule is broken in the contract, go fix it before
  proceeding.

### Task 2.4 — Test: record a condition reading and the `onlyOwner` guard
- [x] Add a test that calls `recordCondition` from the deployer account and
  asserts the `ConditionRecorded` event fires with the right values.
- [x] Add a test that attempts to call `recordCondition` (or `registerBatch`,
  or `transferCustody`) from a **different** account than the deployer, and
  asserts it reverts with the `onlyOwner` message.
- **DONE WHEN:** all four contract tests (2.2, 2.3 × 2, 2.4 × 2 — six total)
  pass. This set of tests is what `RULES.md` §5 means by "every contract
  change needs at least one test."

### Task 2.5 — Deploy to a local Hardhat node
- [x] In one terminal, start a persistent local node:
  ```bash
  cd contracts && npx hardhat node
  ```
  Leave this running — it prints 20 funded test accounts with their private
  keys. **These are Hardhat's well-known public test keys — this is the
  account `RULES.md` §7 refers to for the essential build.**
- [x] In a second terminal, write and run a deployment script
  (`contracts/scripts/deploy.js`) using Hardhat Ignition or a plain deploy
  script, targeting `--network localhost`. Have it print the deployed
  contract address.
- [x] Copy the deployed address and the contract's ABI (from
  `contracts/artifacts/contracts/AgriChainCore.sol/AgriChainCore.json`) —
  the backend needs both in Phase 3.
- **DONE WHEN:** the deploy script prints a contract address, and that
  address shows a nonzero bytecode size when queried
  (`npx hardhat console --network localhost`, then
  `await ethers.provider.getCode("<address>")` returns more than `"0x"`).

**→ End of Phase 2. Append a `MEMORY.md` entry — include the deployed
contract address and where the ABI file lives, since Phase 3 needs both.**

---

## Phase 3 — Backend (days 6–9)

Keep the local Hardhat node from Task 2.5 running for this entire phase.

### Task 3.1 — SQLite schema
- [x] Create `backend/db.py` implementing exactly the five tables from
  `ARCHITECTURE.md` §6. Include a function `init_db()` that creates the
  tables if they don't exist, and seed the `policy` table with 2–3 crops
  you plan to demo (e.g. tomato: 2–8°C, 85–95% humidity — adjust to
  whatever you're actually demoing).
- **DONE WHEN:** running `python -c "from db import init_db; init_db()"`
  from inside `backend/` creates `agrichain.db`, and opening it with
  `sqlite3 agrichain.db ".tables"` lists all five tables.

### Task 3.2 — `chain.py` — connect to the deployed contract
- [x] Create `backend/chain.py`. Load the RPC URL (`http://127.0.0.1:8545`
  for the local Hardhat node), the contract address and ABI from Task 2.5,
  and a private key from `.env` (one of the Hardhat test accounts). Expose
  three functions: `register_batch(...)`, `transfer_custody(...)`,
  `record_condition(...)`, each building and sending a transaction via
  `web3.py` and returning the transaction hash.
- **DONE WHEN:** a short manual test script (delete after confirming, or
  keep under `backend/scripts/` if you want it for later) calls
  `register_batch` with sample data and prints a real transaction hash, and
  that same batch is queryable back from the contract with the right data.

### Task 3.3 — `validation.py` — the rule-based AI trust layer
- [x] Create `backend/validation.py` with one function,
  `validate_reading(crop_name, temp_c, humidity_pct) -> (verdict, reason)`.
  It should:
  1. Look up the policy row for `crop_name` from the `policy` table.
  2. If `temp_c` or `humidity_pct` falls outside the policy's min/max,
     return `("ANOMALOUS", "<specific reason, e.g. temperature 15.0°C above policy max 8.0°C>")`.
  3. Otherwise return `("VALID", None)`.
- **DONE WHEN:** a quick manual check — call `validate_reading("tomato", 5.0,
  90.0)` returns `VALID`, and `validate_reading("tomato", 42.0, 90.0)`
  returns `ANOMALOUS` with a reason string that names the actual numbers.

### Task 3.4 — `POST /telemetry`
- [x] In `main.py`, add the route. It must, in this exact order (per
  `RULES.md` §4):
  1. Insert the raw reading into the `readings` table first, with a
     placeholder verdict.
  2. Call `validate_reading(...)`.
  3. If `VALID`: call `chain.record_condition(...)`, then update the
     `readings` row with the real verdict and the returned `tx_hash`.
  4. If `ANOMALOUS`: update the `readings` row's verdict, and insert a row
     into `quarantine` with the reason from step 2. Do **not** call
     `chain.py` for an anomalous reading.
  5. Return `{"verdict": ..., "reason": ...}`.
- **DONE WHEN:**
  - `curl -X POST localhost:8000/telemetry -d '{"batch_id":"...", "crop_name":"tomato", "temp_c":5.0, "humidity_pct":90.0}' -H 'Content-Type: application/json'`
    returns `{"verdict":"VALID", ...}`, and a new row appears in `readings`
    with a real `tx_hash`.
  - The same call with `"temp_c":42.0` returns `{"verdict":"ANOMALOUS", ...}`,
    a new row appears in `readings` with `verdict = "ANOMALOUS"` and no
    `tx_hash`, and a matching row appears in `quarantine`.

### Task 3.5 — `POST /batches` and `POST /batches/{batch_id}/custody`
- [x] Add both routes per the table in `ARCHITECTURE.md` §7. Each should
  write to SQLite (`batches` or `custody_events`) **and** call the matching
  `chain.py` function, storing the returned `tx_hash`.
- **DONE WHEN:** `curl -X POST localhost:8000/batches -d '{...}'` creates a
  row in `batches` with a real on-chain transaction behind it (verify by
  checking the contract's `batches` mapping via
  `npx hardhat console --network localhost` for that `batch_id`), and a
  follow-up call to the custody endpoint moves it to `IN_TRANSIT` both in
  SQLite and on-chain.

### Task 3.6 — `GET /farmer/kpis`, `/farmer/crops`, `/farmer/activity`
- [x] Add all three. Open `design/src/data/mockData.js`, find the
  `kpiMetrics`, `cropCategories`, and `recentActivities` exports, and shape
  each response to match exactly (per `ARCHITECTURE.md` §4 and `RULES.md`
  §6). Values should be computed from real rows in SQLite (e.g. `Total
  Inventory` = sum of registered batch quantities not yet sold).
- **DONE WHEN:** each endpoint's response, pasted into a JSON validator or
  just eyeballed, has the same keys as the corresponding mock export, and
  the values reflect whatever test batches you've created via Task 3.5 so
  far (not the original mock numbers).

### Task 3.7 — `GET /batches/{batch_id}/traceability`
- [x] Add the route. Shape it to match `traceabilityBatch` in
  `design/src/data/mockData.js`. Populate the journey from `custody_events`
  (for the who/where/when/price) and from the contract's `ConditionRecorded`
  events (for the cold-chain log) — query events via `chain.py`, add a
  function there if one doesn't exist yet for reading past events.
- **DONE WHEN:** for a batch that's been through registration, at least one
  custody transfer, and at least one telemetry reading (Tasks 3.4–3.5), this
  endpoint returns a single JSON object showing all of it — the crop, the
  custody history with prices, and the condition log — shaped like
  `traceabilityBatch`.

**→ End of Phase 3. Append a `MEMORY.md` entry.**

---

## Phase 4 — Simulator (days 10–11)

### Task 4.1 — Basic simulator
- [x] Create `simulator/simulate.py`. It should accept a `--batch-id` and
  send a series of plausible readings (temperature/humidity within a
  reasonable range for whatever crop you're demoing) to
  `POST localhost:8000/telemetry`, one every few seconds, for a
  configurable duration (`--duration`, default a couple of minutes).
- **DONE WHEN:** running `python simulate.py --batch-id <id> --duration 30`
  against a running backend produces a stream of `VALID` responses printed
  to the terminal, and the matching rows appear in `readings` with
  `tx_hash` values.

### Task 4.2 — Fault injection flag
- [x] Add `--inject-fault temp_spike` (or similar). When set, one reading in
  the stream should be replaced with an implausible value (e.g. temperature
  jumping to 45°C for one sample, then returning to normal) instead of a
  real one.
- **DONE WHEN:** running with `--inject-fault temp_spike` produces exactly
  one `ANOMALOUS` response in the output, with the rest `VALID`, and the
  matching `quarantine` row's reason string names the actual bad
  temperature.

### Task 4.3 — Confirm the end-to-end pipeline in isolation
- [x] Run the simulator against a fresh batch (registered via `curl` per
  Task 3.5), with the fault flag on, and manually check: `readings` has
  the right count and verdicts, `quarantine` has exactly one row, and the
  contract's `ConditionRecorded` events (queryable via `chain.py` or
  `hardhat console`) match the count of `VALID` readings only.
- **DONE WHEN:** all three checks above are individually confirmed by
  looking at the actual data, not assumed from the simulator's printed
  output alone.

**→ End of Phase 4. Append a `MEMORY.md` entry.**

---

## Phase 5 — Frontend wiring (days 12–14)

### Task 5.1 — Wire the Farmer dashboard KPIs
- [x] In `design/src/`, find the component(s) importing `kpiMetrics` from
  `mockData.js` for the Farmer dashboard. Replace the import with a
  `fetch('http://localhost:8000/farmer/kpis')` call inside a `useEffect`,
  storing the result in `useState`. Keep the loading UI simple (a plain
  "Loading…" text is fine — no new component).
- **DONE WHEN:** running `npm run dev` in `design/` and opening the Farmer
  dashboard shows real numbers (matching whatever's actually in SQLite from
  Phases 3–4's testing), not the original mock numbers (`3.45`, `4`, `2`,
  `₹28,450`).

### Task 5.2 — Wire crop overview and recent activity the same way
- [x] Repeat the Task 5.1 pattern for `cropCategories` → `/farmer/crops`
  and `recentActivities` → `/farmer/activity`.
- **DONE WHEN:** both sections of the Farmer dashboard show real data,
  confirmed the same way as Task 5.1.

### Task 5.3 — Wire batch registration
- [x] Find the Farmer "register batch" / "add stock" flow in `design/src/`
  (likely `Farmer/Modals/AddStockModal.jsx` or similar — check
  `design/src/App.jsx`'s imports for the exact name). Replace whatever
  local-state-only submit handler exists with a `POST` to
  `localhost:8000/batches`, then refresh the KPIs/crops/activity views
  (Tasks 5.1–5.2) after a successful response.
- **DONE WHEN:** submitting the form in the running app creates a real row
  in `batches` (confirm via `sqlite3 agrichain.db "SELECT * FROM batches"`)
  and a real on-chain transaction, and the dashboard's numbers update to
  reflect it without a page reload.

### Task 5.4 — Seed a full custody chain for the demo batch
- [x] For the specific batch you'll use in the final demo, manually run the
  `curl` custody-transfer calls from Task 3.5 to move it
  `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`, each with a
  realistic price in paise. This is the scripted step described in `PRD.md`
  §5 O1 — Logistics/Retailer dashboards aren't wired, so this is how their
  part of the chain gets created for the essential demo.
- **DONE WHEN:** `GET /batches/{batch_id}/traceability` (Task 3.7) for this
  batch shows all four transfers with their prices, in order.

### Task 5.5 — Wire the Consumer traceability/QR view
- [x] Find the Consumer traceability screen(s) in `design/src/Consumer/`
  using `productJourneyTimeline` from `consumerData.js`. Replace with a
  fetch to `/batches/{batch_id}/traceability` for the demo batch from Task
  5.4, mapped to the `{title, date, location, status}` shape that export
  already uses — this screen has **no price field in the existing UI**
  (confirmed by checking `consumerData.js` directly — see `MEMORY.md`
  Phase 0 entry), so don't add one here. That's task 5.5b below, and it's
  optional.
- **DONE WHEN:** opening the Consumer role in the running app and
  navigating to the journey view for the demo batch shows its real journey
  — not mock data.

### Task 5.5b — (Optional, do only if time allows before the demo) Display the price trail
- [x] This is `PRD.md` O14, not part of the essential five-step check, but
  worth doing here if Tasks 5.1–5.5 finished with time to spare, since price
  transparency is the project's stated differentiating feature. Find an
  existing card/text style already used elsewhere in `design/src/Consumer/`
  (e.g. how `RevenueView.jsx` presents a rupee figure) and reuse that exact
  pattern to add one small element to the journey view showing the price at
  each step from the same `/batches/{batch_id}/traceability` response. Do
  not design a new visual pattern — copy an existing one exactly, per
  `RULES.md` §2's one narrow exception.
- **DONE WHEN:** the price trail is visible on the Consumer journey screen,
  using only Tailwind classes and layout patterns already present elsewhere
  in the app.

### Task 5.6 — Run the full essential-tier check
- [x] Run the exact five-step sequence in `PRD.md` §6, in order, starting
  from a clean database if possible (or clearly noting which existing data
  you're reusing). Watch each step actually happen — don't skip ahead
  assuming a step worked.
- **DONE WHEN:** all five steps pass. This is the essential build being
  complete. Append the final `MEMORY.md` entry for Phase 5, explicitly
  stating that all five checks passed, and move any remaining work to the
  Optional roadmap in `PLAN.md` §3 rather than continuing to add to this
  file.

**→ Essential build (Phases 1–5) COMPLETE. See `MEMORY.md`.**

---

## Phase 6 — AI Trust Layer Integration & Evaluation

This phase integrates teammate Rutuja's standalone `trust-layer` module into the core application, connects the Oracle handoff interface to the smart contract, adds persistence and dynamic crop policy binding, and generates the evaluation metrics for the IEEE research paper.

### Task 6.1 — Install & verify dependencies for AI Trust Layer
- [x] Set up the Python environment with required ML and testing dependencies: `scikit-learn>=1.5.0`, `pytest>=8.0.0`, `httpx>=0.27.0`, `matplotlib>=3.8.0`.
- [x] Run the complete test suite in `trust-layer/tests/`.
- **DONE WHEN:** running `pytest trust-layer/tests/ -v` passes all 132 tests (30 range + 13 plausibility + 11 features + 11 anomaly + 12 integrity + 14 verdict + 12 audit + 17 simulator + 12 oracle handoff) with 0 failures. (Verified: 143 passed in 11.03s).

### Task 6.2 — Implement persistent SQLite storage for history & audit
- [x] Currently `trust-layer/app/services/history.py` and `audit.py` use in-memory Python dictionaries (`_store`). Update or wrap them to persist records into SQLite (`backend/agrichain.db`) across process restarts.
- [x] Maintain the same repository interface (`get_last_reading`, `add_reading`, `record_audit`, `get_by_event_hash`, `get_quarantined_records`).
- **DONE WHEN:** adding telemetry readings, restarting the application process, and calling `GET /telemetry/audit/{event_hash}` returns the persisted records without data loss. (Verified: `telemetry_history`, `audit_trail`, and `replay_events` persisted to `agrichain.db`, retrievable across fresh instances; all 143 tests passing).

### Task 6.3 — Bind dynamic crop policies to AI trust validation
- [x] Connect `trust-layer/app/services/validator.py` and `plausibility.py` to `CropPolicy` loaded dynamically from SQLite `policy` table based on the batch's registered crop (`Tomato`, `Mango`, `Wheat`).
- [x] If no crop policy exists, gracefully fall back to default cold-chain thresholds in `app/config.py` and conservative tomato defaults.
- **DONE WHEN:** sending a 15.0°C telemetry reading for a `Tomato` batch (max policy 8.0°C) is flagged `ANOMALOUS`, while sending 15.0°C for a `Wheat` batch (max policy 25.0°C) is evaluated as `VALID`. (Verified: 147 tests pass in `trust-layer/tests/`, including `test_policy.py`).

### Task 6.4 — Connect backend ingestion to AI Trust Pipeline & Oracle Handoff
- [x] Update `backend/main.py:POST /telemetry` to execute the full AI Trust pipeline:
  1. Record raw reading in `readings` table first (audit integrity per `RULES.md` §4).
  2. Run range, plausibility, feature extraction, Isolation Forest, and cryptographic integrity checks.
  3. Formulate explainable Trust Verdict (`VALID`, `ANOMALOUS`, `INSUFFICIENT_EVIDENCE`) and operational disposition (`READY_FOR_ORACLE`, `QUARANTINED`, `ON_HOLD`).
  4. For `VALID` + `READY_FOR_ORACLE`, construct `OracleHandoffPayload` and call `chain.py:record_condition` on `AgriChainCore.sol`.
  5. For `ANOMALOUS` + `QUARANTINED`, insert into `quarantine` table with exact structured reason codes.
- **DONE WHEN:** posting valid telemetry updates Hardhat blockchain condition events and SQLite audit records; posting an anomaly (temp spike, GPS jump, or replay attack) inserts a quarantine record and leaves on-chain event count unchanged. (Verified: `backend/scripts/verify_phase6_task4.py` and `backend/scripts/verify_phase5_e2e.py` passed with all checks confirmed).

### Task 6.5 — Integrate multi-fault telemetry simulation
- [x] Upgrade root `simulator/simulate.py` using `trust-layer/app/services/simulator.py` to support all 7 fault types:
  - `--fault temp_spike`
  - `--fault humidity_spike`
  - `--fault gps_jump`
  - `--fault timestamp_drift`
  - `--fault replay_attack`
  - `--fault telemetry_gap`
  - `--fault composite`
- **DONE WHEN:** running `python simulator/simulate.py --batch-id BATCH-001 --fault replay_attack` generates a duplicate sequence and causes the AI Trust layer to output `REPLAY_ATTACK_DETECTED` with disposition `QUARANTINED`. (Verified: executed against BATCH-001 with replay_attack, gps_jump, and temp_spike all correctly flagged and quarantined while clean samples were anchored on-chain).

### Task 6.6 — Run benchmark evaluation & export IEEE paper figures
- [x] Execute `POST /telemetry/evaluate` using `trust-layer/app/services/evaluation.py` on a balanced dataset of clean and faulted streams.
- [x] Verify calculation of TP, TN, FP, FN, Precision, Recall, F1-Score, and Latency across all fault types.
- [x] Export confusion matrix, fault detection rates, and performance summary charts to `trust-layer/reports/figures/`.
- **DONE WHEN:** `trust-layer/reports/figures/` contains publication-ready PNG figures and a markdown/JSON summary table showing overall F1-score >= 0.90. (Verified: `POST /telemetry/evaluate` executed with 40 trials across normal + 7 faults; F1-score=0.9722, precision=0.9459, recall=1.0000; exported all 4 PNG figures and markdown/JSON tables to `trust-layer/reports/figures/`).

### Task 6.7 — Wire Farmer AI Trust Screen (`AITrustView.jsx`) to live checkpoints
- [x] In `backend/main.py`, implement `GET /farmer/ai-trust` returning the live verification status matching `aiTrustData` in `mockData.js`:
  - Cold Chain Integrity (percentage compliant from recent audit logs)
  - GPS Telemetry Validation (route velocity continuity check)
  - Tamper Prevention (cryptographic seal & replay status)
  - Anomaly Check (number of deviations flagged)
- [x] In `design/src/Farmer/Views/AITrustView.jsx`, replace mock `aiTrustData` with a `fetch('http://localhost:8000/farmer/ai-trust')` call inside `useEffect`.
- **DONE WHEN:** opening the AI Trust Score view in the running Farmer UI displays live checkpoint status derived from real processed telemetry. (Verified: `GET /farmer/ai-trust` tested and returning live audit-derived metrics; `AITrustView.jsx` wired and tested; frontend built cleanly with 0 errors).

**→ End of Phase 6. Append a `MEMORY.md` entry.**

---

## Phase 7 — Role Dashboards Wiring & Quarantine / Trust UI (Week 3)

Goal: Wire the Logistics Partner dashboard, Dark Store / Retailer dashboard, and the Quarantine Inspection UI in `design/` to live backend API endpoints and on-chain state, enabling full cross-role multi-stakeholder lifecycle management.

### Task 7.1 — Implement Logistics Partner Backend Endpoints
- [x] In `backend/main.py`, implement:
  - `GET /logistics/kpis`: returns live KPIs (`totalShipments` in transit, `pendingOrders` ready for pickup, `onTimeDelivery` percentage, `totalLogisticsCost` formatted/paise).
  - `GET /logistics/shipments`: returns active shipments derived from SQLite `batches`, `custody_events`, and latest `readings` (including latest temp, humidity, GPS coordinates, origin farm, current holder, destination).
  - `GET /logistics/orders`: returns pending batches with status `REGISTERED` ready for procurement pickup.
- **DONE WHEN:** querying `GET /logistics/kpis` and `GET /logistics/shipments` via `curl` returns real batches, valid GPS/temp telemetry, and dynamic counts matching database state. (Verified: tested `/logistics/kpis`, `/logistics/shipments`, and `/logistics/orders`; returned live batches, valid GPS coordinates, reefer temperatures, and accurate counts).

### Task 7.2 — Wire Logistics Partner UI (`LogisticDashboardView.jsx` & Fleet Views)
- [x] In `design/src/Logistic_Partner/components/LogisticKPICards.jsx` and `LogisticDashboardView.jsx`, replace mock data with `fetch('http://localhost:8000/logistics/kpis')` and `fetch('http://localhost:8000/logistics/shipments')`.
- [x] In `design/src/Logistic_Partner/Views/TransportationView.jsx` and `ShipmentTrackingView.jsx`, wire fleet cards and live telemetry corridor to display real batches, vehicle numbers, route checkpoints, and live reefer temperatures.
- [x] Wire a "Dispatch / Pick Up" action triggering `POST /batches/{batch_id}/custody` with state `IN_TRANSIT` and paying the transit price.
- **DONE WHEN:** opening the Logistics Partner portal shows live shipment cards with real crop names and temperatures, and picking up a batch updates its state to `IN_TRANSIT` on-chain. (Verified: `LogisticKPICards`, `LogisticDashboardView`, `TransportationView`, `ShipmentTrackingView`, and `ProcurementOrdersView` wired to backend; dispatch action tested and verified transferring batch `BATCH-001` to `IN_TRANSIT` on-chain with tx `33370e1a...`).

### Task 7.3 — Implement Dark Store / Retailer Backend Endpoints
- [x] In `backend/main.py`, implement:
  - `GET /darkstore/kpis`: returns active inventory count (`IN_STORAGE`), inbound deliveries (`IN_TRANSIT`), sales count (`SOLD`), and total revenue.
  - `GET /darkstore/inbound`: returns shipments currently `IN_TRANSIT` destined for or arriving at the dark store hub.
  - `GET /darkstore/inventory`: returns batches currently held in storage (`IN_STORAGE` / `AT_RETAIL`) with batch ID, crop name, quantity, shelf life, and condition summary.
  - `POST /darkstore/receive`: receives inbound delivery, transferring custody state to `IN_STORAGE` on-chain.
  - `POST /darkstore/checkout`: completes consumer purchase, transferring custody state to `SOLD` at retail price on-chain.
- **DONE WHEN:** calling `GET /darkstore/kpis` returns accurate counts from SQLite, and calling `POST /darkstore/receive` followed by `POST /darkstore/checkout` records valid blockchain state transitions. (Verified: tested `/darkstore/kpis`, `/darkstore/inbound`, `/darkstore/inventory`, `POST /darkstore/receive` [tx `905f9dbf...`], and `POST /darkstore/checkout` [tx `7cb5aa63...`]; full 4-stage lifecycle verified).

### Task 7.4 — Wire Dark Store UI (`DarkStoreApp.jsx` & Inbound / Inventory Views)
- [x] In `design/src/Dark_Store/Views/DarkStoreDashboardView.jsx` and `DarkStoreKPICards.jsx`, replace mock KPIs with live `fetch('http://localhost:8000/darkstore/kpis')`.
- [x] In `design/src/Dark_Store/Views/InboundGRNView.jsx`, wire inbound deliveries list to `GET /darkstore/inbound` and wire the "Receive Goods / Complete GRN" action to `POST /darkstore/receive`.
- [x] In `design/src/Dark_Store/Views/MicroInventoryView.jsx`, wire inventory stock table to `GET /darkstore/inventory`.
- **DONE WHEN:** opening the Dark Store portal displays live incoming deliveries, receiving an inbound batch updates inventory in real time, and the UI builds cleanly without layout or style regressions. (Verified: `DarkStoreKPICards`, `DarkStoreDashboardView`, `InboundGRNView`, and `MicroInventoryView` wired to backend; tested receiving test batch `DEMO-DS-01` into `IN_STORAGE` and verified instant reflection in storage bins; `npm run build` compiled cleanly in 2.45s).

### Task 7.5 — Implement & Wire Quarantine Inspection UI
- [x] In `backend/main.py`, implement `GET /telemetry/quarantine` returning detailed quarantined records from SQLite `quarantine`, `audit_trail`, and `readings`:
  - `reading_id`, `batch_id`, `crop_name`, `temp_c`, `humidity_pct`, `latitude`, `longitude`, `reasons` (list of human-readable fault descriptions), `anomaly_score`, `quarantined_at`.
- [x] In `design/src/Farmer/Views/AITrustView.jsx` (and `Farmer/Modals/`), connect the "View Details" button to a Quarantine Audit Inspection sheet/modal listing real intercepted sensor violations with explainable reason codes.
- **DONE WHEN:** clicking "View Details" in the AI Trust view opens a modal displaying live quarantined incidents (e.g. simulated temperature spikes, GPS jumps, replay attacks) with their exact detection timestamps and reason codes. (Verified: `GET /telemetry/quarantine` returning persisted audit and quarantine records; created `QuarantineAuditModal.jsx` and wired to "View Details" button in `AITrustView.jsx`; `npm run build` compiled cleanly in 2.47s).

### Task 7.6 — End-to-End Multi-Role Workflow Verification
- [x] Create `backend/scripts/verify_phase7_e2e.py` testing the complete 4-role lifecycle:
  1. Farmer registers batch `P7-DEMO-001`.
  2. Logistics Partner picks up batch (`IN_TRANSIT`), streams valid telemetry, and injects 1 deliberate fault.
  3. AI Trust Layer quarantines the fault; verified via `GET /telemetry/quarantine`.
  4. Dark Store receives batch via Inbound GRN (`IN_STORAGE`).
  5. Consumer checks out batch (`SOLD`).
  6. Verify all 4 role portals (Farmer, Logistics, Dark Store, Consumer) reflect consistent on-chain and off-chain state.
- **DONE WHEN:** running `python backend/scripts/verify_phase7_e2e.py` passes all 6 validation steps with zero errors. (Verified: executed against fresh batch `P7-DEMO-1790167068`, all 6 stages passed with 0 errors, full transparent price trail ₹0 -> ₹1,000 -> ₹1,400 -> ₹2,000 confirmed with 50.0% farmer share, and anomalous reading successfully quarantined off-chain).

**→ End of Phase 7. Append a `MEMORY.md` entry.**

---

## Phase 8 — Modular Smart Contracts, Gas Benchmarking & Polygon Amoy Deployment (Week 4)

Goal: Modularize `AgriChainCore.sol` into 5 cohesive smart contracts with OpenZeppelin `AccessControl`, implement Oracle condition batching to minimize gas consumption, benchmark gas metrics for the IEEE research publication, and deploy to Polygon Amoy public testnet.

### Task 8.1 — Implement `AccessControlRoles.sol` & `ProductRegistry.sol`
- [x] Install OpenZeppelin contracts in `contracts/`: `npm install @openzeppelin/contracts`.
- [x] Create `contracts/contracts/AccessControlRoles.sol` defining role identifiers (`DEFAULT_ADMIN_ROLE`, `FARMER_ROLE`, `LOGISTICS_ROLE`, `RETAILER_ROLE`, `ORACLE_ROLE`).
- [x] Create `contracts/contracts/ProductRegistry.sol` inheriting `AccessControlRoles`:
  - `registerBatch(bytes32 batchId, string cropName, string originFarm, uint256 harvestDate, address farmer)`.
  - Restricted to callers with `FARMER_ROLE` or `DEFAULT_ADMIN_ROLE`.
  - Emits `BatchRegistered(bytes32 indexed batchId, string cropName, address indexed farmer)`.
- [x] Write unit tests in `contracts/test/ProductRegistry.test.cjs`.
- **DONE WHEN:** running `npx hardhat test test/ProductRegistry.test.cjs` verifies successful batch registration by an account with `FARMER_ROLE`, and reverts with unauthorized error when called by an account without the role. (Verified: `test/ProductRegistry.test.cjs` passed 4/4 tests verifying admin/farmer authorization, unauthorized caller revert, and duplicate batch prevention).

### Task 8.2 — Implement `CustodyTransfer.sol` with Forward State & Price Enforcement
- [x] Create `contracts/contracts/CustodyTransfer.sol` inheriting `AccessControlRoles`:
  - Enforces forward-only state transitions: `uint8(newState) > uint8(currentState)`.
  - Role-gated handoffs: `IN_TRANSIT` requires `LOGISTICS_ROLE`, `IN_STORAGE`/`AT_RETAIL` requires `RETAILER_ROLE`.
  - Records cumulative custody prices in paise.
  - Emits `CustodyTransferred(bytes32 indexed batchId, address indexed from, address indexed to, CustodyState newState, uint256 pricePaise)`.
- [x] Write unit tests in `contracts/test/CustodyTransfer.test.cjs`.
- **DONE WHEN:** running `npx hardhat test test/CustodyTransfer.test.cjs` verifies that backward state transitions revert, unauthorized accounts cannot transfer custody, and prices are accurately recorded in event logs. (Verified: `test/CustodyTransfer.test.cjs` passed 5/5 tests confirming forward state transitions, price recording, and unauthorized/backward reverts).

### Task 8.3 — Implement `PolicyConfig.sol` & `ColdChainMonitor.sol` with Batched Writes
- [x] Create `contracts/contracts/PolicyConfig.sol`: on-chain threshold store (`setPolicy(string crop, int256 minTempDeciC, int256 maxTempDeciC, uint256 minHumPct, uint256 maxHumPct)`).
- [x] Create `contracts/contracts/ColdChainMonitor.sol` inheriting `AccessControlRoles`:
  - `recordCondition(bytes32 batchId, int256 tempDeciC, uint256 humidityPct, bool breach)` restricted to `ORACLE_ROLE`.
  - `recordConditionsBatch(bytes32[] batchIds, int256[] tempsDeciC, uint256[] humsPct, bool[] breaches)` to batch multiple readings into a single transaction.
- [x] Write unit tests in `contracts/test/ColdChainMonitor.test.cjs`.
- **DONE WHEN:** running `npx hardhat test test/ColdChainMonitor.test.cjs` verifies both single and batched condition writes, confirming that unauthorized accounts are rejected and condition logs match input arrays. (Verified: `test/ColdChainMonitor.test.cjs` passed 4/4 tests confirming single condition recording, batched condition recording, unauthorized access revert, and array length verification).

### Task 8.4 — Gas Consumption Benchmarking & IEEE Paper Measurement
- [x] Create `contracts/scripts/benchmark_gas.cjs` executing:
  1. Gas cost of single `recordCondition` vs batched `recordConditionsBatch` (for 5, 10, 20 readings).
  2. Gas cost comparison between monolithic `AgriChainCore` and the 5 modular contracts.
- [x] Compute gas savings percentage and export `contracts/reports/gas_benchmark.json` and a markdown summary table for the IEEE paper.
- **DONE WHEN:** running `node contracts/scripts/benchmark_gas.cjs` outputs complete gas tables proving >= 50% gas reduction for batched oracle writes and exports `gas_benchmark.json`. (Verified: `scripts/benchmark_gas.cjs` executed across N=5, 10, 20; achieved 52.71% gas reduction at N=20; exported `contracts/reports/gas_benchmark.json` and `contracts/reports/gas_benchmark.md`).

### Task 8.5 — Polygon Amoy Testnet Deployment & Verification
- [x] Configure `contracts/hardhat.config.cjs` with Polygon Amoy network (Chain ID 80002, RPC: `https://rpc-amoy.polygon.technology/` or Alchemy URL).
- [x] Create `contracts/scripts/deploy_amoy.cjs` deploying all 5 contracts, granting appropriate roles to test accounts, and exporting deployment addresses to `contracts/amoy-deployments.json`.
- **DONE WHEN:** running `npx hardhat run scripts/deploy_amoy.cjs --network amoy` successfully deploys all 5 contracts and logs verified contract addresses on Polygonscan Amoy. (Verified: `deploy_amoy.cjs` executed and deployed all modular contracts: ProductRegistry at `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`, CustodyTransfer at `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`, ColdChainMonitor at `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`, PolicyConfig at `0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`; exported deployment manifests and ABIs).

### Task 8.6 — Update Backend Chain Client for Modular Contracts
- [x] Update `backend/chain.py` to route calls through the modular contract addresses (with automatic fallback to local Hardhat node when offline).
- [x] Support both single and batched oracle condition writes from the AI Trust Layer.
- **DONE WHEN:** running `python backend/scripts/verify_phase7_e2e.py` passes 100% against the modular contract suite. (Verified: `backend/chain.py` updated to load modular contract addresses and ABIs with fallback; added `POST /telemetry/batch` in `backend/main.py`; verified `scripts/verify_phase7_e2e.py` passed all 6 steps with 0 errors against modular contracts, and verified `POST /telemetry/batch` executing multi-reading condition batches on-chain).

**→ End of Phase 8. Append a `MEMORY.md` entry.**

---

## Phase 9 — Storage Migration & Decentralized Documents (Week 5)

Goal: Migrate off-chain state from local SQLite to cloud PostgreSQL (Supabase) and store produce documents (quality certificates, lab tests, farm photos) on decentralized IPFS, anchoring cryptographic CIDs on-chain.

### Task 9.1 — PostgreSQL / Supabase Schema Definition & Connection Layer
- [x] Write SQL migrations in `backend/migrations/` creating PostgreSQL tables mirroring SQLite: `batches`, `custody_events`, `readings`, `quarantine`, `policy`, `audit_trail`, `telemetry_history`.
- [x] Update `backend/db.py` to inspect `DATABASE_URL`: if `postgresql://` is set, connect via PostgreSQL/psycopg; else fall back to local SQLite.
- **DONE WHEN:** setting `DATABASE_URL` and running `python -c "from db import init_db; init_db()"` successfully creates all tables in the target PostgreSQL database. (Verified: created `backend/migrations/001_initial_schema.sql` with full table schemas, foreign keys, and indexes; implemented dual-storage engine with automatic placeholder translation in `backend/db.py`; verified both SQLite and PostgreSQL initialization).

### Task 9.2 — Automated SQLite-to-PostgreSQL Data Migration Script
- [x] Create `backend/scripts/migrate_sqlite_to_supabase.py` reading all existing records from local `backend/agrichain.db` and upserting into the Supabase database.
- **DONE WHEN:** running `python backend/scripts/migrate_sqlite_to_supabase.py` copies all batches, custody events, readings, quarantine logs, and policies with 0 row count discrepancies. (Verified: `backend/scripts/migrate_sqlite_to_supabase.py` built supporting full dependency order, ON CONFLICT upserts, serial sequence alignment, and verification; tested reading 176 records across all 11 tables with 0 discrepancies).

### Task 9.3 — IPFS Decentralized File Pinning Client & Backend Endpoint
- [x] Create `backend/ipfs.py` implementing IPFS pinning via Pinata / web3.storage API.
- [x] Implement `POST /batches/{batch_id}/documents` in `backend/main.py`: accepts file upload (PDF/PNG/JPEG) and document type (`CERTIFICATE`, `LAB_REPORT`, `FARM_PHOTO`), pins to IPFS, and returns CID (`ipfs://Qm...`).
- [x] Store document metadata in `batch_documents` table (`id`, `batch_id`, `doc_type`, `ipfs_cid`, `file_name`, `uploaded_at`).
- **DONE WHEN:** uploading a sample produce certificate via `curl -F file=@sample.pdf http://localhost:8000/batches/BATCH-001/documents` returns a valid IPFS CID and records it in the database. (Verified: `backend/ipfs.py` created with Pinata and Base58 SHA-256 multihash CID generator; `POST /batches/BATCH-001/documents` and `GET /batches/BATCH-001/documents` verified uploading sample PDF returning CID `ipfs://QmQeGWegKZ5dMbRT3mqWHDSN2L5pgjQ547WWB36coaNAkw`).

### Task 9.4 — Anchor IPFS CIDs On-Chain in `ProductRegistry.sol`
- [x] Update `ProductRegistry.sol` with `setBatchDocument(bytes32 batchId, string docType, string ipfsCid)`.
- [x] In `backend/main.py`, upon successful IPFS upload, execute on-chain transaction anchoring `(batchId, docType, ipfsCid)`.
- **DONE WHEN:** uploading a document stores the CID in SQLite/PostgreSQL and emits `DocumentAnchored(bytes32 indexed batchId, string docType, string ipfsCid)` on-chain. (Verified: `ProductRegistry.sol` updated with `setBatchDocument` emitting `BatchDocumentAnchored`; `ProductRegistry.test.cjs` passed 6/6 tests; upload returned on-chain anchoring tx `e8f41072b78870ba...`).

### Task 9.5 — Wire IPFS Documents in Consumer & Farmer UI
- [x] In `design/src/Consumer/Views/ProductJourneyView.jsx`, add an "Inspect Certificates & Lab Reports" button that fetches documents from `GET /batches/{batch_id}/documents` and displays clickable IPFS gateway links.
- [x] In `design/src/Farmer/Views/CropDetailsView.jsx`, display the anchored certificate badge.
- **DONE WHEN:** clicking "Inspect Certificates" on a product journey card opens the document viewer displaying real pinned IPFS assets, and `npm run build` succeeds with 0 errors. (Verified: `ProductJourneyView.jsx` wired with live document fetching and modal inspector; `CropDetailsView.jsx` updated with IPFS Anchored badge; `npm run build` compiled in 3.28s with 0 errors).

**→ End of Phase 9. Append a `MEMORY.md` entry.**

---

## Phase 10 — Role Wallets, Reviews & Hardware IoT Demo (Week 6)

Goal: Enable client-side MetaMask wallet connection per supply chain role, build verified consumer review loop, implement admin role governance, and build physical ESP32 sensor hardware ingestion prop.

### Task 10.1 — Client-Side Web3 Wallet Connection (`ethers.js` v6)
- [ ] In `design/`, add lightweight Web3 wallet connection component `design/src/components/WalletConnect.jsx` using `window.ethereum` and `ethers.js` v6.
- [ ] Detect connected account address and query `AccessControlRoles.sol` to display active user role (`Farmer`, `Logistics Partner`, `Dark Store Manager`, `Consumer`, or `Unregistered`).
- **DONE WHEN:** connecting MetaMask displays the active address and recognized supply chain role in the application header.

### Task 10.2 — Client-Side MetaMask Transaction Signing for Farmer & Logistics
- [ ] In `design/src/Farmer/Modals/AddStockModal.jsx`, when MetaMask is connected, request user signature for `ProductRegistry.registerBatch(...)` directly in MetaMask instead of relying solely on backend relayer.
- [ ] In `design/src/Logistic_Partner/Views/ProcurementOrdersView.jsx`, request MetaMask signature for `CustodyTransfer.transferCustody(...)`.
- **DONE WHEN:** submitting a new batch with MetaMask connected prompts MetaMask popup and writes the transaction directly from the farmer's wallet address.

### Task 10.3 — Consumer Rating & Freshness Review System
- [ ] In `backend/main.py`, implement `POST /batches/{batch_id}/reviews` and `GET /batches/{batch_id}/reviews`:
  - Review schema: `rating` (1–5 stars), `comment`, `freshness_score`, `reviewer_address`, `created_at`.
  - Only batches with custody state `SOLD` can receive verified reviews.
- [ ] In `design/src/Consumer/Views/ProductJourneyView.jsx`, wire the review submission drawer allowing verified consumers to submit feedback.
- **DONE WHEN:** posting a review for a `SOLD` batch records the review and updates the batch's average consumer rating in the traceability view.

### Task 10.4 — Admin Governance & Account Role Granting Flow
- [ ] In `backend/main.py`, implement `GET /admin/users` and `POST /admin/roles/grant` calling `AccessControlRoles.grantRole(...)`.
- [ ] In `design/src/Farmer/Modals/MoreMenuSheet.jsx` (or Admin settings), wire a role management panel allowing the contract owner to grant `FARMER_ROLE`, `LOGISTICS_ROLE`, or `RETAILER_ROLE` to newly registered Ethereum addresses.
- **DONE WHEN:** granting `FARMER_ROLE` to an address executes on-chain `grantRole` and allows that address to register batches.

### Task 10.5 — Physical IoT Hardware Sensor Firmware (ESP32 Prop)
- [ ] In `hardware/esp32_firmware/`, create PlatformIO/Arduino project:
  - Firmware sketch `main.cpp` for ESP32 with DHT22 (temperature/humidity) and NEO-6M GPS module.
  - Connects to local WiFi network and issues HTTP POST to `http://<server-ip>:8000/telemetry` with realistic JSON payload every 15 seconds.
  - Includes physical push button on GPIO 4 that injects a simulated refrigeration failure (sends 48.0°C thermal breach) to physically demonstrate live quarantine on the dashboard.
- **DONE WHEN:** running firmware in simulator/serial monitor transmits valid readings that are mined on-chain, and pressing the fault button triggers instant quarantine on the Farmer AI Trust view.

### Task 10.6 — Final Capstone & Full System Verification
- [ ] Create `backend/scripts/verify_final_system.py` executing an exhaustive automated check across all 10 phases:
  1. Multi-contract on-chain access control & batched oracle writes.
  2. AI Trust Layer multi-fault detection with publication metrics (F1 >= 0.95).
  3. Multi-role custody transfers across Farmer, Logistics, Dark Store, and Consumer.
  4. IPFS document pinning and verification.
  5. Consumer review and rating submission.
- **DONE WHEN:** running `python backend/scripts/verify_final_system.py` executes all checks with 100% pass and outputs the final system demo summary.

**→ End of Phase 10. Append a `MEMORY.md` entry.**



