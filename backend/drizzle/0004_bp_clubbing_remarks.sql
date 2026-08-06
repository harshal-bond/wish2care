ALTER TABLE "health_records" ADD COLUMN "random_blood_sugar" real;--> statement-breakpoint
ALTER TABLE "health_records" ADD COLUMN "clubbing" varchar(10);--> statement-breakpoint
ALTER TABLE "health_records" ADD COLUMN "yes_no_remarks" jsonb;
