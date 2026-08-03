import { Hono } from 'hono';
import { db } from '../db/index.js';
import { workers, students, otpVerifications } from '../db/schema.js';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema, requestOtpSchema, verifyOtpSchema } from '@wish2care/shared';
import { authMiddleware } from '../middleware/auth.js';
import { generateOtp, sendOtpSms } from '../lib/otp.js';
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
authRoutes.post('/student-otp/request', async (c) => {
    try {
        const body = await c.req.json();
        const result = requestOtpSchema.safeParse(body);
        if (!result.success) {
            return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
        }
        const { phone } = result.data;
        const [student] = await db.select().from(students).where(eq(students.phone, phone));
        if (!student) {
            return c.json({ success: false, error: 'Invalid phone number' }, 401);
        }
        const code = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        await db.insert(otpVerifications).values({ phone, otpCode: code, expiresAt });
        await sendOtpSms(phone, code);
        return c.json({
            success: true,
            message: 'OTP sent',
            // Dev-mode only: real SMS delivery isn't wired up yet, so the code is
            // echoed back here for testing. Must be removed (not just gated)
            // before this goes anywhere near production.
            ...(process.env.NODE_ENV !== 'production' ? { devOtp: code } : {}),
        });
    }
    catch (error) {
        console.error('OTP request error:', error);
        return c.json({ success: false, error: 'Internal server error' }, 500);
    }
});
authRoutes.post('/student-otp/verify', async (c) => {
    try {
        const body = await c.req.json();
        const result = verifyOtpSchema.safeParse(body);
        if (!result.success) {
            return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
        }
        const { phone, otp } = result.data;
        const [record] = await db
            .select()
            .from(otpVerifications)
            .where(and(eq(otpVerifications.phone, phone), eq(otpVerifications.otpCode, otp), isNull(otpVerifications.consumedAt), gt(otpVerifications.expiresAt, new Date())))
            .orderBy(desc(otpVerifications.createdAt))
            .limit(1);
        if (!record) {
            return c.json({ success: false, error: 'Invalid or expired OTP' }, 401);
        }
        const [student] = await db.select().from(students).where(eq(students.phone, phone));
        if (!student) {
            return c.json({ success: false, error: 'Invalid or expired OTP' }, 401);
        }
        await db.update(otpVerifications).set({ consumedAt: new Date() }).where(eq(otpVerifications.id, record.id));
        const token = jwt.sign({ id: student.id, role: 'student' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return c.json({
            success: true,
            data: {
                token,
                student: {
                    id: student.id,
                    name: student.name,
                    studentCode: student.studentCode,
                    schoolId: student.schoolId,
                    phone,
                    role: 'student',
                },
            },
        });
    }
    catch (error) {
        console.error('OTP verify error:', error);
        return c.json({ success: false, error: 'Internal server error' }, 500);
    }
});
authRoutes.get('/me', authMiddleware, async (c) => {
    const user = c.get('user');
    if (user.role === 'student') {
        const [student] = await db.select().from(students).where(eq(students.id, user.id));
        if (!student) {
            return c.json({ success: false, error: 'User not found' }, 404);
        }
        return c.json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    name: student.name,
                    studentCode: student.studentCode,
                    schoolId: student.schoolId,
                    phone: student.phone,
                    role: 'student',
                },
            },
        });
    }
    const [worker] = await db.select().from(workers).where(eq(workers.id, user.id));
    if (!worker) {
        return c.json({ success: false, error: 'User not found' }, 404);
    }
    const { passwordHash, createdAt, ...workerData } = worker;
    return c.json({ success: true, data: { worker: workerData } });
});
//# sourceMappingURL=auth.js.map