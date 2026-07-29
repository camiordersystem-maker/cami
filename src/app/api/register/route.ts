import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendNewMemberNotification } from "@/lib/email";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { conflict, internalError, ok, rateLimited, validationError } from "@/lib/api-response";

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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!checkRateLimit(rateLimitKey("register", ip), 5, 60 * 60 * 1000)) {
      return rateLimited("登録試行回数が多すぎます。時間をおいて再度お試しください。");
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "入力内容を確認してください";
      return validationError(msg);
    }

    const { email, password, companyName, contactName, phone, address, businessDescription } = parsed.data;

    // Check duplicate email
    const [existing] = await db.select().from(schema.members).where(eq(schema.members.email, email));
    if (existing) {
      return conflict("このメールアドレスは既に登録されています");
    }

    // 新規登録の初期ランクは「掛け率が最も高い（＝割引が最も少ない）」入門ランクにする。
    // rate昇順だと逆に最上位ランク（例: プラチナ35%）が新規未実績の会員に
    // 付与されてしまうため、必ずdescで最も割引の少ないランクを選ぶ。
    const [defaultRank] = await db
      .select()
      .from(schema.memberRanks)
      .orderBy(desc(schema.memberRanks.rate));

    if (!defaultRank) {
      return internalError("システムエラー：ランク情報が見つかりません");
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

    return ok({ registered: true });
  } catch (err) {
    console.error("Register error:", err);
    return internalError("サーバーエラーが発生しました");
  }
}
