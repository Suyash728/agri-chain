# PRD.md — KisanChain / AgriChain

Product Requirements Document. This describes **what** the product is and
**why**, and draws the line between what must exist in two weeks (Essential)
and everything that improves on that later (Optional). It does not describe
how anything is built — that's `ARCHITECTURE.md`.

If you're an AI agent: this file tells you what to build and in what order of
importance. It does not tell you which file to edit or which command to run —
that's `PLAN.md` and `TASKS.md`.

## 1. Problem

Agricultural supply chains in India run through many hands — farmer,
transporter/warehouse, retailer, consumer — with almost no shared record of
what happened in between. Two consequences follow:

1. **No one can prove what happened to the produce in transit.** If a batch of
   vegetables arrives spoiled, there's no reliable record of when or where the
   cold chain broke, so no one is accountable.
2. **The farmer's share of the final price is invisible.** A consumer paying
   ₹80/kg for tomatoes has no way to know what the farmer was paid for the
   same tomatoes, and there's no shared record that would let anyone verify
   it either way.

## 2. What this product is

A system where:

- Every batch of produce is registered on a blockchain, with its farm origin,
  crop, and harvest date.
- Every custody handoff (farmer → logistics → retailer → sold) is recorded
  on-chain, **including the price paid at that handoff.**
- Sensor readings (temperature, humidity) taken during transport are checked
  by an **AI trust layer** before being recorded — bad, implausible, or
  spoofed readings are rejected and quarantined instead of being written to
  the chain. Only data the system believes is real gets recorded permanently.
- A consumer can scan a QR code on the product and see its full farm-to-fork
  journey, including the price trail, without needing a crypto wallet.

**The one-sentence pitch:** *a blockchain makes records permanent, but
permanence is worthless if the data was wrong — so an AI checkpoint decides
what's trustworthy enough to make permanent, and the price is part of what
gets recorded.*

## 3. Users

| # | Role | What they do in this product |
|---|---|---|
| 1 | **Admin** | Approves accounts, assigns roles. *(Optional tier — see §5)* |
| 2 | **Farmer** | Registers a harvest batch; hands it to a Logistics Partner at an agreed price |
| 3 | **Logistics Partner** | Transports/stores the batch; custody is tracked as `IN_TRANSIT` or `IN_STORAGE`; hands off to a Retailer at an agreed price |
| 4 | **Dark Store / Retailer** | Receives the batch, manages shelf inventory, sells to a Consumer at a recorded price |
| 5 | **Consumer** | Scans the product's QR code; sees the verified journey and price trail; leaves a review *(review = Optional tier)* |

This is the final actor model — see `docs/proposal/revised-account-list.md`
for the reasoning behind merging Warehouse and Transporter into one
"Logistics Partner" role.

## 4. The UI already exists

Every screen for every role above has already been designed and built as a
working React app in `design/`. This PRD does not need to specify what any
screen looks like — open `design/` and run it. What this PRD specifies is
**which of those already-built screens get connected to real data in the
essential build**, and which stay on mock data for now (§5).

## 5. Feature list — Essential vs Optional

"Essential" is the smallest slice that proves the entire idea end-to-end —
IoT sensor → AI validation → blockchain → dashboard → consumer QR — with real
data instead of mock data, in two weeks. "Optional" is everything that makes
it more complete, more secure, or more production-like, tackled after.

### Essential (must exist by the end of week 2)

| # | Feature | What "working" means |
|---|---|---|
| E1 | Batch registration | A Farmer can register a real batch (crop, quantity, harvest date); it's written to the blockchain and appears in the Farmer dashboard with real data instead of mock data |
| E2 | Custody transfer with price | A batch's custody can move Farmer → Logistics → Retailer → Sold, each transfer recorded on-chain with the price paid. *(For the essential build, transfers for Logistics/Retailer are performed via a script or direct API call — their dashboards don't need to be wired to trigger this, see §5 Optional O1)* |
| E3 | Sensor telemetry ingestion | A simulator sends temperature/humidity readings for a batch in transit to the backend |
| E4 | AI trust layer (rule-based) | Each reading is checked against a min/max temperature and humidity range for the crop. In-range readings are accepted and recorded; out-of-range or physically implausible readings are rejected and quarantined, never reaching the chain |
| E5 | Farmer dashboard wired to real data | The existing Farmer dashboard screen shows real batches, real KPIs, and real recent activity instead of `mockData.js` |
| E6 | Consumer traceability view | The existing Consumer QR/journey screens (`productJourneyTimeline` in `consumerData.js`) show a real batch's real journey for a batch created in E1–E2 |
| E7 | One demonstrable "catch" | At least one deliberately bad sensor reading is shown being rejected by E4, distinguishing this system from one that just stores whatever it's sent |
| E8 | Price trail is real and retrievable | The price recorded at each custody transfer in E2 is correct and returned by `/batches/{id}/traceability` — provable by calling the endpoint directly. It does **not** need to be rendered in the Consumer UI for the essential build; see O14 |

> **Note on E6/E8:** checked the actual mock data before writing this table —
> neither `productJourneyTimeline` nor `traceabilityBatch` in the existing
> `design/` app has a price field anywhere; the existing Consumer journey
> screens are provenance-only (dates, locations, status). Displaying the
> price trail to the consumer would mean adding a UI element that doesn't
> exist yet, which is out of scope for "wire, don't create" (see
> `RULES.md` §2). So the price trail is essential as *data* (E2, E8,
> verifiable via the API) but its on-screen display is O14. This is a
> deliberate, visible trade-off, not an oversight — flag it to the team
> before the final demo, since "the farmer's price share" is the project's
> stated differentiating angle and a live demo may want it on screen even
> if that means doing O14 alongside the essential build rather than strictly
> after it.

### Optional Features & Post-Essential Phases (Phases 6–10)

| # | Feature | Target Phase | Status | Why it was deferred / Current Implementation Details |
|---|---|---|---|---|
| O1 | Logistics Partner and Dark Store dashboards wired to real data | Phase 7 | ✅ Complete | Wired in Phase 7 (`LogisticDashboardView`, `DarkStoreDashboardView`, on-chain dispatch & GRN receive verified). |
| O2 | Wallet-based signing (MetaMask) per role | Phase 10 | 📋 Planned | Role-based Web3 signature via ethers.js v6 with backend relayer fallback. |
| O3 | Machine-learning anomaly detection (Isolation Forest → LSTM-autoencoder) | Phase 6 | ✅ Complete | 11-D feature extraction & Isolation Forest pipeline integrated from `trust-layer/` with F1-score of 0.9722. (LSTM-AE remains an optional research enhancement). |
| O4 | Multiple, richer fault types in the simulator + labelled evaluation | Phase 6 | ✅ Complete | 7 fault injection types implemented in `trust-layer` simulator; evaluation benchmarks exported for paper. |
| O5 | Deployment to Polygon Amoy testnet (public) | Phase 8 | 📋 Planned | Deploy 5 modular contracts to Polygon Amoy (Chain ID 80002) and verify source code on Polygonscan. |
| O6 | Splitting into 5 modular smart contracts with OpenZeppelin `AccessControl` | Phase 8 | 📋 Planned | Splitting monolithic `AgriChainCore.sol` into `AccessControlRoles`, `ProductRegistry`, `CustodyTransfer`, `ColdChainMonitor`, `PolicyConfig`. |
| O7 | Migrating storage from SQLite to Supabase/Postgres | Phase 9 | 📋 Planned | Dual-mode `backend/db.py` supporting SQLite locally and Supabase PostgreSQL via `DATABASE_URL`. |
| O8 | Consumer reviews & ratings | Phase 10 | 📋 Planned | Post-sale feedback submission in Consumer journey view with on-chain/DB persistence. |
| O9 | Admin role, account approval flow | Phase 10 | 📋 Planned | Admin governance UI and contract role assignment. |
| O10 | IPFS storage for certificates/images | Phase 9 | 📋 Planned | PDF certificate and inspection photo pinning with on-chain cryptographic CID anchoring. |
| O11 | Quarantine console UI | Phase 7 | ✅ Complete | Built `GET /telemetry/quarantine` and interactive `QuarantineAuditModal.jsx` in Farmer AI Trust view. |
| O12 | Real ESP32 hardware device | Phase 10 | 📋 Planned | Physical ESP32 + DHT22 + GPS sensor telemetry transmitter prop with fault injection button. |
| O13 | Batched oracle writes + gas measurement | Phase 8 | 📋 Planned | Multi-reading batch write in `ColdChainMonitor.sol` and gas benchmark script for IEEE paper Section IV. |
| O14 | Display the price trail in the Consumer UI | Phase 5 | ✅ Complete | `PriceFairnessCard.jsx` wired in Consumer view showing real farm-to-retail price trail and farmer share. |

## 6. Essential-tier success criteria

The essential build is complete when this sequence works, run in order,
against the real backend and real contract (no mock data involved):

1. Run the simulator for one batch; it sends several valid readings — they
   appear as `VALID` in the backend, and the batch's on-chain condition log
   grows.
2. Run the simulator with one deliberately bad reading (e.g. temperature
   spiking to an implausible value) — it is rejected and appears in the
   quarantine table, and the on-chain log does **not** grow for that reading.
3. Register a batch as Farmer through the real (wired) Farmer dashboard —
   it appears on-chain.
4. Move that batch's custody Farmer → Logistics → Retailer → Sold (via script
   or direct call per E2), each transfer carrying a price.
5. Open the Consumer traceability/QR view for that batch (wired, real data) —
   it shows the real journey. Separately, call
   `GET /batches/{batch_id}/traceability` directly and confirm the price at
   each custody transfer is correct, and that the farmer's price ÷ final
   sale price gives the right share — this is the E8 check, and it does not
   need to appear on screen yet (see PRD.md §5, O14).

If all six steps (E1–E8, checked across these five run steps) work, the
essential build is done, regardless of what's left in the Optional list.

> **Verification Status:** The essential-tier success criteria (E1–E8) were completed and validated in Phase 5 via `backend/scripts/verify_phase5_e2e.py` and expanded to full multi-role verification in Phase 7 via `backend/scripts/verify_phase7_e2e.py` (all tests passing 100%). The project is now progressing through post-essential Phases 8–10.

## 7. Explicit non-goals (for both tiers)

- Production authentication, KYC, or real user accounts beyond simple role
  identification
- Real payments or money movement of any kind — prices are recorded numbers,
  not transactions
- Mainnet deployment
- Mobile app (web only, and the existing `design/` app is already
  mobile-responsive)
- Supporting real farmers, real logistics companies, or real retailers as
  users — this is an academic capstone prototype
- Horizontal scaling, load balancing, CI/CD pipelines, multi-tenancy
