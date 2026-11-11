import Link from "next/link";
import ManualScreenshot from "@/components/help/ManualScreenshot";
import type { ManualArticle, ManualRole } from "@/lib/manual";

type Props = {
  role: ManualRole;
  article: ManualArticle;
};

export default function ManualArticlePage({ role, article }: Props) {
  const indexHref = role === "admin" ? "/admin/help" : "/help";

  return (
    <article className="max-w-4xl mx-auto">
      <div className="mb-5 text-sm">
        <Link href={indexHref} className="inline-flex min-h-11 items-center text-blue-600 hover:underline">
          ← ヘルプ・マニュアル一覧
        </Link>
      </div>

      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <span className="rounded-full bg-slate-200 px-2.5 py-1">{article.category}</span>
          {article.audience && <span>対象：{article.audience}</span>}
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">{article.title}</h1>
        <p className="mt-2 text-sm md:text-base leading-7 text-slate-600">{article.summary}</p>
        {article.screenPath && (
          <Link
            href={article.screenPath}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            対象画面を開く →
          </Link>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">画面イメージ</h2>
        <ManualScreenshot src={article.screenshot} alt={`${article.title}の画面キャプチャ`} />
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">操作手順</h2>
        <ol className="space-y-4">
          {article.steps.map((step, index) => (
            <li key={`${article.slug}-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">{step.body}</p>
                  {step.note && (
                    <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-800">{step.note}</div>
                  )}
                  {step.warning && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                      注意：{step.warning}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {article.tips && article.tips.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-900">補足・ポイント</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {article.tips.map((tip) => <li key={tip}>・{tip}</li>)}
          </ul>
        </section>
      )}
    </article>
  );
}
