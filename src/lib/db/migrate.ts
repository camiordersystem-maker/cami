// SQLite マイグレーション実行スクリプト
// npm run db:migrate で呼び出される
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.SQLITE_PATH ?? "./local.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite, { schema });

const migrationsFolder = path.join(
  process.cwd(),
  "src/lib/db/migrations/sqlite"
);

console.log(`🗄️  Running SQLite migrations from: ${migrationsFolder}`);
console.log(`📁 Database: ${dbPath}`);

migrate(db, { migrationsFolder });

console.log("✅ Migrations completed");
sqlite.close();
