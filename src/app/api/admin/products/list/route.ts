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

  const products = await db
    .select()
    .from(schema.products)
    .orderBy(desc(schema.products.createdAt));

  const invs = await db.select().from(schema.inventory);
  const invMap = Object.fromEntries(invs.map((i: (typeof invs)[0]) => [i.productId, i.availableBoxes]));

  return NextResponse.json(products.map((p: (typeof products)[0]) => ({ ...p, availableBoxes: invMap[p.id] ?? 0 })));
}
