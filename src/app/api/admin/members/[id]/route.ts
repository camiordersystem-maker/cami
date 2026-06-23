import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { sendMemberApproved, sendMemberRejected } from "@/lib/email";

const updateSchema = z.object({
  status: z.enum(["approved", "rejected", "suspended", "pending"]).optional(),
  rankId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [member] = await db.select().from(schema.members).where(eq(schema.members.id, params.id));
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [rank] = await db.select({ id: schema.memberRanks.id, name: schema.memberRanks.name, rate: schema.memberRanks.rate })
    .from(schema.memberRanks).where(eq(schema.memberRanks.id, member.rankId));

  const orders = await db
    .select({ id: schema.orders.id, orderNo: schema.orders.orderNo, status: schema.orders.status, total: schema.orders.total, createdAt: schema.orders.createdAt })
    .from(schema.orders)
    .where(eq(schema.orders.memberId, params.id))
    .orderBy(desc(schema.orders.createdAt));

  const addresses = await db
    .select({ id: schema.shippingAddresses.id, label: schema.shippingAddresses.label, prefecture: schema.shippingAddresses.prefecture, address1: schema.shippingAddresses.address1, isDefault: schema.shippingAddresses.isDefault })
    .from(schema.shippingAddresses)
    .where(and(eq(schema.shippingAddresses.memberId, params.id), isNull(schema.shippingAddresses.deletedAt)));

  // Don't expose password
  const { password: _, ...memberData } = member;
  return NextResponse.json({ ...memberData, rank: rank ?? null, orders, addresses });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const [member] = await db.select().from(schema.members).where(eq(schema.members.id, params.id));
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Partial<typeof schema.members.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.status) updates.status = parsed.data.status;
  if (parsed.data.rankId) updates.rankId = parsed.data.rankId;

  await db.update(schema.members).set(updates).where(eq(schema.members.id, params.id));

  if (parsed.data.status === "approved" && member.status !== "approved") {
    await sendMemberApproved({ to: member.email, companyName: member.companyName });
  }
  if (parsed.data.status === "rejected" && member.status !== "rejected") {
    await sendMemberRejected({ to: member.email, companyName: member.companyName });
  }

  await db.insert(schema.auditLogs).values({
    actorId: session.user.id,
    actorRole: "admin",
    action: "update_member",
    targetType: "member",
    targetId: params.id,
    beforeValue: JSON.stringify({ status: member.status, rankId: member.rankId }),
    afterValue: JSON.stringify(parsed.data),
  });

  return NextResponse.json({ ok: true });
}
