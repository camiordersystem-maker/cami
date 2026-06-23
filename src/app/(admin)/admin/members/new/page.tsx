"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Rank = { id: string; name: string; rate: number };

export default function AdminNewMemberPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    businessDescription: "",
    rankId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ memberId: string; email: string; password: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/ranks")
      .then((r) => r.json())
      .then((data: Rank[]) => {
        setRanks(data);
        if (data.length > 0) setForm((f) => ({ ...f, rankId: data[0].id }));
      })
      .catch(() => {});
  }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "エラーが発生しました");
        return;
      }
      setCreated({ memberId: (data as { memberId: string }).memberId, email: form.email, password: form.password });
    } catch {
      setSubmitting(false);
      setError("ネットワークエラーが発生しました。再度お試しください。");
    }
  }

  if (created) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">店舗登録完了</h1>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
          <div className="text-green-700 font-semibold mb-4">店舗アカウントを作成しました</div>
          <div className="space-y-3 mb-6">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">ログインID（メールアドレス）</div>
              <div className="font-mono text-sm bg-slate-100 rounded-lg px-3 py-2 select-all">{created.email}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-0.5">初期パスワード</div>
              <div className="font-mono text-sm bg-slate-100 rounded-lg px-3 py-2 select-all">{created.password}</div>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            上記のログイン情報を店舗担当者へお伝えください。
          </p>
          <div className="flex gap-3">
            <Link
              href={`/admin/members/${created.memberId}`}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
            >
              店舗詳細を見る
            </Link>
            <Link
              href="/admin/members"
              className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              会員一覧へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/members" className="text-slate-500 hover:text-slate-700 text-sm">
          ← 会員一覧
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">新規店舗登録</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">新規店舗登録</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              店舗名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：ヘアサロン○○"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              担当者名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.contactName}
              onChange={(e) => update("contactName", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：田中 花子"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：salon@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              初期パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="8文字以上"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例：03-1234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ランク</label>
            <select
              value={form.rankId}
              onChange={(e) => update("rankId", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}（掛け率 {Math.round(r.rate * 100)}%）
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            住所 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：東京都渋谷区○○1-2-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            事業概要（任意）
          </label>
          <textarea
            value={form.businessDescription}
            onChange={(e) => update("businessDescription", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="例：ヘアサロン（席数10席）"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? "登録中..." : "店舗アカウントを作成する"}
          </button>
        </div>
      </form>
    </div>
  );
}
