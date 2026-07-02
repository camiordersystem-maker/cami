import assert from "node:assert/strict";
import { canTransitionOrder } from "../order-status";
import { generateInvoiceNo, generateOrderNo, TAX_RATE } from "../utils";
import { isPostgresUrl, isSqliteUrl } from "../env";

assert.equal(canTransitionOrder("pending", "confirmed"), true);
assert.equal(canTransitionOrder("confirmed", "shipped"), true);
assert.equal(canTransitionOrder("shipped", "cancelled"), false);
assert.equal(canTransitionOrder("delivered", "cancelled"), false);
assert.equal(canTransitionOrder("cancel_requested", "cancelled"), true);

const subtotal = 3880 * 24 * 0.5;
const taxAmount = Math.round(subtotal * TAX_RATE);
assert.equal(taxAmount, 4656);

assert.match(generateOrderNo(), /^ORD-\d{8}-\d{4}$/);
assert.match(generateInvoiceNo(2026, 7), /^INV-202607-\d{3}$/);

assert.equal(isPostgresUrl("postgresql://user:pass@example.com/db"), true);
assert.equal(isPostgresUrl("postgres://user:pass@example.com/db"), true);
assert.equal(isSqliteUrl("sqlite://local.db"), true);
assert.equal(isSqliteUrl("./local.db"), true);

console.log("business rules ok");
