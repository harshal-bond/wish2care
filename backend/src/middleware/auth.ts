import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/env.js';

/**
 * Two kinds of caller, deliberately distinct shapes rather than one interface
 * with optional fields: a student token carries no email, no role hierarchy
 * and no school assignment, and making that a type-level fact stops handlers
 * reading `assignedSchoolId` off a student and silently getting undefined.
 */
export type WorkerPayload = {
  id: number;
  email: string;
  role: 'admin' | 'fieldworker';
  assignedSchoolId: number | null;
};

export type StudentPayload = {
  id: number;
  role: 'student';
};

export type JwtPayload = WorkerPayload | StudentPayload;

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

/**
 * Anything a student must never reach. Note this is an allow-list on role,
 * not `role !== 'student'`, so a future role added to the token doesn't
 * quietly inherit worker access.
 */
export const requireWorker = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user || (user.role !== 'admin' && user.role !== 'fieldworker')) {
    return c.json({ success: false, error: 'Forbidden: Worker access required' }, 403);
  }
  await next();
};

export const requireStudent = async (c: Context, next: Next) => {
  const user = c.get('user');
  if (!user || user.role !== 'student') {
    return c.json({ success: false, error: 'Forbidden: Student access required' }, 403);
  }
  await next();
};

/**
 * Students may only ever address their own record. Workers pass through here
 * untouched — their access is bounded by school scoping instead, which is a
 * different question and lives in requireStudentInScope.
 */
export const requireOwnStudentId =
  (paramName: string) => async (c: Context, next: Next) => {
    const user = c.get('user');
    if (user?.role === 'student') {
      const requestedId = parseInt(c.req.param(paramName) ?? '', 10);
      if (Number.isNaN(requestedId) || requestedId !== user.id) {
        return c.json({ success: false, error: 'Forbidden' }, 403);
      }
    }
    await next();
  };
