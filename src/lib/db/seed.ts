import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const dbPath = process.env.SQLITE_PATH ?? "./local.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. ランクマスタ ────────────────────────────────────────────────────────
  console.log("📊 Creating member ranks...");
  const existingRanks = await db.select().from(schema.memberRanks);
  const rankMap: Record<string, string> = {};

  if (existingRanks.length === 0) {
    const ranks = await db
      .insert(schema.memberRanks)
      .values([
        {
          name: "スタンダード",
          rate: 0.5,
          minMonthlyBoxes: 0,
          description: "通常卸値。掛け率50%（定価の50%）",
        },
        {
          name: "シルバー",
          rate: 0.45,
          minMonthlyBoxes: 5,
          description: "月5箱以上の優良取引先。掛け率45%",
        },
        {
          name: "ゴールド",
          rate: 0.4,
          minMonthlyBoxes: 10,
          description: "月10箱以上の主要取引先。掛け率40%",
        },
        {
          name: "プラチナ",
          rate: 0.35,
          minMonthlyBoxes: 20,
          description: "月20箱以上の最優良取引先。掛け率35%",
        },
      ])
      .returning();
    ranks.forEach((r) => (rankMap[r.name] = r.id));
    console.log(`  ✓ ${ranks.length} ranks created`);
  } else {
    existingRanks.forEach((r) => (rankMap[r.name] = r.id));
    console.log(`  ℹ  Ranks already exist (${existingRanks.length})`);
  }

  // ── 2. 管理者アカウント ────────────────────────────────────────────────────
  console.log("👤 Creating admin account...");
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cami.co.jp";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin1234!";

  const [existingAdmin] = await db
    .select()
    .from(schema.admins)
    .where(eq(schema.admins.email, adminEmail));

  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await db.insert(schema.admins).values({
      email: adminEmail,
      password: hashed,
      name: "システム管理者",
    });
    console.log(`  ✓ Admin created: ${adminEmail}`);
    console.log(`  ⚠  Initial password: ${adminPassword}（要変更）`);
  } else {
    console.log(`  ℹ  Admin already exists: ${adminEmail}`);
  }

  // ── 3. 商品マスタ + 在庫 ──────────────────────────────────────────────────
  console.log("📦 Creating products...");
  const existingProducts = await db.select().from(schema.products);

  if (existingProducts.length === 0) {
    const createdProducts = await db
      .insert(schema.products)
      .values([
        {
          name: "Camiヘアオイル 60ml",
          description: "軽めのテクスチャーで毛先のまとまりをサポート。ダメージケアに最適。",
          retailPrice: 3880,
          bottlesPerBox: 24,
          isActive: true,
        },
        {
          name: "Camiヘアオイル 100ml",
          description: "リッチなテクスチャーでしっかり保湿。乾燥が気になる方に。",
          retailPrice: 3880,
          bottlesPerBox: 24,
          isActive: true,
        },
      ])
      .returning();
    console.log(`  ✓ ${createdProducts.length} products created`);

    await db.insert(schema.inventory).values(
      createdProducts.map((p) => ({
        productId: p.id,
        availableBoxes: 100,
        updatedBy: "system",
      }))
    );
    console.log(`  ✓ Inventory initialized (100 boxes each)`);
  } else {
    console.log(`  ℹ  Products already exist (${existingProducts.length})`);
  }

  // ── 4. テスト会員（開発用） ────────────────────────────────────────────────
  console.log("🏪 Creating test member...");
  const memberEmail = "test-salon@example.com";

  const [existingMember] = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.email, memberEmail));

  if (!existingMember) {
    const memberPassword = await bcrypt.hash("Member1234!", 12);

    // rankMap が空の場合（既存ランクを使用）
    if (Object.keys(rankMap).length === 0) {
      const ranks = await db.select().from(schema.memberRanks);
      ranks.forEach((r) => (rankMap[r.name] = r.id));
    }
    const standardRankId = rankMap["スタンダード"];

    const [member] = await db
      .insert(schema.members)
      .values({
        email: memberEmail,
        password: memberPassword,
        companyName: "テストサロン",
        contactName: "田中 花子",
        phone: "03-1234-5678",
        address: "東京都渋谷区テスト1-2-3",
        businessDescription: "ヘアサロン（席数8席）",
        status: "approved",
        rankId: standardRankId,
      })
      .returning();

    await db.insert(schema.shippingAddresses).values({
      memberId: member.id,
      label: "本店",
      recipientName: "田中 花子",
      postalCode: "150-0001",
      prefecture: "東京都",
      address1: "渋谷区テスト1-2-3",
      address2: null,
      phone: "03-1234-5678",
      isDefault: true,
    });

    console.log(`  ✓ Test member: ${memberEmail}`);
  } else {
    console.log(`  ℹ  Test member already exists`);
  }

  console.log("\n✅ Seed completed!\n");
  console.log("── ログイン情報 ──────────────────────────────────────────────");
  console.log(`  管理者 (port 3001): ${adminEmail} / ${adminPassword}`);
  console.log(`  店舗   (port 3000): test-salon@example.com / Member1234!`);
  console.log("──────────────────────────────────────────────────────────────\n");

  sqlite.close();
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  sqlite.close();
  process.exit(1);
});
