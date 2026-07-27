import { Hono } from 'hono';
import { db } from '../db/index.js';
import { schools, students } from '../db/schema.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { schoolSchema } from '@wish2care/shared';
import { eq, sql } from 'drizzle-orm';
import { generateStudentCode, parseStudentExcel } from '../lib/parseStudentExcel.js';

export const schoolsRoutes = new Hono();

schoolsRoutes.use('/*', authMiddleware);

schoolsRoutes.get('/', async (c) => {
  const user = c.get('user');

  const baseQuery = db
    .select({
      id: schools.id,
      name: schools.name,
      createdAt: schools.createdAt,
      studentCount: sql<number>`cast(count(${students.id}) as int)`.mapWith(Number),
    })
    .from(schools)
    .leftJoin(students, eq(students.schoolId, schools.id))
    .groupBy(schools.id);

  const allSchools =
    user.role === 'fieldworker' && user.assignedSchoolId
      ? await baseQuery.where(eq(schools.id, user.assignedSchoolId))
      : await baseQuery;

  return c.json({ success: true, data: allSchools });
});

schoolsRoutes.post('/', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const result = schoolSchema.safeParse(body);
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }

    const [school] = await db.insert(schools).values(result.data).returning();
    return c.json({ success: true, data: school });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

schoolsRoutes.post('/:id/students/upload', requireAdmin, async (c) => {
  const idParam = c.req.param('id');
  const schoolId = parseInt(idParam ?? '', 10);
  if (isNaN(schoolId)) {
    return c.json({ success: false, error: 'Invalid school ID' }, 400);
  }

  const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
  if (!school) {
    return c.json({ success: false, error: 'School not found' }, 404);
  }

  try {
    const body = await c.req.parseBody();
    const file = body.file;

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, error: 'Excel file is required (field name: file)' }, 400);
    }

    const buffer = await file.arrayBuffer();
    const { rows, errors } = await parseStudentExcel(buffer);

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      const studentCode = row.data.studentCode?.trim() || generateStudentCode();

      try {
        await db.insert(students).values({
          studentCode,
          name: row.data.name,
          age: row.data.age,
          gender: row.data.gender,
          schoolId,
        });
        imported += 1;
      } catch (err: any) {
        if (err.code === '23505') {
          skipped += 1;
          errors.push({
            row: row.rowNumber,
            message: `Duplicate student code "${studentCode}"`,
          });
        } else {
          errors.push({
            row: row.rowNumber,
            message: err.message || 'Failed to insert student',
          });
        }
      }
    }

    return c.json({
      success: true,
      data: {
        schoolId,
        schoolName: school.name,
        imported,
        skipped,
        errors,
      },
      message:
        imported > 0
          ? `Imported ${imported} student${imported === 1 ? '' : 's'} for ${school.name}`
          : 'No students were imported',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});
