import type { StudentSchoolUploadRow } from '@wish2care/shared';
import { generateStudentCode, schoolInitials } from './studentCode.js';
export interface ParsedStudentRow {
    rowNumber: number;
    data: StudentSchoolUploadRow;
}
export { generateStudentCode, schoolInitials };
export declare function parseStudentExcel(buffer: ArrayBuffer): Promise<{
    rows: ParsedStudentRow[];
    errors: Array<{
        row: number;
        message: string;
    }>;
}>;
//# sourceMappingURL=parseStudentExcel.d.ts.map