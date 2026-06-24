import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [order] = await db
    .select({
      id: schema.orders.id, memberId: schema.orders.memberId, status: schema.orders.status,
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  if (order.memberId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!["pending", "confirmed"].includes(order.status)) {
    return NextResponse.json(
      { error: "この注文はキャンセルを申し込めません" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({})) as { cancelReason?: string };

  try {
    await db
      .update(schema.orders)
      .set({
        status: "cancel_requested",
        cancelReason: body.cancelReason ?? null,
        cancelBeforeStatus: order.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, order.id));

    await db.insert(schema.auditLogs).values({
      actorId: session.user.id,
      actorRole: "member",
      action: "cancel_request",
      targetType: "order",
      targetId: order.id,
      beforeValue: JSON.stringify({ status: order.status }),
      afterValue: JSON.stringify({ status: "cancel_requested" }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("cancel request error:", e);
    return NextResponse.json({ error: "キャンセル申込に失敗しました" }, { status: 500 });
  }
}
