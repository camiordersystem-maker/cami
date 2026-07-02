# Operations

## Billing

The current invoice feature is a monthly aggregate invoice. It does not yet provide full production billing controls such as line-item snapshots, revision history, PDF generation, email resend, partial payment history, or credit note handling.

Until those are implemented, billing must be handled outside this system, and this system should be treated as an order reference only.

## Orders And Inventory

Order creation performs guarded inventory decrement and attempts compensation on failure. Because the current Neon HTTP driver does not support interactive transactions, this is not equivalent to a database transaction on PostgreSQL.

Production readiness requires either a transaction-capable PostgreSQL driver or a fully atomic SQL/order workflow.

## Returns And Refunds

Returns, refunds, post-shipment cancellation, credit notes, and invoice correction workflows are not implemented. They must be handled outside the system until designed and built.

## Terms

Terms publishing exists, but member consent tracking and re-consent enforcement are not implemented.
