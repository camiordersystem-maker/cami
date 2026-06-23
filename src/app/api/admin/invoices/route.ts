import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";
import { generateInvoiceNo, lastDayOfMonth } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invoices = await db
      .select({
        id: schema.monthlyInvoices.id,
        invoiceNo: schema.monthlyInvoices.invoiceNo,
        year: schema.monthlyInvoices.year,
        month: schema.monthlyInvoices.month,
        subtotal: schema.monthlyInvoices.subtotal,
        taxAmount: schema.monthlyInvoices.taxAmount,
        total: schema.monthlyInvoices.total,
        paymentStatus: schema.monthlyInvoices.paymentStatus,
        paymentDueDate: schema.monthlyInvoices.paymentDueDate,
        issuedAt: schema.monthlyInvoices.issuedAt,
        companyName: schema.members.companyName,
        memberId: schema.monthlyInvoices.memberId,
      })
      .from(schema.monthlyInvoices)
      .leftJoin(schema.members, eq(schema.monthlyInvoices.memberId, schema.members.id))
      .orderBy(desc(schema.monthlyInvoices.issuedAt));

    return NextResponse.json(invoices);
  } catch (e) {
    console.error("invoices GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null) as { memberId: string; year: number; month: number; note?: string } | null;
  if (!body?.memberId || !body.year || !body.month) {
    return NextResponse.json({ error: "memberId・year・month は必須です" }, { status: 400 });
  }

  const { memberId, year, month, note } = body;

  try {
    const [existing] = await db
      .select()
      .from(schema.monthlyInvoices)
      .where(
        and(
          eq(schema.monthlyInvoices.memberId, memberId),
          eq(schema.monthlyInvoices.year, year),
          eq(schema.monthlyInvoices.month, month)
        )
      );

    if (existing) {
      return NextResponse.json({ error: "この月の請求書はすでに発行済みです" }, { status: 409 });
    }

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 1);

    const orders = await db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.memberId, memberId),
          gte(schema.orders.createdAt, periodStart),
          lt(schema.orders.createdAt, periodEnd)
        )
      );

    const billableOrders = orders.filter((o: typeof orders[0]) =>
      ["confirmed", "shipped", "delivered"].includes(o.status)
    );

    if (billableOrders.length === 0) {
      return NextResponse.json({ error: "この月に請求対象の注文がありません" }, { status: 400 });
    }

    const subtotal = billableOrders.reduce((s: number, o: typeof billableOrders[0]) => s + o.subtotal, 0);
    const taxAmount = billableOrders.reduce((s: number, o: typeof billableOrders[0]) => s + o.taxAmount, 0);
    const total = subtotal + taxAmount;

    const paymentDueDate = lastDayOfMonth(
      month === 12 ? year + 1 : year,
      month === 12 ? 1 : month + 1
    );

    const invoiceNo = generateInvoiceNo(year, month);

    const [invoice] = await db
      .insert(schema.monthlyInvoices)
      .values({
        invoiceNo,
        memberId,
        year,
        month,
        subtotal,
        taxAmount,
        total,
        paymentStatus: "unpaid",
        paymentDueDate,
        note: note ?? null,
      })
      .returning();

    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    console.error("invoice POST error:", e);
    return NextResponse.json({ error: "請求書の作成に失敗しました" }, { status: 500 });
  }
}
