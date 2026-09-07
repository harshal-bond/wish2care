ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "class_name" varchar(255);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "section" varchar(50);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "students_school_class_section_idx" ON "students" USING btree ("school_id", "class_name", "section");
