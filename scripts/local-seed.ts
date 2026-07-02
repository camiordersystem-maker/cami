import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { LOCAL_DATABASE_URL, assertLocalDatabaseUrl } from "./local-env";

assertLocalDatabaseUrl(LOCAL_DATABASE_URL);

const pool = new Pool({ connectionString: LOCAL_DATABASE_URL });

type Row = Record<string, unknown>;

async function query<T extends Row = Row>(text: string, params: unknown[] = []) {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

async function main() {
  console.log("Seeding local PostgreSQL database...");

  const existingRanks = await query<{ id: string; name: string }>("SELECT id, name FROM member_ranks");
  const rankMap: Record<string, string> = {};

  if (existingRanks.length === 0) {
    const ranks = [
      { name: "スタンダード", rate: "0.50", minMonthlyBoxes: 0, description: "通常卸値。掛け率50%（定価の50%）" },
      { name: "シルバー", rate: "0.45", minMonthlyBoxes: 5, description: "月5箱以上の優良取引先。掛け率45%" },
      { name: "ゴールド", rate: "0.40", minMonthlyBoxes: 10, description: "月10箱以上の主要取引先。掛け率40%" },
      { name: "プラチナ", rate: "0.35", minMonthlyBoxes: 20, description: "月20箱以上の最優良取引先。掛け率35%" },
    ];
    for (const rank of ranks) {
      const id = randomUUID();
      await query(
        "INSERT INTO member_ranks (id, name, rate, min_monthly_boxes, description) VALUES ($1, $2, $3, $4, $5)",
        [id, rank.name, rank.rate, rank.minMonthlyBoxes, rank.description]
      );
      rankMap[rank.name] = id;
    }
    console.log(`created ${ranks.length} member ranks`);
  } else {
    for (const rank of existingRanks) rankMap[rank.name] = rank.id;
    console.log(`member ranks already exist (${existingRanks.length})`);
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cami.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin1234!";
  const existingAdmins = await query("SELECT id FROM admins WHERE email = $1", [adminEmail]);
  if (existingAdmins.length === 0) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await query("INSERT INTO admins (id, email, password, name, role, is_active) VALUES ($1, $2, $3, $4, $5, true)", [
      randomUUID(),
      adminEmail,
      hashed,
      "システム管理者",
      "superadmin",
    ]);
    console.log(`created admin: ${adminEmail}`);
  } else {
    console.log(`admin already exists: ${adminEmail}`);
  }

  const existingProducts = await query("SELECT id FROM products");
  if (existingProducts.length === 0) {
    const products = [
      { name: "Camiヘアオイル 60ml", description: "軽めのテクスチャーで毛先のまとまりをサポート。", retailPrice: 3880, bottlesPerBox: 24 },
      { name: "Camiヘアオイル 100ml", description: "リッチなテクスチャーで乾燥をケア。", retailPrice: 3880, bottlesPerBox: 24 },
    ];
    for (const product of products) {
      const productId = randomUUID();
      await query(
        "INSERT INTO products (id, name, description, retail_price, bottles_per_box, is_active) VALUES ($1, $2, $3, $4, $5, true)",
        [productId, product.name, product.description, product.retailPrice, product.bottlesPerBox]
      );
      await query("INSERT INTO inventory (id, product_id, available_boxes, updated_by) VALUES ($1, $2, $3, $4)", [
        randomUUID(),
        productId,
        100,
        "local-seed",
      ]);
    }
    console.log(`created ${products.length} products with inventory`);
  } else {
    console.log(`products already exist (${existingProducts.length})`);
  }

  const memberEmail = "test-salon@example.com";
  const existingMembers = await query("SELECT id FROM members WHERE email = $1", [memberEmail]);
  if (existingMembers.length === 0) {
    if (!rankMap["スタンダード"]) {
      const ranks = await query<{ id: string; name: string }>("SELECT id, name FROM member_ranks");
      for (const rank of ranks) rankMap[rank.name] = rank.id;
    }
    const memberId = randomUUID();
    const memberPassword = await bcrypt.hash("Member1234!", 12);
    await query(
      "INSERT INTO members (id, email, password, company_name, contact_name, phone, address, business_description, status, rank_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', $9)",
      [
        memberId,
        memberEmail,
        memberPassword,
        "テストサロン",
        "田中 花子",
        "03-1234-5678",
        "東京都渋谷区テスト1-2-3",
        "ヘアサロン（席数8席）",
        rankMap["スタンダード"],
      ]
    );
    await query(
      "INSERT INTO shipping_addresses (id, member_id, label, recipient_name, postal_code, prefecture, address1, phone, is_default) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)",
      [randomUUID(), memberId, "本店", "田中 花子", "1500001", "東京都", "渋谷区テスト1-2-3", "03-1234-5678"]
    );
    console.log(`created test member: ${memberEmail}`);
  } else {
    console.log("test member already exists");
  }

  const settings = await query("SELECT id FROM system_settings WHERE id = 'singleton'");
  if (settings.length === 0) {
    await query("INSERT INTO system_settings (id, company_name, company_email, support_email) VALUES ('singleton', $1, $2, $3)", [
      "Cami",
      "admin@cami.local",
      "support@cami.local",
    ]);
    console.log("created system settings");
  } else {
    console.log("system settings already exist");
  }

  const terms = await query("SELECT id FROM terms WHERE is_published = true LIMIT 1");
  if (terms.length === 0) {
    await query(
      "INSERT INTO terms (id, content, is_published, published_at, version, updated_by) VALUES ($1, $2, true, now(), 1, 'local-seed')",
      [randomUUID(), "ローカル動作確認用の利用規約です。本番公開前に正式版へ差し替えてください。"]
    );
    console.log("created local published terms");
  } else {
    console.log("published terms already exist");
  }

  console.log("Local seed completed");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log("Member: test-salon@example.com / Member1234!");
}

main()
  .catch((error) => {
    console.error("Local seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
