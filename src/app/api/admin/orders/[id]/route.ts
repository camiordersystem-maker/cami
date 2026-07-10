import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";
import { canTransitionOrder, requiresCancelReason, requiresTrackingNumber } from "@/lib/order-status";
import { conflict, internalError, notFound, ok, unauthorized, validationError } from "@/lib/api-response";
import { isPostgresRuntime } from "@/lib/env";

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
  cancelReason: z.string().max(500).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "overdue"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return unauthorized();
  }

  try {
    const [order] = await db
      .select({
        id: schema.orders.id, orderNo: schema.orders.orderNo, memberId: schema.orders.memberId,
        shippingAddressId: schema.orders.shippingAddressId, status: schema.orders.status,
        subtotal: schema.orders.subtotal, taxRate: schema.orders.taxRate, taxAmount: schema.orders.taxAmount,
        shippingFee: schema.orders.shippingFee, total: schema.orders.total,
        paymentStatus: schema.orders.paymentStatus, paymentDueDate: schema.orders.paymentDueDate,
        trackingNumber: schema.orders.trackingNumber, cancelReason: schema.orders.cancelReason,
        cancelBeforeStatus: schema.orders.cancelBeforeStatus, memo: schema.orders.memo,
        createdAt: schema.orders.createdAt, updatedAt: schema.orders.updatedAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, (await params).id));

    if (!order) return notFound();

    const items = await db
      .select({
        id: schema.orderItems.id, orderId: schema.orderItems.orderId, productId: schema.orderItems.productId,
        productName: schema.orderItems.productName, boxes: schema.orderItems.boxes,
        bottlesPerBox: schema.orderItems.bottlesPerBox, unitPricePerBox: schema.orderItems.unitPricePerBox,
        rateApplied: schema.orderItems.rateApplied, subtotal: schema.orderItems.subtotal,
      })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    const [member] = await db
      .select({ companyName: schema.members.companyName, email: schema.members.email, contactName: schema.members.contactName })
      .from(schema.members)
      .where(eq(schema.members.id, order.memberId));

    const [address] = await db
      .select({
        id: schema.shippingAddresses.id, label: schema.shippingAddresses.label,
        recipientName: schema.shippingAddresses.recipientName, postalCode: schema.shippingAddresses.postalCode,
        prefecture: schema.shippingAddresses.prefecture, address1: schema.shippingAddresses.address1,
        address2: schema.shippingAddresses.address2, phone: schema.shippingAddresses.phone,
      })
      .from(schema.shippingAddresses)
      .where(eq(schema.shippingAddresses.id, order.shippingAddressId));

    return Response.json({ ...order, member: member ?? null, address: address ?? null, items });
  } catch (e) {
    console.error("admin order GET error:", e);
    return internalError("取得に失敗しました");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return validationError();
  }

  const { id } = await params;
  const [order] = await db
    .select({ id: schema.orders.id, status: schema.orders.status, paymentStatus: schema.orders.paymentStatus, memberId: schema.orders.memberId, orderNo: schema.orders.orderNo })
    .from(schema.orders)
    .where(eq(schema.orders.id, id));
  if (!order) return notFound();

  try {
    const run = isPostgresRuntime()
      ? <T>(fn: (tx: typeof db) => Promise<T>) => db.transaction(fn)
      : <T>(fn: (tx: typeof db) => Promise<T>) => fn(db);

    await run(async (tx) => {
      const updates: Partial<typeof schema.orders.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (parsed.data.status) {
        if (!canTransitionOrder(order.status, parsed.data.status)) {
          throw new Error("INVALID_TRANSITION");
        }
        const isIdempotentStatusRetry = order.status === parsed.data.status;
        if (requiresTrackingNumber(parsed.data.status) && !parsed.data.trackingNumber?.trim()) {
          throw new Error("TRACKING_REQUIRED");
        }
        if (requiresCancelReason(parsed.data.status) && !parsed.data.cancelReason?.trim()) {
          throw new Error("CANCEL_REASON_REQUIRED");
        }

        if (!isIdempotentStatusRetry) {
          updates.status = parsed.data.status;
          updates.lastStatusChangedAt = new Date();
          updates.lastStatusChangedBy = session!.user.id;
          if (parsed.data.status === "delivered") {
            updates.deliveredAt = new Date();
          }
        }

        if (!isIdempotentStatusRetry && parsed.data.status === "cancelled") {
          const items = await tx
            .select({ productId: schema.orderItems.productId, boxes: schema.orderItems.boxes })
            .from(schema.orderItems)
            .where(eq(schema.orderItems.orderId, id));

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
              orderId: id,
              movementType: "cancellation_return",
              quantityDelta: item.boxes,
              quantityBefore: currentInventory.availableBoxes,
              quantityAfter: currentInventory.availableBoxes + item.boxes,
              reason: parsed.data.cancelReason ?? "キャンセル",
              actorId: session!.user.id,
              actorRole: "admin",
            });
          }
        }

        if (!isIdempotentStatusRetry) {
          await tx.insert(schema.orderStatusHistories).values({
            orderId: id,
            fromStatus: order.status,
            toStatus: parsed.data.status,
            reason: parsed.data.cancelReason ?? null,
            actorId: session!.user.id,
            actorRole: "admin",
          });
        }

        const notifyType = parsed.data.status === "confirmed"
          ? "order_confirmed"
          : parsed.data.status === "shipped"
          ? "order_shipped"
          : null;

        if (!isIdempotentStatusRetry && notifyType) {
          const message = parsed.data.status === "confirmed"
            ? `注文が確認されました（${order.orderNo}）`
            : `ご注文の商品を発送しました（${order.orderNo}）`;
          // Do not swallow errors here: inside a PostgreSQL transaction a
          // failed statement aborts the whole transaction anyway.
          await tx.insert(schema.notifications).values({
            memberId: order.memberId,
            type: notifyType,
            message,
            orderId: id,
          });
        }
      }

      if (parsed.data.trackingNumber !== undefined) {
        updates.trackingNumber = parsed.data.trackingNumber;
      }

      if (parsed.data.cancelReason !== undefined) {
        updates.cancelReason = parsed.data.cancelReason;
      }

      if (parsed.data.paymentStatus !== undefined) {
        updates.paymentStatus = parsed.data.paymentStatus;
      }

      const updated = await tx
        .update(schema.orders)
        .set(updates)
        .where(and(eq(schema.orders.id, id), eq(schema.orders.status, order.status)))
        .returning({ id: schema.orders.id });

      if (updated.length === 0) {
        throw new Error("ORDER_UPDATE_CONFLICT");
      }

      await tx.insert(schema.auditLogs).values({
        actorId: session!.user.id,
        actorRole: "admin",
        action: "update_order",
        targetType: "order",
        targetId: id,
        beforeValue: JSON.stringify({ status: order.status, paymentStatus: order.paymentStatus }),
        afterValue: JSON.stringify(parsed.data),
      });
    });

    return ok({ id });
  } catch (e) {
    console.error("admin order PATCH error:", e);
    if (e instanceof Error) {
      if (e.message === "INVALID_TRANSITION") return conflict(`${order.status} → ${parsed.data.status} への変更はできません`);
      if (e.message === "TRACKING_REQUIRED") return validationError("発送時は追跡番号が必要です");
      if (e.message === "CANCEL_REASON_REQUIRED") return validationError("キャンセル理由が必要です");
      if (e.message === "ORDER_UPDATE_CONFLICT") return conflict("注文状態が他の操作で変更されました。再読み込みしてください。");
    }
    return internalError("更新に失敗しました");
  }
}
