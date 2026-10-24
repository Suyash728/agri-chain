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
5. `TASKS.md` — Task checklist with exact `DONE WHEN` verification commands.

## 2. Frontend Constraints (`frontend/`)
- **Wire, never recreate**: `frontend/` is a finished React 18 + Tailwind app. Do not install UI libraries, routers, or state managers.
- **Style lock**: Do not modify colors, fonts, spacing, or Tailwind classes. Follow `frontend/DESIGN.md`.
- **API contracts**: Replace mock imports only with `fetch()` returning the exact same data shape as `mockData.js` / `consumerData.js`.

## 3. Strict Code & Data Rules
- **Money & Temperature**: Always integer `price_paise` (1 INR = 100 paise) and integer `temp_deci_c` (24.5°C = 245). Never use floats.
- **Persistence before validation**: Every incoming telemetry ping is recorded in `readings` before AI evaluation to maintain an audit trail.
- **State transitions**: Custody is strictly forward-only: `REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`.

## 4. Execution Discipline
- **One task at a time**: Complete one task from `TASKS.md` and execute its `DONE WHEN` check before advancing.
- **Verify before claiming success**: Run tests (`pytest tests/ trust-layer/tests/`, `npx hardhat test`) to prove changes work.
- **Commit format**: `[scope] description` (e.g., `[contracts] add circuit breaker`, `[backend] fix telemetry route`). Never commit `.env`, `node_modules/`, `.venv/`, or `.db`.
