"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate, PAYMENT_STATUS_LABEL } from "@/lib/utils";
import { apiData, apiErrorMessage } from "@/lib/client-api";

type SystemSettings = {
  companyName: string;
  invoiceRegistrationNo: string;
};

type OrderItem = {
  id: string;
  productName: string;
  boxes: number;
  unitPricePerBox: number;
  subtotal: number;
};

type Order = {
  id: string;
  orderNo: string;
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
  issuedAt: string;
  member: { companyName: string; contactName: string } | null;
  orders: Order[];
};

export default function MemberInvoiceDetailPage() {
  const { id } = useParams() as { id: string };
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [invoiceRes, settingsRes] = await Promise.all([
        fetch(`/api/invoices/${id}`),
        fetch("/api/settings"),
      ]);
      const invoiceJson = await invoiceRes.json().catch(() => null);
      if (invoiceRes.ok) {
        setInvoice(apiData<InvoiceDetail>(invoiceJson));
      } else {
        setError(apiErrorMessage(invoiceJson, "請求書の取得に失敗しました"));
      }
      if (settingsRes.ok) setSettings(await settingsRes.json());
      setLoading(false);
    }
    void load();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">読み込み中...</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!invoice) return <div className="text-center py-20 text-slate-400">請求書が見つかりません</div>;

  const registrationNo = settings?.invoiceRegistrationNo || "T0000000000000";

  return (
    <div>
      <div className="mb-6 flex items-center justify-end no-print">
        <button onClick={() => window.print()} className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">
          印刷 / PDF保存
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <div className="flex justify-between items-start mb-10">
          <div>
            <div className="text-3xl font-bold text-slate-900">請 求 書</div>
            <div className="text-slate-500 text-sm mt-1">{invoice.year}年{invoice.month}月分</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg text-slate-900">{settings?.companyName || "Cami"}</div>
            <div className="text-sm text-slate-600 mt-1">登録番号：{registrationNo}</div>
            <div className="text-sm text-slate-600 mt-0.5">発行日：{formatDate(invoice.issuedAt)}</div>
            {invoice.paymentDueDate && (
              <div className="text-sm text-slate-600 mt-0.5">支払期限：{formatDate(invoice.paymentDueDate)}</div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="font-semibold text-slate-900 mb-2 text-sm">請求先</div>
          <div className="text-slate-800">
            <div className="text-lg font-bold">{invoice.member?.companyName} 御中</div>
            {invoice.member?.contactName && <div className="text-sm text-slate-600 mt-1">{invoice.member.contactName} 様</div>}
          </div>
        </div>

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
