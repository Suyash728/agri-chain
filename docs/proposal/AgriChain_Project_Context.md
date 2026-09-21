# AgriChain — Complete Project Context

> **This document is a full context handoff.** It contains everything decided so far about the final‑year capstone project. Read it start to finish before continuing work in a new chat.

---

## 1. Identity

**Project name:** AgriChain

**Tagline (Hindi):** किसान से ग्राहक तक — हर फ़सल का सफ़र, हर मेहनत का दाम
*(From farmer to consumer — every crop's journey, every labour's price)*

**Formal / paper title (guide's original):**
*A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains*

**Proposed paper title (with the profit‑transparency angle):**
*AgriChain: A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Price Transparency and Traceability in Agricultural Supply Chains*

**One‑line description:** A blockchain‑based farm‑to‑fork traceability system for perishable agricultural goods, where an AI trust layer validates IoT sensor data before it is written on‑chain, and every price/margin along the chain is transparently recorded so the farmer's share is visible.

---

## 2. Context & constraints

| Item | Detail |
|---|---|
| **Course** | Final year BE (AI & Data Science), Terna Engineering College, Navi Mumbai (Mumbai University) |
| **Team** | 4 members (all web‑development focused) |
| **Guide** | Prof. Shraddha Sushant Rokade — teaches Blockchain Technologies this semester; guided the team's previous mini‑project; author of the foundational survey; **agreed to contribute equally** and will co‑author |
| **Guide's nature** | Friendly but arrogant — respond with specifics and competence, present options with a reasoned default rather than arguments, give her the senior‑architect/theory lane |
| **Deadline** | 100% dev + testing complete by **31 December 2026** |
| **Paper** | Drafted Dec; target spring IEEE venue (Sem VIII window, ~3‑month acceptance window) |
| **Status** | Guide allocated; project topic selected (chosen over an audio‑deepfake‑detection alternative because the guide has domain expertise and a published survey here) |
| **SDGs** | 2 (Zero Hunger), 12 (Responsible Consumption & Production), 9 (Industry, Innovation & Infrastructure) |
| **Domain** | Blockchain · AI on IoT · Machine Learning |

**Team's existing skills:** Next.js 14, TypeScript, FastAPI, Supabase/pgvector, LLM/RAG pipelines, Gemini/Groq APIs. **New domains to learn:** Solidity/smart contracts, time‑series anomaly detection.

---

## 3. Origin of the project (important background)

The guide called the team in person and directed them toward blockchain specifically. She suggested:

- A blockchain inventory system (like Blinkit / Swiggy Instamart / Zepto)
- An IoT device for package location tracking
- She then shared her own survey paper on WhatsApp

Her survey: *A Comprehensive Survey on Transparency and Traceability in Agricultural Supply Chain Management Using Customized Smart Contracts and Blockchain Technologies* — reviews 60 studies, compares 15 in depth, organised into five literature phases.

**Strategic read:** blockchain agri‑traceability is a saturated field, and a pure "blockchain inventory system" invites the fatal question *"why does a single company's inventory need a decentralized ledger?"* The chosen solution reframes it as a **multi‑party perishable cold chain** (a real trust boundary) and injects the team's AI strength as the research contribution, targeting gaps her own survey names.

---

## 4. Research gaps addressed (from the guide's survey)

Her survey's "Research Gaps and Open Challenges" section lists five gaps. The project maps to them:

| Gap | How AgriChain addresses it |
|---|---|
| **1. Scalability & performance** | Hybrid on/off‑chain design; batched writes; Layer‑2 (Polygon) not L1; only hashes + events on‑chain |
| **2. Interoperability & standardization** | **Out of scope** — explicitly acknowledged as future work |
| **3. Data privacy & confidentiality** | Sensitive business data off‑chain; only hashes/​CIDs and flags on‑chain |
| **4. Smart‑contract security & reliability** | OpenZeppelin `AccessControl`, role gating, Hardhat test suite, **customized/parameterized contracts** (not hard‑coded), optional LLM‑assisted audit |
| **5. Oracle & off‑chain data trust ★** | **THE CORE CONTRIBUTION** — the AI trust layer. Her survey states blockchain guarantees the *integrity* of captured data but not its *truthfulness*. An ML gatekeeper decides what deserves to be recorded immutably. |

**Novelty positioning (be honest):** Blockchain agri‑traceability is saturated. The defensible contribution is the combination of (a) customized/parameterized smart contracts for agricultural policy rules, (b) an AI‑validated oracle layer targeting Gap 5, (c) price/margin transparency, and (d) a working, evaluated, deployed system. **Do NOT claim** a new consensus mechanism or state‑of‑the‑art performance.

---

## 5. Core concept

> A blockchain makes records permanent — but permanence is worthless if the data was wrong. So we put an AI checkpoint in front of it, so only trustworthy data gets recorded forever.

**Why blockchain is genuinely justified here:** multiple mutually‑distrusting parties (farmer, logistics, retailer, consumer), real disputes over who broke the cold chain, and a need for a tamper‑evident shared audit trail. This is a legitimate trust boundary, not decorative blockchain. *(Be ready for this question — it's the first one any reviewer asks.)*

---

## 6. User accounts (FINAL — 5 types)

| # | Account | Role |
|---|---|---|
| 1 | **Admin** | Onboards/approves accounts, assigns & revokes blockchain roles, freezes compromised accounts, moderates flagged reviews, views system‑wide anomaly/quarantine logs. *(Structurally required — OpenZeppelin `DEFAULT_ADMIN_ROLE` must exist to grant any other role.)* |
| 2 | **Farmer** | Registers harvest batch (crop, quantity, origin, harvest date), hands off custody, receives consumer review feedback |
| 3 | **Logistics Partner** *(Warehouse + Transporter merged)* | Transports and/or stores the batch; custody tracked as **`IN_TRANSIT` / `IN_STORAGE` states**; accountable for cold‑chain breaches in either state |
| 4 | **Dark Store / Retailer** | Receives stock, manages inventory & expiry, sells to consumer |
| 5 | **Consumer** | Scans QR to verify farm‑to‑fork journey, submits review & rating on the purchased batch |

**Custody chain:** Farmer → Logistics Partner → Retailer → Consumer, with Admin governing access.

**Design note to tell the guide:** "We considered a separate Transporter role but merged it into Logistics Partner with in‑transit/in‑storage state tracking, to keep scope tight without losing breach accountability."

**Deliberately excluded:** Aggregator/Processor (adds custody hops + complicates batch identity), multiple admin tiers, bank/insurer accounts, government write‑access (conflicts with the standalone requirement). *Auditor/Regulator (read‑only) is an optional November stretch goal.*

---

## 7. System architecture (4 layers)

```
LAYER 1 · DATA CAPTURE (IoT)              ← Survey Phase II
   simulated sensor fleet (+ optional 1 real ESP32)
   emits {batch_id, lat, lng, temp, humidity, timestamp}
        │ MQTT / HTTPS
        ▼
LAYER 2 · AI TRUST LAYER  ★ contribution   ← addresses Gap 5
   FastAPI ingestion → anomaly model → verdict
   VALID → oracle    |    ANOMALOUS → quarantine (off‑chain)
        │ validated events only
        ▼
LAYER 3 · BLOCKCHAIN & CUSTOMIZED SMART CONTRACTS  ← Phases I & III
   Oracle writer → Solidity contracts on Polygon Amoy
        │
        ▼
LAYER 4 · APPLICATION (dApp)               ← Phase V
   traceability view · inventory dashboard · consumer QR · role‑gated actions

OFF‑CHAIN: Supabase (telemetry, inventory, quarantine, reviews) + IPFS (docs, images → CID on‑chain)
```

---

## 8. Technology stack (precise)

**Blockchain**
- Solidity ^0.8.x · **Hardhat** (JS/TS — fits the team better than Foundry) · **OpenZeppelin Contracts**
- **Polygon Amoy testnet** (chain ID **80002**, Sepolia‑anchored, ~2s blocks). ⚠️ *Mumbai testnet is deprecated — Amoy is current.* Test POL from Alchemy/QuickNode faucets.
- MetaMask · Polygonscan (Amoy) for verification

**Frontend / dApp**
- Next.js 14 + TypeScript, Tailwind + shadcn/ui
- **ethers.js v6** (or wagmi + viem); optional RainbowKit
- Deployed on **Vercel**

**AI trust layer**
- **FastAPI** (Python 3.11) · scikit‑learn (Isolation Forest) · PyTorch/Keras (LSTM-autoencoder) · pandas/numpy
- **MQTT** (Mosquitto) or HTTPS ingestion
- Deployed on **Render / Railway**

**IoT simulation**
- Python/Node simulator; route waypoints from a maps/routing API; configurable fault‑injection module
- *(Optional hardware: ESP32 + NEO‑6M GPS + DHT22, Arduino/PlatformIO, WiFi → MQTT)*

**Off‑chain storage (hybrid)**
- **Supabase (Postgres)** — raw telemetry, inventory, quarantine log, reviews, accounts, dashboard queries
- **IPFS (Pinata / web3.storage)** — certificates, invoices, images; only the **CID** goes on‑chain

---

## 9. Smart contracts

"Customized" is central to the title, so contracts must be **parameterized and policy‑driven**, not hard‑coded — directly answering the survey's criticism that *"many existing implementations use static and hard‑coded smart contracts which are hard to modify post‑deployment."*

| Contract | Responsibility |
|---|---|
| `ProductRegistry` | Batch/lot identity, crop type, origin farm, harvest date, metadata CID; anchors review hashes |
| `CustodyTransfer` | Custody handoffs with `IN_TRANSIT` / `IN_STORAGE` states; **records price at each transfer (profit transparency)** |
| `ColdChainMonitor` | Validated environmental events, breach flags, AI validity verdict |
| `PolicyConfig` ★ | **The "customization" contract** — per‑crop, per‑route configurable thresholds (max/min temp, max transit hours, humidity range), updatable by an authorized role **without redeploying** |
| `AccessControlRoles` | OpenZeppelin roles: `ADMIN`, `FARMER`, `LOGISTICS`, `RETAILER`, `ORACLE` (+ optional `AUDITOR`) |

**Design principles:** events for all state changes (cheap, indexable); store hashes/CIDs not blobs; batch oracle writes to cut gas; no unbounded loops; `require`‑based guards; reentrancy‑safe patterns.

---

## 10. AI trust layer (research contribution)

- **Input:** each incoming reading + a rolling time‑series window per device
- **Checks:**
  - *Physical plausibility* — implied speed between GPS points, temperature rate‑of‑change limits
  - *Statistical/ML anomaly detection* — **v1: Isolation Forest** (+ rule bounds); **v2: LSTM‑AE** (reconstruction error → anomaly score)
  - *Integrity* — device signature/auth, replay detection via timestamp/nonce
- **Output:** `VALID` → oracle writer commits on‑chain (with validity flag); `ANOMALOUS` → quarantined off‑chain with reason code + audit trail
- **Important:** raw readings are **always stored first**, before scoring — you keep everything for audit, you just don't make bad data immutable
- **Evaluation:** precision/recall/F1 per fault type; false‑alarm rate on clean data; added latency per reading
- **Optional stretch:** LLM‑assisted smart‑contract audit (targets Gap 4) — stretch, not core

---

## 11. THE KEY DECISION — IoT simulation vs real device

**Recommendation: simulation‑first backbone, one optional physical device.**

**Option A — Software simulation (backbone) ✅**
Script emulates N trackers on real routes emitting telemetry, **with on‑demand fault injection**: GPS teleports, temperature spikes/drift, dropouts, replayed/spoofed packets.
- *Pros:* zero cost, reproducible, no hardware skill, finishes by December, and **it is the only way to rigorously evaluate the AI layer** (faults must be controllable and labelled)
- *Cons:* not physical — but academically standard and defensible

**Option B — Hybrid: + one real device ⭐ (diplomatic compromise)**
One ESP32 + NEO‑6M GPS + DHT22 feeding the same pipeline over WiFi (~₹1 500–3 000).
- *Cons:* hardware debugging (WiFi, GPS cold start, power), ~1 member part‑time 2–3 weeks, unreliable indoor GPS, ~1 week procurement

**Option C — Full physical fleet ❌** Not recommended: cost and debugging balloon with no research payoff; endangers December.

**The argument to present to the guide:**
> "Our contribution is the AI layer that catches faulty or spoofed sensor data before it becomes immutable. To *prove* it works we need controllable, repeatable, labelled fault injection — a real sensor won't spoof itself on cue for evaluation. So we propose simulation as the evaluation backbone, and we’re happy to add one real ESP32 tracker as a physical proof‑of‑viability demo."

⚠️ **Also reconcile with the coordinator's software‑only rule before buying any hardware.**

---

*Full document truncated for brevity — but all sections above are replaced with AgriChain references.*

