import { Hono } from 'hono';
import { db } from '../db/index.js';
import { students, healthRecords, schools, studentMentalHealthAssessments } from '../db/schema.js';
import { authMiddleware, requireAdmin, requireWorker, requireOwnStudentId } from '../middleware/auth.js';
import {
  studentSchema,
  studentMentalHealthSchema,
  setStudentPhoneSchema,
  isRecordComplete,
  countCompletedDomains,
} from '@wish2care/shared';
import { eq, like, or, and, desc, count } from 'drizzle-orm';
import { generateStudentCode } from '../lib/parseStudentExcel.js';

export const studentsRoutes = new Hono();

studentsRoutes.use('/*', authMiddleware);

studentsRoutes.get('/', requireWorker, async (c) => {
  const user = c.get('user');
  const search = c.req.query('search');
  const schoolId = c.req.query('schoolId');

  let baseQuery = db.select({
    student: students,
    healthRecord: healthRecords,
    school: schools
  })
  .from(students)
  .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
  .leftJoin(schools, eq(students.schoolId, schools.id));

  const conditions = [];

  // Role based filtering
  if (user.role === 'fieldworker' && user.assignedSchoolId) {
    conditions.push(eq(students.schoolId, user.assignedSchoolId));
  } else if (schoolId) {
    conditions.push(eq(students.schoolId, parseInt(schoolId, 10)));
  }

  // Search
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        like(students.name, searchPattern),
        like(students.studentCode, searchPattern)
      )
    );
  }

  if (conditions.length > 0) {
    baseQuery.where(and(...conditions));
  }

  try {
    const results = await baseQuery;
    
    // Map to response format
    const mappedResults = results.map(row => {
      const record = row.healthRecord;
      const completedDomains = record ? countCompletedDomains(record) : 0;
      
      return {
        ...row.student,
        school: row.school,
        healthRecord: record,
        _status: {
          completedDomains,
          isComplete: record ? isRecordComplete(record) : false
        }
      };
    });

    return c.json({ success: true, data: mappedResults });
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

  return c.json({ 
    success: true, 
    data: {
      ...row.student,
      school: row.school || null,
      healthRecord: row.healthRecord || null,
    }
  });
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

// Admin-only: set/update a student's login phone number. Decoupled from
// creation since the real creation path (Excel upload) doesn't collect one.
studentsRoutes.post('/:id/phone', requireAdmin, async (c) => {
  const id = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const body = await c.req.json();
    const result = setStudentPhoneSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }

    const [student] = await db
      .update(students)
      .set({ phone: result.data.phone })
      .where(eq(students.id, id))
      .returning();

    if (!student) return c.json({ success: false, error: 'Student not found' }, 404);

    return c.json({ success: true, data: student });
  } catch (err: any) {
    if (err.code === '23505') {
      return c.json({ success: false, error: 'This phone number is already in use by another student' }, 409);
    }
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
