import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../lib/env.js';
export const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Unauthorized: No token provided' }, 401);
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        c.set('user', decoded);
        await next();
    }
    catch (error) {
        return c.json({ success: false, error: 'Unauthorized: Invalid token' }, 401);
    }
};
export const requireAdmin = async (c, next) => {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
        return c.json({ success: false, error: 'Forbidden: Admin access required' }, 403);
    }
    await next();
};
//# sourceMappingURL=auth.js.map