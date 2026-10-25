# TASKS.md — System Task Checklist & Verification Runbook

> **All primary engineering phases (Phases 1–13) are COMPLETE. Use this document as the regression testing checklist and verification runbook.**

---

## 1. Phase Completion Summary

- [x] **Phase 1: Environment & Project Scaffolding** — Node.js, Python virtualenv, Hardhat EVM environment, and React frontend confirmed operational.
- [x] **Phase 2: Core Blockchain Logic** — `AgriChainCore.sol` deployed and tested on local Hardhat node.
- [x] **Phase 3: Backend REST Services** — FastAPI services for batch lifecycle, IoT ingestion, and SQLite persistence.
- [x] **Phase 4: Telemetry Simulation** — Multi-scenario synthetic IoT telemetry generator with fault injection.
- [x] **Phase 5: Core Frontend Wiring** — Farmer dashboard and Consumer traceability views connected to real backend APIs.
- [x] **Phase 6: AI Trust Layer Integration** — 11-D feature extraction and Isolation Forest ML anomaly detection ($F_1 = 0.9722$).
- [x] **Phase 7: Multi-Role Dashboard Realignment** — Transit telematics to Logistics Partner, Inbound AI Trust Gate to Dark Store, Farm Quality to Farmer.
- [x] **Phase 8: Contract Modularity & Gas Optimization** — 5 modular OpenZeppelin contracts, batched condition writes (52.71% gas reduction), Polygon Amoy configuration.
- [x] **Phase 9: Cloud DB Migration & Decentralized Storage** — Supabase Cloud PostgreSQL with connection pooling and Pinata IPFS certificate pinning.
- [x] **Phase 10: Role Wallets & Physical Hardware** — Client-side MetaMask signing (`ethers.js` v6), verified consumer reviews, and ESP32 physical IoT firmware.
- [x] **Phase 11: Interactive Dashboard Depth** — Live transit telemetry gauges, responsive modals, and real-time KPI metrics.
- [x] **Phase 12: Security Hardening & Cryptographic Audit** — OpenZeppelin `Pausable` circuit breakers and IsoLog SHA-256 hash-chain verification.
- [x] **Phase 13: Omniscient God Mode & Capstone Showcase** — Synchronized 4-quadrant command hub, 1-click simulation scenarios, and automated presenter walkthrough.

---

## 2. Regression & Verification Runbook (`DONE WHEN` Checks)

### Verification 1: Smart Contracts Suite
```bash
cd contracts
npx hardhat test
node scripts/benchmark_gas.cjs
```
- **DONE WHEN**: All 22 tests pass with 0 failures, and gas benchmarking confirms $\ge 50\%$ savings for `recordConditionsBatch`.

### Verification 2: Backend & AI Trust Layer
```bash
pytest tests/ trust-layer/tests/
```
- **DONE WHEN**: All test suites pass cleanly with 0 errors and 0 warnings.

### Verification 3: Full End-to-End System Verification
```bash
python backend/scripts/verify_final_system.py
```
- **DONE WHEN**: All 8 stages succeed:
  1. Contract deployment & connectivity
  2. Database health & schema verification (Supabase/SQLite)
  3. Produce batch registration (`ProductRegistry.sol`)
  4. Custody transfer progression (`CustodyTransfer.sol`)
  5. Nominal telemetry validation & on-chain anchoring (`ColdChainMonitor.sol`)
  6. Anomalous telemetry quarantine & rejection
  7. Cryptographic SHA-256 quarantine hash-chain integrity
  8. Consumer traceability & fair-share pricing calculation

### Verification 4: Frontend Production Build
```bash
cd frontend
npm run build
```
- **DONE WHEN**: Vite compiles all modules with 0 errors.

### Verification 5: Physical Hardware & Fault Simulation
```bash
python hardware/simulate_esp32.py --mode demo
```
- **DONE WHEN**: Normal cold-chain packet logs as `VALID`, simulated GPIO 4 breach button triggers immediate `QUARANTINED` verdict, and quarantine audit logs confirm entry.
