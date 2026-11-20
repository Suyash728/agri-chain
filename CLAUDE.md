# CLAUDE.md — AgriChain Engineering Guide

The single, full guide to this codebase for Claude Code and other agents. Keep it current: when a change makes something here wrong, fix this file in the same commit.

**Where everything else lives:**

| File | Purpose |
|---|---|
| [`RULES.md`](RULES.md) | The short list of hard, non-negotiable constraints (summarised in §12). |
| [`MEMORY.md`](MEMORY.md) | Dated log of decisions and changes: *why* things are the way they are. |
| [`README.md`](README.md) | Human introduction and quick start. |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) / [`PRD.md`](PRD.md) | Architecture overview and product requirements, for people new to the project. |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Free-tier deployment (Render, Vercel, Supabase, Polygon Amoy). |
| [`reports/CODEBASE_AUDIT_2026-11-18.md`](reports/CODEBASE_AUDIT_2026-11-18.md) | Verified test results, reproduced metrics, open defects. |
| `AGENTS.md` | Pointer to this file for other agents. |
| `docs/` | Hardware spec, breadboard guide, academic material (examiner/viva guides, proposal). `docs/archive/` is historical and unmaintained. |

---

## 1. What AgriChain Is

A farm-to-fork traceability platform for perishable produce in India. It targets two failures:
1. **Spoilage disputes.** Produce passes through farmers, reefer logistics and dark stores. When it spoils, nobody can prove who was at fault, because condition data is missing or easy to fake.
2. **Invisible markups.** Consumers pay ₹80–120/kg while the farmer gets ₹15–20/kg, and nobody can see where the difference went.

**How it works:** IoT sensors ride with the crate. A pre-chain **AI trust layer** checks every reading before it is anchored on an EVM chain. Custody transfers record each stage's price, so the consumer can see the real price trail.

## 2. Architecture

```
[ ESP32 node (USB serial) / virtual simulator devices ]
        │  hardware/monitor_live.py: two-phase flash sync, device ↔ batch link, durable outbox
        ▼
[ FastAPI backend :8000 ] ── access policy (backend/settings.py) ── Supabase PostgreSQL / SQLite
        │
        ├─► AI trust layer (trust-layer/): range → plausibility → 11-D features → Isolation Forest
        │        → replay/integrity → verdict          (persist-before-validate: readings row first)
        │
        ├─► VALID / BREACH ─► web3.py relayer ─► contracts (Hardhat :8545 / Polygon Amoy)
        │                       ProductRegistry · CustodyTransfer · ColdChainMonitor · PolicyConfig
        ├─► ANOMALOUS ─► IsoLog SHA-256 hash-chained quarantine log
        └─► device_telemetry (shocks, tamper, GPS, VOC per linked batch)
        │
        ▼
[ React 18 + Vite + Tailwind :3000 ]  Farmer · Logistics · Dark Store · Consumer · Admin · God Mode
```

### Repository map
| Path | Contents |
|---|---|
| `hardware/test_pentad/` | **Active** ESP32 firmware (USB serial, LittleFS, two-phase sync, hash chain). |
| `hardware/esp32_firmware/` | Standalone Wi-Fi variant (HTTP POST, 10-slot queue). Not the focus. |
| `hardware/monitor_live.py` | Host bridge and terminal dashboard. |
| `hardware/simulate_esp32.py`, `simulator/simulate.py` | Simulators. Both support `--virtual`. |
| `backend/` | FastAPI app, routers, Web3 relayer, IPFS, dual storage, IoT linking, access policy. |
| `trust-layer/` | Validation pipeline, Isolation Forest, simulator and evaluation (147 tests). |
| `contracts/` | Solidity contracts, Hardhat tests (22), gas benchmark, deploy script. |
| `frontend/` | Multi-role React UI (`frontend/DESIGN.md` is the design system). |
| `reports/`, `docs/` | Audit report, hardware and academic documentation. |

## 3. Current Focus: the Physical IoT Node

Hardware is the active sprint; the rest of the stack is built. The node must:
- sample its sensors accurately;
- buffer readings to flash while in transit;
- hand everything to the PC without loss when plugged in;
- feed the backend live, with every reading attributed to the right produce batch.

**Status (2026-11-20):** all four are implemented and tested on real hardware (§4–§6). The physical sensors still need tuning (§14).

## 4. ESP32 Node (`hardware/test_pentad/src/main.cpp`)

### 4.1 Pinout (ESP32 DevKit v1, 30-pin)
| Subsystem | Part | Pin | Notes |
|---|---|---|---|
| Temp / humidity | DHT11/DHT22 | GPIO 4 | 4.7 kΩ pull-up to 3.3 V. |
| Gas (VOC / rot) | MQ-135 | GPIO 34 (ADC1_CH6) | 5 V heater; AOUT through a 10 kΩ series / 20 kΩ shunt divider (gain 1.5). |
| Shock | SW-420 | GPIO 32 (IRQ) | `INPUT_PULLUP`, falling-edge ISR; edges within 200 ms count as one impact. Sensitivity is set by the trim pot. |
| Lid tamper | GL5528 LDR | GPIO 35 (ADC1_CH7) | 10 kΩ pull-down. Tamper latches above ADC 2500 and clears below 2200. |
| GPS | u-blox NEO-6M | RX2 GPIO 16 / TX2 GPIO 17 | 9600 8N1, TinyGPSPlus, non-blocking. |
| Storage | SPI flash | — | LittleFS 1.4 MB partition. |
| Status LED | onboard | GPIO 2 | Pulses on new shock / tamper (non-blocking). |

> **ADC rule:** analog inputs must stay on ADC1 (GPIO 34/35). ADC2 pins (0, 2, 4, 12–15, 25–27) conflict with Wi-Fi.

### 4.2 Measurements
- **Dew point (Magnus-Tetens):** α = 17.27T/(237.7+T) + ln(H/100), T_dew = 237.7α/(17.27−α). A condensation margin below 2 °C is flagged.
- **MQ-135:**
  - V_RL = 1.5 × V_pin and Rs = R_L(5.0 − V_RL)/V_RL. V_pin comes from `analogReadMilliVolts()`, averaged over 32 samples across one 50 Hz period.
  - Compensation: C_th = (1.385 − 0.0152T + 0.00011T²)(1.133 − 0.00205H), and ratio = Rs / (R0·C_th).
  - CO₂ = 400 + 110.47·ratio^−2.862 (MQ-135 can't measure absolute CO₂), NH₃ = 102.20·ratio^−2.473, alcohol = 77.255·ratio^−3.180.
  - `gas_sat` is set at the ~3.1 V ADC ceiling.
- **R0 calibration:** `CMD:CAL_R0`, or `monitor_live.py --calibrate-r0` in clean air after warm-up. It stores R0 = mean(Rs/C_th)/3.6. `CAL_R0:<kΩ>` restores a value and `CAL_R0:RESET` erases it. Packets carry `gas_cal`, and the host forwards VOC (alcohol ppm) **only** when `gas_cal` is true.

### 4.3 Hash chain
Only stored records extend the chain: h_i = SHA-256(h_{i−1} ‖ "|" ‖ body_i), where body_i is the record's exact JSON up to `,"prev":"<16 hex>","hash":"<64 hex>"}`.
- **Genesis** is SHA-256("").
- **Live packets** carry the hash they would have if stored.
- **Boot recovery:** the head is recovered from the last stored record, or from `/agrichain_chain.bin` when the log is empty.
- **Host check:** the host verifies every sync, reporting *gaps* (deleted on device) versus *tampered* (content changed). It keeps the last head in `hardware/transit_logs/chain_state.json`.
- **Limit:** the chain is unkeyed. It catches corruption, edits and deletions, but it is not a device signature; that would need an HMAC key in eFuse/NVS.

### 4.4 Storage and serial protocol (115200 baud)
- **Storage:** two 175 KB log segments (`/agrichain_log.jsonl` plus `.old.jsonl`) give a 350 KB ceiling, with a 200 KB free-space guard. Rotation drops only the oldest segment. The filesystem is never silently formatted; a failed mount prints `STORAGE_ERROR:MOUNT_FAILED_REFORMATTING`. Record counts come from scanning the log at boot, and `/agrichain_boot.bin` holds a boot counter.
- **Logging cadence:** every 10 s, plus immediately on a new shock or on the lid's rising edge.
- **Record fields:** `boot`, `up_ms`, `ts` (unix seconds, 0 = unknown), `ts_src` (`gps`/`host`/`none`), `shock_delta`, `tamper`, `dht_ok`, `gas_*`, `prev`, `hash`.
- **Live stream:** `JSON:{...}` every 1 s.

Commands:

| Command | Reply / effect |
|---|---|
| `CMD:STATUS` | `STATUS:{records, bytes, free_kb, uptime, up_ms, boot, ts, ts_src, shocks, pending_ack, gas_cal, r0, warmup, head}` |
| `CMD:TIME:<unix>` | Sets the wall clock; GPS UTC takes over once locked. Replies `TIME:OK:<t>:<src>` or `TIME:REJECTED`. |
| `CMD:SYNC` / `CMD:DUMP` | **Does not clear.** Sends `OFFLINE_DUMP_START:N`, then N × `OFFLINE_JSON:{...}`, then `OFFLINE_DUMP_COMPLETE:N`. |
| `CMD:ACK:<N>` | Deletes exactly the dumped records and keeps newer ones. Replies `OFFLINE_SYNC_COMPLETE:OK`, or `OFFLINE_ACK_REJECTED:<NO_PENDING_DUMP\|STALE\|COUNT_MISMATCH:n\|BAD_FORMAT\|COMPACT_FAILED>`. |
| `CMD:CLEAR` | Deletes all log segments → `OFFLINE_BUFFER_CLEARED:OK`. |
| `CMD:PAUSE` / `CMD:RESUME` | Toggles the live stream (sampling continues). |
| `CMD:CAL_R0[:<kΩ>\|:RESET]` | MQ-135 calibration (§4.2). |

Lines over 128 characters are discarded whole (`CMD_REJECTED:TOO_LONG`).

## 5. Host Bridge (`hardware/monitor_live.py`)
1. **Connect without resetting.** pyserial's default DTR+RTS are left alone, so the board's uptime and clock survive the plug-in. Permission (`uucp`/`dialout`) and missing-device errors are explained. A USB disconnect triggers a reconnect every 2 s.
2. **Find the batch.** The monitor registers the device and gets its batch link from the backend (§6). The fallback order is `--batch`, then the cached link.
3. **Two-phase sync, on connect and on `[S]`:**
   - `STATUS` (clock anchor) → `TIME` → `SYNC`;
   - the raw lines are written byte-for-byte and fsync'd to `hardware/transit_logs/transit_dump_<ts>.jsonl`, with a `.meta.json` alongside;
   - `ACK:<n>` is sent only if the counts match.

   Timestamps come from the record's `ts`, else the same-boot uptime anchor, else `None`.
4. **Durable outbox.** Synced readings are queued in `hardware/transit_logs/outbox/` and POSTed to `/telemetry/batch` in chunks of 25, retried every 15 s.
   - HTTP 401/403/503 means a key problem, so the batch is kept and retried.
   - Any other 4xx moves the batch to `.rejected`.
   - Live `/telemetry` pauses while a backlog uploads, so order is preserved.
5. **Backend mapping:**
   - `tamper_status` is `TAMPER_OPENED`, `SHOCK_DETECTED` or `SEALED`.
   - It also sends `shocks`, `shock_delta`, `tamper`, `gps_fix`, `light_lux` and `source`.
   - VOC is sent only when calibrated.
   - Coordinates are the current or last fix, never invented.
6. **Keys:**
   - `[P]` pauses or resumes; `[S]` syncs; `[C]` clears flash (press twice).
   - `[M]` opens Maps; `[Q]` quits.
   - `[B]` opens the batch picker: `1-9` links, `N/P` pages, `U` unlinks, `B/X/Esc` closes.
7. **Flags and calibration:** `--backend`, `--device-key`, `--device-id`, `--port`, `--skip-sync`, `--clear`, `--batch`, `--calibrate-r0`, `--reset-r0`. The env vars `AGRICHAIN_BACKEND_URL` and `AGRICHAIN_DEVICE_KEY` set the same things.

## 6. IoT Device ↔ Batch Linking (`backend/iot.py`, `backend/routers/devices.py`)
- **One batch at a time.** A sensor reports to one batch, chosen by an operator. On the website, use Logistics → Shipment Tracking (*Manage Sensors*, *Link sensor*) or Dark Store → Incoming Deliveries (*Manage Sensors*, or the sensor card in delivery details). In the terminal, use the monitor's `[B]` picker. Both write the same link, and the monitor polls it every 5 s.
- **Offline records go to the batch linked at sync time.** Before switching batches, the monitor syncs flash to the **old** batch, even with `--skip-sync`. While unlinked, records wait in `outbox/unassigned/` and go to the next batch linked.
- **Dated link history** (`device_assignments`) allows time-window allocation later without migration.
- **Tables:** `iot_devices`, `device_assignments`, `device_telemetry`. A system reset clears links and device telemetry but keeps devices.
- **Only explicitly registered devices are tracked**, so ordinary simulator runs (`DEV-<batch>`) and God Mode inject behave as before.
- **API:** `GET /devices` · `POST /devices/register` (device key in production) · `GET /devices/{id}/assignment` · `POST /devices/{id}/assign {batch_id}` (returns warnings) · `POST /devices/{id}/unassign` · `GET /devices/{id}/history` · `GET /iot/assignable-batches` · `GET /batches/{id}/iot`. `/logistics/shipments` and `/darkstore/inbound` carry an `iot` object and use the linked sensor's temperature and GPS.
- **Virtual devices:** `simulator/simulate.py --virtual [SIM-01]` and `hardware/simulate_esp32.py --virtual SIM-02`. The seed data links `SIM-01` to `BAT-APL-903`.

## 7. Backend (`backend/`)
- **App:** FastAPI with 88 operations on 82 paths. The routers are common, telemetry, batches, farmer, logistics, darkstore, consumer, admin, demo and devices. Docs are at `/docs`.
- **Storage (`db.py`):** Supabase PostgreSQL when `DATABASE_URL` is set, otherwise SQLite at `backend/agrichain.db`. There are 16 tables, created on boot (`SQLITE_SCHEMA` and `migrations/001_initial_schema.sql`). The PG wrapper auto-appends `RETURNING id` to INSERTs whose SQL contains `readings`/`users`/… , so name new tables accordingly.
- **Chain (`chain.py`):**
  - `_send_tx` takes fees from the network (EIP-1559, with a `MIN_PRIORITY_FEE_GWEI` floor) and holds a nonce lock across allocation and broadcast.
  - Contract addresses come from `backend/modular-deployments.json`, or from `*_ADDRESS` env vars.
  - In production it refuses to start with Hardhat key #0.
- **Access policy (`settings.py`):**
  - Development is fully open.
  - `APP_ENV=production` turns on a CORS allow-list and requires `X-Device-Key` for telemetry and device registration.
  - It also requires `X-Admin-Token` for reset, seed, evaluate and admin writes, and hides `/demo/*` unless `DEMO_MODE=true`. See `DEPLOYMENT.md`.
- **Times:** stored in UTC, shown in `APP_TIMEZONE` (default Asia/Kolkata) through `common.format_local_timestamp`. Use `common.iso_utc` for client-side calculations.
- **Price trail (`GET /batches/{id}/traceability`):** each stage's rate is the recorded lot price in integer paise ÷ lot weight. A stage that hasn't happened is `null`, and shares appear only after the sale. **Never synthesize prices or markups.** Operator inputs may be *prefilled* with suggested prices (`/batches/{id}` `suggested_*`).
- **No invented data in API responses.** Ratings, review counts, certificates and KPIs come from the database, or are `null` / empty with an honest label.

## 8. AI Trust Layer (`trust-layer/`)
- **Pipeline:** schema and range checks → plausibility (Haversine velocity, rate-of-change, timestamp order) → 11-D features → Isolation Forest → replay and integrity → verdict (`VALID`, `ANOMALOUS`, `BREACH`, `INSUFFICIENT_EVIDENCE`).
- **What it outputs:** valid and breach readings are anchored; anomalous readings go to the hash-chained quarantine (`GET /quarantine/verify-integrity`).
- **Reproduced metrics** (seed 42, default config, 5 sequences per fault type, faults from the same simulator):
  - F1 0.9722, precision 94.59%, recall 100%, **false-positive rate on normal data 40%** (35% at 20 sequences per fault).
  - **With the Isolation Forest disabled: F1 1.000, FPR 0%.** The deterministic rules catch every synthetic fault, and the IF only adds false positives.
  - The IF's features include absolute lat/lon/temp, so real device data is flagged almost every time.
  - The previously published P 96.30% / R 98.18% does not reproduce.

## 9. Smart Contracts (`contracts/`)
- **Contracts:** `ProductRegistry`, `CustodyTransfer`, `ColdChainMonitor`, `PolicyConfig` and `AccessControlRoles` (OpenZeppelin `AccessControl` + `Pausable`). The legacy `AgriChainCore` is kept for backward compatibility.
- **Compiler:** solc 0.8.28; the sources declare `pragma ^0.8.20`.
- **Integer-only on-chain:** `pricePaise` (uint256) and `tempDeciC` (int256).
- **Gas (reproduced):** `recordConditionsBatch` saves **45.31% / 51.31% / 54.31%** at N = 5 / 10 / 20. A single modular write costs 73.6k gas vs 28.7k for the monolithic contract.
- **Known caveats:**
  - silent `int64`/`uint32` narrowing in `ColdChainMonitor`;
  - stage skipping is allowed;
  - there's no current-holder check;
  - `cumulativePricePaise` is overwritten;
  - `block.timestamp` is used rather than the measurement time.
- **Deploying:** `deploy_amoy.cjs` grants persona roles only on local networks, and refuses Hardhat key #0 on public ones.

## 10. Frontend (`frontend/`)
- **Stack:** React 18 + Vite + Tailwind + `lucide-react` + `ethers` v6. Role portals sit under `Farmer/`, `Logistic_Partner/`, `Dark_Store/` and `Consumer/`; `components/` holds Admin, God Mode, wallet and the IoT picker.
- **API base:** `VITE_API_BASE_URL`, falling back to `http://<host>:8000`. Contract addresses come from `src/utils/modular-deployments.json`, or from the `VITE_*_ADDRESS` overrides.
- **Design rule:** see RULES.md §5. Small self-contained additions are allowed when a feature needs input the existing UI can't capture, e.g. `components/iot/`.
- **Live-data rule:** never render hard-coded or random values as if they were live data. Use real data or an explicit empty state.
- **Browser storage:** use `src/utils/storage.js` (`storageGet` / `storageSet` / `storageRemove` / `storageKeys`), never `localStorage` directly. Blocked storage must not break a page.
- **Static audit:** `cd ~/Projects/killscore && uv run killscore audit ~/Projects/agri-chain [--all]` should stay at 0 high / 0 medium. Fix the finding, or add `# killscore: ignore[check] -- <reason>` only for a deliberate, narrow case.

## 11. Simulations
- **God Mode / Demo Lab:** `/demo/*`, hidden in production unless `DEMO_MODE=true`.
- **`hardware/simulate_esp32.py`:** modes `demo`, `fault`, `tamper`, `spoilage` and `stream`.
- **`simulator/simulate.py`:** trust-layer fault injection with `--fault`.
- **`run.py --simulator`.**
- **Virtual devices:** both scripts accept `--virtual` (§6). Without the flag their behaviour is unchanged.

## 12. Hard Rules (full text in [`RULES.md`](RULES.md))
1. Money is integer paise everywhere. Convert to rupees only when formatting in React.
2. Temperature is integer deci-°C on-chain and in comparisons.
3. Persist every telemetry packet before AI validation.
4. Custody moves forward only: `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`.
5. Don't restyle the frontend or add UI libraries; small additions only as above.
6. Commits use `[scope] description`. Never commit `.env`, `node_modules/`, `.venv/` or `*.db`.
7. **Never test against the real `.env`.** It points at Supabase and a live chain (see §13.3).

## 13. Commands

### 13.1 Run the stack
```bash
./run.sh [--no-browser] [--simulator] [--no-seed] [--kill-ports]   # or run.bat / .\run.ps1 / python run.py
```
> [!WARNING]
> `run.py` seeds with `TRUNCATE` and binds ports 3000 and 8000 to `0.0.0.0` (your whole LAN). With the repo `.env` (`DATABASE_URL` = Supabase) that **wipes the Supabase tables** on every launch. Use `--no-seed`, or `DATABASE_URL= python run.py` to run on local SQLite.

### 13.2 Hardware
```bash
.venv/bin/pio run -d hardware/test_pentad                                   # build
.venv/bin/pio run -d hardware/test_pentad -t upload --upload-port /dev/ttyUSB0
./run_monitor.sh [--skip-sync] [--clear] [--batch BAT-APL-903]            # monitor + sync
.venv/bin/python hardware/monitor_live.py --calibrate-r0                    # MQ-135, once, clean air
```

### 13.3 Tests (isolated, so nothing touches Supabase or a real chain)
```bash
cd contracts && npx hardhat test                                            # 22 passing, in-process chain
cp backend/agrichain.db /tmp/tl.db && SQLITE_DB_PATH=/tmp/tl.db .venv/bin/pytest trust-layer/tests/   # 147 passing
#   (the suite rewrites trust-layer/reports/figures/benchmark_summary.*; restore with git checkout)
cd contracts && npx hardhat run scripts/benchmark_gas.cjs                   # regenerates contracts/reports/gas_benchmark.*
```
Full-stack checks (`backend/scripts/verify_final_system.py`, UI crawls) need a running backend. Use the isolated recipe in the audit report §6: scratch copies of `backend/`, `trust-layer/` and `contracts/`, a scratch Hardhat node, `DATABASE_URL=` and a SQLite copy.

## 14. Status and Open Issues (2026-11-20)
**Done and verified:**
- Firmware: two-phase sync, rotation, device clock, hash chain, MQ-135 math and calibration.
- Host bridge: sync, outbox, reconnect, batch linking.
- Production access policy and the deploy config.
- An end-to-end dashboard pass: 31 desktop and 15 mobile screens, plus the UI journey from farmer to consumer.
- Honest price trail, ledger, timestamps, ratings and KPIs.

**Open:**
- **Hardware tuning:** the SW-420 is oversensitive (about 20 events per minute at rest). The LDR saturates in room light. The MQ-135 needs calibration. The USB unplug/replug test hasn't been done on hardware yet.
- **Authentication:** login is passwordless and role routes are open, so production mode only guards destructive and admin routes (audit #1–2).
- **Circuit breaker:** one ANOMALOUS reading permanently blocks a batch, and ML false positives make this common (audit #4). A desk-bound ESP32 will quarantine any batch it is linked to.
- **IPFS:** the fallback "CID" is not a real IPFS CID (#5).
- **`readings` table:** it drops device, time, location, VOC and tamper. `device_telemetry` covers this for registered devices only (#6).
- **Demo data:** seeded prices are unrealistically low (mango ₹1/kg), seeded harvest dates are fixed in October 2026, and the farmer "quality score" is a heuristic (audit §3b).
- **Contracts:** the caveats in §9.

## 15. Key Files
- **Firmware:** `hardware/test_pentad/src/main.cpp` · `hardware/test_pentad/platformio.ini`
- **Host and simulators:** `hardware/monitor_live.py` · `hardware/simulate_esp32.py` · `simulator/simulate.py`
- **Backend:** `backend/main.py` · `backend/settings.py` · `backend/db.py` · `backend/chain.py` · `backend/iot.py` · `backend/common.py`
- **Routers:** `backend/routers/{telemetry,batches,devices,logistics,darkstore,farmer,consumer,admin,demo,common}.py`
- **Trust layer:** `trust-layer/app/services/` (anomaly_detector, plausibility, features, verdict, evaluation)
- **Contracts:** `contracts/contracts/` · `contracts/scripts/deploy_amoy.cjs` · `contracts/scripts/benchmark_gas.cjs`
- **Frontend:** `frontend/src/App.jsx` · `frontend/src/components/iot/` · `frontend/DESIGN.md`
- **Deploy:** `render.yaml` · `frontend/vercel.json` · `.github/workflows/keepalive.yml` · `.env.example`
