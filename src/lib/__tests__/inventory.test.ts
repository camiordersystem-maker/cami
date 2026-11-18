import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { DB } from "../db";

// Node 22 provides SQLite; keep fixtures independent of native addon builds.
const { DatabaseSync } = createRequire(`${process.cwd()}/package.json`)("node:sqlite") as {
  DatabaseSync: new (path: string) => {
    exec(sql: string): void;
    prepare(sql: string): {
      setReturnArrays(enabled: boolean): void;
      all(...params: unknown[]): unknown[][];
      get(): { available_boxes: number };
    };
    close(): void;
  };
};

async function main() {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const sqlite = new DatabaseSync(":memory:");
  try {
    const { changeInventory } = await import("../inventory");
    sqlite.exec(`CREATE TABLE inventory (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL UNIQUE,
      available_boxes INTEGER NOT NULL CHECK (available_boxes >= 0),
      updated_at INTEGER NOT NULL, updated_by TEXT
    ); INSERT INTO inventory VALUES ('stock', 'oil', 10, 0, NULL);`);
    const tx = drizzle(async (query, params) => {
      const statement = sqlite.prepare(query);
      statement.setReturnArrays(true);
      return { rows: statement.all(...params) };
    }) as unknown as DB;
    // Both calls start before either promise is consumed; each decrement must survive.
    const results = await Promise.all([
      changeInventory(tx, "oil", -3, "member-a"),
      changeInventory(tx, "oil", -4, "member-b"),
    ]);
    assert.deepEqual(results, [{ before: 10, after: 7 }, { before: 7, after: 3 }]);
    await assert.rejects(changeInventory(tx, "oil", -4, "member-c"), /INVENTORY_CONFLICT/);
    assert.deepEqual(await changeInventory(tx, "oil", 2, "admin"), { before: 3, after: 5 });
    await assert.rejects(changeInventory(tx, "missing", 2, "admin"), /INVENTORY_CONFLICT/);
    await assert.rejects(changeInventory(tx, "oil", 0, "admin"), /INVALID_INVENTORY_DELTA/);
    await assert.rejects(changeInventory(tx, "oil", 1.5, "admin"), /INVALID_INVENTORY_DELTA/);
    assert.equal((sqlite.prepare("SELECT available_boxes FROM inventory").get() as { available_boxes: number }).available_boxes, 5);
    console.log("inventory arithmetic and ledger boundaries ok");
  } finally {
    sqlite.close();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  }
}

main().catch((error: unknown) => { throw error; });
