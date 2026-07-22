import { z } from 'zod';
import {
  CLASSIFICATION,
  GENDER_OPTIONS,
  YES_NO,
  MENTAL_WELLBEING_OPTIONS,
  ROLES,
  VALIDATION_RANGES,
} from './constants.js';

// ── Helper: preprocess empty string "" or undefined to null ───────────
const preprocessEmptyToNull = (schema: z.ZodTypeAny) =>
  z.preprocess((val) => {
    if (val === '' || val === undefined || val === null || (typeof val === 'number' && Number.isNaN(val))) {
      return null;
    }
    return val;
  }, schema);

export const optionalNumber = () => preprocessEmptyToNull(z.coerce.number().nullable().optional());
export const optionalString = () => preprocessEmptyToNull(z.string().nullable().optional());

// ── Classification enum ────────────────────────────────────────────────
const classificationEnum = preprocessEmptyToNull(
  z.enum([CLASSIFICATION.NORMAL, CLASSIFICATION.CAUTION, CLASSIFICATION.HIGH_RISK]).nullable().optional()
);

const yesNoEnum = preprocessEmptyToNull(z.enum(YES_NO).nullable().optional());


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
});

export const studentUploadRowSchema = z.object({
  studentCode: z.string().optional().nullable(),
  name: z.string().min(1, 'Student name is required'),
  school: z.string().min(1, 'School name is required'),
  age: z.coerce.number().min(VALIDATION_RANGES.age.min).max(VALIDATION_RANGES.age.max),
  gender: z.string().transform((v) => v.toUpperCase().charAt(0) as 'M' | 'F'),
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
  mentalWellbeingResult: preprocessEmptyToNull(z.enum(MENTAL_WELLBEING_OPTIONS).nullable().optional()),
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
  height: optionalNumber().refine(
    (v) => !v || (v >= VALIDATION_RANGES.height.min && v <= VALIDATION_RANGES.height.max),
    { message: `Height should be between ${VALIDATION_RANGES.height.min}–${VALIDATION_RANGES.height.max} cm` }
  ),
  weight: optionalNumber().refine(
    (v) => !v || (v >= VALIDATION_RANGES.weight.min && v <= VALIDATION_RANGES.weight.max),
    { message: `Weight should be between ${VALIDATION_RANGES.weight.min}–${VALIDATION_RANGES.weight.max} kg` }
  ),
  hb: optionalNumber().refine(
    (v) => !v || (v >= VALIDATION_RANGES.hb.min && v <= VALIDATION_RANGES.hb.max),
    { message: `Hb should be between ${VALIDATION_RANGES.hb.min}–${VALIDATION_RANGES.hb.max} g/dL` }
  ),
});
