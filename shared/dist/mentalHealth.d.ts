/**
 * Mental Health Awareness Scale (30 items, 1–5 Likert).
 *
 * Stored / in-app totals are the SUM of raw responses (q0–q29). Do not change that.
 * Reverse-coding is applied only when exporting a normalized score.
 *
 * Reverse-coded items (1-based question numbers): 4, 8, 18, 22, 29
 * Formula: New Score = (Highest Scale Value + 1) − Original Score
 * On a 5-point scale: 1→5, 2→4, 3→3, 4→2, 5→1
 */
export declare const MH_SCALE_MAX = 5;
/** 0-based indices of reverse-coded items. */
export declare const MH_REVERSE_ITEM_INDICES: readonly [3, 7, 17, 21, 28];
export declare const MH_REVERSE_QUESTION_NUMBERS: number[];
export declare function reverseLikertScore(original: number, scaleMax?: number): number;
export declare function isReverseCodedItem(zeroBasedIndex: number): boolean;
export declare function normalizeItemScore(zeroBasedIndex: number, original: number | null | undefined): number | null;
/** Sum of reverse-coded (where needed) item scores. Does not mutate stored totals. */
export declare function computeNormalizedMhTotal(responses: Record<string, number> | null | undefined): number | null;
//# sourceMappingURL=mentalHealth.d.ts.map