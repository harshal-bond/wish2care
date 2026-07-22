import { Hono } from 'hono';
import { db } from '../db/index.js';
import { students, healthRecords, schools } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { eq, inArray } from 'drizzle-orm';
import { EXCEL_COLUMN_MAP, EXCEL_DATA_START_ROW, EXCEL_TEMPLATE_LAST_ROW } from '@wish2care/shared';
import ExcelJS from 'exceljs';
import path from 'path';
export const exportRoutes = new Hono();
exportRoutes.use('/*', authMiddleware);
exportRoutes.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const { schoolId, studentIds } = body;
        let query = db.select({
            student: students,
            healthRecord: healthRecords,
            school: schools
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
        // Load Excel Template
        const templatePath = path.join(process.cwd(), '..', 'Wish2Care_SAFE_Wellness_Score_Tool.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        const sheet = workbook.getWorksheet('Field Data Entry');
        if (!sheet) {
            throw new Error('Template sheet "Field Data Entry" not found');
        }
        // Check if we need to extend the rows
        const numStudents = data.length;
        const availableRows = (EXCEL_TEMPLATE_LAST_ROW - EXCEL_DATA_START_ROW) + 1; // 60
        if (numStudents > availableRows) {
            const rowsToAdd = numStudents - availableRows;
            const copyFromRowNumber = EXCEL_TEMPLATE_LAST_ROW;
            sheet.duplicateRow(copyFromRowNumber, rowsToAdd, true);
        }
        // Fill data
        data.forEach((row, index) => {
            const { student, healthRecord, school } = row;
            const rowIndex = EXCEL_DATA_START_ROW + index;
            // Ensure row exists (it should, due to duplication above)
            const excelRow = sheet.getRow(rowIndex);
            // Map values
            const mapVal = (col, val) => {
                if (val !== null && val !== undefined) {
                    excelRow.getCell(col).value = val;
                }
            };
            // Student info
            mapVal(EXCEL_COLUMN_MAP.studentCode, student.studentCode);
            mapVal(EXCEL_COLUMN_MAP.school, school?.name);
            if (healthRecord) {
                mapVal(EXCEL_COLUMN_MAP.date, healthRecord.date);
            }
            mapVal(EXCEL_COLUMN_MAP.age, student.age);
            mapVal(EXCEL_COLUMN_MAP.gender, student.gender);
            // Health record fields
            if (healthRecord) {
                mapVal(EXCEL_COLUMN_MAP.height, healthRecord.height);
                mapVal(EXCEL_COLUMN_MAP.weight, healthRecord.weight);
                mapVal(EXCEL_COLUMN_MAP.undernutritionClass, healthRecord.undernutritionClass);
                mapVal(EXCEL_COLUMN_MAP.overweightClass, healthRecord.overweightClass);
                mapVal(EXCEL_COLUMN_MAP.hb, healthRecord.hb);
                mapVal(EXCEL_COLUMN_MAP.anaemiaClass, healthRecord.anaemiaClass);
                mapVal(EXCEL_COLUMN_MAP.systolic, healthRecord.systolic);
                mapVal(EXCEL_COLUMN_MAP.diastolic, healthRecord.diastolic);
                mapVal(EXCEL_COLUMN_MAP.bpClass, healthRecord.bpClass);
                mapVal(EXCEL_COLUMN_MAP.waistCircumference, healthRecord.waistCircumference);
                mapVal(EXCEL_COLUMN_MAP.familyHxCount, healthRecord.familyHxCount);
                mapVal(EXCEL_COLUMN_MAP.metabolicRiskClass, healthRecord.metabolicRiskClass);
                mapVal(EXCEL_COLUMN_MAP.rightEyeAcuity, healthRecord.rightEyeAcuity);
                mapVal(EXCEL_COLUMN_MAP.leftEyeAcuity, healthRecord.leftEyeAcuity);
                mapVal(EXCEL_COLUMN_MAP.decayedTeethCount, healthRecord.decayedTeethCount);
                mapVal(EXCEL_COLUMN_MAP.wheezeSymptom, healthRecord.wheezeSymptom);
                mapVal(EXCEL_COLUMN_MAP.measuredPefr, healthRecord.measuredPefr);
                mapVal(EXCEL_COLUMN_MAP.predictedPefr, healthRecord.predictedPefr);
                mapVal(EXCEL_COLUMN_MAP.tbCough, healthRecord.tbCough);
                mapVal(EXCEL_COLUMN_MAP.tbFever, healthRecord.tbFever);
                mapVal(EXCEL_COLUMN_MAP.tbNightSweats, healthRecord.tbNightSweats);
                mapVal(EXCEL_COLUMN_MAP.tbWeightLoss, healthRecord.tbWeightLoss);
                mapVal(EXCEL_COLUMN_MAP.mentalWellbeingResult, healthRecord.mentalWellbeingResult);
            }
            excelRow.commit();
        });
        // Clear out remaining template rows if there are fewer students than 60
        if (numStudents < availableRows) {
            for (let i = numStudents; i < availableRows; i++) {
                const rowIndex = EXCEL_DATA_START_ROW + i;
                const excelRow = sheet.getRow(rowIndex);
                // Clear only the input cells (blue cells), not the formula cells
                Object.values(EXCEL_COLUMN_MAP).forEach(col => {
                    excelRow.getCell(col).value = null;
                });
                excelRow.commit();
            }
        }
        // Generate output
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