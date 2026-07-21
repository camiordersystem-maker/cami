-- Feature flags: superadmin-controlled on/off switches for optional features

CREATE TABLE IF NOT EXISTS "feature_flags" (
  "key" text PRIMARY KEY,
  "enabled" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" text
);

INSERT INTO "feature_flags" ("key", "enabled") VALUES
  ('payment_overdue_alerts', false),
  ('quick_reorder', false),
  ('invoice_pdf_email', false),
  ('csv_bulk_order', false),
  ('low_stock_badge', false),
  ('announcement_email', false),
  ('member_order_csv_export', false)
ON CONFLICT ("key") DO NOTHING;
