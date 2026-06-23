import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const sql = neon(url);

async function main() {
  console.log("🌱 Seeding PostgreSQL database...\n");

  // ── 1. ランクマスタ
  console.log("📊 Creating member ranks...");
  const existingRanks = await sql`SELECT id, name FROM member_ranks` as Array<{ id: string; name: string }>;
  const rankMap: Record<string, string> = {};

  if (existingRanks.length === 0) {
    const ranks = [
      { name: "スタンダード", rate: "0.50", min_monthly_boxes: 0, description: "通常卸値。掛け率50%（定価の50%）" },
      { name: "シルバー",     rate: "0.45", min_monthly_boxes: 5,  description: "月5箱以上の優良取引先。掛け率45%" },
      { name: "ゴールド",     rate: "0.40", min_monthly_boxes: 10, description: "月10箱以上の主要取引先。掛け率40%" },
      { name: "プラチナ",     rate: "0.35", min_monthly_boxes: 20, description: "月20箱以上の最優良取引先。掛け率35%" },
    ];
    for (const r of ranks) {
      const id = randomUUID();
      await sql`INSERT INTO member_ranks (id, name, rate, min_monthly_boxes, description) VALUES (${id}, ${r.name}, ${r.rate}, ${r.min_monthly_boxes}, ${r.description})`;
      rankMap[r.name] = id;
    }
    console.log(`  ✓ ${ranks.length} ranks created`);
  } else {
    existingRanks.forEach((r) => (rankMap[r.name] = r.id));
    console.log(`  ℹ  Ranks already exist (${existingRanks.length})`);
  }

  // ── 2. 管理者アカウント
  console.log("👤 Creating admin account...");
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cami.co.jp";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin1234!";

  const existingAdmins = await sql`SELECT id FROM admins WHERE email = ${adminEmail}`;
  if (existingAdmins.length === 0) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await sql`INSERT INTO admins (id, email, password, name) VALUES (${randomUUID()}, ${adminEmail}, ${hashed}, ${"システム管理者"})`;
    console.log(`  ✓ Admin created: ${adminEmail}`);
  } else {
    console.log(`  ℹ  Admin already exists: ${adminEmail}`);
  }

  // ── 3. 商品マスタ + 在庫
  console.log("📦 Creating products...");
  const existingProducts = await sql`SELECT id FROM products`;

  if (existingProducts.length === 0) {
    const products = [
      { name: "Camiヘアオイル 60ml",  description: "軽めのテクスチャーで毛先のまとまりをサポート。ダメージケアに最適。", retail_price: 3880, bottles_per_box: 24 },
      { name: "Camiヘアオイル 100ml", description: "リッチなテクスチャーでしっかり保湿。乾燥が気になる方に。",          retail_price: 3880, bottles_per_box: 24 },
    ];
    for (const p of products) {
      const productId = randomUUID();
      await sql`INSERT INTO products (id, name, description, retail_price, bottles_per_box, is_active) VALUES (${productId}, ${p.name}, ${p.description}, ${p.retail_price}, ${p.bottles_per_box}, true)`;
      const inventoryId = randomUUID();
      await sql`INSERT INTO inventory (id, product_id, available_boxes, updated_by) VALUES (${inventoryId}, ${productId}, 100, ${"system"})`;
    }
    console.log(`  ✓ ${products.length} products + inventory created`);
  } else {
    console.log(`  ℹ  Products already exist (${existingProducts.length})`);
  }

  // ── 4. テスト会員（デモ用）
  console.log("🏪 Creating test member...");
  const memberEmail = "test-salon@example.com";
  const existingMembers = await sql`SELECT id FROM members WHERE email = ${memberEmail}`;

  if (existingMembers.length === 0) {
    if (Object.keys(rankMap).length === 0) {
      const ranks = await sql`SELECT id, name FROM member_ranks` as Array<{ id: string; name: string }>;
      ranks.forEach((r) => (rankMap[r.name] = r.id));
    }
    const memberPassword = await bcrypt.hash("Member1234!", 12);
    const memberId = randomUUID();
    await sql`
      INSERT INTO members (id, email, password, company_name, contact_name, phone, address, business_description, status, rank_id)
      VALUES (${memberId}, ${memberEmail}, ${memberPassword}, ${"テストサロン"}, ${"田中 花子"}, ${"03-1234-5678"}, ${"東京都渋谷区テスト1-2-3"}, ${"ヘアサロン（席数8席）"}, ${"approved"}, ${rankMap["スタンダード"]})
    `;
    await sql`
      INSERT INTO shipping_addresses (id, member_id, label, recipient_name, postal_code, prefecture, address1, phone, is_default)
      VALUES (${randomUUID()}, ${memberId}, ${"本店"}, ${"田中 花子"}, ${"150-0001"}, ${"東京都"}, ${"渋谷区テスト1-2-3"}, ${"03-1234-5678"}, true)
    `;
    console.log(`  ✓ Test member: ${memberEmail}`);
  } else {
    console.log(`  ℹ  Test member already exists`);
  }

  // ── 5. システム設定（初期行）
  console.log("⚙️  Initializing system settings...");
  const existingSettings = await sql`SELECT id FROM system_settings WHERE id = 'singleton'`;
  if (existingSettings.length === 0) {
    await sql`INSERT INTO system_settings (id) VALUES ('singleton')`;
    console.log("  ✓ System settings row created");
  } else {
    console.log("  ℹ  System settings already initialized");
  }

  console.log("\n✅ Seed completed!");
  console.log(`  管理者: ${adminEmail} / ${adminPassword}`);
  console.log(`  店舗:   test-salon@example.com / Member1234!\n`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
