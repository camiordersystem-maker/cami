import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";

export const metadata = { title: "注文管理" };

type StatusFilter = "all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const statusFilter = (searchParams.status as StatusFilter) ?? "all";

  const query = db
    .select({
      id: schema.orders.id,
      orderNo: schema.orders.orderNo,
      status: schema.orders.status,
      total: schema.orders.total,
      createdAt: schema.orders.createdAt,
      trackingNumber: schema.orders.trackingNumber,
      companyName: schema.members.companyName,
    })
    .from(schema.orders)
    .leftJoin(schema.members, eq(schema.orders.memberId, schema.members.id))
    .orderBy(desc(schema.orders.createdAt));

  const allOrders = await query;
  const orders =
    statusFilter === "all"
      ? allOrders
      : allOrders.filter((o: typeof allOrders[0]) => o.status === statusFilter);

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "pending", label: "未確認" },
    { key: "confirmed", label: "確認済み" },
    { key: "shipped", label: "発送済み" },
    { key: "delivered", label: "完了" },
    { key: "cancelled", label: "ｷｬﾝｾﾙ" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">注文管理</h1>
          <p className="text-slate-500 text-sm mt-1">全 {orders.length} 件</p>
        </div>
        <a
          href="/api/admin/export/orders"
          className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
        >
          📥 CSV出力
        </a>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1.5 flex-wrap">
        {tabs.map((tab) => {
          const cnt = tab.key === "all" ? allOrders.length : allOrders.filter((o: typeof allOrders[0]) => o.status === tab.key).length;
          return (
            <Link
              key={tab.key}
              href={`/admin/orders?status=${tab.key}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-slate-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {cnt}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200">
        {orders.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">該当する注文がありません</div>
        ) : (
          <>
            <div className="hidden md:grid grid-cols-6 px-6 py-3 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-2">注文番号 / 会社名</div>
              <div>日付</div>
              <div className="text-right">金額</div>
              <div className="text-center">ステータス</div>
              <div className="text-right">詳細</div>
            </div>
            <div className="divide-y divide-slate-100">
              {orders.map((order: (typeof allOrders)[0]) => (
                <div key={order.id} className="grid grid-cols-2 md:grid-cols-6 items-center px-6 py-4 gap-2">
                  <div className="col-span-2">
                    <div className="font-medium text-sm text-slate-900">{order.orderNo}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{order.companyName}</div>
                  </div>
                  <div className="text-xs text-slate-500 hidden md:block">{formatDate(order.createdAt)}</div>
                  <div className="text-right font-semibold text-sm text-slate-900 hidden md:block">
                    {formatCurrency(order.total)}
                  </div>
                  <div className="md:text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      詳細 →
                    </Link>
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
