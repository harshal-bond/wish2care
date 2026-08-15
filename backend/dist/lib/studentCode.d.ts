/**
 * Derives a short prefix from a school name by taking the first letter
 * of each significant word (ignoring common words like "and", "of", "the").
 * e.g. "PES Modern High School" → "PMHS", "Government Boys School" → "GBS"
 */
export declare function schoolInitials(name: string): string;
/**
 * Generates a student code in the format: <SchoolInitials><SchoolId>-<Seq>
 * e.g. "PES Modern" (ID 3) + sequence 7  → "PM3-007"
 */
export declare function generateStudentCode(schoolName: string, schoolId: number, seq: number): string;
//# sourceMappingURL=studentCode.d.ts.map