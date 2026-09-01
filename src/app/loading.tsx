export default function Loading() {
  return (
    <div
      className="min-h-[40vh] flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <div className="text-sm font-medium text-slate-700">
          読み込み中です
        </div>
        <div className="text-xs text-slate-500 mt-1">
          しばらくお待ちください。
        </div>
      </div>
    </div>
  );
}
