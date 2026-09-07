import ExcelJS from 'exceljs';
import mammoth from 'mammoth';
import { readFileSync } from 'fs';
import { PDFParse } from 'pdf-parse';

export interface ParsedRow {
  rowNumber: number;
  roll: string;
  studentCode: string;
  mobile: string;
  section: string | null;
  classNameOverride: string | null;
}

export interface FileMeta {
  className: string;
  defaultSection: string | null;
}

export interface ParseResult {
  rows: ParsedRow[];
  sheetSectionHint: string | null;
  bodyText?: string;
}

function cellText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object' && value !== null) {
    if ('richText' in value && Array.isArray((value as { richText: unknown[] }).richText)) {
      return (value as { richText: { text: string }[] }).richText.map((r) => r.text).join('').trim();
    }
    if ('text' in value && (value as { text?: unknown }).text) {
      return String((value as { text: unknown }).text).trim();
    }
    if ('result' in value && (value as { result?: unknown }).result != null) {
      return cellText((value as { result: unknown }).result);
    }
  }
  return String(value).trim();
}

function normalizeSection(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  if (!s || s === '0' || s === 'NA' || s === 'N/A') return null;
  const letter = s.match(/\b([A-F])\b/)?.[1] || s.match(/^([A-F])$/)?.[1];
  if (letter) return letter;
  if (s.length <= 3) return s;
  return s.slice(0, 50);
}

function isRollHeader(header: string): boolean {
  const h = header.replace(/\./g, '').trim();
  return /^(roll\s*no|rollno|roll\s*number|rollnumber|rol\s*l\s*number|roll\s*no\s*list)$/i.test(h);
}

function extractSectionFromFilename(filename: string): string | null {
  const f = filename.toUpperCase();
  const patterns = [
    /\bXI\s*SC\s*([A-F])\b/,
    /\bXII\s*SCI\s*([A-F])\b/,
    /\bCOM\s+([A-F])\b/,
    /\bCOM\s*([A-E])\b/,
    /\bCOM\s*-\s*([A-E])\b/,
    /\bCOM-?\s*([A-E])\b/,
    /\b-\s*([A-E])\b/,
    /\bDIV\s*[:-]\s*([A-E])\b/,
    /\b([A-E])\s+2026/,
    /\bSCI\s+([A-E])\b/,
    /\bA&B\s*\(([A-F])\)/i,
  ];
  for (const p of patterns) {
    const m = f.match(p);
    if (m) return m[1];
  }
  return null;
}

function sectionFromSheetName(sheetName: string): string | null {
  const m = sheetName.trim().match(/\b([A-F])\s*$/i);
  return m ? m[1].toUpperCase() : null;
}

function inferClassFromText(text: string): string | null {
  const u = text.toUpperCase();
  if (u.includes('TYBA') && u.includes('GEOGRAPH')) return 'TYBA Geography';
  if (u.includes('T.Y.B.A') && u.includes('ENGLISH')) return 'TYBA English';
  if (u.includes('CLASS:') && u.includes('ENGLISH')) return 'TYBA English';
  if (u.includes('DEPARTMENT OF ENGLISH') && u.includes('FYBA')) return 'FYBAF';
  if (u.includes('DEPARTMENT OF ENGLISH') && u.includes('SYBA')) return 'SYBAF';
  if (u.includes('FYBBI') || (u.includes('BANKING') && u.includes('INSURANCE'))) return 'BBI';
  if (u.includes('TYBMS')) return 'TY BMS';
  if (u.includes('SYBMS')) return 'SY BMS';
  return null;
}

export function deriveClassFromFilename(filename: string, sheetSectionHint?: string | null, bodyText?: string): FileMeta {
  const f = filename.toLowerCase();
  const defaultSection = extractSectionFromFilename(filename) || sheetSectionHint || null;
  const fromBody = bodyText ? inferClassFromText(bodyText) : null;
  if (fromBody) return { className: fromBody, defaultSection };

  if (f.includes('11') && f.includes('com')) return { className: '11th Commerce', defaultSection };
  if (/12\s*th\s*com/i.test(f) || (f.includes('12') && (f.includes('com') || f.includes('commerce')))) {
    const sec = defaultSection || filename.match(/com\s+([a-f])\b/i)?.[1]?.toUpperCase() || null;
    return { className: '12th Commerce', defaultSection: sec };
  }
  if (f.includes('11') && f.includes('art')) return { className: '11th Arts', defaultSection };
  if (f.includes('12') && f.includes('art')) return { className: '12th Arts', defaultSection };
  if (f.includes('xii') && (f.includes('science') || f.includes('sci'))) {
    return { className: '12th Science', defaultSection };
  }
  if (/\bxi\s*sc\b/.test(f) || (f.includes('xi sc') && !f.includes('xii'))) {
    return { className: '11th Science', defaultSection };
  }
  if (f.includes('science') || f.includes('sci')) {
    return { className: '12th Science', defaultSection };
  }
  if (f.includes('fybaf')) return { className: 'FYBAF', defaultSection };
  if (f.includes('sybaf')) return { className: 'SYBAF', defaultSection };
  if (f.includes('tybaf')) return { className: 'TYBAF', defaultSection };
  if (f.includes('fyba') || f.includes('fy ba')) return { className: 'FYBAF', defaultSection };
  if (f.includes('syba') && !f.includes('tyba')) return { className: 'SYBAF', defaultSection };
  if (f.includes('tyba') || f.includes('t.y.b.a')) {
    if (f.includes('geograph') || f.includes('studnet details')) return { className: 'TYBA Geography', defaultSection };
    return { className: 'TYBA English', defaultSection };
  }
  if (f.includes('bbi')) return { className: 'BBI', defaultSection };
  if (f.includes('bms')) {
    if (f.includes('ty')) return { className: 'TY BMS', defaultSection };
    if (f.includes('sy')) return { className: 'SY BMS', defaultSection };
    return { className: 'BMS', defaultSection };
  }
  if (f.includes('b.com') && f.includes('cm')) return { className: 'B.Com CM', defaultSection };
  if (f.includes('b.com') && f.includes('nep')) return { className: 'B.Com NEP', defaultSection };
  if (f.includes('psychology')) return { className: 'Psychology', defaultSection };

  const ext = filename.replace(/\.(xlsx|docx|pdf)$/i, '');
  return { className: ext, defaultSection };
}

function normalizeCourseName(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const u = s.toUpperCase();
  if (u.includes('XII COMMERCE') || u.includes('12TH COMMERCE') || u.includes('JC COMMERCE') || u === '12 COMMERCE') {
    return '12th Commerce';
  }
  if (u.includes('XI COMMERCE') || u.includes('11TH COMMERCE') || u === '11 COMMERCE') return '11th Commerce';
  if (u.includes('XII SCI') || u.includes('12TH SCI') || u.includes('12 SCIENCE')) return '12th Science';
  if (u.includes('XI SCI') || u.includes('11TH SCI') || u.includes('11 SCIENCE')) return '11th Science';
  if (u.includes('ARTS') && u.includes('12')) return '12th Arts';
  if (u.includes('ARTS') && u.includes('11')) return '11th Arts';
  if (u.includes('BBI')) return 'BBI';
  if (u.includes('FYBAF') || u === 'FY BAF' || u === 'FYBA') return 'FYBAF';
  if (u.includes('SYBAF') || u === 'SY BAF' || u === 'SYBA') return 'SYBAF';
  if (u.includes('TYBAF') || u === 'TY BAF') return 'TYBAF';
  if (u.includes('B.COM CM')) return 'B.Com CM';
  if (u.includes('B.COM NEP')) return 'B.Com NEP';
  if (u.includes('PSYCHOLOGY')) return 'Psychology';
  if (u.includes('TYBA') && u.includes('ENGLISH')) return 'TYBA English';
  if (u.includes('TYBA') && u.includes('GEOGRAPH')) return 'TYBA Geography';
  return s;
}

function extractSectionFromSheet(sheet: ExcelJS.Worksheet): string | null {
  for (let i = 1; i <= 3; i++) {
    const row = sheet.getRow(i);
    if (!row) continue;
    const rowText = row.values
      ? (Array.isArray(row.values) ? row.values : Object.values(row.values))
          .map((v) => cellText(v))
          .join(' ')
          .toUpperCase()
      : '';
    const m = rowText.match(/(?:XII|XI|12|11)\s*(?:SCI(?:ENCE)?|COM(?:MERCE)?)\s*-?\s*([A-F])\b/);
    if (m) return m[1];
    const m2 = rowText.match(/\bDIV\s*[:-]\s*([A-E])\b/);
    if (m2) return m2[1];
  }
  return null;
}

function parseHeaderRow(row: ExcelJS.Row): Record<string, number> {
  const headers: Record<string, number> = {};
  row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cellText(cell.value).toLowerCase().replace(/\s+/g, ' ').trim();
    if (isRollHeader(header)) {
      headers.roll = colNumber;
    } else if (
      /stude?\.?\s*id|student\s*id|stud\.?\s*id/i.test(header) ||
      header === 'studentid'
    ) {
      headers.studentCode = colNumber;
    } else if (
      header.includes('code') ||
      header.includes('sr.no') ||
      header.includes('sr no') ||
      header === 'student registration no'
    ) {
      if (!headers.studentCode) headers.studentCode = colNumber;
    } else if (
      (header.includes('name') || header === 'studentname' || header === 'studentname lfm' || header === 'full name') &&
      !header.includes('mother') &&
      !header.includes('father') &&
      !header.includes('nominee') &&
      !header.includes('bank') &&
      !header.includes('aadhar') &&
      !header.includes('as per') &&
      !header.includes('10th') &&
      !header.includes('unicode') &&
      !header.includes('withmother')
    ) {
      if (!headers.name) headers.name = colNumber;
    } else if (
      (header.includes('mobile') || header.includes('phone') || header === 'student mobile no') &&
      !header.includes('father') &&
      !header.includes('mother') &&
      !header.includes('nominee') &&
      !header.includes('parent') &&
      !header.includes('landline')
    ) {
      if (!headers.mobile) headers.mobile = colNumber;
    } else if (header === 'sectionname') {
      headers.section = colNumber;
    } else if (header.includes('section') && !header.includes('id') && !header.includes('coursesection')) {
      if (!headers.section) headers.section = colNumber;
    } else if (header.includes('course') || header === 'coursename' || header === 'basiccourse/branch') {
      headers.course = colNumber;
    } else if (header.includes('div')) {
      headers.div = colNumber;
    }
  });
  return headers;
}

function scoreHeaderColumns(cols: Record<string, number>): number {
  let score = 0;
  if (cols.roll) score += 3;
  if (cols.name) score += 3;
  if (cols.mobile) score += 1;
  if (cols.section) score += 1;
  if (cols.course) score += 1;
  return score;
}

function readRowValues(row: ExcelJS.Row, columns: Record<string, number>, sectionOverride?: string | null): ParsedRow {
  const read = (key: string) => (columns[key] ? cellText(row.getCell(columns[key]).value) : '');
  const roll = read('roll');
  const studentId = read('studentCode');
  const mobile = read('mobile');
  const sectionRaw = read('section') || read('div');
  const courseRaw = read('course');

  return {
    rowNumber: row.number,
    roll: roll || studentId,
    studentCode: studentId || roll,
    mobile,
    section: sectionOverride || normalizeSection(sectionRaw),
    classNameOverride: courseRaw ? normalizeCourseName(courseRaw) : null,
  };
}

function isHeaderLike(values: ParsedRow): boolean {
  const roll = values.roll.toLowerCase();
  if (!values.roll && !values.studentCode) return true;
  if (roll.includes('roll') || roll.includes('dateofbirth') || roll.includes('groupname')) return true;
  if (values.studentCode.toLowerCase().includes('code')) return true;
  if (!/^\d+$/.test(values.roll.replace(/\D/g, '')) && !values.studentCode) return true;
  return false;
}

export async function parseExcelFile(filePath: string): Promise<ParseResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  if (!wb.worksheets.length) return { rows: [], sheetSectionHint: null };

  const allRows: ParsedRow[] = [];
  let sheetSectionHint: string | null = null;

  for (const sheet of wb.worksheets) {
    const hint = extractSectionFromSheet(sheet) || sectionFromSheetName(sheet.name);
    if (hint && !sheetSectionHint) sheetSectionHint = hint;

    const sheetSection = sectionFromSheetName(sheet.name) || hint;

    let headerColumns: Record<string, number> | null = null;
    let startRow = 1;
    let bestScore = 0;

    for (let i = 1; i <= Math.min(20, sheet.rowCount); i++) {
      const row = sheet.getRow(i);
      const cols = parseHeaderRow(row);
      const score = scoreHeaderColumns(cols);
      if (score > bestScore && score >= 4) {
        bestScore = score;
        headerColumns = cols;
        startRow = i + 1;
      }
    }

    if (!headerColumns) {
      for (let i = 1; i <= Math.min(5, sheet.rowCount); i++) {
        const row = sheet.getRow(i);
        const cols = parseHeaderRow(row);
        if (cols.roll || cols.name || cols.studentCode) {
          headerColumns = cols;
          startRow = i + 1;
          break;
        }
      }
    }

    if (!headerColumns) continue;

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < startRow) return;
      const parsed = readRowValues(row, headerColumns!, sheetSection);
      if (isHeaderLike(parsed)) return;
      if (!parsed.roll && !parsed.studentCode) return;
      allRows.push({ ...parsed, rowNumber: allRows.length + 1 });
    });
  }

  return { rows: allRows, sheetSectionHint };
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

/** FYBA / SYBA roll-call DOCX: Sr.No → Roll → Name → Contact → Email */
function parseRollCallDocx(text: string): ParsedRow[] {
  const lines = splitLines(text);
  const rows: ParsedRow[] = [];
  let i = 0;
  while (i < lines.length && !/^email$/i.test(lines[i])) i++;
  i++;

  while (i < lines.length) {
    const sr = lines[i];
    if (!/^\d+$/.test(sr)) {
      i++;
      continue;
    }
    const srNo = parseInt(sr, 10);
    i++;
    if (i >= lines.length) break;

    const roll = lines[i++];
    if (!roll || !/\d/.test(roll)) continue;

    if (i >= lines.length) break;
    const nameOrMobile = lines[i];
    if (/^\d{10}$/.test(nameOrMobile.replace(/\D/g, '').slice(-10)) && nameOrMobile.replace(/\D/g, '').length >= 10) {
      rows.push({
        rowNumber: srNo,
        roll,
        studentCode: roll,
        mobile: nameOrMobile.replace(/\D/g, '').slice(-10),
        section: null,
        classNameOverride: null,
      });
      i++;
      continue;
    }

    const name = nameOrMobile;
    i++;
    let mobile = '';
    if (i < lines.length) {
      const digits = lines[i].replace(/\D/g, '');
      if (digits.length >= 10) {
        mobile = digits.slice(-10);
        i++;
      }
    }
    if (i < lines.length && lines[i].includes('@')) i++;

    rows.push({
      rowNumber: srNo,
      roll,
      studentCode: roll,
      mobile,
      section: null,
      classNameOverride: null,
    });
  }

  return rows;
}

/** T.Y.B.A medical check-up DOCX: Sr.No → Name → optional Roll */
function parseTybaMedicalDocx(text: string): ParsedRow[] {
  const lines = splitLines(text);
  const rows: ParsedRow[] = [];
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^sr\.?\s*no\.?$/i.test(lines[i])) {
      start = i + 1;
      while (start < lines.length && /^(name|roll|signature)/i.test(lines[start])) start++;
      break;
    }
  }

  for (let i = start; i < lines.length; i++) {
    const sr = lines[i];
    if (!/^\d{1,3}$/.test(sr)) continue;
    const srNo = parseInt(sr, 10);
    if (srNo > 500) continue;

    i++;
    if (i >= lines.length) break;

    const line1 = lines[i];
    if (/^\d{5,7}$/.test(line1)) {
      rows.push({
        rowNumber: srNo,
        roll: line1,
        studentCode: line1,
        mobile: '',
        section: null,
        classNameOverride: null,
      });
      continue;
    }

    if (!/[A-Za-z]/.test(line1)) continue;

    i++;
    if (i < lines.length && /^\d{5,7}$/.test(lines[i])) {
      const roll = lines[i];
      rows.push({
        rowNumber: srNo,
        roll,
        studentCode: roll,
        mobile: '',
        section: null,
        classNameOverride: null,
      });
    }
  }

  return rows;
}

function parseBbiRollCallDocx(text: string): ParsedRow[] {
  const lines = splitLines(text);
  const rows: ParsedRow[] = [];

  for (let i = 0; i < lines.length - 4; i++) {
    if (!/^\d{1,3}$/.test(lines[i])) continue;
    const srNo = parseInt(lines[i], 10);
    const studId = lines[i + 1];
    const roll = lines[i + 2];
    if (!/^\d{6,8}$/.test(studId) || !/^\d{5,7}$/.test(roll)) continue;
    const name = lines[i + 3];
    if (!/[A-Za-z]{2,}/.test(name)) continue;
    const mobile = (lines[i + 4] || '').replace(/\D/g, '').slice(-10);

    rows.push({
      rowNumber: srNo,
      roll,
      studentCode: studId,
      mobile: mobile.length === 10 ? mobile : '',
      section: null,
      classNameOverride: null,
    });
  }

  return rows;
}

/** BMS parents-meeting DOCX: Class blocks with Roll No + Student Name */
function parseBmsDocx(text: string): ParsedRow[] {
  const lines = splitLines(text);
  const rows: ParsedRow[] = [];
  let className: string | null = null;
  let section: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const classMatch = line.match(/^class:\s*(SYBMS|TYBMS)\s*\(([^)]+)\)/i);
    if (classMatch) {
      const yr = classMatch[1].toUpperCase().startsWith('TY') ? 'TY' : 'SY';
      className = `${yr} BMS`;
      section = classMatch[2].trim();
      continue;
    }

    if (!className) continue;
    if (/^(roll\s*no|student name|signature|remark|parents)/i.test(line)) continue;

    if (/^\d{6}$/.test(line)) {
      const roll = line;
      const next = lines[i + 1] || '';
      if (/[A-Za-z]{2,}/.test(next) && !/^\d+$/.test(next)) {
        rows.push({
          rowNumber: rows.length + 1,
          roll,
          studentCode: roll,
          mobile: '',
          section,
          classNameOverride: className,
        });
        i++;
      }
    }
  }

  return rows;
}

function parseDocxText(text: string, filename: string): ParsedRow[] {
  const f = filename.toLowerCase();
  if (f.includes('bbi')) return parseBbiRollCallDocx(text);
  if (f.includes('bms')) return parseBmsDocx(text);
  if (f.includes('medical') || f.includes('t.y.b.a')) {
    return parseTybaMedicalDocx(text);
  }
  if (f.includes('roll call') || f.includes('fyba') || f.includes('syba')) {
    return parseRollCallDocx(text);
  }
  return parseRollCallDocx(text);
}

export async function parseDocxFile(filePath: string, filename: string, text?: string): Promise<ParseResult> {
  const body = text ?? (await mammoth.extractRawText({ path: filePath })).value;
  const rows = parseDocxText(body, filename);
  const sheetSectionHint = extractSectionFromFilename(filename);
  return { rows, sheetSectionHint, bodyText: body };
}

/** XI Science PDF: sr roll studentId name gender subject mobile */
function parseXiSciencePdf(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lineRe =
    /^(\d+)\s+(\d{3,4})\s+(\d{6,8})\s+(.+?)\s+(MALE|FEMALE)\s+\S+\s+(\d{10})\b/i;

  for (const line of splitLines(text)) {
    const m = line.match(lineRe);
    if (!m) continue;
    rows.push({
      rowNumber: parseInt(m[1], 10),
      roll: m[2],
      studentCode: m[3],
      mobile: m[6],
      section: null,
      classNameOverride: null,
    });
  }
  return rows;
}

/** TYBA student-details PDF: sr name roll mobile fatherMobile */
function parseTybaDetailsPdf(text: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  const lineRe = /^(\d+)\s+(.+?)\s+(\d{5,7})\s+(\d{10})(?:\s+(\d{10}))?/;

  for (const line of splitLines(text)) {
    const m = line.match(lineRe);
    if (!m) continue;
    rows.push({
      rowNumber: parseInt(m[1], 10),
      roll: m[3],
      studentCode: m[3],
      mobile: m[4],
      section: null,
      classNameOverride: null,
    });
  }
  return rows;
}

function parsePdfText(text: string, filename: string): ParsedRow[] {
  const f = filename.toLowerCase();
  if (f.includes('xi') && f.includes('sc')) {
    return parseXiSciencePdf(text);
  }
  if (f.includes('tyba') || f.includes('geograph')) {
    return parseTybaDetailsPdf(text);
  }
  return parseXiSciencePdf(text);
}

export async function parsePdfFile(filePath: string, filename: string): Promise<ParseResult> {
  const buf = readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  await parser.destroy();
  const rows = parsePdfText(result.text, filename);
  const sheetSectionHint = extractSectionFromFilename(filename);
  return { rows, sheetSectionHint, bodyText: result.text };
}

export async function parseSourceFile(filePath: string, filename: string): Promise<ParseResult> {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'xlsx') return parseExcelFile(filePath);
  if (ext === 'docx') return parseDocxFile(filePath, filename);
  if (ext === 'pdf') return parsePdfFile(filePath, filename);
  return { rows: [], sheetSectionHint: null };
}

export function orderedCodeCandidates(roll: string, excelCode?: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (v: string) => {
    const t = v.trim();
    if (!t || seen.has(t.toUpperCase())) return;
    seen.add(t.toUpperCase());
    out.push(t);
  };

  if (excelCode && excelCode !== roll) add(excelCode);
  if (roll) add(roll);

  const digits = roll.replace(/\D/g, '');
  if (digits) {
    const n = parseInt(digits, 10);
    add(`STU-${digits}`);
    if (n < 1000) {
      add(`STU-${digits.padStart(4, '0')}`);
      add(`STU-${digits.padStart(3, '0')}`);
    }
    if (n < 100) add(`STU-${n}`);
    add(digits);
  }

  if (excelCode && excelCode !== roll) {
    const alt = excelCode.replace(/\D/g, '');
    if (alt && alt !== digits) {
      add(`STU-${alt}`);
      add(alt);
    }
  }

  return out;
}

export function dedupeSourceFiles(files: string[]): string[] {
  const sorted = [...files].sort();
  return sorted.filter((file) => {
    const base = file.replace(/\s*\(\d+\)/, '');
    if (file !== base && sorted.includes(base)) return false;
    return true;
  });
}

export function normalizeMobile(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10);
}
