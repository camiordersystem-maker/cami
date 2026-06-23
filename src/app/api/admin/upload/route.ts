import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "JPG・PNG・WebP・GIF のみアップロード可能です" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "ファイルサイズは3MB以内にしてください" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `product-${Date.now()}.${ext}`;

  // Vercel Blob が設定済みの場合はクラウドに保存
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`products/${filename}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  }

  // ローカル開発: public/uploads/ に保存
  const { writeFile } = await import("fs/promises");
  const { join } = await import("path");
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(join(process.cwd(), "public", "uploads", filename), buffer);
  return NextResponse.json({ url: `/uploads/${filename}` });
}
