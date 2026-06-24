export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

function parseDate(date: Date | string | null | undefined): Date | null {
  if (date == null) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  // PostgreSQL returns "YYYY-MM-DD HH:mm:ss" (space, not T) — replace for ISO parsing
  const d = new Date(date.replace(" ", "T"));
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(date: Date | string | null | undefined): string {
  const d = parseDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  const d = parseDate(date);
  if (!d) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function generateOrderNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${y}${m}${d}-${rand}`;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "未確認",
  confirmed: "確認済み",
  shipped: "発送済み",
  delivered: "配達完了",
  cancelled: "キャンセル",
  cancel_requested: "キャンセル申込中",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-600",
  cancel_requested: "bg-red-100 text-red-800",
};

export const MEMBER_STATUS_LABEL: Record<string, string> = {
  pending: "審査中",
  approved: "承認済み",
  rejected: "却下",
  suspended: "停止中",
};

export const MEMBER_STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-600",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: "未払い",
  paid: "支払済み",
  overdue: "延滞",
};

export const PAYMENT_STATUS_COLOR: Record<string, string> = {
  unpaid: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

export const TAX_RATE = 0.10;

export function generateInvoiceNo(year: number, month: number): string {
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV-${year}${String(month).padStart(2, "0")}-${rand}`;
}

export function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0, 23, 59, 59);
}
