import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  try {
    const query = db
      .select({
        id: schema.inventoryReceipts.id,
        boxes: schema.inventoryReceipts.boxes,
        previousBoxes: schema.inventoryReceipts.previousBoxes,
        newBoxes: schema.inventoryReceipts.newBoxes,
        note: schema.inventoryReceipts.note,
        receivedBy: schema.inventoryReceipts.receivedBy,
        createdAt: schema.inventoryReceipts.createdAt,
        productId: schema.inventoryReceipts.productId,
        productName: schema.products.name,
        adminName: schema.admins.name,
      })
      .from(schema.inventoryReceipts)
      .leftJoin(schema.products, eq(schema.inventoryReceipts.productId, schema.products.id))
      .leftJoin(schema.admins, eq(schema.inventoryReceipts.receivedBy, schema.admins.id))
      .orderBy(desc(schema.inventoryReceipts.createdAt))
      .limit(100);

    const all = await query;
    const results = productId
      ? all.filter((r: typeof all[0]) => r.productId === productId)
      : all;

    return NextResponse.json(results);
  } catch (e) {
    console.error("inventory receipts GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
