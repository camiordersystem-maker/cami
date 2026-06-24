import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const items = await db
      .select({
        id: schema.notifications.id,
        type: schema.notifications.type,
        message: schema.notifications.message,
        orderId: schema.notifications.orderId,
        isRead: schema.notifications.isRead,
        createdAt: schema.notifications.createdAt,
      })
      .from(schema.notifications)
      .where(eq(schema.notifications.memberId, session.user.id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(20);

    return NextResponse.json(items);
  } catch (e) {
    console.error("notifications GET error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
