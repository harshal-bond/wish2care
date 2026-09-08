/**
 * Backfill students.class_name and students.section from source files in docs/
 * (Excel, Word DOCX, PDF).
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/backfill-class-section.ts           # dry-run (default)
 *   DATABASE_URL=... npx tsx scripts/backfill-class-section.ts --apply  # apply in transaction
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import {
  deriveClassFromFilename,
  dedupeSourceFiles,
  normalizeMobile,
  orderedCodeCandidates,
  parseSourceFile,
  type ParsedRow,
} from './lib/parseStudentSources.js';

const DOCS_DIR = join(import.meta.dirname, '../../docs');
const APPLY = process.argv.includes('--apply');
const SOURCE_EXTS = ['.xlsx', '.docx', '.pdf'];

interface DbStudent {
  id: number;
  student_code: string;
  mobile_no: string | null;
  father_mobile_no: string | null;
  class_name: string | null;
  section: string | null;
}

interface MatchResult {
  file: string;
  rowNumber: number;
  roll: string;
  studentCode: string;
  className: string;
  section: string | null;
  studentId: number;
  dbStudentCode: string;
  matchMethod: string;
}

interface UnmatchedRow {
  file: string;
  rowNumber: number;
  roll: string;
  studentCode: string;
  mobile: string;
  reason: string;
}

interface AmbiguousRow {
  file: string;
  rowNumber: number;
  roll: string;
  candidates: string[];
  reason: string;
}

function buildStudentIndexes(students: DbStudent[]) {
  const byCode = new Map<string, DbStudent[]>();
  const byMobile = new Map<string, DbStudent[]>();

  for (const s of students) {
    const codeKey = s.student_code.trim().toUpperCase();
    if (!byCode.has(codeKey)) byCode.set(codeKey, []);
    byCode.get(codeKey)!.push(s);

    for (const m of [s.mobile_no, s.father_mobile_no]) {
      if (!m) continue;
      const mobileKey = normalizeMobile(m);
      if (mobileKey.length < 10) continue;
      if (!byMobile.has(mobileKey)) byMobile.set(mobileKey, []);
      byMobile.get(mobileKey)!.push(s);
    }
  }

  return { byCode, byMobile };
}

function resolveMatch(
  row: ParsedRow,
  indexes: ReturnType<typeof buildStudentIndexes>
): { student: DbStudent; method: string } | { ambiguous: string[]; reason: string } | null {
  const altCode = row.studentCode && row.studentCode !== row.roll ? row.studentCode : undefined;
  const ordered = orderedCodeCandidates(row.roll, altCode);

  for (const code of ordered) {
    const hits = indexes.byCode.get(code.toUpperCase()) || [];
    if (hits.length === 1) {
      return { student: hits[0], method: `student_code:${code}` };
    }
    if (hits.length > 1) {
      const mobileKey = normalizeMobile(row.mobile);
      if (mobileKey.length === 10) {
        const mobileHits = hits.filter((s) => {
          const m1 = s.mobile_no ? normalizeMobile(s.mobile_no) : '';
          const m2 = s.father_mobile_no ? normalizeMobile(s.father_mobile_no) : '';
          return m1 === mobileKey || m2 === mobileKey;
        });
        if (mobileHits.length === 1) {
          return { student: mobileHits[0], method: `student_code+mobile:${mobileHits[0].student_code}` };
        }
      }
    }
  }

  const mobileKey = normalizeMobile(row.mobile);
  if (mobileKey.length === 10) {
    const mobileHits = indexes.byMobile.get(mobileKey) || [];
    if (mobileHits.length === 1) {
      return { student: mobileHits[0], method: `mobile:${mobileHits[0].student_code}` };
    }
    if (mobileHits.length > 1) {
      return {
        ambiguous: mobileHits.map((s) => s.student_code),
        reason: `Multiple students share mobile ${row.mobile}`,
      };
    }
  }

  const allHits: DbStudent[] = [];
  const seen = new Set<number>();
  for (const code of ordered) {
    for (const s of indexes.byCode.get(code.toUpperCase()) || []) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        allHits.push(s);
      }
    }
  }
  if (allHits.length > 1) {
    return {
      ambiguous: allHits.map((s) => s.student_code),
      reason: `Multiple students match codes [${ordered.join(', ')}]`,
    };
  }

  return null;
}

function isSourceFile(name: string): boolean {
  const lower = name.toLowerCase();
  return SOURCE_EXTS.some((ext) => lower.endsWith(ext));
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  const files = dedupeSourceFiles(readdirSync(DOCS_DIR).filter(isSourceFile).sort());

  const dbStudents = await sql<DbStudent[]>`
    SELECT id, student_code, mobile_no, father_mobile_no, class_name, section
    FROM students
  `;
  const indexes = buildStudentIndexes(dbStudents);
  const totalBefore = dbStudents.length;

  const matches: MatchResult[] = [];
  const unmatched: UnmatchedRow[] = [];
  const ambiguous: AmbiguousRow[] = [];
  const fileSummaries: Array<{
    file: string;
    totalRows: number;
    className: string;
    defaultSection: string | null;
    matched: number;
    unmatched: number;
    ambiguous: number;
  }> = [];

  const proposedByStudent = new Map<number, { className: string; section: string | null; sources: string[] }>();

  for (const file of files) {
    const filePath = join(DOCS_DIR, file);
    const parsed = await parseSourceFile(filePath, file);
    const meta = deriveClassFromFilename(file, parsed.sheetSectionHint, parsed.bodyText);
    const { rows } = parsed;

    let fileMatched = 0;
    let fileUnmatched = 0;
    let fileAmbiguous = 0;

    for (const row of rows) {
      const className = row.classNameOverride || meta.className;
      const section = row.section || meta.defaultSection;
      const resolved = resolveMatch(row, indexes);

      if (!resolved) {
        fileUnmatched++;
        unmatched.push({
          file,
          rowNumber: row.rowNumber,
          roll: row.roll,
          studentCode: row.studentCode,
          mobile: row.mobile,
          reason: 'No confident student_code or mobile match',
        });
        continue;
      }

      if ('ambiguous' in resolved) {
        fileAmbiguous++;
        ambiguous.push({
          file,
          rowNumber: row.rowNumber,
          roll: row.roll,
          candidates: resolved.ambiguous,
          reason: resolved.reason,
        });
        continue;
      }

      const { student, method } = resolved;
      const existing = proposedByStudent.get(student.id);
      if (existing) {
        if (existing.className !== className || existing.section !== section) {
          fileAmbiguous++;
          ambiguous.push({
            file,
            rowNumber: row.rowNumber,
            roll: row.roll,
            candidates: [student.student_code],
            reason: `Conflicting assignment: already ${existing.className}/${existing.section ?? 'NULL'} from ${existing.sources.join(', ')}; proposed ${className}/${section ?? 'NULL'}`,
          });
          continue;
        }
      } else {
        proposedByStudent.set(student.id, {
          className,
          section,
          sources: [`${file}#${row.rowNumber}`],
        });
      }

      if (
        student.class_name &&
        student.section &&
        student.class_name === className &&
        student.section === section
      ) {
        fileMatched++;
        continue;
      }

      if (student.class_name && student.class_name !== className) {
        fileAmbiguous++;
        ambiguous.push({
          file,
          rowNumber: row.rowNumber,
          roll: row.roll,
          candidates: [student.student_code],
          reason: `DB already has class_name=${student.class_name}, proposed ${className}`,
        });
        proposedByStudent.delete(student.id);
        continue;
      }

      fileMatched++;
      matches.push({
        file,
        rowNumber: row.rowNumber,
        roll: row.roll,
        studentCode: row.studentCode,
        className,
        section,
        studentId: student.id,
        dbStudentCode: student.student_code,
        matchMethod: method,
      });
    }

    fileSummaries.push({
      file,
      totalRows: rows.length,
      className: meta.className,
      defaultSection: meta.defaultSection,
      matched: fileMatched,
      unmatched: fileUnmatched,
      ambiguous: fileAmbiguous,
    });
  }

  const groupCounts = new Map<string, number>();
  for (const m of matches) {
    const key = `${m.className} | section: ${m.section ?? '(none)'}`;
    groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
  }

  const xlsxCount = files.filter((f) => f.toLowerCase().endsWith('.xlsx')).length;
  const docxCount = files.filter((f) => f.toLowerCase().endsWith('.docx')).length;
  const pdfCount = files.filter((f) => f.toLowerCase().endsWith('.pdf')).length;

  console.log('\n========== DRY-RUN REPORT ==========\n');
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`Source files: ${files.length} (${xlsxCount} xlsx, ${docxCount} docx, ${pdfCount} pdf)`);
  console.log(`DB students (before): ${totalBefore}\n`);

  console.log('--- Per file ---');
  for (const s of fileSummaries) {
    console.log(
      `${s.file}: rows=${s.totalRows}, matched=${s.matched}, unmatched=${s.unmatched}, ambiguous=${s.ambiguous} → class="${s.className}" section=${s.defaultSection ?? 'from row/null'}`
    );
  }

  console.log('\n--- Proposed class/section groups ---');
  for (const [key, count] of [...groupCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count} students → ${key}`);
  }

  console.log(`\n--- Summary ---`);
  console.log(`Confident updates: ${matches.length}`);
  console.log(`Unmatched rows: ${unmatched.length}`);
  console.log(`Ambiguous rows: ${ambiguous.length}`);

  if (unmatched.length > 0) {
    console.log('\n--- Sample unmatched (up to 15) ---');
    for (const u of unmatched.slice(0, 15)) {
      console.log(`  ${u.file}#${u.rowNumber} roll=${u.roll} code=${u.studentCode} mobile=${u.mobile} — ${u.reason}`);
    }
  }

  if (ambiguous.length > 0) {
    console.log('\n--- Sample ambiguous (up to 15) ---');
    for (const a of ambiguous.slice(0, 15)) {
      console.log(`  ${a.file}#${a.rowNumber} roll=${a.roll} — ${a.reason} [${a.candidates.join(', ')}]`);
    }
  }

  if (!APPLY) {
    console.log('\nDry-run complete. Pass --apply to execute updates in a transaction.');
    await sql.end();
    return;
  }

  console.log('\n--- Applying updates in transaction ---');
  await sql.begin(async (tx) => {
    for (const m of matches) {
      await tx`
        UPDATE students
        SET class_name = ${m.className}, section = ${m.section}
        WHERE id = ${m.studentId}
      `;
    }
  });

  const byClass = await sql`SELECT class_name, COUNT(*)::int AS cnt FROM students GROUP BY class_name ORDER BY cnt DESC`;
  const byClassSection = await sql`
    SELECT class_name, section, COUNT(*)::int AS cnt
    FROM students
    GROUP BY class_name, section
    ORDER BY class_name, section
  `;
  const nullClass = await sql`SELECT COUNT(*)::int AS cnt FROM students WHERE class_name IS NULL`;
  const nullSection = await sql`SELECT COUNT(*)::int AS cnt FROM students WHERE section IS NULL`;
  const totalAfter = await sql`SELECT COUNT(*)::int AS cnt FROM students`;
  const conflicts = await sql`
    SELECT student_code, class_name, section, COUNT(*)::int AS cnt
    FROM students
    WHERE class_name IS NOT NULL
    GROUP BY student_code, class_name, section
    HAVING COUNT(*) > 1
  `;

  console.log('\n--- Verification ---');
  console.log('Count by class_name:', byClass);
  console.log('Count by class_name + section:', byClassSection);
  console.log('NULL class_name:', nullClass[0].cnt);
  console.log('NULL section:', nullSection[0].cnt);
  console.log('Total students:', totalAfter[0].cnt, `(before: ${totalBefore})`);
  console.log('Duplicate code conflicts:', conflicts);

  await sql.end();
  console.log('\nBackfill complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
