import ExcelJS from 'exceljs';
import { studentSchoolUploadRowSchema } from '@wish2care/shared';
function cellText(value) {
    if (value == null)
        return '';
    if (typeof value === 'object' && 'text' in value && value.text) {
        return String(value.text).trim();
    }
    if (typeof value === 'object' && 'result' in value && value.result != null) {
        return String(value.result).trim();
    }
    return String(value).trim();
}
function isRowEmpty(values) {
    return !values.name && !values.age && !values.gender && !values.studentCode;
}
function normalizeGender(raw) {
    const value = raw.trim().toLowerCase();
    if (value.startsWith('m'))
        return 'M';
    if (value.startsWith('f'))
        return 'F';
    return raw.trim().toUpperCase().charAt(0);
}
function parseHeaderRow(row) {
    const headers = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const header = cellText(cell.value).toLowerCase();
        if (header.includes('code') || header.includes('roll'))
            headers.studentCode = colNumber;
        else if (header.includes('name'))
            headers.name = colNumber;
        else if (header.includes('age'))
            headers.age = colNumber;
        else if (header.includes('gender') || header === 'sex')
            headers.gender = colNumber;
    });
    if (headers.name && headers.age && headers.gender) {
        return headers;
    }
    return null;
}
function readMappedRow(row, columns) {
    const readCol = (key) => columns[key] ? cellText(row.getCell(columns[key]).value) : '';
    return {
        studentCode: readCol('studentCode'),
        name: readCol('name'),
        age: readCol('age'),
        gender: readCol('gender'),
    };
}
function toStudentRow(rowNumber, raw) {
    if (isRowEmpty(raw)) {
        return { rowNumber, error: 'Empty row' };
    }
    const parsed = studentSchoolUploadRowSchema.safeParse({
        studentCode: raw.studentCode || undefined,
        name: raw.name,
        age: raw.age,
        gender: normalizeGender(raw.gender),
    });
    if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(', ');
        return { rowNumber, error: message };
    }
    return { rowNumber, data: parsed.data };
}
export async function parseStudentExcel(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
        throw new Error('No worksheet found in the uploaded file');
    }
    const rows = [];
    const errors = [];
    const headerColumns = parseHeaderRow(sheet.getRow(1));
    const defaultColumns = { studentCode: 1, name: 2, age: 3, gender: 4 };
    const columns = headerColumns ?? defaultColumns;
    const startRow = headerColumns ? 2 : 1;
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber < startRow)
            return;
        const raw = readMappedRow(row, columns);
        const result = toStudentRow(rowNumber, raw);
        if ('error' in result) {
            if (result.error !== 'Empty row') {
                errors.push({ row: result.rowNumber, message: result.error });
            }
            return;
        }
        rows.push(result);
    });
    if (rows.length === 0 && errors.length === 0) {
        throw new Error('No student rows found. Use columns: Student Code, Name, Age, Gender');
    }
    return { rows, errors };
}
export function generateStudentCode() {
    return `STU-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
}
//# sourceMappingURL=parseStudentExcel.js.map