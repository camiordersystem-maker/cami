"use client";

import { useState } from "react";

type Props = {
  src?: string;
  alt: string;
};

export default function ManualScreenshot({ src, alt }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <div className="text-sm font-medium text-slate-700">画面キャプチャ準備中</div>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          画面の更新に合わせてキャプチャを準備しています。下の操作手順はこのままご利用いただけます。
        </p>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full rounded-xl border border-slate-200 bg-white shadow-sm"
    />
  );
}
