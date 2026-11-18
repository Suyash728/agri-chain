# AgriChain Codebase Audit — 2026-11-18

This audit ran every test suite and reproduced the headline claims in an **isolated stack**: scratch copies of the code, a SQLite DB copy, an in-memory Hardhat node, and no `.env`, so nothing touched Supabase or Amoy. It also read the code behind each claim.
The hardware/edge work done the same day lives on branch `hardware/two-phase-sync` and is covered in CLAUDE.md §4–5.

## 1. Test results

| Suite | Result | Notes |
|---|---|---|
| `contracts`: `npx hardhat test` | **22/22 pass** | — |
| `trust-layer`: `pytest trust-layer/tests/` | **147/147 pass** | The suite writes into the real `backend/agrichain.db` by default (`SQLITE_DB_PATH` fallback), and rewrites `trust-layer/reports/figures/benchmark_summary.*`, which are tracked files. Run it with `SQLITE_DB_PATH=<copy>`. |
| `frontend`: `vite build` | **builds** | Single 1.3 MB JS chunk (no code splitting). |
| `backend/scripts/verify_final_system.py` | **all 10 phases PASS** | Only against a live backend on :8000. With the repo `.env` it would run against Supabase and the configured chain. See §3 for what several of the "PASS" lines actually mean. |
| Hardware (on device) | Phase 1–3 protocol tests pass | See CLAUDE.md §4.4. The physical sensors need attention (§5). |

## 2. Headline claims vs. reproduction

### Gas: "52.71% reduction" (CLAUDE.md, MEMORY.md, README) / ">60%" (`contracts/reports/gas_benchmark.md`)
`scripts/benchmark_gas.cjs` reproduces **45.31% (N=5), 51.31% (N=10), 54.31% (N=20)**, so neither documented number is the current one.
The comparison also hides some context. A single modular condition write costs **73,634 gas**, against **28,650** for the monolithic `AgriChainCore`. Batched writes average **25,825 gas/reading**, so batching mostly wins back the overhead that the modular design added.

### AI Trust Layer: "F1 = 0.9722, Precision 96.30%, Recall 98.18%"
`EvaluationService.run_pipeline_evaluation` reproduces F1 = 0.9722 at seed 42. The other numbers don't hold up:

| Run | Cases (normal) | TP | FP | TN | FN | Precision | Recall | F1 | **FPR on normal** |
|---|---|---|---|---|---|---|---|---|---|
| default, seed 42 | 40 (5) | 35 | 2 | 3 | 0 | 0.9459 | 1.000 | 0.9722 | **40%** |
| default, seed 1 / 7 | 40 (5) | 35 | 1 | 4 | 0 | 0.9722 | 1.000 | 0.9859 | 20% |
| 20 seq/fault | 160 (20) | 140 | 7 | 13 | 0 | 0.9524 | 1.000 | 0.9756 | **35%** |
| **Isolation Forest disabled** | 160 (20) | 140 | **0** | 20 | 0 | **1.000** | 1.000 | **1.000** | **0%** |

- **The ML model adds no detections and causes every false positive.** Every fault is caught by the deterministic rules (range, rate, Haversine velocity, replay, timestamp).
- **The published precision and recall (96.30% / 98.18%) don't match any reproduced run.**
- **Methodology inflates the score.** Faults and "normal" data come from the same simulator, the fault sits at the last of only 5 readings, and the IF trains on 40 synthetic readings. The 7:1 fault-to-normal ratio inflates precision, so FPR is the honest metric.
- **It also fails on real data.** The 11-D feature vector includes absolute latitude/longitude and temperature, and the model is trained on one simulated route. Real ESP32 readings from a desk were flagged `ML_ANOMALY` 39 times out of 40.

## 3. Findings (most severe first)

### Critical
1. **No authentication anywhere in the backend** (`backend/routers/admin.py`).
   - `/auth/login` takes no password and returns a guest user for any role. The "token" is never checked by any route.
   - CORS reflects every origin with credentials (`allow_origin_regex=r"^https?://.*$"`).
   - So anyone who can reach :8000 can call `/admin/roles/grant`, `/admin/contracts/pause`, `/admin/system-reset`, `/demo/reset`, `/batches/{id}/custody`, and so on.
2. **On-chain RBAC is effectively bypassed.** Every chain write is signed by one relayer key (`PRIVATE_KEY`) that holds all roles. With finding 1, the contracts' role separation protects nothing in practice.
3. **The consumer price trail fabricates numbers** (`backend/routers/batches.py`, traceability). This undermines the project's core "farmer fair-share" claim.
   - **Hard-coded defaults.** Missing stages get defaults: transit ₹32/kg, farm `max(15, transit × 0.875)`, storage transit × 1.08, retail storage × 1.25.
   - **Invented markups.** "Enforce progressive monotonic price trail" inserts markups (+₹2.00, +₹2.40, +₹6.50 /kg) whenever the real prices don't rise.
   - **Unit guessing.** Farm prices ≥ 1000 are treated as lot totals, and prices < 200 as per-kg.
   - **Float rupees.** All of this is float rupee math, which violates the integer-paise rule (RULES.md §2).

### High
4. **One ML false positive permanently blocks a batch.** The custody "circuit breaker" (`post_custody`, darkstore receive) blocks IN_STORAGE/AT_RETAIL/SOLD if *any* reading for the batch was ever `ANOMALOUS`. Combined with the 35–40% ML false-positive rate, clean batches get stuck, and there is no release path.
5. **Fake IPFS CIDs.** Without Pinata credentials, `ipfs.py` labels the base58 SHA-256 of the raw bytes as a `Qm…` CID. Real CIDv0 hashes the dag-pb/UnixFS encoding, so these IDs don't exist on IPFS, never resolve on a gateway, and differ from what Pinata would return. `verify_final_system.py` still prints "[PASS] IPFS Pinning".
6. **The audit table drops most of each packet.** `readings` stores only batch, temp, humidity, verdict and tx. Device ID, measurement timestamp, location, VOC and tamper status are lost, so "persist before validation" can't reconstruct what the device sent.
7. **Measurement time is lost on-chain.** `ColdChainMonitor` stores `block.timestamp`, not the measurement time. Offline-synced readings get the time they were anchored.
8. **Failed batch anchoring is never retried.** `post_telemetry_batch` logs the error, leaves readings VALID with `tx_hash = NULL`, and returns 200.
9. **The backend invents coordinates and timestamps.**
   - **Location:** a missing location becomes Pune (18.5204, 73.8567).
   - **Timestamp:** a missing timestamp becomes `previous + 900 s`.
   - Both are fed to the plausibility checks as if real.
10. **Nonce race.** `_send_tx` reads the nonce per call while FastAPI runs sync routes concurrently, so parallel requests can collide. `wait_for_transaction_receipt` also blocks a worker for up to 120 s, and `gasPrice` is hard-coded at 20 gwei.

### Medium
11. **Silent truncation in Solidity.** `ColdChainMonitor` silently truncates with `int64(tempDeciC)` and `uint32(humidityPct)`; explicit narrowing doesn't revert in 0.8, so use `SafeCast`. Events emit the untruncated value, which then disagrees with storage.
12. **`CustodyTransfer` issues:**
    - **Not cumulative.** `cumulativePricePaise` is overwritten on each transfer, so there's no on-chain price trail beyond the events.
    - **No holder check.** Any LOGISTICS/RETAILER account can move *any* batch.
    - **Stages can be skipped.** REGISTERED → SOLD in one step is allowed.
    - **Not tied to the registry.** Custody can be initialized for a batch that `ProductRegistry` never registered.
13. **`ProductRegistry` doesn't bind to the caller.** Any farmer can register a batch under another farmer's address, or attach documents to another farmer's batch.
14. **No off-chain custody-order validation**, despite RULES.md §4 claiming it. The backend relies entirely on the chain revert.
15. **The frontend shows static or random values as if live:**
    - `RevenueView` has a hard-coded ₹11,28,450.
    - `DarkStoreExpiryAlertsView` has a hard-coded ₹48,250.
    - `MicroInventoryView` shows `Math.random()` output as a "BIN-HASH 0x…".
    - `AdminPortalView` generates random addresses.

### Low / docs
16. **Pragma mismatch.** The contracts use `pragma ^0.8.20`; RULES/MEMORY say 0.8.28.
17. **Wrong SW-420 pin in docs.** `hardware/README.md` and `docs/IOT_HARDWARE_SPECIFICATION.md` put the SW-420 on GPIO 27, but both firmwares use **GPIO 32**. *(Fixed in this commit.)*
18. **`AGENTS.md` references a non-existent `TASKS.md`.** *(Fixed in this commit.)*
19. **Two firmwares, and the docs only explained one.** `hardware/esp32_firmware/` (Wi-Fi + HTTP + 10-slot queue, credentials in source) and `hardware/test_pentad/` (USB serial + two-phase LittleFS sync, the one in active use). *(Clarified in `hardware/README.md`.)*

## 4. Suggested order of fixes
1. **Auth.** Real login (password hash or wallet signature) and a dependency that checks a signed token and role on every mutating route. Restrict CORS to the frontend origin. Remove or guard the `/demo/*` and `/admin/system-reset` routes outside demo mode.
2. **Price trail.** Show only recorded `price_paise` per stage, as integers, and render "not recorded" instead of synthesizing values.
3. **ML.** Drop absolute lat/lon/temp from the IF feature vector (keep rates and deltas). Evaluate on held-out real device traces with FPR reported, or make the IF advisory (a score only, no verdict) until it beats the rules alone.
4. **Circuit breaker.** Block on confirmed breaches only (tamper, out-of-policy temperature), not on ML-only flags, and add an admin release path.
5. **IPFS.** Label the fallback "local content hash (not pinned)", or compute a real CIDv0.
6. **Audit table.** Add device ID, measurement timestamp, location, VOC and tamper columns to `readings`, and keep the raw payload JSON.
7. **Contracts.** `SafeCast`; an append-only price trail or an actual cumulative sum; holder checks.

## 5. Physical node (from the hardware session)
- **SW-420:** about 20 events per 52 s at rest, even after 200 ms coalescing. Lower the trim-pot sensitivity, or isolate it from MQ-135 heater noise on the 5 V rail.
- **LDR:** pinned at the ADC ceiling (3.13 V) in room light, so `tamper` is always true on a desk. Do a cover test.
- **MQ-135:** needs `monitor_live.py --calibrate-r0` in clean air after burn-in. Until then, gas values are deliberately not forwarded.
- **Untested:** USB unplug/replug auto-reconnect (needs a physical test).

## 6. Reproducing this audit safely
The repo `.env` points the backend at Supabase (`DATABASE_URL`) and a chain (`RPC_URL` + `PRIVATE_KEY`). To reproduce:
1. Copy `backend/`, `trust-layer/` and `contracts/` (symlink `node_modules`) into a scratch directory.
2. Run `npx hardhat node`, then `npx hardhat run scripts/deploy_amoy.cjs --network localhost` from the copy. Its manifests land in the copy, not the repo.
3. Start `uvicorn main:app` from the copied `backend/` with `DATABASE_URL=` (empty), `RPC_URL=http://127.0.0.1:8545`, and `PRIVATE_KEY` set to Hardhat test key #0.
4. Run the copied `scripts/verify_final_system.py`.

Also run the trust-layer suite with `SQLITE_DB_PATH` pointed at a DB copy.
