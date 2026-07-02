import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { LOCAL_BACKUP_DIR, LOCAL_DATABASE_URL, assertLocalDatabaseUrl } from "./local-env";

assertLocalDatabaseUrl(LOCAL_DATABASE_URL);
fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.join(LOCAL_BACKUP_DIR, `cami-local-${stamp}.sql`);
const result = spawnSync("docker", ["exec", "cami-local-postgres", "pg_dump", "-U", "cami", "-d", "cami_local"], { encoding: "utf8" });
if (result.status !== 0) {
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}
fs.writeFileSync(file, result.stdout);
console.log(`backup created: ${file}`);
