import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900">
          ページが見つかりません
        </h1>

        <p className="text-sm text-slate-600 mt-2">
          URLが正しいかご確認ください。
        </p>

        <Link
          href="/"
          className="inline-block mt-5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
