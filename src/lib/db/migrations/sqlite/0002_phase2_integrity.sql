ALTER TABLE `orders` ADD `delivered_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `last_status_changed_at` integer;--> statement-breakpoint
ALTER TABLE `orders` ADD `last_status_changed_by` text;--> statement-breakpoint
CREATE TABLE `inventory_movements` (
  `id` text PRIMARY KEY NOT NULL,
  `product_id` text NOT NULL,
  `order_id` text,
  `movement_type` text NOT NULL,
  `quantity_delta` integer NOT NULL,
  `quantity_before` integer NOT NULL,
  `quantity_after` integer NOT NULL,
  `reason` text NOT NULL,
  `actor_id` text NOT NULL,
  `actor_role` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `inventory_movements_product_idx` ON `inventory_movements` (`product_id`);--> statement-breakpoint
CREATE INDEX `inventory_movements_order_idx` ON `inventory_movements` (`order_id`);--> statement-breakpoint
CREATE TABLE `order_status_histories` (
  `id` text PRIMARY KEY NOT NULL,
  `order_id` text NOT NULL,
  `from_status` text,
  `to_status` text NOT NULL,
  `reason` text,
  `actor_id` text NOT NULL,
  `actor_role` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `order_status_histories_order_idx` ON `order_status_histories` (`order_id`);--> statement-breakpoint
CREATE TABLE `member_terms_consents` (
  `id` text PRIMARY KEY NOT NULL,
  `member_id` text NOT NULL,
  `terms_id` text NOT NULL,
  `version` integer NOT NULL,
  `request_id` text,
  `ip_address` text,
  `agreed_at` integer NOT NULL,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`terms_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX `member_terms_consents_member_terms_unique` ON `member_terms_consents` (`member_id`, `terms_id`);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `user_type` text NOT NULL,
  `user_id` text NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `created_at` integer NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `invoices` (
  `id` text PRIMARY KEY NOT NULL,
  `invoice_no` text NOT NULL,
  `order_id` text NOT NULL,
  `member_id` text NOT NULL,
  `status` text NOT NULL DEFAULT 'draft',
  `issue_date` integer,
  `due_date` integer,
  `subtotal` integer NOT NULL DEFAULT 0,
  `shipping_fee` integer NOT NULL DEFAULT 0,
  `discount` integer NOT NULL DEFAULT 0,
  `adjustment` integer NOT NULL DEFAULT 0,
  `tax_amount` integer NOT NULL DEFAULT 0,
  `total` integer NOT NULL DEFAULT 0,
  `recipient_name` text NOT NULL,
  `recipient_address` text NOT NULL,
  `issuer_name` text NOT NULL,
  `issuer_address` text NOT NULL,
  `issuer_registration_number` text,
  `bank_information` text,
  `notes` text,
  `version` integer NOT NULL DEFAULT 1,
  `issued_at` integer,
  `sent_at` integer,
  `paid_at` integer,
  `cancelled_at` integer,
  `created_by` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_no_unique` ON `invoices` (`invoice_no`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
  `id` text PRIMARY KEY NOT NULL,
  `invoice_id` text NOT NULL,
  `description` text NOT NULL,
  `quantity` integer NOT NULL,
  `unit` text NOT NULL DEFAULT '箱',
  `unit_price` integer NOT NULL,
  `tax_rate` real NOT NULL DEFAULT 0.10,
  `subtotal` integer NOT NULL,
  `sort_order` integer NOT NULL DEFAULT 0,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `payments` (
  `id` text PRIMARY KEY NOT NULL,
  `invoice_id` text NOT NULL,
  `amount` integer NOT NULL,
  `payment_date` integer NOT NULL,
  `method` text NOT NULL,
  `note` text,
  `created_by` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE INDEX `payments_invoice_idx` ON `payments` (`invoice_id`);
