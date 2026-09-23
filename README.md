# AgriChain

A decentralized, blockchain-based farm-to-fork traceability and transparency framework for perishable agricultural goods. An AI trust layer evaluates IoT sensor streams before they are committed on-chain, quarantining anomalies while anchoring verified condition batches. Every price markup and custody transfer along the supply chain is immutably recorded, ensuring the farmer's fair share is transparent to the consumer.

> **Formal Paper Title:**  
> *A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains*

[![Status](https://img.shields.io/badge/Project%20Status-All%2010%20Phases%20Complete-emerald?style=for-the-badge)]()
[![Contracts](https://img.shields.io/badge/Contracts-Solidity%200.8.28%20%7C%20OpenZeppelin%20RBAC-blue?style=for-the-badge)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Supabase%20PostgreSQL-green?style=for-the-badge)]()
[![AI Trust Layer](https://img.shields.io/badge/AI%20Trust%20Layer-F1%200.9722%20%7C%20Isolation%20Forest-purple?style=for-the-badge)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind%20%7C%20ethers.js%20v6-orange?style=for-the-badge)]()

---

## 1. System Architecture

AgriChain is organized into 5 interconnected architectural tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    TIER 1: PHYSICAL IOT & SIMULATION                   │
│  ESP32 Microcontroller + DHT22 + NEO-6M GPS + GPIO 4 Breach Trigger    |
│  Python Stream Simulator (7 fault scenarios: freeze, spike, drift...)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP /telemetry
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    TIER 2: PRE-CHAIN AI TRUST LAYER                    │
│  Range Checks • Physical Plausibility • 11-D Feature Extraction        │
│  Isolation Forest ML Anomaly Detection (F1: 0.9722)                    │
│  SHA-256 Anti-Replay Defense • Crop Policy Rules (Tomato/Mango/Wheat)  │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ Approved Handoff               │ Breaches Quarantined
                    ▼                                ▼
┌──────────────────────────────────────┐   ┌─────────────────────────────┐
│  TIER 3: MODULAR SMART CONTRACTS     │   │ TIER 4: OFF-CHAIN & IPFS    │
│  ProductRegistry.sol (Batch origin)  │   │ Cloud Supabase PostgreSQL   │
│  CustodyTransfer.sol (State & price) │   │ (11 relational tables)      │
│  ColdChainMonitor.sol (Packed slot,  │   │ Pinata Decentralized IPFS   │
│    batched writes: -52.71% gas)      │   │ (Inspection certs anchored  │
│  PolicyConfig.sol & AccessControl    │   │  on-chain with CIDs)        │
└───────────────────┬──────────────────┘   └──────────────┬──────────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    TIER 5: MULTI-ROLE WEB3 FRONTEND                    │
│  React + Vite + Tailwind + ethers.js v6 Client-Side MetaMask Signing   │
│  🌿 Farmer Portal    • 🚛 Logistics Partner • 🏬 Dark Store Hub        │
│  🛒 Consumer Store   • 🔗 IPFS Inspector    • 🛡️ Quarantine Audit UI   │
│  Persistent Top-Right Accounts Controller across all role dashboards   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Repository Structure

```
.
├── backend/                                 FastAPI REST API & Blockchain Integration
│   ├── main.py                              Core endpoints (telemetry, batches, custody, reviews, admin)
│   ├── chain.py                             Web3 client for modular smart contracts & fallback
│   ├── db.py                                Dual storage adapter: Supabase PostgreSQL & SQLite fallback
│   ├── ipfs.py                              Pinata cloud IPFS client & Base58 CID hasher
│   ├── migrations/                          PostgreSQL DDL schema definitions (11 tables)
│   ├── modular-abis/                        Exported ABIs for modular smart contracts
│   ├── modular-deployments.json             Active modular contract deployment addresses
│   └── scripts/                             E2E verification & migration test suites
│       ├── verify_final_system.py           Capstone automated 8-stage verification suite
│       ├── verify_phase7_e2e.py             Phase 7 multi-role lifecycle validation
│       ├── migrate_sqlite_to_supabase.py    Automated migration tool with sequence sync
│       └── test_reviews.py                  Consumer review submission & aggregation test
│
├── contracts/                               Hardhat Smart Contract Suite
│   ├── contracts/                           Solidity 0.8.28 contracts
│   │   ├── AccessControlRoles.sol           OpenZeppelin Role-Based Access Control (RBAC)
│   │   ├── ProductRegistry.sol              Batch registration, farmer origin & IPFS CID anchoring
│   │   ├── CustodyTransfer.sol              Forward-only state transitions & stage price accounting
│   │   ├── ColdChainMonitor.sol             Single 32-byte slot struct & batched condition writes
│   │   ├── PolicyConfig.sol                 On-chain crop temperature & humidity thresholds
│   │   └── AgriChainCore.sol                Legacy monolithic contract (Phase 2 reference)
│   ├── test/                                Hardhat unit tests (26 passing tests across suites)
│   ├── scripts/                             Deployment, ABI export & gas benchmark scripts
│   │   ├── benchmark_gas.cjs                Gas benchmark runner measuring single vs batched writes
│   │   ├── deploy_modular.cjs               Deploy modular contracts to local node
│   │   └── deploy_amoy.cjs                  Deploy modular contracts to Polygon Amoy testnet
│   └── reports/                             IEEE paper artifacts (gas_benchmark.json/.md)
│
├── trust-layer/                             Standalone AI Pre-Chain Validation Service
│   ├── app/                                 FastAPI microservice & ML pipeline
│   │   ├── core/                            Verdict engine, schemas, and crop policy registry
│   │   ├── models/                          Isolation Forest model & baseline rules
│   │   └── services/                        Feature extraction, replay defense, quarantine store
│   ├── tests/                               147 unit and integration tests (100% pass)
│   └── reports/                             Evaluation benchmark charts (confusion matrix, ROC, F1)
│
├── hardware/                                Physical IoT Sensor Node
│   ├── esp32_firmware/                      PlatformIO / Arduino C++ firmware sketch
│   │   ├── src/main.cpp                     ESP32 + DHT22 + NEO-6M GPS + WiFi client + GPIO 4 breach button
│   │   └── platformio.ini                   Board, framework, and library dependencies
│   ├── simulate_esp32.py                    Python hardware simulator with live nominal & breach modes
│   └── README.md                            Pinout diagram, bill of materials & flashing instructions
│
├── simulator/                               IoT Telemetry Streaming Simulator
│   └── stream_telemetry.py                  Multi-scenario IoT generator with 7 fault injection modes
│
├── design/                                  Responsive React + Vite + Tailwind Multi-Role Frontend
│   ├── src/
│   │   ├── App.jsx                          Global portal router & persistent accounts control bar
│   │   ├── components/                      Shared components (WalletConnect.jsx with ethers.js v6)
│   │   ├── Farmer/                          Farmer dashboard (KPIs, inventory, crops, AI trust view)
│   │   ├── Logistic_Partner/                Logistics portal (fleet GPS tracking, dispatch, orders)
│   │   ├── Dark_Store/                      Dark store hub (inbound GRN receiving, micro-inventory)
│   │   ├── Consumer/                        Consumer storefront (marketplace, QR journey, IPFS modal)
│   │   └── utils/contracts.js               Contract addresses, ABIs, and Web3 helpers
│   └── index.html                           Application root
│
├── review-2/                                Capstone Review 2 Presentation & Architecture Package
│   ├── README.md                            Review 2 executive index & verification checklist
│   └── SYSTEM_ARCHITECTURE_AND_WORKING.md   Complete technical working, 7 Mermaid diagrams & viva defense
│
└── docs/                                    Formal Project Documentation
    ├── proposal/                            Project context and 5-account actor model
    ├── research/                            Base academic survey paper
    └── diagrams/                            Architecture, DFDs, UML, ER, and Gantt charts
```

---

## 3. Codebase Status

| Component | Status | Technology | Key Deliverables & Verified Capabilities |
|---|---|---|---|
| **Smart Contracts** | ✅ Complete | Solidity 0.8.28, Hardhat, OpenZeppelin | 5 modular contracts (`ProductRegistry`, `CustodyTransfer`, `ColdChainMonitor`, `PolicyConfig`, `AccessControlRoles`). Slot-packed EVM structs, batched condition writes (`recordConditionsBatch`), **52.71% gas reduction** verified for N=20. Local Hardhat node & Polygon Amoy deployment configurations. |
| **Backend API** | ✅ Complete | Python 3.11, FastAPI, Web3.py | Dual-storage database adapter (Supabase Cloud PostgreSQL + local SQLite fallback). Role-gated endpoints for all 4 personas, IPFS certificate pinning, on-chain CID anchoring, verified post-checkout consumer review loops, and admin role governance. |
| **Cloud Storage** | ✅ Complete | Supabase PostgreSQL, AWS Mumbai | 11 relational tables migrated to Supabase (`uqqxncbftmiflhkjdovc`) via IPv4 Session Pooler with 0 row discrepancies. Serial sequence synchronization and foreign-key integrity validated. |
| **Decentralized Storage** | ✅ Complete | Pinata IPFS, Multihash CIDv0 | Quality inspection certificates and lab reports pinned to IPFS (`ipfs://Qm...`), anchored on-chain in `ProductRegistry.sol`, with direct interactive in-app modal preview. |
| **AI Trust Layer** | ✅ Complete | Scikit-Learn, Isolation Forest | 11-dimensional feature vector, Isolation Forest anomaly detector, SHA-256 anti-replay defense, dynamic crop policy engine. 147 passing tests, benchmark **F1-score of 0.9722**, publication-ready figures in `trust-layer/reports/`. |
| **Multi-Role Frontend** | ✅ Complete | React 18, Vite, Tailwind CSS, ethers.js | Unified application serving all 4 supply chain roles: Farmer, Logistics Partner, Dark Store, and Consumer. Web3 MetaMask connection with automatic role detection, direct Consumer marketplace routing, and a persistent top-right accounts navigation bar. |
| **IoT Hardware** | ✅ Complete | ESP32, C++, PlatformIO, DHT22, GPS | Microcontroller firmware sending live HTTP telemetry every 15s. Physical GPIO 4 tactile pushbutton triggers instant thermal failure breach (48°C), verified quarantined by AI Trust Layer. |

---

## 4. Phased Build Roadmap

All 10 Phases planned for the AgriChain framework have been fully executed and verified:

| Phase | Title | Tier | Status | Deliverables & Verification Evidence |
|---|---|---|---|---|
| **Phase 1** | Environment & Scaffolding | Essential | ✅ Complete | Node.js 20, Python 3.11 venv, Hardhat, FastAPI, and Vite dev server running cleanly. |
| **Phase 2** | Smart Contract Foundation | Essential | ✅ Complete | Monolithic `AgriChainCore.sol` deployed locally with passing register/custody/condition tests. |
| **Phase 3** | Backend & AI Ingestion | Essential | ✅ Complete | FastAPI REST API, rule-based threshold checks, Web3 relayer, raw telemetry audit trail. |
| **Phase 4** | Telemetry Simulation & Faults | Essential | ✅ Complete | IoT stream simulator with 7 configurable fault injection scenarios. |
| **Phase 5** | Frontend Wiring & E2E Loop | Essential | ✅ Complete | Farmer dashboard & Consumer journey wired; `verify_phase5_e2e.py` passed 100%. |
| **Phase 6** | AI Trust Layer Integration | Research / O3, O4 | ✅ Complete | Standalone `trust-layer` integrated; 11-D feature extraction, Isolation Forest ML anomaly detection, 147 tests, benchmark evaluation (**F1: 0.9722**). |
| **Phase 7** | Role Dashboards & Quarantine UI | Post-Essential / O1, O11 | ✅ Complete | Logistics Partner, Dark Store, and Quarantine Audit modal wired; `verify_phase7_e2e.py` passed with **50.0% farmer fair price share**. |
| **Phase 8** | Modular Contracts, Gas & Amoy | Post-Essential / O5, O6, O13 | ✅ Complete | 5 modular contracts, OpenZeppelin RBAC, batched condition writes, **52.71% gas reduction** benchmarked, Polygon Amoy deployment configuration. |
| **Phase 9** | Cloud DB & IPFS Storage | Post-Essential / O7, O10 | ✅ Complete | Supabase PostgreSQL cloud migration (11 tables, 0 discrepancies), IPFS certificate pinning, on-chain CID anchoring, and frontend document preview. |
| **Phase 10** | Role Wallets, Reviews & IoT Hardware | Post-Essential / O2, O8, O9, O12 | ✅ Complete | MetaMask `ethers.js` v6 wallet signing, consumer reviews loop, admin governance flow, ESP32 firmware sketch, and `verify_final_system.py` passed 100%. |

---

## 5. Quick Start Guide

### Prerequisites

- **Node.js**: v20+ and `npm`
- **Python**: v3.11+ with `venv`
- **MetaMask**: Browser extension (optional, for client-side signing demo)
- **Supabase**: PostgreSQL connection string (configured in `.env`)

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/Suyash728/agri-chain.git
cd agri-chain

# Python Virtual Environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -r trust-layer/requirements.txt
```

### 2. Configure Environment (`.env`)

Ensure `.env` in the repository root contains:

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
HARDHAT_RPC_URL="http://127.0.0.1:8545"
AMOY_RPC_URL="https://rpc-amoy.polygon.technology"
PINATA_JWT="your_pinata_jwt_token_here"
```

### 3. Start Local Blockchain Node & Deploy Contracts

```bash
cd contracts
npm install
npx hardhat node

# In a second terminal, deploy modular smart contracts:
npx hardhat run scripts/deploy_modular.cjs --network localhost
```

### 4. Start the Backend API

```bash
cd backend
# With virtual environment activated:
uvicorn main:app --reload --port 8000
```

### 5. Launch the Frontend

```bash
cd design
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. Use the top-right accounts bar to switch seamlessly between **Farmer**, **Logistics Partner**, **Dark Store**, and **Consumer** portals, or connect your Web3 wallet.

---

## 6. Verification & Test Suites

The repository contains automated verification scripts covering every phase:

```bash
# 1. Capstone Full-System Verification (All 10 Phases across DB, Chain & AI)
python backend/scripts/verify_final_system.py

# 2. Multi-Role Lifecycle Verification (Farmer -> Logistics -> Dark Store -> Consumer)
python backend/scripts/verify_phase7_e2e.py

# 3. Smart Contract Test Suites (Modular contracts & RBAC)
cd contracts && npx hardhat test

# 4. Gas Benchmarking Suite (Evaluates gas savings for IEEE paper)
node contracts/scripts/benchmark_gas.cjs

# 5. AI Trust Layer Test Suite (147 tests)
cd trust-layer && pytest

# 6. Physical IoT Hardware Simulator Demo
python hardware/simulate_esp32.py --mode demo
```

---

## 7. Key Research & Benchmark Findings

### A. Machine Learning Anomaly Detection Performance

Evaluated against 1,000 synthetic sensor transmissions under 7 fault scenarios (refrigeration failure, sensor freeze, transient spikes, calibration drift, packet duplication, route deviations, and noise):

| Metric | Score | IEEE Paper Target |
|---|---|---|
| **Accuracy** | **97.20%** | > 92.0% |
| **Precision** | **96.30%** | > 90.0% |
| **Recall** | **98.18%** | > 95.0% |
| **F1-Score** | **0.9722** | > 0.950 |

*Confusion matrix and ROC curve visualizations are archived in `trust-layer/reports/`.*

### B. Smart Contract Gas Optimization via Condition Batching

Measuring gas consumption on the EVM (Solidity 0.8.28, 200 optimizer runs):

| Batch Size ($N$) | Single Writes ($N \times \text{tx}$) | Single Batched Tx | Total Gas Saved | Average Gas / Reading |
|---|---|---|---|---|
| **$N = 5$** | 2,71,920 gas | 1,52,392 gas | **43.95%** | 30,478 gas |
| **$N = 10$** | 5,43,840 gas | 2,73,046 gas | **49.79%** | 27,305 gas |
| **$N = 20$** | 10,87,680 gas | 5,14,337 gas | **52.71%** | 25,717 gas |

*Oracle batching achieves **52.71% gas reduction** for 20 readings, making continuous cold-chain monitoring commercially viable.*

### C. Transparent Price Trail & Farmer Fair-Share

Verified through on-chain custody transfers in `CustodyTransfer.sol` and reflected on the consumer QR scan screen:

| Stage | Actor | Cumulative Price | Stage Markup | Share of Final Price |
|---|---|---|---|---|
| **Farm Gate** | Farmer | ₹40.00 / kg | ₹40.00 / kg | **50.00%** |
| **Transit** | Logistics Partner | ₹55.00 / kg | ₹15.00 / kg | 18.75% |
| **Dark Store** | Retailer Hub | ₹80.00 / kg | ₹25.00 / kg | 31.25% |
| **Final Consumer** | End Customer | ₹80.00 / kg | — | **100.00%** |

---

## 8. Conventions

- **File Naming:** All paths and files adhere to `kebab-case` or standard project naming (`snake_case` in Python).
- **Design System:** Existing styles and mock data shapes in `design/` are strictly preserved per the "wire, don't create" guideline.
- **Git Discipline:** Small, atomic commits formatted as `[component] concise description`. No binary files or credentials committed to source control.
