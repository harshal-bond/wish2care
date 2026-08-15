/**
 * Derives a short prefix from a school name by taking the first letter
 * of each significant word (ignoring common words like "and", "of", "the").
 * e.g. "PES Modern High School" → "PMHS", "Government Boys School" → "GBS"
 */
export function schoolInitials(name: string): string {
  const stopWords = new Set(['and', 'of', 'the', 'a', 'an', 'for', 'to', 'in', 'at', '&']);
  return name
    .split(/\s+/)
    .filter((w) => w.length > 0 && !stopWords.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Generates a student code in the format: <SchoolInitials><SchoolId>-<Seq>
 * e.g. "PES Modern" (ID 3) + sequence 7  → "PM3-007"
 */
export function generateStudentCode(schoolName: string, schoolId: number, seq: number): string {
  const prefix = schoolInitials(schoolName);
  const paddedSeq = String(seq).padStart(3, '0');
  return `${prefix}${schoolId}-${paddedSeq}`;
}
