# AgriChain

A blockchain-based farm-to-fork traceability system for perishable agricultural goods, where an AI trust layer validates IoT sensor data before it is written on-chain, and every price/margin along the chain is transparently recorded so the farmer's share is visible.

> **Formal paper title:** *A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains*

---

## Repository structure

```
.
├── docs/                                    Project documentation and design assets
│   ├── proposal/                            Core project documents and decisions
│   │   ├── AgriChain_Project_Context.md    Full context handoff — read this first
│   │   └── revised-account-list.md          The 5-account actor model and role responsibilities
│   ├── research/
│   │   └── agri-survey-paper.pdf            Base survey paper the project builds on
│   └── diagrams/                            All diagrams, grouped by type
│       ├── architecture/
│       │   ├── trustlayer-architecture.svg  4-layer system architecture with the AI trust layer
│       │   ├── simplified-system-design.svg Simplified role/goods-flow view
│       │   └── system-overview.png          Level-1 complete system overview
│       ├── dfd/
│       │   ├── data-flow-diagrams.md        DFD source (Mermaid), Level 0 through Level 2
│       │   ├── dfd-level-0-context.png      Context diagram (Level 0)
│       │   └── dfd-level-1-complete.png     Complete system (Level 1)
│       ├── er/
│       │   └── er-diagram.png               Entity-relationship model
│       ├── uml/
│       │   ├── activity-diagram.png         Activity diagram
│       │   └── user-role-diagram.png        User/role diagram
│       └── gantt/
│           ├── gantt-chart-1.png            Project timeline, part 1
│           └── gantt-chart-2.png            Project timeline, part 2
│
└── design/                                  UI design assets
    ├── mockups/                             Screen mockups, one folder per role
    │   ├── admin/                           (no screens yet)
    │   ├── end-customer/customer.jpg
    │   ├── farmer/farmer.jpg
    │   ├── logistics/logistics.jpg
    │   └── retailer-dark-store/retailer-dark-store.jpg
    └── screen-recordings/                   Walkthrough recordings, one per role flow
        ├── farmer-flow.mp4
        ├── logistics-partner-flow.mp4
        ├── dark-store-flow.mp4
        └── consumer-flow.mp4
```

---

## Codebase Status

The repository contains a fully working prototype across blockchain, backend, AI validation, simulation, and multi-role frontend:

| Folder | Status | Contents |
|--------|--------|----------|
| `contracts/` | ✅ Active | Hardhat project with `AgriChainCore.sol` deployed on local Hardhat chain; Phase 8 modular 5-contract suite and Polygon Amoy testnet deployment in progress. |
| `backend/` | ✅ Active | FastAPI service with SQLite database, Web3 contract integration, complete multi-role endpoints (Farmer, Logistics, Dark Store, Consumer, Quarantine Audit), and automated E2E verification suites (`verify_phase5_e2e.py`, `verify_phase7_e2e.py`). |
| `trust-layer/` | ✅ Active | AI Trust Layer service (Phase 6): range checks, physical/temporal plausibility, 11-D feature extraction, Isolation Forest ML anomaly detection, SHA-256 integrity/replay checks, verdict engine, audit/quarantine logs, multi-fault simulation, and Oracle handoff interface (Schema v1.0, 147 passing tests, F1-score 0.9722). |
| `simulator/` | ✅ Active | IoT telemetry generator streaming realistic GPS/temperature/humidity sequences with 7 fault injection scenarios. |
| `design/` | ✅ Active | React + Vite + Tailwind frontend with all 4 roles wired to live data (Farmer, Logistics Partner, Dark Store, Consumer) plus interactive Quarantine Audit modal and on-chain price fairness breakdown. |

---

## Phased Build Roadmap

| Phase | Title | Tier | Status | Deliverables & Verification |
|---|---|---|---|---|
| **Phase 1** | Environment & Scaffolding | Essential | ✅ Complete | Node 20, Python 3.11 venv, Hardhat, Vite frontend running cleanly. |
| **Phase 2** | Smart Contract Foundation | Essential | ✅ Complete | `AgriChainCore.sol` with `registerBatch`, `transferCustody`, `recordCondition`. |
| **Phase 3** | Backend & AI Ingestion | Essential | ✅ Complete | FastAPI REST API, SQLite storage, Web3 relayer, raw telemetry audit trail. |
| **Phase 4** | Telemetry Simulation & Faults | Essential | ✅ Complete | Streaming IoT simulator with threshold breach fault injection. |
| **Phase 5** | Frontend Wiring & E2E Loop | Essential | ✅ Complete | Farmer dashboard & Consumer journey wired; `verify_phase5_e2e.py` passed (100%). |
| **Phase 6** | AI Trust Layer Integration | Research / O3, O4 | ✅ Complete | Standalone `trust-layer` integrated; 11-D feature extraction, Isolation Forest ML anomaly detection, 147 tests, benchmark evaluation (F1: 0.9722). |
| **Phase 7** | Role Dashboards & Quarantine UI | Post-Essential / O1, O11 | ✅ Complete | Logistics Partner, Dark Store, and Quarantine Audit modal wired; `verify_phase7_e2e.py` passed (100%, 50.0% farmer share). |
| **Phase 8** | Modular Contracts, Gas & Amoy | Post-Essential / O5, O6, O13 | 🎯 Active / Next | 5 modular contracts (`ProductRegistry`, `CustodyTransfer`, etc.), OpenZeppelin `AccessControl`, Oracle condition batching, gas benchmarking for paper, and Polygon Amoy testnet deployment. |
| **Phase 9** | Cloud DB & IPFS Storage | Post-Essential / O7, O10 | 📋 Planned | Supabase (PostgreSQL) dual-storage layer and decentralized IPFS document/certificate pinning with on-chain CIDs. |
| **Phase 10** | Role Wallets, Reviews & IoT Hardware | Post-Essential / O2, O8, O9, O12 | 📋 Planned | MetaMask client-side signing, consumer rating loop, admin governance flow, and physical ESP32 sensor hardware prop. |

## Conventions

- **No spaces in file or folder names.** Use kebab-case — spaces break URLs, markdown links, and CI scripts.
- Media assets (PNG, PDF, MP4) are tracked as regular Git files; **Git LFS is not used**.
