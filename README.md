# KisanChain

A blockchain-based farm-to-fork traceability system for perishable agricultural goods, where an AI trust layer validates IoT sensor data before it is written on-chain, and every price/margin along the chain is transparently recorded so the farmer's share is visible.

> **Formal paper title:** *A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains*

---

## Repository structure

```
.
├── docs/                                    Project documentation and design assets
│   ├── proposal/                            Core project documents and decisions
│   │   ├── KisanChain_Project_Context.md    Full context handoff — read this first
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

## Codebase

*Not yet added.* The implementation will land in these top-level folders, per the backend build guide:

| Folder | Contents |
|--------|----------|
| `contracts/` | Solidity smart contracts + Hardhat project (custody, batch registry, roles, pricing) |
| `trust-layer/` | FastAPI service hosting the AI anomaly models that validate sensor readings before on-chain commits |
| `indexer/` | Chain event indexer that materializes on-chain state for querying |
| `web/` | Next.js dApp — the role-based UI matching the mockups in `design/mockups/` |
| `simulator/` | IoT sensor simulator with configurable fault injection, used to generate and label test data |

---

## Conventions

- **No spaces in file or folder names.** Use kebab-case — spaces break URLs, markdown links, and CI scripts.
- Media assets (PNG, PDF, MP4) are tracked as regular Git files; **Git LFS is not used**.
