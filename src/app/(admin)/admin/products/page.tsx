"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAdminRole } from "@/lib/useAdminRole";
import { z } from "zod";

type Product = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  retailPrice: number;
  bottlesPerBox: number;
  isActive: boolean;
  createdAt: string;
  availableBoxes: number;
};

const productRows = z.array(z.object({
  id: z.string(), name: z.string(), description: z.string().nullable(), imageUrl: z.string().nullable(),
  retailPrice: z.number().int().positive(), bottlesPerBox: z.number().int().positive(),
  isActive: z.boolean(), createdAt: z.string(), availableBoxes: z.number().int().nonnegative(),
}));

export default function AdminProductsPage() {
  const { isViewer } = useAdminRole();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/admin/products/list", { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error("LOAD_FAILED");
      setProducts(productRows.parse(await res.json()));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openForm(product: Product | null) {
    setEditing(product);
    setShowForm(!product);
    setError("");
    setImageFile(null);
    setImagePreview(product?.imageUrl ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    let imageUrl: string | null = editing?.imageUrl ?? null;

    // 画像ファイルが選択されていればアップロード
    if (imageFile) {
      const fd = new FormData();
      fd.append("file", imageFile);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "画像のアップロードに失敗しました");
        setSaving(false);
        return;
      }
      const { url } = await uploadRes.json();
      imageUrl = url;
    }

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      description: fd.get("description") || null,
      imageUrl,
      retailPrice: parseInt(fd.get("retailPrice") as string),
      bottlesPerBox: parseInt(fd.get("bottlesPerBox") as string),
      isActive: fd.get("isActive") === "on",
    };

    const res = editing
      ? await fetch(`/api/admin/products/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      setImageFile(null);
      setImagePreview(null);
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? "処理を完了できませんでした。もう一度お試しください。");
    }
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    load();
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  const isFormOpen = showForm || !!editing;
  const visibleProducts = products.filter((product) => showInactive || product.isActive);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">商品管理</h1>
          <p className="text-slate-500 text-sm mt-1">商品マスタの追加・編集・画像登録</p>
        </div>
        {!isViewer && (
          <button
            onClick={() => openForm(null)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + 商品を追加
          </button>
        )}
      </div>

      {/* Form */}
      {!isViewer && isFormOpen && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">{editing ? "商品を編集" : "新規商品追加"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">商品名 <span className="text-red-500">*</span></label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Camiヘアオイル 60ml"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">商品説明</label>
              <textarea
                name="description"
                rows={2}
                defaultValue={editing?.description ?? ""}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Image upload */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">商品画像</label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                    <Image src={imagePreview} alt="プレビュー" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-1 right-1 bg-black/50 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0 bg-slate-50">
                    <span className="text-slate-400 text-xs text-center px-2">画像なし</span>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">JPG・PNG・WebP・GIF、3MB以内</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">定価（円）<span className="text-red-500">*</span></label>
              <input
                name="retailPrice"
                type="number"
                required
                min={1}
                defaultValue={editing?.retailPrice ?? 3880}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">箱あたり本数 <span className="text-red-500">*</span></label>
              <input
                name="bottlesPerBox"
                type="number"
                required
                min={1}
                defaultValue={editing?.bottlesPerBox ?? 24}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                defaultChecked={editing ? editing.isActive : true}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">販売中（チェックを外すと注文不可）</label>
            </div>
            {error && (
              <div className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存する"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); setImageFile(null); setImagePreview(null); }}
                className="text-slate-600 px-4 py-2 text-sm"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <label className="mb-4 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="h-4 w-4 rounded focus-visible:outline-2 focus-visible:outline-blue-600" />
        販売停止商品も表示
      </label>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : loadError ? (
          <div role="alert" className="p-6 text-sm leading-7 text-red-700">商品を取得できませんでした。<button type="button" onClick={load} className="ml-2 min-h-11 underline focus-visible:outline-2 focus-visible:outline-blue-600">再読み込み</button></div>
        ) : visibleProducts.length === 0 ? (
          <div role="status" className="py-16 text-center text-slate-500 text-sm">表示する商品がありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleProducts.map((p) => (
              <div key={p.id} className="px-6 py-4">
                <div className="flex flex-wrap items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <span className="text-slate-300 text-xs">No img</span>
                    )}
                  </div>

                  <div className="min-w-[min(100%,12rem)] flex-1 break-words">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 text-sm">{p.name}</span>
                      {!p.isActive && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">販売停止中</span>
                      )}
                    </div>
                    {p.description && (
                      <div className="text-xs text-slate-500 mb-2">{p.description}</div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="bg-slate-50 rounded px-2 py-1 text-slate-600">
                        定価 {fmt(p.retailPrice)} × {p.bottlesPerBox}本/箱
                      </span>
                      <span className="bg-blue-50 rounded px-2 py-1 text-blue-700">
                        1箱定価 {fmt(p.retailPrice * p.bottlesPerBox)}
                      </span>
                      <span className={`rounded px-2 py-1 ${p.availableBoxes > 10 ? "bg-green-50 text-green-700" : p.availableBoxes > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                        在庫 {p.availableBoxes} 箱
                      </span>
                    </div>
                  </div>

                  {!isViewer && (
                    <div className="flex max-w-full flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() => openForm(p)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => toggleActive(p)}
                        className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                          p.isActive
                            ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                            : "border-green-300 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {p.isActive ? "停止" : "再開"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
