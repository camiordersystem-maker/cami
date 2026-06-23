import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, MEMBER_STATUS_LABEL, MEMBER_STATUS_COLOR } from "@/lib/utils";

export const metadata = { title: "会員管理" };

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const statusFilter = searchParams.status ?? "all";

  const all = await db
    .select({
      id: schema.members.id,
      companyName: schema.members.companyName,
      contactName: schema.members.contactName,
      email: schema.members.email,
      phone: schema.members.phone,
      status: schema.members.status,
      createdAt: schema.members.createdAt,
      rankName: schema.memberRanks.name,
    })
    .from(schema.members)
    .leftJoin(schema.memberRanks, eq(schema.members.rankId, schema.memberRanks.id))
    .orderBy(desc(schema.members.createdAt));

  const members = statusFilter === "all" ? all : all.filter((m: typeof all[0]) => m.status === statusFilter);

  const tabs = [
    { key: "all", label: "すべて" },
    { key: "pending", label: "審査中" },
    { key: "approved", label: "承認済み" },
    { key: "rejected", label: "却下" },
    { key: "suspended", label: "停止中" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">会員管理</h1>
          <p className="text-slate-500 text-sm mt-1">全 {members.length} 件</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/members/new"
            className="text-sm text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            新規店舗登録
          </Link>
          <a
            href="/api/admin/export/members"
            className="text-sm text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
          >
            CSV出力
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1.5 flex-wrap">
        {tabs.map((tab) => {
          const cnt = tab.key === "all" ? all.length : all.filter((m: typeof all[0]) => m.status === tab.key).length;
          return (
            <Link
              key={tab.key}
              href={`/admin/members?status=${tab.key}`}
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

      <div className="bg-white rounded-xl border border-slate-200">
        {members.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">該当する会員がいません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m: typeof all[0]) => (
              <Link
                key={m.id}
                href={`/admin/members/${m.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">{m.companyName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {m.contactName} · {m.email} · {m.phone}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.rankName && (
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                      {m.rankName}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${MEMBER_STATUS_COLOR[m.status]}`}>
                    {MEMBER_STATUS_LABEL[m.status]}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(m.createdAt)}</span>
                  <span className="text-sm text-blue-600">詳細 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
