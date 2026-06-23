"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, formatDateTime, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, MEMBER_STATUS_LABEL, MEMBER_STATUS_COLOR } from "@/lib/utils";

type Member = {
  id: string;
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  address: string;
  businessDescription: string | null;
  status: string;
  rankId: string;
  createdAt: string;
  updatedAt: string;
  rank: { id: string; name: string; rate: number } | null;
  orders: { id: string; orderNo: string; status: string; total: number; createdAt: string }[];
  addresses: { id: string; label: string; prefecture: string; address1: string; isDefault: boolean }[];
};

type Rank = { id: string; name: string; rate: number };

export default function AdminMemberDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedRank, setSelectedRank] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [mRes, rRes] = await Promise.all([
      fetch(`/api/admin/members/${params.id}`),
      fetch("/api/admin/ranks"),
    ]);
    if (mRes.ok) {
      const data = await mRes.json();
      setMember(data);
      setSelectedRank(data.rankId);
    }
    if (rRes.ok) setRanks(await rRes.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function updateStatus(status: string) {
    const label = MEMBER_STATUS_LABEL[status];
    if (!confirm(`ステータスを「${label}」に変更しますか？`)) return;
    setUpdating(true);
    setError("");
    const res = await fetch(`/api/admin/members/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    if (res.ok) load();
    else { const d = await res.json(); setError(d.error ?? "エラー"); }
  }

  async function updateRank() {
    if (selectedRank === member?.rankId) return;
    setUpdating(true);
    const res = await fetch(`/api/admin/members/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rankId: selectedRank }),
    });
    setUpdating(false);
    if (res.ok) load();
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(n);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">読み込み中...</div>;
  if (!member) return <div className="text-center py-10 text-slate-400">会員が見つかりません</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/members" className="text-slate-500 hover:text-slate-700 text-sm">← 会員一覧</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{member.companyName}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{member.companyName}</h1>
          <p className="text-slate-500 text-sm mt-1">登録日：{formatDate(member.createdAt)}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${MEMBER_STATUS_COLOR[member.status]}`}>
          {MEMBER_STATUS_LABEL[member.status]}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info + Actions */}
        <div className="space-y-4">
          {/* Member Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-4">基本情報</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: "担当者", value: member.contactName },
                { label: "メール", value: member.email },
                { label: "電話", value: member.phone },
                { label: "住所", value: member.address },
                { label: "事業概要", value: member.businessDescription ?? "—" },
              ].map((r) => (
                <div key={r.label}>
                  <div className="text-xs text-slate-500 mb-0.5">{r.label}</div>
                  <div className="text-slate-800">{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rank Change */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">ランク設定</h2>
            <div className="text-xs text-slate-500 mb-2">現在：{member.rank?.name}（{member.rank ? Math.round(member.rank.rate * 100) : "—"}%）</div>
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ranks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}（掛け率 {Math.round(r.rate * 100)}%）
                </option>
              ))}
            </select>
            <button
              onClick={updateRank}
              disabled={updating || selectedRank === member.rankId}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              ランクを変更する
            </button>
          </div>

          {/* Status Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 text-sm mb-3">ステータス操作</h2>
            <div className="space-y-2">
              {member.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus("approved")}
                    disabled={updating}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✅ 承認する
                  </button>
                  <button
                    onClick={() => updateStatus("rejected")}
                    disabled={updating}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    ❌ 却下する
                  </button>
                </>
              )}
              {member.status === "approved" && (
                <button
                  onClick={() => updateStatus("suspended")}
                  disabled={updating}
                  className="w-full py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  ⏸ 停止する
                </button>
              )}
              {(member.status === "rejected" || member.status === "suspended") && (
                <button
                  onClick={() => updateStatus("approved")}
                  disabled={updating}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  ✅ 再承認する
                </button>
              )}
              {member.status === "approved" && (
                <div className="text-xs text-slate-400 text-center pt-1">承認済み会員です</div>
              )}
            </div>
          </div>

          {/* Shipping Addresses */}
          {member.addresses.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900 text-sm mb-3">登録配送先</h2>
              <div className="space-y-2">
                {member.addresses.map((a) => (
                  <div key={a.id} className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{a.label}</span>
                    {a.isDefault && <span className="ml-2 text-xs text-blue-600">デフォルト</span>}
                    <div className="text-xs text-slate-500 mt-0.5">{a.prefecture}{a.address1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Order History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">注文履歴</h2>
              <span className="text-xs text-slate-500">{member.orders.length} 件</span>
            </div>
            {member.orders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">注文がありません</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {member.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-900">{order.orderNo}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-slate-900">{fmt(order.total)}</span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ORDER_STATUS_COLOR[order.status]}`}>
                        {ORDER_STATUS_LABEL[order.status]}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
