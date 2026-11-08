# MEMORY.md — AgriChain System Memory & Project State

> **Compact Source of Truth for AgriChain.**
> Comprehensive historical session logs are archived in `docs/reference/MEMORY_FULL_ARCHIVE.md`.

---

## 1. System Overview & 5-Tier Architecture

AgriChain is a tamper-evident agricultural supply chain platform connecting physical IoT edge telemetry to an EVM blockchain via a pre-chain AI Trust Layer.

```
[ ESP32 Hardware Node / Simulator ]
         │ (HTTP / Serial 115200 baud)
         ▼
[ FastAPI Backend (Port 8000) ] ──► [ Dual Storage: Supabase Cloud PostgreSQL / SQLite ]
         │
         ▼
[ Pre-Chain AI Trust Layer ]
  - Range, Rate-of-Change & Haversine Plausibility Checks
  - 11-D Time-Series Feature Engineering
  - Isolation Forest ML Anomaly Detection (F1 = 0.9722, Latency ~1.8ms)
  - Cryptographic Replay Detection & SHA-256 Fingerprinting
         │
         ├── [ VALID & READY_FOR_ORACLE ]
         │         │
         │         ▼ (web3.py relayer / client MetaMask)
         │   [ Modular Smart Contracts (Hardhat Port 8545 / Polygon Amoy) ]
         │     ├── ProductRegistry.sol (Metadata, IPFS CID Anchoring, Circuit Breaker)
         │     ├── CustodyTransfer.sol (Monotonic Lifecycle & Cumulative Price Trail)
         │     ├── ColdChainMonitor.sol (Batched Writes — 52.71% Gas Reduction)
         │     ├── PolicyConfig.sol (Crop Temperature / Humidity Thresholds)
         │     └── AccessControlRoles.sol (OpenZeppelin Role-Based Access Control)
         │
         └── [ ANOMALOUS / CORRUPTED ]
                   │
                   ▼
             [ IsoLog SHA-256 Hash-Chained Quarantine Ledger ]

         │
         ▼
[ Multi-Role Frontend (Port 3000) ]
  Farmer | Logistics | Dark Store | Consumer | Admin | God Mode Hub
```

---

## 2. Inviolable System Rules & Data Constraints

1. **Money Representation**: Always integer `price_paise` (1 INR = 100 paise). Never use floating-point for financial calculations.
2. **Temperature Representation**: Always integer `temp_deci_c` on-chain (24.5°C = 245). Floats are allowed only in off-chain AI ingestion before discretization.
3. **Audit Trail Persistence**: Every incoming telemetry ping is recorded in `readings` before AI evaluation to maintain an audit trail.
4. **State Machine Transition**: Produce custody transitions are strictly monotonic and forward-only:
   $$\text{REGISTERED} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{IN\_STORAGE} \longrightarrow \text{AT\_RETAIL} \longrightarrow \text{SOLD}$$
5. **Frontend Constraints**: Wire, never recreate. Do not modify color palettes, fonts, or Tailwind layouts in `frontend/`. Replace mock data only with exact matching API response schemas.

---

## 3. Subsystem Specifications

### A. Smart Contracts (`contracts/`)
- **Solidity Version**: `0.8.28` using OpenZeppelin `AccessControl` and `Pausable`.
- **RBAC Roles**: `DEFAULT_ADMIN_ROLE`, `FARMER_ROLE`, `LOGISTICS_ROLE`, `RETAILER_ROLE`, `ORACLE_ROLE`.
- **Condition Batching**: `ColdChainMonitor.recordConditionsBatch` delivers **52.71% gas reduction** at $N=20$.
- **Circuit Breaker**: Emergency pausing locks batch registration, custody transfer, and condition logging during security audits.
- **Verification**: `npx hardhat test` (22/22 tests passing).

### B. Backend & Storage (`backend/`)
- **Framework**: FastAPI with modular APIRouter architecture (`routers/farmer.py`, `routers/logistics.py`, `routers/darkstore.py`, `routers/consumer.py`, `routers/telemetry.py`, `routers/admin.py`, `routers/batches.py`, `routers/demo.py`, `routers/common.py`), centralized Pydantic schemas (`schemas.py`), Web3.py client (`chain.py`), Pinata IPFS integration (`ipfs.py`), and dual-storage adapter (`db.py`).
- **Database**: Connects to Supabase PostgreSQL when `DATABASE_URL` is set, with seamless fallback to SQLite (`backend/agrichain.db`).
- **Endpoints**: 80 modular route operations covering Telemetry (`POST /telemetry`, `POST /telemetry/batch`), Batches (`/batches/*`), Dashboards (`/farmer/*`, `/logistics/*`, `/darkstore/*`, `/admin/*`), and Traceability (`GET /batches/{id}/traceability`). All template mock data removed and all frontend fetches centralized to `${API_BASE_URL}`.

### C. AI Trust Layer (`trust-layer/`)
- **Pipeline**: Schema validation → Plausibility → Feature Extraction → Isolation Forest → Replay Check → Verdict Engine → IsoLog Quarantine.
- **Metrics**: Accuracy 97.20%, Precision 96.30%, Recall 98.18%, F1-Score 0.9722 across 7 fault types (temperature spike, humidity spike, GPS jump, timestamp drift, replay, gap, composite).
- **Verification**: `pytest trust-layer/tests/` (147/147 tests passing).

### D. Physical Hardware IoT Node (`hardware/test_pentad/`)
- **Target**: ESP32 DevKit v1 (30-pin) programmed in PlatformIO (C++/Arduino).
- **Sensors & Pinout**:
  - `DHT11`: GPIO 4 (Microclimate & Magnus-Tetens dew point)
  - `MQ-135`: GPIO 34 / ADC1 (Two-variable hygrothermally compensated gas e-nose: $\text{CO}_2, \text{NH}_3$, alcohol, acetone)
  - `SW-420`: GPIO 32 / IRQ (Sub-microsecond falling-edge transit shock counter, 25ms debounce)
  - `LDR`: GPIO 35 / ADC1 (Optical lux & crate anti-tamper light breach detector)
  - `NEO-6M GPS`: RX=GPIO 16, TX=GPIO 17 (TinyGPSPlus, 9600 baud, non-blocking)
  - `LittleFS Flash`: Onboard offline ring-buffer (350 KB safe ceiling, 200 KB reserve guard)
- **Edge Security**: Hardware-accelerated SHA-256 continuous hash chaining (`mbedtls/sha256.h`) producing 16-hex compact fingerprints.
- **Mission Control (`run_monitor.sh` / `hardware/monitor_live.py`)**:
  - Live 1 Hz dashboard with settled bootloader handshake.
  - Interactive hotkeys: `[P]` Pause/Resume, `[S]` Sync Flash, `[C]` Clear Flash, `[M]` Google Maps, `[B]` Cycle Produce Batch, `[Q]` Clean Quit.
  - Terminal audio alerts (`\a` for impact shocks, `\a\a` for optical light breach).

---

## 4. Key Verification & Operational Commands

```bash
# 1. Start Local Blockchain Node & Run Tests
cd contracts && npx hardhat node
cd contracts && npx hardhat test               # 22 passing

# 2. Run AI Trust Layer Test Suite
pytest trust-layer/tests/                      # 147 passing

# 3. Start Backend API Server
cd backend && uvicorn main:app --reload --port 8000

# 4. Start Frontend Web Client
cd frontend && npm run dev                     # Port 3000

# 5. Capstone End-to-End System Verification
python backend/scripts/verify_final_system.py  # 10-phase exhaustive verification

# 6. E2E Playwright Screenshot & Visual Fidelity Inspection
python scripts/e2e_screenshots_inspection.py   # Full-page screenshots for 12 role views

# 7. E2E Multi-Role Manual Batch Flow Verification
python scripts/test_full_ui_journey.py         # Full Farmer -> Logistics -> Dark Store -> Consumer flow

# 8. Physical Hardware Mission Control
./run_monitor.sh [--skip-sync] [--batch BAT-MGO-701]
```

---

## 5. Active Produce Lot Presets

| Batch ID | Crop Name | Origin / Cluster | Target Policy |
| :--- | :--- | :--- | :--- |
| `BAT-MGO-701` | Alphonso Mango | Ratnagiri GI Cold-Chain | 10–15°C, 85–90% RH |
| `BAT-TOM-802` | Organic Field Tomatoes | Nashik Agro Cluster | 8–12°C, 85–90% RH |
| `BAT-APL-903` | Shimla Royal Apples | Himachal Controlled Atmos | 0–4°C, 90–95% RH |
| `BAT-TUR-404` | Salem Pure Turmeric | Curcumin High Grade | Ambient dry |
| `BAT-WHT-505` | Sharbati Golden Wheat | MP Sehore Dry Storage | Ambient dry |
| `BAT-BER-606` | Fresh Strawberries | Mahabaleshwar Cold Express | 0–2°C, 90–95% RH |
