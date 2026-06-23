import { db } from "./index";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    console.log("✅ Neon DB connection successful:", result.rows[0]);
  } catch (err) {
    console.error("❌ Neon DB connection failed:", err);
    process.exit(1);
  }
}

main();
