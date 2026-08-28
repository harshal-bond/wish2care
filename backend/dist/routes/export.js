import { Hono } from 'hono';
import { db } from '../db/index.js';
import { students, healthRecords, schools, studentMentalHealthAssessments } from '../db/schema.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { eq, inArray, desc } from 'drizzle-orm';
import { EXCEL_COLUMN_MAP, EXCEL_DATA_START_ROW, EXCEL_TEMPLATE_LAST_ROW, EXCEL_SHEET_NAME, MH_REVERSE_QUESTION_NUMBERS, MH_SCALE_MAX, computeNormalizedMhTotal, normalizeItemScore, } from '@wish2care/shared';
import path from 'path';
import fs from 'fs';
export const exportRoutes = new Hono();
exportRoutes.use('/*', authMiddleware);
function genderLabel(g) {
    if (g === 'M')
        return 'Male';
    if (g === 'F')
        return 'Female';
    return g || '';
}
/**
 * Mental health export with reverse-coded item scores.
 * Does not change stored totals — only the spreadsheet uses New Score = (scaleMax + 1) − original.
 */
exportRoutes.post('/mental-health', requireAdmin, async (c) => {
    try {
        const ExcelJS = (await import('exceljs')).default;
        const body = await c.req.json().catch(() => ({}));
        const schoolId = body.schoolId ? Number(body.schoolId) : undefined;
        const studentQuery = db
            .select({
            student: students,
            school: schools,
        })
            .from(students)
            .leftJoin(schools, eq(schools.id, students.schoolId))
            .$dynamic();
        const studentRows = schoolId
            ? await studentQuery.where(eq(students.schoolId, schoolId))
            : await studentQuery;
        if (studentRows.length === 0) {
            return c.json({ success: false, error: 'No students found to export' }, 404);
        }
        const studentIds = studentRows.map((r) => r.student.id);
        const assessments = await db
            .select()
            .from(studentMentalHealthAssessments)
            .where(inArray(studentMentalHealthAssessments.studentId, studentIds))
            .orderBy(desc(studentMentalHealthAssessments.createdAt));
        const latestByStudent = new Map();
        for (const row of assessments) {
            if (!latestByStudent.has(row.studentId)) {
                latestByStudent.set(row.studentId, row);
            }
        }
        const exportRows = studentRows.filter((r) => latestByStudent.has(r.student.id));
        if (exportRows.length === 0) {
            return c.json({ success: false, error: 'No mental health assessments found to export' }, 404);
        }
        const workbook = new ExcelJS.Workbook();
        const notes = workbook.addWorksheet('Scoring Notes');
        notes.getColumn(1).width = 28;
        notes.getColumn(2).width = 90;
        notes.addRow(['Wish2Care Mental Health Export — Normalized scores']);
        notes.addRow([]);
        notes.addRow(['In-app scoring', 'Unchanged. Stored total is the sum of raw 1–5 responses.']);
        notes.addRow([
            'Export scoring',
            `Reverse-coded items use New Score = (${MH_SCALE_MAX} + 1) − Original Score. Example: 1→5, 5→1.`,
        ]);
        notes.addRow(['Reverse-coded questions', MH_REVERSE_QUESTION_NUMBERS.join(', ')]);
        notes.addRow([
            'Normalized total',
            'Sum of all 30 item scores after reverse-coding those questions. Range 30–150.',
        ]);
        const sheet = workbook.addWorksheet('Mental Health Normalized');
        const headers = [
            'Student Code',
            'Name',
            'School',
            'Age',
            'Gender',
            'Assessment Date',
            ...Array.from({ length: 30 }, (_, i) => {
                const n = i + 1;
                const tag = MH_REVERSE_QUESTION_NUMBERS.includes(n) ? ' (R)' : '';
                return `Q${n}${tag}`;
            }),
            'Original Total (stored)',
            'Normalized Total',
        ];
        sheet.addRow(headers);
        sheet.getRow(1).font = { bold: true };
        for (const { student, school } of exportRows) {
            const assessment = latestByStudent.get(student.id);
            const responses = (assessment.responses || {});
            const itemScores = Array.from({ length: 30 }, (_, i) => normalizeItemScore(i, responses[`q${i}`]));
            sheet.addRow([
                student.studentCode,
                student.name,
                school?.name || '',
                student.age,
                genderLabel(student.gender),
                assessment.date,
                ...itemScores,
                assessment.totalScore,
                computeNormalizedMhTotal(responses),
            ]);
        }
        headers.forEach((_, i) => {
            sheet.getColumn(i + 1).width = i < 6 ? 18 : 12;
        });
        sheet.getColumn(2).width = 28;
        sheet.getColumn(3).width = 32;
        const buffer = await workbook.xlsx.writeBuffer();
        return c.body(buffer, 200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="Wish2Care_MH_Normalized.xlsx"',
        });
    }
    catch (err) {
        console.error('Mental health export error:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});
exportRoutes.post('/', async (c) => {
    try {
        // Lazy-load ExcelJS — keep it off the cold-start path for other routes
        const ExcelJS = (await import('exceljs')).default;
        const body = await c.req.json();
        const { schoolId, studentIds } = body;
        let query = db
            .select({
            student: students,
            healthRecord: healthRecords,
            school: schools,
        })
            .from(students)
            .leftJoin(healthRecords, eq(students.id, healthRecords.studentId))
            .leftJoin(schools, eq(students.schoolId, schools.id));
        if (studentIds && studentIds.length > 0) {
            query.where(inArray(students.id, studentIds));
        }
        else if (schoolId) {
            query.where(eq(students.schoolId, schoolId));
        }
        const data = await query;
        if (data.length === 0) {
            return c.json({ success: false, error: 'No data found to export' }, 404);
        }
        const candidates = [
            path.join(process.cwd(), '..', 'Wish2Care_SAFE_Health_Intelligence_System.xlsx'),
            path.join(process.cwd(), 'Wish2Care_SAFE_Health_Intelligence_System.xlsx'),
            path.join(process.cwd(), '..', 'Wish2Care_SAFE_Wellness_Score_Tool.xlsx'),
        ];
        const templatePath = candidates.find((p) => fs.existsSync(p));
        if (!templatePath) {
            throw new Error('Excel template not found. Place Wish2Care_SAFE_Health_Intelligence_System.xlsx in the project root.');
        }
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        const sheet = workbook.getWorksheet(EXCEL_SHEET_NAME);
        if (!sheet) {
            throw new Error(`Template sheet "${EXCEL_SHEET_NAME}" not found`);
        }
        const numStudents = data.length;
        const availableRows = EXCEL_TEMPLATE_LAST_ROW - EXCEL_DATA_START_ROW + 1;
        if (numStudents > availableRows) {
            const rowsToAdd = numStudents - availableRows;
            sheet.duplicateRow(EXCEL_TEMPLATE_LAST_ROW, rowsToAdd, true);
        }
        data.forEach((row, index) => {
            const { student, healthRecord, school } = row;
            const rowIndex = EXCEL_DATA_START_ROW + index;
            const excelRow = sheet.getRow(rowIndex);
            const mapVal = (col, val) => {
                if (val !== null && val !== undefined && val !== '') {
                    excelRow.getCell(col).value = val;
                }
            };
            mapVal(EXCEL_COLUMN_MAP.studentCode, student.studentCode);
            mapVal(EXCEL_COLUMN_MAP.school, school?.name);
            mapVal(EXCEL_COLUMN_MAP.studentName, student.name);
            mapVal(EXCEL_COLUMN_MAP.age, student.age);
            mapVal(EXCEL_COLUMN_MAP.gender, genderLabel(student.gender));
            mapVal(EXCEL_COLUMN_MAP.dateOfBirth, student.dateOfBirth);
            mapVal(EXCEL_COLUMN_MAP.parentName, student.nomineeName);
            mapVal(EXCEL_COLUMN_MAP.parentMobile, student.fatherMobileNo || student.mobileNo);
            mapVal(EXCEL_COLUMN_MAP.emergencyContact, student.mobileNo);
            mapVal(EXCEL_COLUMN_MAP.bloodGroup, student.bloodGroup);
            if (healthRecord) {
                mapVal(EXCEL_COLUMN_MAP.date, healthRecord.date);
                mapVal(EXCEL_COLUMN_MAP.height, healthRecord.height);
                mapVal(EXCEL_COLUMN_MAP.weight, healthRecord.weight);
                mapVal(EXCEL_COLUMN_MAP.muac, healthRecord.muac);
                mapVal(EXCEL_COLUMN_MAP.waistCircumference, healthRecord.waistCircumference);
                mapVal(EXCEL_COLUMN_MAP.breakfast, healthRecord.breakfast);
                mapVal(EXCEL_COLUMN_MAP.fruitIntake, healthRecord.fruitIntake);
                mapVal(EXCEL_COLUMN_MAP.vegetables, healthRecord.vegetables);
                mapVal(EXCEL_COLUMN_MAP.proteinIntake, healthRecord.proteinIntake);
                mapVal(EXCEL_COLUMN_MAP.junkFood, healthRecord.junkFood);
                mapVal(EXCEL_COLUMN_MAP.sugaryDrinks, healthRecord.sugaryDrinks);
                mapVal(EXCEL_COLUMN_MAP.waterIntake, healthRecord.waterIntake);
                mapVal(EXCEL_COLUMN_MAP.physicalActivity, healthRecord.physicalActivity);
                mapVal(EXCEL_COLUMN_MAP.screenTime, healthRecord.screenTime);
                mapVal(EXCEL_COLUMN_MAP.outdoorPlay, healthRecord.outdoorPlay);
                mapVal(EXCEL_COLUMN_MAP.sleepHours, healthRecord.sleepHours);
                mapVal(EXCEL_COLUMN_MAP.smoking, healthRecord.smoking);
                mapVal(EXCEL_COLUMN_MAP.alcohol, healthRecord.alcohol);
                mapVal(EXCEL_COLUMN_MAP.chronicDisease, healthRecord.chronicDisease);
                mapVal(EXCEL_COLUMN_MAP.frequentFever, healthRecord.frequentFever);
                mapVal(EXCEL_COLUMN_MAP.weightLoss, healthRecord.weightLoss);
                mapVal(EXCEL_COLUMN_MAP.poorAppetite, healthRecord.poorAppetite);
                mapVal(EXCEL_COLUMN_MAP.repeatedInfection, healthRecord.repeatedInfection);
                mapVal(EXCEL_COLUMN_MAP.hospitalisation, healthRecord.hospitalisation);
                mapVal(EXCEL_COLUMN_MAP.medication, healthRecord.medication);
                mapVal(EXCEL_COLUMN_MAP.stress, healthRecord.stress);
                mapVal(EXCEL_COLUMN_MAP.mood, healthRecord.mood);
                mapVal(EXCEL_COLUMN_MAP.concentration, healthRecord.concentration);
                mapVal(EXCEL_COLUMN_MAP.bullying, healthRecord.bullying);
                mapVal(EXCEL_COLUMN_MAP.pallor, healthRecord.pallor);
                mapVal(EXCEL_COLUMN_MAP.dentalCaries, healthRecord.dentalCaries);
                mapVal(EXCEL_COLUMN_MAP.poorOralHygiene, healthRecord.poorOralHygiene);
                mapVal(EXCEL_COLUMN_MAP.visionProblem, healthRecord.visionProblem);
                mapVal(EXCEL_COLUMN_MAP.hairChanges, healthRecord.hairChanges);
                mapVal(EXCEL_COLUMN_MAP.skinChanges, healthRecord.skinChanges);
                mapVal(EXCEL_COLUMN_MAP.vaccinationComplete, healthRecord.vaccinationComplete);
                mapVal(EXCEL_COLUMN_MAP.deworming, healthRecord.deworming);
                mapVal(EXCEL_COLUMN_MAP.handHygiene, healthRecord.handHygiene);
                mapVal(EXCEL_COLUMN_MAP.dentalCheckup, healthRecord.dentalCheckup);
                mapVal(EXCEL_COLUMN_MAP.visionScreening, healthRecord.visionScreening);
            }
            excelRow.commit();
        });
        if (numStudents < availableRows) {
            for (let i = numStudents; i < availableRows; i++) {
                const rowIndex = EXCEL_DATA_START_ROW + i;
                const excelRow = sheet.getRow(rowIndex);
                Object.values(EXCEL_COLUMN_MAP).forEach((col) => {
                    excelRow.getCell(col).value = null;
                });
                excelRow.commit();
            }
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return c.body(buffer, 200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="Wish2Care_Export.xlsx"',
        });
    }
    catch (err) {
        console.error('Export error:', err);
        return c.json({ success: false, error: err.message }, 500);
    }
});
//# sourceMappingURL=export.js.map