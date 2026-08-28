/** Lowercase, collapse whitespace, strip punctuation for name comparison. */
export function normalizeName(name) {
    if (!name)
        return '';
    return name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/** Split a name into word tokens (min length 1). */
export function nameTokens(name) {
    const normalized = normalizeName(name);
    if (!normalized)
        return [];
    return normalized.split(' ').filter(Boolean);
}
/** True if every query token appears in stored name (order-independent). */
export function nameMatchesQuery(storedName, query) {
    const queryTokens = nameTokens(query);
    if (queryTokens.length === 0)
        return true;
    const storedSet = new Set(nameTokens(storedName));
    return queryTokens.every((token) => storedSet.has(token));
}
/** Jaccard similarity on name token sets — for duplicate detection. */
export function namesLikelySame(a, b, threshold = 0.8) {
    const tokensA = new Set(nameTokens(a));
    const tokensB = new Set(nameTokens(b));
    if (tokensA.size === 0 || tokensB.size === 0)
        return false;
    let intersection = 0;
    for (const t of tokensA) {
        if (tokensB.has(t))
            intersection++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    return union > 0 && intersection / union >= threshold;
}
/** First token of query for broad SQL pre-filter. */
export function firstSearchToken(query) {
    const tokens = nameTokens(query);
    return tokens[0] ?? '';
}
//# sourceMappingURL=nameMatch.js.map