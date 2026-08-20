import { Context, Next } from 'hono';
export interface JwtPayload {
    id: number;
    email: string;
    role: 'admin' | 'fieldworker';
    assignedSchoolId: number | null;
}
declare module 'hono' {
    interface ContextVariableMap {
        user: JwtPayload;
    }
}
export declare const authMiddleware: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 401, "json">) | undefined>;
export declare const requireAdmin: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
//# sourceMappingURL=auth.d.ts.map