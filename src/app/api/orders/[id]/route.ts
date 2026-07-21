import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, (await params).id));

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

// 会員側の即時キャンセルはここでは提供しない。承認制フロー
// (/api/orders/[id]/cancel-request → 管理者の cancel-approve/cancel-reject)
// を経由すること。旧版のこのPATCHは監査ログ・ステータス履歴・楽観ロックなしで
// 在庫を即時復元してしまい承認フローを迂回できたため削除した。
