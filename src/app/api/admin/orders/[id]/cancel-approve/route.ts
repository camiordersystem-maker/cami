import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const [order] = await db
    .select({
      id: schema.orders.id, status: schema.orders.status, memberId: schema.orders.memberId,
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });

  if (order.status !== "cancel_requested") {
    return NextResponse.json({ error: "キャンセル申込中の注文ではありません" }, { status: 400 });
  }

  try {
    const items = await db
      .select({ productId: schema.orderItems.productId, boxes: schema.orderItems.boxes })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    await db
      .update(schema.orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.orders.id, order.id));

    for (const item of items) {
      await db
        .update(schema.inventory)
        .set({
          availableBoxes: sql`${schema.inventory.availableBoxes} + ${item.boxes}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.inventory.productId, item.productId));
    }

    await db.insert(schema.auditLogs).values({
      actorId: session!.user.id,
      actorRole: "admin",
      action: "cancel_approve",
      targetType: "order",
      targetId: order.id,
      beforeValue: JSON.stringify({ status: "cancel_requested" }),
      afterValue: JSON.stringify({ status: "cancelled" }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("cancel approve error:", e);
    return NextResponse.json({ error: "キャンセル承認に失敗しました" }, { status: 500 });
  }
}
