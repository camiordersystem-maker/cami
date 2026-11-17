"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { formatDateTime } from "@/lib/utils";
import { apiData, apiErrorMessage } from "@/lib/client-api";
import { useAdminRole } from "@/lib/useAdminRole";

type InventoryItem = {
  productId: string;
  productName: string;
  description: string | null;
  retailPrice: number;
  bottlesPerBox: number;
  availableBoxes: number;
  isActive: boolean;
};

type Receipt = {
  id: string;
  productId: string;
  productName: string | null;
  boxes: number;
  previousBoxes: number;
  newBoxes: number;
  note: string | null;
  adminName: string | null;
  createdAt: string;
};

const LOW_STOCK = 10;
const inventoryRows = z.array(z.object({
  productId: z.string(), productName: z.string(), description: z.string().nullable(),
  retailPrice: z.number().finite(), bottlesPerBox: z.number().int().positive(),
  availableBoxes: z.number().int().nonnegative(), isActive: z.boolean(),
}));
const receiptRows = z.array(z.object({
  id: z.string(), productId: z.string(), productName: z.string().nullable(),
  boxes: z.number().int(), previousBoxes: z.number().int(), newBoxes: z.number().int(),
  note: z.string().nullable(), adminName: z.string().nullable(), createdAt: z.string(),
}));

export default function AdminInventoryPage() {
  const { isViewer } = useAdminRole();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, number>>({});
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showReceipts, setShowReceipts] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const savingRef = useRef(false);
  const uncertainSave = useRef(false);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
    const [invRes, recRes] = await Promise.all([
      fetch("/api/admin/inventory/list", { signal: AbortSignal.timeout(15000) }),
      fetch("/api/admin/inventory/receipts", { signal: AbortSignal.timeout(15000) }),
    ]);
    if (!invRes.ok || !recRes.ok) throw new Error("LOAD_FAILED");
    const data = inventoryRows.parse(await invRes.json());
    const history = receiptRows.parse(await recRes.json());
      setItems(data);
      const vals: Record<string, number> = {};
      data.forEach((i: InventoryItem) => { vals[i.productId] = i.availableBoxes; });
      setInputValues(vals);
    setReceipts(history);
    uncertainSave.current = false;
    } catch {
      setLoadError(true);
    } finally {
    setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveInventory(productId: string) {
    if (savingRef.current || uncertainSave.current || loading || loadError) return;
    if (!Number.isSafeInteger(inputValues[productId]) || inputValues[productId] < 0) {
      setMessage({ text: "在庫数は0以上の整数を入力してください。", ok: false }); return;
    }
    if (!noteValues[productId]?.trim()) {
      setMessage({ text: "在庫の変更理由を入力してください。", ok: false }); return;
    }
    savingRef.current = true;
    setSaving(productId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PUT",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          availableBoxes: inputValues[productId] ?? 0,
          expectedAvailableBoxes: items.find((item) => item.productId === productId)?.availableBoxes,
          note: noteValues[productId] || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSaving(null);
      if (res.ok) {
        setEditing(null);
        setNoteValues((prev) => ({ ...prev, [productId]: "" }));
        const isLow = apiData<{ lowStock?: boolean }>(data)?.lowStock;
        setMessage({ text: isLow ? "在庫数を更新しました（在庫が少なくなっています）" : "在庫数を更新しました", ok: true });
        load();
      } else {
        if (res.status >= 500) throw new Error("SAVE_RESULT_UNKNOWN");
        setMessage({ text: apiErrorMessage(data, "更新に失敗しました"), ok: false });
        if (res.status === 409) { setEditing(null); await load(); }
      }
    } catch {
      uncertainSave.current = true;
      setEditing(null);
      setMessage({ text: "保存結果を確認できません。在庫・入庫履歴を再読み込みして確認してください。同じ変更を繰り返さないでください。", ok: false });
      await load();
    } finally {
      savingRef.current = false;
      setSaving(null);
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  const totalBoxes = items.reduce((s, i) => s + i.availableBoxes, 0);
  const totalValue = items.reduce((s, i) => s + i.availableBoxes * i.bottlesPerBox * i.retailPrice, 0);
  const lowStockItems = items.filter((i) => i.availableBoxes > 0 && i.availableBoxes <= LOW_STOCK);
  const outOfStockItems = items.filter((i) => i.availableBoxes === 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">在庫管理</h1>
          <p className="text-slate-500 text-sm mt-1">商品ごとの在庫数を管理します</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowReceipts(!showReceipts)}
            className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
          >
            {showReceipts ? "在庫管理を表示" : "入庫履歴を表示"}
          </button>
          <a
            href="/api/admin/export/inventory"
            className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
          >
            CSV出力
          </a>
        </div>
      </div>

      {message && (
        <div role={message.ok ? "status" : "alert"} className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}
      {loadError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">在庫・履歴を取得できませんでした。<button type="button" onClick={load} disabled={loading} className="ml-2 min-h-11 underline">再読み込み</button></div>}

      {/* Low stock alerts */}
      {(outOfStockItems.length > 0 || lowStockItems.length > 0) && !showReceipts && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          {outOfStockItems.length > 0 && (
            <div className="font-semibold mb-1">
              在庫切れ：{outOfStockItems.map((i) => i.productName).join("、")}
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div>
              残少（{LOW_STOCK}箱以下）：{lowStockItems.map((i) => `${i.productName}（${i.availableBoxes}箱）`).join("、")}
            </div>
          )}
        </div>
      )}

      {loadError ? null : showReceipts ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">入庫履歴（直近100件）</h2>
          </div>
          {receipts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">入庫履歴がありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3 font-medium text-slate-600">商品名</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">変更前</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">変更量</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">変更後</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">メモ</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">担当者</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 text-slate-700 font-medium">{r.productName ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{r.previousBoxes}箱</td>
                      <td className={`px-4 py-3 text-right font-medium ${r.boxes >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {r.boxes >= 0 ? "+" : ""}{r.boxes}箱
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{r.newBoxes}箱</td>
                      <td className="px-4 py-3 text-slate-500">{r.note ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{r.adminName ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
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
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex-1 min-w-[140px] break-words">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">{item.productName}</span>
                          {!item.isActive && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">販売停止</span>
                          )}
                          {item.availableBoxes === 0 && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">在庫切れ</span>
                          )}
                          {item.availableBoxes > 0 && item.availableBoxes <= LOW_STOCK && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">残少</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          定価 {fmt(item.retailPrice)} × {item.bottlesPerBox}本/箱　→　1箱定価 {fmt(item.retailPrice * item.bottlesPerBox)}
                        </div>
                      </div>

                      <div className="flex w-full sm:w-auto items-center justify-end gap-3">
                        {editing === item.productId ? (
                          <div className="w-full space-y-2">
                            <label htmlFor={`stock-${item.productId}`} className="block text-xs text-slate-600">変更後の在庫（箱）</label>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="number"
                                id={`stock-${item.productId}`}
                                step={1}
                                disabled={saving === item.productId}
                                min={0}
                                value={inputValues[item.productId] ?? 0}
                                onChange={(e) =>
                                  setInputValues((prev) => ({
                                    ...prev,
                                    [item.productId]: Number(e.target.value),
                                  }))
                                }
                                className="w-24 text-center border border-blue-400 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-sm text-slate-500">箱</span>
                              <button
                                type="button"
                                onClick={() => saveInventory(item.productId)}
                                disabled={saving === item.productId}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                              >
                                {saving === item.productId ? "保存中..." : "保存"}
                              </button>
                              <button
                                type="button"
                                aria-label="在庫編集を取り消す"
                                title="編集を取り消す"
                                disabled={saving === item.productId}
                                onClick={() => { setEditing(null); setInputValues((prev) => ({ ...prev, [item.productId]: item.availableBoxes })); }}
                                className="text-slate-500 text-sm px-2"
                              >
                                ✕
                              </button>
                            </div>
                            <label htmlFor={`stock-note-${item.productId}`} className="block text-xs text-slate-600">変更理由（必須）</label>
                            <input
                              id={`stock-note-${item.productId}`}
                              required
                              maxLength={200}
                              disabled={saving === item.productId}
                              type="text"
                              value={noteValues[item.productId] ?? ""}
                              onChange={(e) => setNoteValues((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                              placeholder="例：11月17日 入荷・検品完了"
                              className="w-full border border-slate-300 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                item.availableBoxes === 0 ? "text-red-600"
                                  : item.availableBoxes <= LOW_STOCK ? "text-amber-600"
                                  : "text-green-600"
                              }`}>
                                {item.availableBoxes}
                              </div>
                              <div className="text-xs text-slate-400">箱</div>
                            </div>
                            {!isViewer && (
                              <button
                                onClick={() => setEditing(item.productId)}
                                className="text-sm text-blue-600 hover:underline px-2"
                              >
                                編集
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stock level bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${
                            item.availableBoxes === 0 ? "bg-red-400"
                              : item.availableBoxes <= LOW_STOCK ? "bg-amber-400"
                              : "bg-green-400"
                          }`}
                          style={{ width: `${Math.min(100, (item.availableBoxes / 200) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
