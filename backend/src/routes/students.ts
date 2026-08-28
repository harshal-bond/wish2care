import { Hono } from 'hono';
import { db } from '../db/index.js';
import { students, healthRecords, schools, studentMentalHealthAssessments } from '../db/schema.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import {
  studentSchema,
  studentMentalHealthSchema,
  nameMatchesQuery,
  firstSearchToken,
  normalizeAppetiteValue,
} from '@wish2care/shared';
import { eq, ilike, or, and, desc, count, inArray } from 'drizzle-orm';
import { generateStudentCode } from '../lib/studentCode.js';
import { healthRecordStatusSelect, statusFromRow, type HealthRecordStatusRow } from '../lib/studentListStatus.js';
import { z } from 'zod';

export const studentsRoutes = new Hono();

studentsRoutes.use('/*', authMiddleware);

const studentDemographicsSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.coerce.number().min(1).max(100).optional(),
  gender: z.enum(['M', 'F']).optional(),
});

async function loadMentalHealthStudentIds(studentIds: number[]): Promise<Set<number>> {
  if (studentIds.length === 0) return new Set();
  const rows = await db
    .selectDistinct({ studentId: studentMentalHealthAssessments.studentId })
    .from(studentMentalHealthAssessments)
    .where(inArray(studentMentalHealthAssessments.studentId, studentIds));
  return new Set(rows.map((r) => r.studentId));
}

function buildListConditions(user: any, search?: string, schoolId?: string) {
  const conditions = [];

  if (user.role === 'fieldworker' && user.assignedSchoolId) {
    conditions.push(eq(students.schoolId, user.assignedSchoolId));
  } else if (schoolId) {
    conditions.push(eq(students.schoolId, parseInt(schoolId, 10)));
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

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function mapStudentListRow(
  row: { student: typeof students.$inferSelect; school: typeof schools.$inferSelect | null } & HealthRecordStatusRow,
  mentalIds: Set<number>
) {
  const mentalAssessmentComplete = mentalIds.has(row.student.id);
  const _status = statusFromRow(row, mentalAssessmentComplete);
  return {
    ...row.student,
    school: row.school,
    healthRecord: row.hrId != null ? { updatedAt: row.updatedAt } : null,
    _status,
  };
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

async function queryStudentList(whereClause: ReturnType<typeof and> | undefined, limit?: number) {
  let query = db
    .select({
      student: students,
      school: schools,
      ...healthRecordStatusSelect,
    })
    .from(students)
    .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
    .leftJoin(schools, eq(students.schoolId, schools.id))
    .where(whereClause)
    .orderBy(students.name)
    .$dynamic();

  if (limit) query = query.limit(limit);

  return query;
}

studentsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');

  try {
    const whereClause = buildListConditions(user, search, schoolId);
    const results = await queryStudentList(whereClause, search ? 200 : undefined);
    const mentalIds = await loadMentalHealthStudentIds(results.map((r) => r.student.id));

    let mapped = results.map((row) => mapStudentListRow(row, mentalIds));
    mapped = applyTokenSearch(mapped, search);

    const summary = mapped.map((s) => ({
      id: s.id,
      name: s.name,
      studentCode: s.studentCode,
      age: s.age,
      gender: s.gender,
      school: s.school,
      healthRecord: s.healthRecord,
      _status: s._status,
    }));

    return c.json({ success: true, data: summary });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');

  try {
    const whereClause = buildListConditions(user, search, schoolId);
    const results = await queryStudentList(whereClause, search ? 200 : undefined);
    const mentalIds = await loadMentalHealthStudentIds(results.map((r) => r.student.id));

    let mappedResults = results.map((row) => mapStudentListRow(row, mentalIds));
    mappedResults = applyTokenSearch(mappedResults, search);

    return c.json({ success: true, data: mappedResults });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
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

  return c.json({ 
    success: true, 
    data: {
      ...row.student,
      school: row.school || null,
      healthRecord: hr,
    }
  });
});

studentsRoutes.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
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


studentsRoutes.post('/', async (c) => {
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

// ── Mental Health Assessments ────────────────────────────────────────────

// Admin analytics: all students with their latest mental health data
studentsRoutes.get('/mental-health/all', requireAdmin, async (c) => {
  try {
    // Get all students with school info and health records
    const studentsWithData = await db.select({
      student: students,
      school: schools,
      healthRecord: healthRecords,
    })
    .from(students)
    .leftJoin(schools, eq(schools.id, students.schoolId))
    .leftJoin(healthRecords, eq(healthRecords.studentId, students.id));

    // Get all mental health assessments
    const allAssessments = await db
      .select()
      .from(studentMentalHealthAssessments)
      .orderBy(desc(studentMentalHealthAssessments.createdAt));

    // Group assessments by studentId
    const assessmentsByStudent = allAssessments.reduce((acc: Record<number, any[]>, a) => {
      if (!acc[a.studentId]) acc[a.studentId] = [];
      acc[a.studentId].push(a);
      return acc;
    }, {});

    const result = studentsWithData.map(row => ({
      ...row.student,
      school: row.school,
      healthRecord: row.healthRecord,
      mentalHealthAssessments: assessmentsByStudent[row.student.id] || [],
    }));

    return c.json({ success: true, data: result });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});


studentsRoutes.get('/:id/mental-health', async (c) => {
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

studentsRoutes.post('/:id/mental-health', async (c) => {
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
