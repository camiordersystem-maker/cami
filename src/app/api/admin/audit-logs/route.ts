import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { internalError, ok } from "@/lib/api-response";

const PAGE_SIZE = 50;

// 監査ログ閲覧。スーパー管理者のみ（editorも含めた全操作を確認できる必要があるため
// editor自身には見せない＝「見張られる側が見張る側を兼ねない」設計）。
export async function GET(req: NextRequest) {
  const session = await auth();
  const authErr = requireSuperAdmin(session);
  if (authErr) return authErr;

  const { searchParams } = req.nextUrl;
  const actorRole = searchParams.get("actorRole");
  const action = searchParams.get("action");
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const conditions = [];
  if (actorRole === "admin" || actorRole === "member") {
    conditions.push(eq(schema.auditLogs.actorRole, actorRole));
  }
  if (action) conditions.push(eq(schema.auditLogs.action, action));
  if (targetType) conditions.push(eq(schema.auditLogs.targetType, targetType));
  if (targetId) conditions.push(eq(schema.auditLogs.targetId, targetId));
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) conditions.push(gte(schema.auditLogs.createdAt, d));
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      conditions.push(lte(schema.auditLogs.createdAt, d));
    }
  }

  try {
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const logs = await db
      .select()
      .from(schema.auditLogs)
      .where(where)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE);

    const hasMore = logs.length > PAGE_SIZE;
    const pageLogs = logs.slice(0, PAGE_SIZE);

    // actorIdはadmins/membersどちらのIDにもなり得るため、
    // ロール別にまとめて解決してから結合する。
    const adminActorIds = Array.from(new Set(
      pageLogs.filter((l: (typeof pageLogs)[0]) => l.actorRole === "admin").map((l: (typeof pageLogs)[0]) => l.actorId)
    )) as string[];
    const memberActorIds = Array.from(new Set(
      pageLogs.filter((l: (typeof pageLogs)[0]) => l.actorRole === "member").map((l: (typeof pageLogs)[0]) => l.actorId)
    )) as string[];

    const [adminRows, memberRows] = await Promise.all([
      adminActorIds.length > 0
        ? db.select({ id: schema.admins.id, name: schema.admins.name, email: schema.admins.email })
            .from(schema.admins).where(inArray(schema.admins.id, adminActorIds))
        : Promise.resolve([]),
      memberActorIds.length > 0
        ? db.select({ id: schema.members.id, name: schema.members.companyName, email: schema.members.email })
            .from(schema.members).where(inArray(schema.members.id, memberActorIds))
        : Promise.resolve([]),
    ]);

    const nameMap = new Map<string, { name: string; email: string }>();
    for (const r of adminRows as { id: string; name: string; email: string }[]) nameMap.set(`admin:${r.id}`, r);
    for (const r of memberRows as { id: string; name: string; email: string }[]) nameMap.set(`member:${r.id}`, r);

    // 既存の書込箇所は before/afterValue を JSON.stringify した文字列として渡しており、
    // PG(jsonb)・SQLite(text)いずれの場合も文字列で格納されるため、
    // 表示側で安全にパースしてオブジェクトへ戻す。
    function safeParse(value: unknown): unknown {
      if (typeof value !== "string") return value ?? null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    const items = pageLogs.map((l: (typeof pageLogs)[0]) => {
      const actor = nameMap.get(`${l.actorRole}:${l.actorId}`);
      return {
        id: l.id,
        actorId: l.actorId,
        actorRole: l.actorRole,
        actorName: actor?.name ?? "（退会・削除済み）",
        actorEmail: actor?.email ?? null,
        action: l.action,
        targetType: l.targetType,
        targetId: l.targetId,
        beforeValue: safeParse(l.beforeValue),
        afterValue: safeParse(l.afterValue),
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      };
    });

    return ok({ items, page, hasMore });
  } catch (e) {
    console.error("audit-logs GET error:", e);
    return internalError("監査ログの取得に失敗しました");
  }
}
