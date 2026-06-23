import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

function escapeCsv(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function parseTs(d: Date | string | null | undefined): Date | null {
  if (d == null) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  const parsed = new Date((d as string).replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function toJst(date: Date | string | null | undefined): string {
  const d = parseTs(date);
  if (!d) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await db
    .select({
      orderNo: schema.orders.orderNo,
      status: schema.orders.status,
      total: schema.orders.total,
      subtotal: schema.orders.subtotal,
      trackingNumber: schema.orders.trackingNumber,
      createdAt: schema.orders.createdAt,
      updatedAt: schema.orders.updatedAt,
      companyName: schema.members.companyName,
      contactName: schema.members.contactName,
      memberEmail: schema.members.email,
    })
    .from(schema.orders)
    .leftJoin(schema.members, eq(schema.orders.memberId, schema.members.id))
    .orderBy(desc(schema.orders.createdAt));

  const statusLabel: Record<string, string> = {
    pending: "未確認", confirmed: "確認済み", shipped: "発送済み",
    delivered: "配達完了", cancelled: "キャンセル",
  };

  const headers = [
    "注文番号", "会社名", "担当者名", "メール",
    "ステータス", "合計金額（円）", "追跡番号", "注文日時", "更新日時",
  ];

  const rows = orders.map((o: (typeof orders)[0]) => [
    o.orderNo,
    o.companyName ?? "",
    o.contactName ?? "",
    o.memberEmail ?? "",
    statusLabel[o.status] ?? o.status,
    o.total,
    o.trackingNumber ?? "",
    toJst(o.createdAt),
    toJst(o.updatedAt),
  ]);

  const csv =
    "﻿" + // BOM for Excel
    [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
