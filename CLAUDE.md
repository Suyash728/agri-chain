# CLAUDE.md — AgriChain Master System Context & Engineering Directive

> **Welcome Claude Code.** This document is your comprehensive source of truth for the **AgriChain** codebase.
> It defines the project philosophy, the 5-tier architecture, inviolable engineering constraints, the current active hardware sprint, and a mandatory audit directive for code stability, sensor precision, and supply-chain integration.

---

## 1. Master System Overview & Project Concept

### 1.1 The Core Problems AgriChain Solves
Traditional agricultural supply chains in India and developing economies suffer from two catastrophic points of failure:
1. **Unaccountable Cold-Chain Spoilage & Quality Disputes**: Perishable crops (mangoes, tomatoes, strawberries, apples) travel through fragmented intermediaries (farmers, rural aggregators, reefer logistics, urban dark stores/mandis). When spoilage occurs (condensation rotting, thermal abuse, rough-road bruising, carton pilferage), each party blames the other because environmental data is either uncollected or easily falsified.
2. **Invisible Intermediary Markups (Farmer Fair-Share Problem)**: Consumers pay ₹80–₹120/kg for produce, while the farmer who harvested it received only ₹15–₹20/kg. Intermediary price markups are completely opaque, preventing consumers from supporting fair trade.

### 1.2 The AgriChain Solution (5-Tier Architecture)
AgriChain bridges physical hardware IoT telemetry to an on-chain EVM blockchain via an off-chain AI Pre-Chain Trust Layer:

```
[ Physical ESP32 Hardware Node / Simulator ]
         │ (UART Serial 115200 baud / Wi-Fi HTTP POST)
         ▼
[ FastAPI Backend (Port 8000) ] ──► [ Dual Storage: Supabase Cloud PostgreSQL / SQLite ]
         │
         ▼
[ Pre-Chain AI Trust Layer (trust-layer/) ]
   - Physical Bounds, Range & Plausibility Validation
   - Haversine Velocity Checks & Rate-of-Change Boundaries
   - 11-D Time-Series Feature Engineering
   - Isolation Forest ML Anomaly Detection (F1 = 0.9722, Latency ~1.8ms)
   - Cryptographic Replay Detection & SHA-256 Fingerprint Matching
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
         └── [ ANOMALOUS / TAMPERED / BREACHED ]
                   │
                   ▼
             [ IsoLog SHA-256 Hash-Chained Quarantine Ledger ]

         │
         ▼
[ Multi-Role React 18 Frontend (Port 3000) ]
   Farmer | Logistics Partner | Dark Store GRN | Consumer Provenance | Admin | God Mode Hub
```

---

## 2. Active Engineering Mission: The Physical IoT Edge Node

### 2.1 What Suyash is Currently Working On
The software ecosystem (smart contracts, FastAPI backend, AI trust pipeline, React frontend, and unified runner scripts) is fully built and operational. **The primary active focus is perfecting the physical ESP32 IoT edge sensing node and its seamless integration with the host system.**

Specifically, the device must:
1. **Accurately Measure Environmental & Security Metrics**: Continuously sample all onboard sensors with high physical fidelity, mathematical baseline drift compensation, and robust noise filtering.
2. **Buffer Telemetry Offline in Flash Memory (LittleFS)**: While the produce crate is in transit without an active PC link or cellular connection, the ESP32 must reliably buffer serialized telemetry records into onboard LittleFS flash memory without blocking sensing loops or exhausting storage blocks.
3. **Synchronize & Transfer Records to Host on Connect**: When the ESP32 is plugged into the PC via USB (`/dev/ttyUSB0`), the host bridge (`hardware/monitor_live.py`) handshakes with the board, queries storage state, pulls all stored offline records without dropping packets, clears/resets the buffer safely, and switches into live 1 Hz streaming mode.
4. **End-to-End Pipeline Ingestion**: The synchronized records (and ongoing live stream) must immediately flow into FastAPI endpoints (`POST /telemetry` and `POST /telemetry/batch`), execute the AI Trust Layer evaluation, anchor verified condition batches on the blockchain, and update the supply chain frontend in real time.

---

## 3. Physical Hardware Specification & Sensor Pinout

### 3.1 Hardware Topology & ESP32 Pin Allocation
The physical node is built on an **ESP32 DevKit v1 (30-pin, ESP-WROOM-32)**:

| Subsystem | Sensor / Module | ESP32 Pin | Signal Type | Electrical Notes & Circuit Design |
| :--- | :--- | :--- | :--- | :--- |
| **Microclimate** | DHT11 / DHT22 | `GPIO 4` | Digital 1-Wire | Requires $4.7\text{k}\Omega$ pull-up to 3.3V rail. Measures Temp (°C) and Humidity (% RH). |
| **Gas E-Nose (Rot/VOC)** | MQ-135 | `GPIO 34` | Analog (ADC1_CH6) | **Strict ADC1 rule.** Heater powered by 5V rail. Analog out routed through a $10\text{k}\Omega$ series / $20\text{k}\Omega$ shunt voltage divider (gain = 1.5, scaling 5.0V to 3.33V). |
| **Mechanical Shock** | SW-420 | `GPIO 32` | Digital IRQ | Configured with `INPUT_PULLUP`, attached to hardware falling-edge interrupt (`onShockISR`). Edges within 200 ms of each other are coalesced into one impact event (contact chatter). Sensitivity is set by the module's trim pot. |
| **Optical Anti-Tamper**| GL5528 CdS LDR | `GPIO 35` | Analog (ADC1_CH7) | **Strict ADC1 rule.** $10\text{k}\Omega$ pull-down resistor to GND. Sealed crate ($<1\text{ lux}$) reads near 0V; opened lid ($>150\text{ lux}$) signals crate breach. Tamper latches above ADC 2500 and clears below 2200 (hysteresis). |
| **Highway Geolocation**| u-blox NEO-6M GPS | `GPIO 16` (RX2)<br>`GPIO 17` (TX2) | Hardware UART2 | 9600 baud, 8N1. Non-blocking stream ingestion via TinyGPSPlus. ESP32 RX2 connects to GPS TX; TX2 connects to GPS RX. |
| **Offline Storage** | Winbond SPI Flash | Onboard SPI | LittleFS | 1.4 MB filesystem partition: `/agrichain_log.jsonl` + `/agrichain_log.old.jsonl` (log segments), `/agrichain_boot.bin` (boot counter), `/agrichain_chain.bin` (chain head when log is empty), `/agrichain_cal.bin` (MQ-135 R0). |
| **Edge Crypto Engine** | Hardware mbedTLS | Silicon | SHA-256 Engine | Hash chain over stored records; every packet carries the full 64-hex hash plus a 16-hex `prev` hint. |
| **Status Beacon** | Onboard LED | `GPIO 2` | Digital Out | Pulses on physical impact shocks or optical tamper breach. |

> [!CAUTION]
> **Inviolable ESP32 ADC Rule**: Never use ADC2 pins (GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27) for analog sensing. ADC2 is shared with the Wi-Fi baseband and causes hardware crashes or read corruption. All analog inputs **must remain on ADC1 (GPIO 34 and GPIO 35)**.

---

## 4. Embedded Firmware Science & Algorithms (`hardware/test_pentad/src/main.cpp`)

### 4.1 Magnus-Tetens Dew Point & Condensation Margin
Condensation is the primary vector for fungal growth and post-harvest rot. Firmware computes:
$$\alpha(T, H) = \frac{17.27 \times T}{237.7 + T} + \ln\left(\frac{H}{100.0}\right)$$
$$T_{\text{dew}} = \frac{237.7 \times \alpha}{17.27 - \alpha}$$
$$\text{Condensation Margin} = T_{\text{surface}} - T_{\text{dew}}$$
- When $\text{Margin} < 2.0^\circ\text{C}$, moisture begins precipitating onto produce skins, triggering immediate condensation alerts.

### 4.2 Hygrothermally Compensated Gas Sensing (MQ-135)
Chemiresistive $\text{SnO}_2$ sensors drift significantly with ambient temperature and humidity. To prevent false spoilage alarms, firmware applies a two-variable polynomial compensation factor:
$$C_{\text{th}}(T, H) = (1.385 - 0.0152T + 0.00011T^2) \times (1.133 - 0.00205H)$$
$$V_{\text{RL}} = 1.5 \times V_{\text{pin}}, \quad R_s = R_L \times \left(\frac{5.0 - V_{\text{RL}}}{V_{\text{RL}}}\right), \quad \text{Ratio} = \frac{R_s}{R_0 \times C_{\text{th}}(T, H)}$$
$$\text{CO}_2\text{ ppm} = 400 + 110.47 \times (\text{Ratio})^{-2.862}, \quad \text{NH}_3\text{ ppm} = 102.20 \times (\text{Ratio})^{-2.473}$$
$$\text{Ethanol/Alcohol ppm} = 77.255 \times (\text{Ratio})^{-3.180}$$
- $V_{\text{pin}}$ comes from `analogReadMilliVolts()` (eFuse-calibrated), averaged over 32 samples spanning 20 ms (one 50 Hz mains period). Readings at the ~3.1 V ADC ceiling set `gas_sat`.
- MQ-135 cannot measure absolute CO₂, so CO₂ is reported as ambient 400 ppm plus the curve's excess.
- **R0 calibration**: `CMD:CAL_R0` (or `monitor_live.py --calibrate-r0`) sets $R_0 = \overline{R_s/C_{\text{th}}} / 3.6$ in clean air after warm-up and stores it in flash; `CMD:CAL_R0:<kΩ>` restores a known value; `CMD:CAL_R0:RESET` erases it. Packets carry `gas_cal`, and the host forwards `freshness_voc_ppm` (alcohol ppm) only when `gas_cal` is true. $R_L$'s exact value cancels out of the ratio once R0 is calibrated with the same formula.

### 4.3 Hardware SHA-256 Hash Chaining
Only **stored** records extend the chain, so every synced record can be re-verified on the host:
$$h_i = \text{SHA-256}\left(h_{i-1} \parallel \texttt{"|"} \parallel \text{body}_i\right)$$
where $\text{body}_i$ is the record's exact JSON text up to (not including) the trailing `,"prev":"<16 hex>","hash":"<64 hex>"}`. The genesis value is SHA-256 of the empty string. Live packets carry the hash they would have if stored. The head is recovered at boot from the last stored record (or `/agrichain_chain.bin` when the log is empty), so the chain continues across reboots and syncs.
- **Host verification** (`verify_chain` in `monitor_live.py`): dumps are saved byte-for-byte; the last verified head is kept in `hardware/transit_logs/chain_state.json`. Each sync reports verified records, the start anchor (`previous_sync` / `genesis` / `unanchored`), **gaps** (records removed on the device) and **tampered** records (hash doesn't recompute).
- **Limit**: the chain is unkeyed, so it detects corruption, edits and deletions by anyone who doesn't recompute the chain. It is not a device signature; that would need an HMAC key in eFuse/NVS.

### 4.4 LittleFS Ring Buffer & Wire Protocol
- **Storage Boundaries**: Two 175 KB segments (`/agrichain_log.jsonl` current, `/agrichain_log.old.jsonl` previous) = 350 KB ceiling, with a 200 KB free-space reserve guard. Rotation drops only the oldest segment; the filesystem is never silently formatted (a failed mount prints `STORAGE_ERROR:MOUNT_FAILED_REFORMATTING`). Record counts are recovered by scanning the log at boot (no count file); a boot counter lives in `/agrichain_boot.bin`.
- **Logging cadence**: every 10 s, plus immediately on a new shock (`shock_delta > 0`) or when the lid is first opened (rising edge of `tamper`).
- **Record fields added for sync**: `boot`, `up_ms`, `ts` (unix s, 0 = unknown), `ts_src` (`gps`/`host`/`none`), `shock_delta` (new shocks this packet), `tamper` (bool), `dht_ok`.
- **Serial Wire Protocol (115200 baud)**:
  - Live Stream: Emits `JSON:{...}\n` every 1000ms.
  - PC Commands Received:
    - `CMD:STATUS` $\rightarrow$ replies with `STATUS:{"records":N,"bytes":B,"free_kb":K,"uptime":U,"up_ms":M,"boot":N,"ts":T,"ts_src":"...","shocks":S,"pending_ack":bool,...}`
    - `CMD:TIME:<unix_seconds>` $\rightarrow$ sets the wall clock used for `ts` (GPS UTC overrides once locked); replies `TIME:OK:<t>:<src>` or `TIME:REJECTED`.
    - `CMD:SYNC` (alias `CMD:DUMP`) $\rightarrow$ **two-phase, does not clear**: `OFFLINE_DUMP_START:N`, N × `OFFLINE_JSON:{...}`, `OFFLINE_DUMP_COMPLETE:N`.
    - `CMD:ACK:<N>` $\rightarrow$ deletes exactly the records from the last dump (records logged after the dump are kept) and emits `OFFLINE_SYNC_COMPLETE:OK`, or `OFFLINE_ACK_REJECTED:<NO_PENDING_DUMP|STALE|COUNT_MISMATCH:n|BAD_FORMAT|COMPACT_FAILED>`.
    - `CMD:CLEAR` $\rightarrow$ deletes all log segments and emits `OFFLINE_BUFFER_CLEARED:OK`.
    - `CMD:PAUSE` / `CMD:RESUME` $\rightarrow$ toggles live JSON streaming without halting sensor acquisition.
    - Command lines over 128 chars are discarded whole (`CMD_REJECTED:TOO_LONG`).

---

## 5. Host Bridge & Mission Control (`hardware/monitor_live.py`)

The host Python script connects to `/dev/ttyUSB0` at 115200 baud and orchestrates:
1. **Non-Resetting Connect**: Opens the port with pyserial's default DTR+RTS (both asserted = no auto-reset) and never toggles them, so the board's uptime/clock anchor survives the plug-in. Missing device / permission (`uucp`/`dialout`) errors are explained; USB disconnects auto-reconnect every 2 s and re-run the handshake.
2. **Two-Phase LittleFS Sync** (on connect and on `[S]`): `CMD:STATUS` (clock anchor) → `CMD:TIME` → `CMD:SYNC` → records written + fsync'd to `hardware/transit_logs/transit_dump_<ts>.jsonl` (+ `.meta.json`) → `CMD:ACK:<n>` only if the received count matches. Timestamps come from the record's `ts`, else the same-boot uptime anchor, else `None`.
3. **Durable Outbox**: synced readings are queued in `hardware/transit_logs/outbox/` and POSTed to `/telemetry/batch` in chunks of 25, retried every 15 s until accepted (HTTP 4xx → `.rejected`). Live `/telemetry` forwarding pauses while the backlog uploads so the backend sees chronological order.
4. **Backend mapping**: `tamper_status` = `TAMPER_OPENED` (lid) / `SHOCK_DETECTED` (new shock) / `SEALED`; `freshness_voc_ppm` is sent only for calibrated (`gas_cal: true`), post-warm-up gas readings; coordinates are the current or last GPS fix, never invented.
5. **Rich Real-Time Dashboard**: Displays a split-column terminal layout:
   - Header with Port, Uptime, Flash Record Count, and Active Produce Batch ID.
   - Sensor Diagnostics Table (Microclimate, Gas E-Nose, SW-420 Shock, Optical Tamper, NEO-6M GPS, Flash Buffer, AI Trust Status).
   - Event Ledger with real-time anomaly tags and terminal audio bells (`\a` for shocks, `\a\a` for optical light breaches).
6. **Interactive Keyboard Controls**:
   - `[P]`: Pause/Resume live serial stream.
   - `[S]`: Manually trigger LittleFS flash synchronization.
   - `[C]`: Delete onboard flash records without downloading (press twice within 3 s to confirm).
   - `[M]`: Open current GPS coordinates in Google Maps.
   - `[B]`: Cycle active produce lot preset (`BAT-MGO-701`, `BAT-TOM-802`, `BAT-APL-903`, etc.).
   - `[Q]`: Clean shutdown releasing serial port.

---

## 6. Comprehensive Codebase Audit Directive for Claude Code

Claude Code, you are instructed to perform a rigorous, multi-tiered stability and accuracy audit across every layer of the AgriChain codebase. Use the following checklist to guide your inspections and improvements:

### Audit Tier 1: Embedded Firmware (`hardware/test_pentad/src/main.cpp`)
- [ ] **Watchdog & Timing Stability**: Verify that no blocking calls (`delay()`) stall the main execution loop. Ensure TinyGPSPlus character encoding happens on every loop iteration to prevent serial FIFO buffer overruns.
- [ ] **ADC Calibration & Noise**: Check if analog averaging (16x oversampling) is sufficient. Verify voltage conversion math for 12-bit ADC (`4095.0f`) with 11dB attenuation.
- [ ] **LittleFS Reliability & Wear Leveling**: Inspect `initStorage()`, `appendStorageRecord()`, and `dumpStorageRecords()`. Ensure that file handles are always cleanly closed, even during power loss. Check that `saveRecordCount()` does not cause excessive flash sector wear.
- [ ] **Serial Protocol Robustness**: Audit `checkIncomingSerial()` and `executeCommand()`. Ensure buffer overflow protection on command strings and clean string termination.

### Audit Tier 2: Host Serial Bridge (`hardware/monitor_live.py`)
- [ ] **Serial Port Exception Handling**: Ensure the serial connection handles abrupt physical disconnects, reconnects, and permission errors (`/dev/ttyUSB0`) gracefully without unhandled tracebacks.
- [ ] **Thread Safety**: Audit `telemetry_queue`, `cmd_queue`, and `backend_state`. Ensure that GUI updates in `with Live(...)` never block on network requests to FastAPI.
- [ ] **Batch Forwarding Parity**: Verify that records synced from flash are mapped into the exact schema expected by `POST /telemetry/batch` in `backend/routers/telemetry.py`.

### Audit Tier 3: FastAPI Backend & AI Trust Layer (`backend/`, `trust-layer/`)
- [ ] **Pre-Validation Persistence Rule**: Verify that every reading sent to `POST /telemetry` or `POST /telemetry/batch` is written to the `readings` table with status `'PENDING'` *before* AI validation executes (RULES.md §3).
- [ ] **Isolation Forest Model Health**: Verify that `trust-layer/` models load reliably, handle cold-start conditions gracefully, and accurately detect all 7 simulated fault categories (temp spike, humidity spike, GPS teleportation, timestamp drift, replay attack, gap, composite).
- [ ] **Database Concurrency**: Check that SQLite connection handling (`check_same_thread=False` and WAL mode) does not suffer from database lock contention when rapid 1 Hz batches arrive.
- [ ] **Dual-Storage Reliability**: Verify that Supabase PostgreSQL connection falls back smoothly to local SQLite if internet access drops.

### Audit Tier 4: Smart Contracts (`contracts/`)
- [ ] **Strict Integer Representation**: Confirm that prices are strictly integer paise (`uint256 pricePaise`) and temperatures are strictly integer deci-celsius (`int256 tempDeciC`). Confirm no floating-point math exists anywhere on-chain (RULES.md §2).
- [ ] **Monotonic Custody State Machine**: Verify `CustodyTransfer.sol` enforces forward-only progression (`REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`) and blocks backward transitions.
- [ ] **Pausable Circuit Breakers**: Ensure emergency pause mechanisms lock mutations while preserving read-only queries during security audits.
- [ ] **Gas Efficiency**: Verify that `ColdChainMonitor.recordConditionsBatch` executes within expected gas limits (benchmark target: >50% savings over individual writes).

### Audit Tier 5: Multi-Role React Frontend (`frontend/`)
- [ ] **Style Lock & Zero Library Additions**: Do not add Redux, Zustand, React Router, or modify Tailwind palettes (RULES.md §1 & §6).
- [ ] **Live UI Feedback for Physical Breaches**: Ensure that when the ESP32 reports a shock (`shocks > 0`) or an optical tamper (`tamper_status == 'TAMPERED'`), the Logistics transit dashboard, Dark Store GRN gate, and Consumer provenance views display immediate visual warning badges.

---

## 7. Strict Inviolable System Rules (Non-Negotiable)

1. **Money is Always Integer Paise**:
   $$1\text{ INR} = 100\text{ paise}$$
   All financial fields (`price_paise`, `stage_price_paise`) in Solidity, Python, and SQL must be integers. Rupee conversion happens strictly at final string formatting in React: `(price_paise / 100).toFixed(2)`.
2. **Temperature is Always Integer Deci-Celsius On-Chain**:
   $$24.5^\circ\text{C} \longrightarrow 245\text{ deci-}^\circ\text{C}, \quad -2.0^\circ\text{C} \longrightarrow -20\text{ deci-}^\circ\text{C}$$
3. **Persistence Before Validation**:
   Every incoming telemetry packet must be written to the database before the AI evaluation executes. Dropping raw packets violates the audit trail.
4. **Monotonic Custody Transitions**:
   $$\text{REGISTERED} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{IN\_STORAGE} \longrightarrow \text{AT\_RETAIL} \longrightarrow \text{SOLD}$$
   Transitions can only advance forward. No backward transitions are permitted.
5. **Frontend Wire-Only Rule**:
   `frontend/` is a finished design. Never replace Tailwind utility classes or recreate views. Replace mock imports only with `fetch()` returning identical JSON shapes.
6. **Commit Format**:
   Always format git commits as `[scope] description` (e.g., `[hardware] optimize littlefs flash sync`, `[backend] fix telemetry batch ingestion`). Never commit `.env`, `node_modules/`, `.venv/`, or `*.db`.

---

## 8. Development Commands & Operational Guide

### 8.1 Unified Full-Stack Launchers (Post-Installation)
```bash
# Linux / macOS (all-in-one orchestrator)
./run.sh [--no-browser] [--simulator] [--no-seed] [--kill-ports]

# Windows (Command Prompt)
run.bat

# Windows (PowerShell)
.\run.ps1

# Direct Python Launcher
python run.py
```

### 8.2 Physical Hardware Tooling (PlatformIO & Monitor)
```bash
# 1. Build ESP32 firmware
pio run -d hardware/test_pentad

# 2. Flash firmware to ESP32 DevKit
pio run -d hardware/test_pentad -t upload --upload-port /dev/ttyUSB0

# 3. Launch Mission Control Dashboard with LittleFS Sync
./run_monitor.sh [--skip-sync] [--clear] [--batch BAT-MGO-701]
# Or directly via Python:
.venv/bin/python hardware/monitor_live.py --batch BAT-MGO-701
```

### 8.3 Subsystem Test Suites
```bash
# 1. Smart Contract Test Suite (22 passing)
cd contracts && npx hardhat test

# 2. AI Trust Layer Test Suite (147 passing)
.venv/bin/pytest trust-layer/tests/

# 3. Full 10-Phase Capstone System Verification
.venv/bin/python backend/scripts/verify_final_system.py
```

---

## 9. Key File Navigation Index

- **Firmware Source**: [`hardware/test_pentad/src/main.cpp`](file:///home/suyash/Projects/agri-chain/hardware/test_pentad/src/main.cpp)
- **Firmware Config**: [`hardware/test_pentad/platformio.ini`](file:///home/suyash/Projects/agri-chain/hardware/test_pentad/platformio.ini)
- **Host Serial Bridge**: [`hardware/monitor_live.py`](file:///home/suyash/Projects/agri-chain/hardware/monitor_live.py)
- **Hardware Spec**: [`docs/IOT_HARDWARE_SPECIFICATION.md`](file:///home/suyash/Projects/agri-chain/docs/IOT_HARDWARE_SPECIFICATION.md)
- **Breadboard Guide**: [`docs/BREADBOARD_ASSEMBLY_GUIDE.md`](file:///home/suyash/Projects/agri-chain/docs/BREADBOARD_ASSEMBLY_GUIDE.md)
- **Telemetry Ingestion Router**: [`backend/routers/telemetry.py`](file:///home/suyash/Projects/agri-chain/backend/routers/telemetry.py)
- **Central API Routes**: [`backend/main.py`](file:///home/suyash/Projects/agri-chain/backend/main.py)
- **Database Driver**: [`backend/db.py`](file:///home/suyash/Projects/agri-chain/backend/db.py)
- **Web3 Blockchain Relayer**: [`backend/chain.py`](file:///home/suyash/Projects/agri-chain/backend/chain.py)
- **AI Anomaly Detector**: [`trust-layer/app/services/anomaly_detector.py`](file:///home/suyash/Projects/agri-chain/trust-layer/app/services/anomaly_detector.py)
- **Solidity Contracts**: [`contracts/contracts/`](file:///home/suyash/Projects/agri-chain/contracts/contracts/)
- **Frontend App Entry**: [`frontend/src/App.jsx`](file:///home/suyash/Projects/agri-chain/frontend/src/App.jsx)
- **Project Memory & Log**: [`MEMORY.md`](file:///home/suyash/Projects/agri-chain/MEMORY.md)
- **Product Requirements**: [`PRD.md`](file:///home/suyash/Projects/agri-chain/PRD.md)
- **Technical Architecture**: [`ARCHITECTURE.md`](file:///home/suyash/Projects/agri-chain/ARCHITECTURE.md)
- **Hard Constraints**: [`RULES.md`](file:///home/suyash/Projects/agri-chain/RULES.md)
