# Backend Overview

This directory contains a tiny FastAPI‑based web service that exposes the REST API described in **ARCHITECTURE.md – §7**.  It runs a SQLite database locally, validates telemetry, and writes data to a Hardhat‑deployed Solidity contract using **web3.py**.

> ⚠️  The code is intentionally minimal – it’s only meant to support the two‑week
> essential build.  Production‑grade error handling, logging, and authentication
> are all out of scope.

## Directory layout
```
backend/
├── main.py            – FastAPI entry point (health‑check + later routes)
├── db.py              – Helper that creates the SQLite schema
├── chain.py            – Thin wrapper around web3.py that talks to the chain
├── validation.py       – Rule‑based AI trust layer
├── requirements.txt    – Python dependencies
└── README.md          – YOU'RE HERE!
```

## Quick‑start for a local dev machine
1. **Create a virtual environment** and install the requirements:
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate   #  or  .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. **Setup environment variables**.
   
   The following variables must be present in a file named `.env` in the
   project root (or you can export them directly).  Create the file
   with sensible defaults and edit it yourself.
   ```env
   # RPC endpoint – use the local Hardhat node
   RPC_URL=http://127.0.0.1:8545
   
   # The address of the deployed AgriChainCore contract
   CONTRACT_ADDRESS=<paste-here>
   
   # Private key of the backend account (a Hardhat funded test account works).  Example:
   PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
   ```
3. **Initialise the database** (only needed once):
   ```bash
   python -c "from db import init_db; init_db()"
   ```
   This creates `data/db.sqlite` and the five tables.
4. **Run the FastAPI server**:
   ```bash
   uvicorn main:app --reload
   ```
   The service will be available at `http://localhost:8000`.
5. **Interact with the other pieces**.
   - The *simulator* will POST telemetry to `/telemetry`.
   - The *frontend* will fetch data from the `/farmer/*`, `/batches/*`, and `/consumer/*` endpoints.

## Extending
- Add more routes in `main.py` and expose them via FastAPI’s decorator syntax.
- Update `validation.py` with new rules or plug in an ML model.
- If you need to persist the contract’s transaction history, you can add a helper in `chain.py` that queries past events.

Happy hacking!
