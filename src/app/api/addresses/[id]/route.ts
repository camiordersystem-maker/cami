import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  isDefault: z.boolean().optional(),
  label: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const [addr] = await db
    .select()
    .from(schema.shippingAddresses)
    .where(
      and(
        eq(schema.shippingAddresses.id, params.id),
        eq(schema.shippingAddresses.memberId, session.user.id)
      )
    );

  if (!addr) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.isDefault) {
    await db
      .update(schema.shippingAddresses)
      .set({ isDefault: false })
      .where(eq(schema.shippingAddresses.memberId, session.user.id));
  }

  await db
    .update(schema.shippingAddresses)
    .set(parsed.data)
    .where(eq(schema.shippingAddresses.id, params.id));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db
    .update(schema.shippingAddresses)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(schema.shippingAddresses.id, params.id),
        eq(schema.shippingAddresses.memberId, session.user.id)
      )
    );

  return NextResponse.json({ ok: true });
}
