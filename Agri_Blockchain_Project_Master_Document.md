# A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains

**Master project document — Final Year BE (AI & Data Science), Terna Engineering College, Navi Mumbai (Mumbai University)**

| | |
|---|---|
| **Project title** | A Decentralized IoT-Blockchain Framework with Customized Smart Contracts for Transparent and Traceable Agricultural Supply Chains |
| **Guide** | Prof. Shraddha Sushant Rokade (also co-contributor; author of the foundational survey) |
| **Team** | 4 members |
| **Domain** | Blockchain · AI on IoT · Machine Learning |
| **SDGs** | 2 (Zero Hunger) · 12 (Responsible Consumption & Production) · 9 (Industry, Innovation & Infrastructure) |
| **Build window** | August → **31 December 2026** (100% dev + testing complete) |
| **Paper** | Drafted Dec; target spring IEEE venue (Sem VIII window) |
| **Foundation** | Guide's survey: *A Comprehensive Survey on Transparency and Traceability in Agricultural Supply Chain Management Using Customized Smart Contracts and Blockchain Technologies* |

---

## 0. Point to settle in the first meeting

The title names **IoT + Blockchain + Customized Smart Contracts** — it does **not** name AI/ML. Our proposed research contribution (the AI trust layer for oracle validation) therefore needs to be positioned deliberately. Two options to put to ma'am:

- **Option 1 (recommended):** keep the title; the AI trust layer is a **component inside the framework** (the oracle-validation module). The paper's novelty rests on *customized smart contracts + AI-validated oracle input*.
- **Option 2:** extend the title slightly, e.g. *"…with Customized Smart Contracts and AI-Validated Oracles for…"*.

Also settle: **is the AI layer in scope at all**, or does she want a pure blockchain+IoT framework? If pure, our differentiator becomes the *customization* of the smart contracts (parameterized, policy-driven, upgradeable) rather than ML — still viable, but we should know now.

**Second decision to settle:** IoT — **simulation-first backbone** (recommended) vs adding one physical device. Full argument in §5.

---

## 1. Problem statement

Agricultural supply chains in India are fragmented across many independent actors — farmers, aggregators, processors, transporters, wholesalers, retailers, consumers — with no shared, trustworthy record. This causes:

- **Food fraud and adulteration**, counterfeit produce, and mislabelled provenance.
- **Cold-chain failures** that spoil perishables, with no way to establish who was responsible.
- **Delayed recalls**, because a contaminated batch cannot be traced to its origin quickly.
- **Information asymmetry** — the consumer cannot verify origin, and the farmer cannot prove quality.
- **No trusted audit trail** for disputes between parties who do not trust one another.

These are precisely the deficiencies catalogued in the guide's survey across 60 reviewed studies.

## 2. Proposed solution

A **decentralized traceability framework** where:

1. **IoT sensors** report location + environmental conditions (temperature, humidity) at every stage of the agricultural chain.
2. An **AI trust layer** validates each sensor reading *before* it is committed on-chain — rejecting faulty, drifted, or spoofed data so that untrustworthy data never becomes immutable.
3. **Customized smart contracts** encode the domain rules of an agricultural chain — custody transfer, quality thresholds, cold-chain breach handling, role permissions — and execute them automatically.
4. A **dApp + dashboard + consumer QR lookup** exposes the verified farm-to-fork journey to every stakeholder.

### Why blockchain is genuinely necessary here
Multiple mutually-distrusting parties, real disputes over responsibility, and a need for a tamper-evident shared audit trail. This is a legitimate trust boundary — not a case of blockchain being applied decoratively. (Be ready for this question; it is the first one a reviewer asks.)

---

## 3. Research gaps addressed (from the guide's survey)

| Gap (from survey) | How this project addresses it |
|---|---|
| **1. Scalability & performance** | Hybrid on/off-chain design; batched writes; Layer-2 (Polygon) instead of L1; only hashes + events on-chain |
| **2. Interoperability & standardization** | **Out of scope** — acknowledged as future work (being explicit here is a strength) |
| **3. Data privacy & confidentiality** | Sensitive business data off-chain; only hashes/CIDs and flags on-chain |
| **4. Smart-contract security & reliability** | OpenZeppelin `AccessControl`, role gating, full Hardhat test suite, *customized/parameterized* contracts (not hard-coded), optional LLM-assisted audit |
| **5. Oracle & off-chain data trust ★** | **Our core contribution** — the AI trust layer. The survey states blockchain guarantees the *integrity* of captured data but not its *truthfulness*; an ML gatekeeper decides what deserves to be recorded immutably |

**Novelty positioning (be honest):** blockchain agri-traceability is a saturated field. Our defensible contribution is the combination of (a) **customized, parameterized smart contracts** for agricultural policy rules, and (b) an **AI-validated oracle layer** targeting Gap 5 — plus a working, evaluated, deployed system. We do **not** claim a new consensus mechanism or state-of-the-art performance.

---

## 4. System architecture

Four layers, mapped to the survey's literature phases (see `Blockchain_AI_TrustLayer_Architecture.svg`):

```
LAYER 1 · DATA CAPTURE (IoT)            ← Survey Phase II
   simulated sensor fleet (+ optional 1 real ESP32)
   emits {batch_id, lat, lng, temp, humidity, timestamp}
        │ MQTT / HTTPS
        ▼
LAYER 2 · AI TRUST LAYER  ★ contribution ← addresses Gap 5
   FastAPI ingestion → anomaly model → verdict
   VALID → oracle    |    ANOMALOUS → quarantine (off-chain)
        │ validated events only
        ▼
LAYER 3 · BLOCKCHAIN & CUSTOMIZED SMART CONTRACTS  ← Phases I & III
   Oracle writer → Solidity contracts on Polygon Amoy
        │
        ▼
LAYER 4 · APPLICATION (dApp)             ← Phase V
   traceability view · inventory dashboard · consumer QR · role-gated actions

OFF-CHAIN: Supabase (telemetry, inventory, quarantine) + IPFS (docs, images → CID on-chain)
```

---

## 5. The IoT decision: simulation vs physical device

### Recommended: **simulation-first backbone, one optional physical device**

**Option A — Software simulation (backbone).** A script emulates N trackers moving along real routes, emitting telemetry to the ingestion endpoint, **with on-demand fault injection**: GPS teleports, temperature spikes/drift, sensor dropouts, replayed/spoofed packets.
- *Pros:* zero cost, fully reproducible, no hardware skill needed, comfortably finishes by December, and — critically — **it is the only way to rigorously evaluate the AI trust layer**, because faults must be controllable and labelled.
- *Cons:* not physical. Academically standard and defensible for a proof-of-concept + evaluation.

**Option B — Hybrid: + one real device (diplomatic compromise).** One **ESP32 + NEO-6M GPS + DHT22** feeding the same pipeline over WiFi. Cost ~₹1,500–3,000.
- *Pros:* physical proof of viability; keeps the bulk simulated so scope stays safe.
- *Cons:* hardware debugging (WiFi, GPS cold start, power), ~1 member part-time 2–3 weeks, unreliable indoor GPS, ~1 week procurement.

**Option C — Full physical fleet.** Not recommended: cost and debugging balloon with no research payoff, and it endangers the December deadline.

### The argument to present
> "Our contribution is the AI layer that catches faulty or spoofed sensor data before it becomes immutable. To *prove* it works we need controllable, repeatable, labelled fault injection — a real sensor won't spoof itself on cue for evaluation. So we propose simulation as the evaluation backbone, and we're happy to add one real ESP32 tracker as a physical proof-of-viability demo."

**Also reconcile with the coordinator's earlier software-only rule before buying hardware.**

---

## 6. Customized smart contracts (the title's emphasis)

"Customized" is central to the title, so the contracts must be **parameterized and policy-driven**, not hard-coded — directly answering the survey's criticism that *"many existing implementations use static and hard-coded smart contracts which are hard to modify post-deployment."*

**Contract set (Solidity ^0.8.x):**

| Contract | Responsibility |
|---|---|
| `ProductRegistry` | Register batch/lot identity, crop type, origin (farm), harvest date, metadata CID |
| `CustodyTransfer` | Record custody handoffs: farmer → aggregator → processor → distributor → retailer → consumer |
| `ColdChainMonitor` | Log validated environmental events; raise breach flags; store the AI validity verdict |
| `PolicyConfig` ★ | **The "customization" contract** — per-crop, per-route configurable thresholds (max temp, max transit hours, humidity range), updatable by an authorized role without redeploying |
| `AccessControlRoles` | OpenZeppelin roles: `FARMER`, `AGGREGATOR`, `PROCESSOR`, `TRANSPORTER`, `RETAILER`, `AUDITOR`, `ORACLE` |

**Design principles:** events for all state changes (cheap, indexable); store hashes/CIDs not blobs; batch oracle writes to cut gas; no unbounded loops; `require`-based guards; reentrancy-safe patterns.

---

## 7. AI trust layer (research contribution)

- **Input:** each incoming reading, plus a rolling time-series window per device.
- **Checks:**
  - *Physical plausibility* — implied speed between GPS points, temperature rate-of-change limits.
  - *Statistical/ML anomaly detection* — **v1: Isolation Forest** (+ rule bounds); **v2: LSTM-autoencoder** on the sensor time series (reconstruction error → anomaly score).
  - *Integrity* — device signature/auth, replay detection via timestamp/nonce.
- **Output:** `VALID` → forwarded to the oracle writer for on-chain commit (with a validity flag); `ANOMALOUS` → quarantined off-chain with a reason code and full audit trail.
- **Evaluation:** precision / recall / F1 on injected faults, per fault type; false-alarm rate on clean data; latency added per reading. (This is the results table for the paper.)
- **Optional stretch:** LLM-assisted smart-contract audit (re-entrancy, access control, logic flaws) — targets Gap 4. Keep as stretch, not core.

---

## 8. Technology stack

**Blockchain**
- Solidity ^0.8.x · **Hardhat** (JS/TS — fits the team) · **OpenZeppelin Contracts**
- **Polygon Amoy testnet** (chain ID **80002**, Sepolia-anchored, ~2 s blocks). *Mumbai testnet is deprecated — Amoy is the current one.* Test **POL** from Alchemy / QuickNode faucets.
- MetaMask · Polygonscan (Amoy) for verification

**Frontend / dApp**
- **Next.js 14 + TypeScript**, Tailwind + shadcn/ui
- **ethers.js v6** (or wagmi + viem); optional RainbowKit for wallet UI
- Deployed on **Vercel**

**AI trust layer**
- **FastAPI** (Python 3.11) · scikit-learn (Isolation Forest) · PyTorch/Keras (LSTM-AE) · pandas/numpy
- **MQTT** (Mosquitto) or HTTPS ingestion
- Deployed on **Render / Railway**

**IoT simulation**
- Python/Node simulator; route waypoints from a maps/routing API; configurable fault-injection module
- *(Optional hardware:* ESP32 + NEO-6M GPS + DHT22, Arduino/PlatformIO, WiFi → MQTT*)*

**Off-chain storage (hybrid)**
- **Supabase (Postgres)** — raw telemetry history, inventory, quarantine log, accounts, dashboard queries
- **IPFS (Pinata / web3.storage)** — certificates, invoices, images; only the **CID** goes on-chain

---

## 9. Data model (core entities)

**On-chain:** `Batch{id, crop, originFarm, harvestDate, metadataCID}` · `CustodyEvent{batchId, from, to, role, timestamp}` · `ConditionEvent{batchId, tempHash/value, breachFlag, aiValidityFlag, timestamp}` · `Policy{cropType, maxTemp, minTemp, maxTransitHours, humidityRange}`

**Off-chain (Supabase):** `telemetry_raw` · `telemetry_quarantine{reading, reason_code, anomaly_score}` · `inventory{store_id, batch_id, qty, expiry}` · `devices` · `users_roles` · `eval_runs`

---

## 10. Application features

1. **Traceability view** — full farm-to-fork journey per batch, with the cold-chain log and any breach flags.
2. **Inventory dashboard** — stock by warehouse/retail node, expiry and spoilage alerts (this is where the guide's inventory-system idea lives).
3. **Consumer QR lookup** — scan a pack → verified provenance read from chain; public, no wallet needed.
4. **Role-gated actions** — MetaMask connect; each actor can only perform their permitted transitions.
5. **Anomaly/quarantine console** — view rejected readings with reasons (demonstrates the AI layer working).

---

## 11. Timeline (Aug → 31 Dec 2026)

| Month | Focus | Deliverable |
|---|---|---|
| **Aug** | Solidity/Hardhat ramp-up (use guide's expertise); contract + data-model design; simulator skeleton; deploy minimal contract locally | Local contract + moving simulated tracker |
| **Sep** | Full contract set incl. `PolicyConfig` on **Amoy**; Hardhat tests; Next.js dApp with wallet connect + read/write; IPFS integration | Contracts live on Amoy + basic dApp |
| **Oct** | Simulator fault injection; FastAPI ingestion; **AI anomaly model**; oracle write flow (AI-validated commits) | End-to-end: sensor → AI → chain |
| **Nov** | Full integration; traceability + inventory dashboards; consumer QR; **(optional) ESP32**; **evaluate AI layer on injected faults** | Complete system + AI evaluation results |
| **Dec** | Hardening, full testing, user testing (team as users), documentation, paper draft with guide | **100% dev + testing complete** + paper draft |

**Protect November** — integration is where timelines slip. No new features after 1 Nov.

---

## 12. Work split

- **Guide (co-contributor):** blockchain/consensus theory, novelty framing, related work (her survey as foundation), contract design review, venue selection, paper lead.
- **Member 1 — Smart contracts:** Solidity, Hardhat tests, OpenZeppelin roles, Amoy deployment, gas optimization.
- **Member 2 — dApp frontend:** Next.js, ethers.js/wagmi, wallet, traceability + inventory dashboards, QR lookup, IPFS.
- **Member 3 — AI trust layer:** FastAPI, anomaly models (IF → LSTM-AE), evaluation, metrics.
- **Member 4 — Simulation + integration + data:** IoT simulator with fault injection, Supabase schema, oracle writer, end-to-end glue, (optional) ESP32, documentation.

---

## 13. Evaluation & results plan (what goes in the paper)

- **AI layer:** precision/recall/F1 per fault type; false-alarm rate; detection latency.
- **Blockchain:** transaction latency, gas cost per operation type, throughput under batched vs unbatched writes, storage saved by the hybrid on/off-chain design.
- **System:** end-to-end latency (sensor → visible on dashboard); contract test coverage.
- **Qualitative:** user testing with the 4 team members acting as the chain's roles.
- These map directly onto the survey's stated performance indicators: **scalability, latency, throughput, security, cost efficiency, interoperability.**

---

## 14. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Solidity learning curve | Guide teaches the subject — use her office hours aggressively in Aug/Sep; start from OpenZeppelin templates |
| Hardware derailing the timeline | Simulation-first; at most one device; decide by mid-Aug or drop it |
| Integration slip in Nov | Feature freeze 1 Nov; integrate incrementally from Oct, not all at once |
| Scope creep from an ambitious guide | Agree the scope in writing at meeting 1; park extras as "future work" in the paper |
| Novelty challenged at review | Lead with customized/parameterized contracts + AI-validated oracle + working evaluated system; cite her survey as the gap source |
| Testnet/faucet issues | Amoy faucets can rate-limit — collect test POL early; keep a local Hardhat network for daily dev |

---

## 15. Meeting agenda (first guide discussion)

1. Confirm scope: agricultural farm-to-fork chain (crop type/vertical?).
2. **Is the AI trust layer in scope** — and should the title reflect it? (§0)
3. **IoT: simulation-first + optional single ESP32 — agreed?** (§5)
4. Stack: Polygon Amoy + Hardhat + Solidity + Next.js + FastAPI — any preference otherwise?
5. What exactly does "customized smart contracts" mean to her — is `PolicyConfig`-style parameterization the right interpretation?
6. Her contribution split and target venue/deadline.
7. Reconcile with the coordinator's software-only rule if hardware is added.

---

## 16. Reference base

Primary foundation: the guide's survey (60 studies reviewed, 15 compared in depth), covering blockchain foundations, IoT/digital-twin integration, smart contracts and governance, cryptography/security/resilience, and sustainability/future directions. Its **Research Gaps and Open Challenges** section is the direct source of this project's positioning — especially Gap 4 (smart-contract security, static hard-coded contracts) and **Gap 5 (trust in off-chain data and oracle mechanisms)**.

Supporting literature to pull from her reference list for our related-work section: Aggarwal et al. (agri-food traceability), Wu et al. (high-efficiency blockchain traceability), Naqvi et al. (IoT-triggered smart contracts in SCM), Yigit & Dag (Ethereum/Solidity process automation), Lin et al. (decentralized storage confidentiality), Qatbi & Rathinam (blockchain access control for IoT-era data privacy), Mohamed et al. (ML-based anomaly/exploit detection).
