-- orders table: 消費税・支払い管理・キャンセル理由・メモ
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tax_rate" numeric(4,2) NOT NULL DEFAULT 0.10;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tax_amount" integer NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_status" text NOT NULL DEFAULT 'unpaid';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_due_date" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancel_reason" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "memo" text;

-- inventory_receipts: 入庫履歴
CREATE TABLE IF NOT EXISTS "inventory_receipts" (
  "id" text PRIMARY KEY,
  "product_id" text NOT NULL REFERENCES "products"("id"),
  "boxes" integer NOT NULL,
  "previous_boxes" integer NOT NULL,
  "new_boxes" integer NOT NULL,
  "note" text,
  "received_by" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- monthly_invoices: 締め請求（月次まとめ請求書）
CREATE TABLE IF NOT EXISTS "monthly_invoices" (
  "id" text PRIMARY KEY,
  "invoice_no" text NOT NULL UNIQUE,
  "member_id" text NOT NULL REFERENCES "members"("id"),
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  "subtotal" integer NOT NULL DEFAULT 0,
  "tax_amount" integer NOT NULL DEFAULT 0,
  "total" integer NOT NULL DEFAULT 0,
  "payment_status" text NOT NULL DEFAULT 'unpaid',
  "payment_due_date" timestamptz,
  "note" text,
  "issued_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("member_id", "year", "month")
);
