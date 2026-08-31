import { cache } from "react";
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

// Cloudflare Workersはリクエストをまたいだ I/O オブジェクトの使い回しを
// 禁止している（"Cannot perform I/O on behalf of a different request"）。
// Neonの@neondatabase/serverless Poolを1つのWorkerインスタンス（複数
// リクエストを処理し続ける）でモジュールレベルの定数として使い回すと
// この違反になる。
//
// `export const db = createDb()` のような書き方は、値がモジュール初回
// 読込時に1度だけ計算されるため、この対策として不十分（実際に検証して
// 500/200/500と不安定になることを確認済み）。React.cache()でNext.jsの
// 「リクエスト単位」の仕組みに接続生成を乗せ、Proxyで既存の54箇所の
// `import { db } from "@/lib/db"` の呼び出し方を変えずに済むようにする。
//
// 同一リクエスト内の複数クエリ・db.transaction()は同じ接続を共有する
// （cache()は同一リクエスト内では同じ結果を返すため、トランザクション内の
// pg_advisory_xact_lockを使った排他制御はこれまで通り機能する）。
const isCloudflareWorkers = process.env.RUNTIME_TARGET === "cloudflare-workers";
const getRequestScopedDb = cache(() => createDb());

function resolveDb(): ReturnType<typeof createDb> {
  if (isCloudflareWorkers) {
    return getRequestScopedDb();
  }
  if (!globalForDb.db) {
    globalForDb.db = createDb();
  }
  return globalForDb.db;
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop, _receiver) {
    const instance = resolveDb() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as ReturnType<typeof createDb>;

export { schema };
export type DB = typeof db;
