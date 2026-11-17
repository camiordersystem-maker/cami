"use client";

import Link from "next/link";
import { useState } from "react";
import { searchManualArticles, type ManualArticle, type ManualRole } from "@/lib/manual";

type Props = {
  role: ManualRole;
  articles: ManualArticle[];
};

export default function ManualIndex({ role, articles }: Props) {
  const base = role === "admin" ? "/admin/help" : "/help";
  const groups = Array.from(new Set(articles.map((article) => article.category)));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const visible = searchManualArticles(articles, query, category);
  const featured = (role === "admin" ? ["admin-orders", "admin-inventory", "admin-incidents"] : ["place-order", "order-history", "addresses"])
    .map((slug) => articles.find((article) => article.slug === slug)).filter((article): article is ManualArticle => Boolean(article));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">Cami 操作ガイド</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">ヘルプ・マニュアル</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          {role === "admin"
            ? "本部管理画面の操作方法を、業務の流れに沿って確認できます。更新操作を行う前に、対象・ステータス・数量を必ず確認してください。"
            : "初めての方でも注文から請求書確認まで迷わないよう、画面ごとに手順をまとめています。"}
        </p>
      </div>

      <nav aria-label="よく使う手順" className="mb-7 border-y border-slate-200 py-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">よく使う手順</h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {featured.map((article) => <li key={article.slug}><Link href={`${base}/${article.slug}`} className="inline-flex min-h-11 items-center text-sm text-blue-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-blue-600">{article.title}</Link></li>)}
        </ul>
      </nav>

      <form role="search" onSubmit={(event) => event.preventDefault()} className="mb-6 grid gap-4 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor="manual-search" className="mb-2 block text-sm font-medium text-slate-700">手順を検索</label>
          <input id="manual-search" name="q" type="search" value={query} maxLength={200} autoComplete="off" onChange={(event) => setQuery(event.target.value)} placeholder="例：出荷、在庫、LINE…" aria-controls="manual-results" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600" />
        </div>
        <div>
          <label htmlFor="manual-category" className="mb-2 block text-sm font-medium text-slate-700">業務で絞り込む</label>
          <select id="manual-category" name="category" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600">
            <option value="">すべての業務</option>{groups.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </div>
      </form>
      <p role="status" aria-live="polite" aria-atomic="true" className="mb-5 text-sm text-slate-600">{visible.length}件の手順</p>
      {visible.length === 0 && <div className="border-y border-slate-200 py-8 text-sm leading-7 text-slate-700"><p>該当する手順がありません。短い言葉に変えるか、業務の絞り込みを解除してください。</p><button type="button" onClick={() => { setQuery(""); setCategory(""); }} className="min-h-11 text-blue-700 underline focus-visible:outline-2 focus-visible:outline-blue-600">検索条件をクリア</button></div>}

      <div id="manual-results" className="space-y-9">
        {groups.filter((group) => visible.some((article) => article.category === group)).map((group, index) => (
          <section key={group} aria-labelledby={`manual-group-${index}`}>
            <h2 id={`manual-group-${index}`} className="mb-3 text-base font-bold text-slate-700">{group}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {visible.filter((article) => article.category === group).map((article) => (
                <Link
                  key={article.slug}
                  href={`${base}/${article.slug}`}
                  className="group min-w-0 break-words rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <div className="font-semibold text-slate-900 group-hover:text-blue-700">{article.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{article.summary}</p>
                  <div className="mt-3 text-xs font-medium text-blue-600">手順を見る →</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
