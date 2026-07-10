import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const [order] = await db
    .select({
      id: schema.orders.id, status: schema.orders.status,
      cancelBeforeStatus: schema.orders.cancelBeforeStatus,
    })
    .from(schema.orders)
    .where(eq(schema.orders.id, (await params).id));

  if (!order) return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });

  if (order.status !== "cancel_requested") {
    return NextResponse.json({ error: "キャンセル申込中の注文ではありません" }, { status: 400 });
  }

  const restoreStatus = (order.cancelBeforeStatus as string) ?? "confirmed";

  try {
    // Optimistic lock: only restore if still cancel_requested, so a
    // concurrent approve (which returns stock) can't be overwritten.
    const updated = await db
      .update(schema.orders)
      .set({
        status: restoreStatus,
        cancelBeforeStatus: null,
        cancelReason: null,
        updatedAt: new Date(),
        lastStatusChangedAt: new Date(),
        lastStatusChangedBy: session!.user.id,
      })
      .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "cancel_requested")))
      .returning({ id: schema.orders.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "注文状態が他の操作で変更されました。再読み込みしてください。" },
        { status: 409 }
      );
    }

    await db.insert(schema.orderStatusHistories).values({
      orderId: order.id,
      fromStatus: "cancel_requested",
      toStatus: restoreStatus,
      reason: "キャンセル却下",
      actorId: session!.user.id,
      actorRole: "admin",
    });

    await db.insert(schema.auditLogs).values({
      actorId: session!.user.id,
      actorRole: "admin",
      action: "cancel_reject",
      targetType: "order",
      targetId: order.id,
      beforeValue: JSON.stringify({ status: "cancel_requested" }),
      afterValue: JSON.stringify({ status: restoreStatus }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("cancel reject error:", e);
    return NextResponse.json({ error: "キャンセル拒否に失敗しました" }, { status: 500 });
  }
}
