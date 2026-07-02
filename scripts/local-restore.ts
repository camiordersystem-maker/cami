import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { LOCAL_DATABASE_URL, assertLocalDatabaseUrl } from "./local-env";

assertLocalDatabaseUrl(LOCAL_DATABASE_URL);

const file = process.env.RESTORE_FILE;
if (!file || !fs.existsSync(file)) throw new Error("Set RESTORE_FILE to an existing backup .sql file.");
if (process.env.CONFIRM_LOCAL_RESTORE !== "true") throw new Error("Set CONFIRM_LOCAL_RESTORE=true to restore local DB.");

function runPsql(input: Buffer | string) {
  const result = spawnSync(
    "docker",
    ["exec", "-i", "cami-local-postgres", "psql", "-v", "ON_ERROR_STOP=1", "-U", "cami", "-d", "cami_local"],
    { input, stdio: ["pipe", "inherit", "inherit"] }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

runPsql("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO cami; GRANT ALL ON SCHEMA public TO public;");
runPsql(fs.readFileSync(file));
console.log("restore completed");
