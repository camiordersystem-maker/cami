import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await db
      .select({
        id: schema.products.id, name: schema.products.name, description: schema.products.description,
        imageUrl: schema.products.imageUrl, retailPrice: schema.products.retailPrice,
        bottlesPerBox: schema.products.bottlesPerBox, isActive: schema.products.isActive,
        createdAt: schema.products.createdAt, updatedAt: schema.products.updatedAt,
      })
      .from(schema.products)
      .orderBy(desc(schema.products.createdAt));

    const invs = await db
      .select({ productId: schema.inventory.productId, availableBoxes: schema.inventory.availableBoxes })
      .from(schema.inventory);
    const invMap = Object.fromEntries(invs.map((i: { productId: string; availableBoxes: number }) => [i.productId, i.availableBoxes]));

    return NextResponse.json(products.map((p: typeof products[0]) => ({ ...p, availableBoxes: invMap[p.id] ?? 0 })));
  } catch (e) {
    console.error("products/list GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
