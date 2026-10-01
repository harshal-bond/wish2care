import { Hono } from 'hono';
import { db } from '../db/index.js';
import { workers, students } from '../db/schema.js';
import { eq, or, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema, studentLoginSchema, studentChangePasswordSchema } from '@wish2care/shared';
import { authMiddleware, requireStudent } from '../middleware/auth.js';
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
        }
        catch {
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
    if (user.role === 'student') {
        const [student] = await db.select().from(students).where(eq(students.id, user.id));
        if (!student) {
            return c.json({ success: false, error: 'User not found' }, 404);
        }
        return c.json({ success: true, data: { student: publicStudent(student) } });
    }
    const [worker] = await db.select().from(workers).where(eq(workers.id, user.id));
    if (!worker) {
        return c.json({ success: false, error: 'User not found' }, 404);
    }
    const { passwordHash, createdAt, ...workerData } = worker;
    return c.json({ success: true, data: { worker: workerData } });
});
// ── Student app login ──────────────────────────────────────────────────
/**
 * Compared against when no student matched, so that a wrong identifier and a
 * wrong password take the same time. Without it the response latency tells an
 * attacker which student codes exist.
 */
const DUMMY_HASH = bcrypt.hashSync('no-such-account', 10);
/** Never return password_hash or the change flag's siblings to the client. */
function publicStudent(student) {
    return {
        id: student.id,
        name: student.name,
        studentCode: student.studentCode,
        email: student.email,
        schoolId: student.schoolId,
        className: student.className,
        section: student.section,
        mustChangePassword: student.mustChangePassword,
        role: 'student',
    };
}
const studentLoginIpLimit = rateLimit({
    name: 'student-login-ip',
    windowMs: WINDOW_MS,
    max: 50,
    message: 'Too many login attempts from this network. Try again in a few minutes.',
});
const studentLoginIdentLimit = rateLimit({
    name: 'student-login-ident',
    windowMs: WINDOW_MS,
    max: 10,
    message: 'Too many login attempts for this account. Try again in a few minutes.',
    keyBy: async (c) => {
        try {
            const body = await c.req.json();
            const ident = typeof body?.identifier === 'string' ? body.identifier.trim().toLowerCase() : null;
            return ident || null;
        }
        catch {
            return null;
        }
    },
});
authRoutes.post('/student/login', studentLoginIpLimit, studentLoginIdentLimit, async (c) => {
    try {
        const body = await c.req.json();
        const result = studentLoginSchema.safeParse(body);
        if (!result.success) {
            return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
        }
        const { identifier, password } = result.data;
        const ident = identifier.trim().toLowerCase();
        // student_code is unique; email is not (yet), so match on both and treat
        // any ambiguity as a failure rather than picking one arbitrarily.
        const candidates = await db
            .select()
            .from(students)
            .where(or(sql `lower(${students.studentCode}) = ${ident}`, sql `lower(${students.email}) = ${ident}`))
            .limit(2);
        if (candidates.length !== 1) {
            if (candidates.length > 1) {
                // Two students share this email. Neither can log in by email until
                // the roster is deduplicated; both can still use their student code.
                console.warn(`[auth] Ambiguous student identifier, ${candidates.length} matches — refusing.`);
            }
            await bcrypt.compare(password, DUMMY_HASH);
            return c.json({ success: false, error: 'Invalid credentials' }, 401);
        }
        const student = candidates[0];
        // No account provisioned yet. Indistinguishable from a wrong password.
        if (!student.passwordHash) {
            await bcrypt.compare(password, DUMMY_HASH);
            return c.json({ success: false, error: 'Invalid credentials' }, 401);
        }
        const isValidPassword = await bcrypt.compare(password, student.passwordHash);
        if (!isValidPassword) {
            return c.json({ success: false, error: 'Invalid credentials' }, 401);
        }
        const token = jwt.sign({ id: student.id, role: 'student' }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });
        return c.json({
            success: true,
            data: { token, student: publicStudent(student) },
        });
    }
    catch (error) {
        console.error('Student login error:', error);
        return c.json({ success: false, error: 'Internal server error' }, 500);
    }
});
authRoutes.post('/student/change-password', authMiddleware, requireStudent, async (c) => {
    try {
        const body = await c.req.json();
        const result = studentChangePasswordSchema.safeParse(body);
        if (!result.success) {
            return c.json({ success: false, error: 'Invalid input', details: result.error.errors }, 400);
        }
        const user = c.get('user');
        const { currentPassword, newPassword } = result.data;
        const [student] = await db.select().from(students).where(eq(students.id, user.id));
        if (!student?.passwordHash) {
            return c.json({ success: false, error: 'Invalid credentials' }, 401);
        }
        const isValidPassword = await bcrypt.compare(currentPassword, student.passwordHash);
        if (!isValidPassword) {
            return c.json({ success: false, error: 'Invalid credentials' }, 401);
        }
        if (await bcrypt.compare(newPassword, student.passwordHash)) {
            return c.json({ success: false, error: 'New password must be different from the current one' }, 400);
        }
        const [updated] = await db
            .update(students)
            .set({
            passwordHash: await bcrypt.hash(newPassword, 10),
            mustChangePassword: false,
            // The worker-readable copy exists only until this moment.
            tempPassword: null,
        })
            .where(eq(students.id, user.id))
            .returning();
        return c.json({ success: true, data: { student: publicStudent(updated) } });
    }
    catch (error) {
        console.error('Student change-password error:', error);
        return c.json({ success: false, error: 'Internal server error' }, 500);
    }
});
//# sourceMappingURL=auth.js.map