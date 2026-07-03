// API レスポンス解釈ヘルパー（クライアント用）
// 旧形式 { error: string } と新形式 { ok: false, error: { code, message } } の両方に対応する。

type ApiErrorShape = { code?: string; message?: string };

export function apiErrorMessage(json: unknown, fallback: string): string {
  if (json && typeof json === "object") {
    const err = (json as { error?: string | ApiErrorShape }).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && typeof err.message === "string") return err.message;
  }
  return fallback;
}

// 新形式 { ok: true, data: T } なら data を、旧形式ならそのまま返す
export function apiData<T>(json: unknown): T {
  if (
    json &&
    typeof json === "object" &&
    (json as { ok?: boolean }).ok === true &&
    "data" in (json as Record<string, unknown>)
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}
