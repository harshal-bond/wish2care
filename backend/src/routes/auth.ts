import { Hono } from 'hono';
import { db } from '../db/index.js';
import { workers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@wish2care/shared';
import { authMiddleware } from '../middleware/auth.js';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../lib/env.js';
import { rateLimit } from '../lib/rateLimit.js';

export const authRoutes = new Hono();

const WINDOW_MS = 15 * 60 * 1000;

/**
 * Two limiters, because they defend against different things.
 *
 * Per-IP is deliberately loose: a whole school of field workers shares one
 * NAT address, and locking them all out to stop one attacker is a worse
 * outcome than the attack. Per-email is the tight one — it caps guesses
 * against any single account no matter how many addresses they come from.
 */
const loginIpLimit = rateLimit({
  name: 'login-ip',
  windowMs: WINDOW_MS,
  max: 50,
  message: 'Too many login attempts from this network. Try again in a few minutes.',
});

const loginEmailLimit = rateLimit({
  name: 'login-email',
  windowMs: WINDOW_MS,
  max: 10,
  message: 'Too many login attempts for this account. Try again in a few minutes.',
  keyBy: async (c) => {
    try {
      // Hono caches the parsed body, so the handler can still read it.
      const body = await c.req.json();
      const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : null;
      return email || null;
    } catch {
      // Unparseable body — let the handler return its own 400.
      return null;
    }
  },
});

authRoutes.post('/login', loginIpLimit, loginEmailLimit, async (c) => {
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

    const token = jwt.sign(
      { id: worker.id, email: worker.email, role: worker.role, assignedSchoolId: worker.assignedSchoolId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    const { passwordHash, createdAt, ...workerData } = worker;

    return c.json({
      success: true,
      data: {
        token,
        worker: workerData
      }
    });
  } catch (error) {
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
