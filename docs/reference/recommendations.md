# Prioritized Improvement Recommendations

**Based on:** Benchmark analysis against reference repositories (`ADOS`, `CryptaNet`, `CropChain`, `SIH`, `Project`, `IsoLog`)  
**Branch:** `reference-review`  
**User Decision:** Exclusively simulated IoT telemetry (dropping physical hardware inputs); prioritized Option 2 (Quarantine Hash-Chain Audit Log + Automated Breach vs Anomaly Tests).

---

## Prioritized Implementation Plan

| Priority | Feature / Improvement | Reference Inspiration | Expected Value | Effort | Files Affected | DONE WHEN Check |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1 (Mandatory)** | **Automated Tests for Genuine Breach vs Anomaly Quarantine** | Self / Capstone Audit | High (Guarantees cold-chain violations record on-chain with `breach=True` while corrupted telemetry is quarantined off-chain) | **S** | `tests/test_breach_vs_anomaly.py` | `pytest tests/test_breach_vs_anomaly.py` passes 100% testing both paths. |
| **2 (Option 2)** | **Tamper-Evident Hash Chain for Quarantine Table** | `isolog` (`hash_computer.py`, `chain_manager.py`) | High (Prevents DB tampering of rejected/anomalous readings off-chain; cryptographic integrity without gas costs) | **S-M** | `backend/main.py`, `backend/db.py` | `GET /quarantine/verify-integrity` returns `{"status": "VALID", "verified_count": N, "tampered": false}` on chained quarantine logs. |
| **3** | **Admin Role Revocation Endpoint** | `CropChain` (`CropChain.sol#L160-L184`) | Medium (Completes OpenZeppelin role lifecycle in the backend API) | **S** | `backend/main.py`, `backend/chain.py` | `POST /admin/roles/revoke` successfully revokes role on-chain and updates participant state. |
| **4** | **Freshness & AI Trust Score Exposure** | `ADOS` (`quality factor`) | Medium (Surfaces normalized 0–100% quality score in batch traceability response for consumers) | **S** | `backend/main.py` | `GET /batches/{id}/traceability` contains `quality_score` and `freshness_pct`. |
| **5 (Deferred)** | **Smart Contract Circuit-Breaker Emergency Pause** | `CropChain` (`pause()`) | Medium (Allows deployer to pause contract functions during an emergency) | **M** | `contracts/contracts/`, `contracts/test/` | Handled in future task backlog (`TASKS.md`). |
| **6 (Deferred)** | **Dedicated Desktop Admin Persona UI** | `CropChain` | Medium (Full UI persona switcher for Admin) | **L** | `frontend/src/App.jsx`, `frontend/src/Admin/` | Handled in future task backlog (`TASKS.md`). |

---

## Detailed Item Specifications

### Item 1: Formal Tests for Genuine Breach vs Anomaly Quarantine (Effort: S)
- **Goal:** Verify two distinct execution paths in `/telemetry`:
  1. *Plausible violation:* Temperature breaches threshold (e.g., 22°C for chilled crop with max 10°C, normal humidity, believable location). Verdict = `BREACH`, disposition = `RECORDED_ON_CHAIN_BREACH`, `breach=True` passed to `chain.record_condition`, valid EVM `tx_hash` generated, attributed to current custodian.
  2. *Corrupted / impossible data:* Temperature spike to 85°C or invalid physics. Verdict = `ANOMALOUS`, disposition = `QUARANTINED`, `tx_hash` is None, logged to quarantine table.
- **Done When:** Pytest executes both test cases against the live backend/chain and both assertions pass.

### Item 2: Tamper-Evident SHA-256 Hash Chain for Quarantine (Effort: S-M)
- **Goal:** Add cryptographic linking to SQLite `quarantine` table:
  - Add `prev_hash` and `entry_hash` columns to `quarantine`.
  - For each new quarantine entry:
    $$\text{entry\_hash} = \text{SHA256}(\text{prev\_hash} \parallel \text{reading\_id} \parallel \text{reason} \parallel \text{quarantined\_at})$$
  - First entry uses `"0000000000000000000000000000000000000000000000000000000000000000"`.
  - Implement `GET /quarantine/verify-integrity` endpoint that traverses rows in chronological order, verifies every SHA-256 link, and flags any modified or deleted rows.
- **Done When:** Calling `GET /quarantine/verify-integrity` returns a cryptographic verification report with 0 broken links.

### Item 3: Admin Role Revocation Endpoint (Effort: S)
- **Goal:** Implement `POST /admin/roles/revoke` accepting `RoleGrantRequest(role, address)`.
  - Calls `chain.revoke_role(role, address)`.
- **Done When:** Revoking a role updates `chain.check_role(role, address)["has_role"]` to `False`.
