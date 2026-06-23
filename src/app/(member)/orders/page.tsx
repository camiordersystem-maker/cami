import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";

export const metadata = { title: "注文履歴" };

export default async function MemberOrdersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const orders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.memberId, session.user.id))
    .orderBy(desc(schema.orders.createdAt));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">注文履歴</h1>
        <p className="text-slate-500 text-sm mt-1">これまでのご注文一覧です</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-slate-500 text-sm">まだ注文がありません</div>
            <Link
              href="/products"
              className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium"
            >
              商品を注文する →
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="hidden sm:grid grid-cols-5 px-6 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-2">注文番号 / 日付</div>
              <div className="text-right">合計</div>
              <div className="text-center">ステータス</div>
              <div className="text-right">操作</div>
            </div>

            <div className="divide-y divide-slate-100">
              {orders.map((order: (typeof orders)[0]) => (
                <div key={order.id} className="grid grid-cols-1 sm:grid-cols-5 items-center px-6 py-4 gap-2">
                  <div className="col-span-2">
                    <div className="font-medium text-sm text-slate-900">{order.orderNo}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="sm:text-right font-semibold text-sm text-slate-900">
                    {formatCurrency(order.total)}
                  </div>
                  <div className="sm:text-center">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    {order.trackingNumber && (
                      <div className="text-xs text-slate-500 mt-1">
                        追跡: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                  <div className="sm:text-right flex sm:flex-col gap-2 sm:gap-1 sm:items-end">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      詳細
                    </Link>
                    {(order.status === "confirmed" || order.status === "shipped" || order.status === "delivered") && (
                      <Link
                        href={`/orders/${order.id}/invoice`}
                        className="text-xs text-slate-500 hover:underline"
                      >
                        請求書
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
