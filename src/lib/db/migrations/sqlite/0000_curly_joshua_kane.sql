CREATE TABLE `admins` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL DEFAULT 'superadmin',
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admins_email_idx` ON `admins` (`email`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	`before_value` text,
	`after_value` text,
	`ip_address` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`available_boxes` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inventory_product_id_unique` ON `inventory` (`product_id`);--> statement-breakpoint
CREATE TABLE `member_ranks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rate` real NOT NULL,
	`min_monthly_boxes` integer DEFAULT 0 NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_ranks_name_unique` ON `member_ranks` (`name`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`company_name` text NOT NULL,
	`contact_name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`business_description` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`rank_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`rank_id`) REFERENCES `member_ranks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_idx` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`boxes` integer NOT NULL,
	`bottles_per_box` integer NOT NULL,
	`unit_price_per_box` integer NOT NULL,
	`rate_applied` real NOT NULL,
	`subtotal` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_no` text NOT NULL,
	`member_id` text NOT NULL,
	`shipping_address_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`subtotal` integer NOT NULL,
	`tax_rate` real NOT NULL DEFAULT 0.10,
	`tax_amount` integer NOT NULL DEFAULT 0,
	`total` integer NOT NULL,
	`payment_status` text NOT NULL DEFAULT 'unpaid',
	`payment_due_date` integer,
	`tracking_number` text,
	`cancel_reason` text,
	`memo` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`shipping_address_id`) REFERENCES `shipping_addresses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_order_no_unique` ON `orders` (`order_no`);--> statement-breakpoint
CREATE INDEX `orders_member_id_idx` ON `orders` (`member_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`image_url` text,
	`retail_price` integer DEFAULT 3880 NOT NULL,
	`bottles_per_box` integer DEFAULT 24 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shipping_addresses` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`label` text NOT NULL,
	`recipient_name` text NOT NULL,
	`postal_code` text NOT NULL,
	`prefecture` text NOT NULL,
	`address1` text NOT NULL,
	`address2` text,
	`phone` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `terms` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL DEFAULT '',
	`is_published` integer NOT NULL DEFAULT false,
	`published_at` integer,
	`version` integer NOT NULL DEFAULT 1,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`updated_by` text NOT NULL DEFAULT 'system'
);
--> statement-breakpoint
CREATE TABLE `inventory_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`boxes` integer NOT NULL,
	`previous_boxes` integer NOT NULL,
	`new_boxes` integer NOT NULL,
	`note` text,
	`received_by` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `monthly_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_no` text NOT NULL,
	`member_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL,
	`subtotal` integer NOT NULL DEFAULT 0,
	`tax_amount` integer NOT NULL DEFAULT 0,
	`total` integer NOT NULL DEFAULT 0,
	`payment_status` text NOT NULL DEFAULT 'unpaid',
	`payment_due_date` integer,
	`note` text,
	`issued_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_invoices_invoice_no_unique` ON `monthly_invoices` (`invoice_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_invoices_member_year_month_unique` ON `monthly_invoices` (`member_id`, `year`, `month`);--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` text PRIMARY KEY NOT NULL DEFAULT 'singleton',
	`company_name` text NOT NULL DEFAULT '',
	`company_postal_code` text NOT NULL DEFAULT '',
	`company_address` text NOT NULL DEFAULT '',
	`company_tel` text NOT NULL DEFAULT '',
	`company_email` text NOT NULL DEFAULT '',
	`invoice_registration_no` text NOT NULL DEFAULT '',
	`support_email` text NOT NULL DEFAULT '',
	`low_stock_threshold` integer NOT NULL DEFAULT 10,
	`updated_at` integer NOT NULL,
	`updated_by` text
);
