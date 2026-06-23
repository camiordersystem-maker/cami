import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";

export const metadata = { title: "注文詳細" };

const STATUS_STEPS = [
  { key: "pending", label: "注文受付" },
  { key: "confirmed", label: "確認済み" },
  { key: "shipped", label: "発送済み" },
  { key: "delivered", label: "配達完了" },
];

export default async function MemberOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, params.id));

  if (!order || order.memberId !== session.user.id) notFound();

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, order.id));

  const [address] = await db
    .select()
    .from(schema.shippingAddresses)
    .where(eq(schema.shippingAddresses.id, order.shippingAddressId));

  const statusIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/orders" className="text-slate-500 hover:text-slate-700 text-sm">
          ← 注文履歴
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{order.orderNo}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{order.orderNo}</h1>
          <p className="text-slate-500 text-sm mt-1">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
          {(order.status === "confirmed" || order.status === "shipped" || order.status === "delivered") && (
            <Link
              href={`/orders/${order.id}/invoice`}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              📄 請求書を見る
            </Link>
          )}
        </div>
      </div>

      {/* Status Progress */}
      {!isCancelled && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-5 text-sm">注文ステータス</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, idx) => (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx <= statusIndex
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {idx < statusIndex ? "✓" : idx + 1}
                  </div>
                  <div
                    className={`text-xs mt-1.5 font-medium ${
                      idx <= statusIndex ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      idx < statusIndex ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">注文商品</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item: (typeof items)[0]) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-sm text-slate-900">{item.productName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.boxes} 箱 × {item.bottlesPerBox} 本/箱
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      掛け率 {Math.round(item.rateApplied * 100)}%　単価 {formatCurrency(item.unitPricePerBox)}/箱
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-slate-900">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-900">合計金額</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Side Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">配送先</h3>
            {address ? (
              <div className="text-sm text-slate-700 space-y-1">
                <div className="font-medium">{address.label}</div>
                <div>{address.recipientName}</div>
                <div>〒{address.postalCode}</div>
                <div>{address.prefecture}{address.address1}</div>
                {address.address2 && <div>{address.address2}</div>}
                <div className="text-slate-500">{address.phone}</div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">配送先情報なし</div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">お支払い</h3>
            <div className="text-sm text-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">小計</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-100 pt-2">
                <span>合計</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
              請求書発行後、銀行振込にてお支払いください
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">注文日時</h3>
            <div className="text-sm text-slate-700">{formatDateTime(order.createdAt)}</div>
            {order.updatedAt && order.updatedAt !== order.createdAt && (
              <div className="text-xs text-slate-400 mt-1">
                更新: {formatDateTime(order.updatedAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
