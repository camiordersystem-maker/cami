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
    <article className="max-w-4xl mx-auto break-words">
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

      <nav aria-label="この手順の目次" className="mb-7 border-y border-slate-200 py-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">この手順の目次</h2>
        <ol className="space-y-1 text-sm">
          {article.steps.map((step, index) => <li key={step.title}><a href={`#step-${index + 1}`} className="inline-flex min-h-11 items-center gap-2 text-blue-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-blue-600"><span aria-hidden="true">{index + 1}.</span>{step.title}</a></li>)}
        </ol>
      </nav>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">操作手順</h2>
        <ol className="space-y-4">
          {article.steps.map((step, index) => (
            <li id={`step-${index + 1}`} key={`${article.slug}-${index}`} className="scroll-mt-28 border-b border-slate-200 py-5 first:pt-0">
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

      {article.screenshot && <details className="mb-8 border-y border-slate-200 py-4"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600">画面イメージを見る</summary><div className="pt-3"><ManualScreenshot key={article.screenshot} src={article.screenshot} alt={`${article.title}の参考画面`} /><p className="mt-2 text-xs leading-6 text-slate-500">参考画像です。表示内容や件数はご利用中の画面と異なる場合があります。</p></div></details>}

      {article.tips && article.tips.length > 0 && (
        <section className="border-t border-slate-200 py-5">
          <h2 className="font-semibold text-slate-900">補足・ポイント</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {article.tips.map((tip) => <li key={tip}>・{tip}</li>)}
          </ul>
        </section>
      )}
    </article>
  );
}
