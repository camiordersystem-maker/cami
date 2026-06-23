import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

function escapeCsv(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toJst(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await db.select().from(schema.products);
  const invs = await db.select().from(schema.inventory);
  const invMap = Object.fromEntries(invs.map((i: (typeof invs)[0]) => [i.productId, i]));

  const headers = [
    "商品名", "定価（円）", "箱あたり本数", "1箱定価（円）",
    "在庫数（箱）", "在庫定価総額（円）", "ステータス", "最終更新",
  ];

  const rows = products.map((p: (typeof products)[0]) => {
    const inv = invMap[p.id];
    const boxes = inv?.availableBoxes ?? 0;
    return [
      p.name,
      p.retailPrice,
      p.bottlesPerBox,
      p.retailPrice * p.bottlesPerBox,
      boxes,
      boxes * p.retailPrice * p.bottlesPerBox,
      p.isActive ? "販売中" : "停止中",
      toJst(inv?.updatedAt),
    ];
  });

  const csv = "﻿" + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
