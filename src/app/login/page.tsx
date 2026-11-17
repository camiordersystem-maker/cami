"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submitting = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setError("");
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });

    if (!res || res.error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      return;
    }

    // Redirect based on role via root page
    router.push("/");
    router.refresh();
    } catch {
      setError("通信に失敗しました。接続を確認して、もう一度ログインしてください。");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/cami-logo.png" alt="Cami" width={140} height={56} className="object-contain h-auto" priority />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">受発注システム</h1>
          <p className="text-slate-500 text-sm mt-1">ログイン</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} aria-busy={loading} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                メールアドレス
              </label>
              <input
                name="email"
                id="login-email"
                type="email"
                required
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                aria-describedby={error ? "login-error" : undefined}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="example@company.co.jp"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                パスワード
              </label>
              <input
                name="password"
                id="login-password"
                type={showPassword ? "text" : "password"}
                aria-describedby={error ? "login-error" : undefined}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="パスワードを入力"
              />
            </div>

            <label className="flex min-h-11 items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="h-4 w-4" />
              パスワードを表示
            </label>

            {error && (
              <div ref={errorRef} id="login-error" role="alert" tabIndex={-1} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              新規登録申請
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2024 Cami All rights reserved.
        </p>
      </div>
    </div>
  );
}
