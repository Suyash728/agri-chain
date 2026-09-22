# AgriChain Backend Build Plan

> **Purpose** – This file contains the high‑level strategy for the AgriChain backend that must be finished by **31 Dec 2026**.  The plan is written for beginner developers and separates work into four parallel tracks so that each team member can focus on a slice of the stack with minimal blocking.

## 1.1 What we’re building

| Layer | Function |
|-------|----------|
| **IoT Simulation / Ingestion** | Generates sensor telemetry, validates the payload and forwards it to the AI layer. |
| **AI Trust Layer** | Executes the anomaly detection model and decides whether to forward a reading to the oracle or store it as a quarantined event. |
| **Blockchain & Smart Contracts** | Records only *validated* events on Polygon Amoy using parameterised contracts (`ProductRegistry`, `CustodyTransfer`, `PolicyConfig`, etc.). |
| **Front‑end dApp** | Consumes the APIs, shows traceability state and provides role‑based actions for each actor. |

All components run in the public cloud: FastAPI + MQTT on Render/ Railway, Next.js on Vercel, Supabase as the off‑chain database, and Polygon Amoy as the test‑net.

## 1.2 Four parallel tracks

| Track | Owner placeholder | Key work |
|-------|-------------------|----------|
| **Track A** | `TRACK A` | Sensor simulation & FastAPI service (ingestion). |
| **Track B** | `TRACK B` | AI trust platform (models + endpoint). |
| **Track C** | `TRACK C` | Solidity contracts, Hardhat test pipeline, oracle writer. |
| **Track D** | `TRACK D` | Next.js front‑end, role‑based UI, on‑chain interaction. |

Each task is < 3 days, lists explicit dependencies and a “DONE WHEN” statement that can be verified by a simple command or screenshot.

## 1.3 Monthly milestones

| Month | Demo‑able outcome |
|-------|-------------------|
| **1 (Aug ‑ Sep)** | Pure end‑to‑end data flow: simulated sensor ➜ ingestion ➜ AI trust ➜ oracle ➜ on‑chain event. No UI needed. |
| **2 (Oct)** | AI pipeline fully functional (Isolation‑Forest + optional LSTM), plus deployment of the first 3 contracts on Polygon Amoy. |
| **3 (Nov)** | The dApp can display on‑chain state and perform role‑based CRUD actions (farmer registration, logistics transfer, retailer sale). |
| **4 (Dec)** | Completed production‑ready demo, evaluation metrics, and a results table ready for the IEEE paper. |

## 1.4 How to use the docs

1. **API contract** – Review `/docs/plan/api-contract.md` and freeze it before any front‑end development starts. 
2. Pick a track file under `/tracks/`, replace the `OWNER` placeholder with your name, and fill out the dependencies and “DONE WHEN” line. 
3. Once a task is marked complete, run the verifier command from the “DONE WHEN” line locally or in CI to confirm the expected result. 
4. Track risk items in `/docs/plan/risks.md`.  Pull a track back for mitigation if an early warning sign appears.

**NOTE** – All of the above documents are plain text; no images or binary files are used.  If you encounter a diagram that is only present as a PNG (the Gantt charts and other diagrams in `/docs/diagrams/`), let me know a textual summary of the relevant dates or stages.

---

*This completes the high‑level plan.  Let me know if you’d like me to generate the individual track files, glossary, milestones, API contract, or risk matrix next.*