-- Student app login: email-or-student-code + password.
--
-- Hand-written, like 0003-0007. Do not use `drizzle-kit generate` for this
-- repo: meta/ only holds snapshots for 0000-0002, so drizzle diffs against
-- 0002 and emits a migration that recreates the staff table and re-adds
-- every health_records column, all of which already exist in production.

-- Nullable: most students will never have an app account. A row with a null
-- password_hash simply cannot log in.
ALTER TABLE "students" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint

-- Only meaningful once an admin issues a temporary password, so the default
-- is false rather than true — otherwise every existing student would be
-- flagged as owing a password change they can't perform.
ALTER TABLE "students" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- Login looks students up by student_code (already NOT NULL UNIQUE) or by
-- email. This index makes the email lookup fast; it deliberately does NOT
-- enforce uniqueness yet, because production roster data is known to contain
-- duplicate and blank emails. See 0009 for the uniqueness constraint.
CREATE INDEX IF NOT EXISTS "students_email_lower_idx"
  ON "students" (lower("email"))
  WHERE "email" IS NOT NULL AND "email" <> '';
