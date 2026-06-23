"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";

type OrderDetail = {
  id: string;
  orderNo: string;
  status: string;
  total: number;
  subtotal: number;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  member: { companyName: string; email: string; contactName: string } | null;
  address: { label: string; recipientName: string; postalCode: string; prefecture: string; address1: string; address2?: string | null; phone: string } | null;
  items: { id: string; productName: string; boxes: number; bottlesPerBox: number; unitPricePerBox: number; rateApplied: number; subtotal: number }[];
};

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  pending: [
    { label: "注文を確認する", next: "confirmed", color: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "キャンセル", next: "cancelled", color: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200" },
  ],
  confirmed: [
    { label: "発送済みにする", next: "shipped", color: "bg-purple-600 hover:bg-purple-700 text-white" },
    { label: "キャンセル", next: "cancelled", color: "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200" },
  ],
  shipped: [
    { label: "配達完了にする", next: "delivered", color: "bg-green-600 hover:bg-green-700 text-white" },
  ],
  delivered: [],
  cancelled: [],
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/orders/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data);
      setTrackingInput(data.trackingNumber ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function updateStatus(nextStatus: string) {
    if (!confirm(`ステータスを「${ORDER_STATUS_LABEL[nextStatus]}」に変更しますか？`)) return;
    setUpdating(true);
    setError("");
    const body: Record<string, string> = { status: nextStatus };
    if (nextStatus === "shipped" && trackingInput) body.trackingNumber = trackingInput;
    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setUpdating(false);
    if (res.ok) { load(); }
    else {
      const d = await res.json();
      setError(d.error ?? "エラーが発生しました");
    }
  }

  async function saveTracking() {
    setUpdating(true);
    const res = await fetch(`/api/admin/orders/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingNumber: trackingInput }),
    });
    setUpdating(false);
    if (res.ok) load();
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">読み込み中...</div>;
  if (!order) return <div className="text-slate-400 text-sm py-10 text-center">注文が見つかりません</div>;

  const transitions = TRANSITIONS[order.status] ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/orders" className="text-slate-500 hover:text-slate-700 text-sm">← 注文一覧</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{order.orderNo}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.orderNo}</h1>
          <p className="text-slate-500 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Actions */}
      {transitions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4 text-sm">ステータス操作</h2>

          {(order.status === "confirmed") && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                追跡番号（任意）
              </label>
              <div className="flex gap-2">
                <input
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="例：123456789012"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveTracking}
                  disabled={updating}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {transitions.map((t) => (
              <button
                key={t.next}
                onClick={() => updateStatus(t.next)}
                disabled={updating}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${t.color}`}
              >
                {updating ? "処理中..." : t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 font-semibold text-slate-900">注文商品</div>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="px-6 py-4 flex justify-between items-start">
                <div>
                  <div className="font-medium text-sm text-slate-900">{item.productName}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {item.boxes} 箱 × {item.bottlesPerBox} 本/箱
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    掛け率 {Math.round(item.rateApplied * 100)}%　単価 {formatCurrency(item.unitPricePerBox)}/箱
                  </div>
                </div>
                <div className="font-semibold text-sm text-slate-900">{formatCurrency(item.subtotal)}</div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between font-bold">
            <span className="text-slate-900">合計金額</span>
            <span className="text-lg text-slate-900">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {order.member && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">会員情報</h3>
              <div className="text-sm text-slate-700 space-y-1">
                <div className="font-medium">{order.member.companyName}</div>
                <div className="text-slate-500">{order.member.contactName}</div>
                <div className="text-slate-500">{order.member.email}</div>
              </div>
            </div>
          )}

          {order.address && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-3">配送先</h3>
              <div className="text-sm text-slate-700 space-y-1">
                <div className="font-medium">{order.address.label}</div>
                <div>{order.address.recipientName}</div>
                <div>〒{order.address.postalCode}</div>
                <div>{order.address.prefecture}{order.address.address1}</div>
                {order.address.address2 && <div>{order.address.address2}</div>}
                <div className="text-slate-500">{order.address.phone}</div>
              </div>
            </div>
          )}

          {order.trackingNumber && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">追跡番号</h3>
              <div className="text-sm font-medium text-slate-900">{order.trackingNumber}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
