"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

type Announcement = {
  id: string;
  title: string;
  body: string;
  type: string;
  targetMemberId: string | null;
  targetMemberName: string | null;
  createdAt: string;
  expiresAt: string | null;
};

type Member = { id: string; companyName: string };

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    title: "",
    body: "",
    type: "all" as "all" | "individual",
    targetMemberId: "",
    expiresAt: "",
  });

  async function load() {
    const [a, m] = await Promise.all([
      fetch("/api/admin/announcements").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/members").then((r) => (r.ok ? r.json() : [])),
    ]);
    setAnnouncements(a);
    setMembers(m.map((mb: { id: string; companyName: string }) => ({ id: mb.id, companyName: mb.companyName })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        body: form.body,
        type: form.type,
        targetMemberId: form.type === "individual" ? form.targetMemberId : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (res.ok) {
      setMessage({ text: "お知らせを作成しました", ok: true });
      setForm({ title: "", body: "", type: "all", targetMemberId: "", expiresAt: "" });
      load();
    } else {
      setMessage({ text: (data as { error?: string }).error ?? "作成に失敗しました", ok: false });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このお知らせを削除しますか？")) return;
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) { setMessage({ text: "削除しました", ok: true }); load(); }
    else setMessage({ text: "削除に失敗しました", ok: false });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">お知らせ管理</h1>
        <p className="text-slate-500 text-sm mt-1">全体・個別お知らせの作成・削除</p>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Create Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4 text-sm">新規お知らせ作成</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">タイトル <span className="text-red-500">*</span></label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例：年末年始の営業について"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">本文 <span className="text-red-500">*</span></label>
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={4}
              placeholder="お知らせの内容を入力してください"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">種別</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "all" | "individual" })}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全体向け</option>
                <option value="individual">個別（特定店舗）</option>
              </select>
            </div>
            {form.type === "individual" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">対象店舗 <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.targetMemberId}
                  onChange={(e) => setForm({ ...form, targetMemberId: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">店舗を選択</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.companyName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">有効期限（任意）</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {creating ? "作成中..." : "お知らせを作成"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">お知らせ一覧</h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">お知らせはありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {announcements.map((a) => (
              <div key={a.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.type === "all" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {a.type === "all" ? "全体" : `個別: ${a.targetMemberName ?? a.targetMemberId}`}
                    </span>
                    {a.expiresAt && (
                      <span className="text-xs text-slate-400">期限: {formatDate(a.expiresAt)}</span>
                    )}
                  </div>
                  <div className="font-medium text-sm text-slate-900">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.body}</div>
                  <div className="text-xs text-slate-400 mt-1">{formatDate(a.createdAt)}</div>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0 px-2 py-1 rounded hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
