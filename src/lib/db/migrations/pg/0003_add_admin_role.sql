ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'superadmin';
