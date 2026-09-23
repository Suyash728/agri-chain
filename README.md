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

The repository contains a fully working prototype across blockchain, backend, AI validation, simulation, and frontend:

| Folder | Status | Contents |
|--------|--------|----------|
| `contracts/` | ✅ Active | Hardhat project with `AgriChainCore.sol` deployed and tested on local Hardhat chain. |
| `backend/` | ✅ Active | FastAPI service with SQLite database, Web3 contract integration, and REST endpoints for dashboards and traceability. |
| `trust-layer/` | ✅ Active | AI Trust Layer service: range checks, physical/temporal plausibility, 11-D feature extraction, Isolation Forest ML anomaly detection, SHA-256 integrity/replay checks, verdict engine, audit/quarantine logs, multi-fault simulation, and Oracle handoff interface (Schema v1.0). |
| `simulator/` | ✅ Active | IoT telemetry generator streaming realistic GPS/temperature/humidity sequences with fault injection. |
| `design/` | ✅ Active | React + Vite + Tailwind frontend with wired Farmer dashboard, live batch registration modal, and Consumer traceability view showing on-chain price trail. |

---

## Conventions

- **No spaces in file or folder names.** Use kebab-case — spaces break URLs, markdown links, and CI scripts.
- Media assets (PNG, PDF, MP4) are tracked as regular Git files; **Git LFS is not used**.
