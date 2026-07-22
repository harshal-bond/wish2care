import { Hono } from 'hono';
import { db } from '../db/index.js';
import { healthRecords, students } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { healthRecordPartialSchema } from '@wish2care/shared';
import { eq } from 'drizzle-orm';

export const healthRecordsRoutes = new Hono();

healthRecordsRoutes.use('/*', authMiddleware);

healthRecordsRoutes.get('/:studentId', async (c) => {
  const studentId = parseInt(c.req.param('studentId'), 10);
  if (isNaN(studentId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  const [record] = await db.select().from(healthRecords).where(eq(healthRecords.studentId, studentId));
  return c.json({ success: true, data: record || null });
});

healthRecordsRoutes.put('/:studentId', async (c) => {
  const studentId = parseInt(c.req.param('studentId'), 10);
  if (isNaN(studentId)) return c.json({ success: false, error: 'Invalid ID' }, 400);

  try {
    const body = await c.req.json();
    console.log('[SAVE REQUEST] Frontend payload received:', JSON.stringify(body));
    
    body.studentId = studentId;
    console.log('[SAVE REQUEST] Backend body prepared for validation:', JSON.stringify(body));
    
    const result = healthRecordPartialSchema.safeParse(body);
    if (!result.success) {
      console.log('[SAVE REQUEST] Zod validation failed:');
      console.log(result.error.issues);
      return c.json({ 
        success: false, 
        error: 'Validation failed', 
        issues: result.error.issues 
      }, 400);
    }

    console.log('[SAVE REQUEST] Zod validation passed:', JSON.stringify(result.data));

    // Check if student exists
    const [student] = await db.select().from(students).where(eq(students.id, studentId));
    if (!student) {
      return c.json({ success: false, error: 'Student not found' }, 404);
    }

    // Upsert the record
    const [existingRecord] = await db.select().from(healthRecords).where(eq(healthRecords.studentId, studentId));
    
    let record;
    if (existingRecord) {
      // Update
      const updateData = { ...result.data, updatedAt: new Date() };
      console.log('[SAVE DB] Updating record with values:', JSON.stringify(updateData));
      [record] = await db.update(healthRecords)
        .set(updateData)
        .where(eq(healthRecords.studentId, studentId))
        .returning();
    } else {
      // Insert
      const insertData = { ...result.data, studentId };
      console.log('[SAVE DB] Inserting record with values:', JSON.stringify(insertData));
      [record] = await db.insert(healthRecords)
        .values(insertData as any)
        .returning();
    }

    console.log('[SAVE DB] Success. Returning record:', JSON.stringify(record));
    return c.json({ success: true, data: record });
  } catch (err: any) {
    console.error('[SAVE ERROR] Save health record error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

