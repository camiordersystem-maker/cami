import Link from "next/link";
import type { ManualArticle, ManualRole } from "@/lib/manual";

type Props = {
  role: ManualRole;
  articles: ManualArticle[];
};

export default function ManualIndex({ role, articles }: Props) {
  const base = role === "admin" ? "/admin/help" : "/help";
  const groups = Array.from(new Set(articles.map((article) => article.category)));

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

      <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="font-semibold text-blue-900">使い方</div>
        <p className="mt-1 text-sm leading-6 text-blue-800">
          各業務画面の上部にある「？ この画面の使い方」から、今開いている画面に対応した説明へ直接移動できます。
          画面キャプチャはSTAGINGから自動更新できる構成です。
        </p>
      </div>

      <div className="space-y-9">
        {groups.map((group) => (
          <section key={group}>
            <h2 className="mb-3 text-sm font-bold tracking-wide text-slate-500">{group}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {articles.filter((article) => article.category === group).map((article) => (
                <Link
                  key={article.slug}
                  href={`${base}/${article.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
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
