/** Lowercase, collapse whitespace, strip punctuation for name comparison. */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split a name into word tokens (min length 1). */
export function nameTokens(name: string | null | undefined): string[] {
  const normalized = normalizeName(name);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

/** True if every query token appears in stored name (order-independent). */
export function nameMatchesQuery(storedName: string | null | undefined, query: string | null | undefined): boolean {
  const queryTokens = nameTokens(query);
  if (queryTokens.length === 0) return true;
  const storedSet = new Set(nameTokens(storedName));
  return queryTokens.every((token) => storedSet.has(token));
}

/** Jaccard similarity on name token sets — for duplicate detection. */
export function namesLikelySame(a: string | null | undefined, b: string | null | undefined, threshold = 0.8): boolean {
  const tokensA = new Set(nameTokens(a));
  const tokensB = new Set(nameTokens(b));
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 && intersection / union >= threshold;
}

/** First token of query for broad SQL pre-filter. */
export function firstSearchToken(query: string | null | undefined): string {
  const tokens = nameTokens(query);
  return tokens[0] ?? '';
}
