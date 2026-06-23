import * as schema from "./schema";

// ─── SQLite (local) vs Neon PostgreSQL (production) ───────────────────────────
// DATABASE_URL が postgresql:// で始まる場合は Neon を使用
// 未設定 or sqlite:// の場合は better-sqlite3 を使用

function createDb() {
  const url = process.env.DATABASE_URL ?? "";

  if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
    // ── Production: Neon PostgreSQL ──────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/neon-http");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const schemaPg = require("./schema-pg");
    const sql = neon(url);
    return drizzle(sql, { schema: schemaPg }) as ReturnType<typeof import("drizzle-orm/better-sqlite3")["drizzle"]>;
  }

  // ── Local: SQLite (better-sqlite3) ────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  const dbPath = process.env.SQLITE_PATH ?? "./local.db";
  const sqlite = new Database(dbPath);

  // WAL モードで書き込みパフォーマンスを向上
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

// シングルトン（Next.js の HMR でも再生成しない）
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export { schema };
export type DB = typeof db;
