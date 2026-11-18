# AGENTS.md

Entry point for AI coding agents. Read this file and `MEMORY.md` before touching any code.

## 0. Zero Cross-Session Memory Rule
- **Read `MEMORY.md` first, in full.** It is the single source of truth for project history and decisions.
- **Append only to `MEMORY.md`** after completing any task or stopping mid-task. Never rewrite or delete previous entries.

## 1. Required Read Order
1. `MEMORY.md` — What has been built, decisions made, and current state.
2. `PRD.md` — Core problem, requirements, actor model, and success criteria.
3. `ARCHITECTURE.md` — 5-tier architecture, contract modularity, database, and API contracts.
4. `RULES.md` — Hard constraints on stack, money representation, and data shapes.
5. `CLAUDE.md` — Current engineering focus (ESP32 edge node), wire protocol, and audit directive.
6. `reports/CODEBASE_AUDIT_2026-11-18.md` — Verified test results, reproduced metrics, and open defects.

## 2. Frontend Constraints (`frontend/`)
- **Wire, never recreate**: `frontend/` is a finished React 18 + Tailwind app. Do not install UI libraries, routers, or state managers.
- **Style lock**: Do not modify colors, fonts, spacing, or Tailwind classes. Follow `frontend/DESIGN.md`.
- **API contracts**: Replace mock imports only with `fetch()` returning the exact same data shape as `mockData.js` / `consumerData.js`.

## 3. Strict Code & Data Rules
- **Money & Temperature**: Always integer `price_paise` (1 INR = 100 paise) and integer `temp_deci_c` (24.5°C = 245). Never use floats.
- **Persistence before validation**: Every incoming telemetry ping is recorded in `readings` before AI evaluation to maintain an audit trail.
- **State transitions**: Custody is strictly forward-only: `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`.

## 4. Execution Discipline
- **One task at a time**: Finish and verify one change before starting the next.
- **Verify before claiming success**: Run tests (`pytest trust-layer/tests/`, `npx hardhat test`) to prove changes work.
- **Never test against the real `.env`**: it points the backend at Supabase (`DATABASE_URL`) and a chain (`RPC_URL` + `PRIVATE_KEY`). Run `pytest` with `SQLITE_DB_PATH=<copy>`, and run the backend from a scratch copy (see the audit report §6).
- **Commit format**: `[scope] description` (e.g., `[contracts] add circuit breaker`, `[backend] fix telemetry route`). Never commit `.env`, `node_modules/`, `.venv/`, or `.db`.
