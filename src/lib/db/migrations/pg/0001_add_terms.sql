CREATE TABLE IF NOT EXISTS "terms" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL DEFAULT '',
	"is_published" boolean NOT NULL DEFAULT false,
	"published_at" timestamp,
	"version" integer NOT NULL DEFAULT 1,
	"created_at" timestamp NOT NULL DEFAULT now(),
	"updated_at" timestamp NOT NULL DEFAULT now(),
	"updated_by" text NOT NULL DEFAULT 'system'
);
