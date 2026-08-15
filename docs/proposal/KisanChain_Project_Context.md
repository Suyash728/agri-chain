# KisanChain — Complete Project Context

> **This document is a full context handoff.** It contains everything decided so far about the final-year capstone project. Read it start to finish before continuing work in a new chat.

---

## 1. Identity

**Project name:** KisanChain

**Tagline (Hindi):** किसान से ग्राहक तक — हर फ़सल का सफ़र, हर मेहनत का दाम
*(From farmer to consumer — every crop's journey, every labour's price)*

**Formal / paper title (guide's original):**
*A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains*

**Proposed paper title (with the profit-transparency angle):**
*KisanChain: A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Price Transparency and Traceability in Agricultural Supply Chains*

**One-line description:** A blockchain-based farm-to-fork traceability system for perishable agricultural goods, where an AI trust layer validates IoT sensor data before it is written on-chain, and every price/margin along the chain is transparently recorded so the farmer's share is visible.

---

## 2. Context & constraints

| Item | Detail |
|---|---|
| **Course** | Final year BE (AI & Data Science), Terna Engineering College, Navi Mumbai (Mumbai University) |
| **Team** | 4 members (all web-development focused) |
| **Guide** | Prof. Shraddha Sushant Rokade — teaches Blockchain Technologies this semester; guided the team's previous mini-project; author of the foundational survey; **agreed to contribute equally** and will co-author |
| **Guide's nature** | Friendly but arrogant — respond with specifics and competence; present options with a reasoned default rather than arguments; give her the senior-architect/theory lane |
| **Deadline** | 100% dev + testing complete by **31 December 2026** |
| **Paper** | Drafted Dec; target spring IEEE venue (Sem VIII window, ~3-month acceptance window) |
| **Status** | Guide allocated; project topic selected (chosen over an audio-deepfake-detection alternative because the guide has domain expertise and a published survey here) |
| **SDGs** | 2 (Zero Hunger), 12 (Responsible Consumption & Production), 9 (Industry, Innovation & Infrastructure) |
| **Domain** | Blockchain · AI on IoT · Machine Learning |

**Team's existing skills:** Next.js 14, TypeScript, FastAPI, Supabase/pgvector, LLM/RAG pipelines, Gemini/Groq APIs. **New domains to learn:** Solidity/smart contracts, time-series anomaly detection.

---

## 3. Origin of the project (important background)

The guide called the team in person and directed them toward blockchain specifically. She suggested:
- A blockchain inventory system (like Blinkit / Swiggy Instamart / Zepto)
- An IoT device for package location tracking
- She then shared her own survey paper on WhatsApp

Her survey: *A Comprehensive Survey on Transparency and Traceability in Agricultural Supply Chain Management Using Customized Smart Contracts and Blockchain Technologies* — reviews 60 studies, compares 15 in depth, organised into five literature phases.

**Strategic read:** blockchain agri-traceability is a saturated field, and a pure "blockchain inventory system" invites the fatal question *"why does a single company's inventory need a decentralized ledger?"* The chosen solution reframes it as a **multi-party perishable cold chain** (a real trust boundary) and injects the team's AI strength as the research contribution, targeting gaps her own survey names.

---

## 4. Research gaps addressed (from the guide's survey)

Her survey's "Research Gaps and Open Challenges" section lists five gaps. The project maps to them:

| Gap | How KisanChain addresses it |
|---|---|
| **1. Scalability & performance** | Hybrid on/off-chain design; batched writes; Layer-2 (Polygon) not L1; only hashes + events on-chain |
| **2. Interoperability & standardization** | **Out of scope** — explicitly acknowledged as future work |
| **3. Data privacy & confidentiality** | Sensitive business data off-chain; only hashes/CIDs and flags on-chain |
| **4. Smart-contract security & reliability** | OpenZeppelin `AccessControl`, role gating, Hardhat test suite, **customized/parameterized contracts** (not hard-coded), optional LLM-assisted audit |
| **5. Oracle & off-chain data trust ★** | **THE CORE CONTRIBUTION** — the AI trust layer. Her survey states blockchain guarantees the *integrity* of captured data but not its *truthfulness*. An ML gatekeeper decides what deserves to be recorded immutably. |

**Novelty positioning (be honest):** Blockchain agri-traceability is saturated. The defensible contribution is the combination of (a) customized/parameterized smart contracts for agricultural policy rules, (b) an AI-validated oracle layer targeting Gap 5, (c) price/margin transparency, and (d) a working, evaluated, deployed system. **Do NOT claim** a new consensus mechanism or state-of-the-art performance.

---

## 5. Core concept

> A blockchain makes records permanent — but permanence is worthless if the data was wrong. So we put an AI checkpoint in front of it, so only trustworthy data gets recorded forever.

**Why blockchain is genuinely justified here:** multiple mutually-distrusting parties (farmer, logistics, retailer, consumer), real disputes over who broke the cold chain, and a need for a tamper-evident shared audit trail. This is a legitimate trust boundary, not decorative blockchain. *(Be ready for this question — it's the first one any reviewer asks.)*

---

## 6. User accounts (FINAL — 5 types)

| # | Account | Role |
|---|---|---|
| 1 | **Admin** | Onboards/approves accounts, assigns & revokes blockchain roles, freezes compromised accounts, moderates flagged reviews, views system-wide anomaly/quarantine logs. *(Structurally required — OpenZeppelin `DEFAULT_ADMIN_ROLE` must exist to grant any other role.)* |
| 2 | **Farmer** | Registers harvest batch (crop, quantity, origin, harvest date), hands off custody, receives consumer review feedback |
| 3 | **Logistics Partner** *(Warehouse + Transporter merged)* | Transports and/or stores the batch; custody tracked as **`IN_TRANSIT` / `IN_STORAGE` states**; accountable for cold-chain breaches in either state |
| 4 | **Dark Store / Retailer** | Receives stock, manages inventory & expiry, sells to consumer |
| 5 | **Consumer** | Scans QR to verify farm-to-fork journey, submits review & rating on the purchased batch |

**Custody chain:** Farmer → Logistics Partner → Retailer → Consumer, with Admin governing access.

**Design note to tell the guide:** "We considered a separate Transporter role but merged it into Logistics Partner with in-transit/in-storage state tracking, to keep scope tight without losing breach accountability."

**Deliberately excluded:** Aggregator/Processor (adds custody hops + complicates batch identity), multiple admin tiers, bank/insurer accounts, government write-access (conflicts with the standalone requirement). *Auditor/Regulator (read-only) is an optional November stretch goal.*

---

## 7. System architecture (4 layers)

```
LAYER 1 · DATA CAPTURE (IoT)              ← Survey Phase II
   simulated sensor fleet (+ optional 1 real ESP32)
   emits {batch_id, lat, lng, temp, humidity, timestamp}
        │ MQTT / HTTPS
        ▼
LAYER 2 · AI TRUST LAYER  ★ contribution   ← addresses Gap 5
   FastAPI ingestion → anomaly model → verdict
   VALID → oracle    |    ANOMALOUS → quarantine (off-chain)
        │ validated events only
        ▼
LAYER 3 · BLOCKCHAIN & CUSTOMIZED SMART CONTRACTS  ← Phases I & III
   Oracle writer → Solidity contracts on Polygon Amoy
        │
        ▼
LAYER 4 · APPLICATION (dApp)               ← Phase V
   traceability view · inventory dashboard · consumer QR · role-gated actions

OFF-CHAIN: Supabase (telemetry, inventory, quarantine, reviews) + IPFS (docs, images → CID on-chain)
```

---

## 8. Technology stack (precise)

**Blockchain**
- Solidity ^0.8.x · **Hardhat** (JS/TS — fits the team better than Foundry) · **OpenZeppelin Contracts**
- **Polygon Amoy testnet** (chain ID **80002**, Sepolia-anchored, ~2s blocks). ⚠️ *Mumbai testnet is deprecated — Amoy is current.* Test POL from Alchemy/QuickNode faucets.
- MetaMask · Polygonscan (Amoy) for verification

**Frontend / dApp**
- Next.js 14 + TypeScript, Tailwind + shadcn/ui
- **ethers.js v6** (or wagmi + viem); optional RainbowKit
- Deployed on **Vercel**

**AI trust layer**
- **FastAPI** (Python 3.11) · scikit-learn (Isolation Forest) · PyTorch/Keras (LSTM-autoencoder) · pandas/numpy
- **MQTT** (Mosquitto) or HTTPS ingestion
- Deployed on **Render / Railway**

**IoT simulation**
- Python/Node simulator; route waypoints from a maps/routing API; configurable fault-injection module
- *(Optional hardware: ESP32 + NEO-6M GPS + DHT22, Arduino/PlatformIO, WiFi → MQTT)*

**Off-chain storage (hybrid)**
- **Supabase (Postgres)** — raw telemetry, inventory, quarantine log, reviews, accounts, dashboard queries
- **IPFS (Pinata / web3.storage)** — certificates, invoices, images; only the **CID** goes on-chain

---

## 9. Smart contracts

"Customized" is central to the title, so contracts must be **parameterized and policy-driven**, not hard-coded — directly answering the survey's criticism that *"many existing implementations use static and hard-coded smart contracts which are hard to modify post-deployment."*

| Contract | Responsibility |
|---|---|
| `ProductRegistry` | Batch/lot identity, crop type, origin farm, harvest date, metadata CID; anchors review hashes |
| `CustodyTransfer` | Custody handoffs with `IN_TRANSIT` / `IN_STORAGE` states; **records price at each transfer (profit transparency)** |
| `ColdChainMonitor` | Validated environmental events, breach flags, AI validity verdict |
| `PolicyConfig` ★ | **The "customization" contract** — per-crop, per-route configurable thresholds (max/min temp, max transit hours, humidity range), updatable by an authorized role **without redeploying** |
| `AccessControlRoles` | OpenZeppelin roles: `ADMIN`, `FARMER`, `LOGISTICS`, `RETAILER`, `ORACLE` (+ optional `AUDITOR`) |

**Design principles:** events for all state changes (cheap, indexable); store hashes/CIDs not blobs; batch oracle writes to cut gas; no unbounded loops; `require`-based guards; reentrancy-safe patterns.

---

## 10. AI trust layer (research contribution)

- **Input:** each incoming reading + a rolling time-series window per device
- **Checks:**
  - *Physical plausibility* — implied speed between GPS points, temperature rate-of-change limits
  - *Statistical/ML anomaly detection* — **v1: Isolation Forest** (+ rule bounds); **v2: LSTM-autoencoder** (reconstruction error → anomaly score)
  - *Integrity* — device signature/auth, replay detection via timestamp/nonce
- **Output:** `VALID` → oracle writer commits on-chain (with validity flag); `ANOMALOUS` → quarantined off-chain with reason code + audit trail
- **Important:** raw readings are **always stored first**, before scoring — you keep everything for audit, you just don't make bad data immutable
- **Evaluation:** precision/recall/F1 on injected faults per fault type; false-alarm rate on clean data; added latency per reading
- **Optional stretch:** LLM-assisted smart-contract audit (targets Gap 4) — stretch, not core

---

## 11. THE KEY DECISION — IoT simulation vs real device

**Recommendation: simulation-first backbone, one optional physical device.**

**Option A — Software simulation (backbone) ✅**
Script emulates N trackers on real routes emitting telemetry, **with on-demand fault injection**: GPS teleports, temperature spikes/drift, dropouts, replayed/spoofed packets.
- *Pros:* zero cost, reproducible, no hardware skill, finishes by December, and **it is the only way to rigorously evaluate the AI layer** (faults must be controllable and labelled)
- *Cons:* not physical — but academically standard and defensible

**Option B — Hybrid: + one real device ⭐ (diplomatic compromise)**
One ESP32 + NEO-6M GPS + DHT22 feeding the same pipeline over WiFi (~₹1,500–3,000).
- *Cons:* hardware debugging (WiFi, GPS cold start, power), ~1 member part-time 2–3 weeks, unreliable indoor GPS, ~1 week procurement

**Option C — Full physical fleet ❌** Not recommended: cost and debugging balloon with no research payoff; endangers December.

**The argument to present to the guide:**
> "Our contribution is the AI layer that catches faulty or spoofed sensor data before it becomes immutable. To *prove* it works we need controllable, repeatable, labelled fault injection — a real sensor won't spoof itself on cue for evaluation. So we propose simulation as the evaluation backbone, and we're happy to add one real ESP32 tracker as a physical proof-of-viability demo."

⚠️ **Also reconcile with the coordinator's earlier software-only rule before buying any hardware.**

---

## 12. Profit transparency (the differentiating angle)

The main objective, per the team: **maintaining profit transparency and traceability across all users, especially the farmer.** Indian farmers capture only a small fraction of the final consumer price; while blockchain traceability is saturated, **margin visibility across the chain is much less explored.**

**Implementation:** add a price field to each custody transfer so the contract records what each party paid and charged. Small change, big novelty payoff. The consumer QR view can then show the full price journey alongside the provenance journey.

⚠️ **Pitch this to the guide as a refinement of her framework** ("we'd like to extend your framework with price/margin transparency"), not as a title replacement.

---

## 13. Application features

1. **Traceability view** — full farm-to-fork journey per batch, cold-chain log, breach flags
2. **Price journey view** — what each party paid/charged; the farmer's share made visible
3. **Inventory dashboard** — stock by warehouse/retail node, expiry & spoilage alerts *(this is where the guide's inventory-system idea lives)*
4. **Consumer QR lookup** — scan → verified provenance read from chain; public, no wallet needed
5. **Review & rating** — consumer reviews bound to a verified batch; review text off-chain in Supabase, rating/hash anchored on-chain; feedback loops back to the farmer
6. **Role-gated actions** — MetaMask connect; each actor can only perform permitted transitions
7. **Anomaly/quarantine console** — view rejected readings with reasons (demonstrates the AI layer working)

---

## 14. Data model

**On-chain:** `Batch{id, crop, originFarm, harvestDate, metadataCID}` · `CustodyEvent{batchId, from, to, role, state, price, timestamp}` · `ConditionEvent{batchId, tempValue, breachFlag, aiValidityFlag, timestamp}` · `Policy{cropType, maxTemp, minTemp, maxTransitHours, humidityRange}` · review hash + rating

**Off-chain (Supabase):** `users_roles` · `farms` · `telemetry_raw` · `telemetry_quarantine{reading, reason_code, anomaly_score}` · `inventory{store_id, batch_id, qty, expiry}` · `reviews{batch_id, consumer_id, rating, comment}` · `devices` · `eval_runs`

---

## 15. Timeline (Aug → 31 Dec 2026)

| Month | Focus | Deliverable |
|---|---|---|
| **Aug** | Solidity/Hardhat ramp-up (use guide's expertise heavily); contract + data-model design; simulator skeleton; deploy minimal contract locally | Local contract + moving simulated tracker |
| **Sep** | Full contract set incl. `PolicyConfig` on **Amoy**; Hardhat tests; Next.js dApp with wallet connect + read/write; IPFS integration | Contracts live on Amoy + basic dApp |
| **Oct** | Simulator fault injection; FastAPI ingestion; **AI anomaly model**; oracle write flow (AI-validated commits) | End-to-end: sensor → AI → chain |
| **Nov** | Full integration; traceability + inventory + price dashboards; consumer QR + reviews; **(optional) ESP32**; **evaluate AI layer on injected faults** | Complete system + AI evaluation results |
| **Dec** | Hardening, full testing, user testing (team as users), documentation, paper draft with guide | **100% dev + testing complete** + paper draft |

⚠️ **Protect November** — integration is where timelines slip. Feature freeze 1 Nov.

---

## 16. Work split

- **Guide (co-contributor):** blockchain/consensus theory, novelty framing, related work (her survey as foundation), contract design review, venue selection, paper lead
- **Member 1 — Smart contracts:** Solidity, Hardhat tests, OpenZeppelin roles, Amoy deployment, gas optimization
- **Member 2 — dApp frontend:** Next.js, ethers.js/wagmi, wallet, dashboards, QR lookup, IPFS
- **Member 3 — AI trust layer:** FastAPI, anomaly models (IF → LSTM-AE), evaluation, metrics
- **Member 4 — Simulation + integration + data:** IoT simulator with fault injection, Supabase schema, oracle writer, end-to-end glue, (optional) ESP32, documentation

---

## 17. Evaluation plan (paper results)

- **AI layer:** precision/recall/F1 per fault type; false-alarm rate; detection latency
- **Blockchain:** transaction latency, gas cost per operation, throughput batched vs unbatched, storage saved by hybrid design
- **System:** end-to-end latency (sensor → dashboard); contract test coverage
- **Qualitative:** user testing with the 4 team members acting as the chain's roles

These map to the survey's stated performance indicators: **scalability, latency, throughput, security, cost efficiency, interoperability.**

---

## 18. Feasibility assessment

**Verdict: implementable by December.** Every component is at or below the difficulty of things the team has already shipped. Nothing requires inventing new ML methods or training models from scratch.

| Component | Difficulty | Notes |
|---|---|---|
| Solidity contracts | Medium (new language, simple logic) | Hardhat + OpenZeppelin templates get ~70% there; guide is the domain expert |
| Next.js dApp | Low | Core team skill, just pointed at a contract instead of a REST API |
| Polygon Amoy deploy | Low | Free, fast, well documented |
| IoT simulation | Low-Medium | A script emitting JSON on a timer |
| AI anomaly layer | Medium | Far easier than audio ML; Isolation Forest is in scikit-learn |
| IPFS + hybrid storage | Low-Medium | Plumbing, not research |
| Integration | Medium | The real work — November is reserved for it |

**Risk areas:** (1) the optional ESP32 — hardware debugging can eat a month; (2) November integration slip; (3) August Solidity ramp-up — use the guide's office hours aggressively.

---

## 19. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Solidity learning curve | Guide teaches the subject — use her heavily in Aug/Sep; start from OpenZeppelin templates |
| Hardware derailing timeline | Simulation-first; at most one device; decide by mid-Aug or drop it |
| Integration slip in Nov | Feature freeze 1 Nov; integrate incrementally from Oct |
| Scope creep from an ambitious guide | Agree scope in writing at meeting 1; park extras as "future work" |
| Novelty challenged at review | Lead with customized contracts + AI-validated oracle + price transparency + working evaluated system; cite her survey as the gap source |
| Testnet/faucet issues | Amoy faucets rate-limit — collect test POL early; use local Hardhat network for daily dev |

---

## 20. Open questions for the guide

1. Confirm scope: perishable-goods agricultural cold chain — which crop/vertical?
2. **Is the AI trust layer in scope**, and should the title reflect it? *(Her title contains no AI/ML term — either the AI layer sits inside the framework as a component, or the title extends slightly, e.g. "…with Customized Smart Contracts and AI-Validated Oracles for…")*
3. **Is the price/profit-transparency angle acceptable** as an extension of her framework?
4. **IoT: simulation-first + optional single ESP32 — agreed?**
5. What exactly does "customized smart contracts" mean to her — is `PolicyConfig`-style parameterization the right interpretation?
6. Stack: Polygon Amoy + Hardhat + Solidity + Next.js + FastAPI — any preference otherwise?
7. Her contribution split and target venue/deadline
8. Reconcile with the coordinator's software-only rule if hardware is added

---

## 21. Diagrams

**Already created:**
- System architecture SVG (4 layers, mapped to survey phases + research gaps) — `docs/diagrams/architecture/trustlayer-architecture.svg`
- Simplified system design SVG (4 roles, goods flow, review loop) — `docs/diagrams/architecture/simplified-system-design.svg` *(⚠️ predates the 5-account/merged-Logistics decision — needs updating)*
- Sequence diagram (single, simple, whole project) — Whimsical
- Detailed sequence diagrams SD-1/SD-2/SD-3 — Whimsical *(too complex for the report; keep as appendix/implementation reference)*

**Style note:** the team prefers **simple, readable diagrams** — plain language, few participants, no method signatures. Earlier detailed versions were rejected as "a mess." Match the clean style of the team's own flowchart/activity diagrams.

**Still to create:**
- Level 0 DFD (context), Level 1 DFD, Level 2 DFD (AI validation + custody transfer)
- **ER Diagram** (off-chain schema)
- Use Case Diagram (5 actors)
- Class Diagram (contracts as classes)
- Activity Diagram — batch lifecycle
- State Chart — Batch states (`Registered → InTransit → Stored → AtRetail → Sold → Reviewed`, + `Flagged`/`Recalled`)
- Deployment Diagram
- Smart Contract Interaction Diagram
- On-chain vs Off-chain Data Partition Diagram
- AI Pipeline / Model Flow Diagram
- Fault Injection & Evaluation Flow *(methodology figure for the paper)*
- Gantt Chart, WBS

*Priority if short on time: Level 0/1 DFD, ER, Class, Sequence, State Chart, Deployment.*

---

## 22. Reference base

**Primary foundation:** the guide's survey (60 studies reviewed, 15 compared in depth), covering blockchain foundations, IoT/digital-twin integration, smart contracts & governance, cryptography/security/resilience, and sustainability/future directions. Its **Research Gaps** section is the direct source of this project's positioning — especially Gap 4 (static hard-coded contracts) and **Gap 5 (oracle/off-chain data trust)**.

**Supporting papers from her reference list** (for the related-work section): Aggarwal et al. (agri-food traceability), Wu et al. (high-efficiency blockchain traceability), Naqvi et al. (IoT-triggered smart contracts in SCM), Yigit & Dag (Ethereum/Solidity process automation), Lin et al. (decentralized storage confidentiality), Qatbi & Rathinam (blockchain access control for IoT-era data privacy), Mohamed et al. (ML-based anomaly/exploit detection).

---

## 23. Tactical notes for guide interactions

- **Attribute the foundation to her:** "we read your survey; we're building on the gaps you identified." She sees her work extended, not corrected.
- **Present options with a reasoned default**, never an argument — especially on the IoT decision.
- **Speak in specifics** (Amoy, Hardhat, Isolation Forest, ESP32) — competence earns latitude with her personality.
- **Give her the senior-architect lane** (theory + paper) and keep build execution with the team; equal contribution then feels natural.
- Don't relitigate the previously-shortlisted alternative project. This is the project now.
