"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type InventoryItem = {
  productId: string;
  productName: string;
  description: string | null;
  retailPrice: number;
  bottlesPerBox: number;
  availableBoxes: number;
  isActive: boolean;
};

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/inventory/list");
    if (res.ok) {
      const data = await res.json();
      setItems(data);
      const vals: Record<string, number> = {};
      data.forEach((i: InventoryItem) => { vals[i.productId] = i.availableBoxes; });
      setInputValues(vals);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveInventory(productId: string) {
    setSaving(productId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, availableBoxes: inputValues[productId] ?? 0 }),
      });
      const data = await res.json().catch(() => ({}));
      setSaving(null);
      if (res.ok) {
        setEditing(null);
        setMessage({ text: "在庫数を更新しました", ok: true });
        load();
      } else {
        setMessage({ text: (data as { error?: string }).error ?? "更新に失敗しました", ok: false });
      }
    } catch {
      setSaving(null);
      setMessage({ text: "ネットワークエラーが発生しました", ok: false });
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  const totalBoxes = items.reduce((s, i) => s + i.availableBoxes, 0);
  const totalValue = items.reduce((s, i) => s + i.availableBoxes * i.bottlesPerBox * i.retailPrice, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">在庫管理</h1>
          <p className="text-slate-500 text-sm mt-1">商品ごとの在庫数を管理します</p>
        </div>
        <a
          href="/api/admin/export/inventory"
          className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
        >
          CSV出力
        </a>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 mb-1">総在庫数</div>
          <div className="text-xl font-bold text-slate-900">{totalBoxes.toLocaleString()} 箱</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs text-slate-500 mb-1">在庫定価総額</div>
          <div className="text-xl font-bold text-slate-900">{fmt(totalValue)}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.productId} className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{item.productName}</span>
                      {!item.isActive && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">販売停止</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      定価 {fmt(item.retailPrice)} × {item.bottlesPerBox}本/箱　→　1箱定価 {fmt(item.retailPrice * item.bottlesPerBox)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-6">
                    {editing === item.productId ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          value={inputValues[item.productId] ?? 0}
                          onChange={(e) =>
                            setInputValues((prev) => ({
                              ...prev,
                              [item.productId]: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-24 text-center border border-blue-400 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-500">箱</span>
                        <button
                          onClick={() => saveInventory(item.productId)}
                          disabled={saving === item.productId}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {saving === item.productId ? "保存中..." : "保存"}
                        </button>
                        <button
                          onClick={() => { setEditing(null); setInputValues((prev) => ({ ...prev, [item.productId]: item.availableBoxes })); }}
                          className="text-slate-500 text-sm px-2"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
                              item.availableBoxes === 0
                                ? "text-red-600"
                                : item.availableBoxes <= 10
                                ? "text-amber-600"
                                : "text-green-600"
                            }`}
                          >
                            {item.availableBoxes}
                          </div>
                          <div className="text-xs text-slate-400">箱</div>
                        </div>
                        <button
                          onClick={() => setEditing(item.productId)}
                          className="text-sm text-blue-600 hover:underline px-2"
                        >
                          編集
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stock level bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.availableBoxes === 0
                          ? "bg-red-400"
                          : item.availableBoxes <= 10
                          ? "bg-amber-400"
                          : "bg-green-400"
                      }`}
                      style={{ width: `${Math.min(100, (item.availableBoxes / 200) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {item.availableBoxes === 0
                      ? "在庫切れ"
                      : item.availableBoxes <= 10
                      ? "在庫少（要補充）"
                      : "在庫あり"}
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
