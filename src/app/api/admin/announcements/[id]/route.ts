import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  try {
    await db.delete(schema.announcementReads).where(eq(schema.announcementReads.announcementId, (await params).id));
    await db.delete(schema.announcements).where(eq(schema.announcements.id, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("announcement DELETE error:", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
