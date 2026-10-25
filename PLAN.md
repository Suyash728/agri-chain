# PLAN.md — AgriChain Implementation Roadmap & Milestone Record

> **Historical Milestone Record, Implemented Architecture Phases, and Maintenance Roadmap.**

---

## 1. Implemented System Milestones (Phases 1–13)

All system phases have been fully implemented, tested, and validated end-to-end:

| Phase | Milestone | Core Deliverables | Status |
|---|---|---|---|
| **Phase 1** | **Environment & Scaffolding** | Configured Hardhat EVM environment, FastAPI backend virtualenv, and Vite React frontend. | ✅ Complete |
| **Phase 2** | **Core Smart Contracts** | Implemented batch registration, custody state machine, and condition logging on local EVM node. | ✅ Complete |
| **Phase 3** | **Backend REST API** | FastAPI services for batch lifecycle, IoT ingestion, and initial rule-based validation. | ✅ Complete |
| **Phase 4** | **Telemetry Simulation** | Synthetic telemetry generator with fault injection (spikes, GPS teleportation, drift). | ✅ Complete |
| **Phase 5** | **Farmer & Consumer Wiring** | Wired Farmer dashboard and Consumer QR provenance / price journey to live backend. | ✅ Complete |
| **Phase 6** | **AI Trust Layer Integration** | 11-D feature extraction and Isolation Forest ML anomaly detector ($F_1 = 0.9722$). | ✅ Complete |
| **Phase 7** | **Multi-Role Alignment** | Realigned cold-chain telematics to Logistics Partner, AI Trust Gate to Dark Store, and Farm Quality to Farmer. | ✅ Complete |
| **Phase 8** | **Contract Modularity & Gas Optimization** | Split into 5 OpenZeppelin contracts; implemented batched condition writes (**52.71% gas reduction**); configured Polygon Amoy testnet. | ✅ Complete |
| **Phase 9** | **Cloud DB & Decentralized Storage** | Integrated Supabase Cloud PostgreSQL with connection pooling and Pinata IPFS certificate pinning. | ✅ Complete |
| **Phase 10**| **Web3 Wallets & Physical IoT** | Client-side MetaMask signing (`ethers.js` v6) with relayer fallback; ESP32 firmware & Python hardware runner. | ✅ Complete |
| **Phase 11**| **Interactive Dashboard Depth** | Dynamic modals, real-time KPI aggregations, and live transit telemetry charts. | ✅ Complete |
| **Phase 12**| **Security & Cryptographic Audit** | OpenZeppelin `Pausable` circuit breakers and IsoLog SHA-256 hash-chain verification (`/quarantine/verify-integrity`). | ✅ Complete |
| **Phase 13**| **Omniscient God Mode & Demo Lab** | Synchronized 4-quadrant command center, 1-click preset simulation scenarios, and automated presenter walkthrough. | ✅ Complete |

---

## 2. System Verification Protocol

Run the following test commands to verify system health across all components:

```bash
# 1. Full Smart Contract Suite (22 tests) & Gas Benchmarks
cd contracts && npx hardhat test && node scripts/benchmark_gas.cjs

# 2. Backend & AI Trust Layer Test Suite (163 tests)
pytest tests/ trust-layer/tests/

# 3. Capstone 8-Stage Full-System Verification (Contracts + DB + AI + Custody)
python backend/scripts/verify_final_system.py

# 4. Frontend Production Build Check
cd frontend && npm run build

# 5. Hardware IoT Simulation Check
python hardware/simulate_esp32.py --mode demo
```

---

## 3. Extension & Maintenance Guidelines

When extending AgriChain or adding new features:
1. **Database Schema Additions**: Add SQL DDL migrations to `backend/migrations/` and update both PostgreSQL and SQLite schema adapters in `backend/db.py`.
2. **Smart Contract Modifications**: Ensure all role-restricted functions enforce OpenZeppelin `AccessControlRoles`. Run `npx hardhat test` to ensure zero regressions.
3. **Telemetry & Trust Engine**: If updating feature extraction in `trust-layer/`, verify that evaluation benchmarks maintain an $F_1 \ge 0.95$ across all standard fault scenarios.
4. **Frontend Integration**: Always consult `frontend/src/data/mockData.js` and `frontend/src/Consumer/data/consumerData.js` for expected payload structures before creating new endpoints.
