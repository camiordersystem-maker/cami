import { and, eq, gte, sql } from "drizzle-orm";
import type { DB } from "./db";
import { inventory } from "./db/schema";

// Derive the ledger values from UPDATE RETURNING, never from a stale SELECT.
export async function changeInventory(tx: DB, productId: string, delta: number, actorId: string) {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new Error("INVALID_INVENTORY_DELTA");
  const [updated] = await tx.update(inventory)
    .set({
      availableBoxes: sql`${inventory.availableBoxes} + ${delta}`,
      updatedAt: new Date(),
      updatedBy: actorId,
    })
    .where(and(
      eq(inventory.productId, productId),
      ...(delta < 0 ? [gte(inventory.availableBoxes, -delta)] : []),
    ))
    .returning({ availableBoxes: inventory.availableBoxes });
  if (!updated) throw new Error("INVENTORY_CONFLICT");
  return { before: updated.availableBoxes - delta, after: updated.availableBoxes };
}
