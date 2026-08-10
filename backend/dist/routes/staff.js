import { Hono } from 'hono';
import { db } from '../db/index.js';
import { staff, staffAssessments, schools } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { staffSchema, staffAssessmentPartialSchema } from '@wish2care/shared';
import { eq, ilike, or, and, count } from 'drizzle-orm';
import { generateStudentCode } from '../lib/parseStudentExcel.js';
export const staffRoutes = new Hono();
staffRoutes.use('/*', authMiddleware);
staffRoutes.get('/', async (c) => {
    const user = c.get('user');
    const search = c.req.query('search');
    const schoolId = c.req.query('schoolId');
    const conditions = [];
    if (user.role === 'fieldworker' && user.assignedSchoolId) {
        conditions.push(eq(staff.schoolId, user.assignedSchoolId));
    }
    else if (schoolId) {
        conditions.push(eq(staff.schoolId, parseInt(schoolId, 10)));
    }
    if (search) {
        const searchPattern = `%${search}%`;
        conditions.push(or(ilike(staff.name, searchPattern), ilike(staff.staffCode, searchPattern)));
    }
    try {
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        let query = db
            .select({
            staffMember: staff,
            assessment: staffAssessments,
            school: schools,
        })
            .from(staff)
            .leftJoin(staffAssessments, eq(staff.id, staffAssessments.staffId))
            .leftJoin(schools, eq(staff.schoolId, schools.id))
            .where(whereClause)
            .orderBy(staff.name)
            .$dynamic();
        if (search) {
            query = query.limit(200);
        }
        const results = await query;
        const mapped = results.map((row) => ({
            ...row.staffMember,
            school: row.school,
            assessment: row.assessment
                ? { updatedAt: row.assessment.updatedAt, assessmentComplete: row.assessment.assessmentComplete }
                : null,
            _status: {
                isComplete: row.assessment?.assessmentComplete === true,
            },
        }));
        return c.json({ success: true, data: mapped });
    }
    catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
});
staffRoutes.get('/:id', async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    if (isNaN(id))
        return c.json({ success: false, error: 'Invalid ID' }, 400);
    const rows = await db
        .select({
        staffMember: staff,
        assessment: staffAssessments,
        school: schools,
    })
        .from(staff)
        .leftJoin(staffAssessments, eq(staffAssessments.staffId, staff.id))
        .leftJoin(schools, eq(schools.id, staff.schoolId))
        .where(eq(staff.id, id));
    if (rows.length === 0)
        return c.json({ success: false, error: 'Staff not found' }, 404);
    const row = rows[0];
    return c.json({
        success: true,
        data: {
            ...row.staffMember,
            school: row.school || null,
            assessment: row.assessment || null,
            _status: {
                isComplete: row.assessment?.assessmentComplete === true,
            },
        },
    });
});
staffRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        if (!body.staffCode && body.schoolId) {
            const schoolId = parseInt(String(body.schoolId), 10);
            const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
            if (school) {
                const [{ cnt }] = await db
                    .select({ cnt: count(staff.id) })
                    .from(staff)
                    .where(eq(staff.schoolId, schoolId));
                // Prefix with STF- via school initials + schoolId seq (reuse generator, tag as staff)
                body.staffCode = `STF-${generateStudentCode(school.name, schoolId, (cnt ?? 0) + 1)}`;
            }
            else {
                body.staffCode = `STF-${Date.now()}`;
            }
        }
        const result = staffSchema.safeParse(body);
        if (!result.success) {
            return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
        }
        const [created] = await db.insert(staff).values(result.data).returning();
        return c.json({ success: true, data: created });
    }
    catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
});
staffRoutes.put('/:id/assessment', async (c) => {
    const staffId = parseInt(c.req.param('id'), 10);
    if (isNaN(staffId))
        return c.json({ success: false, error: 'Invalid ID' }, 400);
    try {
        const body = await c.req.json();
        body.staffId = staffId;
        const result = staffAssessmentPartialSchema.safeParse(body);
        if (!result.success) {
            return c.json({ success: false, error: 'Validation failed', issues: result.error.issues }, 400);
        }
        const [existingStaff] = await db.select().from(staff).where(eq(staff.id, staffId));
        if (!existingStaff) {
            return c.json({ success: false, error: 'Staff not found' }, 404);
        }
        const user = c.get('user');
        const [existing] = await db
            .select()
            .from(staffAssessments)
            .where(eq(staffAssessments.staffId, staffId));
        if (existing && user.role === 'fieldworker' && existing.assessmentComplete) {
            return c.json({
                success: false,
                error: 'Forbidden: Assessment is already submitted and cannot be edited by a fieldworker.',
            }, 403);
        }
        const now = new Date();
        const { staffId: _s, ...fields } = result.data;
        const [record] = await db
            .insert(staffAssessments)
            .values({
            staffId,
            assessmentComplete: fields.assessmentComplete ?? false,
            payload: fields.payload ?? null,
            updatedAt: now,
        })
            .onConflictDoUpdate({
            target: staffAssessments.staffId,
            set: {
                ...fields,
                updatedAt: now,
            },
        })
            .returning();
        return c.json({ success: true, data: record });
    }
    catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
});
//# sourceMappingURL=staff.js.map