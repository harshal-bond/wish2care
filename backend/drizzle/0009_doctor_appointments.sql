-- Doctor appointments with Google Meet links.
--
-- Hand-written and consolidated. The gcal branch reached this shape across
-- four migrations (0007-0010), one of which added attendee_email as NOT NULL
-- with no default and would fail against any database that already had
-- bookings. Creating the tables in their final shape avoids that entirely.
--
-- The OTP tables from that branch are deliberately not here: student auth is
-- email-or-code + password, so otp_verifications and students.phone are not
-- needed.

CREATE TABLE IF NOT EXISTS "doctors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"specialization" varchar(255),
	"email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctor_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"slot_minutes" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "doctor_appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"doctor_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"appointment_date" varchar(10) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"status" varchar(20) DEFAULT 'booked' NOT NULL,
	"attendee_email" varchar(255) NOT NULL,
	"meet_link" text,
	"google_event_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp
);--> statement-breakpoint

ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_doctors_id_fk"
  FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_appointments" ADD CONSTRAINT "doctor_appointments_doctor_id_doctors_id_fk"
  FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_appointments" ADD CONSTRAINT "doctor_appointments_student_id_students_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Partial unique index: one booked appointment per doctor/date/time. Cancelled
-- rows are excluded so a cancelled slot can be rebooked.
CREATE UNIQUE INDEX IF NOT EXISTS "doctor_appointments_active_slot_idx"
  ON "doctor_appointments" ("doctor_id","appointment_date","start_time") WHERE status = 'booked';
