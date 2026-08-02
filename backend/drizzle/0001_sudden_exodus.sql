CREATE TABLE "school_audit_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"date_of_audit" varchar(50) NOT NULL,
	"auditor_name" varchar(255) NOT NULL,
	"responses" jsonb NOT NULL,
	"critical_non_compliance" jsonb,
	"strengths" text,
	"areas_of_improvement" text,
	"corrective_actions" text,
	"recommendations" text,
	"overall_score" integer,
	"safe_grade" varchar(50),
	"accreditation_status" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_mental_health_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" varchar(50) NOT NULL,
	"responses" jsonb NOT NULL,
	"total_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_audit_checklists" ADD CONSTRAINT "school_audit_checklists_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_mental_health_assessments" ADD CONSTRAINT "student_mental_health_assessments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;