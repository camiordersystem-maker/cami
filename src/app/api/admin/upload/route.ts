import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireEditor } from "@/lib/admin-auth";

// Derive the saved extension from the validated MIME type, never from the
// user-supplied filename (which may contain path separators).
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

export async function POST(req: NextRequest) {
  const session = await auth();
  const authErr = requireEditor(session);
  if (authErr) return authErr;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "JPG・PNG・WebP・GIF のみアップロード可能です" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ファイルサイズは3MB以内にしてください" }, { status: 400 });
    }

    const filename = `product-${Date.now()}.${ext}`;

    // Vercel Blob が設定済みの場合はクラウドに保存
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`products/${filename}`, file, { access: "public" });
      return NextResponse.json({ url: blob.url });
    }

    // Cloudflare Workersには永続的な書き込み可能ローカルFSがない。
    // 外部ストレージが未設定の場合、ローカル開発用fallbackへ進ませず
    // 明示的に利用不可として返す。
    if (process.env.RUNTIME_TARGET === "cloudflare-workers") {
      return NextResponse.json(
        {
          error: "画像ストレージが未設定です",
          code: "STORAGE_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    // ローカル開発: public/uploads/ に保存
    const { writeFile } = await import("fs/promises");
    const { join } = await import("path");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(process.cwd(), "public", "uploads", filename), buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e) {
    console.error("upload error:", e);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
