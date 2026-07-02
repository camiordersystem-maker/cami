import { isPostgresUrl, isSqliteUrl } from "../src/lib/env";

export function assertStagingDatabaseUrl(url: string | undefined): asserts url is string {
  if (!url || !isPostgresUrl(url) || isSqliteUrl(url)) {
    throw new Error("DATABASE_URL must be a PostgreSQL staging URL.");
  }
  if (process.env.VERCEL_ENV === "production" || process.env.APP_ENV === "production") {
    throw new Error("Refusing to run staging command in production.");
  }
  const parsed = new URL(url);
  const identity = `${parsed.hostname} ${parsed.pathname}`.toLowerCase();
  if (!identity.includes("staging") && !identity.includes("preview") && process.env.ALLOW_NON_STAGING_DB !== "true") {
    throw new Error("Refusing to run: database host/name does not look like staging.");
  }
}
