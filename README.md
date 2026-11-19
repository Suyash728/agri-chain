# AgriChain

> **A decentralized IoT–blockchain framework with customized smart contracts and a pre-chain AI gatekeeper for transparent, traceable agricultural supply chains.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28_%7C_OpenZeppelin_RBAC_%2B_Pausable-blue?style=flat-square)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI_%7C_Python_3.11%2B-green?style=flat-square)]()
[![Gas](https://img.shields.io/badge/Batched_writes-54.31%25_gas_saved_(N%3D20)-purple?style=flat-square)]()
[![Storage](https://img.shields.io/badge/Storage-Supabase_PostgreSQL_%2B_IPFS-teal?style=flat-square)]()
[![Frontend](https://img.shields.io/badge/Frontend-React_18_%7C_Tailwind_%7C_ethers.js-orange?style=flat-square)]()
[![IoT](https://img.shields.io/badge/IoT-ESP32_%7C_LittleFS_%7C_SHA--256_chain-red?style=flat-square)]()

## What it does

Perishable produce passes through farmers, cold-chain logistics and dark stores. When it spoils, nobody can prove who was responsible, and consumers can't see how much of the price reached the farmer. AgriChain addresses both problems:

- **Sensors ride with the crate.** An ESP32 node measures temperature, humidity, gas (VOC), shocks, lid opening and GPS. It buffers readings in flash while offline and hands them over with a verifiable SHA-256 chain when connected.
- **A pre-chain AI trust layer checks every reading** (range, physical plausibility, Isolation Forest, replay detection) before conditions are anchored on an EVM chain. Suspect readings go to a hash-chained quarantine log.
- **Custody and prices are recorded on-chain.** Every transfer (farm → transit → dark store → retail → sold) is forward-only and records the stage price in integer paise. The consumer sees the real price trail and the farmer's share.
- **Each role has its own portal:** Farmer, Logistics, Dark Store, Consumer and Admin, plus a God Mode demo hub.

```
ESP32 / virtual sensors ─► host bridge (sync, batch link) ─► FastAPI + AI trust layer ─┬─► contracts (Hardhat / Polygon Amoy)
                                                                                       ├─► Supabase PostgreSQL / SQLite, IPFS
                                                                                       └─► React multi-role web app
```

## Quick start

```bash
git clone https://github.com/Suyash728/agri-chain.git && cd agri-chain
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt -r trust-layer/requirements.txt
(cd contracts && npm install) && (cd frontend && npm install)
cp .env.example .env            # defaults: local SQLite + local Hardhat chain

./run.sh                        # Windows: run.bat or .\run.ps1   ·   any OS: python run.py
```
`run.py` starts a Hardhat chain on :8545, deploys the contracts, starts the backend on :8000, seeds demo data, and serves the web app on :3000. The flags are `--no-browser`, `--simulator`, `--no-seed` and `--kill-ports`.

> [!WARNING]
> Seeding **empties the database first**. If your `.env` points `DATABASE_URL` at a real Supabase project, run with `--no-seed`.

### With the physical sensor node
```bash
.venv/bin/pio run -d hardware/test_pentad -t upload --upload-port /dev/ttyUSB0   # flash the ESP32
./run_monitor.sh                                                                # sync flash + live dashboard
```
Link the sensor to a produce batch in **Logistics → Shipment Tracking → Manage Sensors** (or press `[B]` in the monitor). No hardware? Use `python simulator/simulate.py --virtual`.

## Tests
```bash
cd contracts && npx hardhat test                    # 22 passing
SQLITE_DB_PATH=/tmp/tl.db .venv/bin/pytest trust-layer/tests/     # 147 passing (use a DB copy)
cd contracts && npx hardhat run scripts/benchmark_gas.cjs          # gas benchmark
```

## Results (reproduced 2026-11-18)
| Claim | Result |
|---|---|
| Batched condition writes | **45.31% / 51.31% / 54.31%** gas saved at N = 5 / 10 / 20. A single modular write costs 73.6k gas vs 28.7k monolithic. |
| AI trust layer, synthetic faults (7 types) | F1 **0.9722** (precision 94.59%, recall 100%). The **false-positive rate on normal data is 40%**, and the rules alone score F1 1.0, so the Isolation Forest currently adds only false positives. |

Details, method and open issues are in [`reports/CODEBASE_AUDIT_2026-11-18.md`](reports/CODEBASE_AUDIT_2026-11-18.md).

## Repository
| Path | Contents |
|---|---|
| `hardware/` | ESP32 firmware (`test_pentad/` active, `esp32_firmware/` Wi-Fi variant), host bridge `monitor_live.py`, simulator |
| `backend/` | FastAPI API, Web3 relayer, Supabase/SQLite storage, IPFS, IoT device linking |
| `trust-layer/` | Validation pipeline, Isolation Forest, fault simulator and evaluation |
| `contracts/` | Solidity contracts, Hardhat tests, gas benchmark, deploy script |
| `frontend/` | React 18 + Vite + Tailwind multi-role app |
| `simulator/` | Multi-fault telemetry streaming simulator |

## Documentation
- [`CLAUDE.md`](CLAUDE.md): the full engineering guide (architecture, firmware protocol, backend, commands, status).
- [`RULES.md`](RULES.md): the hard constraints. [`MEMORY.md`](MEMORY.md): the decision log.
- [`ARCHITECTURE.md`](ARCHITECTURE.md), [`PRD.md`](PRD.md): architecture overview and product requirements.
- [`DEPLOYMENT.md`](DEPLOYMENT.md): free-tier deployment (Render, Vercel, Supabase, Polygon Amoy).
- [`docs/`](docs/): hardware specification, breadboard guide, academic material.

## License
MIT Academic License — Capstone Major Project 2026–2027.
