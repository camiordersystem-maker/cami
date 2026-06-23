import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id));

  const [member] = await db
    .select({ companyName: schema.members.companyName, email: schema.members.email, contactName: schema.members.contactName })
    .from(schema.members)
    .where(eq(schema.members.id, order.memberId));

  const [address] = await db
    .select()
    .from(schema.shippingAddresses)
    .where(eq(schema.shippingAddresses.id, order.shippingAddressId));

  return NextResponse.json({ ...order, member: member ?? null, address: address ?? null, items });
}
