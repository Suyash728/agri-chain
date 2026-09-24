# PLAN.md

The build plan. This is the roadmap — phases and their goals. For the actual
day-by-day checklist with runnable commands, see `TASKS.md`, which implements
this plan.

## How this plan is organized

**Linear, not split by frontend/backend.** There is one sequence of phases,
done in order, by whoever (or whatever agent) is working — not parallel
tracks handed to different people that later need to be integrated. This is
possible specifically because `ARCHITECTURE.md` §4 establishes that the API
contract is already fixed (it's `mockData.js`), so there's no need for a
frontend track and a backend track to coordinate on a spec while building
simultaneously. Build the thing the data comes *from* before the thing that
*displays* it, in a straight line, and each phase is fully working before the
next starts.

**Essential features only for the first two weeks.** Everything in `PRD.md`
§5 "Essential" — nothing from "Optional." The optional roadmap in §3 below
exists so nothing from the original vision is lost, but none of it is
scheduled yet.

## 1. Essential build — 5 phases, 2 weeks

| Phase | Goal | Proves |
|---|---|---|
| **1. Environment** | Every tool installed, `design/` runs, empty `contracts/` and `backend/` scaffolded | The three sub-projects can coexist and each starts cleanly |
| **2. Smart contract** | `AgriChainCore.sol` deployed to a local Hardhat node, with passing tests for register/transfer/record | The blockchain layer works in isolation, callable from a script |
| **3. Backend** | FastAPI app with SQLite, the rule-based AI trust layer, and `web3.py` writing to the contract from Phase 2 | Sensor data → validation → chain, end to end, via `curl`/Postman — no UI yet |
| **4. Simulator** | One script sending readings for one batch, with a flag to send one deliberately bad reading | Phase 3's validation actually catches something, not just passes everything through |
| **5. Frontend wiring** | Farmer dashboard + Consumer traceability/QR screens in `design/` fetch real data from Phase 3 instead of `mockData.js` | The whole loop is visible and demoable, matching `PRD.md` §6 exactly |

Each phase is a hard prerequisite for the next — Phase 3 cannot meaningfully
start until Phase 2's contract is deployed and tested, because Phase 3 needs
something real to call. Do not skip ahead.

**After each phase**, append an entry to `MEMORY.md` — see that file's
format. This is not optional busywork; it's how the next session (which
starts with zero memory) knows phase 2 is actually done before starting
phase 3.

## 2. Two-week schedule

This assumes roughly one working session per day. If progress is faster or
slower, the phase boundaries matter more than the day numbers — don't start
Phase 3 on "day 6" if Phase 2's tests aren't passing yet, even if the
calendar says otherwise.

| Days | Phase | Detail in `TASKS.md` |
|---|---|---|
| 1–2 | Phase 1 — Environment | Tasks 1.1–1.4 |
| 3–5 | Phase 2 — Smart contract | Tasks 2.1–2.5 |
| 6–9 | Phase 3 — Backend | Tasks 3.1–3.7 |
| 10–11 | Phase 4 — Simulator | Tasks 4.1–4.3 |
| 12–14 | Phase 5 — Frontend wiring + end-to-end check | Tasks 5.1–5.6 |

**Status:** Phases 1 through 7 are **COMPLETE** and verified against the running Hardhat blockchain node, SQLite database, AI Trust Layer, and React multi-role frontend (see `MEMORY.md`).

## 3. Post-Essential Build Phased Roadmap (Phases 6–10)

With the essential end-to-end loop and multi-role dashboards complete, the project advances to modularizing smart contracts with OpenZeppelin access controls, benchmarking gas efficiency, deploying to public testnet (Polygon Amoy), migrating off-chain storage to cloud PostgreSQL (Supabase) and IPFS, and enabling wallet-based MetaMask signing with physical IoT hardware ingestion.

```
Essential Loop (Phases 1–5) [COMPLETE]
      │
      ▼
Phase 6: AI Trust Layer Integration & Evaluation (O3, O4) [COMPLETE]
      │
      ▼
Phase 7: Role Dashboards Wiring & Quarantine / Trust UI (O1, O11) [COMPLETE]
      │
      ▼
Phase 8: Modular Smart Contracts, Gas Benchmarking & Polygon Amoy (O5, O6, O13) ◄── NEXT
      │
      ▼
Phase 9: Cloud DB Migration (Supabase) & Decentralized IPFS Storage (O7, O10)
      │
      ▼
Phase 10: Role Wallets, Reviews & Hardware IoT Demo (O2, O8, O9, O12)
```

### Phase 6 — AI Trust Layer Integration & Evaluation (O3, O4) — [COMPLETE]
**Goal:** Integrate teammate Rutuja's standalone `trust-layer` module into the core pipeline and produce the research paper results.
- **Tasks & Deliverables:**
  1. Set up dependencies (`scikit-learn`, `pytest`, `httpx`) and verified all 147 unit/integration tests in `trust-layer/tests`.
  2. Implemented SQLite persistence for history and audit repositories in `trust-layer/` (`telemetry_history`, `audit_trail`, `replay_events`).
  3. Bound dynamic `CropPolicy` to the registered batch crop in SQLite (`Tomato`, `Mango`, `Wheat`).
  4. Connected `backend` ingestion to `trust-layer`: raw telemetry evaluated across range, plausibility, feature extraction, Isolation Forest, and integrity checks; approved `OracleHandoffPayload` events write to `AgriChainCore.recordCondition`; rejected readings enter the quarantine store.
  5. Upgraded simulator to stream using the 7 fault injection types (`trust-layer/app/services/simulator.py`).
  6. Ran automated evaluation benchmark (`/telemetry/evaluate`) and exported publication-ready figures (confusion matrix, fault detection rates, performance summary) with F1-score of 0.9722 for the IEEE paper.
  7. Wired `design/src/Farmer/Views/AITrustView.jsx` to live AI verification checkpoints (`Cold Chain Integrity`, `GPS Telemetry Validation`, `Tamper Prevention`, `Anomaly Check`) powered by `trust-layer` audit data.

### Phase 7 — Role Dashboards Wiring & Quarantine / Trust UI (O1, O11) — [COMPLETE]
**Goal:** Connect Logistics Partner, Dark Store / Retailer, and the Quarantine Inspection UI in `design/` to live data and on-chain custody states.
- **Tasks & Deliverables:**
  1. Implemented Logistics Partner backend endpoints (`GET /logistics/kpis`, `/logistics/shipments`, `/logistics/orders`) in `backend/main.py`.
  2. Wired Logistics Partner UI (`LogisticKPICards.jsx`, `LogisticDashboardView.jsx`, `TransportationView.jsx`, `ShipmentTrackingView.jsx`, and `ProcurementOrdersView.jsx`) with live telemetry and on-chain dispatch (`POST /batches/{batch_id}/custody`).
  3. Implemented Dark Store / Retailer backend endpoints (`GET /darkstore/kpis`, `/darkstore/inbound`, `/darkstore/inventory`, `POST /darkstore/receive`, `POST /darkstore/checkout`) in `backend/main.py`.
  4. Wired Dark Store UI (`DarkStoreKPICards.jsx`, `DarkStoreDashboardView.jsx`, `InboundGRNView.jsx`, and `MicroInventoryView.jsx`) with live inventory bays and inbound GRN reception.
  5. Implemented `GET /telemetry/quarantine` and created `design/src/Farmer/Modals/QuarantineAuditModal.jsx` wired to the "View Details" button in `AITrustView.jsx`.
  6. Verified end-to-end multi-role lifecycle via `backend/scripts/verify_phase7_e2e.py` (all 6 stages passing with 50.0% farmer fair price share proven).

---

### Phase 8 — Modular Smart Contracts, Gas Benchmarking & Polygon Amoy Deployment (O5, O6, O13)
**Goal:** Modularize the monolithic `AgriChainCore.sol` into 5 domain-specific smart contracts with OpenZeppelin role-based access control, benchmark gas consumption with Oracle condition batching for the IEEE publication, and deploy to the public Polygon Amoy testnet.
- **Tasks & Deliverables:**
  1. **Contract Modularization:** Split `AgriChainCore.sol` into 5 cohesive contracts in `contracts/contracts/`:
     - `AccessControlRoles.sol`: defines role hierarchy (`DEFAULT_ADMIN_ROLE`, `FARMER_ROLE`, `LOGISTICS_ROLE`, `RETAILER_ROLE`, `ORACLE_ROLE`) using OpenZeppelin `AccessControl`.
     - `ProductRegistry.sol`: registers produce batches, stores farm origin, harvest date, and farmer address; restricted to `FARMER_ROLE`.
     - `CustodyTransfer.sol`: manages forward custody transitions (`REGISTERED` → `IN_TRANSIT` → `IN_STORAGE` → `AT_RETAIL` → `SOLD`), enforces role-authorized handoffs, and records price paid at each stage.
     - `ColdChainMonitor.sol`: records verified IoT condition readings; restricted to `ORACLE_ROLE` (the AI Trust Layer backend).
     - `PolicyConfig.sol`: on-chain crop-specific thresholds (min/max temperature, humidity, breach penalties) queried by `ColdChainMonitor`.
  2. **Oracle Condition Batching & Gas Optimization (O13):**
     - Add `recordConditionsBatch(bytes32[] batchIds, int256[] temps, uint256[] hums, bool[] breaches)` to `ColdChainMonitor.sol` to aggregate consecutive IoT readings into a single transaction, reducing gas costs by 60–80%.
  3. **Gas Benchmarking & Publication Measurements:**
     - Create `contracts/scripts/benchmark_gas.cjs` measuring exact gas costs (units + estimated USD/POL) across:
       - Single vs batched oracle condition writes.
       - Monolithic `AgriChainCore` vs Modularized 5-contract architecture.
     - Export gas comparison tables and charts for Section IV of the IEEE research paper.
  4. **Comprehensive Test Suite:**
     - Write Hardhat tests for each contract in `contracts/test/` verifying access control enforcement (unauthorized role revert), forward-only state progression, and batched condition writes.
  5. **Polygon Amoy Testnet Deployment (O5):**
     - Configure `contracts/hardhat.config.cjs` for Polygon Amoy (Chain ID 80002) using Alchemy/Infura RPC and test POL.
     - Deploy all 5 contracts to Polygon Amoy; verify source code on Polygonscan Amoy.
     - Update `backend/chain.py` to route through deployed contract addresses with fallback to local Hardhat node.

---

### Phase 9 — Storage Migration & Decentralized Documents (O7, O10)
**Goal:** Migrate off-chain state from local SQLite to cloud-hosted PostgreSQL (Supabase) and store heavy media assets (produce inspection certificates, farm photos, lab reports) on decentralized IPFS, anchoring content identifiers (CIDs) on-chain.
- **Tasks & Deliverables:**
  1. **Supabase / PostgreSQL Provisioning & Schema Migration (O7):**
     - Set up Supabase project and write PostgreSQL DDL migrations mirroring `batches`, `custody_events`, `readings`, `quarantine`, `policy`, `audit_trail`, and `telemetry_history`.
     - Update `backend/db.py` with SQLAlchemy/asyncpg connection layer supporting both local SQLite (for offline dev/tests) and Supabase PostgreSQL via `DATABASE_URL`.
  2. **Automated Data Migration Script:**
     - Build `backend/scripts/migrate_sqlite_to_supabase.py` to seamlessly copy local SQLite history, crop policies, and audit logs to Supabase without data loss.
  3. **IPFS Decentralized Storage Client (O10):**
     - Implement `backend/ipfs.py` connecting to Pinata / web3.storage API.
     - Add `POST /batches/{batch_id}/documents` endpoint accepting produce quality certificates (PDF) and farm photos (JPEG/PNG), pinning them to IPFS, and returning cryptographic CIDs (`ipfs://Qm...`).
  4. **On-Chain CID Anchoring:**
     - Update `ProductRegistry.sol` to record `documentCID` during batch registration or inspection.
  5. **Frontend Document Preview:**
     - Wire IPFS certificate link and preview modal in Consumer product journey view (`design/src/Consumer/Views/ProductJourneyView.jsx`) and Farmer batch details.

---

### Phase 10 — Role Wallets, Reviews & Hardware IoT Demo (O2, O8, O9, O12)
**Goal:** Enable client-side MetaMask wallet signing per role, build consumer feedback and review loop, implement admin role governance, and build physical ESP32 sensor hardware ingestion prop.
- **Tasks & Deliverables:**
  1. **Web3 Client-Side Wallet Integration (O2):**
     - Add `ethers.js` v6 wallet connection hook in `design/src/components/WalletConnect.jsx`.
     - Allow Farmers, Logistics operators, and Dark Store managers to connect their MetaMask wallet, verifying their on-chain role via `AccessControlRoles.sol`.
     - Switch transaction signing from backend-only account to client-side MetaMask for batch registration and custody handoffs when a wallet is connected.
  2. **Consumer Rating & Feedback System (O8):**
     - Implement `POST /batches/{batch_id}/reviews` and `GET /batches/{batch_id}/reviews`.
     - In `design/src/Consumer/Views/ProductJourneyView.jsx`, add a review submission drawer allowing verified consumers of `SOLD` batches to rate quality, freshness, and delivery speed.
  3. **Admin Governance & Role Approval Flow (O9):**
     - Build admin view in `design/` connected to `GET /admin/users` and `POST /admin/roles/grant` to approve new supply chain participants and assign roles in `AccessControlRoles.sol`.
  4. **Physical IoT Hardware Ingestion Prop (O12):**
     - Create Arduino/PlatformIO firmware sketch in `hardware/esp32_firmware/`:
       - ESP32 micro-controller + DHT22/DS18B20 temperature/humidity sensor + NEO-6M GPS module.
       - Connects to WiFi and transmits live sensor readings to `POST /telemetry` over HTTP every 15 seconds.
       - Includes physical toggle button to simulate refrigeration unit failure (injecting live real-world temperature breach).
  5. **Final System E2E Demonstration & Capstone Verification:**
     - Create `backend/scripts/verify_final_system.py` verifying all 10 phases running concurrently.
     - Produce comprehensive project evaluation report and demo walkthrough video checklist.

## 4. Work Discipline & Phase Handoffs

- Work one phase at a time; complete all tasks and "DONE WHEN" checks before proceeding to the next phase.
- Always append a new entry to `MEMORY.md` at each phase boundary. Never rewrite or delete past history.
- Adhere strictly to `RULES.md` and the frontend "wire, don't create" rule.



## 5. Phase 11 (added) — Frontend interaction depth

Backend wiring so far covers page-level display (dashboards, journey views).
It does not cover per-component *interactions* — modals, dialogs, confirm
actions — with real data. See `MEMORY.md`'s "Audit — frontend interaction
depth" entry for the exact gap. This phase closes it, role by role, cheapest
and highest-value first. Full tasks: `TASKS.md` Phase 11.
