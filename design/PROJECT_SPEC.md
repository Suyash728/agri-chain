# Project Specification & System Architecture: AgriChain

## 🌾 Core Vision
A farm-to-consumer agricultural supply chain tracking system combining **IoT**, **AI**, and **Blockchain** to ensure complete transparency, trust, and tamper-proof product traceability.

---

## 🔑 Core Differentiator: AI-First Trust Layer
> **"Blockchain guarantees data permanence, but AI guarantees data truthfulness."**

Raw sensor data is **never** committed directly to the blockchain. Every telemetry reading passes through the **AI Trust Layer** to detect anomalies (e.g., GPS manipulation, sensor faults, suspicious temperature spikes) before logging on-chain.

---

## 🔄 Supply Chain Lifecycle Flow
1. **Farmer**: Registers harvest batches (crop type, origin, harvest date, initial metadata).
2. **Logistics Partner / Warehouse**: Manages transit and storage; streams telemetry (temperature, humidity, location, timestamp) and handles custody transfers.
3. **Dark Store / Retail Vendor**: Receives inventory, manages stock shelf-life, and finalizes retail handoff.
4. **Consumer**: Scans QR code on product packaging to view verified journey, freshness status, cold-chain violations, and submit batch feedback.

---

## 🏗️ System Architecture & Data Topology

```
[ IoT Sensors ] ─── (Telemetry Data) ───► [ AI Trust Layer ]
                                                 │
                                           (Verified Data Only)
                                                 ▼
[ dApp / Web App ] ◄─────── (QR / Verified View) ─────── [ Blockchain & Smart Contracts ]
```

### 1. Hybrid Storage Strategy
- **On-Chain (Blockchain & Smart Contracts)**:
  - Batch registration & unique identifiers
  - Ownership & change-of-custody logs
  - Environmental breach alerts & quality event flags
  - Cryptographic hashes of off-chain records
- **Off-Chain (Database / IPFS / Supabase)**:
  - Full granular IoT telemetry logs
  - Consumer reviews & ratings
  - High-res images, certifications, & rich batch metadata

### 2. Smart Contract Rules Engine
- Configurable agricultural rules per crop type (e.g., max/min temp, humidity thresholds, max allowed transit time).
- Automatic flag generation on cold-chain violations.
