# Cami UX and inventory boundary (2026-11-17)

## Existing BtoB application

The Cami repository is `camiordersystem-maker/cami`, branch `staging`.
Production Worker is `cami-order-system-production`, account
`94e1c3350f8f37c6e0c5e14f39a3e4c5`. Never use Nuu or a global CLI identity
without checking that account. No schema migration is required by these changes.

The maintenance changes improve network-failure recovery, accessible login inputs,
mobile quantity editing, order-result uncertainty and stale-screen inventory edits.
An uncertain order response must lead to order-history verification, not automatic
resubmission. Inventory edits send `expectedAvailableBoxes`; mismatches return 409
before stock/history writes. The optional field preserves older-client compatibility.

## Independent all-channel inventory

A separate local inventory project was created at
`/Users/hiroshikento/Documents/Codex/Cami-Inventory-System`.
It is not a public Production service and must not share this app's business DB.
Its official product master comes from `cami.co.jp`; website availability is not
physical stock, retail prices are not BtoB prices, and unknown box packing is unset.

The initial application separates manufacturer purchase, receipt, inspection,
location, selling purpose, transfer and dispatch. Inspection adds only accepted
units. Canonical units and request idempotency prevent silent truncation and repeat
increments. A separate operations outbox supports dedicated LINE incident/recovery
messages, but real delivery and external BtoB monitoring are disabled by default.
The existing order-notification LINE credentials and flags are unchanged.

Before integration, match SKU/variant/product IDs and verified box packing,
reconcile opening stock at a known timestamp, and designate a single inventory
authority. Do not decrement both the legacy BtoB counter and new stock for one order.
Amazon SP-API authorization, SKU/FBA mapping, reservations, durable event delivery,
reconciliation and operator approval are still required; they are not connected.

Public deployment additionally requires dedicated authentication/roles, a shared
production DB, backup restore testing and independent always-on monitoring.
