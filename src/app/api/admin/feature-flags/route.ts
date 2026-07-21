import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { FEATURE_FLAG_DEFINITIONS, type FeatureFlagKey } from "@/lib/constants";
import { getFeatureFlagMap } from "@/lib/feature-flags";
import { internalError, ok, validationError } from "@/lib/api-response";

const VALID_KEYS = FEATURE_FLAG_DEFINITIONS.map((d) => d.key) as [FeatureFlagKey, ...FeatureFlagKey[]];

const updateSchema = z.object({
  key: z.enum(VALID_KEYS),
  enabled: z.boolean(),
});

export async function GET() {
  const session = await auth();
  const authErr = requireSuperAdmin(session);
  if (authErr) return authErr;

  try {
    const map = await getFeatureFlagMap();
    const items = FEATURE_FLAG_DEFINITIONS.map((def) => ({ ...def, enabled: map[def.key] }));
    return ok(items);
  } catch (e) {
    console.error("feature-flags GET error:", e);
    return internalError("取得に失敗しました");
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const authErr = requireSuperAdmin(session);
  if (authErr) return authErr;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return validationError();

  try {
    await db
      .update(schema.featureFlags)
      .set({ enabled: parsed.data.enabled, updatedAt: new Date(), updatedBy: session!.user.id })
      .where(eq(schema.featureFlags.key, parsed.data.key));

    await db.insert(schema.auditLogs).values({
      actorId: session!.user.id,
      actorRole: "admin",
      action: "toggle_feature_flag",
      targetType: "feature_flag",
      targetId: parsed.data.key,
      afterValue: JSON.stringify({ enabled: parsed.data.enabled }),
    });

    return ok({ key: parsed.data.key, enabled: parsed.data.enabled });
  } catch (e) {
    console.error("feature-flags PATCH error:", e);
    return internalError("更新に失敗しました");
  }
}
