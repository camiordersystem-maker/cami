# Operations

## Billing

The current production-grade invoice tables (`invoices`, `invoice_items`, `payments`) have been added as expand-only schema. UI/API coverage is still incomplete, so billing remains `NOT READY` as the sole operational billing workflow until PDF/email/reissue/payment flows are completed and tested.

## Orders And Inventory

PostgreSQL runtime now uses Neon serverless `Pool` via `drizzle-orm/neon-serverless`, which supports interactive transactions. Order creation writes order header, items, inventory allocation, inventory movement ledger, status history, and audit log in one transaction on PostgreSQL.

SQLite local development keeps a non-transaction fallback for developer ergonomics; production readiness must be judged on staging PostgreSQL.

## Inventory Ledger

`inventory_movements` records:

- `initial`
- `inbound`
- `order_allocation`
- `cancellation_return`
- `manual_adjustment`
- `return`
- `correction`

Manual inventory adjustment requires a reason and records movement history.

## Terms

Published terms are no longer directly overwritten; editing after publication creates a new draft version. Members must consent to the latest published terms before ordering.

## Health Checks

- `/api/health` returns process health.
- `/api/readiness` checks database connectivity.

## Returns And Refunds

Returns, refunds, post-shipment cancellation, credit notes, and invoice correction UI remain incomplete. They must be handled outside the system until finished.
