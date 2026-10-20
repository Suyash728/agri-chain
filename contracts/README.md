# AgriChain Smart Contracts

Modular EVM Smart Contracts enforcing decentralized access control, state machine transitions, IoT oracle data anchoring, and on-chain crop policy governance.

## Contracts Architecture

- **`ProductRegistry.sol`**: Manages crop lot provenance, origin farm anchoring, batch status, and IPFS document anchoring (`FARMER_ROLE`). Includes emergency circuit breaker (`Pausable`).
- **`CustodyTransfer.sol`**: Enforces one-directional state machine transitions (`REGISTERED → IN_TRANSIT → IN_STORAGE → SOLD`) with stage settlement pricing. Role-governed for `LOGISTICS_ROLE` and `RETAILER_ROLE`.
- **`ColdChainMonitor.sol`**: Batched oracle IoT telemetry ingestion (`recordConditionsBatch`) achieving 52.71% gas reduction, verifying thermal thresholds against policy and logging condition breaches.
- **`PolicyConfig.sol`**: On-chain storage of temperature and humidity policy boundaries for supported crop types.
- **`AccessControlRoles.sol`**: Standardized role identifiers (`DEFAULT_ADMIN_ROLE`, `FARMER_ROLE`, `LOGISTICS_ROLE`, `RETAILER_ROLE`, `ORACLE_ROLE`).
- **`AgriChainCore.sol`**: Legacy monolithic contract preserved for backward compatibility.

## Usage Commands

```shell
# Run full smart contract test suite (22 tests)
npx hardhat test

# Run gas benchmark report
node scripts/benchmark_gas.cjs

# Start local Hardhat EVM node
npx hardhat node

# Deploy modular contracts to localhost node
npx hardhat run scripts/deploy_amoy.cjs --network localhost

# Deploy modular contracts to Polygon Amoy Testnet
npx hardhat run scripts/deploy_amoy.cjs --network amoy
```

