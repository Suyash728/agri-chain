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

**Status:** Phases 1 through 5 are **COMPLETE** and verified against the running Hardhat blockchain node, SQLite database, and React frontend (see `MEMORY.md`).

## 3. Post-Essential Build Phased Roadmap (Phases 6–10)

With the essential end-to-end loop proven, the project advances to integrate the newly contributed AI Trust Layer (`trust-layer/`), wire the remaining role dashboards, modularize smart contracts, and deploy to the public testnet.

```
Essential Loop (Phases 1–5) [COMPLETE]
      │
      ▼
Phase 6: AI Trust Layer Integration & Evaluation (O3, O4)  ◄── NEXT
      │
      ▼
Phase 7: Logistics & Retailer Dashboards + AI Trust UI (O1, O11)
      │
      ▼
Phase 8: Parameterized Contracts & Polygon Amoy Testnet (O5, O6, O13)
      │
      ▼
Phase 9: Cloud DB Migration (Supabase) & IPFS Assets (O7, O10)
      │
      ▼
Phase 10: Role Wallets, Reviews & Hardware Demo (O2, O8, O9, O12)
```

### Phase 6 — AI Trust Layer Integration & Evaluation (O3, O4)
**Goal:** Integrate teammate Rutuja's standalone `trust-layer` module into the core pipeline and produce the research paper results.
- **Tasks & Deliverables:**
  1. Set up dependencies (`scikit-learn`, `pytest`, `httpx`) and verify all 132 unit/integration tests in `trust-layer/tests`.
  2. Implement SQLite persistence for history and audit repositories in `trust-layer/` (replacing transient in-memory stores).
  3. Bind dynamic `CropPolicy` to the registered batch crop in SQLite.
  4. Connect `backend` ingestion to `trust-layer`: raw telemetry evaluated across range, plausibility, feature extraction, Isolation Forest, and integrity checks; approved `OracleHandoffPayload` events write to `AgriChainCore.recordCondition`; rejected readings enter the quarantine store.
  5. Upgrade simulator to stream using the 7 fault injection types (`trust-layer/app/services/simulator.py`).
  6. Run automated evaluation benchmark (`/telemetry/evaluate`) and export precision, recall, F1, confusion matrices, and fault-wise detection figures for the IEEE paper.

### Phase 7 — Role Dashboards Wiring & Quarantine / Trust UI (O1, O11)
**Goal:** Connect Logistics Partner, Dark Store / Retailer, and the AI Trust screens in `design/` to live data.
- **Tasks & Deliverables:**
  1. Wire Logistics Partner dashboard (`design/src/Logistic_Partner/`) with live shipments (`/logistics/shipments`), telemetry stream monitoring, and transit state changes.
  2. Wire Dark Store / Retailer dashboard (`design/src/Dark_Store/`) with inventory stock, expiry alerts, and consumer checkout (`SOLD`).
  3. Wire `design/src/Farmer/Views/AITrustView.jsx` to live AI verification checkpoints (`Cold Chain Integrity`, `GPS Telemetry Validation`, `Tamper Prevention`, `Anomaly Check`) powered by `trust-layer` audit data.
  4. Wire Quarantine inspection drawer/modal to browse quarantined telemetry events and explainable reason codes.

### Phase 8 — Parameterized Smart Contracts & Polygon Amoy Deployment (O5, O6, O13)
**Goal:** Modularize `AgriChainCore.sol` into 5 customized contracts and deploy to public Polygon Amoy testnet.
- **Tasks & Deliverables:**
  1. Split contract into `ProductRegistry.sol`, `CustodyTransfer.sol`, `ColdChainMonitor.sol`, `PolicyConfig.sol`, and `AccessControlRoles.sol` with OpenZeppelin `AccessControl`.
  2. Implement batching for oracle condition writes to optimize gas consumption.
  3. Configure Hardhat for Polygon Amoy (Chain ID 80002) with test POL faucets and update `backend/chain.py` RPC client.
  4. Execute deployment script and verify contracts on Polygonscan Amoy.

### Phase 9 — Storage Migration & Decentralized Documents (O7, O10)
**Goal:** Migrate off-chain state to cloud PostgreSQL (Supabase) and store heavy documents on IPFS.
- **Tasks & Deliverables:**
  1. Provision Supabase project; migrate SQLite schemas (`batches`, `custody_events`, `readings`, `quarantine`, `policy`, `audit_trail`).
  2. Integrate IPFS client (Pinata / web3.storage) for certificates, harvest photos, and batch invoices; anchor resulting CIDs on-chain.

### Phase 10 — Role Wallets, Reviews & Hardware Demo (O2, O8, O9, O12)
**Goal:** Per-user MetaMask transaction signing, consumer review loop, and optional ESP32 physical demo prop.
- **Tasks & Deliverables:**
  1. Integrate frontend Web3 wallet connection (`ethers.js` v6) for role-gated contract writes.
  2. Consumer review submission and rating anchor tied to purchased batch ID.
  3. Admin account approval and role granting workflow.
  4. (Optional) Single ESP32 + DHT22 + GPS hardware tracker feeding telemetry to `POST /telemetry` over WiFi.

## 4. Work Discipline & Phase Handoffs

- Work one phase at a time; complete all tasks and "DONE WHEN" checks before proceeding to the next phase.
- Always append to `MEMORY.md` at each phase boundary.
- Adhere strictly to `RULES.md` and the frontend "wire, don't create" rule.

