# ARCHITECTURE.md

How the system is built, exactly. If `PRD.md` says *what* and *why*, this file
says *how* — tech stack, repo layout, data flow, data model. Read `PRD.md`
first if you haven't.

## 1. Why this architecture differs from the original plan — read this first

`docs/proposal/KisanChain_Project_Context.md` describes a more ambitious
target architecture: Next.js 14, Supabase/Postgres, five separate smart
contracts with full OpenZeppelin `AccessControl`, deployment to the Polygon
Amoy public testnet, a five-service split (`contracts/` / `trust-layer/` /
`indexer/` / `web/` / `simulator/`), and a trained ML anomaly model
(Isolation Forest → LSTM-autoencoder).

That target is still correct — it's the Optional tier in `PRD.md`. This
document describes a **deliberately simplified essential architecture**,
chosen for two reasons that override the original plan for the first two
weeks specifically:

1. **The frontend is already built, and it's not Next.js.** `design/` is a
   Vite + React 18 + Tailwind app using plain `useState` for all navigation
   and data (no router, no server components). The essential architecture
   below is designed to slot a real backend under this *actual* app, not the
   Next.js app the original plan assumed would be built from scratch.
2. **This is being built by a local AI agent (gpt-oss-20b / gemma-4-12b via
   Ollama) in two weeks.** Every simplification below trades some
   production-readiness for fewer moving parts, less cross-service
   coordination, and less that a small local model can get subtly wrong.
   Every one of them is reversible — see the matching Optional item in
   `PRD.md` §5.

| Original plan | Essential architecture | Status / Target Phase |
|---|---|---|
| Next.js 14 frontend | Existing Vite + React app in `design/`, wired not rebuilt | Preserved — Vite React app fully wired across Farmer, Logistics, Dark Store, and Consumer roles |
| Supabase (Postgres, cloud) | SQLite, one file, zero setup | Phase 9 (O7): Dual SQLite / Supabase PostgreSQL hybrid layer |
| 5 smart contracts + OpenZeppelin `AccessControl` | 1 consolidated contract, simple owner check | Phase 8 (O6): Modular 5-contract suite + OpenZeppelin `AccessControl` |
| Deployed to Polygon Amoy (public testnet) | Deployed to a local Hardhat node | Phase 8 (O5): Deployed to Polygon Amoy testnet (Chain ID 80002) |
| 5 separate services (`trust-layer`, `indexer`, oracle writer, etc.) | 1 FastAPI app doing ingestion + validation + chain writes + the REST API | Hybrid: Standalone `trust-layer` integrated directly in Phase 6 |
| ML anomaly model (Isolation Forest / LSTM-AE) | Rule-based threshold + plausibility checks | Phase 6 (O3): Dual-stage Isolation Forest & 11-D feature engineering complete |
| MetaMask, per-user signing | One backend-held account signs everything | Phase 10 (O2): Client-side MetaMask signing with backend relayer fallback |
| MQTT ingestion | Plain HTTP POST | Phase 10 (O12): ESP32 hardware telemetry ingestion |

Nothing here is a scope cut on the *idea* — every layer of the original
architecture (sensor → AI → chain → dashboard → consumer) still exists and
still does its job. What was simplified for the essential build is being
systematically expanded across Phases 6 through 10.

## 2. Repo layout

```
agri-chain/
├── design/              EXISTING, working React frontend. Wire, don't rebuild.
│   ├── src/
│   │   ├── data/mockData.js         Farmer + shared mock data — THIS IS THE API CONTRACT (see §4)
│   │   ├── Farmer/                  Farmer dashboard, registration modal, AI trust view, quarantine modal
│   │   ├── Logistic_Partner/        Logistics dashboard, live transit dispatch, shipment tracking
│   │   ├── Dark_Store/              Dark Store dashboard, inbound GRN reception, micro-inventory
│   │   ├── Consumer/                Consumer product journey, live provenance & price fairness card
│   │   ├── components/WalletConnect.jsx   Web3 MetaMask wallet connect (Phase 10)
│   │   └── App.jsx                  Role switcher + top-level state
│   └── DESIGN.md                    Visual design system — do not edit
│
├── contracts/            Hardhat + Solidity project.
│   ├── contracts/
│   │   ├── AgriChainCore.sol        Consolidated contract (Phases 2-7)
│   │   ├── AccessControlRoles.sol   Role hierarchy & OpenZeppelin AccessControl (Phase 8)
│   │   ├── ProductRegistry.sol      Batch registration & farmer provenance (Phase 8)
│   │   ├── CustodyTransfer.sol      Custody state machine & price trail (Phase 8)
│   │   ├── ColdChainMonitor.sol     Condition logging & batched oracle writes (Phase 8)
│   │   └── PolicyConfig.sol         Crop threshold configuration (Phase 8)
│   ├── test/                        Hardhat tests (unit & role authorization)
│   ├── scripts/benchmark_gas.cjs    Gas benchmarking suite for IEEE research paper (Phase 8)
│   └── hardhat.config.cjs           Local Hardhat + Polygon Amoy testnet config
│
├── trust-layer/          AI Trust Layer (Phase 6).
│   ├── app/
│   │   ├── core/                    Config, logging, crop policy definitions
│   │   ├── schemas/                 Pydantic schemas (telemetry, oracle handoff v1.0)
│   │   ├── services/                Range check, plausibility, feature extraction, Isolation Forest, simulator
│   │   ├── storage/                 SQLite audit trail and telemetry history repositories
│   │   └── api/routes.py            Evaluation, telemetry, and benchmark endpoints
│   └── tests/                       147 passing unit & integration tests
│
├── backend/              FastAPI service — ingestion, AI validation, chain writes, REST API.
│   ├── main.py                      FastAPI app + multi-role routes (Farmer, Logistics, Dark Store, Consumer)
│   ├── db.py                        Database layer: SQLite (default) and Supabase PostgreSQL (Phase 9)
│   ├── ipfs.py                      Decentralized certificate & document pinning (Phase 9)
│   ├── chain.py                     web3.py wrapper — talks to local Hardhat node or Polygon Amoy
│   ├── scripts/                     Automated E2E verification suites (Phase 5, Phase 7, Phase 8-10)
│   └── requirements.txt
│
├── simulator/            IoT telemetry simulation.
│   └── simulate.py                  Streams GPS/temperature/humidity sequences with fault injection
│
├── hardware/             Physical IoT hardware sketches (Phase 10).
│   └── esp32_firmware/              ESP32 + DHT22 + GPS telemetry transmitter
│
├── docs/                 Project documentation, proposals, and system diagrams.
│
├── AGENTS.md, PRD.md, ARCHITECTURE.md, RULES.md, PLAN.md, TASKS.md, MEMORY.md
```

`indexer/` and `web/` from the original plan don't exist as separate folders
in the essential build — `backend/` and `design/` absorb their jobs
respectively. They can be split out later (Optional tier) if the monolith
becomes unwieldy.

## 3. Telemetry Processing & AI Trust Layer Architecture

In the essential build, a simple rule-based validation script (`backend/validation.py`) handled threshold checks. In the production architecture (Phase 6+), this is replaced by the comprehensive **AI Trust Layer** (`trust-layer/`), which serves as the gatekeeper addressing **Research Gap 5 (Oracle Trust)**:

```
IoT Sensors / Simulator (7 Fault Types)
              │
              ▼
   POST /telemetry (FastAPI)
              │
              ├─► SQLite `readings`: raw reading logged first (audit integrity)
              │
              ├─► AI Trust Layer Pipeline:
              │     1. Schema Validation (Pydantic)
              │     2. Range Validation (Agricultural cold-chain bounds)
              │     3. Physical & Temporal Plausibility (Haversine GPS velocity, temp/humidity rate-of-change, sequence)
              │     4. Time-Series Feature Engineering (11-D dynamic feature vector)
              │     5. ML Anomaly Detection (Unsupervised Isolation Forest)
              │     6. Cryptographic Integrity & Replay Detection (SHA-256 fingerprint, nonce/replay check)
              │     7. Trust Verdict Engine (VALID | ANOMALOUS | INSUFFICIENT_EVIDENCE)
              │     8. Off-chain Quarantine & Audit Trail (READY_FOR_ORACLE | QUARANTINED | ON_HOLD)
              │
              ├─► IF VALID & READY_FOR_ORACLE:
              │     └─► Oracle Handoff (OracleHandoffPayload v1.0)
              │           └─► chain.py: call AgriChainCore.recordCondition() via web3.py
              │                 └─► ConditionRecorded event written to Hardhat / Polygon
              │
              └─► IF ANOMALOUS & QUARANTINED:
                    └─► insert into SQLite `quarantine` with ordered reason codes
                          (never touches blockchain)
```

### Oracle Handoff Contract
The boundary between the AI Trust Layer and the blockchain is defined by `OracleHandoffPayload` (schema v1.0 in `trust-layer/app/schemas/oracle.py`). Only events meeting strict criteria (`verdict == VALID` and `disposition == READY_FOR_ORACLE`) are approved for on-chain submission. Tampered, anomalous, or replay events are stopped cold at this boundary.

**Audit integrity rule:** Raw telemetry is **always written to the database first**, before validation runs. This preserves the complete historical audit trail for inspection even when a reading is quarantined.


## 4. The API contract is `mockData.js` — there is no separate contract document

`design/src/data/mockData.js` and `design/src/Consumer/data/consumerData.js`
(and any other per-role mock data files under `design/src/*/data/`) already
define, in exact JavaScript object shape, every piece of data every screen in
the app expects. This is why there is no `API-CONTRACT.md` in this repo and
none is needed:

**The rule: when you wire a screen to real data, the JSON your backend
endpoint returns must have the exact same keys, nesting, and types as the
mock object it's replacing — no more, no fewer, no renamed fields.**

Concretely: `design/src/data/mockData.js` exports `kpiMetrics`, an array of
objects each shaped `{id, title, value, unit, type}`. If you're wiring the
Farmer dashboard's KPI cards to real data, your backend's `GET
/farmer/{id}/kpis` endpoint must return JSON that is a list of objects with
exactly those five keys. Open the mock file, copy the shape, fill it with
real values. Do not invent a different shape because it seems more "correct"
from a backend perspective — the frontend component was written against the
mock shape and expects it exactly.

This is also why the build is linear and doesn't need a frontend/backend
split with a negotiated contract in between: **the contract already exists,
was written first (by the mockData files), and doesn't require agreement
between two tracks working in parallel.** Read the mock shape, build the
endpoint to match it, wire the fetch call. One person, one agent, one
sequence, per screen.

## 5. Smart contract — essential shape

One contract, `AgriChainCore.sol`, replacing the originally-planned five
(`ProductRegistry`, `CustodyTransfer`, `ColdChainMonitor`, `PolicyConfig`,
`AccessControlRoles`). All five contracts' *responsibilities* still exist —
they're just functions and mappings on one contract instead of five contracts
calling each other.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriChainCore {
    address public owner;

    enum CustodyState { REGISTERED, IN_TRANSIT, IN_STORAGE, AT_RETAIL, SOLD }

    struct Batch {
        string cropName;
        string originFarm;
        uint256 harvestDate;
        address currentHolder;
        CustodyState state;
        bool exists;
    }

    mapping(bytes32 => Batch) public batches;

    event BatchRegistered(bytes32 indexed batchId, string cropName, address farmer);
    event CustodyTransferred(bytes32 indexed batchId, address from, address to, CustodyState newState, uint256 pricePaise);
    event ConditionRecorded(bytes32 indexed batchId, int256 tempDeciC, uint256 humidityPct, bool breach);

    modifier onlyOwner() {
        require(msg.sender == owner, "AgriChain: caller is not the backend");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // All writes come from the backend's single account (see ARCHITECTURE.md S3).
    // Per-user wallet signing is Optional tier (O2 in PRD.md) — not implemented here.

    function registerBatch(bytes32 batchId, string calldata cropName, string calldata originFarm, uint256 harvestDate, address farmer) external onlyOwner {
        require(!batches[batchId].exists, "AgriChain: batch already exists");
        batches[batchId] = Batch(cropName, originFarm, harvestDate, farmer, CustodyState.REGISTERED, true);
        emit BatchRegistered(batchId, cropName, farmer);
    }

    function transferCustody(bytes32 batchId, address to, CustodyState newState, uint256 pricePaise) external onlyOwner {
        Batch storage b = batches[batchId];
        require(b.exists, "AgriChain: unknown batch");
        require(uint8(newState) > uint8(b.state), "AgriChain: no backward transitions");
        address from = b.currentHolder;
        b.currentHolder = to;
        b.state = newState;
        emit CustodyTransferred(batchId, from, to, newState, pricePaise);
    }

    function recordCondition(bytes32 batchId, int256 tempDeciC, uint256 humidityPct, bool breach) external onlyOwner {
        require(batches[batchId].exists, "AgriChain: unknown batch");
        emit ConditionRecorded(batchId, tempDeciC, humidityPct, breach);
    }
}
```

Notes for whoever (or whatever) implements this:

- **Prices are `uint256 pricePaise`** — paise, not rupees, and always an
  integer. Never use a `float`/`decimal` for money anywhere in this project,
  in Solidity or Python. See `RULES.md`.
- **Temperature is `int256 tempDeciC`** — tenths of a degree Celsius, signed
  (temperatures can be negative), so `4.5°C` is stored as `45`. Same
  "no floats for anything read back into logic" reasoning.
- `onlyOwner` here means "only the backend's one account can write" — this
  is deliberately not real per-role access control. Upgrading to
  OpenZeppelin `AccessControl` with per-role permissions is O6.
- The event log (`BatchRegistered`, `CustodyTransferred`, `ConditionRecorded`)
  is what the backend reads back to answer "what's this batch's journey" —
  there's no need for extra on-chain storage or a separate indexer service
  for the essential build; `backend/chain.py` can query events directly via
  web3.py when a traceability view is requested. This is slower than a real
  indexer at scale and completely fine at essential-build scale (a handful
  of demo batches).

### 5.1 Modular smart contracts suite & Gas optimization (Phase 8)

In Phase 8 (O6, O13, O5), the monolithic `AgriChainCore.sol` is modularized into 5 contracts with OpenZeppelin `AccessControl` and batched condition writes:

```
                      ┌────────────────────────┐
                      │ AccessControlRoles.sol │
                      │ (Admin, Farmer, Trans, │
                      │  Retailer, Oracle)     │
                      └───────────┬────────────┘
                                  │ inherits / verifies
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ProductRegistry.sol│   │CustodyTransfer.sol│   │ColdChainMonitor.sol│
│- registerBatch   │    │- transferCustody │    │- recordCondition   │
│- docCID anchoring│    │- pricePaise trail│    │- recordBatch       │
│[FARMER_ROLE]     │    │[LOGISTICS/RETAIL]│    │[ORACLE_ROLE]       │
└──────────────────┘    └──────────────────┘    └─────────┬──────────┘
                                                          │ queries
                                                          ▼
                                                ┌──────────────────┐
                                                │ PolicyConfig.sol │
                                                │ - crop thresholds│
                                                │ [ADMIN_ROLE]     │
                                                └──────────────────┘
```

1. **`AccessControlRoles.sol`**:
   - Manages role assignments via OpenZeppelin `AccessControl`:
     - `DEFAULT_ADMIN_ROLE`: Contract deployer and system governor.
     - `FARMER_ROLE`: Permitted to register new produce batches.
     - `LOGISTICS_ROLE`: Permitted to initiate transit handoffs.
     - `RETAILER_ROLE`: Permitted to accept inventory into dark stores and record retail sales.
     - `ORACLE_ROLE`: Restricted to the validated AI Trust Layer relayer account for posting telemetry.
2. **`ProductRegistry.sol`**:
   - Manages produce registration: `cropName`, `originFarm`, `harvestDate`, `farmerAddress`, and `documentCID` (IPFS hash for certificates).
   - Only accounts with `FARMER_ROLE` can invoke `registerBatch`.
3. **`CustodyTransfer.sol`**:
   - Enforces strict monotonic forward lifecycle: `REGISTERED` → `IN_TRANSIT` → `IN_STORAGE` → `AT_RETAIL` → `SOLD`.
   - Records the exact purchase price (`uint256 pricePaise`) paid at each handoff, emitting `CustodyTransferred`.
4. **`ColdChainMonitor.sol`**:
   - Ingests verified telemetry from `ORACLE_ROLE`.
   - Implements both single write `recordCondition` and multi-reading batch write:
     `recordConditionsBatch(bytes32[] batchIds, int256[] temps, uint256[] hums, bool[] breaches)`
   - Queries `PolicyConfig` to ensure compliance.
5. **`PolicyConfig.sol`**:
   - Stores crop cold-chain parameters (min/max temperature, humidity tolerance) on-chain.
   - Modifiable only by `DEFAULT_ADMIN_ROLE`.

#### Gas Optimization Mechanism (O13)
Each individual transaction on an EVM blockchain incurs a 21,000 gas base overhead plus execution and storage costs. For IoT sensors transmitting data at high frequencies, single-reading transactions are cost-prohibitive. `recordConditionsBatch` amortizes the base transaction cost across *N* readings, packing timestamps, signed deci-Celsius temperatures, and breach booleans into contiguous arrays. This reduces per-reading gas costs by 60–80%, providing empirical validation for Section IV of the research paper.

## 6. Data model — SQLite (essential)

One file, `backend/agrichain.db`. Five tables, deliberately fewer than the
full ER diagram in `docs/diagrams/er/er-diagram.png` (that diagram is the
Optional/eventual target — see O7).

```sql
CREATE TABLE batches (
    batch_id      TEXT PRIMARY KEY,      -- same id used on-chain, e.g. a short hex string
    crop_name     TEXT NOT NULL,
    origin_farm   TEXT NOT NULL,
    harvest_date  TEXT NOT NULL,
    farmer_name   TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE custody_events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id      TEXT NOT NULL REFERENCES batches(batch_id),
    from_holder   TEXT,
    to_holder     TEXT NOT NULL,
    state         TEXT NOT NULL,          -- REGISTERED | IN_TRANSIT | IN_STORAGE | AT_RETAIL | SOLD
    price_paise   INTEGER NOT NULL,
    tx_hash       TEXT,
    occurred_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE readings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id      TEXT NOT NULL REFERENCES batches(batch_id),
    temp_c        REAL NOT NULL,
    humidity_pct  REAL NOT NULL,
    verdict       TEXT NOT NULL,          -- VALID | ANOMALOUS
    tx_hash       TEXT,                   -- set only if verdict = VALID
    received_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE quarantine (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_id    INTEGER NOT NULL REFERENCES readings(id),
    reason        TEXT NOT NULL,          -- e.g. "temperature above policy max: 42.0 > 8.0"
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE policy (
    crop_name     TEXT PRIMARY KEY,
    min_temp_c    REAL NOT NULL,
    max_temp_c    REAL NOT NULL,
    min_humidity  REAL NOT NULL,
    max_humidity  REAL NOT NULL
);
```

One row per crop in `policy` is enough for the essential build — seed it with
the 2–3 crops you'll actually demo. Per-route policy variation, versioning,
and admin-editable thresholds are Optional (rolled into O6).

### 6.1 Dual-Storage (SQLite / PostgreSQL Supabase) & IPFS Decentralized Media (Phase 9)

In Phase 9 (O7, O10), the storage architecture evolves to support production cloud hosting and decentralized document anchoring:

1. **Database Polymorphism (`backend/db.py`)**:
   - The backend checks `DATABASE_URL` at startup:
     - If empty or `sqlite:///`, it falls back to local SQLite (`backend/agrichain.db`) for lightweight offline development and local test execution.
     - If prefixed with `postgresql://` (or `postgres://`), it connects to the cloud-hosted Supabase instance using `psycopg2` / `asyncpg` connection pooling.
   - The database schema is unified across both engines, covering:
     - `batches`: Produce identity, farmer, harvest date, and on-chain tx hashes.
     - `custody_events`: Historical custody transitions and recorded sale prices in paise.
     - `readings`: Raw IoT telemetry (written before validation for full audit integrity).
     - `quarantine`: Anomaly reports with ordered reason codes and sensor values.
     - `policy`: Dynamic crop thresholds.
     - `documents`: Document metadata linking IPFS CIDs to batch IDs.
     - `reviews`: Consumer rating (1–5 stars) and feedback text.

2. **Decentralized Media Pinning (IPFS)**:
   - Heavy un-hashable binary assets (such as government quality inspection certificates, pesticide residue reports, or geotagged farm photos) are never stored in relational DBs or on-chain.
   - `backend/ipfs.py` pins files to IPFS (via Pinata or web3.storage API), generating an immutable Content Identifier (`ipfs://Qm...`).
   - The CID is anchored on-chain in `ProductRegistry.sol` and stored in the database for instant retrieval.
   - Consumer and Farmer frontend views resolve IPFS links using dedicated gateways (`https://gateway.pinata.cloud/ipfs/...`).

## 7. Backend endpoints (complete multi-role set)

Each response shape is governed by §4 — matching the mock exports in `design/src/*/data/` exactly.

| Endpoint | Method | Role / Phase | Purpose & Mock Source |
|---|---|---|---|
| `/batches` | `POST` | Farmer / Ph 3 | Register produce batch; calls `ProductRegistry` |
| `/batches/{batch_id}/custody` | `POST` | Logistics & Dark Store / Ph 3, 7 | Advance custody state and record price; calls `CustodyTransfer` |
| `/telemetry` | `POST` | Simulator & ESP32 / Ph 3, 6, 10 | Ingest IoT reading; evaluates AI trust layer; calls `ColdChainMonitor` if valid |
| `/farmer/kpis` | `GET` | Farmer / Ph 5 | Matches `kpiMetrics` in `mockData.js` |
| `/farmer/crops` | `GET` | Farmer / Ph 5 | Matches `cropCategories` in `mockData.js` |
| `/farmer/activity` | `GET` | Farmer / Ph 5 | Matches `recentActivities` in `mockData.js` |
| `/batches/{batch_id}/traceability` | `GET` | Consumer / Ph 5 | Matches `traceabilityBatch` in `consumerData.js` |
| `/batches/{batch_id}/price-journey` | `GET` | Consumer / Ph 5 | Price breakdown & farmer fair price share calculations |
| `/logistics/kpis` | `GET` | Logistics / Ph 7 | Matches `logisticsKPIData` in `mockData.js` |
| `/logistics/shipments` | `GET` | Logistics / Ph 7 | Matches `shipmentTrackingData` in `mockData.js` |
| `/logistics/orders` | `GET` | Logistics / Ph 7 | Matches `procurementOrders` in `mockData.js` |
| `/darkstore/kpis` | `GET` | Dark Store / Ph 7 | Matches `darkStoreKPIData` in `mockData.js` |
| `/darkstore/inbound` | `GET` | Dark Store / Ph 7 | Matches `inboundShipments` in `mockData.js` |
| `/darkstore/inventory` | `GET` | Dark Store / Ph 7 | Matches `microInventory` in `mockData.js` |
| `/darkstore/receive` | `POST` | Dark Store / Ph 7 | Inbound GRN reception (advances custody to `IN_STORAGE`) |
| `/darkstore/checkout` | `POST` | Dark Store / Ph 7 | Consumer retail checkout (advances custody to `SOLD`) |
| `/telemetry/quarantine` | `GET` | Farmer & Admin / Ph 7 | Quarantined telemetry audit list for `QuarantineAuditModal.jsx` |
| `/telemetry/evaluate` | `POST` | Research & Paper / Ph 6 | Automated evaluation benchmark (F1, precision, recall) |
| `/telemetry/history` | `GET` | AI Trust Layer / Ph 6 | Time-series telemetry history for 11-D feature engineering |
| `/batches/{batch_id}/documents` | `POST` | Farmer & Inspector / Ph 9 | Pin certificate to IPFS and anchor CID on-chain |
| `/batches/{batch_id}/reviews` | `GET`, `POST` | Consumer / Ph 10 | Consumer quality ratings and review submission |
| `/admin/users` | `GET` | Admin / Ph 10 | Participant role verification and approval queue |
| `/admin/roles/grant` | `POST` | Admin / Ph 10 | Grants `AccessControlRoles` permissions on-chain |

## 8. Tech stack reference

| Layer | Essential (Phases 1–5) | Integrated (Phases 6–7) | Advanced Roadmap (Phases 8–10) |
|---|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS (Farmer & Consumer views) | Logistics Partner, Dark Store, and Quarantine Audit modal wired | MetaMask Web3 connection (`ethers.js` v6) & Consumer review drawers |
| Backend | Python 3.11, FastAPI, `uvicorn` | Multi-role REST endpoints + AI Trust Layer routing | IPFS pinning gateway & Supabase async connection pooling |
| Database | SQLite (`backend/agrichain.db`) | SQLite audit trails & telemetry history repositories | Dual-mode SQLite + Supabase PostgreSQL (`psycopg2`) |
| Blockchain | Solidity ^0.8.20, Hardhat local node | `AgriChainCore.sol` on local node | 5 modular contracts (`AccessControlRoles`, `ProductRegistry`, etc.) on Polygon Amoy |
| Chain client | `web3.py` via backend relayer account | `web3.py` via backend relayer account | Client-side MetaMask signing with backend relayer fallback |
| AI trust layer | Rule-based threshold check | 11-D feature extraction, Isolation Forest ML anomaly detection, SHA-256 fingerprinting | Dynamic drift calibration & multi-crop policy auto-tuning |
| IoT source | `simulator/simulate.py` | 7-fault scenario simulator (`trust-layer/`) | Physical ESP32 + DHT22 + GPS transmitter (`hardware/esp32_firmware/`) |

## 9. Advanced Features Architecture (Phases 8–10)

### 9.1 Gas Optimization and Public Testnet Deployment (Phase 8)
- **Batching Aggregation:** The AI Trust Layer buffers consecutive verified readings for active batches and invokes `ColdChainMonitor.recordConditionsBatch`. This reduces gas usage from ~45,000 gas per reading to ~12,000 gas per reading, avoiding network congestion.
- **Polygon Amoy Testnet:** Configured in `contracts/hardhat.config.cjs` using Polygon Amoy RPC (Chain ID 80002). Contract addresses are injected into the backend via environment variables (`PRODUCT_REGISTRY_ADDRESS`, `CUSTODY_TRANSFER_ADDRESS`, `COLD_CHAIN_MONITOR_ADDRESS`, `POLICY_CONFIG_ADDRESS`, `ACCESS_CONTROL_ADDRESS`), with seamless fallback to local Hardhat addresses.

### 9.2 Decentralized Document Anchoring (Phase 9)
- **Zero-Storage Blockchain:** Blockchain state storage is expensive (~20,000 gas per 32-byte storage slot). High-resolution images and PDFs are stored on IPFS.
- **Verification Integrity:** The on-chain `ProductRegistry` stores only the 32-byte or 46-character CID. Any tampering with the off-chain PDF changes its cryptographic hash, causing verification failure.

### 9.3 Client-Side Web3 Signing & Hardware Telemetry (Phase 10)
- **Dual Transaction Execution Flow:**
  1. *Connected Wallet Flow:* If MetaMask is connected and the user's address holds the required role in `AccessControlRoles`, the frontend prompts the user to sign the transaction directly via `ethers.BrowserProvider`.
  2. *Relayer Fallback Flow:* For automated scripts, IoT telemetry, or users without Web3 wallets, the FastAPI backend signs transactions using its configured private key.
- **Physical ESP32 Device:** The ESP32 micro-controller reads from physical DHT22 (temperature/humidity) and NEO-6M (GPS) sensors, transmitting JSON payloads over WiFi directly to the FastAPI `/telemetry` endpoint. A hardware push-button triggers a deliberate temperature fault by overriding the sensor output to 35°C, providing a physical demonstration of the AI Trust Layer quarantine mechanism.
