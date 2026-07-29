-- 請求書発行時点の対象注文を固定するスナップショット。
-- これがないと、発行後に注文ステータスが変わった場合（例: pending→confirmed）、
-- 請求書詳細画面の内訳一覧（動的再集計）と保存済み合計金額が食い違う。

CREATE TABLE IF NOT EXISTS "invoice_orders" (
  "id" text PRIMARY KEY,
  "invoice_id" text NOT NULL REFERENCES "monthly_invoices"("id"),
  "order_id" text NOT NULL REFERENCES "orders"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "invoice_orders_invoice_order_unique" ON "invoice_orders" ("invoice_id", "order_id");
CREATE INDEX IF NOT EXISTS "invoice_orders_invoice_idx" ON "invoice_orders" ("invoice_id");
