# RULES.md

Hard constraints. Not suggestions. If a task seems to require breaking one of
these, stop and write the conflict into `MEMORY.md` instead of breaking the
rule.

These exist specifically because this project is built by a small local
model (gpt-oss-20b / gemma-4-12b) with no memory between sessions and a
tendency, like any LLM, to reach for a plausible-sounding library or API that
doesn't actually exist or behaves differently than assumed. Every rule below
closes off a specific way that goes wrong.

## 1. Stack whitelist — nothing outside this list without updating this file first

| Layer | Allowed | Not allowed (without explicit sign-off + updating this file) |
|---|---|---|
| Frontend | Vite, React 18, Tailwind CSS, `lucide-react` — exactly what `design/package.json` already lists | Any new npm package. Any router. Any state library (Redux, Zustand, etc.). TypeScript conversion. Next.js. |
| Backend | Python 3.11+, FastAPI, `uvicorn`, `web3.py`, `sqlite3` (stdlib) or `sqlmodel` | Django, Flask, Node/Express for the backend. Any ORM beyond `sqlmodel` unless this file is updated first. |
| Blockchain | Solidity ^0.8.20, Hardhat, `hardhat-toolbox` | Foundry, Truffle, any other chain (this is Ethereum-compatible only), OpenZeppelin contracts (deferred to O6) |
| Storage | SQLite, one file, `backend/agrichain.db` | Supabase, Postgres, MongoDB, Redis — all deferred to O7 |

If a task genuinely needs something not on this list, the correct move is to
add it to this file with a one-line justification, in the same commit as the
task that needs it — not to install it silently.

## 2. Never touch `design/` visual styling

Every file under `design/src/` may be edited **only** to:
- replace a `mockData` / `consumerData` import with a `fetch()` call
- add a loading state or error state around that fetch (a spinner, a "failed
  to load" message) using components/classes that already exist elsewhere in
  the same file or a sibling file

Any edit to a `className` string, any new Tailwind utility class, any change
to layout, spacing, color, font, or icon choice is out of scope. If a screen
"looks wrong" after wiring real data, the fix is almost always in the data
shape (see `ARCHITECTURE.md` §4), not the JSX.

`design/DESIGN.md` is the visual specification. It should not need to change
for the essential build. If you believe it does, stop and write why in
`MEMORY.md` rather than editing it.

## 3. Money is always an integer, never a float

Every price in this system is stored and passed around as `price_paise` — an
integer number of paise (1 rupee = 100 paise). This applies in:

- Solidity (`uint256 pricePaise`)
- SQLite (`INTEGER`)
- Python (plain `int`)
- Any JSON payload between backend and frontend

**Never** use a `float`, `double`, or `decimal` for a price at any layer.
Floating-point rounding errors compound across a chain of custody transfers,
and a blockchain record with a silently-wrong price defeats the entire point
of price transparency. Convert to rupees for *display only*, in the frontend,
at the last possible moment (`(price_paise / 100).toFixed(2)`), and never
store or pass the converted value back into any function.

The same applies to temperature: store as `int` tenths-of-a-degree
(`temp_deci_c`), not `float` degrees, anywhere the value is written on-chain
or compared against a threshold. Convert to a human-readable float only for
display.

## 4. Every write to SQLite happens before validation runs

When a sensor reading arrives at `/telemetry`, it must be inserted into the
`readings` table **first**, with whatever verdict it eventually gets updated
to afterward — never validate first and only insert if valid. This preserves
the full audit trail, including rejected readings, which the quarantine
feature (E4/E7 in `PRD.md`) depends on entirely. Skipping this is the single
most likely way to accidentally break the "prove the AI trust layer works"
requirement.

## 5. Solidity-specific rules

- Every state-changing function that should only be callable by the backend
  must use the `onlyOwner` modifier (see `ARCHITECTURE.md` §5). Do not write
  a function that any address can call.
- No unbounded loops over arrays that could grow without limit. If you find
  yourself writing `for (uint i = 0; i < someArray.length; i++)` where
  `someArray` could grow with every batch or every reading, stop — that's the
  kind of pattern that becomes unusable (or exploitable) once the array is
  large. Ask whether the data belongs in an event instead (it almost always
  does — see `ARCHITECTURE.md` §5's note on events vs storage).
- Custody state transitions are one-directional (`REGISTERED → IN_TRANSIT →
  IN_STORAGE → AT_RETAIL → SOLD`). The `require(uint8(newState) >
  uint8(b.state), ...)` check in `AgriChainCore.transferCustody` enforces
  this — do not remove or weaken it.
- Every contract change needs at least one Hardhat test before it's
  considered done. See `TASKS.md` for exactly which tests are required for
  the essential build.

## 6. Never fabricate a data shape

Covered in depth in `ARCHITECTURE.md` §4. Restated as a hard rule because
it's the rule most likely to be silently broken: **before writing any backend
endpoint that a frontend screen will consume, open the corresponding
`mockData.js` (or `consumerData.js`) export and copy its exact shape.** Do
not rename a key because a different name seems clearer. Do not add a field
the mock doesn't have because it seems useful. Do not omit a field the mock
has because your database doesn't have that column yet — add the column
instead.

## 7. Secrets

- `.env` is never committed. Check `.gitignore` includes it before the first
  commit of any session.
- The backend's blockchain account (the one that calls `onlyOwner` functions)
  uses a private key that lives in `.env` only, loaded via environment
  variable, never hardcoded in `chain.py` or anywhere else.
- For the essential build, this account is one of Hardhat's default funded
  local test accounts — these are public, well-known test keys with zero
  real value, safe to reference in `TASKS.md` and in comments, but still
  loaded from `.env` rather than typed directly into source, as a habit that
  carries over correctly once this moves to a real testnet (O5).

## 8. When something isn't covered here

If a situation comes up that isn't addressed by this file, the default is:
**prefer the smaller, more boring, more reversible option**, and write down
what you chose and why in `MEMORY.md`. A future session (human or agent) can
revisit the decision with full context; a silent choice can't be revisited
because no one will know it was made.
