import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireEditor } from "@/lib/admin-auth";

const createSchema = z.object({
  companyName: z.string().min(1, "店舗名は必須です"),
  contactName: z.string().min(1, "担当者名は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
  phone: z.string().min(1, "電話番号は必須です"),
  address: z.string().min(1, "住所は必須です"),
  businessDescription: z.string().optional(),
  rankId: z.string().min(1, "ランクを選択してください"),
});

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const members = await db
      .select({
        id: schema.members.id,
        companyName: schema.members.companyName,
        contactName: schema.members.contactName,
        email: schema.members.email,
        status: schema.members.status,
        createdAt: schema.members.createdAt,
      })
      .from(schema.members)
      .orderBy(desc(schema.members.createdAt));
    return NextResponse.json(members);
  } catch (e) {
    console.error("admin members GET error:", e);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return NextResponse.json({ error: first ?? "入力内容を確認してください" }, { status: 400 });
  }

  const { companyName, contactName, email, password, phone, address, businessDescription, rankId } = parsed.data;

  try {
    const existing = await db
      .select({ id: schema.members.id })
      .from(schema.members)
      .where(eq(schema.members.email, email));

    if (existing.length > 0) {
      return NextResponse.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [member] = await db
      .insert(schema.members)
      .values({
        email,
        password: hashed,
        companyName,
        contactName,
        phone,
        address,
        businessDescription: businessDescription ?? null,
        status: "approved",
        rankId,
      })
      .returning({ id: schema.members.id });

    await db.insert(schema.auditLogs).values({
      actorId: session!.user.id,
      actorRole: "admin",
      action: "create_member",
      targetType: "member",
      targetId: member.id,
      afterValue: JSON.stringify({ email, companyName, status: "approved" }),
    });

    return NextResponse.json({ memberId: member.id }, { status: 201 });
  } catch (e) {
    console.error("create member error:", e);
    return NextResponse.json({ error: "店舗の作成に失敗しました" }, { status: 500 });
  }
}
