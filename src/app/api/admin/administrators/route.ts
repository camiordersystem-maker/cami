import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/admin-auth";

const createSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
  role: z.enum(["superadmin", "editor", "viewer"]),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["superadmin", "editor", "viewer"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admins = await db
      .select({
        id: schema.admins.id,
        name: schema.admins.name,
        email: schema.admins.email,
        role: schema.admins.role,
        isActive: schema.admins.isActive,
        createdAt: schema.admins.createdAt,
        updatedAt: schema.admins.updatedAt,
      })
      .from(schema.admins)
      .orderBy(schema.admins.createdAt);

    return NextResponse.json(admins);
  } catch (e) {
    console.error("administrators GET error:", e);
    return NextResponse.json({ error: "管理者一覧の取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const authErr = requireSuperAdmin(session);
  if (authErr) return authErr;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return NextResponse.json({ error: first ?? "入力内容を確認してください" }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;

  try {
    const existing = await db
      .select({ id: schema.admins.id })
      .from(schema.admins)
      .where(eq(schema.admins.email, email));

    if (existing.length > 0) {
      return NextResponse.json({ error: "このメールアドレスはすでに使用されています" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const [admin] = await db
      .insert(schema.admins)
      .values({ name, email, password: hashed, role, isActive: true })
      .returning({ id: schema.admins.id, name: schema.admins.name, email: schema.admins.email, role: schema.admins.role });

    return NextResponse.json(admin, { status: 201 });
  } catch (e) {
    console.error("administrators POST error:", e);
    return NextResponse.json({ error: "管理者の作成に失敗しました" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  const authErr = requireSuperAdmin(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const { id, password, ...rest } = parsed.data;

  if (id === session!.user.id && rest.isActive === false) {
    return NextResponse.json({ error: "自分自身を無効化することはできません" }, { status: 400 });
  }

  try {
    const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() };
    if (password) {
      updates.password = await bcrypt.hash(password, 12);
    }

    await db.update(schema.admins).set(updates).where(eq(schema.admins.id, id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("administrators PUT error:", e);
    return NextResponse.json({ error: "管理者の更新に失敗しました" }, { status: 500 });
  }
}
