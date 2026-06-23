import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireEditor } from "@/lib/admin-auth";
import { z } from "zod";

const settingsSchema = z.object({
  companyName: z.string().max(100).optional(),
  companyPostalCode: z.string().max(10).optional(),
  companyAddress: z.string().max(200).optional(),
  companyTel: z.string().max(20).optional(),
  companyEmail: z.string().max(100).optional(),
  invoiceRegistrationNo: z.string().max(20).optional(),
  supportEmail: z.string().max(100).optional(),
  lowStockThreshold: z.number().int().min(0).max(9999).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [settings] = await db
      .select()
      .from(schema.systemSettings)
      .where(eq(schema.systemSettings.id, "singleton"));

    return NextResponse.json(settings ?? null);
  } catch (e) {
    console.error("settings GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  try {
    const updates: Partial<typeof schema.systemSettings.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: session!.user.id,
    };
    const d = parsed.data;
    if (d.companyName !== undefined) updates.companyName = d.companyName;
    if (d.companyPostalCode !== undefined) updates.companyPostalCode = d.companyPostalCode;
    if (d.companyAddress !== undefined) updates.companyAddress = d.companyAddress;
    if (d.companyTel !== undefined) updates.companyTel = d.companyTel;
    if (d.companyEmail !== undefined) updates.companyEmail = d.companyEmail;
    if (d.invoiceRegistrationNo !== undefined) updates.invoiceRegistrationNo = d.invoiceRegistrationNo;
    if (d.supportEmail !== undefined) updates.supportEmail = d.supportEmail;
    if (d.lowStockThreshold !== undefined) updates.lowStockThreshold = d.lowStockThreshold;

    await db
      .update(schema.systemSettings)
      .set(updates)
      .where(eq(schema.systemSettings.id, "singleton"));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("settings PUT error:", e);
    return NextResponse.json({ error: "保存に失敗しました" }, { status: 500 });
  }
}
