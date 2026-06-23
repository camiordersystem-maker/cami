import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  retailPrice: z.number().int().min(1).optional(),
  bottlesPerBox: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    await db
      .update(schema.products)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(schema.products.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("products PUT error:", e);
    return NextResponse.json({ error: "商品の更新に失敗しました" }, { status: 500 });
  }
}
