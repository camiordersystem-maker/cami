-- Add cancel_requested to order_status enum
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'cancel_requested';

-- Add new columns to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_fee" integer NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cancel_before_status" text;

-- notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" text PRIMARY KEY,
  "member_id" text NOT NULL REFERENCES "members"("id"),
  "type" text NOT NULL,
  "message" text NOT NULL,
  "order_id" text REFERENCES "orders"("id"),
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

-- announcements table
CREATE TABLE IF NOT EXISTS "announcements" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "type" text NOT NULL DEFAULT 'all',
  "target_member_id" text REFERENCES "members"("id"),
  "created_by" text NOT NULL REFERENCES "admins"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz
);

-- announcement_reads table
CREATE TABLE IF NOT EXISTS "announcement_reads" (
  "id" text PRIMARY KEY,
  "announcement_id" text NOT NULL REFERENCES "announcements"("id"),
  "member_id" text NOT NULL REFERENCES "members"("id"),
  "read_at" timestamptz NOT NULL DEFAULT now()
);
