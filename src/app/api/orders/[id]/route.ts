import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (session.user as { role: string }).role;
  if (role === "member" && order.memberId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id));

  const [address] = await db
    .select()
    .from(schema.shippingAddresses)
    .where(eq(schema.shippingAddresses.id, order.shippingAddressId));

  return NextResponse.json({ ...order, items, address: address ?? null });
}

// 店舗側からの注文キャンセル（pending のみ）
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  if (order.memberId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "pending") {
    return NextResponse.json(
      { error: "確認済み以降の注文はキャンセルできません。本部へお問い合わせください。" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({})) as { cancelReason?: string };

  try {
    const items = await db
      .select()
      .from(schema.orderItems)
      .where(eq(schema.orderItems.orderId, order.id));

    await db
      .update(schema.orders)
      .set({ status: "cancelled", cancelReason: body.cancelReason ?? null, updatedAt: new Date() })
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

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("member cancel order error:", e);
    return NextResponse.json({ error: "キャンセルに失敗しました" }, { status: 500 });
  }
}
