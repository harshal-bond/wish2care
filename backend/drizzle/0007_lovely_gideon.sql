CREATE TABLE "otp_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"otp_code" varchar(10) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_phone_unique" UNIQUE("phone");
