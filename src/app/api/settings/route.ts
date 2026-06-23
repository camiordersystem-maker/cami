import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [settings] = await db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.id, "singleton"));
    return NextResponse.json(settings ?? null);
  } catch (e) {
    console.error("public settings GET error:", e);
    return NextResponse.json(null);
  }
}
