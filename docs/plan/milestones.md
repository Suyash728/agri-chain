# Milestones

| Month | Milestone | Deliverable | Verification | Owner (placeholder) |
|-------|-----------|-------------|--------------|---------------------|
| **Aug ‑ Sep** | End‑to‑end data flow | Simulated sensor emits a valid batch → ingestion → AI trust → oracle → on‑chain event | `curl http://localhost:8000/ingest` returns 200 + contract event in Supabase query | `TRACK A` |
| **Oct** | AI & Contract readiness | Isolation‑Forest model trained; first 3 contracts deployed on Polygon Amoy | `npx hardhat run scripts/deploy.js --network amoy` outputs tx hash; `hardhat-ethers` query shows event | `TRACK B` & `TRACK C` |
| **Nov** | Front‑end interactive UI | Next.js dApp can view on‑chain state and perform role actions (farmer register, transfer, retail sale) | Screenshot of dApp page, `npx hardhat test` passes | `TRACK D` |
| **Dec** | Complete demo & paper results | Production‑ready demo showing end‑to‑end flow; results table in IEEE‑style format | `diff --quiet results.csv` (matches expected) | `ALL` |
