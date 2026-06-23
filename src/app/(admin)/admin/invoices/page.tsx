"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from "@/lib/utils";

type Invoice = {
  id: string;
  invoiceNo: string;
  year: number;
  month: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentStatus: string;
  paymentDueDate: string | null;
  issuedAt: string;
  companyName: string | null;
  memberId: string;
};

type Member = { id: string; companyName: string };

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [form, setForm] = useState({ memberId: "", year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  async function load() {
    const [invRes, memRes] = await Promise.all([
      fetch("/api/admin/invoices"),
      fetch("/api/admin/members"),
    ]);
    if (invRes.ok) setInvoices(await invRes.json());
    if (memRes.ok) {
      const data = await memRes.json();
      setMembers(data.filter((m: { status: string }) => m.status === "approved"));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberId) { setMessage({ text: "会員を選択してください", ok: false }); return; }
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      setGenerating(false);
      if (res.ok) {
        setMessage({ text: "請求書を発行しました", ok: true });
        load();
      } else {
        setMessage({ text: (data as { error?: string }).error ?? "エラーが発生しました", ok: false });
      }
    } catch {
      setGenerating(false);
      setMessage({ text: "ネットワークエラーが発生しました", ok: false });
    }
  }

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">請求書管理</h1>
        <p className="text-slate-500 text-sm mt-1">月次まとめ請求書の発行・管理</p>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Generate form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">月次請求書の発行</h2>
        <form onSubmit={generate} className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">会員</label>
            <select
              value={form.memberId}
              onChange={(e) => setForm((f) => ({ ...f, memberId: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48"
              required
            >
              <option value="">会員を選択</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.companyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">年</label>
            <select
              value={form.year}
              onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => <option key={y} value={y}>{y}年</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">月</label>
            <select
              value={form.month}
              onChange={(e) => setForm((f) => ({ ...f, month: parseInt(e.target.value) }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={generating}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {generating ? "発行中..." : "請求書を発行する"}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3">
          ※ 対象月の確認済み・発送済み・配達完了の注文をまとめて請求書を発行します。支払期限は翌月末です。
        </p>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">発行済み請求書</h2>
          <span className="text-sm text-slate-500">{invoices.length} 件</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">請求書がありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 font-medium text-slate-600">請求書番号</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">会員</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">対象月</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">税込合計</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">支払い期限</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">状況</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">発行日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                        {inv.invoiceNo}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{inv.companyName ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-700">{inv.year}年{inv.month}月</td>
                    <td className="px-4 py-4 text-right font-medium text-slate-900">{formatCurrency(inv.total)}</td>
                    <td className="px-4 py-4 text-slate-600">{inv.paymentDueDate ? formatDate(inv.paymentDueDate) : "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${PAYMENT_STATUS_COLOR[inv.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                        {PAYMENT_STATUS_LABEL[inv.paymentStatus] ?? inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(inv.issuedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
