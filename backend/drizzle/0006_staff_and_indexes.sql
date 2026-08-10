CREATE INDEX IF NOT EXISTS "students_school_id_idx" ON "students" USING btree ("school_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" real NOT NULL,
	"gender" varchar(10) NOT NULL,
	"designation" varchar(255),
	"department" varchar(255),
	"email" varchar(255),
	"mobile_no" varchar(20),
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_staff_code_unique" UNIQUE("staff_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "staff_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"assessment_complete" boolean DEFAULT false NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_assessments_staff_id_unique" UNIQUE("staff_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff" ADD CONSTRAINT "staff_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "staff_assessments" ADD CONSTRAINT "staff_assessments_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_school_id_idx" ON "staff" USING btree ("school_id");
