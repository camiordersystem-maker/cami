-- Feature flags: superadmin-controlled on/off switches for optional features

CREATE TABLE IF NOT EXISTS `feature_flags` (
  `key` text PRIMARY KEY NOT NULL,
  `enabled` integer NOT NULL DEFAULT 0,
  `updated_at` integer NOT NULL,
  `updated_by` text
);
--> statement-breakpoint
INSERT OR IGNORE INTO `feature_flags` (`key`, `enabled`, `updated_at`) VALUES
  ('payment_overdue_alerts', 0, unixepoch()),
  ('quick_reorder', 0, unixepoch()),
  ('invoice_pdf_email', 0, unixepoch()),
  ('csv_bulk_order', 0, unixepoch()),
  ('low_stock_badge', 0, unixepoch()),
  ('announcement_email', 0, unixepoch()),
  ('member_order_csv_export', 0, unixepoch());
