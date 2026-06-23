import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [invoice] = await db
      .select()
      .from(schema.monthlyInvoices)
      .where(eq(schema.monthlyInvoices.id, params.id));

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [member] = await db
      .select()
      .from(schema.members)
      .where(eq(schema.members.id, invoice.memberId));

    const periodStart = new Date(invoice.year, invoice.month - 1, 1);
    const periodEnd = new Date(invoice.year, invoice.month, 1);

    const orders = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.memberId, invoice.memberId),
          gte(schema.orders.createdAt, periodStart),
          lt(schema.orders.createdAt, periodEnd)
        )
      );

    const billableOrders = orders.filter((o: typeof orders[0]) =>
      ["confirmed", "shipped", "delivered"].includes(o.status)
    );

    const ordersWithItems = await Promise.all(
      billableOrders.map(async (order: typeof billableOrders[0]) => {
        const items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return NextResponse.json({
      ...invoice,
      member: member ?? null,
      orders: ordersWithItems,
    });
  } catch (e) {
    console.error("invoice GET error:", e);
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

  const body = await req.json().catch(() => ({})) as {
    paymentStatus?: string;
    note?: string;
  };

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.paymentStatus) updates.paymentStatus = body.paymentStatus;
    if (body.note !== undefined) updates.note = body.note;

    await db
      .update(schema.monthlyInvoices)
      .set(updates as Partial<typeof schema.monthlyInvoices.$inferInsert>)
      .where(eq(schema.monthlyInvoices.id, params.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("invoice PATCH error:", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
