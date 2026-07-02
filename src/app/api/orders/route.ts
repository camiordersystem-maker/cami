import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { z } from "zod";
import { generateOrderNo, TAX_RATE } from "@/lib/utils";
import { sendOrderConfirmation } from "@/lib/email";
import { conflict, forbidden, internalError, notFound, ok, unauthorized, validationError } from "@/lib/api-response";

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
  if (!session) return unauthorized();

  const memberId = session.user.id;
  const role = (session.user as { role: string }).role;
  if (role !== "member") return forbidden();

  try {
    const data = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.memberId, memberId))
      .orderBy(desc(schema.orders.createdAt));
    return Response.json(data);
  } catch (e) {
    console.error("orders GET error:", e);
    return internalError("注文履歴の取得に失敗しました");
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return unauthorized();

  const role = (session.user as { role: string }).role;
  if (role !== "member") return forbidden();

  const body = await req.json().catch(() => null);
  if (!body) return validationError("リクエストが不正です");

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return validationError();
  }

  const memberId = session.user.id;
  const { shippingAddressId, items, memo } = parsed.data;
  const decrementedItems: { productId: string; boxes: number }[] = [];
  let createdOrderId: string | null = null;

  const restoreInventory = async () => {
    for (const item of decrementedItems) {
      await db
        .update(schema.inventory)
        .set({
          availableBoxes: sql`${schema.inventory.availableBoxes} + ${item.boxes}`,
          updatedAt: new Date(),
          updatedBy: memberId,
        })
        .where(eq(schema.inventory.productId, item.productId));
    }
    decrementedItems.length = 0;
  };

  try {
    const [member] = await db
      .select({ id: schema.members.id, email: schema.members.email, companyName: schema.members.companyName, rankId: schema.members.rankId })
      .from(schema.members)
      .where(eq(schema.members.id, memberId));

    if (!member) return notFound("会員が見つかりません");

    const [rank] = await db
      .select()
      .from(schema.memberRanks)
      .where(eq(schema.memberRanks.id, member.rankId));

    if (!rank) return internalError("ランク情報が見つかりません");

    const rate = typeof rank.rate === "string" ? parseFloat(rank.rate) : rank.rate;

    let subtotal = 0;
    const orderItemValues: typeof schema.orderItems.$inferInsert[] = [];

    for (const item of items) {
      const [product] = await db.select().from(schema.products).where(eq(schema.products.id, item.productId));
      if (!product || !product.isActive) {
        return notFound(`商品が見つかりません: ${item.productId}`);
      }

      const [inv] = await db.select().from(schema.inventory).where(eq(schema.inventory.productId, item.productId));
      if (!inv || inv.availableBoxes < item.boxes) {
        return conflict(`在庫が不足しています: ${product.name}`);
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
        await restoreInventory();
        return conflict("在庫が不足しました。注文は作成されていません。");
      }
      decrementedItems.push({ productId: item.productId, boxes: item.boxes });
    }

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
    createdOrderId = order.id;

    await db.insert(schema.orderItems).values(
      orderItemValues.map((item) => ({ ...item, orderId: order.id }))
    );

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

    return ok({ orderId: order.id, orderNo: order.orderNo }, "注文を作成しました", { status: 201 });
  } catch (e) {
    console.error("create order error:", e);
    await restoreInventory().catch((restoreError) => {
      console.error("inventory restore failed after order error:", restoreError);
    });
    if (createdOrderId) {
      await db
        .update(schema.orders)
        .set({ status: "cancelled", updatedAt: new Date(), cancelReason: "注文作成中にエラーが発生しました" })
        .where(eq(schema.orders.id, createdOrderId))
        .catch((cancelError: unknown) => {
          console.error("order cancellation after create error failed:", cancelError);
        });
    }
    return internalError("注文の作成に失敗しました。再度お試しください。");
  }
}
