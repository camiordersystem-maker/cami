"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from "@/lib/utils";

type OrderDetail = {
  id: string;
  orderNo: string;
  status: string;
  subtotal: number;
  taxRate: string | number;
  taxAmount: number;
  total: number;
  paymentStatus: string;
  trackingNumber: string | null;
  cancelReason: string | null;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    productName: string;
    boxes: number;
    bottlesPerBox: number;
    unitPricePerBox: number;
    rateApplied: string | number;
    subtotal: number;
  }[];
};

type Address = {
  label: string;
  recipientName: string;
  postalCode: string;
  prefecture: string;
  address1: string;
  address2?: string | null;
  phone: string;
};

const STATUS_STEPS = [
  { key: "pending", label: "注文受付" },
  { key: "confirmed", label: "確認済み" },
  { key: "shipped", label: "発送済み" },
  { key: "delivered", label: "配達完了" },
];

export default function MemberOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function load() {
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setOrder(data);
    setAddress(data.address ?? null);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleCancelRequest() {
    if (!confirm("キャンセルを申し込みますか？本部の承認後にキャンセルが確定します。")) return;
    setCancelling(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${id}/cancel-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason: cancelReason || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      setCancelling(false);
      if (res.ok) {
        setMessage({ text: "キャンセルを申し込みました。本部の審査をお待ちください。", ok: true });
        setShowCancelForm(false);
        load();
      } else {
        setMessage({ text: (data as { error?: string }).error ?? "申込に失敗しました", ok: false });
      }
    } catch {
      setCancelling(false);
      setMessage({ text: "ネットワークエラーが発生しました", ok: false });
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-slate-400 text-sm">読み込み中...</div></div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-slate-400">注文が見つかりません</div>;
  }

  const statusIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";
  const isCancelRequested = order.status === "cancel_requested";
  const canRequestCancel = order.status === "pending" || order.status === "confirmed";
  const taxRate = typeof order.taxRate === "string" ? parseFloat(order.taxRate) : (order.taxRate ?? 0);
  const taxRatePercent = Math.round(taxRate * 100);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/orders" className="text-slate-500 hover:text-slate-700 text-sm">
          ← 注文履歴
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{order.orderNo}</span>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${message.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Shipping notification */}
      {order.status === "shipped" && (
        <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-800">
          ご注文の商品を発送しました。お手元に届くまでしばらくお待ちください。
          {order.trackingNumber && (
            <span className="block mt-1 font-medium">追跡番号：{order.trackingNumber}</span>
          )}
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.orderNo}</h1>
          <p className="text-slate-500 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
          {(order.status === "confirmed" || order.status === "shipped" || order.status === "delivered") && (
            <Link href={`/orders/${order.id}/invoice`} className="text-sm text-blue-600 hover:underline font-medium">
              請求書を見る
            </Link>
          )}
          {canRequestCancel && !isCancelRequested && (
            <button
              onClick={() => setShowCancelForm(!showCancelForm)}
              className="text-sm text-red-600 hover:underline"
            >
              キャンセルを申し込む
            </button>
          )}
          {isCancelRequested && (
            <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-red-100 text-red-800">
              キャンセル申込済み（審査中）
            </span>
          )}
        </div>
      </div>

      {/* Cancel form */}
      {showCancelForm && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-800 font-semibold mb-3">キャンセル申込の確認</p>
          <p className="text-sm text-red-700 mb-3">
            本部の承認後にキャンセルが確定します。承認まで注文は「キャンセル申込中」の状態になります。
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="キャンセル理由（任意）"
            rows={2}
            className="w-full text-sm border border-red-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-red-400 bg-white resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCancelRequest}
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {cancelling ? "処理中..." : "キャンセルを申し込む"}
            </button>
            <button
              onClick={() => setShowCancelForm(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
            >
              戻る
            </button>
          </div>
        </div>
      )}

      {/* Cancel requested notice */}
      {isCancelRequested && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
          キャンセル申込中です。本部の審査結果をお待ちください。承認されると在庫が戻されます。
          {order.cancelReason && (
            <div className="mt-1 text-red-700">申込理由：{order.cancelReason}</div>
          )}
        </div>
      )}

      {/* Cancel reason display */}
      {isCancelled && order.cancelReason && (
        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
          <span className="font-medium">キャンセル理由：</span>{order.cancelReason}
        </div>
      )}

      {/* Status Progress */}
      {!isCancelled && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-5 text-sm">注文ステータス</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx <= statusIndex ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"}`}>
                    {idx < statusIndex ? "✓" : idx + 1}
                  </div>
                  <div className={`text-xs mt-1.5 font-medium ${idx <= statusIndex ? "text-blue-600" : "text-slate-400"}`}>
                    {step.label}
                  </div>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${idx < statusIndex ? "bg-blue-600" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
          {order.trackingNumber && (
            <div className="mt-4 bg-slate-50 rounded-lg px-4 py-3 text-sm">
              <span className="text-slate-500">追跡番号：</span>
              <span className="font-medium text-slate-900 ml-2">{order.trackingNumber}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">注文商品</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm text-slate-900">{item.productName}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.boxes} 箱 × {item.bottlesPerBox} 本/箱</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        掛け率 {Math.round(Number(item.rateApplied) * 100)}%　単価 {formatCurrency(item.unitPricePerBox)}/箱
                      </div>
                    </div>
                    <div className="font-semibold text-sm text-slate-900">{formatCurrency(item.subtotal)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Memo */}
          {order.memo && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">備考・メモ</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.memo}</p>
            </div>
          )}
        </div>

        {/* Side Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">金額</h3>
            <div className="text-sm text-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">税抜小計</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">消費税（{taxRatePercent}%）</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t border-slate-100 pt-2">
                <span>税込合計</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-500">支払い状況</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${PAYMENT_STATUS_COLOR[order.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                  {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              請求書発行後、銀行振込にてお支払いください
            </div>
          </div>

          {address && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">配送先</h3>
              <div className="text-sm text-slate-700 space-y-1">
                <div className="font-medium">{address.label}</div>
                <div>{address.recipientName}</div>
                <div>〒{address.postalCode}</div>
                <div>{address.prefecture}{address.address1}</div>
                {address.address2 && <div>{address.address2}</div>}
                <div className="text-slate-500">{address.phone}</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">注文日時</h3>
            <div className="text-sm text-slate-700">{formatDateTime(order.createdAt)}</div>
            {order.updatedAt !== order.createdAt && (
              <div className="text-xs text-slate-400 mt-1">更新: {formatDateTime(order.updatedAt)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
