# Glossary of terms used in AgriChain

All definitions are plain English and match the terminology used in other project documents.

| Term | Definition |
|------|------------|
| **AgriChain** | The project’s name – a blockchain‑based farm‑to‑fork traceability system for perishable crops.
| **Farmer** | An account that registers crops, records harvest data and submits reviews after sale.
| **Logistics Partner** | An account that transports the crop and stores it in controlled conditions; tracks cold‑chain status.
| **Dark Store / Retailer** | A point of sale that receives stock, manages inventory, and sells to consumers.
| **Consumer** | The end‑customer who scans a QR code to verify the journey of the product they purchased.
| **Admin** | The team’s administrative account that can onboard users, set roles, and manage on‑chain configuration.
| **AI Trust Layer** | A FastAPI service that runs anomaly‑detection models on IoT telemetry and decides if it should be written on‑chain.
| **Oracle Writer** | The FastAPI component that calls the smart contract functions when the AI Trust Layer deems data valid.
| **Polygon Amoy** | The Polygon test‑net used for all on‑chain deployments; chain ID 80002.
| **Supabase** | A PostgreSQL‑based cloud database used for off‑chain storage (telemetry, quarantine logs, user accounts, etc.).
| **IPFS** | Decentralised file store; only content‑addressable CIDs are written on‑chain.
| **Isolation‑Forest** | A machine‑learning model for detecting anomalies in time‑series data.
| **LSTM‑AE** | Long‑short‑term‑memory auto‑encoder used as a deeper anomaly detector (optional future work).
| **PolicyConfig** | A smart‑contract that stores per‑crop configuration parameters (max/min temperature, delay, etc.) and can be updated without redeploying.
| **Cold‑Chain Break** | Any event where environmental parameters go outside the thresholds set in `PolicyConfig`.
| **Quarantine** | Off‑chain storage of anomalous sensor events, retained for audit but never written on‑chain.
| **Gantt** | A project schedule diagram that lists milestones and dates.
