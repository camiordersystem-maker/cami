import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { internalError, ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // `execute` exists only on the PostgreSQL drivers; the better-sqlite3
    // driver used for local development exposes `run` instead.
    const client = db as unknown as {
      execute?: (query: unknown) => Promise<unknown>;
      run?: (query: unknown) => unknown;
    };
    if (typeof client.execute === "function") {
      await client.execute(sql`select 1`);
    } else if (typeof client.run === "function") {
      client.run(sql`select 1`);
    } else {
      throw new Error("no database client available");
    }
    return ok({ status: "ready", database: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("readiness check failed", error);
    return internalError("readiness check failed");
  }
}
