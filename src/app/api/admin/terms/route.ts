import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [current] = await db
    .select()
    .from(schema.terms)
    .orderBy(desc(schema.terms.version))
    .limit(1);

  return NextResponse.json(current ?? null);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (typeof body.content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const adminId = session.user.id;
  const [current] = await db
    .select()
    .from(schema.terms)
    .orderBy(desc(schema.terms.version))
    .limit(1);

  if (current) {
    await db
      .update(schema.terms)
      .set({ content: body.content, updatedAt: new Date(), updatedBy: adminId })
      .where(eq(schema.terms.id, current.id));
  } else {
    await db.insert(schema.terms).values({ content: body.content, updatedBy: adminId });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [current] = await db
    .select()
    .from(schema.terms)
    .orderBy(desc(schema.terms.version))
    .limit(1);

  if (!current) {
    return NextResponse.json({ error: "約款がありません" }, { status: 404 });
  }

  await db
    .update(schema.terms)
    .set({ isPublished: true, publishedAt: new Date(), updatedAt: new Date(), updatedBy: session.user.id })
    .where(eq(schema.terms.id, current.id));

  return NextResponse.json({ ok: true });
}
