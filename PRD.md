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

### Optional (after the essential build proves out)

| # | Feature | Why it's not essential |
|---|---|---|
| O1 | Logistics Partner and Dark Store dashboards wired to real data | E2 proves the custody chain works without needing their UI wired; wiring two more full dashboards roughly doubles the frontend-wiring work |
| O2 | Wallet-based signing (MetaMask) per role | Essential uses one backend-held account to write to the chain on everyone's behalf, which is simpler and sufficient to prove the concept; per-user signing is a real UX upgrade, not a proof-of-concept requirement |
| O3 | Machine-learning anomaly detection (Isolation Forest → LSTM-autoencoder) | Rule-based thresholds (E4) already prove the core "AI trust layer" idea; swapping in a trained model is a research-quality improvement, not a functional requirement |
| O4 | Multiple, richer fault types in the simulator + labelled evaluation (precision/recall) | Needed for the eventual research paper's results section, not for the working demo |
| O5 | Deployment to Polygon Amoy testnet (public) | Essential runs on a local blockchain node, which is faster and has no faucet dependency; moving to a public testnet is a deployment step, not a feature |
| O6 | Splitting into the originally-planned 5 smart contracts with full OpenZeppelin `AccessControl` roles | A single consolidated contract (see `ARCHITECTURE.md`) proves the same on-chain logic with far less surface area for a first build |
| O7 | Migrating storage from SQLite to Supabase/Postgres | SQLite needs zero setup and is easier to build against locally; Supabase is a real upgrade for multi-user, cloud-hosted use, not for proving the concept |
| O8 | Consumer reviews & ratings | A real feature from the original spec, just not on the critical path to proving traceability + AI trust + price transparency |
| O9 | Admin role, account approval flow | Needed for a real multi-tenant deployment; not needed to demonstrate the core loop |
| O10 | IPFS storage for certificates/images | Real part of the hybrid storage design; not needed until there are real documents to store |
| O11 | Quarantine console UI | E4/E7 prove quarantine works; a dedicated screen to browse quarantined readings is a nice-to-have, not load-bearing |
| O12 | Real ESP32 hardware device | The simulator (E3) is sufficient and is also the *only* way to get labelled, repeatable fault data for O4 — real hardware is a physical demo prop, not a functional requirement |
| O13 | Batched oracle writes + gas measurement | A real efficiency result worth having for the paper; irrelevant to whether the essential build works |
| O14 | Display the price trail in the Consumer UI | Requires adding one new small UI element to an existing screen — the one narrow, explicit exception to `RULES.md` §2's "no new UI" rule, because this is the project's stated differentiating feature. Do this deliberately and minimally: reuse an existing card/typography pattern already present elsewhere in `design/`, don't design something new |

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
