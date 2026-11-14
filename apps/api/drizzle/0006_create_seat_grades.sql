CREATE TABLE "seat_grade_assignments" (
	"show_id" integer NOT NULL,
	"seat_id" integer NOT NULL,
	"seat_grade_id" integer NOT NULL,
	CONSTRAINT "seat_grade_assignments_show_id_seat_id_pk" PRIMARY KEY("show_id","seat_id")
);
--> statement-breakpoint
CREATE TABLE "seat_grades" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seat_grades_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"show_id" integer NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	CONSTRAINT "seat_grades_show_id_name_unique" UNIQUE("show_id","name"),
	CONSTRAINT "seat_grades_id_show_id_unique" UNIQUE("id","show_id")
);
--> statement-breakpoint
ALTER TABLE "seat_grade_assignments" ADD CONSTRAINT "seat_grade_assignments_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_grade_assignments" ADD CONSTRAINT "seat_grade_assignments_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_grade_assignments" ADD CONSTRAINT "seat_grade_assignments_seat_grade_fk" FOREIGN KEY ("seat_grade_id","show_id") REFERENCES "public"."seat_grades"("id","show_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_grades" ADD CONSTRAINT "seat_grades_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;