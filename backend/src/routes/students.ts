import { Hono } from 'hono';
import type { Context } from 'hono';
import { db } from '../db/index.js';
import { students, healthRecords, schools, studentMentalHealthAssessments } from '../db/schema.js';
import { authMiddleware, requireAdmin, requireWorker, requireOwnStudentId } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { issueStudentCredentialsSchema } from '@wish2care/shared';
import type { WorkerPayload } from '../middleware/auth.js';
import {
  studentSchema,
  studentMentalHealthSchema,
  nameMatchesQuery,
  firstSearchToken,
  normalizeAppetiteValue,
} from '@wish2care/shared';
import { eq, ilike, or, and, desc, count, sql } from 'drizzle-orm';
import { generateStudentCode } from '../lib/studentCode.js';
import { completedDomainsSql, physicalCompleteSql, mentalCompleteSql, caseCompleteSql, caseStartedSql } from '../lib/listStatusSql.js';
import { z } from 'zod';

export const studentsRoutes = new Hono();

studentsRoutes.use('/*', authMiddleware);

const studentDemographicsSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.coerce.number().min(1).max(100).optional(),
  gender: z.enum(['M', 'F']).optional(),
});

/**
 * Narrows the token to a worker. Every caller sits behind requireWorker, so
 * this never throws in practice — but it throws rather than returning the
 * union so that removing a guard surfaces as a 500, not as a fieldworker
 * silently receiving every school's students.
 */
function workerUser(c: Context): WorkerPayload {
  const user = c.get('user');
  if (user.role === 'student') {
    throw new Error('worker-only route reached by a student token');
  }
  return user;
}

function buildListConditions(user: WorkerPayload, search?: string, schoolId?: string, status?: string, className?: string, section?: string) {
  const conditions = [];

  if (user.role === 'fieldworker' && user.assignedSchoolId) {
    conditions.push(eq(students.schoolId, user.assignedSchoolId));
  } else if (schoolId) {
    conditions.push(eq(students.schoolId, parseInt(schoolId, 10)));
  }

  if (className) {
    conditions.push(eq(students.className, className));
  }

  if (section) {
    conditions.push(eq(students.section, section));
  }

  if (search) {
    const token = firstSearchToken(search);
    const searchPattern = `%${search.trim()}%`;
    if (token) {
      conditions.push(
        or(
          ilike(students.name, `%${token}%`),
          ilike(students.studentCode, searchPattern)
        )
      );
    } else {
      conditions.push(ilike(students.studentCode, searchPattern));
    }
  }

  if (status === 'complete') {
    conditions.push(sql`${caseCompleteSql} = true`);
  } else if (status === 'in_progress') {
    conditions.push(sql`${caseStartedSql} = true AND ${caseCompleteSql} = false`);
  } else if (status === 'not_started') {
    conditions.push(sql`${caseStartedSql} = false`);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function mapSlimRow(row: {
  id: number;
  name: string;
  studentCode: string;
  age: number;
  gender: string;
  className: string | null;
  section: string | null;
  schoolId: number;
  schoolName: string | null;
  hrUpdatedAt: Date | null;
  completedDomains: number | null;
  screeningComplete: boolean | null;
  mentalAssessmentComplete: boolean | null;
  caseComplete: boolean | null;
}) {
  const completedDomains = row.completedDomains ?? 0;
  const screeningComplete = row.screeningComplete === true;
  const mentalAssessmentComplete = row.mentalAssessmentComplete === true;
  const isComplete = row.caseComplete === true;
  return {
    id: row.id,
    name: row.name,
    studentCode: row.studentCode,
    age: row.age,
    gender: row.gender,
    className: row.className,
    section: row.section,
    schoolId: row.schoolId,
    school: row.schoolName ? { id: row.schoolId, name: row.schoolName } : null,
    healthRecord: row.hrUpdatedAt ? { updatedAt: row.hrUpdatedAt } : null,
    _status: {
      completedDomains,
      screeningComplete,
      mentalAssessmentComplete,
      isComplete,
    },
  };
}

async function querySlimStudentList(
  whereClause: ReturnType<typeof and> | undefined,
  opts?: { limit?: number; offset?: number; orderByUpdated?: boolean }
) {
  let query = db
    .select({
      id: students.id,
      name: students.name,
      studentCode: students.studentCode,
      age: students.age,
      gender: students.gender,
      className: students.className,
      section: students.section,
      schoolId: students.schoolId,
      schoolName: schools.name,
      hrUpdatedAt: healthRecords.updatedAt,
      completedDomains: completedDomainsSql,
      screeningComplete: physicalCompleteSql,
      mentalAssessmentComplete: mentalCompleteSql,
      caseComplete: caseCompleteSql,
    })
    .from(students)
    .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
    .leftJoin(schools, eq(students.schoolId, schools.id))
    .where(whereClause)
    .$dynamic();

  if (opts?.orderByUpdated) {
    query = query.orderBy(sql`${healthRecords.updatedAt} desc nulls last`);
  } else {
    query = query.orderBy(students.name);
  }
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.offset(opts.offset);

  return query;
}

function applyTokenSearch<T extends { name: string; studentCode: string }>(items: T[], search?: string): T[] {
  if (!search?.trim()) return items;
  const q = search.trim();
  return items.filter(
    (s) =>
      nameMatchesQuery(s.name, q) ||
      s.studentCode.toLowerCase().includes(q.toLowerCase())
  );
}

/** Unbounded student count — never use a list page length for this. */
async function countStudents(whereClause: ReturnType<typeof and> | undefined, needsHealthJoin: boolean) {
  const query = needsHealthJoin
    ? db
        .select({ total: count() })
        .from(students)
        .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
        .where(whereClause)
    : db.select({ total: count() }).from(students).where(whereClause);
  const [row] = await query;
  return Number(row?.total) || 0;
}

function parsePageLimit(raw: string | undefined): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(n, 10_000);
}

studentsRoutes.get('/summary', requireWorker, async (c) => {
  const user = workerUser(c);
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');
  const status = c.req.query('status') || undefined;
  const className = c.req.query('className') || undefined;
  const section = c.req.query('section') || undefined;
  const limit = parsePageLimit(c.req.query('limit'));
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10) || 0, 0);

  try {
    const whereClause = buildListConditions(user, search, schoolId, status, className, section);
    const results = await querySlimStudentList(whereClause, { limit, offset });
    let mapped = results.map(mapSlimRow);
    mapped = applyTokenSearch(mapped, search);

    const total = await countStudents(whereClause, Boolean(status));

    return c.json({
      success: true,
      data: mapped,
      total,
      hasMore: limit != null && offset + mapped.length < total,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/stats', requireWorker, async (c) => {
  const user = workerUser(c);
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');
  const className = c.req.query('className') || undefined;
  const section = c.req.query('section') || undefined;

  try {
    const whereClause = buildListConditions(user, search, schoolId, undefined, className, section);
    const total = await countStudents(whereClause, false);

    let completed = 0;
    let inProgress = 0;
    try {
      const [agg] = await db
        .select({
          completed: sql<number>`coalesce(count(*) filter (where ${caseCompleteSql}), 0)`.mapWith(Number),
          inProgress: sql<number>`coalesce(count(*) filter (where ${caseStartedSql} and not coalesce(${caseCompleteSql}, false)), 0)`.mapWith(Number),
        })
        .from(students)
        .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
        .where(whereClause);
      completed = Number(agg?.completed) || 0;
      inProgress = Number(agg?.inProgress) || 0;
    } catch (err) {
      console.error('[stats] status breakdown failed, returning total only:', err);
    }

    const recentRows = await querySlimStudentList(whereClause, { limit: 8, orderByUpdated: true });

    return c.json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        pending: Math.max(0, total - completed - inProgress),
        recent: recentRows.map(mapSlimRow),
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/', requireWorker, async (c) => {
  const user = workerUser(c);
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');
  const className = c.req.query('className') || undefined;
  const section = c.req.query('section') || undefined;

  try {
    const whereClause = buildListConditions(user, search, schoolId, undefined, className, section);
    const results = await querySlimStudentList(whereClause);
    let mappedResults = results.map(mapSlimRow);
    mappedResults = applyTokenSearch(mappedResults, search);

    return c.json({ success: true, data: mappedResults });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/mental-health/all', requireAdmin, async (c) => {
  try {
    const studentsWithData = await db
      .select({
        id: students.id,
        name: students.name,
        studentCode: students.studentCode,
        age: students.age,
        gender: students.gender,
        schoolId: students.schoolId,
        school: schools,
        chronicDisease: healthRecords.chronicDisease,
        weightLoss: healthRecords.weightLoss,
        poorAppetite: healthRecords.poorAppetite,
      })
      .from(students)
      .leftJoin(schools, eq(schools.id, students.schoolId))
      .leftJoin(healthRecords, eq(healthRecords.studentId, students.id));

    const allAssessments = await db
      .select({
        id: studentMentalHealthAssessments.id,
        studentId: studentMentalHealthAssessments.studentId,
        date: studentMentalHealthAssessments.date,
        totalScore: studentMentalHealthAssessments.totalScore,
      })
      .from(studentMentalHealthAssessments)
      .orderBy(desc(studentMentalHealthAssessments.createdAt));

    const assessmentsByStudent = allAssessments.reduce((acc: Record<number, any[]>, a) => {
      if (!acc[a.studentId]) acc[a.studentId] = [];
      acc[a.studentId].push(a);
      return acc;
    }, {});

    const result = studentsWithData.map((row) => ({
      id: row.id,
      name: row.name,
      studentCode: row.studentCode,
      age: row.age,
      gender: row.gender,
      schoolId: row.schoolId,
      school: row.school,
      healthRecord: {
        chronicDisease: row.chronicDisease,
        weightLoss: row.weightLoss,
        poorAppetite: row.poorAppetite,
      },
      mentalHealthAssessments: assessmentsByStudent[row.id] || [],
    }));

    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/class-sections', requireWorker, async (c) => {
  const user = workerUser(c);
  const schoolId = c.req.query('schoolId');

  try {
    const whereClause = buildListConditions(user, undefined, schoolId);
    const countRows = await db
      .select({
        className: students.className,
        section: students.section,
        cnt: count(),
      })
      .from(students)
      .where(whereClause)
      .groupBy(students.className, students.section);

    const classNames = [...new Set(countRows.map((r) => r.className).filter(Boolean))].sort() as string[];
    const sections = [...new Set(countRows.map((r) => r.section).filter(Boolean))].sort() as string[];

    const grouped = new Map<string, string[]>();
    const countsByClass: Record<string, number> = {};
    const countsByClassSection: Record<string, Record<string, number>> = {};
    const countsBySection: Record<string, number> = {};

    for (const row of countRows) {
      const cnt = Number(row.cnt) || 0;
      if (row.className) {
        countsByClass[row.className] = (countsByClass[row.className] || 0) + cnt;
        if (!countsByClassSection[row.className]) countsByClassSection[row.className] = {};
        if (row.section) {
          countsByClassSection[row.className][row.section] =
            (countsByClassSection[row.className][row.section] || 0) + cnt;
        }
        if (!grouped.has(row.className)) grouped.set(row.className, []);
        if (row.section && !grouped.get(row.className)!.includes(row.section)) {
          grouped.get(row.className)!.push(row.section);
        }
      }
      if (row.section) {
        countsBySection[row.section] = (countsBySection[row.section] || 0) + cnt;
      }
    }
    for (const [key, secs] of grouped) {
      grouped.set(key, secs.sort());
    }

    return c.json({
      success: true,
      data: {
        classNames,
        sections,
        sectionsByClass: Object.fromEntries(grouped),
        countsByClass,
        countsByClassSection,
        countsBySection,
      },
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/:id', requireOwnStudentId('id'), async (c) => {
  const id = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  const rows = await db.select({
    student: students,
    healthRecord: healthRecords,
    school: schools,
  })
  .from(students)
  .leftJoin(healthRecords, eq(healthRecords.studentId, students.id))
  .leftJoin(schools, eq(schools.id, students.schoolId))
  .where(eq(students.id, id));

  if (rows.length === 0) return c.json({ success: false, error: 'Student not found' }, 404);
  
  const row = rows[0];
  const hr = row.healthRecord
    ? {
        ...row.healthRecord,
        poorAppetite: normalizeAppetiteValue(row.healthRecord.poorAppetite),
      }
    : null;

  // Never let the hash or the temporary password reach a client: `...row.student`
  // would otherwise spread both, including to the student's own mobile app.
  const { passwordHash, tempPassword, ...safeStudent } = row.student;
  const user = c.get('user');
  const isWorker = user.role !== 'student';

  return c.json({ 
    success: true, 
    data: {
      ...safeStudent,
      // Workers need to know whether an app login exists, whether the student
      // has activated it, and - until they do - what to read out to them.
      ...(isWorker
        ? {
            credentials: {
              hasAccount: passwordHash !== null,
              activated: passwordHash !== null && !row.student.mustChangePassword,
              // Cleared the moment the student picks their own password.
              tempPassword: row.student.mustChangePassword ? tempPassword : null,
            },
          }
        : {}),
      school: row.school || null,
      healthRecord: hr,
    }
  });
});

studentsRoutes.patch('/:id', requireWorker, async (c) => {
  const id = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const body = await c.req.json();
    const result = studentDemographicsSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }

    const updates = result.data;
    if (Object.keys(updates).length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400);
    }

    const [student] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();

    if (!student) return c.json({ success: false, error: 'Student not found' }, 404);
    return c.json({ success: true, data: student });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});


studentsRoutes.post('/', requireWorker, async (c) => {
  try {
    const body = await c.req.json();
    
    // Auto generate a school-aware code if missing
    if (!body.studentCode && body.schoolId) {
      const schoolId = parseInt(String(body.schoolId), 10);
      const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
      if (school) {
        const [{ cnt }] = await db
          .select({ cnt: count(students.id) })
          .from(students)
          .where(eq(students.schoolId, schoolId));
        body.studentCode = generateStudentCode(school.name, schoolId, (cnt ?? 0) + 1);
      } else {
        body.studentCode = `STU-${Date.now()}`;
      }
    }

    const result = studentSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }
    
    const [student] = await db.insert(students).values(result.data as any).returning();
    return c.json({ success: true, data: student });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/:id/mental-health', requireOwnStudentId('id'), async (c) => {
  const studentId = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(studentId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const assessments = await db
      .select()
      .from(studentMentalHealthAssessments)
      .where(eq(studentMentalHealthAssessments.studentId, studentId))
      .orderBy(desc(studentMentalHealthAssessments.createdAt));

    return c.json({ success: true, data: assessments });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.post('/:id/mental-health', requireWorker, async (c) => {
  const studentId = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(studentId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const body = await c.req.json();
    const result = studentMentalHealthSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }

    const [assessment] = await db.insert(studentMentalHealthAssessments).values({
      studentId,
      date: result.data.date,
      responses: result.data.responses,
      totalScore: result.data.totalScore ?? null,
    }).returning();

    return c.json({ success: true, data: assessment });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});


/**
 * Issue (or re-issue) a student's app password.
 *
 * There is no email or SMS provider wired up, so the generated password is
 * returned in the response exactly once for the admin to hand over in person.
 * It is never stored in plaintext and cannot be read back afterwards — a lost
 * password means issuing a new one, not recovering the old.
 */

/** Avoids 0/O and 1/l/I, which get misread off a printed slip. */
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generatePassword(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return out;
}

studentsRoutes.post('/:id/credentials', requireWorker, async (c) => {
  const id = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const body = await c.req.json().catch(() => ({}));
    const result = issueStudentCredentialsSchema.safeParse(body ?? {});
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }

    const user = workerUser(c);

    const [student] = await db.select().from(students).where(eq(students.id, id));
    if (!student) return c.json({ success: false, error: 'Student not found' }, 404);

    // A fieldworker may only provision students at their own school; an admin
    // is unrestricted. This is the one place a worker mints a credential, so
    // it is scoped even though the neighbouring read routes are not yet.
    if (user.role === 'fieldworker' && user.assignedSchoolId !== null
        && student.schoolId !== user.assignedSchoolId) {
      return c.json({ success: false, error: 'Forbidden: student is at another school' }, 403);
    }

    const password = result.data.password ?? generatePassword();

    await db
      .update(students)
      .set({
        passwordHash: await bcrypt.hash(password, 10),
        mustChangePassword: true,
        // Readable by workers until the student sets their own.
        tempPassword: password,
      })
      .where(eq(students.id, id));

    return c.json({
      success: true,
      data: {
        studentId: student.id,
        studentCode: student.studentCode,
        email: student.email,
        password,
        credentials: { hasAccount: true, activated: false, tempPassword: password },
      },
    });
  } catch (error: any) {
    console.error('Issue student credentials error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});
