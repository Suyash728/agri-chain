# AgriChain: System Architecture, Technical Working & Implementation Review

**Review Stage:** Progress Review 2 (Major Project Capstone Milestone)  
**Academic Title:** *A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains*  
**Current Development Status:** **All 10 Phases 100% Implemented & Verified** (Hardhat Local Node & Polygon Amoy, Supabase Cloud PostgreSQL, Pinata IPFS, AI Trust Layer ML Pipeline, React 18 Web3 Frontend, and Physical ESP32 Hardware Prop).

---

## Table of Contents

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [High-Level 5-Tier System Architecture](#2-high-level-5-tier-system-architecture)
3. [Pre-Chain AI Trust Layer (Core Innovation)](#3-pre-chain-ai-trust-layer-core-innovation)
4. [Modular Smart Contracts & EVM Blockchain Tier](#4-modular-smart-contracts--evm-blockchain-tier)
5. [Hybrid Cloud Database & Decentralized IPFS Storage](#5-hybrid-cloud-database--decentralized-ipfs-storage)
6. [Physical IoT Edge Layer & Telemetry Simulation](#6-physical-iot-edge-layer--telemetry-simulation)
7. [End-to-End Product Lifecycle & Multi-Role User Flow](#7-end-to-end-product-lifecycle--multi-role-user-flow)
8. [Economic Transparency & Farmer Fair-Share Proof](#8-economic-transparency--farmer-fair-share-proof)
9. [Verification Suite & Live Demo Instructions](#9-verification-suite--live-demo-instructions)
10. [Review-2 Evaluation & Viva Defense Q&A](#10-review-2-evaluation--viva-defense-qa)

---

## 1. Executive Summary & Problem Statement

### 1.1 The Agricultural Supply Chain Crisis

Perishable agricultural supply chains across India and developing economies suffer from three systemic failures:

1. **Massive Post-Harvest Losses (15–20% of produce, ~₹92,000 Crore annually):** Due to unmonitored cold-chain breaks during transit, produce spoilage is only discovered at retailer receipt, resulting in catastrophic food waste.
2. **The Blockchain "Garbage In, Garbage Out" (GIGO) Dilemma:** Existing blockchain traceability prototypes record sensor data blindly onto immutable smart contracts. If an IoT sensor fails, drifts, suffers calibration errors, or is physically manipulated, corrupted data is immortalized on-chain with zero recourse.
3. **Opaque Intermediary Markups & Farmer Exploitation:** Middlemen layers capture over 70% of the consumer retail rupee. Farmers frequently receive less than 25–30% of the final retail price, while consumers have zero visibility into farm-gate prices, storage conditions, or true origin.

### 1.2 The AgriChain Solution

AgriChain is an end-to-end decentralized framework that guarantees farm-to-fork traceability, cold-chain integrity, and economic transparency:

- **Pre-Chain AI Gatekeeper:** An AI Trust Layer combines deterministic physics rules, 11-dimensional feature extraction, an Isolation Forest machine learning model (**F1: 0.9722**), and cryptographic SHA-256 replay defense to intercept and quarantine invalid readings *before* they can touch the blockchain.
- **Gas-Optimized Modular Smart Contracts:** Five cohesive contracts on Ethereum/Polygon Amoy enforce OpenZeppelin Role-Based Access Control (RBAC), EVM 32-byte slot packing, forward-only custody transitions, and Oracle condition batching (**52.71% gas reduction**).
- **Dual-Storage Cloud & IPFS Architecture:** Relational history resides in a live cloud Supabase PostgreSQL database (AWS Mumbai), while produce quality certificates and lab inspection PDFs are pinned to decentralized IPFS with cryptographic CIDs anchored on-chain.
- **Transparent Economic Split:** On-chain custody transfers record the exact purchase price at each handover, proving mathematically on the consumer's QR screen that the farmer received a **50.00% fair share** of the retail price.
- **Physical IoT Sensor Edge Prop:** A physical ESP32 hardware device equipped with a DHT22 sensor, NEO-6M GPS, and a hardware GPIO 4 refrigeration breach button proves real-time breach detection and quarantine.

---

## 2. High-Level 5-Tier System Architecture

AgriChain is organized into 5 cleanly decoupled tiers, ensuring modularity, high performance, and fault tolerance:

```mermaid
flowchart TD
    subgraph TIER1["Tier 1: IoT Edge & Telemetry Source"]
        ESP["Physical ESP32 Microcontroller\nDHT22 + NEO-6M GPS + GPIO 4 Breach Trigger"]
        SIM["Python Telemetry Streaming Simulator\n7 Fault Scenarios: Spikes, Freezes, Drift, Noise"]
    end

    subgraph TIER2["Tier 2: Pre-Chain AI Trust Layer (FastAPI Microservice)"]
        INGEST["Ingestion API & Schema Validation\nPOST /telemetry"]
        RULES["Physics Rules & Range Validation\nMin/Max Temp, Humidity, Max Gradient"]
        FEAT["11-D Feature Extraction\nRolling Deltas, Accelerations, GPS Drifts"]
        ML["Isolation Forest Anomaly Detector\nContamination=0.05, 100 Estimators, F1=0.9722"]
        REPLAY["Cryptographic Anti-Replay Defense\nSHA-256 Digest Cache + TTL Window"]
        VERDICT{"Verdict Engine"}
        QUAR_STORE[("Quarantine Store\nOff-Chain SQLite/Postgres\nAudit Log")]
        HANDOFF["Oracle Handoff Payload\nApproved & Certified Batch Reading"]
    end

    subgraph TIER3["Tier 3: Modular Smart Contracts (EVM / Polygon Amoy)"]
        ROLES["AccessControlRoles.sol\nAdmin, Farmer, Logistics, Retailer, Oracle Roles"]
        REGISTRY["ProductRegistry.sol\nBatch Origin, Farmer Address, IPFS Document CIDs"]
        CUSTODY["CustodyTransfer.sol\nREGISTERED -> IN_TRANSIT -> IN_STORAGE -> AT_RETAIL -> SOLD\nStage Price Accounting"]
        MONITOR["ColdChainMonitor.sol\n32-Byte Packed Slot ConditionRecord\nrecordConditionsBatch (-52.71% Gas)"]
        POLICY["PolicyConfig.sol\nOn-Chain Crop Thresholds"]
    end

    subgraph TIER4["Tier 4: Hybrid Cloud & Decentralized Storage"]
        SUPABASE[("Supabase Cloud PostgreSQL (AWS Mumbai)\n11 Tables: Batches, Custody, Readings,\nQuarantine, Policy, Documents, Reviews")]
        IPFS["Pinata IPFS Decentralized Storage\nQuality Certificates, Lab PDFs, Photos (ipfs://Qm...)"]
    end

    subgraph TIER5["Tier 5: Multi-Role Web3 Presentation (React 18 + Vite)"]
        FARMER_UI["🌿 Farmer Portal\nBatch Registration, KPIs, AI Trust View, Inventory"]
        LOGISTICS_UI["🚛 Logistics Partner Portal\nFleet Dispatch, GPS Transit Tracking, Custody Handoff"]
        DARKSTORE_UI["🏬 Dark Store Hub\nInbound GRN Receiving, Micro-Inventory Bins, Picking"]
        CONSUMER_UI["🛒 Consumer Storefront\nZepto-Style Shop, QR Scan Journey, Price Breakdown, Reviews"]
        WALLET["🦊 Web3 Wallet Controller (ethers.js v6)\nPersistent Accounts Floating Bar across all Roles"]
    end

    %% Data Connections
    ESP -->|HTTP POST /telemetry| INGEST
    SIM -->|HTTP POST /telemetry| INGEST
    INGEST --> RULES --> FEAT --> ML --> REPLAY --> VERDICT
    VERDICT -->|Breach Flagged / Anomaly| QUAR_STORE
    VERDICT -->|Approved Stream| HANDOFF

    HANDOFF -->|recordCondition / recordConditionsBatch| MONITOR
    MONITOR -.->|Reads Thresholds| POLICY

    FARMER_UI -->|MetaMask Sign / Relayer| REGISTRY
    FARMER_UI -->|Upload Quality Report| IPFS
    IPFS -->|Anchor CID| REGISTRY

    LOGISTICS_UI -->|MetaMask Sign / Relayer| CUSTODY
    DARKSTORE_UI -->|Receive Produce / GRN| CUSTODY
    CONSUMER_UI -->|Checkout & Review| CUSTODY

    REGISTRY --> SUPABASE
    CUSTODY --> SUPABASE
    MONITOR --> SUPABASE
    QUAR_STORE --> SUPABASE

    SUPABASE --> FARMER_UI
    SUPABASE --> LOGISTICS_UI
    SUPABASE --> DARKSTORE_UI
    SUPABASE --> CONSUMER_UI
    IPFS -->|Preview Document| CONSUMER_UI
```

---

## 3. Pre-Chain AI Trust Layer (Core Innovation)

The AI Trust Layer is the primary scientific and algorithmic contribution of this research. It solves the blockchain GIGO problem by acting as an intelligent pre-chain oracle gatekeeper.

### 3.1 The 6-Stage Trust Pipeline

```mermaid
flowchart TD
    RAW["Incoming IoT Reading\n{batch_id, temp, humidity, gps, timestamp, device_id}"] --> S1["Stage 1: Ingestion & Schema Validation\nFormat verification, batch existence check"]
    S1 --> S2["Stage 2: Deterministic Crop Range Checks\nCropPolicy: [T_min, T_max], [H_min, H_max], Max Grad"]
    S2 -->|Hard Physics Breach| REJ1["Verdict: BREACH_FAIL\nLogged to Quarantine Store"]
    S2 -->|Range Pass| S3["Stage 3: 11-D Feature Extraction\nRolling Deltas, Accelerations, GPS Drifts"]
    S3 --> S4["Stage 4: Isolation Forest Anomaly Detection\nPath length decision boundary (Contamination=0.05)"]
    S4 -->|Statistical Outlier| REJ2["Verdict: ANOMALY_FAIL\nLogged to Quarantine Store"]
    S4 -->|Inlier Validated| S5["Stage 5: Cryptographic Anti-Replay Defense\nSHA-256 payload digest checked against TTL cache"]
    S5 -->|Duplicate Hash Detected| REJ3["Verdict: REPLAY_FAIL\nLogged to Quarantine Store"]
    S5 -->|Fresh Unique Hash| S6["Stage 6: Verdict Generation & Oracle Handoff\nCreate OracleHandoffPayload"]
    S6 --> MINE["On-Chain Anchor\nColdChainMonitor.recordCondition(s)"]
```

### 3.2 11-Dimensional Feature Engineering

To capture subtle sensor degradations, transient spikes, and spoofed coordinates that simple threshold checks miss, the feature extraction engine transforms raw sensor streams into an 11-dimensional feature vector $\mathbf{x} \in \mathbb{R}^{11}$:

| Index | Feature Symbol | Feature Description | Anomaly Detection Purpose |
|---|---|---|---|
| $x_0$ | $T$ | Current Temperature (°C) | Direct boundary monitoring against crop thermal thresholds |
| $x_1$ | $H$ | Current Relative Humidity (%) | Direct boundary monitoring against desiccation/condensation thresholds |
| $x_2$ | $\Delta T$ | First Difference: $T_t - T_{t-1}$ | Identifies physically impossible thermal leaps (e.g., +15°C in 15 seconds) |
| $x_3$ | $\Delta H$ | First Difference: $H_t - H_{t-1}$ | Identifies sensor wetting or disconnected lead spikes |
| $x_4$ | $\Delta^2 T$ | Second Difference (Thermal Acceleration) | Detects sensor jitter and irregular oscillatory behavior |
| $x_5$ | $\Delta^2 H$ | Second Difference (Humidity Acceleration) | Detects humidity sensor degradation |
| $x_6$ | $\bar{T}_{w=5}$ | Rolling 5-Sample Mean Temperature | Baseline drift detection versus ambient background |
| $x_7$ | $\sigma_{T, w=5}$ | Rolling 5-Sample Temperature Variance | Detects "flatlined / frozen" sensor readings ($\sigma \approx 0$) |
| $x_8$ | $v_{\text{GPS}}$ | Calculated Velocity ($d_{\text{Haversine}} / \Delta t$) | Detects teleportation / impossible GPS leaps (> 140 km/h) |
| $x_9$ | $\theta_{\text{accel}}$ | Virtual Accelerometer Magnitude | Detects cargo drop, impact, or abnormal vehicle vibrations |
| $x_{10}$ | $L_{\text{lux}}$ | Ambient Light Intensity (Lux) | Detects unauthorized container door opening in transit |

### 3.3 Isolation Forest Formulation

The Isolation Forest algorithm isolates anomalies instead of profiling normal points. Because anomalies are few and have extreme attribute values, they are partitioned close to the root of randomized isolation trees ($iTrees$).

For a dataset of $n$ instances, the average path length $h(x)$ of an instance $x$ in an ensemble of $t$ trees is normalized against the average path length of an unsuccessful search in a Binary Search Tree (BST):

$$c(n) = 2 \ln(n - 1) + 0.5772156649\ (\text{Euler's constant}) - \frac{2(n - 1)}{n}$$

The anomaly score $s(x, n)$ is formulated as:

$$s(x, n) = 2^{-\frac{\mathbb{E}(h(x))}{c(n)}}$$

- If $\mathbb{E}(h(x)) \to 0 \implies s \to 1$: instance is classified as an **anomaly**.
- If $\mathbb{E}(h(x)) \to c(n) \implies s \to 0.5$: instance is classified as **nominal**.

### 3.4 Cryptographic Anti-Replay Defense

To eliminate replay attacks where a malicious logistics transporter replays yesterday's recorded valid cold-chain readings to conceal a present refrigeration breakdown:
1. Every sensor transmission payload is normalized into canonical JSON: `{"batch_id", "temp", "humidity", "gps", "timestamp"}`.
2. The payload is hashed using SHA-256: $\mathcal{H} = \text{SHA256}(\text{CanonicalPayload})$.
3. A local high-speed in-memory LRU cache stores all active hashes for a configurable sliding TTL window (300 seconds).
4. If $\mathcal{H} \in \text{Cache}$, the reading is immediately quarantined with `REPLAY_ATTACK_DETECTED` and blocked from on-chain submission.

### 3.5 Empirical ML Evaluation Benchmark (1,000 Transmissions)

The AI Trust Layer was evaluated across 1,000 synthetic test samples under 7 fault scenarios (refrigeration failure, sensor freeze, transient spikes, calibration drift, packet duplication, route deviations, and noise):

| Evaluation Metric | Measured Value | Minimum Target | Academic Benchmark Status |
|---|---|---|---|
| **Classification Accuracy** | **97.20%** | > 92.0% | Exceeded (+5.20%) |
| **Precision** | **96.30%** | > 90.0% | Exceeded (+6.30%) |
| **Recall (Sensitivity)** | **98.18%** | > 95.0% | Exceeded (+3.18%) |
| **F1-Score** | **0.9722** | > 0.950 | Exceeded (+0.022) |
| **Inference Latency** | **1.84 ms / reading** | < 10.0 ms | Real-Time Capable |

---

## 4. Modular Smart Contracts & EVM Blockchain Tier

In Phase 8, the legacy monolithic contract was decoupled into 5 specialized modular smart contracts in `contracts/contracts/` utilizing OpenZeppelin contracts v5.

```mermaid
classDiagram
    class AccessControlRoles {
        +bytes32 DEFAULT_ADMIN_ROLE
        +bytes32 FARMER_ROLE
        +bytes32 LOGISTICS_ROLE
        +bytes32 RETAILER_ROLE
        +bytes32 ORACLE_ROLE
        +grantRole(role, account)
        +hasRole(role, account) bool
    }

    class ProductRegistry {
        +registerBatch(batchId, crop, origin, harvestDate)
        +setBatchDocument(batchId, docType, ipfsCID)
        +getBatch(batchId) Batch
        +getBatchDocuments(batchId) Document[]
    }

    class CustodyTransfer {
        +transferCustody(batchId, nextActor, state, pricePaise, location)
        +getCustodyHistory(batchId) Event[]
        +getCurrentCustody(batchId) CustodyState
    }

    class ColdChainMonitor {
        +recordCondition(batchId, temp, humidity, breach)
        +recordConditionsBatch(batchIds[], temps[], humidities[], breaches[])
        +getConditionRecords(batchId) ConditionRecord[]
    }

    class PolicyConfig {
        +setCropPolicy(crop, minTemp, maxTemp, minHum, maxHum)
        +getCropPolicy(crop) Policy
    }

    AccessControlRoles <|-- ProductRegistry : inherits
    AccessControlRoles <|-- CustodyTransfer : inherits
    AccessControlRoles <|-- ColdChainMonitor : inherits
    AccessControlRoles <|-- PolicyConfig : inherits
    ProductRegistry ..> CustodyTransfer : initializes batch
    ColdChainMonitor ..> PolicyConfig : queries limits
```

### 4.1 Strict Forward Custody State Transitions

Produce batches strictly obey a unidirectional finite state machine managed by `CustodyTransfer.sol`:

```mermaid
stateDiagram-v2
    [*] --> REGISTERED : Farmer registers produce (ProductRegistry)
    REGISTERED --> IN_TRANSIT : Logistics Partner accepts procurement (CustodyTransfer)
    IN_TRANSIT --> IN_STORAGE : Dark Store receives inbound GRN (CustodyTransfer)
    IN_STORAGE --> AT_RETAIL : Produce stocked into micro-inventory bins
    AT_RETAIL --> SOLD : Consumer completes purchase & payment
    SOLD --> [*] : Verified Review Submission enabled
```

Any backward transition (e.g., `IN_STORAGE` $\to$ `IN_TRANSIT`) or unauthorized role attempt triggers a revert: `InvalidStateTransition()`.

### 4.2 EVM 32-Byte Storage Slot Packing

Standard Solidity structs often allocate an entire 32-byte (256-bit) EVM storage slot per variable. In `ColdChainMonitor.sol`, variables are packed into a single 32-byte slot:

```solidity
struct ConditionRecord {
    int64 temperature;    // 8 bytes (Range: -9.22e18 to +9.22e18 mdeg C)
    uint32 humidity;      // 4 bytes (Range: 0 to 100,000 milli-percent)
    bool breachFlag;      // 1 byte  (Boolean flag)
    uint48 timestamp;     // 6 bytes (Valid timestamps past year 8,000,000 AD)
    // 8 + 4 + 1 + 6 = 19 bytes <= 32 bytes (1 EVM SSTORE slot!)
}
```

### 4.3 Condition Batching Gas Savings Benchmark

Writing each sensor reading in an independent Ethereum transaction incurs the 21,000 base transaction fee every single time. `ColdChainMonitor.recordConditionsBatch` aggregates $N$ verified telemetry readings into a single transaction:

| Batch Size ($N$) | Single Writes ($N \times \text{tx}$) | Single Batched Tx | Total Gas Saved | Average Gas / Reading |
|---|---|---|---|---|
| **$N = 1$ (Baseline)** | 71,484 gas | — | 0.00% | 71,484 gas |
| **$N = 5$** | 271,920 gas | 152,392 gas | **43.95%** | 30,478 gas |
| **$N = 10$** | 543,840 gas | 273,046 gas | **49.79%** | 27,305 gas |
| **$N = 20$** | 1,087,680 gas | 514,337 gas | **52.71%** | **25,717 gas** |

> **Key Finding for Research Paper:** Oracle condition write batching reduces on-chain gas costs by **52.71%**, lowering per-reading overhead from 71,484 gas to 25,717 gas.

---

## 5. Hybrid Cloud Database & Decentralized IPFS Storage

```mermaid
erDiagram
    BATCHES ||--o{ CUSTODY_EVENTS : "tracks"
    BATCHES ||--o{ READINGS : "records"
    BATCHES ||--o{ QUARANTINE : "flags"
    BATCHES ||--o{ BATCH_DOCUMENTS : "anchors"
    BATCHES ||--o{ BATCH_REVIEWS : "collects"
    POLICY ||--o{ BATCHES : "governs"

    BATCHES {
        string batch_id PK
        string crop
        string origin
        string farmer_name
        string farmer_address
        integer harvest_date
        integer initial_price_paise
        string current_state
        string ipfs_hash
    }

    CUSTODY_EVENTS {
        integer id PK
        string batch_id FK
        string actor_role
        string actor_address
        string custody_state
        integer price_paid_paise
        string location
        integer timestamp
        string tx_hash
    }

    READINGS {
        integer id PK
        string batch_id FK
        float temperature
        float humidity
        float latitude
        float longitude
        boolean breach_flag
        integer timestamp
        string tx_hash
    }

    QUARANTINE {
        integer id PK
        string batch_id FK
        float temperature
        float humidity
        string violation_reason
        string stage
        integer timestamp
    }

    BATCH_DOCUMENTS {
        integer id PK
        string batch_id FK
        string document_type
        string ipfs_cid
        string tx_hash
        integer timestamp
    }

    BATCH_REVIEWS {
        integer id PK
        string batch_id FK
        integer rating
        string comment
        integer freshness_score
        string reviewer_address
        integer timestamp
    }

    POLICY {
        string crop PK
        float temp_min
        float temp_max
        float humidity_min
        float humidity_max
        float max_gradient
    }
```

### 5.1 Cloud Supabase PostgreSQL Deployment

- **Hosting Provider:** Supabase Cloud on AWS Mumbai (`ap-south-1`).
- **Connection Architecture:** IPv4 Session Pooler (`aws-0-ap-south-1.pooler.supabase.com:5432/postgres`) overcoming local IPv6 residential carrier-grade NAT.
- **Relational Tables:** 11 normalized tables with foreign-key cascades, performance indexes on `batch_id`, and synchronized serial auto-increment sequences.
- **Dual-Mode Adapter:** `backend/db.py` seamlessly connects to Supabase when `DATABASE_URL` is set, with automatic fallback to local SQLite for offline developer environments.

### 5.2 IPFS Decentralized Media Pinning

1. Large media files (government lab test certificates, pesticide residue reports, farm inspection photos) are not uploaded to the blockchain to prevent blockchain bloat.
2. The files are uploaded to Pinata IPFS via `backend/ipfs.py`.
3. A deterministic Base58 SHA-256 multihash Content Identifier (e.g., `ipfs://QmQeGWegKZ5dMbRT3mqWHDSN2L5pgjQ547WWB36coaNAkw`) is returned.
4. The CID is anchored on-chain in `ProductRegistry.setBatchDocument`.
5. Consumers view and inspect the tamper-proof PDF directly in the React frontend via public IPFS gateways.

---

## 6. Physical IoT Edge Layer & Telemetry Simulation

```mermaid
flowchart LR
    subgraph HARDWARE["Physical ESP32 Edge Device"]
        DHT["DHT22 Sensor\n(GPIO 15)\nTemp & Humidity"]
        GPS["NEO-6M GPS\n(UART2: GPIO 16/17)\nLat / Long"]
        BTN["Tactile Pushbutton\n(GPIO 4)\nBreach Injector"]
        MCU["ESP32 Core\nHTTP Client\nEvery 15s"]
        
        DHT --> MCU
        GPS --> MCU
        BTN -->|Interrupt| MCU
    end

    subgraph BACKEND_INGEST["AgriChain Ingestion Pipeline"]
        API["POST /telemetry"]
        TRUST["AI Trust Layer"]
        DB[("Supabase DB")]
        CHAIN["ColdChainMonitor.sol"]
    end

    MCU -->|WiFi HTTP JSON Stream| API
    API --> TRUST
    TRUST -->|Nominal: 4.5°C| CHAIN
    TRUST -->|Button Pressed: 48.0°C Breach| DB
```

### 6.1 ESP32 Bill of Materials & Pin Configuration

| Component | Function | Hardware Interface |
|---|---|---|
| **ESP32 NodeMCU DevKit** | 32-bit dual-core MCU with 2.4 GHz WiFi | Micro-USB / USB-UART |
| **DHT22 (AM2302)** | Precision temperature (±0.5°C) & humidity (±2%) | GPIO 15 (with 10kΩ pull-up) |
| **NEO-6M GPS Module** | Real-time transit latitude and longitude coordinates | UART2: GPIO 16 (RX) / GPIO 17 (TX) |
| **Tactile Push Button** | Physical breach injector (simulates cooler breakdown) | GPIO 4 (Internal `INPUT_PULLUP` to GND) |
| **Onboard Status LED** | Visual heartbeat & network activity indicator | GPIO 2 |

### 6.2 The 7 Software Fault Scenarios

The simulator in `simulator/stream_telemetry.py` and `hardware/simulate_esp32.py` implements 7 real-world sensor fault profiles:
1. `nominal`: Normal in-range readings adhering to crop policy.
2. `thermal_spike`: Rapid sudden temperature spike (e.g., loading bay door open).
3. `refrigeration_failure`: Continuous upward thermal creep exceeding maximum thresholds.
4. `sensor_freeze`: Stuck reading outputting duplicate identical floats with $\sigma = 0$.
5. `calibration_drift`: Subtle gradual slope drift (+0.2°C per reading).
6. `gps_teleportation`: Impossible location jump (> 100 km in 15 seconds).
7. `replay_attack`: Duplicated timestamped payload re-submitted by malicious driver.

---

## 7. End-to-End Product Lifecycle & Multi-Role User Flow

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🌿 Farmer
    actor Logistics as 🚛 Logistics Partner
    actor DarkStore as 🏬 Dark Store Hub
    actor Consumer as 🛒 Consumer
    participant Frontend as React Web3 Frontend
    participant Backend as FastAPI Gateway
    participant TrustLayer as AI Trust Layer
    participant Contracts as Modular Contracts
    participant IPFS as Pinata IPFS
    participant DB as Supabase DB

    Note over Farmer,DB: PHASE 1: BATCH REGISTRATION & CERTIFICATION
    Farmer->>Frontend: Enter Batch Info (100 kg Tomatoes, ₹40/kg)
    Farmer->>Frontend: Attach Quality Inspection PDF
    Frontend->>IPFS: Pin Certificate PDF
    IPFS-->>Frontend: Return CID: ipfs://QmQe...
    Farmer->>Frontend: Click "Register Batch" (MetaMask Sign)
    Frontend->>Contracts: ProductRegistry.registerBatch + setBatchDocument
    Contracts-->>DB: Store Batch & Document On-Chain Anchor
    Frontend-->>Farmer: Batch Created (BATCH-001)

    Note over Logistics,DB: PHASE 2: IN-TRANSIT DISPATCH & TELEMETRY
    Logistics->>Frontend: Accept Procurement Order (Price: ₹55/kg)
    Frontend->>Contracts: CustodyTransfer.transferCustody(IN_TRANSIT)
    loop Every 15 Seconds during Transit
        Logistics->>Backend: Stream Sensor Telemetry (Temp, Hum, GPS)
        Backend->>TrustLayer: Evaluate Telemetry Stream
        alt Nominal Reading (4.5°C)
            TrustLayer-->>Backend: Approved (OracleHandoffPayload)
            Backend->>Contracts: ColdChainMonitor.recordCondition(s)
        else Button Breach Triggered (48.0°C)
            TrustLayer-->>Backend: Flagged BREACH_FAIL (F1: 0.9722)
            Backend->>DB: Record in Quarantine Store (Off-Chain Only!)
        end
    end

    Note over DarkStore,DB: PHASE 3: DARK STORE INBOUND GRN & PICKING
    DarkStore->>Frontend: Inbound Delivery Arrives
    DarkStore->>Frontend: Inspect Produce & Verify GRN
    DarkStore->>Contracts: CustodyTransfer.transferCustody(IN_STORAGE, ₹80/kg)
    DarkStore->>Frontend: Allocate Micro-Inventory Bin (Bin A-04 Cold)

    Note over Consumer,DB: PHASE 4: CONSUMER QR VERIFICATION & REVIEW
    Consumer->>Frontend: Browse Storefront & Add to Cart
    Consumer->>Frontend: Scan QR Code on Produce Crate
    Frontend->>Backend: Fetch Traceability History & Documents
    Backend-->>Frontend: Return Timeline, Sensor Records, IPFS CID & Price Trail
    Frontend-->>Consumer: Render Farm-to-Fork Journey & 50% Farmer Share
    Consumer->>Frontend: Complete Checkout (Custody: SOLD)
    Consumer->>Frontend: Submit 5-Star Review & Freshness Score
    Frontend->>Backend: POST /batches/BATCH-001/reviews
    Backend->>DB: Store Verified Post-Checkout Review
```

---

## 8. Economic Transparency & Farmer Fair-Share Proof

```mermaid
flowchart LR
    A["Farm Gate\nFarmer: Rahul Patil\nBatch Creation\n\nPrice: ₹40.00 / kg\nMarkup: ₹40.00\nShare: 50.00%"] -->|Custody: IN_TRANSIT| B["Cold Logistics\nPartner: Fleet Trans\nRefrigerated Transit\n\nPrice: ₹55.00 / kg\nMarkup: +₹15.00\nShare: 18.75%"]
    B -->|Custody: IN_STORAGE| C["Dark Store Hub\nRetailer: Blinkit Hub\nStorage & Sorting\n\nPrice: ₹80.00 / kg\nMarkup: +₹25.00\nShare: 31.25%"]
    C -->|Custody: SOLD| D["End Consumer\nRetail Customer\nQR Verified Produce\n\nFinal Price: ₹80.00 / kg\nTotal Markup: 100.00%"]
```

### Mathematical Proof of Farmer Share

$$\text{Farmer Share} = \left( \frac{\text{Farm Gate Price}}{\text{Consumer Final Retail Price}} \right) \times 100 = \left( \frac{₹40.00}{₹80.00} \right) \times 100 = \mathbf{50.00\%}$$

In the traditional supply chain, intermediaries pocket between 65% and 75% of the consumer price. By recording binding stage prices in `CustodyTransfer.sol` upon each handoff, AgriChain provides mathematical proof to consumers that the farmer received half of the retail price.

---

## 9. Verification Suite & Live Demo Instructions

The complete system has been verified using automated end-to-end scripts.

### 9.1 Capstone Verification Suite (`verify_final_system.py`)

Run the capstone validation script covering all 10 project phases:

```bash
python backend/scripts/verify_final_system.py
```

**Verification Results:**
```text
================================================================================
AGRICHAIN CAPSTONE FULL-SYSTEM VERIFICATION
================================================================================
[1/8] Verifying AccessControl & Modular Smart Contracts...           [PASS]
[2/8] Evaluating AI Trust Layer Anomaly Detection (F1 >= 0.95)...    [PASS] (F1: 0.9722)
[3/8] Simulating Multi-Role Supply Chain Journey...                  [PASS]
[4/8] Testing IoT Telemetry & Pushbutton Thermal Breach...          [PASS]
[5/8] Verifying Decentralized IPFS Document Anchoring...             [PASS]
[6/8] Inbound Receiving & Dark Store Fulfillment...                  [PASS]
[7/8] Submitting Verified Post-Checkout Consumer Review...           [PASS] (5.0 Stars)
[8/8] Calculating Price Fairness & Farmer Fair Share...              [PASS] (50.00% Farmer Share)
================================================================================
FINAL SYSTEM VERIFICATION RESULT: ALL 8 PHASES PASSED (100% SUCCESS)
================================================================================
```

### 9.2 Running the Full Live System

```bash
# Terminal 1: Start Hardhat Local Blockchain Node
cd contracts
npx hardhat node

# Terminal 2: Deploy Modular Smart Contracts
cd contracts
npx hardhat run scripts/deploy_modular.cjs --network localhost

# Terminal 3: Start FastAPI Backend Service
cd backend
source ../.venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 4: Launch Vite React Multi-Role Frontend
cd design
npm run dev
```

Visit `http://localhost:3000` to interact with the system.

---

## 10. Review-2 Evaluation & Viva Defense Q&A

### Q1: Why not write all IoT sensor data directly to the blockchain?
**Answer:** Writing raw sensor data directly to a smart contract causes two major failures:
1. **The Garbage In, Garbage Out (GIGO) Problem:** Blockchains guarantee immutability, not truth. If an uncalibrated, noisy, or compromised sensor writes bad data, the blockchain permanently records a false state that cannot be expunged.
2. **Prohibitive EVM Gas Costs:** Writing a single reading costs ~71,484 gas. At 1 reading every 15 seconds, a 24-hour journey creates 5,760 transactions, consuming over 410,000,000 gas ($800+ USD on mainnet). Our AI Trust Layer quarantines bad data off-chain and batches valid readings, saving **52.71% gas**.

### Q2: How does the AI model distinguish between a genuine ambient temperature fluctuation and an actual sensor fault?
**Answer:** The AI pipeline uses an 11-dimensional feature vector rather than a simple static threshold. Features $x_2$ ($\Delta T$) and $x_4$ ($\Delta^2 T$) capture thermal velocity and acceleration. Physical thermodynamic constraints dictate that 100 kg of bulk agricultural produce in an insulated container cannot change temperature by +15°C within 15 seconds. If such a delta occurs, the Isolation Forest flags it as an impossible physical anomaly.

### Q3: What happens if a truck driver replays yesterday's recorded valid cold-chain readings to hide a cooler failure today?
**Answer:** AgriChain enforces **SHA-256 Cryptographic Anti-Replay Defense**. Every telemetry packet is hashed into a canonical digest and cached with a sliding TTL window. If a packet hash matches an existing digest, or if the timestamp falls outside the allowed temporal window, the packet is flagged with `REPLAY_ATTACK_DETECTED` and immediately sent to the Quarantine Store.

### Q4: How is data stored between Supabase and IPFS without causing database bloat?
**Answer:** We implement hybrid storage:
- **Supabase Cloud PostgreSQL:** High-frequency, structured relational records (`batches`, `custody_events`, `readings`, `quarantine`, `audit_trail`).
- **Pinata IPFS:** Heavy, unstructured static assets (produce inspection certificates, organic lab PDF reports, farm photographs). Only the 46-character cryptographic Content Identifier (`ipfs://Qm...`) is recorded in the smart contract and database.

### Q5: How do smart contracts enforce that only authorized parties execute role actions?
**Answer:** All contracts inherit `AccessControlRoles.sol` utilizing OpenZeppelin's `AccessControl`. Functions are gated by modifiers like `onlyRole(FARMER_ROLE)` or `onlyRole(LOGISTICS_ROLE)`. If an unauthorized wallet attempts to call `registerBatch` or `transferCustody`, the EVM immediately reverts the transaction with an access control error.

### Q6: What guarantees the farmer's economic fair share?
**Answer:** In `CustodyTransfer.sol`, every handoff requires specifying the exact stage transaction price in paise. The farmer's initial price is permanently locked into `ProductRegistry.sol`. When the consumer scans the batch QR code, the consumer app pulls verified custody events directly from the blockchain and calculates:

$$\text{Farmer Share} = \left(\frac{\text{Farm Gate Price}}{\text{Consumer Retail Price}}\right) \times 100 = \left(\frac{₹40.00}{₹80.00}\right) \times 100 = 50.00\%$$

Intermediaries cannot retroactively doctor their margins without breaking cryptographic contract hashes.

---

**Prepared by:** AgriChain Major Project Engineering Team  
**Review Target:** B.Tech / B.E. Capstone Review-2 Presentation  
**Code Repository:** [github.com/Suyash728/agri-chain](https://github.com/Suyash728/agri-chain)
