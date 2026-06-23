import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";

const updateSchema = z.object({
  productId: z.string(),
  availableBoxes: z.number().int().min(0),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    await db
      .update(schema.inventory)
      .set({
        availableBoxes: parsed.data.availableBoxes,
        updatedAt: new Date(),
        updatedBy: session!.user.id,
      })
      .where(eq(schema.inventory.productId, parsed.data.productId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("inventory PUT error:", e);
    return NextResponse.json({ error: "在庫の更新に失敗しました" }, { status: 500 });
  }
}
