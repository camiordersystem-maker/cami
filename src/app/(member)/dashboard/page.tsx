import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, count, or, isNull, gte, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/lib/utils";

export const metadata = { title: "ダッシュボード" };

export default async function MemberDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const memberId = session.user.id;

  const [member] = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.id, memberId));

  const [rank] = member
    ? await db.select().from(schema.memberRanks).where(eq(schema.memberRanks.id, member.rankId))
    : [undefined];

  const recentOrders = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.memberId, memberId))
    .orderBy(desc(schema.orders.createdAt))
    .limit(5);

  const [orderCount] = await db
    .select({ value: count() })
    .from(schema.orders)
    .where(eq(schema.orders.memberId, memberId));

  const now = new Date();
  const latestAnnouncements = await db
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      type: schema.announcements.type,
      createdAt: schema.announcements.createdAt,
    })
    .from(schema.announcements)
    .where(
      and(
        or(
          eq(schema.announcements.type, "all"),
          eq(schema.announcements.targetMemberId, memberId)
        ),
        or(
          isNull(schema.announcements.expiresAt),
          gte(schema.announcements.expiresAt, now)
        )
      )
    )
    .orderBy(desc(schema.announcements.createdAt))
    .limit(3)
    .catch(() => []);

  const pendingOrders = recentOrders.filter((o: (typeof recentOrders)[0]) => o.status === "pending").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          おかえりなさい、{member?.companyName ?? session.user.name} 様
        </h1>
        <p className="text-slate-500 text-sm mt-1">Camiヘアオイル 受発注システム</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">現在のランク</div>
          <div className="text-xl font-bold text-slate-900">{rank?.name ?? "—"}</div>
          <div className="text-sm text-blue-600 mt-1">
            掛け率 {rank ? `${Math.round(rank.rate * 100)}%` : "—"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">総注文数</div>
          <div className="text-xl font-bold text-slate-900">{orderCount?.value ?? 0} 件</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500 mb-1">確認待ち注文</div>
          <div className="text-xl font-bold text-amber-600">{pendingOrders} 件</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/products"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 transition-colors"
        >
          <div className="font-bold text-lg">商品を注文する</div>
          <div className="text-blue-200 text-sm mt-1">
            掛け率 {rank ? `${Math.round(rank.rate * 100)}%` : "—"} で購入
          </div>
        </Link>
        <Link
          href="/orders"
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-6 transition-colors"
        >
          <div className="font-bold text-lg">注文履歴を確認</div>
          <div className="text-slate-500 text-sm mt-1">ステータス・請求書を確認</div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">最近の注文</h2>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">
            すべて見る →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            まだ注文がありません
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order: (typeof recentOrders)[0]) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-sm text-slate-900">{order.orderNo}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-sm text-slate-900">
                    {formatCurrency(order.total)}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Latest Announcements */}
      {latestAnnouncements.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">お知らせ</h2>
            <Link href="/announcements" className="text-sm text-blue-600 hover:underline">すべて見る →</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {latestAnnouncements.map((a: (typeof latestAnnouncements)[0]) => (
              <Link key={a.id} href="/announcements" className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">{a.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatDate(a.createdAt)}</div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-3 shrink-0 ${a.type === "all" ? "bg-slate-100 text-slate-600" : "bg-blue-100 text-blue-700"}`}>
                  {a.type === "all" ? "全体" : "個別"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Rank Info */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-3">ランク制度について</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {[
            { name: "スタンダード", rate: 50, min: 0 },
            { name: "シルバー", rate: 45, min: 5 },
            { name: "ゴールド", rate: 40, min: 10 },
            { name: "プラチナ", rate: 35, min: 20 },
          ].map((r) => (
            <div
              key={r.name}
              className={`rounded-lg p-3 text-center ${
                rank?.name === r.name
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-blue-100 text-slate-700"
              }`}
            >
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs mt-0.5 opacity-80">掛け率 {r.rate}%</div>
              <div className="text-xs opacity-60">{r.min === 0 ? "初期" : `月${r.min}箱〜`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
