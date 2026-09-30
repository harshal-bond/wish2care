import { Context, Next } from 'hono';
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
export declare const authMiddleware: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 401, "json">) | undefined>;
export declare const requireAdmin: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
/**
 * Anything a student must never reach. Note this is an allow-list on role,
 * not `role !== 'student'`, so a future role added to the token doesn't
 * quietly inherit worker access.
 */
export declare const requireWorker: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
export declare const requireStudent: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
/**
 * Students may only ever address their own record. Workers pass through here
 * untouched — their access is bounded by school scoping instead, which is a
 * different question and lives in requireStudentInScope.
 */
export declare const requireOwnStudentId: (paramName: string) => (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 403, "json">) | undefined>;
//# sourceMappingURL=auth.d.ts.map