"use client";

import { useState, useEffect } from "react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  retailPrice: number;
  bottlesPerBox: number;
  isActive: boolean;
  createdAt: string;
  availableBoxes: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/products/list");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      description: fd.get("description") || null,
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
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "エラーが発生しました");
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">商品管理</h1>
          <p className="text-slate-500 text-sm mt-1">商品マスタの追加・編集</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(!showForm); setError(""); }}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + 商品を追加
        </button>
      </div>

      {/* Form */}
      {(showForm || editing) && (
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
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="text-slate-600 px-4 py-2 text-sm"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">商品がありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {products.map((p) => (
              <div key={p.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => { setEditing(p); setShowForm(false); setError(""); }}
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
