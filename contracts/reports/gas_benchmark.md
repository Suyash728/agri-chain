# Smart Contract Gas Benchmark Report

**Generated:** 2026-11-19T19:23:31.599Z  
**EVM Target:** Paris (Solidity 0.8.28 with 200 Optimizer runs)

## 1. Function Execution Gas Comparison

| Functionality | Monolithic (AgriChainCore) | Modular RBAC Contract | Overhead for RBAC Security |
|---|---|---|---|
| **Batch Registration** | 1,19,085 gas | 1,21,189 gas | +1.8% |
| **Custody Transfer** | 32,949 gas | 59,645 gas | +81.0% |
| **Single Condition Write** | 28,650 gas | 73,634 gas | +157.0% |

## 2. Oracle Condition Batching Savings

| Batch Size (Readings) | N × Single Transactions | Single Batched Transaction | Total Gas Saved | Average Gas / Reading |
|---|---|---|---|---|
| **5** | 2,82,670 gas | 1,54,564 gas | **45.31%** | 30,913 gas |
| **10** | 5,65,340 gas | 2,75,218 gas | **51.31%** | 27,522 gas |
| **20** | 11,30,680 gas | 5,16,509 gas | **54.31%** | 25,825 gas |

### Key Finding
Batching condition writes via `recordConditionsBatch` saves **54.31%** of gas at N = 20 (45.31% at N = 5, 51.31% at N = 10, 54.31% at N = 20). For context, a single modular RBAC write costs 73,634 gas versus 28,650 for the monolithic contract, so batching largely offsets the per-write overhead of the modular design (25,825 gas per reading at N = 20).
