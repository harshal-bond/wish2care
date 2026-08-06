import { z } from 'zod';
import {
  GENDER_OPTIONS,
  YES_NO,
  YES_PARTIAL_NO,
  ROLES,
  VALIDATION_RANGES,
  BREAKFAST_OPTIONS,
  FRUIT_INTAKE_OPTIONS,
  VEGETABLES_OPTIONS,
  PROTEIN_INTAKE_OPTIONS,
  JUNK_FOOD_OPTIONS,
  SUGARY_DRINKS_OPTIONS,
  WATER_INTAKE_OPTIONS,
  PHYSICAL_ACTIVITY_OPTIONS,
  SCREEN_TIME_OPTIONS,
  OUTDOOR_PLAY_OPTIONS,
  SLEEP_HOURS_OPTIONS,
  SMOKING_OPTIONS,
  ALCOHOL_OPTIONS,
  STRESS_OPTIONS,
  MOOD_OPTIONS,
  CONCENTRATION_OPTIONS,
  HAND_HYGIENE_OPTIONS,
  BP_CLASS_OPTIONS,
} from './constants.js';

export const optionalNumber = () =>
  z.union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val): number | null => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      if (Number.isNaN(num)) return null;
      return num;
    });

export const optionalString = () =>
  z.union([z.string(), z.null(), z.undefined()])
    .transform((val): string | null => (val === '' || val == null ? null : val));

/** Optional enum that accepts '' / null / undefined → null */
function optionalEnum<T extends readonly [string, ...string[]]>(options: T) {
  type Val = T[number] | null;
  return z
    .union([z.enum(options), z.literal(''), z.null(), z.undefined()])
    .transform((val): Val => (val === '' || val == null ? null : val));
}

type YesNoVal = (typeof YES_NO)[number] | null;
const yesNoEnum = optionalEnum(YES_NO) as z.ZodType<YesNoVal, z.ZodTypeDef, unknown>;

type YesPartialNoVal = (typeof YES_PARTIAL_NO)[number] | null;
const yesPartialNoEnum = optionalEnum(YES_PARTIAL_NO) as z.ZodType<YesPartialNoVal, z.ZodTypeDef, unknown>;

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
  gender: z.string().transform((v) => v.toUpperCase().charAt(0) as 'M' | 'F'),
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
  gender: z.string().transform((v) => v.toUpperCase().charAt(0) as 'M' | 'F'),
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
// Input fields from STUDENT SCREENING (Sections A–G). Scores are computed, not stored.
export const healthRecordSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  date: z.string().optional().nullable(),

  // Section A – Anthropometry
  height: optionalNumber(),
  weight: optionalNumber(),
  muac: optionalNumber(),
  waistCircumference: optionalNumber(),

  // Blood Pressure & Random Blood Sugar (below Section A)
  systolic: optionalNumber(),
  diastolic: optionalNumber(),
  bpClass: optionalEnum(BP_CLASS_OPTIONS),
  randomBloodSugar: optionalNumber(),

  // Section B – Diet
  breakfast: optionalEnum(BREAKFAST_OPTIONS),
  fruitIntake: optionalEnum(FRUIT_INTAKE_OPTIONS),
  vegetables: optionalEnum(VEGETABLES_OPTIONS),
  proteinIntake: optionalEnum(PROTEIN_INTAKE_OPTIONS),
  junkFood: optionalEnum(JUNK_FOOD_OPTIONS),
  sugaryDrinks: optionalEnum(SUGARY_DRINKS_OPTIONS),
  waterIntake: optionalEnum(WATER_INTAKE_OPTIONS),

  // Section C – Lifestyle
  physicalActivity: optionalEnum(PHYSICAL_ACTIVITY_OPTIONS),
  screenTime: optionalEnum(SCREEN_TIME_OPTIONS),
  outdoorPlay: optionalEnum(OUTDOOR_PLAY_OPTIONS),
  sleepHours: optionalEnum(SLEEP_HOURS_OPTIONS),
  smoking: optionalEnum(SMOKING_OPTIONS),
  alcohol: optionalEnum(ALCOHOL_OPTIONS),

  // Section D – Medical History
  chronicDisease: yesNoEnum.optional().nullable(),
  frequentFever: yesNoEnum.optional().nullable(),
  weightLoss: yesNoEnum.optional().nullable(),
  poorAppetite: yesNoEnum.optional().nullable(),
  repeatedInfection: yesNoEnum.optional().nullable(),
  hospitalisation: yesNoEnum.optional().nullable(),
  medication: yesNoEnum.optional().nullable(),

  // Section E – Mental Wellness
  stress: optionalEnum(STRESS_OPTIONS),
  mood: optionalEnum(MOOD_OPTIONS),
  concentration: optionalEnum(CONCENTRATION_OPTIONS),
  bullying: yesNoEnum.optional().nullable(),

  // Section F – Clinical Observation
  pallor: yesNoEnum.optional().nullable(),
  dentalCaries: yesNoEnum.optional().nullable(),
  poorOralHygiene: yesNoEnum.optional().nullable(),
  visionProblem: yesNoEnum.optional().nullable(),
  hairChanges: yesNoEnum.optional().nullable(),
  skinChanges: yesNoEnum.optional().nullable(),
  clubbing: yesNoEnum.optional().nullable(),

  // Section G – Preventive Health
  vaccinationComplete: yesPartialNoEnum.optional().nullable(),
  deworming: yesPartialNoEnum.optional().nullable(),
  handHygiene: optionalEnum(HAND_HYGIENE_OPTIONS),
  dentalCheckup: yesNoEnum.optional().nullable(),
  visionScreening: yesNoEnum.optional().nullable(),

  /** Remarks keyed by Yes/No field name — only used when that answer is Yes */
  yesNoRemarks: z
    .union([z.record(z.string(), z.string()), z.null(), z.undefined()])
    .transform((val): Record<string, string> | null => {
      if (val == null || typeof val !== 'object') return null;
      return val;
    }),

  /** Explicitly marked complete (allows incomplete fields after user confirmation) */
  assessmentComplete: z
    .union([z.boolean(), z.null(), z.undefined()])
    .transform((val): boolean => val === true),
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
  muac: optionalNumber().refine(
    (v) => !v || (v >= VALIDATION_RANGES.muac.min && v <= VALIDATION_RANGES.muac.max),
    { message: `MUAC should be between ${VALIDATION_RANGES.muac.min}–${VALIDATION_RANGES.muac.max} cm` }
  ),
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
