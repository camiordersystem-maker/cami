-- system_settings: 会社情報・インボイス設定などをDBで管理
CREATE TABLE IF NOT EXISTS "system_settings" (
  "id" text PRIMARY KEY DEFAULT 'singleton',
  "company_name" text NOT NULL DEFAULT '',
  "company_postal_code" text NOT NULL DEFAULT '',
  "company_address" text NOT NULL DEFAULT '',
  "company_tel" text NOT NULL DEFAULT '',
  "company_email" text NOT NULL DEFAULT '',
  "invoice_registration_no" text NOT NULL DEFAULT '',
  "support_email" text NOT NULL DEFAULT '',
  "low_stock_threshold" integer NOT NULL DEFAULT 10,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" text
);

-- seed default row
INSERT INTO "system_settings" ("id") VALUES ('singleton') ON CONFLICT ("id") DO NOTHING;
