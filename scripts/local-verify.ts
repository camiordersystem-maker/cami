import { Pool } from "pg";
import { LOCAL_DATABASE_URL, assertLocalDatabaseUrl } from "./local-env";

assertLocalDatabaseUrl(LOCAL_DATABASE_URL);

const pool = new Pool({ connectionString: LOCAL_DATABASE_URL });
const requiredTables = [
  "admins",
  "members",
  "member_ranks",
  "products",
  "inventory",
  "inventory_movements",
  "shipping_addresses",
  "orders",
  "order_items",
  "order_status_histories",
  "terms",
  "member_terms_consents",
  "audit_logs",
  "invoices",
  "invoice_items",
  "payments",
];

function quoteIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`Unsafe table name: ${value}`);
  return `"${value}"`;
}

async function main() {
  for (const table of requiredTables) {
    const result = await pool.query<{ name: string | null }>("SELECT to_regclass($1) AS name", [`public.${table}`]);
    if (!result.rows[0]?.name) throw new Error(`missing table: ${table}`);
  }

  const counts = [];
  for (const table of requiredTables) {
    const result = await pool.query<{ count: string }>(`SELECT count(*) AS count FROM ${quoteIdentifier(table)}`);
    counts.push({ table, count: Number(result.rows[0]?.count ?? 0) });
  }

  console.table(counts);
  console.log("local verification completed");
}

main()
  .catch((error) => {
    console.error("Local verification failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
