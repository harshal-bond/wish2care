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
import { eq, ilike, or, and, desc, count, sql } from 'drizzle-orm';
import { generateStudentCode } from '../lib/studentCode.js';
import { completedDomainsSql, screeningCompleteSql, mentalCompleteSql } from '../lib/listStatusSql.js';
import { z } from 'zod';

export const studentsRoutes = new Hono();

studentsRoutes.use('/*', authMiddleware);

const studentDemographicsSchema = z.object({
  name: z.string().min(1).optional(),
  age: z.coerce.number().min(1).max(100).optional(),
  gender: z.enum(['M', 'F']).optional(),
});

function buildListConditions(user: any, search?: string, schoolId?: string, status?: string) {
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

  if (status === 'complete') {
    conditions.push(sql`${screeningCompleteSql} = true`);
  } else if (status === 'in_progress') {
    conditions.push(sql`${completedDomainsSql} > 0 AND ${screeningCompleteSql} = false`);
  } else if (status === 'not_started') {
    conditions.push(sql`(${completedDomainsSql} = 0 OR ${completedDomainsSql} IS NULL) AND ${screeningCompleteSql} = false`);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function mapSlimRow(row: {
  id: number;
  name: string;
  studentCode: string;
  age: number;
  gender: string;
  schoolId: number;
  schoolName: string | null;
  hrUpdatedAt: Date | null;
  completedDomains: number | null;
  screeningComplete: boolean | null;
  mentalAssessmentComplete: boolean | null;
}) {
  const completedDomains = row.completedDomains ?? 0;
  const screeningComplete = row.screeningComplete === true;
  return {
    id: row.id,
    name: row.name,
    studentCode: row.studentCode,
    age: row.age,
    gender: row.gender,
    schoolId: row.schoolId,
    school: row.schoolName ? { id: row.schoolId, name: row.schoolName } : null,
    healthRecord: row.hrUpdatedAt ? { updatedAt: row.hrUpdatedAt } : null,
    _status: {
      completedDomains,
      screeningComplete,
      mentalAssessmentComplete: row.mentalAssessmentComplete === true,
      isComplete: screeningComplete,
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
      schoolId: students.schoolId,
      schoolName: schools.name,
      hrUpdatedAt: healthRecords.updatedAt,
      completedDomains: completedDomainsSql,
      screeningComplete: screeningCompleteSql,
      mentalAssessmentComplete: mentalCompleteSql,
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

studentsRoutes.get('/summary', async (c) => {
  const user = c.get('user');
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');
  const status = c.req.query('status') || undefined;
  const limit = Math.min(Math.max(parseInt(c.req.query('limit') || '500', 10) || 500, 1), 500);
  const offset = Math.max(parseInt(c.req.query('offset') || '0', 10) || 0, 0);

  try {
    const whereClause = buildListConditions(user, search, schoolId, status);
    const results = await querySlimStudentList(whereClause, { limit, offset });
    let mapped = results.map(mapSlimRow);
    mapped = applyTokenSearch(mapped, search);

    const [{ total }] = await db
      .select({ total: count(students.id) })
      .from(students)
      .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
      .where(whereClause);

    return c.json({
      success: true,
      data: mapped,
      total: Number(total) || mapped.length,
      hasMore: offset + mapped.length < Number(total),
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

studentsRoutes.get('/stats', async (c) => {
  const user = c.get('user');
  const schoolId = c.req.query('schoolId');

  try {
    const whereClause = buildListConditions(user, undefined, schoolId);
    const [agg] = await db
      .select({
        total: count(students.id),
        completed: sql<number>`count(*) filter (where ${screeningCompleteSql} = true)`.mapWith(Number),
        inProgress: sql<number>`count(*) filter (where ${completedDomainsSql} > 0 and ${screeningCompleteSql} = false)`.mapWith(Number),
      })
      .from(students)
      .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
      .where(whereClause);

    const recentRows = await querySlimStudentList(whereClause, { limit: 8, orderByUpdated: true });

    const total = Number(agg?.total) || 0;
    const completed = Number(agg?.completed) || 0;
    const inProgress = Number(agg?.inProgress) || 0;

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

studentsRoutes.get('/', async (c) => {
  const user = c.get('user');
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');

  try {
    const whereClause = buildListConditions(user, search, schoolId);
    const results = await querySlimStudentList(whereClause, { limit: 500 });
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
