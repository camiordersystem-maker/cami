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
  }).format(d);
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await db
    .select({
      companyName: schema.members.companyName,
      contactName: schema.members.contactName,
      email: schema.members.email,
      phone: schema.members.phone,
      address: schema.members.address,
      businessDescription: schema.members.businessDescription,
      status: schema.members.status,
      createdAt: schema.members.createdAt,
      rankName: schema.memberRanks.name,
      rankRate: schema.memberRanks.rate,
    })
    .from(schema.members)
    .leftJoin(schema.memberRanks, eq(schema.members.rankId, schema.memberRanks.id))
    .orderBy(desc(schema.members.createdAt));

  const statusLabel: Record<string, string> = {
    pending: "審査中", approved: "承認済み", rejected: "却下", suspended: "停止中",
  };

  const headers = [
    "会社名", "担当者名", "メール", "電話番号", "住所", "事業概要",
    "ステータス", "ランク", "掛け率（%）", "登録日",
  ];

  const rows = members.map((m: (typeof members)[0]) => [
    m.companyName,
    m.contactName,
    m.email,
    m.phone,
    m.address,
    m.businessDescription ?? "",
    statusLabel[m.status] ?? m.status,
    m.rankName ?? "",
    m.rankRate != null ? Math.round(m.rankRate * 100) : "",
    toJst(m.createdAt),
  ]);

  const csv = "﻿" + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
