import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { or, eq, isNull, gte, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const memberId = session.user.id;
  const now = new Date();

  try {
    const items = await db
      .select({
        id: schema.announcements.id,
        title: schema.announcements.title,
        body: schema.announcements.body,
        type: schema.announcements.type,
        createdAt: schema.announcements.createdAt,
        expiresAt: schema.announcements.expiresAt,
      })
      .from(schema.announcements)
      .where(
        and(
          or(
            eq(schema.announcements.type, "all"),
            eq(schema.announcements.targetMemberId, memberId)
          ),
          or(
            isNull(schema.announcements.expiresAt),
            gte(schema.announcements.expiresAt, now)
          )
        )
      )
      .orderBy(desc(schema.announcements.createdAt));

    const reads = await db
      .select({ announcementId: schema.announcementReads.announcementId })
      .from(schema.announcementReads)
      .where(eq(schema.announcementReads.memberId, memberId));

    const readSet = new Set(reads.map((r: { announcementId: string }) => r.announcementId));

    return NextResponse.json(items.map((item: (typeof items)[0]) => ({
      ...item,
      isRead: readSet.has(item.id),
    })));
  } catch (e) {
    console.error("announcements member GET error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
