# PRD.md — AgriChain Product Requirements

## 1. Problem
1. **Unprovable spoilage.** Perishable produce passes through farmers, cold-chain transporters and dark stores without continuous, tamper-evident condition records, so fault for spoilage can't be established.
2. **Invisible farmer share.** Intermediary markups are opaque; a consumer paying retail can't see how much reached the farmer.

## 2. Solution
- **Sensors with the produce.** An IoT node (or virtual device) is linked to a produce batch and records temperature, humidity, VOC, impacts, lid opening and location. It keeps working offline and syncs without loss.
- **Pre-chain AI trust layer.** Readings are persisted, then validated (bounds, physical plausibility, ML anomaly score, replay detection) before conditions are anchored on-chain. Suspect readings are quarantined in a hash-chained log.
- **On-chain custody and price trail.** Each transfer `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD` records the stage price in integer paise. Consumers see the recorded trail and the farmer's share.

## 3. Actors
| Role | Needs | Main screens and endpoints |
|---|---|---|
| **Farmer** | Register lots, attach certificates, see reputation and earnings. | Dashboard, Inventory, Quality (`/batches`, `/farmer/*`) |
| **Logistics** | Accept shipments, link sensors, track condition and location, settle with dark stores. | Procurement, Shipment Tracking (`/logistics/*`, `/devices/*`) |
| **Dark Store** | Inspect inbound lots (sensor readings, AI trust gate), receive (GRN), manage expiry, sell. | Incoming Deliveries, Expiry, Sales (`/darkstore/*`) |
| **Consumer** | Scan a QR, see the journey, conditions and price trail, leave a review. | Farm Origin journey (`/batches/{id}/traceability`, `/batches/{id}/reviews`) |
| **Admin** | Grant/revoke roles, pause contracts, audit the quarantine chain. | Admin console (`/admin/*`, `/quarantine/verify-integrity`) |
| **Presenter** | Demonstrate the whole flow without hardware. | God Mode / Demo Lab (`/demo/*`, virtual devices) |

## 4. Requirements
1. **Custody** is forward-only and enforced on-chain; each step records the stage price in paise.
2. **Telemetry** is persisted before validation. Valid and breach readings are anchored (batched writes supported); anomalous readings are quarantined with reason codes.
3. **Sensor linking:**
   - An operator links a sensor to one batch at a time, from the web app or the terminal monitor.
   - Offline records go to the batch linked at sync time, and links are kept with dates.
   - Simulators can act as virtual devices.
4. **Offline buffering:** the node buffers to flash and syncs with an acknowledged two-phase protocol. Records carry a verifiable hash chain and real timestamps.
5. **Price transparency:**
   - The trail shows recorded prices only. Money is integer paise.
   - No synthesized prices, ratings, certificates or KPIs.
6. **Documents** (certificates, lab reports) are pinned to IPFS and their CIDs anchored in `ProductRegistry`.
7. **Production deployment** requires device keys for ingestion and admin tokens for destructive and admin actions, with a restricted CORS policy.

## 5. Success measures
- **Sync:** no telemetry is lost between device and backend; every synced record is counted, saved and acknowledged.
- **Batched gas:** writes save over 50% of gas against individual writes at N = 20. Measured: 54.31%.
- **AI trust layer:** it detects all seven simulated fault types with a low false-positive rate on normal data. *Current:* recall 100%, but a 35–40% false-positive rate, which still needs work (see the audit report).
- **Honest UI:** every dashboard value traces to recorded data.

## 6. Non-goals
- Real fiat or crypto payments; prices are audit records, not settlements.
- Production KYC or payment processing.
- Multi-tenant enterprise deployment; this is a single-instance capstone prototype.
