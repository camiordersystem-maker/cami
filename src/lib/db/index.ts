import * as schema from "./schema";
import { assertRuntimeEnv, isPostgresUrl } from "@/lib/env";

// SQLite is kept for legacy local fallback. PostgreSQL is used for Neon in
// shared environments and node-postgres for local Docker databases.

function isLocalPostgresUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function createDb() {
  assertRuntimeEnv();
  const url = process.env.DATABASE_URL ?? "";

  if (isPostgresUrl(url)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const schemaPg = require("./schema-pg");

    if (isLocalPostgresUrl(url)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require("pg");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { drizzle } = require("drizzle-orm/node-postgres");
      const pool = new Pool({
        connectionString: url,
        max: Number(process.env.DATABASE_POOL_MAX ?? 5),
        idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS ?? 10_000),
        connectionTimeoutMillis: Number(process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? 10_000),
      });
      return drizzle(pool, { schema: schemaPg }) as ReturnType<typeof import("drizzle-orm/better-sqlite3")["drizzle"]>;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/neon-serverless");
    if (!neonConfig.webSocketConstructor && globalThis.WebSocket) {
      neonConfig.webSocketConstructor = globalThis.WebSocket;
    }
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS ?? 10_000),
      connectionTimeoutMillis: Number(process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? 10_000),
    });
    return drizzle(pool, { schema: schemaPg }) as ReturnType<typeof import("drizzle-orm/better-sqlite3")["drizzle"]>;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SQLite is not allowed in production.");
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  const dbPath = process.env.SQLITE_PATH ?? "./local.db";
  const sqlite = new Database(dbPath);

  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined;
};

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

export { schema };
export type DB = typeof db;
