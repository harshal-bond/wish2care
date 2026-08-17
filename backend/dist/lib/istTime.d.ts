/**
 * Current IST wall-clock date/time, independent of the server process's own
 * timezone (production runs in UTC). No other timezone infra exists in this
 * codebase — every other date is a plain string, and the product is India-only.
 */
export declare function getIstNow(): {
    date: string;
    time: string;
};
/** Day of week (0=Sunday..6=Saturday) for a plain 'YYYY-MM-DD' calendar date, unaffected by server timezone. */
export declare function getDayOfWeek(dateStr: string): number;
/** True if {date, time} is strictly before the current IST wall clock. */
export declare function isPastIst(date: string, time: string): boolean;
//# sourceMappingURL=istTime.d.ts.map