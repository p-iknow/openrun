DROP INDEX "sections_venue_id_index";--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_venue_id_name_unique" UNIQUE("venue_id","name");