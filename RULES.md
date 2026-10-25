# RULES.md — Hard Engineering Constraints

> **Strict, non-negotiable architectural and engineering rules for AgriChain.**

---

## 1. Approved Technology Stack

| Layer | Approved Technologies | Prohibited |
|---|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, `lucide-react`, `ethers` v6 | Redux, Zustand, React Router, Next.js, TypeScript conversion, unapproved UI component libraries |
| **Backend** | Python 3.11+, FastAPI, `uvicorn`, `web3.py`, `pydantic` | Django, Flask, Express/Node backend |
| **AI Trust Layer** | `scikit-learn` (Isolation Forest), `numpy`, `scipy` | Unvetted ML frameworks or external black-box prediction APIs |
| **Blockchain** | Solidity 0.8.28, Hardhat, OpenZeppelin (`AccessControl`, `Pausable`) | Foundry, Truffle, non-EVM chains |
| **Storage** | Supabase Cloud PostgreSQL (`psycopg2`), local SQLite fallback, Pinata IPFS | MongoDB, DynamoDB, unvetted cloud databases |
| **IoT / Hardware**| C++ (ESP32 Arduino framework / PlatformIO), Python simulator | Proprietary uncompiled binaries |

---

## 2. Strict Integer Representation for Money & Temperature

- **Money is ALWAYS Integer Paise**:
  - Store and pass prices as `price_paise` (1 INR = 100 paise).
  - Used uniformly in Solidity (`uint256 pricePaise`), PostgreSQL/SQLite (`INTEGER`), and Python (`int`).
  - **Floats for money are strictly prohibited.** Conversion to rupees occurs only at the final display layer in the frontend: `(price_paise / 100).toFixed(2)`.
- **Temperature is ALWAYS Integer Deci-Celsius**:
  - Temperatures are signed integer tenths of a degree Celsius (`temp_deci_c`, e.g., $24.5^\circ\text{C} = 245$, $-2.0^\circ\text{C} = -20$) in contracts and logic comparisons.
  - Converted to float representation only for visual UI rendering.

---

## 3. Persistence Before AI Validation (Audit Trail Integrity)

Every incoming sensor telemetry payload at `POST /telemetry` **must be persisted to the `readings` table before AI evaluation runs**. 
- Rejecting or dropping unvalidated telemetry prior to logging violates audit integrity.
- Both `VALID` and `ANOMALOUS` (quarantined) readings remain auditable in the database.

---

## 4. Forward-Only Monotonic Custody State Transitions

Produce custody transitions strictly advance forward:
$$\text{REGISTERED} \longrightarrow \text{IN\_TRANSIT} \longrightarrow \text{IN\_STORAGE} \longrightarrow \text{AT\_RETAIL} \longrightarrow \text{SOLD}$$
- Backward transitions (e.g., `AT_RETAIL → IN_TRANSIT`) are blocked by smart contract logic (`CustodyTransfer.sol`) and backend validators.

---

## 5. Smart Contract Safety & Access Control

- State-mutating functions must be protected by OpenZeppelin role modifiers (`onlyRole(FARMER_ROLE)`, `onlyRole(ORACLE_ROLE)`, etc.) or `onlyOwner`.
- Telemetry condition writes must support batched execution (`recordConditionsBatch`) to minimize EVM gas costs.
- Critical operations must respect emergency pauses via `Pausable` circuit breakers.
- No unbounded loops over dynamic arrays in Solidity.

---

## 6. Frontend Consistency & Style Lock

- **Wire, Never Recreate**: Replace mock imports only with `fetch()` returning identical JSON shapes.
- **Style Lock**: Preserve existing Tailwind CSS utility classes, color palettes, fonts, and component layout.
- If a screen renders unexpectedly, fix the backend response data shape rather than editing frontend JSX styling.

---

## 7. Secrets Management

- Secrets (private keys, `DATABASE_URL`, `PINATA_JWT`) must reside exclusively in `.env` and are loaded via environment variables.
- Never hardcode credentials, private keys, or database connection strings into source code.
- `.env` and local database files must remain in `.gitignore`.
