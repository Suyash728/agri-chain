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

| Original plan | Essential architecture | Reversed by |
|---|---|---|
| Next.js 14 frontend | Existing Vite + React app in `design/`, wired not rebuilt | N/A — this was always the better choice once `design/` existed |
| Supabase (Postgres, cloud) | SQLite, one file, zero setup | O7 |
| 5 smart contracts + OpenZeppelin `AccessControl` | 1 consolidated contract, simple owner check | O6 |
| Deployed to Polygon Amoy (public testnet) | Deployed to a local Hardhat node | O5 |
| 5 separate services (`trust-layer`, `indexer`, oracle writer, etc.) | 1 FastAPI app doing ingestion + validation + chain writes + the REST API | — (see §3) |
| ML anomaly model (Isolation Forest / LSTM-AE) | Rule-based threshold + plausibility checks | O3 |
| MetaMask, per-user signing | One backend-held account signs everything | O2 |
| MQTT ingestion | Plain HTTP POST | — |

Nothing here is a scope cut on the *idea* — every layer of the original
architecture (sensor → AI → chain → dashboard → consumer) still exists and
still does its job. What's cut is complexity *within* each layer, resequenced
into the Optional tier.

## 2. Repo layout

```
agri-chain/
├── design/              EXISTING, working React frontend. Wire, don't rebuild.
│   ├── src/
│   │   ├── data/mockData.js         Farmer + shared mock data — THIS IS THE API CONTRACT (see §4)
│   │   ├── Farmer/data/…            (if present) Farmer-specific mock data
│   │   ├── Consumer/data/consumerData.js   Consumer mock data — also a contract source
│   │   ├── Farmer/, Logistic_Partner/, Dark_Store/, Consumer/   one folder per role
│   │   └── App.jsx                  role switcher + top-level state
│   └── DESIGN.md                    visual design system — do not edit
│
├── contracts/            NEW. Hardhat + Solidity project.
│   ├── contracts/AgriChainCore.sol  the one essential contract (§5)
│   ├── test/                        Hardhat tests
│   └── hardhat.config.js
│
├── backend/               NEW. One FastAPI app — ingestion, AI validation, chain writes, REST API.
│   ├── main.py                     FastAPI app + all route definitions
│   ├── db.py                       SQLite connection + schema (§6)
│   ├── validation.py               the rule-based AI trust layer (E4 in PRD.md)
│   ├── chain.py                    web3.py wrapper — talks to the local Hardhat node
│   └── requirements.txt
│
├── simulator/              NEW. One Python script.
│   └── simulate.py                emits readings for one batch, `--inject-fault` flag for the bad-reading demo
│
├── docs/                  EXISTING. Project documentation and diagrams — see docs/proposal/ for full history.
│
├── AGENTS.md, PRD.md, ARCHITECTURE.md, RULES.md, PLAN.md, TASKS.md, MEMORY.md
```

`indexer/` and `web/` from the original plan don't exist as separate folders
in the essential build — `backend/` and `design/` absorb their jobs
respectively. They can be split out later (Optional tier) if the monolith
becomes unwieldy.

## 3. Why one backend service instead of several

The original plan split ingestion, AI validation, the oracle writer, and the
event indexer into separate services communicating over a queue. That's the
right shape for a real deployment. For the essential build it's replaced with
**one FastAPI app that does all four jobs as plain Python function calls**:

```
POST /telemetry  (from simulator)
   │
   ├─► validation.py: check reading against policy thresholds
   │        │
   │        ├─ VALID ──► chain.py: call AgriChainCore.recordCondition() via web3.py
   │        │                        │
   │        │                        └─► written to local Hardhat chain
   │        │
   │        └─ ANOMALOUS ──► insert into `quarantine` table, never reaches chain.py
   │
   └─► response: {"verdict": "VALID" | "ANOMALOUS", "reason": "..."}
```

No message queue, no separate worker process, no network hop between
services. This is a legitimate simplification (not a shortcut with a hidden
cost) because the essential build has no throughput requirement — it proves
the *logic* works, not that it scales. The queue/worker split (matching the
original oracle-writer design) is worth reintroducing once real throughput
matters — that's Optional tier, alongside O5 and O13.

**One rule that still applies exactly as in the original design:** raw
telemetry is **always written to the database first**, before validation
runs. This preserves the audit trail even for rejected readings — you can
see *what was sent*, not just what was accepted.

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

## 7. Backend endpoints (essential set)

Build these in the order they appear in `TASKS.md`. Each response shape is
governed by §4 — go find the matching mock export before writing the route.

| Endpoint | Method | Matches mock shape in |
|---|---|---|
| `/batches` | `POST` | new batch — no direct mock equivalent, this is a write |
| `/batches/{batch_id}/custody` | `POST` | new custody transfer — write, no mock equivalent |
| `/telemetry` | `POST` | new reading — write, no mock equivalent |
| `/farmer/kpis` | `GET` | `kpiMetrics` in `design/src/data/mockData.js` |
| `/farmer/crops` | `GET` | `cropCategories` in `design/src/data/mockData.js` |
| `/farmer/activity` | `GET` | `recentActivities` in `design/src/data/mockData.js` |
| `/batches/{batch_id}/traceability` | `GET` | `traceabilityBatch` in `design/src/data/mockData.js` |
| `/batches/{batch_id}/price-journey` | `GET` | derive from `traceabilityBatch` + `custody_events` — check whether the mock already has a price field before adding a new shape |

If a mock export doesn't obviously map to a database query, that's a sign to
re-read `PRD.md` §5 before inventing new response fields — the essential
build only needs E1–E7.

## 8. Tech stack reference

| Layer | Essential | Optional upgrade |
|---|---|---|
| Frontend | Existing Vite + React 18 + Tailwind (JS) in `design/` — unchanged | — |
| Backend | Python 3.11, FastAPI, `uvicorn` | Split into microservices, add MQTT (O-tier, unlisted individually — follow O5/O13 pattern) |
| Database | SQLite (`sqlite3` via Python stdlib or `sqlmodel`) | Supabase/Postgres (O7) |
| Blockchain | Solidity ^0.8.20, Hardhat, local Hardhat node | Polygon Amoy public testnet (O5), OpenZeppelin `AccessControl` + 5 contracts (O6) |
| Chain client | `web3.py` from `backend/chain.py` — one Python library, no separate Node/ethers.js service | ethers.js v6 + MetaMask for per-user signing (O2) |
| AI trust layer | Rule-based thresholds in `backend/validation.py` | scikit-learn Isolation Forest → PyTorch LSTM-autoencoder (O3) |
| IoT source | `simulator/simulate.py`, one script, HTTP POST | Real ESP32 (O12), MQTT, multi-fault labelled dataset (O4) |

**Why web3.py instead of ethers.js for the essential build:** the backend is
already Python (FastAPI). Keeping the chain client in the same language
avoids introducing a second runtime, a second package manager, and a second
set of conventions into a build already constrained to two weeks and a small
local model. ethers.js is better documented for frontend wallet integration,
which is exactly the part (O2) that's deferred.
