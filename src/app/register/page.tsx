"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      email: fd.get("email"),
      password: fd.get("password"),
      companyName: fd.get("companyName"),
      contactName: fd.get("contactName"),
      phone: fd.get("phone"),
      address: fd.get("address"),
      businessDescription: fd.get("businessDescription"),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10">
            <h2 className="text-xl font-bold text-slate-900 mb-2">申請を受け付けました</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              審査完了後、登録メールアドレスにご連絡いたします。<br />
              通常2〜3営業日以内にご返答します。
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-blue-600 hover:underline text-sm"
            >
              ログインページへ戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">新規会員登録申請</h1>
          <p className="text-slate-500 text-sm mt-1">Cami 受発注システム</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  会社名 / サロン名 <span className="text-red-500">*</span>
                </label>
                <input
                  name="companyName"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="株式会社○○ / ○○サロン"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  担当者名 <span className="text-red-500">*</span>
                </label>
                <input
                  name="contactName"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="山田 太郎"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="example@salon.co.jp"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  name="phone"
                  type="tel"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="03-1234-5678"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  住所 <span className="text-red-500">*</span>
                </label>
                <input
                  name="address"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="東京都渋谷区○○1-2-3"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  事業概要
                </label>
                <textarea
                  name="businessDescription"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="ヘアサロン（席数10席）など"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  パスワード <span className="text-red-500">*</span>
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="8文字以上"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? "送信中..." : "登録申請する"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            既にアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              ログイン
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
