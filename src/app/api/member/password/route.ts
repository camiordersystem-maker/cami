import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role: string }).role;
  if (role !== "member") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null) as { currentPassword?: string; newPassword?: string } | null;
  if (!body?.currentPassword || !body?.newPassword) {
    return NextResponse.json({ error: "現在のパスワードと新しいパスワードを入力してください" }, { status: 400 });
  }

  if (body.newPassword.length < 8) {
    return NextResponse.json({ error: "新しいパスワードは8文字以上で入力してください" }, { status: 400 });
  }

  try {
    const [member] = await db
      .select({ id: schema.members.id, password: schema.members.password })
      .from(schema.members)
      .where(eq(schema.members.id, session.user.id));

    if (!member) return NextResponse.json({ error: "会員が見つかりません" }, { status: 404 });

    const valid = await bcrypt.compare(body.currentPassword, member.password);
    if (!valid) {
      return NextResponse.json({ error: "現在のパスワードが正しくありません" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(body.newPassword, 12);
    await db
      .update(schema.members)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(schema.members.id, member.id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("member password PATCH error:", e);
    return NextResponse.json({ error: "パスワードの変更に失敗しました" }, { status: 500 });
  }
}
