# ARCHITECTURE.md — AgriChain Architecture Overview

An overview for people new to the project. The authoritative, detailed guide is [`CLAUDE.md`](CLAUDE.md), and the constraints are in [`RULES.md`](RULES.md).

## 1. System

```
[ ESP32 node ]──USB serial──►[ hardware/monitor_live.py ]
   DHT, MQ-135, SW-420,          two-phase flash sync (SYNC → save → ACK)
   LDR, GPS, LittleFS,           device ↔ batch link · durable outbox
   SHA-256 record chain                     │
[ virtual devices (simulators --virtual) ]──┤ HTTP: POST /telemetry, /telemetry/batch
                                            ▼
[ FastAPI backend :8000 ]  access policy (dev open / production keys + CORS allow-list)
   │  1. persist reading (readings, PENDING)          ─► Supabase PostgreSQL or SQLite
   │  2. AI trust layer: range → plausibility → 11-D features → Isolation Forest → replay → verdict
   │  3. device_telemetry (shocks, tamper, GPS, VOC) for registered devices
   ├─► VALID / BREACH ─► web3.py relayer ─► ColdChainMonitor (single or batched writes)
   ├─► ANOMALOUS ─► IsoLog quarantine (SHA-256 hash chain, /quarantine/verify-integrity)
   └─► custody & documents ─► CustodyTransfer, ProductRegistry (+ IPFS via Pinata)
                                            │
[ React 18 web app :3000 ]  Farmer · Logistics · Dark Store · Consumer · Admin · God Mode
```

## 2. Components

### Hardware (`hardware/`)
- **Active firmware:** `test_pentad/` (PlatformIO, ESP32 DevKit v1).
  - It samples every second and logs to LittleFS every 10 s, plus immediately on a shock or lid opening.
  - It answers `STATUS`, `TIME`, `SYNC`, `ACK`, `CLEAR` and `CAL_R0` over serial.
  - Stored records form a SHA-256 chain that the host verifies.
- **Host bridge:** `monitor_live.py` downloads and acknowledges records, attributes them to the batch the device is linked to, and uploads them through a durable outbox.

### Backend (`backend/`)
- **App:** FastAPI with ten routers: common, telemetry, batches, farmer, logistics, darkstore, consumer, admin, demo and devices. That's 88 operations; the interactive docs are at `/docs`.
- **Storage:** `db.py` uses Supabase PostgreSQL when `DATABASE_URL` is set, otherwise SQLite. There are 16 tables, created on startup.
- **Chain:** `chain.py` is the web3.py relayer. It takes fees from the network and serializes nonces.
- **IPFS:** `ipfs.py` pins through Pinata; without credentials it falls back to a local content hash.
- **IoT linking:** `iot.py` plus `routers/devices.py` hold the device registry, dated links between devices and batches, and per-device telemetry.
- **Access policy:** `settings.py` controls the production access policy.

### AI trust layer (`trust-layer/`)
- **Pipeline:** schema and range checks → physical and temporal plausibility (Haversine speed, rate of change, timestamp order) → 11-D feature vector → Isolation Forest → replay and integrity checks → verdict.
- **Verdicts:**
  - `VALID` and `BREACH` readings are anchored on-chain. A breach is a genuine policy violation and is recorded as one.
  - `ANOMALOUS` readings are quarantined.
- **Evaluation:** `EvaluationService` runs the 7-fault benchmark. See the audit report for the reproduced numbers and caveats.

### Smart contracts (`contracts/contracts/`)
| Contract | Role |
|---|---|
| `AccessControlRoles` | Roles: admin, farmer, logistics, retailer, oracle. |
| `ProductRegistry` | Batch registration, IPFS document CIDs, Pausable. |
| `CustodyTransfer` | Forward-only custody states, stage price in paise, Pausable. |
| `ColdChainMonitor` | Condition records (`int` deci-°C), batched writes, Pausable. |
| `PolicyConfig` | Per-crop temperature / humidity thresholds. |
| `AgriChainCore` | Legacy single contract, kept for compatibility. |

### Frontend (`frontend/`)
- **Stack:** React 18 + Vite + Tailwind, with ethers v6 for optional MetaMask flows.
- **Portals:** one per role, plus God Mode (scenario simulator and presenter tour) and the IoT sensor picker (`src/components/iot/`).
- **Design system:** `frontend/DESIGN.md`.

## 3. Data rules
- **Money:** integer paise; **temperature:** integer deci-°C on-chain (RULES.md §2).
- **Persist before validating** (RULES.md §3).
- **No invented data** (RULES.md §6). The price trail is recorded lot price ÷ weight; a stage that hasn't happened is shown as not recorded.
- **Times:** stored in UTC and shown in `APP_TIMEZONE` (Asia/Kolkata).

## 4. Main endpoints
| Endpoint | Purpose |
|---|---|
| `POST /batches` | Register a harvest lot (and on-chain). |
| `POST /batches/{id}/custody` | Custody transfer with stage price in paise. |
| `GET /batches/{id}/traceability` | Farm-to-fork journey, condition log, price trail. |
| `POST /telemetry`, `POST /telemetry/batch` | Ingest readings through the AI trust layer. |
| `GET /logistics/shipments`, `GET /darkstore/inbound` | Role dashboards (include linked-sensor data). |
| `POST /darkstore/receive`, `POST /darkstore/checkout` | Dark store GRN and sale. |
| `GET /devices`, `POST /devices/{id}/assign`, `GET /batches/{id}/iot` | IoT sensor linking and live sensor view. |
| `GET /quarantine/verify-integrity` | Verify the quarantine hash chain. |
| `POST /admin/contracts/pause`, `/unpause`, `/admin/roles/grant` | Governance. Production requires an admin token. |
| `GET /health` | Database, chain and policy status (used by the keep-alive). |

## 5. Deployment
`DEPLOYMENT.md`: backend on Render, frontend on Vercel, database on Supabase, contracts on Polygon Amoy, with a GitHub Actions keep-alive.
