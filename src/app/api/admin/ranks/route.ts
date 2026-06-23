import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

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
  const data = await db.select().from(schema.memberRanks).orderBy(schema.memberRanks.rate);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = rankSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const [rank] = await db.insert(schema.memberRanks).values(parsed.data).returning();
  return NextResponse.json(rank, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...data } = body;
  const parsed = rankSchema.partial().safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await db
    .update(schema.memberRanks)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(schema.memberRanks.id, id));

  return NextResponse.json({ ok: true });
}
