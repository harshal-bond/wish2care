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
export const MH_SCALE_MAX = 5;
/** 0-based indices of reverse-coded items. */
export const MH_REVERSE_ITEM_INDICES = [3, 7, 17, 21, 28];
export const MH_REVERSE_QUESTION_NUMBERS = MH_REVERSE_ITEM_INDICES.map((i) => i + 1);
export function reverseLikertScore(original, scaleMax = MH_SCALE_MAX) {
    return scaleMax + 1 - original;
}
export function isReverseCodedItem(zeroBasedIndex) {
    return MH_REVERSE_ITEM_INDICES.includes(zeroBasedIndex);
}
export function normalizeItemScore(zeroBasedIndex, original) {
    if (original == null || Number.isNaN(Number(original)))
        return null;
    const n = Number(original);
    return isReverseCodedItem(zeroBasedIndex) ? reverseLikertScore(n) : n;
}
/** Sum of reverse-coded (where needed) item scores. Does not mutate stored totals. */
export function computeNormalizedMhTotal(responses) {
    if (!responses)
        return null;
    let sum = 0;
    let counted = 0;
    for (let i = 0; i < 30; i++) {
        const raw = responses[`q${i}`];
        const normalized = normalizeItemScore(i, raw);
        if (normalized == null)
            continue;
        sum += normalized;
        counted += 1;
    }
    return counted === 0 ? null : sum;
}
//# sourceMappingURL=mentalHealth.js.map