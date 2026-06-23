import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, count, sum, desc, gte, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, MEMBER_STATUS_COLOR, MEMBER_STATUS_LABEL, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_COLOR } from "@/lib/utils";

export const metadata = { title: "管理ダッシュボード" };

function getMonthStart(monthsAgo: number) {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - monthsAgo);
  return d;
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [totalOrders] = await db.select({ value: count() }).from(schema.orders);
  const [pendingOrders] = await db
    .select({ value: count() })
    .from(schema.orders)
    .where(eq(schema.orders.status, "pending"));
  const [pendingMembers] = await db
    .select({ value: count() })
    .from(schema.members)
    .where(eq(schema.members.status, "pending"));
  const [totalRevenue] = await db
    .select({ value: sum(schema.orders.total) })
    .from(schema.orders)
    .where(eq(schema.orders.status, "delivered"));

  const [unpaidInvoices] = await db
    .select({ value: sum(schema.monthlyInvoices.total) })
    .from(schema.monthlyInvoices)
    .where(eq(schema.monthlyInvoices.paymentStatus, "unpaid"))
    .catch(() => [null]);

  // Monthly sales for last 6 months
  const sixMonthsAgo = getMonthStart(5);
  const monthlySalesRaw = await db
    .select({
      total: schema.orders.total,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .where(
      and(
        gte(schema.orders.createdAt, sixMonthsAgo),
        eq(schema.orders.status, "delivered")
      )
    );

  const monthlyMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = getMonthStart(i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = 0;
  }
  for (const row of monthlySalesRaw) {
    const d = new Date(row.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyMap) monthlyMap[key] += row.total;
  }

  const recentOrders = await db
    .select({
      id: schema.orders.id,
      orderNo: schema.orders.orderNo,
      status: schema.orders.status,
      total: schema.orders.total,
      paymentStatus: schema.orders.paymentStatus,
      createdAt: schema.orders.createdAt,
      companyName: schema.members.companyName,
    })
    .from(schema.orders)
    .leftJoin(schema.members, eq(schema.orders.memberId, schema.members.id))
    .orderBy(desc(schema.orders.createdAt))
    .limit(8)
    .catch(() => []);

  const recentMembers = await db
    .select()
    .from(schema.members)
    .orderBy(desc(schema.members.createdAt))
    .limit(5);

  const maxMonthly = Math.max(...Object.values(monthlyMap), 1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="text-slate-500 text-sm mt-1">Cami 本部管理システム</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "総注文数", value: `${totalOrders?.value ?? 0} 件`, sub: "全期間", color: "blue" },
          { label: "確認待ち注文", value: `${pendingOrders?.value ?? 0} 件`, sub: "要対応", color: "amber", href: "/admin/orders" },
          { label: "審査待ち会員", value: `${pendingMembers?.value ?? 0} 件`, sub: "要審査", color: "amber", href: "/admin/members" },
          { label: "累計売上（配達完了）", value: formatCurrency(Number(totalRevenue?.value ?? 0)), sub: "配達完了分", color: "green" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs font-medium text-slate-500 mb-1">{stat.label}</div>
            <div className={`text-xl font-bold ${stat.color === "amber" ? "text-amber-600" : stat.color === "green" ? "text-green-600" : "text-slate-900"}`}>
              {stat.value}
            </div>
            {stat.href ? (
              <Link href={stat.href} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                {stat.sub} →
              </Link>
            ) : (
              <div className="text-xs text-slate-400 mt-1">{stat.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* Unpaid invoices alert */}
      {Number(unpaidInvoices?.value ?? 0) > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-amber-800 text-sm">未払い請求書があります</div>
            <div className="text-amber-700 text-sm mt-0.5">
              未収合計：<span className="font-bold">{formatCurrency(Number(unpaidInvoices?.value ?? 0))}</span>
            </div>
          </div>
          <Link href="/admin/invoices" className="text-sm text-amber-700 border border-amber-300 bg-white hover:bg-amber-50 px-4 py-2 rounded-lg transition-colors">
            請求書管理 →
          </Link>
        </div>
      )}

      {/* Monthly Sales Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-6">月次売上（過去6ヶ月・配達完了分）</h2>
        <div className="flex items-end gap-3 h-48">
          {Object.entries(monthlyMap).map(([key, val]) => {
            const [y, m] = key.split("-");
            const heightPct = maxMonthly > 0 ? (val / maxMonthly) * 100 : 0;
            return (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-medium text-slate-600 text-center">{formatCurrency(val)}</div>
                <div className="w-full flex items-end" style={{ height: "96px" }}>
                  <div
                    className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                    style={{ height: `${Math.max(4, heightPct)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">{m}月</div>
                <div className="text-xs text-slate-400">{y}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">最近の注文</h2>
            <Link href="/admin/orders" className="text-sm text-blue-600 hover:underline">すべて見る →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">注文がありません</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order: typeof recentOrders[0]) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-900">{order.orderNo}</div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {order.companyName} · {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <span className="font-medium text-sm text-slate-800">{formatCurrency(order.total)}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${PAYMENT_STATUS_COLOR[order.paymentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                      {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "—"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Members */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">最近の登録申請</h2>
            <Link href="/admin/members" className="text-sm text-blue-600 hover:underline">すべて →</Link>
          </div>
          {recentMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">申請がありません</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentMembers.map((m: typeof recentMembers[0]) => (
                <Link
                  key={m.id}
                  href={`/admin/members/${m.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-900 truncate">{m.companyName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{formatDate(m.createdAt)}</div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ml-2 ${MEMBER_STATUS_COLOR[m.status]}`}>
                    {MEMBER_STATUS_LABEL[m.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
