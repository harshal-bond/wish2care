import { z } from 'zod';
import { CLASSIFICATION, GENDER_OPTIONS, YES_NO, MENTAL_WELLBEING_OPTIONS, ROLES, VALIDATION_RANGES, } from './constants.js';
export const optionalNumber = () => z.union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val) => {
    if (val === '' || val === null || val === undefined)
        return null;
    const num = Number(val);
    if (Number.isNaN(num))
        return null;
    return num;
});
export const optionalString = () => z.union([z.string(), z.null(), z.undefined()])
    .transform((val) => (val === '' || val == null ? null : val));
const classificationEnum = z.union([
    z.enum([CLASSIFICATION.NORMAL, CLASSIFICATION.CAUTION, CLASSIFICATION.HIGH_RISK]),
    z.literal(''),
    z.null(),
    z.undefined()
]).transform((val) => (val === '' || val == null ? null : val));
const yesNoEnum = z.union([
    z.enum(YES_NO),
    z.literal(''),
    z.null(),
    z.undefined()
]).transform((val) => (val === '' || val == null ? null : val));
// ── Auth schemas ───────────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});
export const registerWorkerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(ROLES).default('fieldworker'),
    assignedSchoolId: z.number().optional().nullable(),
});
// ── School schema ──────────────────────────────────────────────────────
export const schoolSchema = z.object({
    name: z.string().min(1, 'School name is required'),
});
// ── Student schema ─────────────────────────────────────────────────────
export const studentSchema = z.object({
    studentCode: z.string().optional(), // Auto-generated if not provided
    name: z.string().min(1, 'Student name is required'),
    age: z.coerce.number().min(VALIDATION_RANGES.age.min).max(VALIDATION_RANGES.age.max),
    gender: z.enum(GENDER_OPTIONS),
    schoolId: z.coerce.number().int().positive(),
    dateOfBirth: optionalString(),
    bloodGroup: optionalString(),
    email: optionalString(),
    mobileNo: optionalString(),
    fatherMobileNo: optionalString(),
    nomineeName: optionalString(),
    relationship: optionalString(),
    courseName: optionalString(),
    collegeStream: optionalString(),
    localAddress: optionalString(),
    area: optionalString(),
});
export const studentUploadRowSchema = z.object({
    studentCode: z.string().optional().nullable(),
    name: z.string().min(1, 'Student name is required'),
    school: z.string().min(1, 'School name is required'),
    age: z.coerce.number().min(VALIDATION_RANGES.age.min).max(VALIDATION_RANGES.age.max),
    gender: z.string().transform((v) => v.toUpperCase().charAt(0)),
    dateOfBirth: optionalString(),
    bloodGroup: optionalString(),
    email: optionalString(),
    mobileNo: optionalString(),
    fatherMobileNo: optionalString(),
    nomineeName: optionalString(),
    relationship: optionalString(),
    courseName: optionalString(),
    collegeStream: optionalString(),
    localAddress: optionalString(),
    area: optionalString(),
});
/** Row schema for bulk upload tied to a specific school (school comes from URL, not the sheet). */
export const studentSchoolUploadRowSchema = z.object({
    studentCode: z.string().optional().nullable(),
    name: z.string().min(1, 'Student name is required'),
    age: z.coerce.number().min(VALIDATION_RANGES.age.min).max(VALIDATION_RANGES.age.max),
    gender: z.string().transform((v) => v.toUpperCase().charAt(0)),
    dateOfBirth: optionalString(),
    bloodGroup: optionalString(),
    email: optionalString(),
    mobileNo: optionalString(),
    fatherMobileNo: optionalString(),
    nomineeName: optionalString(),
    relationship: optionalString(),
    courseName: optionalString(),
    collegeStream: optionalString(),
    localAddress: optionalString(),
    area: optionalString(),
});
// ── Health record schema ───────────────────────────────────────────────
// These are the 26 raw input fields from the Excel workbook
export const healthRecordSchema = z.object({
    studentId: z.coerce.number().int().positive(),
    date: z.string().optional().nullable(),
    // Domain 1: Undernutrition
    height: optionalNumber(),
    weight: optionalNumber(),
    undernutritionClass: classificationEnum.optional().nullable(),
    // Domain 2: Overweight/Obesity
    overweightClass: classificationEnum.optional().nullable(),
    // Domain 3: Anaemia
    hb: optionalNumber(),
    anaemiaClass: classificationEnum.optional().nullable(),
    // Domain 4: Blood Pressure
    systolic: optionalNumber(),
    diastolic: optionalNumber(),
    bpClass: classificationEnum.optional().nullable(),
    // Domain 5: Metabolic Risk
    waistCircumference: optionalNumber(),
    familyHxCount: optionalNumber(),
    metabolicRiskClass: classificationEnum.optional().nullable(),
    // Domain 6: Vision (classification auto-computed by Excel)
    rightEyeAcuity: optionalNumber(),
    leftEyeAcuity: optionalNumber(),
    // Domain 7: Oral Health (classification auto-computed by Excel)
    decayedTeethCount: optionalNumber(),
    // Domain 8: Respiratory (classification auto-computed by Excel)
    wheezeSymptom: yesNoEnum.optional().nullable(),
    measuredPefr: optionalNumber(),
    predictedPefr: optionalNumber(),
    // TB Red-Flag Screen
    tbCough: yesNoEnum.optional().nullable(),
    tbFever: yesNoEnum.optional().nullable(),
    tbNightSweats: yesNoEnum.optional().nullable(),
    tbWeightLoss: yesNoEnum.optional().nullable(),
    // Mental Wellbeing Red-Flag
    mentalWellbeingResult: z.union([z.enum(MENTAL_WELLBEING_OPTIONS), z.literal(''), z.null(), z.undefined()]).transform((val) => (val === '' || val == null ? null : val)),
});
// ── Partial health record for autosave ─────────────────────────────────
export const healthRecordPartialSchema = healthRecordSchema.partial().required({
    studentId: true,
});
// ── Export request schema ──────────────────────────────────────────────
export const exportRequestSchema = z.object({
    schoolId: z.coerce.number().int().positive().optional(),
    studentIds: z.array(z.coerce.number().int().positive()).optional(),
});
// ── Validation warnings (soft validation) ──────────────────────────────
export const validationWarnings = z.object({
    height: optionalNumber().refine((v) => !v || (v >= VALIDATION_RANGES.height.min && v <= VALIDATION_RANGES.height.max), { message: `Height should be between ${VALIDATION_RANGES.height.min}–${VALIDATION_RANGES.height.max} cm` }),
    weight: optionalNumber().refine((v) => !v || (v >= VALIDATION_RANGES.weight.min && v <= VALIDATION_RANGES.weight.max), { message: `Weight should be between ${VALIDATION_RANGES.weight.min}–${VALIDATION_RANGES.weight.max} kg` }),
    hb: optionalNumber().refine((v) => !v || (v >= VALIDATION_RANGES.hb.min && v <= VALIDATION_RANGES.hb.max), { message: `Hb should be between ${VALIDATION_RANGES.hb.min}–${VALIDATION_RANGES.hb.max} g/dL` }),
});
// ── Mental Health Awareness Form Schema ────────────────────────────────
export const studentMentalHealthSchema = z.object({
    date: z.string().min(1, 'Date is required'),
    responses: z.record(z.string(), z.coerce.number().min(1).max(5)),
    totalScore: z.coerce.number().optional().nullable(),
});
// ── School Audit Checklist Schema ──────────────────────────────────────
export const schoolAuditChecklistSchema = z.object({
    dateOfAudit: z.string().min(1, 'Date of Audit is required'),
    auditorName: z.string().min(1, 'Auditor Name is required'),
    responses: z.record(z.string(), z.boolean()),
    criticalNonCompliance: z.array(z.string()).optional(),
    strengths: z.string().optional().nullable(),
    areasOfImprovement: z.string().optional().nullable(),
    correctiveActions: z.string().optional().nullable(),
    recommendations: z.string().optional().nullable(),
    overallScore: z.coerce.number().optional().nullable(),
    safeGrade: z.string().optional().nullable(),
    accreditationStatus: z.string().optional().nullable(),
});
//# sourceMappingURL=schemas.js.map