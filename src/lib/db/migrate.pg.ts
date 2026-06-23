import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import path from "path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const sql = neon(url);
const db = drizzle(sql);

const migrationsFolder = path.join(
  process.cwd(),
  "src/lib/db/migrations/pg"
);

console.log("🗄️  Running PostgreSQL migrations...");
await migrate(db, { migrationsFolder });
console.log("✅ PostgreSQL migrations completed");
