# AgriChain Smart Contracts

Solidity contracts (solc 0.8.28; sources declare `^0.8.20`) built on OpenZeppelin `AccessControl` and `Pausable`. More context is in [`../CLAUDE.md`](../CLAUDE.md) §9.

| Contract | Purpose |
|---|---|
| `AccessControlRoles.sol` | Role definitions: `DEFAULT_ADMIN_ROLE`, `FARMER_ROLE`, `LOGISTICS_ROLE`, `RETAILER_ROLE`, `ORACLE_ROLE`. |
| `ProductRegistry.sol` | Batch registration and IPFS document CIDs (farmer or admin); pausable. |
| `CustodyTransfer.sol` | Forward-only `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`, stage price in `uint256` paise; pausable. |
| `ColdChainMonitor.sol` | Oracle condition records (`int` deci-°C, humidity, breach flag), single and batched writes; pausable. |
| `PolicyConfig.sol` | Per-crop temperature / humidity thresholds (admin). |
| `AgriChainCore.sol` | Legacy single contract kept for backward compatibility. |

## Commands
```bash
npm install
npx hardhat test                                            # 22 passing (in-process network)
npx hardhat run scripts/benchmark_gas.cjs                   # writes reports/gas_benchmark.{md,json}
npx hardhat node                                            # local chain on :8545
npx hardhat run scripts/deploy_amoy.cjs --network localhost
PRIVATE_KEY=0x<funded relayer key> npx hardhat run scripts/deploy_amoy.cjs --network amoy
```
- **Deploy outputs:** the deploy script writes `amoy-deployments.json`, `../backend/modular-deployments.json` and `../frontend/src/utils/modular-deployments.json`.
- **Public networks:** it grants persona roles (Hardhat accounts #1/#2) **only on local networks**, and refuses Hardhat key #0 elsewhere. Pass `LOGISTICS_ADDRESS` / `RETAILER_ADDRESS` to grant roles to real wallets.

## Gas (reproduced 2026-11-18)
Batched `recordConditionsBatch` vs individual `recordCondition` writes:

| N | Saving | Gas per reading |
|---|---|---|
| 5 | 45.31% | 30,913 |
| 10 | 51.31% | 27,522 |
| 20 | 54.31% | 25,825 |

A single modular write costs 73,634 gas against 28,650 for the monolithic `AgriChainCore`, so batching mostly recovers what modularization added.

## Known caveats
- **Silent narrowing.** `int64` / `uint32` conversions in `ColdChainMonitor` truncate without reverting, so `SafeCast` is advised.
- **Custody gaps.** Stages can be skipped, and there's no current-holder check.
- **Price overwritten.** `cumulativePricePaise` is replaced on each transfer rather than accumulated.
- **Timestamps.** Conditions store `block.timestamp`, not the measurement time.
