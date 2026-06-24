ALTER TABLE `orders` ADD `shipping_fee` integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancel_before_status` text;--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`type` text NOT NULL,
	`message` text NOT NULL,
	`order_id` text,
	`is_read` integer NOT NULL DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`type` text NOT NULL DEFAULT 'all',
	`target_member_id` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer,
	FOREIGN KEY (`target_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `admins`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE TABLE `announcement_reads` (
	`id` text PRIMARY KEY NOT NULL,
	`announcement_id` text NOT NULL,
	`member_id` text NOT NULL,
	`read_at` integer NOT NULL,
	FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
