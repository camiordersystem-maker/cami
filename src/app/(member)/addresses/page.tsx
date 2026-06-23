"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Address = {
  id: string;
  label: string;
  recipientName: string;
  postalCode: string;
  prefecture: string;
  address1: string;
  address2?: string | null;
  phone: string;
  isDefault: boolean;
};

export default function AddressesPage() {
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/addresses");
    if (res.ok) setAddresses(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      label: fd.get("label"),
      recipientName: fd.get("recipientName"),
      postalCode: fd.get("postalCode"),
      prefecture: fd.get("prefecture"),
      address1: fd.get("address1"),
      address2: fd.get("address2") || null,
      phone: fd.get("phone"),
      isDefault: fd.get("isDefault") === "on",
    };
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "エラーが発生しました");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("この配送先を削除しますか？")) return;
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    load();
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/addresses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">配送先管理</h1>
          <p className="text-slate-500 text-sm mt-1">注文時の配送先を管理します</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + 配送先を追加
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">新規配送先</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {[
              { name: "label", label: "ラベル（例：本店）", required: true, colSpan: 1 },
              { name: "recipientName", label: "受取人名", required: true, colSpan: 1 },
              { name: "postalCode", label: "郵便番号", required: true, colSpan: 1, placeholder: "150-0001" },
              { name: "prefecture", label: "都道府県", required: true, colSpan: 1, placeholder: "東京都" },
              { name: "address1", label: "住所1", required: true, colSpan: 2 },
              { name: "address2", label: "住所2（建物名等）", required: false, colSpan: 2 },
              { name: "phone", label: "電話番号", required: true, colSpan: 1, placeholder: "03-1234-5678" },
            ].map((f) => (
              <div key={f.name} className={f.colSpan === 2 ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  name={f.name}
                  required={f.required}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" name="isDefault" id="isDefault" className="rounded" />
              <label htmlFor="isDefault" className="text-sm text-slate-700">デフォルトの配送先に設定する</label>
            </div>
            {error && (
              <div className="col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
            )}
            <div className="col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存する"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-600 hover:text-slate-800 px-4 py-2 text-sm"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {loading ? (
        <div className="text-slate-400 text-sm py-10 text-center">読み込み中...</div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <div className="text-slate-500 text-sm">配送先がまだ登録されていません</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-xl border p-5 ${
                addr.isDefault ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      デフォルト
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-slate-700 space-y-0.5">
                <div className="font-medium">{addr.recipientName}</div>
                <div>〒{addr.postalCode}</div>
                <div>{addr.prefecture}{addr.address1}</div>
                {addr.address2 && <div>{addr.address2}</div>}
                <div className="text-slate-500">{addr.phone}</div>
              </div>
              <div className="mt-4 flex gap-3">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    デフォルトに設定
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
