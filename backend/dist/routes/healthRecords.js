import { Hono } from 'hono';
import { db } from '../db/index.js';
import { healthRecords } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { healthRecordPartialSchema, isRecordComplete } from '@wish2care/shared';
import { eq } from 'drizzle-orm';
export const healthRecordsRoutes = new Hono();
healthRecordsRoutes.use('/*', authMiddleware);
healthRecordsRoutes.get('/:studentId', async (c) => {
    const studentId = parseInt(c.req.param('studentId'), 10);
    if (isNaN(studentId))
        return c.json({ success: false, error: 'Invalid ID' }, 400);
    const [record] = await db.select().from(healthRecords).where(eq(healthRecords.studentId, studentId));
    return c.json({ success: true, data: record || null });
});
healthRecordsRoutes.put('/:studentId', async (c) => {
    const studentId = parseInt(c.req.param('studentId'), 10);
    if (isNaN(studentId))
        return c.json({ success: false, error: 'Invalid ID' }, 400);
    try {
        const body = await c.req.json();
        body.studentId = studentId;
        const result = healthRecordPartialSchema.safeParse(body);
        if (!result.success) {
            return c.json({
                success: false,
                error: 'Validation failed',
                issues: result.error.issues,
            }, 400);
        }
        const user = c.get('user');
        const [existingRecord] = await db
            .select()
            .from(healthRecords)
            .where(eq(healthRecords.studentId, studentId));
        if (existingRecord && user.role === 'fieldworker' && isRecordComplete(existingRecord)) {
            return c.json({
                success: false,
                error: 'Forbidden: Record is already submitted and cannot be edited by a fieldworker.',
            }, 403);
        }
        const { studentId: _ignored, ...fields } = result.data;
        const now = new Date();
        const [record] = await db
            .insert(healthRecords)
            .values({
            ...fields,
            studentId,
            updatedAt: now,
        })
            .onConflictDoUpdate({
            target: healthRecords.studentId,
            set: {
                ...fields,
                updatedAt: now,
            },
        })
            .returning();
        return c.json({ success: true, data: record });
    }
    catch (err) {
        console.error('[SAVE ERROR] Save health record error:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});
//# sourceMappingURL=healthRecords.js.map