# AgriChain

> **A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains**

[![Status](https://img.shields.io/badge/Status-All_Phases_Complete-emerald?style=flat-square)]()
[![Solidity](https://img.shields.io/badge/Solidity-0.8.28_Pausable-blue?style=flat-square)]()
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_Python_3.11-green?style=flat-square)]()
[![AI Trust Layer](https://img.shields.io/badge/AI_Trust-F1_0.9722_Isolation_Forest-purple?style=flat-square)]()
[![Storage](https://img.shields.io/badge/Storage-Supabase_PostgreSQL_%2B_IPFS-teal?style=flat-square)]()
[![Frontend](https://img.shields.io/badge/Frontend-React_18_%7C_Tailwind_%7C_ethers.js-orange?style=flat-square)]()

---

## 1. Overview

AgriChain is an end-to-end farm-to-fork supply chain traceability framework for perishable crops. An **AI Pre-Chain Trust Layer** evaluates IoT telemetry before committing data on-chain, quarantining sensor anomalies and physical tampering while immutably anchoring verified conditions. Every custody transfer records stage markups, guaranteeing the farmer's fair share is transparent to the consumer.

```
[IoT Node / ESP32] ──► [AI Trust Layer (F1: 0.9722)] ──┬──► [EVM Modular Contracts] (52.7% gas saved)
                                                      ├──► [Supabase PostgreSQL & IPFS Pinata]
                                                      └──► [Multi-Role Frontend & God Mode Hub]
```

---

## 2. Key Capabilities

- **Pre-Chain AI Gatekeeper**: 11-D feature extraction and Isolation Forest ($F_1 = 0.9722$) filter corrupt sensor data; valid telemetry is batched and anchored on-chain.
- **Modular Smart Contracts**: 5 contracts (`ProductRegistry`, `CustodyTransfer`, `ColdChainMonitor`, `PolicyConfig`, `AccessControlRoles`) with OpenZeppelin RBAC and Pausable circuit breakers.
- **52.71% Gas Reduction**: Batched oracle writes (`recordConditionsBatch`) drastically reduce on-chain storage costs for continuous monitoring.
- **Fair-Share Transparency**: Immutable price tracking across Farmer (50.0%), Logistics (18.8%), and Dark Store (31.2%).
- **Tamper-Evident Audit Trail**: IsoLog SHA-256 cryptographic hash-chained quarantine log for rejected telemetry.
- **Omniscient God Mode**: 4-quadrant synchronized command center with a 1-click cinematic presenter walkthrough.

---

## 3. Quick Start

### 1. Setup Environment
```bash
git clone https://github.com/Suyash728/agri-chain.git && cd agri-chain
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt -r trust-layer/requirements.txt
```

### 2. Run Blockchain Node & Deploy Contracts
```bash
cd contracts && npm install
npx hardhat node
# In a new terminal:
npx hardhat run scripts/deploy_amoy.cjs --network localhost
```

### 3. Start Backend & AI Trust Layer
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Launch Frontend
```bash
cd frontend && npm install
npm run dev  # Open http://localhost:3000
```

Click **"✨ God Mode"** or the top navigation bar to explore the synchronized 4-role live supply chain.

---

## 4. Verification & Testing

```bash
# Full capstone 8-stage verification (Contracts + DB + AI + Custody)
python backend/scripts/verify_final_system.py

# Run smart contract unit tests (22 passing) & gas benchmarks
cd contracts && npx hardhat test && node scripts/benchmark_gas.cjs

# Run full backend and AI test suite (154 passing, 0 warnings)
pytest tests/ trust-layer/tests/

# Run ESP32 physical sensor simulation (nominal & breach fault demo)
python hardware/simulate_esp32.py --mode demo
```

---

## 5. Repository Layout

```
.
├── backend/       FastAPI REST API, dual-storage (Supabase/SQLite), Web3 relayer
├── contracts/     Hardhat suite: 5 modular Solidity contracts + gas benchmark
├── frontend/      React 18 + Vite + Tailwind multi-role UI + God Mode Hub
├── trust-layer/   AI Pre-Chain anomaly detection microservice (F1: 0.9722)
├── hardware/      ESP32 firmware (DHT22, GPS, GPIO 4 button) & Python simulator
├── simulator/     IoT multi-scenario telemetry streaming simulator
└── review-2/      Capstone Review 2 architecture diagrams and viva presentation
```

---

## License
MIT Academic License — Capstone Major Project 2026–2027.
