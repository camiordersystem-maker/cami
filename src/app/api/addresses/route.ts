import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().min(1),
  recipientName: z.string().min(1),
  postalCode: z.string().min(1),
  prefecture: z.string().min(1),
  address1: z.string().min(1),
  address2: z.string().nullable().optional(),
  phone: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await db
    .select()
    .from(schema.shippingAddresses)
    .where(and(eq(schema.shippingAddresses.memberId, session.user.id), isNull(schema.shippingAddresses.deletedAt)));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = addressSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  try {
    // If setting as default, clear others
    if (parsed.data.isDefault) {
      await db
        .update(schema.shippingAddresses)
        .set({ isDefault: false })
        .where(eq(schema.shippingAddresses.memberId, session.user.id));
    }

    const [address] = await db
      .insert(schema.shippingAddresses)
      .values({ ...parsed.data, memberId: session.user.id })
      .returning();

    return NextResponse.json(address, { status: 201 });
  } catch (e) {
    console.error("Address save error:", e);
    return NextResponse.json({ error: "配送先の保存に失敗しました" }, { status: 500 });
  }
}
