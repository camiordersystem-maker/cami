import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { assertStagingDatabaseUrl } from "./staging-safety";

const url = process.env.DATABASE_URL;
assertStagingDatabaseUrl(url);
const databaseUrl = url;
const sql = neon(databaseUrl);
const password = await bcrypt.hash(process.env.STAGING_DEFAULT_PASSWORD ?? "Staging1234!", 12);

async function upsertRank(name: string, rate: string) {
  const rows = await sql`SELECT id FROM member_ranks WHERE name = ${name}`;
  if (rows[0]) return rows[0].id as string;
  const id = randomUUID();
  await sql`INSERT INTO member_ranks (id, name, rate, min_monthly_boxes, description) VALUES (${id}, ${name}, ${rate}, 0, ${"staging"})`;
  return id;
}

async function main() {
  const rankId = await upsertRank("ステージング標準", "0.50");
  const admins = [
    ["stage-superadmin@example.com", "ステージングSuperadmin", "superadmin"],
    ["stage-editor@example.com", "ステージングEditor", "editor"],
    ["stage-viewer@example.com", "ステージングViewer", "viewer"],
  ];
  for (const [email, name, role] of admins) {
    await sql`
      INSERT INTO admins (id, email, password, name, role, is_active)
      VALUES (${randomUUID()}, ${email}, ${password}, ${name}, ${role}, true)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, is_active = true
    `;
  }

  const members = [
    ["stage-approved@example.com", "ステージング承認店舗", "approved"],
    ["stage-pending@example.com", "ステージング審査中店舗", "pending"],
    ["stage-suspended@example.com", "ステージング停止店舗", "suspended"],
    ["stage-rejected@example.com", "ステージング却下店舗", "rejected"],
  ];
  for (const [email, company, status] of members) {
    const existing = await sql`SELECT id FROM members WHERE email = ${email}`;
    const memberId = (existing[0]?.id as string | undefined) ?? randomUUID();
    await sql`
      INSERT INTO members (id, email, password, company_name, contact_name, phone, address, business_description, status, rank_id)
      VALUES (${memberId}, ${email}, ${password}, ${company}, ${"ステージング担当"}, ${"03-0000-0000"}, ${"東京都テスト区1-1-1"}, ${"staging"}, ${status}, ${rankId})
      ON CONFLICT (email) DO UPDATE SET company_name = EXCLUDED.company_name, status = EXCLUDED.status
    `;
    await sql`
      INSERT INTO shipping_addresses (id, member_id, label, recipient_name, postal_code, prefecture, address1, phone, is_default)
      VALUES (${randomUUID()}, ${memberId}, ${"本店"}, ${"ステージング担当"}, ${"1000001"}, ${"東京都"}, ${"千代田区1-1-1"}, ${"03-0000-0000"}, true)
      ON CONFLICT DO NOTHING
    `;
  }

  const products = [
    ["stage-active-stock", "ステージング有効在庫あり", true, 100],
    ["stage-active-empty", "ステージング在庫切れ", true, 0],
    ["stage-active-low", "ステージング低在庫", true, 2],
    ["stage-inactive", "ステージング販売停止", false, 10],
  ] as const;
  for (const [id, name, active, boxes] of products) {
    await sql`
      INSERT INTO products (id, name, description, retail_price, bottles_per_box, is_active)
      VALUES (${id}, ${name}, ${"staging"}, 3880, 24, ${active})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active
    `;
    await sql`
      INSERT INTO inventory (id, product_id, available_boxes, updated_by)
      VALUES (${randomUUID()}, ${id}, ${boxes}, ${"staging-seed"})
      ON CONFLICT (product_id) DO UPDATE SET available_boxes = EXCLUDED.available_boxes, updated_by = EXCLUDED.updated_by
    `;
  }

  const terms = await sql`SELECT id FROM terms WHERE is_published = true ORDER BY version DESC LIMIT 1`;
  if (terms.length === 0) {
    await sql`INSERT INTO terms (id, content, is_published, published_at, version, updated_by) VALUES (${randomUUID()}, ${"ステージング公開約款"}, true, now(), 1, ${"staging-seed"})`;
  }
  console.log("staging seed completed");
}

main().catch((error) => {
  console.error("staging seed failed", error);
  process.exit(1);
});
