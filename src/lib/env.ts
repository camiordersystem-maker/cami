const PG_URL_PATTERN = /^postgres(?:ql)?:\/\//;
const SQLITE_URL_PATTERN = /^(?:sqlite:|file:)|\.db(?:$|\?)/i;

export function isPostgresUrl(url: string): boolean {
  return PG_URL_PATTERN.test(url);
}

export function isPostgresRuntime(): boolean {
  return isPostgresUrl(process.env.DATABASE_URL ?? "");
}

export function isSqliteUrl(url: string): boolean {
  return SQLITE_URL_PATTERN.test(url);
}

export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
}

export function assertRuntimeEnv() {
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const isProductionRuntime = nodeEnv === "production" || vercelEnv === "production";

  if (!isProductionRuntime) return;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in production.");
  }

  if (!isPostgresUrl(databaseUrl) || isSqliteUrl(databaseUrl)) {
    throw new Error("Production DATABASE_URL must point to PostgreSQL.");
  }

  if (!getAuthSecret()) {
    throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is required in production.");
  }
}

export function assertPostgresDatabaseUrl(url: string | undefined): asserts url is string {
  if (!url || !isPostgresUrl(url) || isSqliteUrl(url)) {
    throw new Error("DATABASE_URL must point to PostgreSQL.");
  }
}
