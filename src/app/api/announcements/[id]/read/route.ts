import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const memberId = session.user.id;

  try {
    const [existing] = await db
      .select({ id: schema.announcementReads.id })
      .from(schema.announcementReads)
      .where(
        and(
          eq(schema.announcementReads.announcementId, params.id),
          eq(schema.announcementReads.memberId, memberId)
        )
      );

    if (!existing) {
      await db.insert(schema.announcementReads).values({
        announcementId: params.id,
        memberId,
        readAt: new Date(),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("announcement read error:", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
