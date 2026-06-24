import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, lte } from "drizzle-orm";
import { INVENTORY_WARNING_THRESHOLD } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await db
      .select({
        productId: schema.inventory.productId,
        availableBoxes: schema.inventory.availableBoxes,
        productName: schema.products.name,
      })
      .from(schema.inventory)
      .leftJoin(schema.products, eq(schema.inventory.productId, schema.products.id))
      .where(lte(schema.inventory.availableBoxes, INVENTORY_WARNING_THRESHOLD));

    return NextResponse.json(items);
  } catch (e) {
    console.error("inventory warnings error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
