"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from "@/lib/utils";

type SystemSettings = {
  companyName: string;
  invoiceRegistrationNo: string;
};

type OrderItem = {
  id: string;
  productName: string;
  boxes: number;
  bottlesPerBox: number;
  unitPricePerBox: number;
  subtotal: number;
};

type Order = {
  id: string;
  orderNo: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type InvoiceDetail = {
  id: string;
  invoiceNo: string;
  year: number;
  month: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentStatus: string;
  paymentDueDate: string | null;
  note: string | null;
  issuedAt: string;
  member: {
    companyName: string;
    contactName: string;
    email: string;
    address: string;
    phone: string;
  } | null;
  orders: Order[];
};

export default function AdminInvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const [invoiceRes, settingsRes] = await Promise.all([
      fetch(`/api/admin/invoices/${params.id}`),
      fetch("/api/admin/settings"),
    ]);
    if (invoiceRes.ok) setInvoice(await invoiceRes.json());
    if (settingsRes.ok) setSettings(await settingsRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function updatePaymentStatus(status: string) {
    setUpdating(true);
    setMessage(null);
    const res = await fetch(`/api/admin/invoices/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: status }),
    });
    setUpdating(false);
    if (res.ok) {
      setMessage({ text: "支払い状況を更新しました", ok: true });
      load();
    } else {
      const d = await res.json().catch(() => ({}));
      setMessage({ text: (d as { error?: string }).error ?? "エラーが発生しました", ok: false });
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">読み込み中...</div>;
  if (!invoice) return <div className="text-center py-20 text-slate-400">請求書が見つかりません</div>;

  const registrationNo = settings?.invoiceRegistrationNo || "T0000000000000";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/invoices" className="text-slate-500 hover:text-slate-700 text-sm">← 請求書一覧</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{invoice.invoiceNo}</span>
        <div className="ml-auto">
          <button onClick={() => window.print()} className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
            印刷 / PDF保存
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border no-print ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Payment Status Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 no-print">
        <h2 className="font-semibold text-slate-900 mb-3 text-sm">支払い状況</h2>
        <div className="flex flex-wrap gap-3">
          {(["unpaid", "paid", "overdue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => updatePaymentStatus(s)}
              disabled={updating || invoice.paymentStatus === s}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                invoice.paymentStatus === s
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {PAYMENT_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Print Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-3xl font-bold text-slate-900">請 求 書</div>
            <div className="text-slate-500 text-sm mt-1">{invoice.year}年{invoice.month}月分</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-slate-900">{settings?.companyName || "Cami"}</div>
            <div className="text-sm text-slate-600 mt-1">
              登録番号：{registrationNo}
            </div>
            <div className="text-sm text-slate-600 mt-0.5">
              発行日：{formatDate(invoice.issuedAt)}
            </div>
            {invoice.paymentDueDate && (
              <div className="text-sm text-slate-600 mt-0.5">
                支払期限：{formatDate(invoice.paymentDueDate)}
              </div>
            )}
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <div className="font-semibold text-slate-900 mb-2 text-sm">請求先</div>
          <div className="text-slate-800">
            <div className="text-lg font-bold">{invoice.member?.companyName} 御中</div>
            <div className="text-sm text-slate-600 mt-1">{invoice.member?.contactName} 様</div>
          </div>
        </div>

        {/* Invoice No */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">請求書番号</div>
            <div className="font-semibold text-slate-900">{invoice.invoiceNo}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-slate-500 text-xs mb-1">請求対象期間</div>
            <div className="font-semibold text-slate-900">{invoice.year}年{invoice.month}月1日 〜 {invoice.year}年{invoice.month}月末日</div>
          </div>
        </div>

        {/* Orders breakdown */}
        {invoice.orders.map((order) => (
          <div key={order.id} className="mb-6">
            <div className="font-medium text-slate-700 text-sm mb-2 pb-1 border-b border-slate-200">
              注文番号：{order.orderNo}　（{formatDate(order.createdAt)}）
            </div>
            <table className="w-full text-sm mb-2">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-1.5 font-medium text-slate-600">商品名</th>
                  <th className="text-center py-1.5 font-medium text-slate-600">数量</th>
                  <th className="text-right py-1.5 font-medium text-slate-600">単価</th>
                  <th className="text-right py-1.5 font-medium text-slate-600">税抜小計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-slate-800">{item.productName}</td>
                    <td className="py-2 text-center text-slate-800">{item.boxes}箱</td>
                    <td className="py-2 text-right text-slate-800">{formatCurrency(item.unitPricePerBox)}</td>
                    <td className="py-2 text-right text-slate-900">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {/* Totals */}
        <div className="border-t-2 border-slate-900 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>税抜合計</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>消費税（10%）</span>
            <span>{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-3 mt-2">
            <span>税込合計金額</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.note && (
          <div className="mt-6 bg-slate-50 rounded-lg px-4 py-3 text-sm">
            <div className="font-medium text-slate-900 mb-1">備考</div>
            <div className="text-slate-700 whitespace-pre-wrap">{invoice.note}</div>
          </div>
        )}

        {/* Payment Status Badge */}
        <div className="mt-6 flex justify-end">
          <span className={`text-sm font-semibold px-4 py-2 rounded-full border-2 ${
            invoice.paymentStatus === "paid"
              ? "border-green-500 text-green-700"
              : invoice.paymentStatus === "overdue"
              ? "border-red-500 text-red-700"
              : "border-amber-400 text-amber-700"
          }`}>
            {PAYMENT_STATUS_LABEL[invoice.paymentStatus] ?? invoice.paymentStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
