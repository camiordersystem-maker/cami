import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";
import { conflict, internalError, notFound, ok, validationError } from "@/lib/api-response";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [current] = await db
      .select()
      .from(schema.terms)
      .orderBy(desc(schema.terms.version))
      .limit(1);
    return NextResponse.json(current ?? null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const body = await req.json();
  if (typeof body.content !== "string") {
    return validationError("content is required");
  }

  const adminId = session!.user.id;

  try {
    const [current] = await db
      .select()
      .from(schema.terms)
      .orderBy(desc(schema.terms.version))
      .limit(1);

    if (current?.isPublished) {
      await db.insert(schema.terms).values({
        content: body.content,
        version: current.version + 1,
        isPublished: false,
        updatedBy: adminId,
      });
    } else if (current) {
      await db
        .update(schema.terms)
        .set({ content: body.content, updatedAt: new Date(), updatedBy: adminId })
        .where(eq(schema.terms.id, current.id));
    } else {
      await db.insert(schema.terms).values({ content: body.content, updatedBy: adminId });
    }

    return ok({ saved: true });
  } catch (e) {
    console.error("terms PUT error:", e);
    return internalError("保存に失敗しました");
  }
}

export async function PATCH() {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  try {
    const [current] = await db
      .select()
      .from(schema.terms)
      .orderBy(desc(schema.terms.version))
      .limit(1);

    if (!current) {
      return notFound("約款がありません");
    }

    if (current.isPublished) {
      return conflict("公開済み約款は直接再公開できません。新しい下書きを作成してください。");
    }

    await db
      .update(schema.terms)
      .set({ isPublished: true, publishedAt: new Date(), updatedAt: new Date(), updatedBy: session!.user.id })
      .where(eq(schema.terms.id, current.id));

    return ok({ published: true });
  } catch (e) {
    console.error("terms PATCH error:", e);
    return internalError("公開に失敗しました");
  }
}
