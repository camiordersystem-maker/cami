import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { forbidden, internalError, notFound, ok, unauthorized } from "@/lib/api-response";

// 会員が自分自身の月次請求書を閲覧するための読み取り専用エンドポイント。
// メール送付されたリンクからのアクセスを想定。
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return unauthorized();
  if ((session.user as { role: string }).role !== "member") return forbidden();

  try {
    const [invoice] = await db
      .select()
      .from(schema.monthlyInvoices)
      .where(eq(schema.monthlyInvoices.id, (await params).id));

    if (!invoice) return notFound("請求書が見つかりません");
    if (invoice.memberId !== session.user.id) return forbidden();

    const [member] = await db
      .select({ companyName: schema.members.companyName, contactName: schema.members.contactName })
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

    return ok({ ...invoice, member: member ?? null, orders: ordersWithItems });
  } catch (e) {
    console.error("member invoice GET error:", e);
    return internalError("取得に失敗しました");
  }
}
