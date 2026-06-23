import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";
import { sendLowStockAlert } from "@/lib/email";

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD ?? "10");

const updateSchema = z.object({
  productId: z.string(),
  availableBoxes: z.number().int().min(0),
  note: z.string().max(200).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  try {
    const [current] = await db
      .select({ availableBoxes: schema.inventory.availableBoxes })
      .from(schema.inventory)
      .where(eq(schema.inventory.productId, parsed.data.productId));

    const previousBoxes = current?.availableBoxes ?? 0;
    const newBoxes = parsed.data.availableBoxes;

    await db
      .update(schema.inventory)
      .set({
        availableBoxes: newBoxes,
        updatedAt: new Date(),
        updatedBy: session!.user.id,
      })
      .where(eq(schema.inventory.productId, parsed.data.productId));

    await db.insert(schema.inventoryReceipts).values({
      productId: parsed.data.productId,
      boxes: newBoxes - previousBoxes,
      previousBoxes,
      newBoxes,
      note: parsed.data.note ?? null,
      receivedBy: session!.user.id,
    });

    const lowStock = newBoxes < LOW_STOCK_THRESHOLD;

    if (lowStock && previousBoxes >= LOW_STOCK_THRESHOLD) {
      const [product] = await db
        .select({ name: schema.products.name })
        .from(schema.products)
        .where(eq(schema.products.id, parsed.data.productId));
      try {
        await sendLowStockAlert({
          productName: product?.name ?? parsed.data.productId,
          availableBoxes: newBoxes,
          threshold: LOW_STOCK_THRESHOLD,
        });
      } catch (e) {
        console.error("low stock alert email failed:", e);
      }
    }

    return NextResponse.json({ ok: true, lowStock });
  } catch (e) {
    console.error("inventory PUT error:", e);
    return NextResponse.json({ error: "在庫の更新に失敗しました" }, { status: 500 });
  }
}
