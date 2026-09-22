# Track D – Front‑end dApp (Owner: TRACK D)

## Overview
Using Next.js 14, build a role‑based UI that interacts with the backend APIs and displays traceability state for each actor.

---

### 1. API Types (max 1 day)
**Task** – Generate TypeScript types from the API contract (e.g. using `openapi-typescript`) and integrate them into the Next.js project.

| Dep. | Done When | Owner |
|------|-----------|-------|
| None | `npx openapi-typescript api.yaml > types.ts` produces a `types.ts` file | `TRACK D` |

### 2. Login & Role Handling (max 2 days)
**Task** – Implement login via Supabase Auth/O Auth0, retrieve JWT and role claims, and apply route protection.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 1 | Logging in returns JWT containing `role` claim; `/dashboard` redirects if role mismatches | `TRACK D` |

### 3. Farmer Dash (max 3 days)
**Task** – Page to register a new batch (`POST /ingest` via /trust).  Show batch status.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 2 | Form submission yields a `batchId` and shows status `InTransit` | `TRACK D` |

### 4. Logistics View (max 3 days)
**Task** – Page to view batches in transit, update status to `InStorage`.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 3 | Status change triggers a blockchain event; UI updates | `TRACK D` |

### 5. Retailer & Consumer Views (max 4 days)
**Task** – Retailer sells batch -> status `Sold`; consumer scans QR and sees full trace.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 4 | Consumer page displays event history and QR link | `TRACK D` |

### 6. End‑to‑End Integration Test (max 2 days)
**Task** – Run Cypress tests that simulate a full flow: farmer -> logistics -> retailer -> consumer.

| Dep. | Done When | Owner |
|------|-----------|-------|
| Task 5 | Cypress test passes, produces a screenshot of the consumer trace | `TRACK D` |
