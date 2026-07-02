import { Pool } from "pg";
import { LOCAL_DATABASE_URL, assertLocalDatabaseUrl } from "./local-env";

assertLocalDatabaseUrl(LOCAL_DATABASE_URL);
if (process.env.CONFIRM_LOCAL_RESET !== "true") {
  throw new Error("Set CONFIRM_LOCAL_RESET=true to reset the local PostgreSQL database.");
}

const pool = new Pool({ connectionString: LOCAL_DATABASE_URL });
const tables = [
  "payments",
  "invoice_items",
  "invoices",
  "password_reset_tokens",
  "member_terms_consents",
  "order_status_histories",
  "inventory_movements",
  "announcement_reads",
  "announcements",
  "notifications",
  "inventory_receipts",
  "monthly_invoices",
  "audit_logs",
  "order_items",
  "orders",
  "shipping_addresses",
  "inventory",
  "products",
  "members",
  "admins",
  "terms",
  "system_settings",
  "member_ranks",
];

function quoteIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`Unsafe table name: ${value}`);
  return `"${value}"`;
}

async function main() {
  await pool.query(`TRUNCATE TABLE ${tables.map(quoteIdentifier).join(", ")} RESTART IDENTITY CASCADE`);
  console.log("local database reset completed");
}

main()
  .catch((error) => {
    console.error("Local reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
