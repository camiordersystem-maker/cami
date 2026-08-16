"use client";

import { useCallback, useRef, useState } from "react";

// window.confirm()はネイティブダイアログのため、ブラウザ自動テストツールの多くが
// 自動的に抑制/却下してしまい、送信ボタンが反応しないように見える問題があった。
// アプリ内モーダルに置き換えることで、実ユーザーの操作性を保ちつつ自動テストも通せる。
export function useConfirm() {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirmAsync = useCallback((msg: string) => {
    setMessage(msg);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function respond(result: boolean) {
    resolver.current?.(result);
    resolver.current = null;
    setMessage(null);
  }

  const ConfirmDialog =
    message !== null ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
          <p className="text-sm text-slate-800 whitespace-pre-line mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => respond(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => respond(true)}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return { confirmAsync, ConfirmDialog };
}
