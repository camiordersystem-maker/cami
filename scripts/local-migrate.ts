import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { LOCAL_DATABASE_URL, assertLocalDatabaseUrl } from "./local-env";

assertLocalDatabaseUrl(LOCAL_DATABASE_URL);

function psql(sql: string) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "cami-local-postgres", "psql", "-v", "ON_ERROR_STOP=1", "-U", "cami", "-d", "cami_local"],
    { input: sql, encoding: "utf8", stdio: ["pipe", "inherit", "pipe"] }
  );
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
}

function psqlOutput(sql: string): string {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "cami-local-postgres", "psql", "-t", "-A", "-U", "cami", "-d", "cami_local"],
    { input: sql, encoding: "utf8" }
  );
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

psql(`CREATE TABLE IF NOT EXISTS _local_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());`);

const migrationsDir = path.join(process.cwd(), "src/lib/db/migrations/pg");
const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  const applied = psqlOutput(`SELECT 1 FROM _local_migrations WHERE filename = '${file.replace(/'/g, "''")}' LIMIT 1;`);
  if (applied === "1") {
    console.log(`skip ${file}`);
    continue;
  }
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8").replace(/--> statement-breakpoint/g, "");
  console.log(`apply ${file}`);
  psql(sql);
  psql(`INSERT INTO _local_migrations (filename) VALUES ('${file.replace(/'/g, "''")}');`);
}

console.log("local migrations completed");
