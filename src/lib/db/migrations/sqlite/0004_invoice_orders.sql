CREATE TABLE `invoice_orders` (
  `id` text PRIMARY KEY NOT NULL,
  `invoice_id` text NOT NULL,
  `order_id` text NOT NULL,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `monthly_invoices`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_orders_invoice_order_unique` ON `invoice_orders` (`invoice_id`,`order_id`);--> statement-breakpoint
CREATE INDEX `invoice_orders_invoice_idx` ON `invoice_orders` (`invoice_id`);
