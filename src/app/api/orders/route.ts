import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, and, gte, isNull } from "drizzle-orm";
import { z } from "zod";
import { generateOrderNo, TAX_RATE } from "@/lib/utils";
import { sendOrderConfirmation } from "@/lib/email";
import { conflict, forbidden, internalError, notFound, ok, unauthorized, validationError } from "@/lib/api-response";
import { isPostgresRuntime } from "@/lib/env";

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

    const [shippingAddress] = await db
      .select({ id: schema.shippingAddresses.id })
      .from(schema.shippingAddresses)
      .where(
        and(
          eq(schema.shippingAddresses.id, shippingAddressId),
          eq(schema.shippingAddresses.memberId, memberId),
          isNull(schema.shippingAddresses.deletedAt)
        )
      );
    if (!shippingAddress) return validationError("配送先が正しくありません");

    const rate = typeof rank.rate === "string" ? parseFloat(rank.rate) : rank.rate;

    const [publishedTerms] = await db
      .select()
      .from(schema.terms)
      .where(eq(schema.terms.isPublished, true))
      .orderBy(desc(schema.terms.version))
      .limit(1);

    if (publishedTerms) {
      const [consent] = await db
        .select()
        .from(schema.memberTermsConsents)
        .where(eq(schema.memberTermsConsents.memberId, memberId))
        .orderBy(desc(schema.memberTermsConsents.agreedAt))
        .limit(1);
      if (consent?.termsId !== publishedTerms.id) {
        return conflict("最新の約款に同意してから注文してください。");
      }
    }

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

    // orderNo has a unique constraint; retry generation if the random
    // suffix collides with an existing order on the same day.
    let orderNo = generateOrderNo();
    for (let attempt = 0; attempt < 5; attempt++) {
      const [dup] = await db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(eq(schema.orders.orderNo, orderNo))
        .limit(1);
      if (!dup) break;
      orderNo = generateOrderNo();
    }

    const run = isPostgresRuntime()
      ? <T>(fn: (tx: typeof db) => Promise<T>) => db.transaction(fn)
      : <T>(fn: (tx: typeof db) => Promise<T>) => fn(db);

    const order = await run(async (tx) => {
      const [created] = await tx
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
          lastStatusChangedAt: new Date(),
          lastStatusChangedBy: memberId,
        })
        .returning();

      await tx.insert(schema.orderItems).values(
        orderItemValues.map((item) => ({ ...item, orderId: created.id }))
      );

      for (const item of items) {
        const [currentInventory] = await tx
          .select({
            id: schema.inventory.id,
            availableBoxes: schema.inventory.availableBoxes,
          })
          .from(schema.inventory)
          .where(eq(schema.inventory.productId, item.productId));

        if (!currentInventory || currentInventory.availableBoxes < item.boxes) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        const afterBoxes = currentInventory.availableBoxes - item.boxes;
        const updated = await tx
          .update(schema.inventory)
          .set({
            availableBoxes: afterBoxes,
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
          throw new Error("INVENTORY_CONFLICT");
        }

        await tx.insert(schema.inventoryMovements).values({
          productId: item.productId,
          orderId: created.id,
          movementType: "order_allocation",
          quantityDelta: -item.boxes,
          quantityBefore: currentInventory.availableBoxes,
          quantityAfter: afterBoxes,
          reason: "注文作成",
          actorId: memberId,
          actorRole: "member",
        });
      }

      await tx.insert(schema.orderStatusHistories).values({
        orderId: created.id,
        fromStatus: null,
        toStatus: "pending",
        reason: "注文作成",
        actorId: memberId,
        actorRole: "member",
      });

      await tx.insert(schema.auditLogs).values({
        actorId: memberId,
        actorRole: "member",
        action: "create_order",
        targetType: "order",
        targetId: created.id,
        afterValue: JSON.stringify({ orderNo, total }),
      });

      return created;
    });

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

    return ok({ orderId: order.id, orderNo: order.orderNo }, "注文を作成しました", { status: 201 });
  } catch (e) {
    console.error("create order error:", e);
    if (e instanceof Error && (e.message === "INSUFFICIENT_STOCK" || e.message === "INVENTORY_CONFLICT")) {
      return conflict("在庫が不足しました。注文は作成されていません。");
    }
    return internalError("注文の作成に失敗しました。再度お試しください。");
  }
}
