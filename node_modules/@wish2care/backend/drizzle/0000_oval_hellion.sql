CREATE TABLE "health_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"date" varchar(50),
	"height" real,
	"weight" real,
	"undernutrition_class" varchar(50),
	"overweight_class" varchar(50),
	"hb" real,
	"anaemia_class" varchar(50),
	"systolic" real,
	"diastolic" real,
	"bp_class" varchar(50),
	"waist_circumference" real,
	"family_hx_count" integer,
	"metabolic_risk_class" varchar(50),
	"right_eye_acuity" real,
	"left_eye_acuity" real,
	"decayed_teeth_count" integer,
	"wheeze_symptom" varchar(10),
	"measured_pefr" real,
	"predicted_pefr" real,
	"tb_cough" varchar(10),
	"tb_fever" varchar(10),
	"tb_night_sweats" varchar(10),
	"tb_weight_loss" varchar(10),
	"mental_wellbeing_result" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_records_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_code" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" real NOT NULL,
	"gender" varchar(10) NOT NULL,
	"school_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_student_code_unique" UNIQUE("student_code")
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'fieldworker' NOT NULL,
	"assigned_school_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "health_records" ADD CONSTRAINT "health_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_assigned_school_id_schools_id_fk" FOREIGN KEY ("assigned_school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;