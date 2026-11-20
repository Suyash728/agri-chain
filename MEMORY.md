# MEMORY.md — Decision Log

Dated record of what changed and **why**, newest first. It is not a specification. The current system is described in [`CLAUDE.md`](CLAUDE.md) and the constraints in [`RULES.md`](RULES.md). The session-by-session history up to 2026-11-08 is in [`docs/archive/MEMORY_FULL_ARCHIVE.md`](docs/archive/MEMORY_FULL_ARCHIVE.md).

**How to add an entry:** date, what changed, why, and anything a later agent must not undo. Keep it to a few lines and link to code or reports for detail.

---

## 2026-11-20 — TrustLayer audit (`~/Projects/trustlayer`, `audit --all`)
- **Result:** 6 high / 82 medium / 874 low → 0 / 0 / 586 low (`audit` default: 0 / 0 / 0). 36 findings are suppressed inline, each with `# killscore: ignore[...] -- <reason>`. Don't remove a marker without fixing what it describes.
- **Real bugs fixed:**
  - `logger` was never defined in the `admin`, `consumer` and `demo` routers, so 15 error handlers raised `NameError`. Ruff only reported this as F405 because of `from schemas import *`.
  - Checkout auto-inserted a 5-star review.
  - Checkout and farmer confirm/complete stored a fabricated SHA-256 "tx hash" when the chain write failed. Now: farmer custody returns 500 (as darkstore does), and checkout stores NULL with `anchored: false` and an honest message.
  - The farmer category totals invented 0.5 t / ₹2,500 per unparseable crop.
  - Sale IDs were truncated (`SO-BAT-MGO-`, a duplicate React key) and now use the event ID.
  - `api.js` re-read an already-consumed response body.
  - "Copied" showed even when the clipboard write failed.
  - The app went blank when `localStorage` was blocked.
- **Shared helpers:** `common.origin_meta_value` replaces six copies of the `origin_farm` "||qty=..||price=.." parser. `frontend/src/utils/storage.js` is the only place that touches `localStorage`.
- **Keep `"origin_farm" in b.keys()`** (common.py). `b` is a `sqlite3.Row`, and `in row` tests values, so ruff's SIM118 fix would break it.

## 2026-11-20 — Dashboard end-to-end pass; docs refactor
- **Every screen checked.** All roles and screens were tested on an isolated stack: 31 desktop, 15 mobile, plus a UI-driven journey from farmer to consumer and an admin pause. Results are in the audit report §3b.
- **No invented data anywhere.** The consumer price trail now shows recorded lot prices ÷ weight (integer paise). Fabricated ratings, review counts, best-seller flags, certificates and expiry KPIs are gone. *Why:* the platform's purpose is a trustworthy price and condition trail, and invented numbers defeat it. This is now RULES.md §6.
- **Quick GRN price.** The quick GRN records the lot's latest recorded price; it used to record a fixed ₹1,400. The header GRN passes the real batch ID.
- **Logistics ledger.** It shows only IN_TRANSIT and IN_STORAGE flows plus penalties.
- **Timestamps** are shown in `APP_TIMEZONE` (default Asia/Kolkata) rather than server time. Render runs in UTC.
- **Docs restructured.** CLAUDE.md is the single full guide; AGENTS.md points to it; RULES.md lists the hard constraints; this file is the decision log. Superseded docs moved to `docs/archive/`. Core docs now quote the **reproduced** metrics: gas 54.31% at N=20; F1 0.9722 on synthetic faults with a 40% false-positive rate. The academic guides in `docs/` were deliberately left unchanged.

## 2026-11-19 — IoT device ↔ batch linking (branch `feature/iot-batch-linking`)
- **Who picks the batch.** An operator links a sensor to a batch on the website (Logistics Shipment Tracking, Dark Store Incoming Deliveries) or with the monitor's `[B]` picker, and the monitor follows the website. *Why:* the user chose manual linking with a good picker over automatic linking on custody change.
- **Offline records.** They go to the batch linked at sync time (option B). The monitor syncs to the old batch before every switch, and unlinked syncs are held. Link history is dated so time-window allocation (option A) can be added later.
- **Virtual devices.** Simulators can act as virtual devices with `--virtual`. Only explicitly registered devices are tracked, so default simulators and God Mode behave as before.
- **Frontend rule relaxed** to allow small self-contained additions (RULES.md §5), approved by the user.

## 2026-11-19 — Free-tier deployment config (branch `deploy/free-tier`)
- **Hosting:** Render (backend), Vercel (frontend), Supabase (DB), Polygon Amoy (chain), plus a GitHub Actions keep-alive. See `DEPLOYMENT.md`.
- **`APP_ENV=production` access policy:**
  - a CORS allow-list;
  - `X-Device-Key` for telemetry;
  - `X-Admin-Token` for destructive and admin routes;
  - `/demo/*` hidden unless `DEMO_MODE`.
- **Chain safety:** network-derived fees and a nonce lock. Production refuses Hardhat key #0, and persona roles are granted only on local networks. *Why:* the deploy script granted roles to Hardhat accounts with published keys, on every network.
- Fixed a farm-stage BREACH crash (a non-existent `batches.farmer_address` column).

## 2026-11-18 — Codebase audit
- **Results:** all suites pass, but the headline claims don't hold. Gas savings are 54.31% (not 52.71% or ">60%"). F1 reproduces, but the Isolation Forest adds only false positives.
- **Critical findings:** no authentication; a fabricated price trail (fixed 2026-11-20).
- Full report: `reports/CODEBASE_AUDIT_2026-11-18.md`.
- **Testing rule:** the repo `.env` points at Supabase and a live chain. Always test on isolated copies.

## 2026-11-18 — ESP32 firmware and host bridge (branch `hardware/two-phase-sync`)
- **Two-phase LittleFS sync.** `SYNC` dumps; the host fsyncs, then sends `ACK:n`. Two-segment rotation, no silent format, a device clock (host `TIME`, GPS UTC preferred), `shock_delta` / `tamper`, and a hash chain over stored records that the host verifies. *Why:* the old sync cleared flash without an acknowledgement, and rotation wiped everything.
- **MQ-135 math.** It now accounts for the 1.5 divider and 5 V supply, uses eFuse-calibrated ADC reads, and has stored R0 calibration. VOC is forwarded only when calibrated, because uncalibrated readings exceeded the 50 ppm spoilage threshold in clean air.
- **Host bridge.** It connects without resetting the board, keeps an outbox with retry, reconnects, and maps tamper to the values the backend understands (`TAMPER_OPENED` / `SHOCK_DETECTED`).
- **Hardware state (physical board):**
  - the SW-420 is oversensitive;
  - the LDR saturates in room light;
  - the MQ-135 is uncalibrated.

## 2026-11-09 and earlier — Build history (summary)
- **Aug–Sep 2026:**
  - Phases 1–10 built the frontend design, then Hardhat contracts, the SQLite backend, rule-based validation and the simulator.
  - Next came the AI trust layer (Isolation Forest, 7 fault types), role dashboards and quarantine UI, and modular contracts (RBAC, Pausable, batched writes).
  - Supabase + IPFS, role wallets and reviews came last.
- **Oct 2026:**
  - The quarantine log was separated from on-chain breach recording, and the IsoLog hash chain added.
  - The reference-repository review, quality scoring, God Mode and the presenter walkthrough were also added.
- **Nov 2026:** `main.py` was split into routers, the cross-platform runners (`run.sh`/`run.bat`/`run.ps1`/`run.py`) were added, and CLAUDE.md was created.
