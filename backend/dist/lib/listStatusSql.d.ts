/** 8 screening domains completed in SQL so list endpoints don't ship 50 HR columns. */
export declare const completedDomainsSql: import("drizzle-orm").SQL<number>;
export declare const physicalCompleteSql: import("drizzle-orm").SQL<boolean>;
/** @deprecated Use physicalCompleteSql — kept so existing imports keep compiling. */
export declare const screeningCompleteSql: import("drizzle-orm").SQL<boolean>;
export declare const mentalCompleteSql: import("drizzle-orm").SQL<boolean>;
/** Final submit on the student page: both checks done and assessmentComplete set. */
export declare const caseCompleteSql: import("drizzle-orm").SQL<boolean>;
export declare const caseStartedSql: import("drizzle-orm").SQL<boolean>;
//# sourceMappingURL=listStatusSql.d.ts.map