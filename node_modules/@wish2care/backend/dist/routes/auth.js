import { Hono } from 'hono';
import { db } from '../db/index.js';
import { workers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@wish2care/shared';
import { authMiddleware } from '../middleware/auth.js';
export const authRoutes = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
authRoutes.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const result = loginSchema.safeParse(body);
        if (!result.success) {
            return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
        }
        const { email, password } = result.data;
        const [worker] = await db.select().from(workers).where(eq(workers.email, email));
        if (!worker) {
            return c.json({ success: false, error: 'Invalid credentials' }, 401);
        }
        const isValidPassword = await bcrypt.compare(password, worker.passwordHash);
        if (!isValidPassword) {
            return c.json({ success: false, error: 'Invalid credentials' }, 401);
        }
        const token = jwt.sign({ id: worker.id, email: worker.email, role: worker.role, assignedSchoolId: worker.assignedSchoolId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const { passwordHash, createdAt, ...workerData } = worker;
        return c.json({
            success: true,
            data: {
                token,
                worker: workerData
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return c.json({ success: false, error: 'Internal server error' }, 500);
    }
});
authRoutes.get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    const [worker] = await db.select().from(workers).where(eq(workers.id, user.id));
    if (!worker) {
        return c.json({ success: false, error: 'User not found' }, 404);
    }
    const { passwordHash, createdAt, ...workerData } = worker;
    return c.json({ success: true, data: { worker: workerData } });
});
//# sourceMappingURL=auth.js.map