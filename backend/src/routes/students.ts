import { Hono } from 'hono';
import { db } from '../db/index.js';
import { students, healthRecords, schools } from '../db/schema.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { studentSchema, isRecordComplete, countCompletedDomains } from '@wish2care/shared';
import { eq, like, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const studentsRoutes = new Hono();

studentsRoutes.use('/*', authMiddleware);

studentsRoutes.get('/', async (c) => {
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

studentsRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  if (isNaN(id)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  const [student] = await db.select().from(students).where(eq(students.id, id));
  if (!student) return c.json({ success: false, error: 'Student not found' }, 404);

  const [record] = await db.select().from(healthRecords).where(eq(healthRecords.studentId, id));

  return c.json({ 
    success: true, 
    data: {
      ...student,
      healthRecord: record || null
    }
  });
});

studentsRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    // Auto generate code if missing
    if (!body.studentCode) {
      body.studentCode = `STU-${uuidv4().substring(0, 8).toUpperCase()}`;
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
