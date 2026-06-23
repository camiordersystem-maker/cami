import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  retailPrice: z.number().int().min(1),
  bottlesPerBox: z.number().int().min(1),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const products = await db.select().from(schema.products).orderBy(schema.products.createdAt);
  const invs = await db.select().from(schema.inventory);
  const invMap = Object.fromEntries(invs.map((i: (typeof invs)[0]) => [i.productId, i.availableBoxes]));
  return NextResponse.json(products.map((p: (typeof products)[0]) => ({ ...p, availableBoxes: invMap[p.id] ?? 0 })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = productSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [product] = await db.insert(schema.products).values(parsed.data).returning();

  // Initialize inventory
  await db.insert(schema.inventory).values({
    productId: product.id,
    availableBoxes: 0,
    updatedBy: session.user.id,
  });

  return NextResponse.json(product, { status: 201 });
}
