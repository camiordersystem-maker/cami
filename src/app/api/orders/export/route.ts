import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { FEATURE_FLAGS } from "@/lib/constants";
import { ORDER_STATUS_LABEL } from "@/lib/utils";

function escapeCsv(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toJst(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

// 会員が自分自身の注文履歴をCSVでダウンロードする（feature flag: member_order_csv_export）
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role: string }).role !== "member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enabled = await isFeatureEnabled(FEATURE_FLAGS.MEMBER_ORDER_CSV_EXPORT).catch(() => false);
  if (!enabled) return NextResponse.json({ error: "この機能は現在ご利用いただけません" }, { status: 403 });

  const orders = await db
    .select({
      orderNo: schema.orders.orderNo,
      status: schema.orders.status,
      total: schema.orders.total,
      trackingNumber: schema.orders.trackingNumber,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .where(eq(schema.orders.memberId, session.user.id))
    .orderBy(desc(schema.orders.createdAt));

  const headers = ["注文番号", "ステータス", "合計金額（円）", "追跡番号", "注文日時"];

  const rows = orders.map((o: (typeof orders)[0]) => [
    o.orderNo,
    ORDER_STATUS_LABEL[o.status] ?? o.status,
    o.total,
    o.trackingNumber ?? "",
    toJst(o.createdAt),
  ]);

  const csv =
    "﻿" + // BOM for Excel
    [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="my_orders_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
