import { neon } from "@neondatabase/serverless";
import { assertStagingDatabaseUrl } from "./staging-safety";

const url = process.env.DATABASE_URL;
assertStagingDatabaseUrl(url);
if (process.env.CONFIRM_STAGING_RESET !== "true") {
  throw new Error("Set CONFIRM_STAGING_RESET=true to reset staging dummy data.");
}
const sql = neon(url);

async function main() {
  await sql`DELETE FROM payments WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_no LIKE 'STAGE-%')`;
  await sql`DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_no LIKE 'STAGE-%')`;
  await sql`DELETE FROM invoices WHERE invoice_no LIKE 'STAGE-%'`;
  await sql`DELETE FROM member_terms_consents WHERE member_id IN (SELECT id FROM members WHERE email LIKE 'stage-%@example.com')`;
  await sql`DELETE FROM order_status_histories WHERE order_id IN (SELECT id FROM orders WHERE order_no LIKE 'STAGE-%')`;
  await sql`DELETE FROM inventory_movements WHERE order_id IN (SELECT id FROM orders WHERE order_no LIKE 'STAGE-%')`;
  await sql`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_no LIKE 'STAGE-%')`;
  await sql`DELETE FROM orders WHERE order_no LIKE 'STAGE-%'`;
  await sql`DELETE FROM shipping_addresses WHERE member_id IN (SELECT id FROM members WHERE email LIKE 'stage-%@example.com')`;
  await sql`DELETE FROM members WHERE email LIKE 'stage-%@example.com'`;
  await sql`DELETE FROM inventory WHERE product_id LIKE 'stage-%'`;
  await sql`DELETE FROM products WHERE id LIKE 'stage-%'`;
  await sql`DELETE FROM admins WHERE email LIKE 'stage-%@example.com'`;
  console.log("staging reset completed");
}

main().catch((error) => {
  console.error("staging reset failed", error);
  process.exit(1);
});
