# ARCHITECTURE.md — AgriChain Technical Architecture

> **System Architecture, Component Interactions, and Data Contracts.**

---

## 1. System Overview

AgriChain is built as a 5-tier architecture connecting IoT telemetry to an on-chain ledger through a pre-chain AI gatekeeper:

```
[ IoT Hardware / Simulator ]
         │ (HTTP POST /telemetry)
         ▼
[ FastAPI Backend (Port 8000) ] ──► [ Dual Storage: Supabase PostgreSQL / SQLite ]
         │
         ▼
[ Pre-Chain AI Trust Layer ]
  - Range & Plausibility Validation
  - 11-D Time-Series Feature Extraction
  - Isolation Forest ML Anomaly Detection (F1 = 0.9722)
  - Cryptographic Replay & Hash Verification
         │
         ├── [ Approved: VALID & READY_FOR_ORACLE ]
         │         │
         │         ▼ (web3.py relayer / client MetaMask)
         │   [ Modular EVM Smart Contracts (Port 8545 / Polygon Amoy) ]
         │     ├── ProductRegistry.sol (IPFS CIDs, Circuit Breaker)
         │     ├── CustodyTransfer.sol (Monotonic Lifecycle & Price Trail)
         │     ├── ColdChainMonitor.sol (Batched Writes — 52.7% Gas Saved)
         │     ├── PolicyConfig.sol (Crop Boundaries)
         │     └── AccessControlRoles.sol (OpenZeppelin RBAC)
         │
         └── [ Corrupted / Breached: QUARANTINED ]
                   │
                   ▼
             [ IsoLog SHA-256 Hash-Chained Quarantine Log ]

         │
         ▼
[ Multi-Role Frontend (Port 3000) ]
  Farmer | Logistics | Dark Store | Consumer | Admin | God Mode Hub
```

---

## 2. Repository Layout

```
agri-chain/
├── contracts/          Solidity 0.8.28 contracts, Hardhat test suite, gas benchmarks, deployment scripts
│   ├── contracts/      ProductRegistry, CustodyTransfer, ColdChainMonitor, PolicyConfig, AccessControlRoles
│   ├── scripts/        deploy_amoy.cjs, benchmark_gas.cjs
│   └── test/           Hardhat unit tests (22 tests passing)
│
├── backend/            FastAPI REST API, Web3 relayer, dual-storage adapter, IPFS pinning
│   ├── main.py         Application routes for all roles, God Mode state aggregation, and simulation endpoints
│   ├── db.py           Dual database driver (Supabase Cloud PostgreSQL + local SQLite fallback)
│   ├── chain.py        Web3.py contract client and role authorization helper
│   ├── ipfs.py         Pinata IPFS gateway for certificate pinning
│   ├── migrations/     PostgreSQL DDL schema (11 normalized tables)
│   └── scripts/        verify_final_system.py (8-stage capstone E2E verification)
│
├── trust-layer/        AI Pre-Chain anomaly detection microservice & research benchmark suite
│   ├── app/            FastAPI application, Isolation Forest model, 11-D feature engineering, policy schemas
│   └── tests/          147 passing unit & integration tests
│
├── frontend/           Vite + React 18 + Tailwind CSS application
│   ├── src/
│   │   ├── Farmer/            Farmer dashboard, batch registration modal, quality & certification view
│   │   ├── Logistic_Partner/  Fleet telematics, cold-chain monitoring, GPS route view, SLA penalties
│   │   ├── Dark_Store/        Inbound GRN AI Trust Gate, inventory shelf-life management, retail checkout
│   │   ├── Consumer/          QR provenance scan, farm-to-fork journey, transparent price fairness card
│   │   ├── Admin/             Role management dashboard, circuit breaker control, hash-chain verifier
│   │   ├── components/        WalletConnect, LoginModal, GodModeHub, ShowcaseDrawer
│   │   └── App.jsx            Unified navigation and persona state management
│   └── DESIGN.md              Visual design guidelines
│
├── hardware/           ESP32 firmware (DHT22, GPS, GPIO 4 button) and Python runner
└── simulator/          Multi-scenario IoT telemetry streaming simulator
```

---

## 3. Smart Contract Architecture

The on-chain layer consists of 5 modular Solidity contracts utilizing OpenZeppelin `AccessControl` and `Pausable`:

1. **`AccessControlRoles.sol`**:
   - Manages role assignments: `DEFAULT_ADMIN_ROLE`, `FARMER_ROLE`, `LOGISTICS_ROLE`, `RETAILER_ROLE`, `ORACLE_ROLE`.
2. **`ProductRegistry.sol`**:
   - Registers produce batches (`cropName`, `originFarm`, `harvestDate`, `farmerAddress`).
   - Anchors decentralized IPFS certificate CIDs (`documentCID`).
   - Enforces emergency freezing via `Pausable` circuit breaker.
3. **`CustodyTransfer.sol`**:
   - Enforces forward-only transitions: `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`.
   - Records non-repudiable stage purchase prices in integer `pricePaise` (`uint256`), emitting `CustodyTransferred`.
4. **`ColdChainMonitor.sol`**:
   - Ingests verified telemetry from `ORACLE_ROLE`.
   - Implements `recordConditionsBatch(bytes32[] batchIds, int256[] temps, uint256[] hums, bool[] breaches)`, amortizing base transaction fees and reducing per-reading gas costs by **52.71%**.
5. **`PolicyConfig.sol`**:
   - Stores on-chain cold-chain temperature and humidity thresholds per crop type.

---

## 4. Pre-Chain AI Trust Layer

Addressing the oracle problem, the AI Trust Layer evaluates raw telemetry before on-chain submission:
1. **Schema & Range Check**: Confirms valid payload structure and realistic physical sensor bounds.
2. **Physical & Temporal Plausibility**: Validates Haversine GPS transit velocity, maximum temperature/humidity rate-of-change, and monotonically increasing timestamps.
3. **11-D Feature Extraction**: Extracts rolling deltas, accelerations, and environmental variances.
4. **Isolation Forest ML**: Evaluates unsupervised statistical outlier score ($F_1 = 0.9722$).
5. **Cryptographic Replay Detection**: SHA-256 packet fingerprinting prevents duplicate submissions.
6. **Verdict & Disposition Engine**:
   - `VALID` + `READY_FOR_ORACLE` $\to$ Approved for batching and on-chain commit.
   - `ANOMALOUS` + `QUARANTINED` $\to$ Written to an off-chain quarantine audit log with reason codes.
7. **IsoLog Hash Chaining**: Quarantined records are cryptographically linked:
   $$\text{entry\_hash} = \text{SHA-256}(\text{prev\_hash} \parallel \text{reading\_id} \parallel \text{reason} \parallel \text{created\_at})$$
   Integrity is verifiable on-demand via `GET /quarantine/verify-integrity`.

---

## 5. Storage Architecture

### Dual-Engine Relational Storage (`backend/db.py`)
- **Supabase Cloud PostgreSQL**: Production environment using connection pooling (`DATABASE_URL`).
- **SQLite Fallback**: Local development and offline testing (`backend/agrichain.db`).
- **Audit Rule**: Every raw reading is written to the `readings` table *before* AI validation runs to guarantee audit integrity.

### Decentralized Media Pinning (`backend/ipfs.py`)
- Inspection certificates and farm laboratory reports are uploaded to IPFS via Pinata.
- The returned Content Identifier (`ipfs://Qm...`) is anchored on-chain in `ProductRegistry.sol`.

---

## 6. API & Data Contracts

### Data Types & Representation
- **Money**: Always integer `price_paise` (1 INR = 100 paise). Floating-point currencies are prohibited.
- **Temperature**: Integer `temp_deci_c` (e.g., $24.5^\circ\text{C} = 245$) for contracts and logic. Converted to float for display only.

### Core Endpoints

| Endpoint | Method | Role | Function |
|---|---|---|---|
| `/batches` | `POST` | Farmer | Register harvest lot & anchor on-chain |
| `/batches/{id}/custody` | `POST` | Logistics / Dark Store | Transfer custody state & log stage price in paise |
| `/telemetry` | `POST` | IoT / Simulator | Ingest reading, evaluate AI trust, batch approved writes |
| `/farmer/quality-rating` | `GET` | Farmer | Reputation metrics, certifications, and consumer reviews |
| `/logistics/ai-trust` | `GET` | Logistics | Transit cold-chain trust score, live reefer status & SLA penalties |
| `/darkstore/inbound` | `GET` | Dark Store | Inbound deliveries with AI Trust Gate badges |
| `/darkstore/receive` | `POST` | Dark Store | Complete GRN inbound receipt |
| `/darkstore/checkout` | `POST` | Dark Store / Retail | Record retail sale & custody `SOLD` |
| `/batches/{id}/traceability` | `GET` | Consumer | Complete farm-to-fork provenance journey |
| `/batches/{id}/price-journey`| `GET` | Consumer | Transparent farmer fair-price share breakdown |
| `/admin/roles/grant` | `POST` | Admin | Assign OpenZeppelin contract role |
| `/quarantine/verify-integrity` | `GET` | Admin / Auditor | Cryptographically verify unbroken SHA-256 hash chain |
| `/demo/godmode/{id}` | `GET` | God Mode | Synchronized 4-quadrant state snapshot |
| `/demo/iot/inject` | `POST` | Showcase | Manual telemetry injection with real-time UI reaction |
