import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "";
const isPg = url.startsWith("postgresql://") || url.startsWith("postgres://");

const config: Config = isPg
  ? {
      // ── Production: Neon PostgreSQL ──────────────────────────────────────
      schema: "./src/lib/db/schema.pg.ts",
      out: "./src/lib/db/migrations/pg",
      dialect: "postgresql",
      dbCredentials: { url },
    }
  : {
      // ── Local: SQLite ────────────────────────────────────────────────────
      schema: "./src/lib/db/schema.ts",
      out: "./src/lib/db/migrations/sqlite",
      dialect: "sqlite",
      dbCredentials: {
        url: process.env.SQLITE_PATH ?? "./local.db",
      },
    };

export default config;
