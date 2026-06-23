"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function AccountPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ text: "新しいパスワードと確認用パスワードが一致しません", ok: false });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/member/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSaving(false);
      if (res.ok) {
        setMessage({ text: "パスワードを変更しました", ok: true });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setMessage({ text: (data as { error?: string }).error ?? "エラーが発生しました", ok: false });
      }
    } catch {
      setSaving(false);
      setMessage({ text: "ネットワークエラーが発生しました。再度お試しください。", ok: false });
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">アカウント設定</h1>
        <p className="text-slate-500 text-sm mt-1">ログイン情報を管理します</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 max-w-lg">
        <h2 className="font-semibold text-slate-900 mb-4">ログイン情報</h2>
        <div className="space-y-2 text-sm">
          <div className="flex gap-4">
            <span className="text-slate-500 w-24 shrink-0">会社名</span>
            <span className="text-slate-900 font-medium">{session?.user?.name}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-slate-500 w-24 shrink-0">メールアドレス</span>
            <span className="text-slate-900">{session?.user?.email}</span>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-lg">
        <h2 className="font-semibold text-slate-900 mb-4">パスワード変更</h2>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              現在のパスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              新しいパスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
              placeholder="8文字以上"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              新しいパスワード（確認） <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? "変更中..." : "パスワードを変更する"}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
          パスワードを忘れた場合は本部（{process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "info@cami.co.jp"}）へお問い合わせください。
        </div>
      </div>
    </div>
  );
}
