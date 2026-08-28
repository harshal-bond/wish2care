/** Lowercase, collapse whitespace, strip punctuation for name comparison. */
export declare function normalizeName(name: string | null | undefined): string;
/** Split a name into word tokens (min length 1). */
export declare function nameTokens(name: string | null | undefined): string[];
/** True if every query token appears in stored name (order-independent). */
export declare function nameMatchesQuery(storedName: string | null | undefined, query: string | null | undefined): boolean;
/** Jaccard similarity on name token sets — for duplicate detection. */
export declare function namesLikelySame(a: string | null | undefined, b: string | null | undefined, threshold?: number): boolean;
/** First token of query for broad SQL pre-filter. */
export declare function firstSearchToken(query: string | null | undefined): string;
//# sourceMappingURL=nameMatch.d.ts.map