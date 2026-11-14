-- 구역(sections)을 층(floors)으로 바꾼다. 행과 id는 그대로 두고 이름만 바꾼다.
-- drizzle-kit이 다음 생성 때 스키마와 같다고 보도록 제약, 외래 키, 시퀀스 이름도 기본 이름 규칙대로 바꾼다.
ALTER TABLE "sections" RENAME TO "floors";--> statement-breakpoint
ALTER TABLE "floors" RENAME CONSTRAINT "sections_pkey" TO "floors_pkey";--> statement-breakpoint
ALTER TABLE "floors" RENAME CONSTRAINT "sections_venue_id_name_unique" TO "floors_venue_id_name_unique";--> statement-breakpoint
ALTER TABLE "floors" RENAME CONSTRAINT "sections_venue_id_venues_id_fk" TO "floors_venue_id_venues_id_fk";--> statement-breakpoint
ALTER SEQUENCE "sections_id_seq" RENAME TO "floors_id_seq";--> statement-breakpoint
ALTER TABLE "seats" RENAME COLUMN "section_id" TO "floor_id";--> statement-breakpoint
ALTER TABLE "seats" RENAME CONSTRAINT "seats_section_id_row_number_unique" TO "seats_floor_id_row_number_unique";--> statement-breakpoint
ALTER TABLE "seats" RENAME CONSTRAINT "seats_section_id_sections_id_fk" TO "seats_floor_id_floors_id_fk";
