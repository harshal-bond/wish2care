import { Context, Next } from 'hono';
export type JwtPayload = {
    id: number;
    role: 'admin' | 'fieldworker';
    email: string;
    assignedSchoolId: number | null;
} | {
    id: number;
    role: 'student';
};
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
export declare const requireWorker: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
export declare const requireStudent: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
export declare const requireOwnStudentId: (paramName: string) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
//# sourceMappingURL=auth.d.ts.map