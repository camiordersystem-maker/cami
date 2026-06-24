import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireEditor } from "@/lib/admin-auth";

const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  cancel_requested: [],
};

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
  cancelReason: z.string().max(500).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "overdue"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      .where(eq(schema.orders.id, params.id));

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

    return NextResponse.json({ ...order, member: member ?? null, address: address ?? null, items });
  } catch (e) {
    console.error("admin order GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { id } = params;
  const [order] = await db
    .select({ id: schema.orders.id, status: schema.orders.status, paymentStatus: schema.orders.paymentStatus, memberId: schema.orders.memberId, orderNo: schema.orders.orderNo })
    .from(schema.orders)
    .where(eq(schema.orders.id, id));
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const updates: Partial<typeof schema.orders.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.status) {
      const allowed = ORDER_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(parsed.data.status)) {
        return NextResponse.json(
          { error: `${order.status} → ${parsed.data.status} への変更はできません` },
          { status: 422 }
        );
      }
      updates.status = parsed.data.status;

      const notifyType = parsed.data.status === "confirmed"
        ? "order_confirmed"
        : parsed.data.status === "shipped"
        ? "order_shipped"
        : null;

      if (notifyType) {
        const message = parsed.data.status === "confirmed"
          ? `注文が確認されました（${order.orderNo}）`
          : `ご注文の商品を発送しました（${order.orderNo}）`;
        await db.insert(schema.notifications).values({
          memberId: order.memberId,
          type: notifyType,
          message,
          orderId: id,
        }).catch(() => {});
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

    await db.update(schema.orders).set(updates).where(eq(schema.orders.id, id));

    await db.insert(schema.auditLogs).values({
      actorId: session!.user.id,
      actorRole: "admin",
      action: "update_order",
      targetType: "order",
      targetId: id,
      beforeValue: JSON.stringify({ status: order.status, paymentStatus: order.paymentStatus }),
      afterValue: JSON.stringify(parsed.data),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin order PATCH error:", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
