import type { StudentSchoolUploadRow } from '@wish2care/shared';
export interface ParsedStudentRow {
    rowNumber: number;
    data: StudentSchoolUploadRow;
}
export declare function parseStudentExcel(buffer: ArrayBuffer): Promise<{
    rows: ParsedStudentRow[];
    errors: Array<{
        row: number;
        message: string;
    }>;
}>;
export declare function generateStudentCode(): string;
//# sourceMappingURL=parseStudentExcel.d.ts.map