# PRD.md — AgriChain Product Requirements Document

> **A Decentralized IoT-Blockchain Framework with Customized Smart Contracts and Pre-Chain AI Gatekeeper for Transparent and Traceable Agricultural Supply Chains.**

---

## 1. Problem Statement

Agricultural supply chains face two systemic failures:
1. **Unaccountable Perishability & Spoilage**: Produce traverses fragmented handlers (farmers, cold-chain transporters, dark stores) without continuous, tamper-resistant condition tracking. When spoilage occurs, fault cannot be proven.
2. **Invisible Farmer Price Share**: Intermediary markups are opaque. Consumers paying retail rates cannot verify what percentage reached the farmer at harvest.

---

## 2. Product Solution & Nature

AgriChain unifies **IoT sensor telemetry**, a **Pre-Chain AI Trust Layer**, and **modular EVM smart contracts** into a verifiable farm-to-fork platform:
- **Pre-Chain AI Gatekeeper**: Sensor data is validated by an AI trust engine (11-D feature extraction + Isolation Forest, $F_1 = 0.9722$) *before* reaching the blockchain. Anomalous or spoofed readings are quarantined into a cryptographically hash-chained log and never touch the chain.
- **On-Chain Custody & Fair-Share Pricing**: Every transfer (`REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`) records the exact price in integer paise. The consumer scans a QR code to view the complete journey and fair-share percentage.
- **Domain-Specific Role Alignment**:
  - **Farmer**: Farm reputation, crop lot registration, harvest certifications (NPOP Organic, IndGAP anchored on IPFS).
  - **Logistics Partner**: Cold-chain telemetry, reefer temperature & GPS monitoring, smart seal tamper alerts, carrier SLA penalty deductions.
  - **Dark Store**: Inbound GRN AI Trust Gate (automated quarantine / clearance), micro-inventory shelf-life management, retail point-of-sale.
  - **Consumer**: QR provenance, farm-to-fork timeline, transparent price markup trail, verified post-purchase reviews.
  - **Admin / Auditor**: OpenZeppelin RBAC role management, emergency circuit breakers, SHA-256 hash-chain audit verification.
  - **God Mode / Demo Lab**: Synchronized 4-quadrant command hub and 1-click end-to-end simulation scenarios.

---

## 3. Actor Model & Responsibilities

| Role | Key Capabilities | Primary Views & Endpoints |
|---|---|---|
| **Farmer** | Registers harvest batches, uploads IPFS lab certificates, monitors farm quality rating & sales. | `FarmerDashboardView`, `FarmerQualityView` (`/batches`, `/farmer/quality-rating`, `/farmer/kpis`) |
| **Logistics** | Manages dispatch, monitors live reefer telemetry, GPS transit coordinates, smart seal status, SLA penalties. | `LogisticDashboardView`, `LogisticAITrustView` (`/logistics/kpis`, `/logistics/shipments`, `/logistics/ai-trust`) |
| **Dark Store** | Inbound GRN inspection with AI Trust Gate, batch acceptance/rejection, inventory management, retail checkout. | `DarkStoreDashboardView`, `InboundGRNView` (`/darkstore/inbound`, `/darkstore/receive`, `/darkstore/checkout`) |
| **Consumer** | Scans product QR code, inspects farm origin, verifies cold-chain transit history & price share, submits ratings. | `ConsumerLandingView`, `ProductJourneyView` (`/batches/{id}/traceability`, `/batches/{id}/price-journey`, `/reviews`) |
| **Admin** | Manages role grants/revocations, triggers emergency circuit breakers, audits quarantine hash-chain integrity. | `AdminDashboardView` (`/admin/roles/grant`, `/admin/roles/revoke`, `/quarantine/verify-integrity`) |
| **God Mode** | Simultaneous 4-quadrant supply-chain command hub with 1-click preset scenarios and manual telemetry injection. | `GodModeHub`, `ShowcaseDrawer` (`/demo/godmode/{id}`, `/demo/scenarios`, `/demo/iot/inject`) |

---

## 4. Feature Specifications

### 4.1 Produce Batch Lifecycle & Custody
- Batches follow a strict, monotonic forward-only state machine: `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`.
- Each state transition is validated and recorded on-chain in `CustodyTransfer.sol` with the stage price in integer paise.

### 4.2 Telemetry Ingestion & AI Trust Gate
- Raw IoT readings are persisted to the database *prior* to evaluation to guarantee an unbroken audit trail.
- The AI Trust Layer evaluates temperature, humidity, GPS velocity, and packet signatures against crop policy and physical bounds.
- **Approved Telemetry**: Batched and committed to `ColdChainMonitor.sol` (`recordConditionsBatch`), saving 52.7% gas.
- **Corrupted / Breached Telemetry**: Quarantined with reason codes in an IsoLog SHA-256 cryptographic hash-chain (`prev_hash` → `entry_hash`).

### 4.3 Fair-Share Price Transparency
- All monetary amounts use integer paise (`1 INR = 100 paise`). Floating-point money is strictly prohibited.
- Endpoints calculate and display the exact percentage breakdown: Farmer Share, Logistics Markup, Dark Store Markup.

### 4.4 Decentralized Media & Document Anchoring
- Inspection certificates and farm lab reports are pinned to IPFS via Pinata.
- Immutable CIDs (`ipfs://Qm...`) are anchored on-chain in `ProductRegistry.sol`.

---

## 5. Explicit Non-Goals
- Real fiat money or cryptocurrency transfers (prices are non-repudiable audit records, not payment settlements).
- Production KYC / credit-card processing.
- Multi-tenant enterprise cloud partitioning (optimized as a single-instance capstone research prototype).
