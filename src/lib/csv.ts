// CSV出力の共通エスケープ処理。
// 先頭が =, +, -, @ の値はExcel/Google Sheets等で数式として解釈され得るため
// （CSVインジェクション）、シングルクォートを前置して文字列として扱わせる。
export function escapeCsv(val: unknown): string {
  let s = val == null ? "" : String(val);
  if (/^[=+\-@]/.test(s)) {
    s = `'${s}`;
  }
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
