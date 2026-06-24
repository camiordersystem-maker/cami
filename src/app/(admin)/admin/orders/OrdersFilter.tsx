"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  currentPeriod: string;
  currentSort: string;
  currentCompany: string;
  currentStatus: string;
};

export default function AdminOrdersFilter({ currentPeriod, currentSort, currentCompany, currentStatus }: Props) {
  const router = useRouter();
  const [company, setCompany] = useState(currentCompany);

  function update(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      status: currentStatus,
      period: currentPeriod,
      sort: currentSort,
      ...(currentCompany ? { company: currentCompany } : {}),
      ...overrides,
    });
    if (!overrides.company && !currentCompany) params.delete("company");
    if (params.get("company") === "") params.delete("company");
    router.push(`/admin/orders?${params.toString()}`);
  }

  function handleCompanySearch(e: React.FormEvent) {
    e.preventDefault();
    update({ company, status: "all" });
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
      {/* Period */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">期間</label>
        <select
          value={currentPeriod}
          onChange={(e) => update({ period: e.target.value })}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">全期間</option>
          <option value="thisMonth">今月</option>
          <option value="lastMonth">先月</option>
          <option value="3months">3ヶ月</option>
        </select>
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">並び順</label>
        <select
          value={currentSort}
          onChange={(e) => update({ sort: e.target.value })}
          className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date_desc">注文日 新しい順</option>
          <option value="date_asc">注文日 古い順</option>
          <option value="total_desc">金額 高い順</option>
          <option value="total_asc">金額 低い順</option>
        </select>
      </div>

      {/* Company search */}
      <form onSubmit={handleCompanySearch} className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">店舗名</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="例：山田商店"
            className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
          />
          <button
            type="submit"
            className="text-sm bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700"
          >
            検索
          </button>
          {currentCompany && (
            <button
              type="button"
              onClick={() => { setCompany(""); update({ company: "" }); }}
              className="text-sm text-slate-500 hover:text-slate-700 px-2"
            >
              ✕
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
