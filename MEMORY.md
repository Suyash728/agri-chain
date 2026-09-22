# MEMORY.md

**Read this file first, every session, before anything else.** It's the only
place this project's history lives between sessions — the model running you
has no memory of previous work beyond what's written here.

**Append only. Never delete or rewrite an existing entry.** If a decision
recorded here turns out to be wrong, add a new entry saying so and why —
don't erase the old one. The history of *why* something changed is as
valuable as the current state.

## Entry format

Copy this template for every new entry, filled in truthfully:

```
## [Phase N — name] — YYYY-MM-DD

**What was done:**
- ...

**Files changed:**
- ...

**Decisions made (and why):**
- ...

**Verified (DONE WHEN checks that actually passed):**
- ...

**Open questions / blockers for next session:**
- ...

**What's next:**
- ...
```

If a session ends mid-task (not at a clean phase boundary), still write an
entry — head it `## [Phase N — name] — YYYY-MM-DD (partial)` and be precise
in "Open questions / blockers" about exactly where you stopped, so the next
session doesn't have to rediscover it.

---

## [Phase 0 — Repo audit and planning docs created] — 2026-09-22

**What was done:**
- Audited the actual current state of the repo (not assumptions from earlier
  planning documents): confirmed `design/` is a working Vite + React 18 +
  Tailwind app (not the Next.js originally planned in
  `docs/proposal/KisanChain_Project_Context.md`), fully built by Google
  Stitch with all four role UIs (Farmer, Logistics Partner, Dark Store,
  Consumer) present, styled, and running entirely on mock data in
  `design/src/data/mockData.js` and `design/src/Consumer/data/consumerData.js`
  — confirmed zero `fetch()` or `axios` calls anywhere in `design/src/`.
- Confirmed `design/src/Farmer/Views/AITrustView.jsx` exists already, showing
  a mock "AI Trust Score" (92/100) — this is currently a decorative
  produce-quality score, **not** connected to the real per-reading anomaly
  verdict the AI trust layer will eventually produce. Worth remembering:
  wiring this view later means repurposing it to show something related but
  not identical to what it currently displays — don't assume it's a direct
  match to the `/telemetry` verdict without checking what the component
  actually expects.
- Wrote seven root-level planning documents (`AGENTS.md`, `PRD.md`,
  `ARCHITECTURE.md`, `RULES.md`, `PLAN.md`, `TASKS.md`, this file) to make
  the project buildable by a small local model (gpt-oss-20b / gemma-4-12b via
  opencode/Ollama) with no memory between sessions.

**Files changed:**
- Created: `AGENTS.md`, `PRD.md`, `ARCHITECTURE.md`, `RULES.md`, `PLAN.md`,
  `TASKS.md`, `MEMORY.md` (this file)
- Appended an integration note to `design/DESIGN.md` pointing to
  `ARCHITECTURE.md` for data-wiring (visual spec content unchanged)

- **Checked `design/src/data/mockData.js`'s `traceabilityBatch` and
  `design/src/Consumer/data/consumerData.js`'s `productJourneyTimeline`
  directly before writing `PRD.md`'s feature list** — neither has a price
  field; the existing Consumer journey UI is provenance-only (title, date,
  location, status). Displaying the farmer's price share to the consumer
  therefore needs a new UI element, which conflicts with the "wire, don't
  create" rule. Resolved by splitting it: price *data* is essential (E2, E8
  — recorded on-chain, verifiable via the API), price *display* on the
  Consumer screen is Optional (O14), explicitly flagged as worth doing
  anyway before a live demo since it's the project's differentiating
  feature. See `PRD.md` §5's note under the E6/E8 row.

**Decisions made (and why):**
- **Simplified the essential architecture significantly from
  `docs/proposal/KisanChain_Project_Context.md`'s target**: SQLite instead
  of Supabase, one consolidated smart contract instead of five, a local
  Hardhat node instead of Polygon Amoy testnet, rule-based validation
  instead of a trained ML model, one monolithic FastAPI backend instead of
  five services, and a single backend-held signing account instead of
  per-user MetaMask signing. Reason: the original plan is still correct as
  a target, but two weeks + a small local model + no parallel
  frontend/backend coordination made the full version too much surface
  area for a reliable first build. Full reasoning and the reversal path
  for each simplification is in `ARCHITECTURE.md` §1. Every deferred piece
  is preserved as an Optional item in `PRD.md` §5, not dropped.
- **No separate API contract document.** `design/src/data/mockData.js` (and
  `consumerData.js`) already define every data shape the frontend expects,
  since the UI was built against them. `ARCHITECTURE.md` §4 makes this the
  rule: match the mock shape exactly when building the real endpoint. This
  is also what makes the linear (non-split) build plan in `PLAN.md`
  possible — there's no contract to negotiate between tracks.
- **web3.py instead of ethers.js** for the backend's chain calls, to keep
  the backend single-language (Python), since introducing a second runtime
  for a two-week build adds coordination cost. ethers.js is deferred to
  the Optional tier (O2), which is also where per-user wallet signing
  lives — the two belong together.

**Verified (DONE WHEN checks that actually passed):**
- None yet — no build tasks from `TASKS.md` have started. This entry is
  planning-only.

**Open questions / blockers for next session:**
- None blocking. `TASKS.md` Phase 1, Task 1.1 is the next concrete action.
- Worth raising with the team before Phase 5: `design/src/Farmer/Modals/`
  and similar folders weren't individually inventoried file-by-file during
  this audit — Task 5.3 in `TASKS.md` names a likely file
  (`AddStockModal.jsx`) but says explicitly to confirm the exact name via
  `App.jsx`'s imports rather than trusting this note blindly.

**What's next:**
- Start `TASKS.md` Phase 1 (Environment) from Task 1.1.
