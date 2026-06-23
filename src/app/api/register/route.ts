import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendNewMemberNotification } from "@/lib/email";

const registerSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  companyName: z.string().min(1, "会社名を入力してください"),
  contactName: z.string().min(1, "担当者名を入力してください"),
  phone: z.string().min(1, "電話番号を入力してください"),
  address: z.string().min(1, "住所を入力してください"),
  businessDescription: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "入力内容を確認してください";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { email, password, companyName, contactName, phone, address, businessDescription } = parsed.data;

    // Check duplicate email
    const [existing] = await db.select().from(schema.members).where(eq(schema.members.email, email));
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }

    // Get default rank (lowest)
    const [defaultRank] = await db
      .select()
      .from(schema.memberRanks)
      .orderBy(schema.memberRanks.rate);

    if (!defaultRank) {
      return NextResponse.json({ error: "システムエラー：ランク情報が見つかりません" }, { status: 500 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await db.insert(schema.members).values({
      email,
      password: hashed,
      companyName,
      contactName,
      phone,
      address,
      businessDescription,
      status: "pending",
      rankId: defaultRank.id,
    });

    // メール送信失敗は登録自体を妨げない
    try {
      await sendNewMemberNotification({ companyName, contactName, email });
    } catch (e) {
      console.error("Registration notification email failed:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
