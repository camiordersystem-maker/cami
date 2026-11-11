import { pushTextMessage, type LineClientConfig } from "./client";
import type { LineNotificationResult, LineOrderNotificationInput } from "./types";

const MAX_ITEMS_IN_MESSAGE = 10;

export type LineOrderNotifier = (
  input: LineOrderNotificationInput,
  config?: LineClientConfig
) => Promise<LineNotificationResult>;

function isEnabled(): boolean {
  return process.env.LINE_ORDER_NOTIFICATIONS_ENABLED === "true";
}

function hasRequiredEnv(): boolean {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_ORDER_NOTIFICATION_GROUP_ID);
}

function formatYen(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatJst(value: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(value)
    .replace(/\//g, "/");
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL || process.env.NEXTAUTH_URL || "").replace(/\/+$/, "");
}

function fnv1a(input: string, seed: number): string {
  let hash = seed;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function deterministicUuid(input: string): string {
  const hex = [
    fnv1a(input, 0x811c9dc5),
    fnv1a(`${input}:line`, 0x01000193),
    fnv1a(`cami:${input}`, 0x9e3779b9),
    fnv1a(`${input}:order`, 0x85ebca6b),
  ].join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0")}${hex.slice(18, 20)}-${hex.slice(20, 32)}`;
}

export function lineRetryKeyForOrder(orderId: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
    return orderId;
  }
  return deterministicUuid(orderId);
}

export function buildOrderNotificationText(input: LineOrderNotificationInput): string {
  const visibleItems = input.items.slice(0, MAX_ITEMS_IN_MESSAGE);
  const itemLines = visibleItems.map((item) => `・${item.productName} × ${item.boxes}箱`);
  const omitted = input.items.length - visibleItems.length;

  if (omitted > 0) {
    itemLines.push(`ほか${omitted}商品`);
  }

  const adminUrl = siteUrl() ? `${siteUrl()}/admin/orders/${input.orderId}` : `/admin/orders/${input.orderId}`;

  return [
    "【Cami 新規注文】",
    "",
    `注文番号：${input.orderNo}`,
    `販売店：${input.memberCompanyName}`,
    `注文日時：${formatJst(input.createdAt)}`,
    "",
    "商品：",
    ...itemLines,
    "",
    `合計：${formatYen(input.total)}`,
    "",
    "本部確認：",
    adminUrl,
  ].join("\n");
}

export async function notifyNewOrder(
  input: LineOrderNotificationInput,
  config?: LineClientConfig
): Promise<LineNotificationResult> {
  if (!isEnabled()) {
    return { status: "skipped", reason: "disabled" };
  }

  if (!hasRequiredEnv() && !config) {
    return { status: "skipped", reason: "missing_env" };
  }

  const retryKey = lineRetryKeyForOrder(input.orderId);
  const result = await pushTextMessage(
    {
      text: buildOrderNotificationText(input),
      retryKey,
    },
    config
  );

  if (result.status === "failed") {
    console.error("line_order_notification_failed", {
      orderId: input.orderId,
      orderNo: input.orderNo,
      httpStatus: result.httpStatus ?? null,
      category: result.category,
    });
  }

  return result;
}
