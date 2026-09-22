# Track C – Smart Contracts & Oracle (Owner: TRACK C)

## Overview
Write the Solidity contracts, deploy them on Polygon Amoy using Hardhat, and implement an oracle writer that calls the smart contracts when AI Trust deems data valid.

---

### 1. Contract Skeletons (max 2 days)
**Task** – Create four contracts: `ProductRegistry.sol`, `CustodyTransfer.sol`, `PolicyConfig.sol`, `AccessControlRoles.sol`.  Compile locally.

| Dep. | Done When | Owner |
|------|-----------|-------|
| None | `npx hardhat compile` succeeds and shows compiled artifacts | `TRACK C` |

### 2. Hardhat Test Suite (max 3 days)
**Task** – Write tests covering role checks, state transitions, and event emission.  Use `@nomicfoundation/hardhat-toolbox`.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 1 | `npx hardhat test` passes all 4 contract tests | `TRACK C` |

### 3. Oracle Writer Service (max 2 days)
**Task** – Implement FastAPI endpoint `/oracle/validate` that signs a transaction and sends it to Polygon Amoy, returning the txHash.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 2 | `curl -X POST http://localhost:8000/oracle/validate -d @payload.json` returns a hex txHash | `TRACK C` |

### 4. Deployment Script (max 1 day)
**Task** – Write `deploy.js` that deploys the contracts to Amoy and writes the addresses to a `.env` file.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 3 | `npx hardhat run scripts/deploy.js --network amoy` outputs tx hashes and addresses | `TRACK C` |

### 5. Post‑Deployment Verification (max 1 day)
**Task** – Verify that events are captured in an `EventListener` service and that a batch can be registered via the dApp.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 4 | `curl http://localhost:8000/batch/XYZ` shows status `InTransit` after calling the dApp | `TRACK C` |
