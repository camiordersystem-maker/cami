"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { AUDIT_ACTION_LABEL, AUDIT_TARGET_TYPE_LABEL } from "@/lib/constants";
import { apiData, apiErrorMessage } from "@/lib/client-api";

type AuditLogItem = {
  id: string;
  actorId: string;
  actorRole: "admin" | "member";
  actorName: string;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  beforeValue: unknown;
  afterValue: unknown;
  ipAddress: string | null;
  createdAt: string;
};

function summarizeChange(before: unknown, after: unknown): string {
  const b = before && typeof before === "object" ? (before as Record<string, unknown>) : null;
  const a = after && typeof after === "object" ? (after as Record<string, unknown>) : null;
  if (!b && !a) return "—";
  if (!b && a) return Object.entries(a).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" / ");
  if (b && !a) return Object.entries(b).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" / ");
  const keys = new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})]);
  const parts: string[] = [];
  for (const key of keys) {
    const bv = b?.[key];
    const av = a?.[key];
    if (JSON.stringify(bv) !== JSON.stringify(av)) {
      parts.push(`${key}: ${bv === undefined ? "—" : JSON.stringify(bv)} → ${av === undefined ? "—" : JSON.stringify(av)}`);
    }
  }
  return parts.length > 0 ? parts.join(" / ") : "変更なし";
}

export default function AdminAuditLogsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const myAdminRole = (session?.user as { adminRole?: string })?.adminRole;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const actorRole = searchParams.get("actorRole") ?? "";
  const action = searchParams.get("action") ?? "";
  const targetType = searchParams.get("targetType") ?? "";
  const targetId = searchParams.get("targetId") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (actorRole) params.set("actorRole", actorRole);
    if (action) params.set("action", action);
    if (targetType) params.set("targetType", targetType);
    if (targetId) params.set("targetId", targetId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
    const json = await res.json().catch(() => null);
    if (res.ok) {
      const data = apiData<{ items: AuditLogItem[]; hasMore: boolean }>(json);
      setItems(data.items);
      setHasMore(data.hasMore);
    } else {
      setError(apiErrorMessage(json, "監査ログの取得に失敗しました"));
    }
    setLoading(false);
  }, [actorRole, action, targetType, targetId, from, to, page]);

  useEffect(() => { load(); }, [load]);

  function updateFilter(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const next = { actorRole, action, targetType, targetId, from, to, ...overrides };
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    if (!("page" in overrides)) params.set("page", "1");
    router.push(`/admin/audit-logs?${params.toString()}`);
  }

  if (sessionStatus === "loading") {
    return <div className="p-8 text-slate-500">読み込み中...</div>;
  }

  if (myAdminRole !== "superadmin") {
    return (
      <div className="py-20 text-center text-slate-500">
        この画面はスーパー管理者のみアクセスできます
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">監査ログ</h1>
        <p className="text-sm text-slate-500 mt-1">
          誰が・いつ・何を変更したかの記録です。会員・注文・管理者アカウントなどの変更を追跡できます。
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">実行者</label>
          <select
            aria-label="実行者"
            value={actorRole}
            onChange={(e) => updateFilter({ actorRole: e.target.value })}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="admin">管理者</option>
            <option value="member">会員</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">操作の種類</label>
          <select
            aria-label="操作の種類"
            value={action}
            onChange={(e) => updateFilter({ action: e.target.value })}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {Object.entries(AUDIT_ACTION_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">対象の種類</label>
          <select
            aria-label="対象の種類"
            value={targetType}
            onChange={(e) => updateFilter({ targetType: e.target.value })}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            {Object.entries(AUDIT_TARGET_TYPE_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">対象ID</label>
          <input
            aria-label="対象ID"
            type="text"
            defaultValue={targetId}
            onBlur={(e) => updateFilter({ targetId: e.target.value })}
            placeholder="注文ID・会員IDなど"
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">期間（から）</label>
          <input
            aria-label="期間（から）"
            type="date"
            value={from}
            onChange={(e) => updateFilter({ from: e.target.value })}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">期間（まで）</label>
          <input
            aria-label="期間（まで）"
            type="date"
            value={to}
            onChange={(e) => updateFilter({ to: e.target.value })}
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {(actorRole || action || targetType || targetId || from || to) && (
          <button
            onClick={() => router.push("/admin/audit-logs")}
            className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1.5"
          >
            条件クリア
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">読み込み中...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">該当する記録がありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {AUDIT_ACTION_LABEL[item.action] ?? item.action}
                    </span>
                    <span className="text-sm text-slate-900 font-medium">{item.actorName}</span>
                    {item.actorEmail && <span className="text-xs text-slate-400">{item.actorEmail}</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${item.actorRole === "admin" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                      {item.actorRole === "admin" ? "管理者" : "会員"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatDateTime(item.createdAt)}</span>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  対象: {AUDIT_TARGET_TYPE_LABEL[item.targetType] ?? item.targetType}
                  {item.targetId && (
                    <button
                      onClick={() => updateFilter({ targetId: item.targetId ?? "" })}
                      className="ml-1 text-blue-600 hover:underline font-mono text-xs"
                      title="この対象IDで絞り込む"
                    >
                      #{item.targetId.slice(0, 8)}
                    </button>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500 break-all">
                  {summarizeChange(item.beforeValue, item.afterValue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(page > 1 || hasMore) && (
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => updateFilter({ page: String(page - 1) })}
            disabled={page <= 1}
            className="text-sm px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            ← 前へ
          </button>
          <span className="text-sm text-slate-500 px-2 py-2">{page}ページ目</span>
          <button
            onClick={() => updateFilter({ page: String(page + 1) })}
            disabled={!hasMore}
            className="text-sm px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
          >
            次へ →
          </button>
        </div>
      )}
    </div>
  );
}
