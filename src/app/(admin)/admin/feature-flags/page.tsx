"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiData, apiErrorMessage } from "@/lib/client-api";

type FeatureFlag = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

export default function AdminFeatureFlagsPage() {
  const { data: session, status } = useSession();
  const myAdminRole = (session?.user as { adminRole?: string })?.adminRole;

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/feature-flags");
    const json = await res.json().catch(() => null);
    if (res.ok) {
      setFlags(apiData<FeatureFlag[]>(json));
    } else {
      setMessage({ text: apiErrorMessage(json, "取得に失敗しました"), ok: false });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggle(key: string, next: boolean) {
    setSavingKey(key);
    setMessage(null);
    const res = await fetch("/api/admin/feature-flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled: next }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok) {
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: next } : f)));
      setMessage({ text: "更新しました", ok: true });
    } else {
      setMessage({ text: apiErrorMessage(json, "更新に失敗しました"), ok: false });
    }
    setSavingKey(null);
  }

  if (status === "loading") {
    return <div className="p-8 text-slate-500">読み込み中...</div>;
  }

  if (myAdminRole !== "superadmin") {
    return (
      <div className="py-20 text-center text-slate-500">
        この画面はスーパー管理者のみアクセスできます
      </div>
    );
  }

  if (loading) return <div className="p-8 text-slate-500">読み込み中...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-900 mb-1">機能フラグ</h1>
      <p className="text-sm text-slate-500 mb-6">
        ここでONにした機能だけが会員・管理画面に表示されます。オフのままなら既存の画面・動作は一切変わりません。
      </p>

      {message && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {flags.map((flag) => (
          <div key={flag.key} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-medium text-slate-900">{flag.label}</div>
              <div className="text-sm text-slate-500 mt-0.5">{flag.description}</div>
            </div>
            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={flag.enabled}
                disabled={savingKey === flag.key}
                onChange={(e) => toggle(flag.key, e.target.checked)}
                className="w-5 h-5 rounded accent-blue-600"
              />
              <span className="text-sm text-slate-600 w-10">{flag.enabled ? "ON" : "OFF"}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
