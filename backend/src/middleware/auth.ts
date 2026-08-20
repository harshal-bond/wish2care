import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export type JwtPayload =
  | { id: number; role: 'admin' | 'fieldworker'; email: string; assignedSchoolId: number | null }
  | { id: number; role: 'student' };

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized: No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Unauthorized: Invalid token' }, 401);
  }
};

export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: 'Forbidden: Admin access required' }, 403);
  }
  await next();
};

export const requireWorker = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user || user.role === 'student') {
    return c.json({ success: false, error: 'Forbidden: Worker access required' }, 403);
  }
  await next();
};

export const requireOwnStudentId = (paramName: string) => async (c: Context, next: Next) => {
  const user = c.get('user');
  if (user?.role === 'student') {
    const requestedId = parseInt(c.req.param(paramName) ?? '', 10);
    if (requestedId !== user.id) {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
  }
  await next();
};
