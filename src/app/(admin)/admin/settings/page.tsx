"use client";

import { useState, useEffect } from "react";

type Settings = {
  id: string;
  companyName: string;
  companyPostalCode: string;
  companyAddress: string;
  companyTel: string;
  companyEmail: string;
  invoiceRegistrationNo: string;
  supportEmail: string;
  lowStockThreshold: number;
  updatedAt: string | null;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    companyPostalCode: "",
    companyAddress: "",
    companyTel: "",
    companyEmail: "",
    invoiceRegistrationNo: "",
    supportEmail: "",
    lowStockThreshold: 10,
  });

  async function load() {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      if (data) {
        setSettings(data);
        setForm({
          companyName: data.companyName ?? "",
          companyPostalCode: data.companyPostalCode ?? "",
          companyAddress: data.companyAddress ?? "",
          companyTel: data.companyTel ?? "",
          companyEmail: data.companyEmail ?? "",
          invoiceRegistrationNo: data.invoiceRegistrationNo ?? "",
          supportEmail: data.supportEmail ?? "",
          lowStockThreshold: data.lowStockThreshold ?? 10,
        });
      }
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ text: "設定を保存しました", ok: true });
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage({ text: (d as { error?: string }).error ?? "保存に失敗しました", ok: false });
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">読み込み中...</div>;
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelCls = "block text-xs font-medium text-slate-700 mb-1";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">システム設定</h1>
        <p className="text-slate-500 text-sm mt-1">請求書・納品書に表示される会社情報や各種設定</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 会社情報 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">会社情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>会社名 <span className="text-red-500">*</span></label>
              <input
                value={form.companyName}
                onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                className={inputCls}
                placeholder="Cami株式会社"
              />
            </div>
            <div>
              <label className={labelCls}>郵便番号</label>
              <input
                value={form.companyPostalCode}
                onChange={e => setForm(p => ({ ...p, companyPostalCode: e.target.value }))}
                className={inputCls}
                placeholder="000-0000"
              />
            </div>
            <div>
              <label className={labelCls}>電話番号</label>
              <input
                value={form.companyTel}
                onChange={e => setForm(p => ({ ...p, companyTel: e.target.value }))}
                className={inputCls}
                placeholder="03-0000-0000"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>住所</label>
              <input
                value={form.companyAddress}
                onChange={e => setForm(p => ({ ...p, companyAddress: e.target.value }))}
                className={inputCls}
                placeholder="東京都○○区○○1-2-3"
              />
            </div>
            <div>
              <label className={labelCls}>会社メールアドレス</label>
              <input
                type="email"
                value={form.companyEmail}
                onChange={e => setForm(p => ({ ...p, companyEmail: e.target.value }))}
                className={inputCls}
                placeholder="info@example.com"
              />
            </div>
            <div>
              <label className={labelCls}>サポート連絡先メール <span className="text-xs text-slate-400">（店舗向け案内に表示）</span></label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={e => setForm(p => ({ ...p, supportEmail: e.target.value }))}
                className={inputCls}
                placeholder="support@example.com"
              />
            </div>
          </div>
        </div>

        {/* インボイス設定 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-1">インボイス制度（適格請求書）</h2>
          <p className="text-xs text-slate-500 mb-4">登録番号は請求書・納品書に印字されます</p>
          <div className="max-w-sm">
            <label className={labelCls}>適格請求書発行事業者登録番号（T番号）</label>
            <input
              value={form.invoiceRegistrationNo}
              onChange={e => setForm(p => ({ ...p, invoiceRegistrationNo: e.target.value }))}
              className={inputCls}
              placeholder="T1234567890123"
            />
          </div>
        </div>

        {/* 在庫設定 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">在庫アラート設定</h2>
          <div className="max-w-xs">
            <label className={labelCls}>低在庫アラート閾値（箱数）</label>
            <input
              type="number"
              min={0}
              max={9999}
              value={form.lowStockThreshold}
              onChange={e => setForm(p => ({ ...p, lowStockThreshold: parseInt(e.target.value) || 0 }))}
              className={inputCls}
            />
            <p className="text-xs text-slate-400 mt-1.5">在庫がこの箱数以下になったときに本部へメール通知します</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "保存中..." : "設定を保存する"}
          </button>
          {settings?.updatedAt && (
            <span className="text-xs text-slate-400">
              最終更新: {new Date(settings.updatedAt).toLocaleString("ja-JP")}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
