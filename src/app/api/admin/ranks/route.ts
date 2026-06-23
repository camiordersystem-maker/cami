import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";

const rankSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0.01).max(1),
  minMonthlyBoxes: z.number().int().min(0),
  description: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await db.select().from(schema.memberRanks).orderBy(schema.memberRanks.rate);
    return NextResponse.json(data);
  } catch (e) {
    console.error("ranks GET error:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = rankSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    const [rank] = await db.insert(schema.memberRanks).values(parsed.data).returning();
    return NextResponse.json(rank, { status: 201 });
  } catch (e) {
    console.error("ranks POST error:", e);
    return NextResponse.json({ error: "ランクの作成に失敗しました" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const body = await req.json();
  const { id, ...data } = body;
  const parsed = rankSchema.partial().safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    await db
      .update(schema.memberRanks)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.memberRanks.id, id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("ranks PUT error:", e);
    return NextResponse.json({ error: "ランクの更新に失敗しました" }, { status: 500 });
  }
}
