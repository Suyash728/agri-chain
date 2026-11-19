# AgriChain Backend

FastAPI API for every role. It handles telemetry ingestion through the AI trust layer, the Web3 relayer for the contracts, dual storage (Supabase PostgreSQL or SQLite), IPFS pinning and IoT device linking. Full details are in [`../CLAUDE.md`](../CLAUDE.md) §6–§7.

## Layout
```
backend/
├── main.py            App, lifespan (init_db + baseline model), access-policy middleware, router registration
├── settings.py        APP_ENV / DEMO_MODE / CORS allow-list / admin & device keys (production policy)
├── db.py              Supabase PostgreSQL (DATABASE_URL) or SQLite (agrichain.db); 16 tables created on boot
├── chain.py           web3.py relayer: EIP-1559 fees, nonce lock, contract addresses from manifest or *_ADDRESS env
├── ipfs.py            Pinata pinning; local content-hash fallback without credentials (not a real IPFS CID)
├── iot.py             Device registry, device ↔ batch links (dated), device telemetry
├── common.py          Shared helpers: timestamps in APP_TIMEZONE (format_local_timestamp, iso_utc), labels
├── seeder.py          Demo dataset (POST /admin/seed-demo-data; TRUNCATEs first)
├── routers/           common · telemetry · batches · farmer · logistics · darkstore · consumer · admin · demo · devices
├── migrations/        001_initial_schema.sql (PostgreSQL; applied idempotently on every boot)
├── modular-abis/      Contract ABIs
├── modular-deployments.json   Local deployment addresses (written by contracts/scripts/deploy_amoy.cjs)
└── scripts/           verify_final_system.py (10-phase check), migrate_sqlite_to_supabase.py, seed_demo_batch.py
```

## Run locally
```bash
pip install -r backend/requirements.txt -r trust-layer/requirements.txt
cd backend && uvicorn main:app --reload --port 8000        # API docs: http://localhost:8000/docs
```
Settings come from the repo-root `.env` (see `../.env.example`):

| Variable | Meaning |
|---|---|
| `DATABASE_URL` | Supabase **pooler** URI. Leave empty for local SQLite. |
| `RPC_URL`, `PRIVATE_KEY` | Chain endpoint and relayer key (local Hardhat by default). |
| `*_ADDRESS` | Optional contract address overrides. |
| `PINATA_JWT` | IPFS pinning. |
| `APP_ENV`, `DEMO_MODE`, `ALLOWED_ORIGINS`, `ADMIN_API_TOKEN`, `DEVICE_API_KEY` | Production access policy (`../DEPLOYMENT.md`). |
| `APP_TIMEZONE` | Display timezone (default `Asia/Kolkata`). |

> [!WARNING]
> If `.env` points at Supabase, starting the backend reads and writes your cloud database, and `POST /admin/seed-demo-data` empties it first. For testing, use the isolated recipe in `../CLAUDE.md` §13.3.

## Rules that apply here
- **Money in integer paise;** persist every reading before validation (`../RULES.md`).
- **Never return invented values.** Prices, ratings, reviews, certificates and KPIs come from the database, or are `null` / empty.
- **Name new PostgreSQL tables carefully.** The PG adapter appends `RETURNING id` to INSERTs whose SQL mentions `readings`, `users`, `quarantine` and similar.
