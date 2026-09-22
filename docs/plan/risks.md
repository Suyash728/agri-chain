# Risks & Mitigation

| Risk | Early Warning | Mitigation | Owner (placeholder) |
|------|---------------|------------|---------------------|
| **IoT simulator accuracy** | Incomplete or unrealistic telemetry leads to false‑positive ML training | Validate simulator against real data once hardware is available; run unit tests on synthetic datasets | `TRACK A` |
| **AI model false‑alerts** | Too many anomalies block genuine data | Tune Isolation‑Forest thresholds; add a feedback loop from users | `TRACK B` |
| **Hardhat test flakiness on Amoy** | Network delays cause tx failures in CI | Add retry logic; use `hardhat-gas-reporter` and set `timeout` high | `TRACK C` |
| **Role management mismatch** | Front‑end UI shows an action that the back‑end rejects | Freeze API contract; run automated integration tests | `TRACK D` |
| **Supabase rate limits** | Development database throttles when many events are ingested | Use local Postgres for tests; batch writes during integration | `TRACK A` |
| **Time‑zone / timestamp drift** | Mis‑aligned event ordering on chain | Require UTC timestamps; use NTP on simulator | `TRACK A`|
| **Front‑end build failures** | Missing or mis‑typed types in API responses | Use TypeScript type generation from API contract | `TRACK D` |
| **Security of the oracle writer** | Unauthorized writes to contracts | Sign transactions with a private key stored in Render environment; rotate key monthly | `TRACK C` |
