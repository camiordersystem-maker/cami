import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";

const createSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(2000),
  type: z.enum(["all", "individual"]),
  targetMemberId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select({
        id: schema.announcements.id,
        title: schema.announcements.title,
        body: schema.announcements.body,
        type: schema.announcements.type,
        targetMemberId: schema.announcements.targetMemberId,
        createdBy: schema.announcements.createdBy,
        createdAt: schema.announcements.createdAt,
        expiresAt: schema.announcements.expiresAt,
        targetMemberName: schema.members.companyName,
      })
      .from(schema.announcements)
      .leftJoin(schema.members, eq(schema.announcements.targetMemberId, schema.members.id))
      .orderBy(desc(schema.announcements.createdAt));
    return NextResponse.json(items);
  } catch (e) {
    console.error("announcements GET error:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const { title, body: content, type, targetMemberId, expiresAt } = parsed.data;

  if (type === "individual" && !targetMemberId) {
    return NextResponse.json({ error: "個別配信には対象店舗の指定が必要です" }, { status: 400 });
  }

  try {
    await db.insert(schema.announcements).values({
      title,
      body: content,
      type,
      targetMemberId: type === "individual" ? (targetMemberId ?? null) : null,
      createdBy: session!.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("announcements POST error:", e);
    return NextResponse.json({ error: "作成に失敗しました" }, { status: 500 });
  }
}
