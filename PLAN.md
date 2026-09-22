# PLAN.md

The build plan. This is the roadmap — phases and their goals. For the actual
day-by-day checklist with runnable commands, see `TASKS.md`, which implements
this plan.

## How this plan is organized

**Linear, not split by frontend/backend.** There is one sequence of phases,
done in order, by whoever (or whatever agent) is working — not parallel
tracks handed to different people that later need to be integrated. This is
possible specifically because `ARCHITECTURE.md` §4 establishes that the API
contract is already fixed (it's `mockData.js`), so there's no need for a
frontend track and a backend track to coordinate on a spec while building
simultaneously. Build the thing the data comes *from* before the thing that
*displays* it, in a straight line, and each phase is fully working before the
next starts.

**Essential features only for the first two weeks.** Everything in `PRD.md`
§5 "Essential" — nothing from "Optional." The optional roadmap in §3 below
exists so nothing from the original vision is lost, but none of it is
scheduled yet.

## 1. Essential build — 5 phases, 2 weeks

| Phase | Goal | Proves |
|---|---|---|
| **1. Environment** | Every tool installed, `design/` runs, empty `contracts/` and `backend/` scaffolded | The three sub-projects can coexist and each starts cleanly |
| **2. Smart contract** | `AgriChainCore.sol` deployed to a local Hardhat node, with passing tests for register/transfer/record | The blockchain layer works in isolation, callable from a script |
| **3. Backend** | FastAPI app with SQLite, the rule-based AI trust layer, and `web3.py` writing to the contract from Phase 2 | Sensor data → validation → chain, end to end, via `curl`/Postman — no UI yet |
| **4. Simulator** | One script sending readings for one batch, with a flag to send one deliberately bad reading | Phase 3's validation actually catches something, not just passes everything through |
| **5. Frontend wiring** | Farmer dashboard + Consumer traceability/QR screens in `design/` fetch real data from Phase 3 instead of `mockData.js` | The whole loop is visible and demoable, matching `PRD.md` §6 exactly |

Each phase is a hard prerequisite for the next — Phase 3 cannot meaningfully
start until Phase 2's contract is deployed and tested, because Phase 3 needs
something real to call. Do not skip ahead.

**After each phase**, append an entry to `MEMORY.md` — see that file's
format. This is not optional busywork; it's how the next session (which
starts with zero memory) knows phase 2 is actually done before starting
phase 3.

## 2. Two-week schedule

This assumes roughly one working session per day. If progress is faster or
slower, the phase boundaries matter more than the day numbers — don't start
Phase 3 on "day 6" if Phase 2's tests aren't passing yet, even if the
calendar says otherwise.

| Days | Phase | Detail in `TASKS.md` |
|---|---|---|
| 1–2 | Phase 1 — Environment | Tasks 1.1–1.4 |
| 3–5 | Phase 2 — Smart contract | Tasks 2.1–2.5 |
| 6–9 | Phase 3 — Backend | Tasks 3.1–3.7 |
| 10–11 | Phase 4 — Simulator | Tasks 4.1–4.3 |
| 12–14 | Phase 5 — Frontend wiring + end-to-end check | Tasks 5.1–5.6 |

Day 14 ends with the exact sequence in `PRD.md` §6 run start to finish. If it
passes, the essential build is done — full stop, regardless of what's left
on the Optional list.

## 3. Optional roadmap — after the essential build, unscheduled

Not dated, because it starts only once the essential build's five steps
(`PRD.md` §6) all pass, and because the right order depends on what the guide
and the team prioritize for the paper vs. the demo. Rough suggested order,
each item cross-referenced to `PRD.md` §5:

1. **O1 — wire Logistics Partner and Dark Store dashboards.** Natural next
   step once the pattern from Phase 5 is proven twice (Farmer, Consumer);
   the third and fourth times are mechanical repetition of the same pattern.
2. **O6 — split into the original 5 contracts with OpenZeppelin
   `AccessControl`.** Do this before O5, not after — testing role-gating
   locally is much faster than testing it against a public testnet with
   faucet delays.
3. **O5 — deploy to Polygon Amoy.** Now that the contract shape is closer to
   final (post O6), deploying it publicly is worth doing once rather than
   twice.
4. **O7 — migrate SQLite to Supabase/Postgres.** Independent of the chain
   work above; can happen in parallel with O5/O6 once someone is free.
5. **O3 — swap rule-based validation for Isolation Forest, then an
   LSTM-autoencoder.** Needs O4 (better fault data) to evaluate meaningfully,
   so consider doing O4 first or alongside.
6. **O4 — richer simulator fault types + labelled evaluation.** This is
   where the paper's results table comes from (precision/recall per fault
   type) — prioritize this earlier if the paper deadline is tighter than the
   demo deadline.
7. **O2 — MetaMask / per-user signing.** A real UX upgrade; do this once the
   contract shape (post O6) is stable, since changing who's allowed to call
   what is easiest before real users depend on the current behavior.
8. **O13 — batched oracle writes + gas measurement.** Another paper-results
   item; do alongside O4 if the throughput numbers matter for the same
   deadline.
9. **O8, O9, O10, O11, O12** — reviews, admin flow, IPFS, quarantine console,
   real ESP32 — roughly in that order of effort-to-value, but genuinely
   flexible; none blocks any other.

## 4. What changes if the two-week estimate is wrong

If Phase 3 (the backend) is still not done by day 9, the most likely cause is
that a task in `TASKS.md` was too large for a single session and should have
been split — check `MEMORY.md` for repeated blockers on the same task before
assuming the whole plan needs to slip. If it genuinely needs to slip, slip
the whole essential build by the same number of days rather than cutting an
essential feature (E1–E7 in `PRD.md`) to make up time — cutting scope from
the essential tier defeats the purpose of having drawn the essential/optional
line in the first place. If something must be cut, cut from the Optional
roadmap's ordering in §3, never from `PRD.md` §5's Essential list.
