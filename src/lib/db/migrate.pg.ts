import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { sql as drizzleSql } from "drizzle-orm";
import path from "path";
import fs from "fs";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const sqlRaw = neon(url);
const db = drizzle(sqlRaw);
const migrationsFolder = path.join(process.cwd(), "src/lib/db/migrations/pg");

// SQL files not tracked by Drizzle journal — applied idempotently via _extra_migrations table
const EXTRA_MIGRATIONS = [
  "0001_add_terms.sql",
  "0002_add_product_image.sql",
  "0003_add_admin_role.sql",
];

async function runExtraMigrations() {
  await sqlRaw`
    CREATE TABLE IF NOT EXISTS _extra_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz DEFAULT now()
    )
  `;

  const applied = await sqlRaw`SELECT filename FROM _extra_migrations`;
  const appliedSet = new Set(applied.map((r: Record<string, unknown>) => r.filename as string));

  for (const file of EXTRA_MIGRATIONS) {
    if (appliedSet.has(file)) {
      console.log(`  ✓ Already applied: ${file}`);
      continue;
    }
    const filePath = path.join(migrationsFolder, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ File not found, skipping: ${file}`);
      continue;
    }
    console.log(`  → Applying: ${file}`);
    const content = fs.readFileSync(filePath, "utf-8");
    for (const stmt of content.split(";").map((s) => s.trim()).filter(Boolean)) {
      await db.execute(drizzleSql.raw(stmt));
    }
    await sqlRaw`INSERT INTO _extra_migrations (filename) VALUES (${file})`;
    console.log(`  ✓ Applied: ${file}`);
  }
}

async function main() {
  console.log("Running PostgreSQL migrations...");
  await migrate(db, { migrationsFolder });
  console.log("Running extra SQL migrations...");
  await runExtraMigrations();
  console.log("All migrations completed");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
