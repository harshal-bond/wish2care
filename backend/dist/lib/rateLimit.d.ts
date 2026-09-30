import type { Context, Next } from 'hono';
export type RateLimitOptions = {
    /** Window length in milliseconds. */
    windowMs: number;
    /** Requests allowed per key per window. */
    max: number;
    /** Namespace, so two limiters never collide on the same key. */
    name: string;
    /**
     * What to count against. Defaults to the client IP. Returning null skips
     * the check entirely — used when the relevant value isn't in the request.
     */
    keyBy?: (c: Context) => Promise<string | null> | string | null;
    /** Shown to the client when the limit trips. */
    message?: string;
};
export declare function rateLimit(options: RateLimitOptions): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    success: false;
    error: string;
}, 429, "json">)>;
/** Exposed for tests — there is no other way to reset process-global state. */
export declare function __resetRateLimits(): void;
//# sourceMappingURL=rateLimit.d.ts.map