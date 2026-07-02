import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export function requestId(): string {
  return crypto.randomUUID();
}

export function ok<T>(data: T, message?: string, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data, message }, init);
}

export function fail(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>
) {
  const id = requestId();
  console.error("api_error", { requestId: id, status, code, message });
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        fieldErrors: fieldErrors ?? {},
        requestId: id,
      },
    },
    { status }
  );
}

export const unauthorized = () => fail(401, "UNAUTHORIZED", "ログインしてください");
export const forbidden = () => fail(403, "FORBIDDEN", "権限がありません");
export const notFound = (message = "対象が見つかりません") => fail(404, "NOT_FOUND", message);
export const conflict = (message: string) => fail(409, "CONFLICT", message);
export const validationError = (message = "入力内容を確認してください") =>
  fail(400, "VALIDATION_ERROR", message);
export const internalError = (message = "処理に失敗しました") => fail(500, "INTERNAL_ERROR", message);
