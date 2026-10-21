# AgriChain Backend API

FastAPI REST API serving multi-role dashboards, smart contract orchestration, AI trust layer ingestion, dual-mode relational storage, IPFS document pinning, and Omniscient God Mode synchronization.

---

## 1. Architecture & Capabilities

- **Modular Smart Contract Relayer (`chain.py`)**: Interfaces with deployed EVM contracts (`ProductRegistry`, `CustodyTransfer`, `ColdChainMonitor`, `PolicyConfig`, `AccessControlRoles`) on local Hardhat nodes or Polygon Amoy.
- **Dual-Storage Relational Layer (`db.py`)**: Seamlessly connects to Supabase Cloud PostgreSQL via `DATABASE_URL` session pooler, with automatic fallback to local SQLite (`backend/agrichain.db`).
- **Pre-Chain AI Trust Layer Ingestion**: Ingests IoT sensor telemetry (`POST /telemetry`), routes payloads through 11-D feature extraction and Isolation Forest ML models ($F_1 = 0.9722$), and anchors verified batches on-chain while quarantining anomalies.
- **Decentralized Storage (`ipfs.py`)**: Pins produce inspection certificates (PDF/images) to IPFS via Pinata and anchors cryptographic CIDs (`ipfs://Qm...`) on-chain.
- **Omniscient God Mode (`main.py`)**: Consolidated real-time 4-quadrant state aggregation (`GET /demo/godmode/{id}`) and automated cinematic presentation tour (`POST /demo/godmode/tour-step`).
- **Tamper-Evident Quarantine Audit**: Implements IsoLog SHA-256 hash chaining (`prev_hash` → `entry_hash`) with runtime cryptographic verification (`GET /quarantine/verify-integrity`).

---

## 2. Directory Structure

```
backend/
├── main.py                     FastAPI application, lifespan handler & multi-role endpoints
├── db.py                       Dual database adapter (PostgreSQL + SQLite) with connection pooling
├── chain.py                    Web3.py client for modular smart contracts & role management
├── ipfs.py                     Pinata IPFS pinning gateway & cryptographic CID hasher
├── migrations/                 PostgreSQL DDL schema definitions (11 normalized tables)
├── modular-abis/               Exported ABIs for modular contracts
├── modular-deployments.json    Active contract deployment addresses
└── scripts/                    Verification and test suites
    ├── verify_final_system.py  Capstone 8-stage automated verification suite
    ├── verify_phase7_e2e.py    Multi-role custody lifecycle test
    └── migrate_sqlite_to_supabase.py Database migration utility
```

---

## 3. Running the Backend

### Prerequisites
Ensure Python 3.11+ is installed and dependencies are satisfied:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt -r trust-layer/requirements.txt
```

### Environment Configuration (`.env`)
Create `.env` in the repository root:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
HARDHAT_RPC_URL="http://127.0.0.1:8545"
PINATA_JWT="your_pinata_jwt_here"
```

### Start the Server
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Swagger API documentation is available at `http://localhost:8000/docs`.

---

## 4. Verification Tests

```bash
# Execute capstone 8-stage full system test
python backend/scripts/verify_final_system.py

# Execute full backend test suite
pytest tests/
```
