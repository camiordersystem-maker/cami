export const LOCAL_DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://cami:cami_local_password@localhost:54329/cami_local?sslmode=disable";
export const LOCAL_BACKUP_DIR = process.env.CAMI_BACKUP_DIR ?? "/Users/hiroshikento/Documents/SHIMA CRAFT Backups/cami-order-system";

export function assertLocalDatabaseUrl(url: string) {
  const parsed = new URL(url);
  const host = parsed.hostname;
  const db = parsed.pathname.replace(/^\//, "");
  if (!["localhost", "127.0.0.1"].includes(host)) {
    throw new Error(`Refusing local command against non-local host: ${host}`);
  }
  if (db !== "cami_local") {
    throw new Error(`Refusing local command against unexpected database: ${db}`);
  }
}
