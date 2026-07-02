import assert from "node:assert/strict";
import * as pgSchema from "../src/lib/db/schema-pg";
import * as sqliteSchema from "../src/lib/db/schema-sqlite";

const requiredExports = [
  "memberRanks",
  "members",
  "admins",
  "shippingAddresses",
  "products",
  "inventory",
  "inventoryReceipts",
  "orders",
  "orderItems",
  "monthlyInvoices",
  "auditLogs",
  "terms",
  "systemSettings",
  "notifications",
  "announcements",
  "announcementReads",
  "inventoryMovements",
  "orderStatusHistories",
  "memberTermsConsents",
  "passwordResetTokens",
  "invoices",
  "invoiceItems",
  "payments",
];

for (const key of requiredExports) {
  assert.ok(key in pgSchema, `PostgreSQL schema missing ${key}`);
  assert.ok(key in sqliteSchema, `SQLite schema missing ${key}`);
}

const pgOrderStatuses = pgSchema.orderStatusEnum.enumValues;
assert.ok(pgOrderStatuses.includes("cancel_requested"), "PostgreSQL order_status must include cancel_requested");

console.log("schema verification ok");
