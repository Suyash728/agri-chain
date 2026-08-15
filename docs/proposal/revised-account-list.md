# Revised Account List (5 total)

The system's actor model, reduced to five accounts. Warehouse and Transporter are
merged into a single **Logistics Partner** role, with custody distinguished by
state (`IN_TRANSIT` / `IN_STORAGE`) rather than by separate accounts.

| # | Account | Role |
|---|---------|------|
| 1 | Admin | Onboards/approves accounts, assigns blockchain roles, freezes accounts, moderates reviews |
| 2 | Farmer | Registers harvest batch, hands off custody, receives review feedback |
| 3 | Logistics Partner (Warehouse + Transporter merged) | Transports and/or stores the batch; custody tracked as `IN_TRANSIT` / `IN_STORAGE` states; accountable for cold-chain breaches in either state |
| 4 | Dark Store / Retailer | Receives stock, manages inventory/expiry, sells to consumer |
| 5 | Consumer | Scans QR, verifies journey, submits review |
