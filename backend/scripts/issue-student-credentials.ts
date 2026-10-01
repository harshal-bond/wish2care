/**
 * Issue or reset a student's mobile-app password.
 *
 * There is no admin UI for this yet and no email/SMS provider, so this script
 * is the only way to provision a student. The password is printed once for
 * in-person handover; it is stored only as a bcrypt hash and cannot be read
 * back afterwards. A forgotten password is reissued here, not recovered.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/issue-student-credentials.ts --code STU-0001
 *   DATABASE_URL=... npx tsx scripts/issue-student-credentials.ts --email asha@example.com
 *   DATABASE_URL=... npx tsx scripts/issue-student-credentials.ts --id 7
 *   DATABASE_URL=... npx tsx scripts/issue-student-credentials.ts --school 1 --all   # whole school
 *
 *   --password <value>   use this instead of generating one (min 8 chars)
 *   --csv                print as CSV, for mail-merging handout slips
 */
import 'dotenv/config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const args = process.argv.slice(2);

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
const has = (name: string) => args.includes(`--${name}`);

/** Avoids 0/O and 1/l/I, which get misread off a printed slip. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generatePassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

function die(message: string): never {
  console.error(`\nError: ${message}\n`);
  process.exit(1);
}

const code = flag('code');
const email = flag('email');
const id = flag('id');
const school = flag('school');
const fixedPassword = flag('password');
const asCsv = has('csv');

if (!code && !email && !id && !school) {
  die('Specify one of --code, --email, --id, or --school <id> --all. See the header for usage.');
}
if (school && !has('all')) {
  die('--school provisions every student at that school. Add --all to confirm.');
}
if (fixedPassword && fixedPassword.length < 8) {
  die('--password must be at least 8 characters.');
}
if (fixedPassword && school) {
  die('Refusing to give every student at a school the same password.');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) die('DATABASE_URL is not set.');

const sql = postgres(connectionString, { max: 1 });

type Row = { id: number; student_code: string; name: string; email: string | null };

async function main() {
  let students: Row[];

  if (school) {
    students = await sql<Row[]>`
      SELECT id, student_code, name, email FROM students
      WHERE school_id = ${Number(school)} ORDER BY student_code`;
  } else if (id) {
    students = await sql<Row[]>`
      SELECT id, student_code, name, email FROM students WHERE id = ${Number(id)}`;
  } else if (code) {
    students = await sql<Row[]>`
      SELECT id, student_code, name, email FROM students
      WHERE lower(student_code) = ${code.toLowerCase()}`;
  } else {
    students = await sql<Row[]>`
      SELECT id, student_code, name, email FROM students
      WHERE lower(email) = ${email!.toLowerCase()}`;
    if (students.length > 1) {
      die(
        `${students.length} students share the email ${email}: ` +
          `${students.map((s) => s.student_code).join(', ')}. ` +
          'Reissue by --code instead; they cannot log in by email until the roster is deduplicated.'
      );
    }
  }

  if (students.length === 0) die('No matching student found.');

  const issued: Array<Row & { password: string }> = [];

  for (const student of students) {
    const password = fixedPassword ?? generatePassword();
    const hash = await bcrypt.hash(password, 10);
    await sql`
      UPDATE students
      SET password_hash = ${hash}, must_change_password = true
      WHERE id = ${student.id}`;
    issued.push({ ...student, password });
  }

  if (asCsv) {
    console.log('student_code,name,email,password');
    for (const s of issued) {
      console.log(`${s.student_code},"${s.name}",${s.email ?? ''},${s.password}`);
    }
  } else {
    console.log('');
    for (const s of issued) {
      console.log(`  ${s.student_code}  ${s.name}`);
      console.log(`  login: ${s.email || s.student_code}`);
      console.log(`  password: ${s.password}`);
      console.log('');
    }
  }

  console.error(
    `Issued ${issued.length} credential${issued.length === 1 ? '' : 's'}. ` +
      'Each student must change their password on first sign-in. ' +
      'These values are not recoverable — hand them over now.'
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
