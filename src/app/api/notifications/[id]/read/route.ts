import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, params.id),
          eq(schema.notifications.memberId, session.user.id)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notification read error:", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
