import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { z } from "zod";
import { generateOrderNo, TAX_RATE } from "@/lib/utils";
import { sendOrderConfirmation } from "@/lib/email";

const orderItemSchema = z.object({
  productId: z.string(),
  boxes: z.number().int().min(1),
});

const createOrderSchema = z.object({
  shippingAddressId: z.string(),
  items: z.array(orderItemSchema).min(1),
  memo: z.string().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberId = session.user.id;
  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const data = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.memberId, memberId))
      .orderBy(desc(schema.orders.createdAt));
    return NextResponse.json(data);
  } catch (e) {
    console.error("orders GET error:", e);
    return NextResponse.json({ error: "注文履歴の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "リクエストが不正です" }, { status: 400 });

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const memberId = session.user.id;
  const { shippingAddressId, items, memo } = parsed.data;

  try {
    const [member] = await db
      .select({ id: schema.members.id, email: schema.members.email, companyName: schema.members.companyName, rankId: schema.members.rankId })
      .from(schema.members)
      .where(eq(schema.members.id, memberId));

    if (!member) return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });

    const [rank] = await db
      .select()
      .from(schema.memberRanks)
      .where(eq(schema.memberRanks.id, member.rankId));

    if (!rank) return NextResponse.json({ error: "ランク情報が見つかりません" }, { status: 500 });

    const rate = typeof rank.rate === "string" ? parseFloat(rank.rate) : rank.rate;

    let subtotal = 0;
    const orderItemValues: typeof schema.orderItems.$inferInsert[] = [];

    for (const item of items) {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, item.productId));
      if (!product || !product.isActive) {
        return NextResponse.json({ error: `商品が見つかりません: ${item.productId}` }, { status: 400 });
      }

      const [inv] = await db.select().from(schema.inventory).where(eq(schema.inventory.productId, item.productId));
      if (!inv || inv.availableBoxes < item.boxes) {
        return NextResponse.json({ error: `在庫が不足しています: ${product.name}` }, { status: 400 });
      }

      const unitPricePerBox = Math.round(product.retailPrice * product.bottlesPerBox * rate);
      const itemSubtotal = unitPricePerBox * item.boxes;
      subtotal += itemSubtotal;

      orderItemValues.push({
        orderId: "",
        productId: product.id,
        productName: product.name,
        boxes: item.boxes,
        bottlesPerBox: product.bottlesPerBox,
        unitPricePerBox,
        rateApplied: rate,
        subtotal: itemSubtotal,
      });
    }

    const taxAmount = Math.round(subtotal * TAX_RATE);
    const total = subtotal + taxAmount;

    const orderNo = generateOrderNo();
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderNo,
        memberId,
        shippingAddressId,
        status: "pending",
        subtotal,
        taxRate: String(TAX_RATE),
        taxAmount,
        total,
        memo: memo ?? null,
      })
      .returning();

    await db.insert(schema.orderItems).values(
      orderItemValues.map((item) => ({ ...item, orderId: order.id }))
    );

    for (const item of items) {
      const updated = await db
        .update(schema.inventory)
        .set({
          availableBoxes: sql`${schema.inventory.availableBoxes} - ${item.boxes}`,
          updatedAt: new Date(),
          updatedBy: memberId,
        })
        .where(
          and(
            eq(schema.inventory.productId, item.productId),
            gte(schema.inventory.availableBoxes, item.boxes)
          )
        )
        .returning({ id: schema.inventory.id });

      if (updated.length === 0) {
        await db.update(schema.orders).set({ status: "cancelled" }).where(eq(schema.orders.id, order.id));
        return NextResponse.json({ error: `在庫が不足しました。注文をキャンセルしました。` }, { status: 409 });
      }
    }

    try {
      await sendOrderConfirmation({
        to: member.email,
        companyName: member.companyName,
        orderNo: order.orderNo,
        total: order.total,
      });
    } catch (e) {
      console.error("Order confirmation email failed:", e);
    }

    await db.insert(schema.auditLogs).values({
      actorId: memberId,
      actorRole: "member",
      action: "create_order",
      targetType: "order",
      targetId: order.id,
      afterValue: JSON.stringify({ orderNo, total: subtotal }),
    });

    return NextResponse.json({ orderId: order.id, orderNo: order.orderNo }, { status: 201 });
  } catch (e) {
    console.error("create order error:", e);
    return NextResponse.json({ error: "注文の作成に失敗しました。再度お試しください。" }, { status: 500 });
  }
}
