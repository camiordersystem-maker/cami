import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  productId: z.string(),
  availableBoxes: z.number().int().min(0),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await db
    .update(schema.inventory)
    .set({
      availableBoxes: parsed.data.availableBoxes,
      updatedAt: new Date(),
      updatedBy: session.user.id,
    })
    .where(eq(schema.inventory.productId, parsed.data.productId));

  return NextResponse.json({ ok: true });
}
