# AgriChain Smart Contracts

> **Modular EVM Smart Contracts enforcing decentralized access control, state machine transitions, IoT oracle data anchoring, and on-chain crop policy governance.**

---

## 1. Contracts Architecture

- **`ProductRegistry.sol`**: Manages crop lot provenance, origin farm anchoring, batch status, IPFS document CID anchoring (`FARMER_ROLE`), and emergency `Pausable` circuit breaker.
- **`CustodyTransfer.sol`**: Enforces forward-only custody transitions (`REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`) with non-repudiable stage settlement pricing in integer paise. Role-governed for `LOGISTICS_ROLE` and `RETAILER_ROLE`.
- **`ColdChainMonitor.sol`**: Batched oracle IoT telemetry ingestion (`recordConditionsBatch`) achieving 52.71% gas reduction, verifying thermal thresholds against policy and logging condition breaches (`ORACLE_ROLE`).
- **`PolicyConfig.sol`**: On-chain storage of temperature and humidity policy boundaries for supported crop types (`DEFAULT_ADMIN_ROLE`).
- **`AccessControlRoles.sol`**: Standardized role hierarchy (`DEFAULT_ADMIN_ROLE`, `FARMER_ROLE`, `LOGISTICS_ROLE`, `RETAILER_ROLE`, `ORACLE_ROLE`).
- **`AgriChainCore.sol`**: Legacy consolidated contract preserved for backward compatibility.

---

## 2. Usage Commands

```bash
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
