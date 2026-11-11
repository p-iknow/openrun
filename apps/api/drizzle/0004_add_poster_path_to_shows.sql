-- 개발 DB의 shows 행은 시드로만 들어간다. NOT NULL 컬럼을 더하려고 비우며, 시드를 다시 넣으면 채워진다.
-- CASCADE라 shows를 참조하는 performances와 performance_seats도 함께 비워진다.
TRUNCATE "shows" RESTART IDENTITY CASCADE;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "poster_path" text NOT NULL;
