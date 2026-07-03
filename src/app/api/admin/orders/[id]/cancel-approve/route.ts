import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";
import { conflict, internalError, notFound, ok } from "@/lib/api-response";
import { isPostgresRuntime } from "@/lib/env";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const [order] = await db
    .select({
      id: schema.orders.id, status: schema.orders.status, memberId: schema.orders.memberId,
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, (await params).id));

  if (!order) return notFound("注文が見つかりません");

  if (order.status !== "cancel_requested") {
    return conflict("キャンセル申込中の注文ではありません");
  }

  try {
    const run = isPostgresRuntime()
      ? <T>(fn: (tx: typeof db) => Promise<T>) => db.transaction(fn)
      : <T>(fn: (tx: typeof db) => Promise<T>) => fn(db);

    await run(async (tx) => {
      const items = await tx
        .select({ productId: schema.orderItems.productId, boxes: schema.orderItems.boxes })
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));

      const updated = await tx
        .update(schema.orders)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
          lastStatusChangedAt: new Date(),
          lastStatusChangedBy: session!.user.id,
        })
        .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "cancel_requested")))
        .returning({ id: schema.orders.id });

      if (updated.length === 0) throw new Error("ORDER_UPDATE_CONFLICT");

      for (const item of items) {
        const [currentInventory] = await tx
          .select({ availableBoxes: schema.inventory.availableBoxes })
          .from(schema.inventory)
          .where(eq(schema.inventory.productId, item.productId));
        if (!currentInventory) throw new Error("INVENTORY_NOT_FOUND");
        await tx
          .update(schema.inventory)
          .set({
            availableBoxes: sql`${schema.inventory.availableBoxes} + ${item.boxes}`,
            updatedAt: new Date(),
            updatedBy: session!.user.id,
          })
          .where(eq(schema.inventory.productId, item.productId));
        await tx.insert(schema.inventoryMovements).values({
          productId: item.productId,
          orderId: order.id,
          movementType: "cancellation_return",
          quantityDelta: item.boxes,
          quantityBefore: currentInventory.availableBoxes,
          quantityAfter: currentInventory.availableBoxes + item.boxes,
          reason: "キャンセル承認",
          actorId: session!.user.id,
          actorRole: "admin",
        });
      }

      await tx.insert(schema.orderStatusHistories).values({
        orderId: order.id,
        fromStatus: "cancel_requested",
        toStatus: "cancelled",
        reason: "キャンセル承認",
        actorId: session!.user.id,
        actorRole: "admin",
      });

      await tx.insert(schema.auditLogs).values({
        actorId: session!.user.id,
        actorRole: "admin",
        action: "cancel_approve",
        targetType: "order",
        targetId: order.id,
        beforeValue: JSON.stringify({ status: "cancel_requested" }),
        afterValue: JSON.stringify({ status: "cancelled" }),
      });
    });

    return ok({ id: order.id });
  } catch (e) {
    console.error("cancel approve error:", e);
    if (e instanceof Error && e.message === "ORDER_UPDATE_CONFLICT") {
      return conflict("注文状態が他の操作で変更されました。再読み込みしてください。");
    }
    return internalError("キャンセル承認に失敗しました");
  }
}
