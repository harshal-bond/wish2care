import ExcelJS from 'exceljs';
import { studentSchoolUploadRowSchema } from '@wish2care/shared';
import type { StudentSchoolUploadRow } from '@wish2care/shared';

export interface ParsedStudentRow {
  rowNumber: number;
  data: StudentSchoolUploadRow;
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (typeof value === 'object' && 'text' in value && value.text) {
    return String(value.text).trim();
  }
  if (typeof value === 'object' && 'result' in value && value.result != null) {
    return String(value.result).trim();
  }
  return String(value).trim();
}

function isRowEmpty(values: Record<string, string>): boolean {
  return !values.name && !values.age && !values.gender && !values.studentCode;
}

function normalizeGender(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (value.startsWith('m')) return 'M';
  if (value.startsWith('f')) return 'F';
  return raw.trim().toUpperCase().charAt(0);
}

function parseHeaderRow(row: ExcelJS.Row): Record<string, number> | null {
  const headers: Record<string, number> = {};
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cellText(cell.value).toLowerCase();
    if (header.includes('code') || header.includes('roll') || header.includes('sr.no') || header.includes('sr no')) headers.studentCode = colNumber;
    else if (header.includes('name') && !header.includes('nominee') && !header.includes('course')) headers.name = colNumber;
    else if (header.includes('age')) headers.age = colNumber;
    else if (header.includes('gender') || header === 'sex') headers.gender = colNumber;
    else if (header.includes('date of birth') || header === 'dob') headers.dateOfBirth = colNumber;
    else if (header.includes('blood group')) headers.bloodGroup = colNumber;
    else if (header.includes('e-mail') || header.includes('email')) headers.email = colNumber;
    else if (header.includes('mobile no') && !header.includes('father')) headers.mobileNo = colNumber;
    else if (header.includes('father mobile')) headers.fatherMobileNo = colNumber;
    else if (header.includes('nominee name')) headers.nomineeName = colNumber;
    else if (header.includes('relationship')) headers.relationship = colNumber;
    else if (header.includes('course name')) headers.courseName = colNumber;
    else if (header.includes('college/streme') || header.includes('college stream') || header.includes('stream')) headers.collegeStream = colNumber;
    else if (header.includes('local address')) headers.localAddress = colNumber;
    else if (header.includes('area')) headers.area = colNumber;
  });

  if (headers.name && headers.age && headers.gender) {
    return headers;
  }
  return null;
}

function readMappedRow(row: ExcelJS.Row, columns: Record<string, number>): Record<string, string> {
  const readCol = (key: string) =>
    columns[key] ? cellText(row.getCell(columns[key]).value) : '';

  return {
    studentCode: readCol('studentCode'),
    name: readCol('name'),
    age: readCol('age'),
    gender: readCol('gender'),
    dateOfBirth: readCol('dateOfBirth'),
    bloodGroup: readCol('bloodGroup'),
    email: readCol('email'),
    mobileNo: readCol('mobileNo'),
    fatherMobileNo: readCol('fatherMobileNo'),
    nomineeName: readCol('nomineeName'),
    relationship: readCol('relationship'),
    courseName: readCol('courseName'),
    collegeStream: readCol('collegeStream'),
    localAddress: readCol('localAddress'),
    area: readCol('area'),
  };
}

function toStudentRow(rowNumber: number, raw: Record<string, string>): ParsedStudentRow | { rowNumber: number; error: string } {
  if (isRowEmpty(raw)) {
    return { rowNumber, error: 'Empty row' };
  }

  let finalAge: string | number = raw.age;
  if (!finalAge && raw.dateOfBirth) {
    const parts = raw.dateOfBirth.split(/[-/]/);
    if (parts.length === 3) {
      let day, month, year;
      if (parts[2].length === 4) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      }
      if (day && month && year && !isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const dob = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
          age--;
        }
        finalAge = age;
      }
    }
  }

  const parsed = studentSchoolUploadRowSchema.safeParse({
    studentCode: raw.studentCode || undefined,
    name: raw.name,
    age: finalAge,
    gender: normalizeGender(raw.gender),
    dateOfBirth: raw.dateOfBirth,
    bloodGroup: raw.bloodGroup,
    email: raw.email,
    mobileNo: raw.mobileNo,
    fatherMobileNo: raw.fatherMobileNo,
    nomineeName: raw.nomineeName,
    relationship: raw.relationship,
    courseName: raw.courseName,
    collegeStream: raw.collegeStream,
    localAddress: raw.localAddress,
    area: raw.area,
  });

  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(', ');
    return { rowNumber, error: message };
  }

  return { rowNumber, data: parsed.data };
}

export async function parseStudentExcel(buffer: ArrayBuffer): Promise<{
  rows: ParsedStudentRow[];
  errors: Array<{ row: number; message: string }>;
}> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('No worksheet found in the uploaded file');
  }

  const rows: ParsedStudentRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  let headerColumns: Record<string, number> | null = null;
  let startRow = 1;

  // Scan first 10 rows to find headers
  for (let i = 1; i <= 10; i++) {
    const row = sheet.getRow(i);
    if (!row) continue;
    const cols = parseHeaderRow(row);
    if (cols) {
      headerColumns = cols;
      startRow = i + 1;
      break;
    }
  }

  const defaultColumns = { studentCode: 1, name: 2, age: 3, gender: 4 };
  const columns = headerColumns ?? defaultColumns;

  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < startRow) return;

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

/**
 * Derives a short prefix from a school name by taking the first letter
 * of each significant word (ignoring common words like "and", "of", "the").
 * e.g. "PES Modern High School" → "PMHS", "Government Boys School" → "GBS"
 */
export function schoolInitials(name: string): string {
  const stopWords = new Set(['and', 'of', 'the', 'a', 'an', 'for', 'to', 'in', 'at', '&']);
  return name
    .split(/\s+/)
    .filter(w => w.length > 0 && !stopWords.has(w.toLowerCase()))
    .map(w => w[0].toUpperCase())
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
