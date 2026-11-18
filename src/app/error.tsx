"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-900">
          ページを表示できませんでした
        </h1>

        <p className="text-sm text-slate-600 mt-2">
          通信状況をご確認のうえ、もう一度お試しください。
          問題が続く場合は管理者へお問い合わせください。
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
