import { Hono } from 'hono';
import { db } from '../db/index.js';
import { schools, students, schoolAuditChecklists } from '../db/schema.js';
import { authMiddleware, requireAdmin, requireWorker } from '../middleware/auth.js';
import { schoolSchema, schoolAuditChecklistSchema } from '@wish2care/shared';
import { eq, sql, desc, count } from 'drizzle-orm';
import { generateStudentCode, parseStudentExcel } from '../lib/parseStudentExcel.js';

export const schoolsRoutes = new Hono();

schoolsRoutes.use('/*', authMiddleware);
schoolsRoutes.use('/*', requireWorker);

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

    // Count existing students in this school to determine starting sequence number
    const [{ existingCount }] = await db
      .select({ existingCount: count(students.id) })
      .from(students)
      .where(eq(students.schoolId, schoolId));

    let imported = 0;
    let skipped = 0;
    let seq = (existingCount ?? 0) + 1;

    for (const row of rows) {
      // If Excel has a code already, use it; otherwise auto-generate
      const studentCode = row.data.studentCode?.trim()
        || generateStudentCode(school.name, schoolId, seq);

      try {
        await db.insert(students).values({
          studentCode,
          name: row.data.name,
          age: row.data.age,
          gender: row.data.gender,
          dateOfBirth: row.data.dateOfBirth,
          bloodGroup: row.data.bloodGroup,
          email: row.data.email,
          mobileNo: row.data.mobileNo,
          fatherMobileNo: row.data.fatherMobileNo,
          nomineeName: row.data.nomineeName,
          relationship: row.data.relationship,
          courseName: row.data.courseName,
          collegeStream: row.data.collegeStream,
          localAddress: row.data.localAddress,
          area: row.data.area,
          schoolId,
        });
        imported += 1;
        seq += 1;
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

// ── School Audit Checklists ────────────────────────────────────────────

schoolsRoutes.get('/:id/audit', async (c) => {
  const schoolId = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(schoolId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const audits = await db
      .select()
      .from(schoolAuditChecklists)
      .where(eq(schoolAuditChecklists.schoolId, schoolId))
      .orderBy(desc(schoolAuditChecklists.createdAt));

    return c.json({ success: true, data: audits });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

schoolsRoutes.post('/:id/audit', requireAdmin, async (c) => {
  const schoolId = parseInt(c.req.param('id') ?? '', 10);
  if (isNaN(schoolId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const body = await c.req.json();
    const result = schoolAuditChecklistSchema.safeParse(body);
    
    if (!result.success) {
      return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
    }

    const [audit] = await db.insert(schoolAuditChecklists).values({
      schoolId,
      ...result.data,
    }).returning();

    return c.json({ success: true, data: audit });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
