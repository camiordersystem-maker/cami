import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";
import { sendLowStockAlert } from "@/lib/email";
import { conflict, internalError, notFound, ok, validationError } from "@/lib/api-response";
import { isPostgresRuntime } from "@/lib/env";

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD ?? "10");

const updateSchema = z.object({
  productId: z.string(),
  availableBoxes: z.number().int().min(0),
  note: z.string().trim().min(1, "理由を入力してください").max(200),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError("在庫変更理由を入力してください");

  try {
    const run = isPostgresRuntime()
      ? <T>(fn: (tx: typeof db) => Promise<T>) => db.transaction(fn)
      : <T>(fn: (tx: typeof db) => Promise<T>) => fn(db);
    const newBoxes = parsed.data.availableBoxes;
    const previousBoxes = await run(async (tx) => {
      const [current] = await tx
        .select({ availableBoxes: schema.inventory.availableBoxes })
        .from(schema.inventory)
        .where(eq(schema.inventory.productId, parsed.data.productId));

      if (!current) throw new Error("INVENTORY_NOT_FOUND");
      const previousBoxes = current.availableBoxes;

      const updated = await tx
        .update(schema.inventory)
        .set({
          availableBoxes: newBoxes,
          updatedAt: new Date(),
          updatedBy: session!.user.id,
        })
        .where(and(
          eq(schema.inventory.productId, parsed.data.productId),
          eq(schema.inventory.availableBoxes, previousBoxes),
        ))
        .returning({ id: schema.inventory.id });
      if (updated.length === 0) throw new Error("INVENTORY_CONFLICT");

      await tx.insert(schema.inventoryReceipts).values({
        productId: parsed.data.productId,
        boxes: newBoxes - previousBoxes,
        previousBoxes,
        newBoxes,
        note: parsed.data.note ?? null,
        receivedBy: session!.user.id,
      });

      await tx.insert(schema.inventoryMovements).values({
        productId: parsed.data.productId,
        orderId: null,
        movementType: newBoxes >= previousBoxes ? "inbound" : "manual_adjustment",
        quantityDelta: newBoxes - previousBoxes,
        quantityBefore: previousBoxes,
        quantityAfter: newBoxes,
        reason: parsed.data.note,
        actorId: session!.user.id,
        actorRole: "admin",
      });
      return previousBoxes;
    });

    const lowStock = newBoxes < LOW_STOCK_THRESHOLD;

    if (lowStock && previousBoxes >= LOW_STOCK_THRESHOLD) {
      try {
        const [product] = await db
          .select({ name: schema.products.name })
          .from(schema.products)
          .where(eq(schema.products.id, parsed.data.productId));
        await sendLowStockAlert({
          productName: product?.name ?? parsed.data.productId,
          availableBoxes: newBoxes,
          threshold: LOW_STOCK_THRESHOLD,
        });
      } catch (e) {
        console.error("low stock alert email failed", { errorType: e instanceof Error ? e.name : "UnknownError" });
      }
    }

    return ok({ lowStock });
  } catch (e) {
    if (e instanceof Error && e.message === "INVENTORY_NOT_FOUND") return notFound("在庫が見つかりません");
    if (e instanceof Error && e.message === "INVENTORY_CONFLICT") return conflict("在庫が他の操作で変更されました。再読み込みしてください。");
    console.error("inventory PUT error", { errorType: e instanceof Error ? e.name : "UnknownError" });
    return internalError("在庫の更新に失敗しました");
  }
}
