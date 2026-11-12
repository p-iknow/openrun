CREATE TABLE "show_detail_images" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "show_detail_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_id" integer NOT NULL,
	"position" integer NOT NULL,
	"path" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "show_detail_images_show_id_position_unique" UNIQUE("show_id","position")
);
--> statement-breakpoint
ALTER TABLE "show_detail_images" ADD CONSTRAINT "show_detail_images_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;