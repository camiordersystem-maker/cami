"use client";

import { useState } from "react";

export function TermsConsentButton({ agreed }: { agreed: boolean }) {
  const [done, setDone] = useState(agreed);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function agree() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/terms/consent", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setMessage(json?.error?.message ?? "同意の保存に失敗しました");
        return;
      }
      setDone(true);
      setMessage("同意しました");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">この約款に同意済みです</div>;
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <button
        type="button"
        onClick={agree}
        disabled={saving}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "保存中..." : "約款に同意する"}
      </button>
      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </div>
  );
}
