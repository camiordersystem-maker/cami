"use client";

import { useState, useEffect } from "react";

type Rank = {
  id: string;
  name: string;
  rate: number;
  minMonthlyBoxes: number;
  description: string | null;
};

export default function AdminRanksPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Rank | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/ranks");
    if (res.ok) setRanks(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      ...(editing ? { id: editing.id } : {}),
      name: fd.get("name"),
      rate: parseFloat(fd.get("rate") as string) / 100,
      minMonthlyBoxes: parseInt(fd.get("minMonthlyBoxes") as string) || 0,
      description: fd.get("description") || null,
    };

    try {
      const res = editing
        ? await fetch("/api/admin/ranks", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/admin/ranks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      setSaving(false);
      if (res.ok) {
        setMessage({ text: editing ? "ランクを更新しました" : "ランクを追加しました", ok: true });
        setEditing(null);
        setShowForm(false);
        load();
      } else {
        setError((data as { error?: string }).error ?? "エラーが発生しました");
      }
    } catch {
      setSaving(false);
      setError("ネットワークエラーが発生しました");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ランク管理</h1>
          <p className="text-slate-500 text-sm mt-1">卸値掛け率を会員ランクで管理します</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(!showForm); setError(""); setMessage(null); }}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + ランクを追加
        </button>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {(showForm || editing) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">{editing ? "ランクを編集" : "新規ランク追加"}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">ランク名 <span className="text-red-500">*</span></label>
              <input
                name="name"
                required
                defaultValue={editing?.name}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ゴールド"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">掛け率（%）<span className="text-red-500">*</span></label>
              <input
                name="rate"
                type="number"
                required
                min={1}
                max={100}
                step={0.1}
                defaultValue={editing ? Math.round(editing.rate * 100) : 50}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">月間最低発注数（箱）</label>
              <input
                name="minMonthlyBoxes"
                type="number"
                min={0}
                defaultValue={editing?.minMonthlyBoxes ?? 0}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">説明</label>
              <input
                name="description"
                defaultValue={editing?.description ?? ""}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <div className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {saving ? "保存中..." : "保存"}
              </button>
              <button type="button" onClick={() => { setEditing(null); setShowForm(false); setError(""); }} className="text-slate-600 px-4 py-2 text-sm">キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* Ranks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-4 py-16 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : (
          ranks.map((rank, idx) => {
            const colors = [
              "from-slate-100 to-slate-50 border-slate-200",
              "from-yellow-50 to-amber-50 border-amber-200",
              "from-yellow-100 to-yellow-50 border-yellow-300",
              "from-blue-50 to-indigo-50 border-blue-200",
            ];
            return (
              <div key={rank.id} className={`rounded-xl border bg-gradient-to-b p-5 ${colors[idx % colors.length]}`}>
                <div className="font-bold text-slate-900 text-lg mb-1">{rank.name}</div>
                <div className="text-3xl font-bold text-blue-700 mb-1">{Math.round(rank.rate * 100)}%</div>
                <div className="text-xs text-slate-500 mb-2">掛け率</div>
                {rank.minMonthlyBoxes > 0 && (
                  <div className="text-xs text-slate-600 bg-white/70 rounded px-2 py-1 mb-3">
                    月{rank.minMonthlyBoxes}箱以上
                  </div>
                )}
                {rank.description && (
                  <div className="text-xs text-slate-500 mb-3">{rank.description}</div>
                )}
                <button
                  onClick={() => { setEditing(rank); setShowForm(false); setError(""); setMessage(null); }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  編集
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
