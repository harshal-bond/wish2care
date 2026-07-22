import { Hono } from 'hono';
import { db } from '../db/index.js';
import { schools } from '../db/schema.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { schoolSchema } from '@wish2care/shared';
import { eq } from 'drizzle-orm';

export const schoolsRoutes = new Hono();

schoolsRoutes.use('/*', authMiddleware);

schoolsRoutes.get('/', async (c) => {
  const user = c.get('user');
  let query = db.select().from(schools);
  
  if (user.role === 'fieldworker' && user.assignedSchoolId) {
    // Only show assigned school to fieldworker
    query = db.select().from(schools).where(eq(schools.id, user.assignedSchoolId)) as any;
  }
  
  const allSchools = await query;
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
