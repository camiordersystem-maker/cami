import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { FEATURE_FLAG_DEFINITIONS, type FeatureFlagKey } from "@/lib/constants";

// Any flag not yet present in the DB row set (e.g. right after a fresh
// migration) is treated as disabled — fail closed, never fail open.
export async function getFeatureFlagMap(): Promise<Record<FeatureFlagKey, boolean>> {
  const rows = await db.select().from(schema.featureFlags);
  const rowMap = new Map<string, boolean>(
    rows.map((r: { key: string; enabled: boolean }) => [r.key, r.enabled])
  );
  const result = {} as Record<FeatureFlagKey, boolean>;
  for (const def of FEATURE_FLAG_DEFINITIONS) {
    result[def.key] = rowMap.get(def.key) ?? false;
  }
  return result;
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const [row] = await db
    .select({ enabled: schema.featureFlags.enabled })
    .from(schema.featureFlags)
    .where(eq(schema.featureFlags.key, key));
  return Boolean(row?.enabled);
}
