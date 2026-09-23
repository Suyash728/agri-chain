# AgriChain — Review 2 Project Documentation

Welcome to the **Review 2 (Mid-Term / Progress Review 2 Milestone)** documentation package for the **AgriChain** major project capstone.

This folder contains the complete, presentation-ready architectural breakdown, mathematical formulations, implementation details, and visual diagrams explaining the working of the current development version.

---

## 📑 Contents

| Document | Description |
|---|---|
| 📘 [**SYSTEM_ARCHITECTURE_AND_WORKING.md**](./SYSTEM_ARCHITECTURE_AND_WORKING.md) | **Primary Review-2 Master Document:** Comprehensive technical explanation of all 5 tiers, 6-stage AI Trust Layer pipeline, OpenZeppelin modular smart contracts, EVM gas benchmarks, Supabase + IPFS storage, physical ESP32 IoT hardware, economic fair-share proof, verification instructions, and viva defense Q&A. |

---

## 🖼️ Included Visual Diagrams

The documentation includes 7 rich, self-rendering Mermaid diagrams:

1. **System Architecture (5-Tier Framework):** IoT Edge $\to$ AI Trust Layer $\to$ Modular Contracts $\to$ Hybrid Cloud & IPFS $\to$ Multi-Role Web3 Frontend.
2. **Pre-Chain AI Trust Layer 6-Stage Pipeline:** Ingestion $\to$ Crop Range Rules $\to$ 11-D Feature Extraction $\to$ Isolation Forest ML $\to$ SHA-256 Anti-Replay $\to$ Oracle Handoff.
3. **Modular Smart Contract Class & State Transition Model:** OpenZeppelin RBAC, `ProductRegistry`, `CustodyTransfer`, `ColdChainMonitor`, `PolicyConfig`, and finite state machine.
4. **Database Entity-Relationship Diagram:** Supabase Cloud PostgreSQL 11 normalized tables with foreign keys and performance indexes.
5. **Physical IoT Edge Hardware & Telemetry Data Flow:** ESP32 microcontroller, DHT22 sensor, NEO-6M GPS, and hardware GPIO 4 breach button demo.
6. **End-to-End Product Lifecycle & Custody Sequence Diagram:** Step-by-step trace from Farmer batch creation through Logistics transit, Dark Store inbound receiving, Consumer QR scan, and verified review submission.
7. **Supply Chain Price Trail & Economics Breakdown:** Visual proof of farm-gate to consumer price markups, proving the farmer's **50.00% fair share**.

---

## 🚀 Quick Verification

To verify that the entire system functions end-to-end as described in the documentation, execute the automated capstone test suite:

```bash
python backend/scripts/verify_final_system.py
```

All 8 capstone stages will execute and report 100% pass across blockchain, database, AI trust layer, and multi-role custody handoffs.

---

*Prepared for Review 2 Evaluation — Academic Year 2026–2027*
