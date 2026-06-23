import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  const memberId = session.user.id;

  // Get member rank for wholesale price calculation
  let rate = 0.5; // default
  if (role === "member") {
    const [member] = await db
      .select()
      .from(schema.members)
      .where(eq(schema.members.id, memberId));
    if (member) {
      const [rank] = await db
        .select()
        .from(schema.memberRanks)
        .where(eq(schema.memberRanks.id, member.rankId));
      if (rank) rate = rank.rate;
    }
  }

  const prods = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.isActive, true));

  const invs = await db.select().from(schema.inventory);
  const invMap = Object.fromEntries(invs.map((i: (typeof invs)[0]) => [i.productId, i.availableBoxes]));

  const result = prods.map((p: (typeof prods)[0]) => ({
    ...p,
    availableBoxes: invMap[p.id] ?? 0,
    wholesalePricePerBox: Math.round(p.retailPrice * p.bottlesPerBox * rate),
    rateApplied: rate,
  }));

  return NextResponse.json(result);
}
