/** Normalize origin for comparison (no trailing slash). */
export declare function normalizeOrigin(origin: string): string;
export declare function buildAllowedOrigins(): string[];
export declare function isAllowedOrigin(origin: string | undefined): boolean;
export declare function corsOriginHeader(origin: string | undefined): string | null;
//# sourceMappingURL=cors.d.ts.map