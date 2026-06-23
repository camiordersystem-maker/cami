"use client";

import { useState, useEffect } from "react";

type Terms = {
  id: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  version: number;
  updatedAt: string;
  updatedBy: string;
};

export default function AdminTermsPage() {
  const [terms, setTerms] = useState<Terms | null>(null);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/terms");
    if (res.ok) {
      const data = await res.json();
      setTerms(data);
      setContent(data?.content ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveDraft() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/terms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ text: "下書きを保存しました", ok: true });
      load();
    } else {
      setMessage({ text: "保存に失敗しました", ok: false });
    }
  }

  async function publish() {
    if (!content.trim()) {
      setMessage({ text: "内容を入力してください", ok: false });
      return;
    }
    if (!confirm("約款を公開しますか？会員が閲覧できるようになります。")) return;
    setPublishing(true);
    setMessage(null);

    // 保存してから公開（レコードが未作成でも対応）
    const putRes = await fetch("/api/admin/terms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!putRes.ok) {
      setPublishing(false);
      setMessage({ text: "保存に失敗しました", ok: false });
      return;
    }

    const res = await fetch("/api/admin/terms", { method: "PATCH" });
    setPublishing(false);
    if (res.ok) {
      setMessage({ text: "公開しました", ok: true });
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage({ text: d.error ?? "公開に失敗しました", ok: false });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">約款管理</h1>
          <p className="text-slate-500 text-sm mt-1">契約書・利用約款の編集・公開</p>
        </div>
        {terms?.isPublished ? (
          <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-medium">
            公開中
          </span>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-medium">
            {terms ? "下書き" : "未作成"}
          </span>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            message.ok
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            約款・契約書の内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={28}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="利用規約・契約書の内容を入力してください..."
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={saveDraft}
            disabled={saving}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? "保存中..." : "下書き保存"}
          </button>
          <button
            onClick={publish}
            disabled={publishing || !content.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {publishing ? "公開中..." : "公開する"}
          </button>
          {terms?.updatedAt && (
            <span className="text-xs text-slate-400 ml-auto">
              最終更新: {new Date(terms.updatedAt.replace(" ", "T")).toLocaleString("ja-JP")}
              {terms.isPublished && terms.publishedAt && (
                <> ／ 公開日: {new Date(terms.publishedAt.replace(" ", "T")).toLocaleString("ja-JP")}</>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
