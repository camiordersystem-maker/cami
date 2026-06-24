import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    console.error("admin order detail GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
