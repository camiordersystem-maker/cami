import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, asc, and, gte, lte, like, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";
import AdminOrdersFilter from "./OrdersFilter";

export const metadata = { title: "注文管理" };

type StatusFilter = "all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "cancel_requested";

function getPeriodRange(period: string): { start?: Date; end?: Date } {
  const now = new Date();
  if (period === "thisMonth") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1) };
  }
  if (period === "lastMonth") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: s, end: e };
  }
  if (period === "3months") {
    return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1) };
  }
  return {};
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; period?: string; sort?: string; company?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const statusFilter = (searchParams.status as StatusFilter) ?? "all";
  const period = searchParams.period ?? "all";
  const sort = searchParams.sort ?? "date_desc";
  const company = searchParams.company ?? "";

  const { start, end } = getPeriodRange(period);

  const conditions = [];
  if (statusFilter !== "all") conditions.push(eq(schema.orders.status, statusFilter));
  if (start) conditions.push(gte(schema.orders.createdAt, start));
  if (end) conditions.push(lte(schema.orders.createdAt, end));

  const orderBy =
    sort === "date_asc" ? asc(schema.orders.createdAt) :
    sort === "total_desc" ? desc(schema.orders.total) :
    sort === "total_asc" ? asc(schema.orders.total) :
    desc(schema.orders.createdAt);

  let allOrders: { id: string; orderNo: string; status: string; total: number; createdAt: Date; trackingNumber: string | null; companyName: string | null }[] = [];

  try {
    allOrders = await db
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
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderBy);
  } catch (e) {
    console.error("admin orders list error:", e);
  }

  const orders = company
    ? allOrders.filter((o) => o.companyName?.toLowerCase().includes(company.toLowerCase()))
    : allOrders;

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "すべて" },
    { key: "pending", label: "未確認" },
    { key: "cancel_requested", label: "キャンセル申込" },
    { key: "confirmed", label: "確認済み" },
    { key: "shipped", label: "発送済み" },
    { key: "delivered", label: "完了" },
    { key: "cancelled", label: "ｷｬﾝｾﾙ" },
  ];

  // Count per status (from all orders in db, not filtered)
  const statusCounts = tabs.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all" ? allOrders.length : allOrders.filter((o) => o.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">注文管理</h1>
          <p className="text-slate-500 text-sm mt-1">{orders.length} 件の注文</p>
        </div>
        <a
          href="/api/admin/export/orders"
          className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
        >
          CSV出力
        </a>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl border border-slate-200 p-1.5 flex-wrap">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/orders?status=${tab.key}&period=${period}&sort=${sort}${company ? `&company=${encodeURIComponent(company)}` : ""}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? tab.key === "cancel_requested"
                  ? "bg-red-700 text-white"
                  : "bg-slate-800 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.key
                ? "bg-white/20 text-white"
                : tab.key === "cancel_requested" && statusCounts[tab.key] > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-500"
            }`}>
              {statusCounts[tab.key] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      {/* Filter Bar */}
      <AdminOrdersFilter
        currentPeriod={period}
        currentSort={sort}
        currentCompany={company}
        currentStatus={statusFilter}
      />

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
              {orders.map((order) => (
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
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
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
