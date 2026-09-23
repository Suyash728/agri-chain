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
- [ ] In `backend/main.py`, implement:
  - `GET /logistics/kpis`: returns live KPIs (`totalShipments` in transit, `pendingOrders` ready for pickup, `onTimeDelivery` percentage, `totalLogisticsCost` formatted/paise).
  - `GET /logistics/shipments`: returns active shipments derived from SQLite `batches`, `custody_events`, and latest `readings` (including latest temp, humidity, GPS coordinates, origin farm, current holder, destination).
  - `GET /logistics/orders`: returns pending batches with status `REGISTERED` ready for procurement pickup.
- **DONE WHEN:** querying `GET /logistics/kpis` and `GET /logistics/shipments` via `curl` returns real batches, valid GPS/temp telemetry, and dynamic counts matching database state.

### Task 7.2 — Wire Logistics Partner UI (`LogisticDashboardView.jsx` & Fleet Views)
- [ ] In `design/src/Logistic_Partner/components/LogisticKPICards.jsx` and `LogisticDashboardView.jsx`, replace mock data with `fetch('http://localhost:8000/logistics/kpis')` and `fetch('http://localhost:8000/logistics/shipments')`.
- [ ] In `design/src/Logistic_Partner/Views/TransportationView.jsx` and `ShipmentTrackingView.jsx`, wire fleet cards and live telemetry corridor to display real batches, vehicle numbers, route checkpoints, and live reefer temperatures.
- [ ] Wire a "Dispatch / Pick Up" action triggering `POST /batches/{batch_id}/custody` with state `IN_TRANSIT` and paying the transit price.
- **DONE WHEN:** opening the Logistics Partner portal shows live shipment cards with real crop names and temperatures, and picking up a batch updates its state to `IN_TRANSIT` on-chain.

### Task 7.3 — Implement Dark Store / Retailer Backend Endpoints
- [ ] In `backend/main.py`, implement:
  - `GET /darkstore/kpis`: returns active inventory count (`IN_STORAGE`), inbound deliveries (`IN_TRANSIT`), sales count (`SOLD`), and total revenue.
  - `GET /darkstore/inbound`: returns shipments currently `IN_TRANSIT` destined for or arriving at the dark store hub.
  - `GET /darkstore/inventory`: returns batches currently held in storage (`IN_STORAGE` / `AT_RETAIL`) with batch ID, crop name, quantity, shelf life, and condition summary.
  - `POST /darkstore/receive`: receives inbound delivery, transferring custody state to `IN_STORAGE` on-chain.
  - `POST /darkstore/checkout`: completes consumer purchase, transferring custody state to `SOLD` at retail price on-chain.
- **DONE WHEN:** calling `GET /darkstore/kpis` returns accurate counts from SQLite, and calling `POST /darkstore/receive` followed by `POST /darkstore/checkout` records valid blockchain state transitions.

### Task 7.4 — Wire Dark Store UI (`DarkStoreApp.jsx` & Inbound / Inventory Views)
- [ ] In `design/src/Dark_Store/Views/DarkStoreDashboardView.jsx` and `DarkStoreKPICards.jsx`, replace mock KPIs with live `fetch('http://localhost:8000/darkstore/kpis')`.
- [ ] In `design/src/Dark_Store/Views/InboundGRNView.jsx`, wire inbound deliveries list to `GET /darkstore/inbound` and wire the "Receive Goods / Complete GRN" action to `POST /darkstore/receive`.
- [ ] In `design/src/Dark_Store/Views/MicroInventoryView.jsx`, wire inventory stock table to `GET /darkstore/inventory`.
- **DONE WHEN:** opening the Dark Store portal displays live incoming deliveries, receiving an inbound batch updates inventory in real time, and the UI builds cleanly without layout or style regressions.

### Task 7.5 — Implement & Wire Quarantine Inspection UI
- [ ] In `backend/main.py`, implement `GET /telemetry/quarantine` returning detailed quarantined records from SQLite `quarantine`, `audit_trail`, and `readings`:
  - `reading_id`, `batch_id`, `crop_name`, `temp_c`, `humidity_pct`, `latitude`, `longitude`, `reasons` (list of human-readable fault descriptions), `anomaly_score`, `quarantined_at`.
- [ ] In `design/src/Farmer/Views/AITrustView.jsx` (and `Farmer/Modals/`), connect the "View Details" button to a Quarantine Audit Inspection sheet/modal listing real intercepted sensor violations with explainable reason codes.
- **DONE WHEN:** clicking "View Details" in the AI Trust view opens a modal displaying live quarantined incidents (e.g. simulated temperature spikes, GPS jumps, replay attacks) with their exact detection timestamps and reason codes.

### Task 7.6 — End-to-End Multi-Role Workflow Verification
- [ ] Create `backend/scripts/verify_phase7_e2e.py` testing the complete 4-role lifecycle:
  1. Farmer registers batch `P7-DEMO-001`.
  2. Logistics Partner picks up batch (`IN_TRANSIT`), streams valid telemetry, and injects 1 deliberate fault.
  3. AI Trust Layer quarantines the fault; verified via `GET /telemetry/quarantine`.
  4. Dark Store receives batch via Inbound GRN (`IN_STORAGE`).
  5. Consumer checks out batch (`SOLD`).
  6. Verify all 4 role portals (Farmer, Logistics, Dark Store, Consumer) reflect consistent on-chain and off-chain state.
- **DONE WHEN:** running `python backend/scripts/verify_phase7_e2e.py` passes all 6 validation steps with zero errors.

**→ End of Phase 7. Append a `MEMORY.md` entry.**


