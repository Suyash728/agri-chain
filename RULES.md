# RULES.md — Hard Constraints

Non-negotiable rules for every change to AgriChain. Context and the reasons behind them are in [`CLAUDE.md`](CLAUDE.md); decisions are logged in [`MEMORY.md`](MEMORY.md).

## 1. Technology stack
| Layer | Use | Don't use |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS, `lucide-react`, `ethers` v6 | Redux, Zustand, React Router, Next.js, TypeScript conversion, new UI component libraries |
| Backend | Python 3.11+ (developed on 3.14), FastAPI, uvicorn, web3.py, pydantic | Django, Flask, a Node backend |
| AI trust layer | scikit-learn (Isolation Forest), numpy, scipy | Unvetted ML frameworks, external prediction APIs |
| Blockchain | Solidity (solc 0.8.28), Hardhat, OpenZeppelin `AccessControl` / `Pausable` | Foundry, Truffle, non-EVM chains |
| Storage | Supabase PostgreSQL (psycopg 3), SQLite fallback, Pinata IPFS | MongoDB, DynamoDB, other cloud databases |
| IoT | C++ on ESP32 (Arduino framework, PlatformIO), Python simulators | Proprietary binaries |

## 2. Integer money and temperature
- **Money is integer paise** (1 INR = 100 paise) in Solidity (`uint256 pricePaise`), SQL (`INTEGER`/`BIGINT`) and Python (`int`). Convert to rupees only when formatting for display: `(price_paise / 100).toFixed(2)`.
- **Temperature is integer deci-°C** (24.5 °C → 245, −2.0 °C → −20) on-chain and in logic comparisons. Floats are for sensor ingestion and display only.

## 3. Persist before validating
Every packet received by `POST /telemetry` or `/telemetry/batch` is written to `readings` **before** the AI trust layer runs. Valid and quarantined readings both stay auditable. Never drop a packet before it is logged.

## 4. Forward-only custody
`REGISTERED → IN_TRANSIT → IN_STORAGE → AT_RETAIL → SOLD`. Backward or repeated transitions are rejected by `CustodyTransfer.sol`.

## 5. Frontend design is fixed
- Don't restyle or recreate existing views, change the palette or fonts, or add UI libraries.
- When wiring data, replace mock imports with `fetch()` calls that return the same JSON shape.
- If a screen renders wrongly, fix the backend response shape first.
- **Exception:** small, self-contained additions are allowed when a feature needs input the existing UI can't capture (e.g. `frontend/src/components/iot/`). Build them from the existing palette, `rounded-2xl/3xl` cards, `lucide-react` icons and the modal pattern.

## 6. No invented data
APIs and screens show recorded data, or an explicit empty or `null` state. Never synthesize prices, markups, ratings, review counts, certificates, KPIs, timestamps or coordinates and present them as real. Suggested prices may only *prefill* an input that the operator confirms.

## 7. Smart-contract safety
- State-changing functions are role-gated (`onlyRole(...)`) and respect `Pausable` circuit breakers.
- Condition writes support batching (`recordConditionsBatch`).
- No unbounded loops over storage arrays.
- Never deploy to a public network with a published test key (e.g. Hardhat account #0).

## 8. Secrets and testing
- Secrets (`PRIVATE_KEY`, `DATABASE_URL`, `PINATA_JWT`, `ADMIN_API_TOKEN`, `DEVICE_API_KEY`) live only in `.env` or the hosting dashboard. Never hard-code them. `.env` and `*.db` stay git-ignored. `.env.example` documents every variable.
- **Never run tests or the backend against the real `.env`**: it points at Supabase and a live chain. Use isolated copies (`CLAUDE.md` §13.3).

## 9. Commits
Format: `[scope] description` (e.g. `[hardware] two-phase littlefs sync`, `[backend] fix telemetry batch ingestion`). Never commit `.env`, `node_modules/`, `.venv/` or `*.db`.
