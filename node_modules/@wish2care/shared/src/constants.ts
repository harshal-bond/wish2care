/**
 * Domain weights and reference values from the Excel workbook
 * "Reference & Weights" sheet
 */

// ── Classification values ──────────────────────────────────────────────
export const CLASSIFICATION = {
  NORMAL: 'Normal',
  CAUTION: 'Caution',
  HIGH_RISK: 'High-risk',
} as const;

export type Classification = (typeof CLASSIFICATION)[keyof typeof CLASSIFICATION];

// ── Subscore mapping (Normal=100, Caution=60, High-risk=20) ────────────
export const SUBSCORE_MAP: Record<Classification, number> = {
  [CLASSIFICATION.NORMAL]: 100,
  [CLASSIFICATION.CAUTION]: 60,
  [CLASSIFICATION.HIGH_RISK]: 20,
} as const;

// ── Domain weights (%) — from Reference & Weights sheet ────────────────
export const DOMAIN_WEIGHTS = {
  undernutrition: 13,
  overweight: 15,
  anaemia: 15,
  bloodPressure: 13,
  metabolicRisk: 15,
  vision: 8,
  oralHealth: 11,
  respiratory: 10,
} as const;

export type DomainKey = keyof typeof DOMAIN_WEIGHTS;

// ── Score bands ────────────────────────────────────────────────────────
export const SCORE_BANDS = {
  GREEN: { label: 'Green - On Track', min: 80, max: 100 },
  AMBER: { label: 'Amber - Monitor', min: 60, max: 79 },
  RED: { label: 'Red - Refer', min: 0, max: 59 },
} as const;

// ── TB Screen ──────────────────────────────────────────────────────────
export const TB_RESULT = {
  CLEAR: 'Clear',
  REFER: 'REFER - TB symptom screen positive',
} as const;

// ── Mental Wellbeing ───────────────────────────────────────────────────
export const MENTAL_WELLBEING_OPTIONS = ['Clear', 'REFER'] as const;

// ── Yes/No options ─────────────────────────────────────────────────────
export const YES_NO = ['Yes', 'No'] as const;
export type YesNo = (typeof YES_NO)[number];

// ── Gender ─────────────────────────────────────────────────────────────
export const GENDER_OPTIONS = ['M', 'F'] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

// ── Roles ──────────────────────────────────────────────────────────────
export const ROLES = ['admin', 'fieldworker'] as const;
export type Role = (typeof ROLES)[number];

// ── Validation ranges (warn, not block) ────────────────────────────────
export const VALIDATION_RANGES = {
  height: { min: 80, max: 220, unit: 'cm' },
  weight: { min: 5, max: 200, unit: 'kg' },
  hb: { min: 0, max: 20, unit: 'g/dL' },
  systolic: { min: 60, max: 200, unit: 'mmHg' },
  diastolic: { min: 30, max: 130, unit: 'mmHg' },
  waistCircumference: { min: 30, max: 150, unit: 'cm' },
  rightEyeAcuity: { min: 0.05, max: 2, unit: 'decimal' },
  leftEyeAcuity: { min: 0.05, max: 2, unit: 'decimal' },
  decayedTeethCount: { min: 0, max: 32, unit: 'count' },
  measuredPefr: { min: 50, max: 800, unit: 'L/min' },
  predictedPefr: { min: 50, max: 800, unit: 'L/min' },
  familyHxCount: { min: 0, max: 2, unit: 'count' },
  age: { min: 5, max: 25, unit: 'years' },
} as const;

// ── Excel cell mapping (DB field → Excel column letter) ────────────────
// Row N starts at 4 (row 3 is headers, row 2 is section headers)
export const EXCEL_COLUMN_MAP = {
  studentCode: 'A',
  school: 'B',
  date: 'C',
  age: 'D',
  gender: 'E',
  height: 'F',
  weight: 'G',
  // H = BMI (formula)
  undernutritionClass: 'I',
  // J = Undernutrition Subscore (formula)
  overweightClass: 'K',
  // L = Overweight/Obesity Subscore (formula)
  hb: 'M',
  anaemiaClass: 'N',
  // O = Anaemia Subscore (formula)
  systolic: 'P',
  diastolic: 'Q',
  bpClass: 'R',
  // S = BP Subscore (formula)
  waistCircumference: 'T',
  familyHxCount: 'U',
  metabolicRiskClass: 'V',
  // W = Metabolic Risk Subscore (formula)
  rightEyeAcuity: 'X',
  leftEyeAcuity: 'Y',
  // Z = Vision Class (formula)
  // AA = Vision Subscore (formula)
  decayedTeethCount: 'AB',
  // AC = Oral Health Class (formula)
  // AD = Oral Health Subscore (formula)
  wheezeSymptom: 'AE',
  measuredPefr: 'AF',
  predictedPefr: 'AG',
  // AH = % Predicted PEFR (formula)
  // AI = Respiratory Class (formula)
  // AJ = Respiratory Subscore (formula)
  tbCough: 'AK',
  tbFever: 'AL',
  tbNightSweats: 'AM',
  tbWeightLoss: 'AN',
  // AO = TB Screen Result (formula)
  mentalWellbeingResult: 'AP',
  // AQ-AU = Composite score formulas
} as const;

export const EXCEL_DATA_START_ROW = 4;
export const EXCEL_TEMPLATE_LAST_ROW = 63; // 60 students: rows 4–63
