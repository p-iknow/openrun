-- 기존 shows 행은 임시 시드 2개뿐이다. NOT NULL 컬럼을 더하려고 비우며, 시드를 다시 넣으면 채워진다.
TRUNCATE "shows" RESTART IDENTITY;--> statement-breakpoint
CREATE TYPE "public"."genre" AS ENUM('musical', 'play', 'concert', 'classical_dance', 'kids_family');--> statement-breakpoint
CREATE TABLE "performances" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "performances_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_id" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"sales_open_at" timestamp with time zone NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "venues_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "venue_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "genre" "genre" NOT NULL;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "min_age" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "running_minutes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "performances" ADD CONSTRAINT "performances_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "performances_show_id_index" ON "performances" USING btree ("show_id");--> statement-breakpoint
ALTER TABLE "shows" ADD CONSTRAINT "shows_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shows_venue_id_index" ON "shows" USING btree ("venue_id");