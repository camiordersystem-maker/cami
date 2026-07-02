import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { internalError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return ok({ status: "ready", database: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("readiness check failed", error);
    return internalError("readiness check failed");
  }
}
