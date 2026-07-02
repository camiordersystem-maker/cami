-- Phase 2 production-readiness integrity tables and expand-only columns

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "delivered_at" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_status_changed_at" timestamptz;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "last_status_changed_by" text;

CREATE TABLE IF NOT EXISTS "inventory_movements" (
  "id" text PRIMARY KEY,
  "product_id" text NOT NULL REFERENCES "products"("id"),
  "order_id" text REFERENCES "orders"("id"),
  "movement_type" text NOT NULL,
  "quantity_delta" integer NOT NULL,
  "quantity_before" integer NOT NULL,
  "quantity_after" integer NOT NULL,
  "reason" text NOT NULL,
  "actor_id" text NOT NULL,
  "actor_role" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "inventory_movements_product_idx" ON "inventory_movements" ("product_id");
CREATE INDEX IF NOT EXISTS "inventory_movements_order_idx" ON "inventory_movements" ("order_id");
CREATE INDEX IF NOT EXISTS "inventory_movements_created_at_idx" ON "inventory_movements" ("created_at");

CREATE TABLE IF NOT EXISTS "order_status_histories" (
  "id" text PRIMARY KEY,
  "order_id" text NOT NULL REFERENCES "orders"("id"),
  "from_status" text,
  "to_status" text NOT NULL,
  "reason" text,
  "actor_id" text NOT NULL,
  "actor_role" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "order_status_histories_order_idx" ON "order_status_histories" ("order_id");

CREATE TABLE IF NOT EXISTS "member_terms_consents" (
  "id" text PRIMARY KEY,
  "member_id" text NOT NULL REFERENCES "members"("id"),
  "terms_id" text NOT NULL REFERENCES "terms"("id"),
  "version" integer NOT NULL,
  "request_id" text,
  "ip_address" text,
  "agreed_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("member_id", "terms_id")
);
CREATE INDEX IF NOT EXISTS "member_terms_consents_member_idx" ON "member_terms_consents" ("member_id");

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" text PRIMARY KEY,
  "user_type" text NOT NULL,
  "user_id" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_idx" ON "password_reset_tokens" ("user_type", "user_id");

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" text PRIMARY KEY,
  "invoice_no" text NOT NULL UNIQUE,
  "order_id" text NOT NULL REFERENCES "orders"("id"),
  "member_id" text NOT NULL REFERENCES "members"("id"),
  "status" text NOT NULL DEFAULT 'draft',
  "issue_date" timestamptz,
  "due_date" timestamptz,
  "subtotal" integer NOT NULL DEFAULT 0,
  "shipping_fee" integer NOT NULL DEFAULT 0,
  "discount" integer NOT NULL DEFAULT 0,
  "adjustment" integer NOT NULL DEFAULT 0,
  "tax_amount" integer NOT NULL DEFAULT 0,
  "total" integer NOT NULL DEFAULT 0,
  "recipient_name" text NOT NULL,
  "recipient_address" text NOT NULL,
  "issuer_name" text NOT NULL,
  "issuer_address" text NOT NULL,
  "issuer_registration_number" text,
  "bank_information" text,
  "notes" text,
  "version" integer NOT NULL DEFAULT 1,
  "issued_at" timestamptz,
  "sent_at" timestamptz,
  "paid_at" timestamptz,
  "cancelled_at" timestamptz,
  "created_by" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "invoices_order_idx" ON "invoices" ("order_id");
CREATE INDEX IF NOT EXISTS "invoices_member_idx" ON "invoices" ("member_id");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices" ("status");

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" text PRIMARY KEY,
  "invoice_id" text NOT NULL REFERENCES "invoices"("id"),
  "description" text NOT NULL,
  "quantity" integer NOT NULL,
  "unit" text NOT NULL DEFAULT '箱',
  "unit_price" integer NOT NULL,
  "tax_rate" numeric(4,2) NOT NULL DEFAULT 0.10,
  "subtotal" integer NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" text PRIMARY KEY,
  "invoice_id" text NOT NULL REFERENCES "invoices"("id"),
  "amount" integer NOT NULL,
  "payment_date" timestamptz NOT NULL,
  "method" text NOT NULL,
  "note" text,
  "created_by" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "payments_invoice_idx" ON "payments" ("invoice_id");
