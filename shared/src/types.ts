import { z } from 'zod';
import type {
  loginSchema,
  registerWorkerSchema,
  studentSchema,
  studentUploadRowSchema,
  studentSchoolUploadRowSchema,
  healthRecordSchema,
  healthRecordPartialSchema,
  exportRequestSchema,
  schoolSchema,
  staffSchema,
  staffAssessmentPartialSchema,
} from './schemas.js';

// ── Inferred types from schemas ────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterWorkerInput = z.infer<typeof registerWorkerSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type StudentUploadRow = z.infer<typeof studentUploadRowSchema>;
export type StudentSchoolUploadRow = z.infer<typeof studentSchoolUploadRowSchema>;

export interface StudentUploadResult {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}
export type HealthRecordInput = z.infer<typeof healthRecordSchema>;
export type HealthRecordPartial = z.infer<typeof healthRecordPartialSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
export type StaffAssessmentPartial = z.infer<typeof staffAssessmentPartialSchema>;

// ── API response types ─────────────────────────────────────────────────
export interface School {
  id: number;
  name: string;
  createdAt: string | Date;
  _count?: {
    students: number;
    completed: number;
  };
}

export interface Student {
  id: number;
  studentCode: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  schoolId: number;
  school?: School;
  healthRecord?: HealthRecord | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  email?: string | null;
  mobileNo?: string | null;
  fatherMobileNo?: string | null;
  nomineeName?: string | null;
  relationship?: string | null;
  courseName?: string | null;
  collegeStream?: string | null;
  localAddress?: string | null;
  area?: string | null;
  createdAt: string | Date;
}

export interface HealthRecord {
  id: number;
  studentId: number;
  date: string | null;

  // Section A – Anthropometry (height/weight/waist reused from prior schema)
  height: number | null;
  weight: number | null;
  muac: number | null;
  waistCircumference: number | null;

  // Blood Pressure & Random Blood Sugar
  systolic: number | null;
  diastolic: number | null;
  bpClass: string | null;
  randomBloodSugar: number | null;

  // Section B – Diet
  breakfast: string | null;
  fruitIntake: string | null;
  vegetables: string | null;
  proteinIntake: string | null;
  junkFood: string | null;
  sugaryDrinks: string | null;
  waterIntake: string | null;

  // Section C – Lifestyle
  physicalActivity: string | null;
  screenTime: string | null;
  outdoorPlay: string | null;
  sleepHours: string | null;
  smoking: string | null;
  alcohol: string | null;

  // Section D – Medical History
  chronicDisease: string | null;
  frequentFever: string | null;
  weightLoss: string | null;
  poorAppetite: string | null;
  repeatedInfection: string | null;
  hospitalisation: string | null;
  medication: string | null;

  // Section E – Mental Wellness
  stress: string | null;
  mood: string | null;
  concentration: string | null;
  bullying: string | null;

  // Section F – Clinical Observation
  pallor: string | null;
  dentalCaries: string | null;
  poorOralHygiene: string | null;
  visionProblem: string | null;
  hairChanges: string | null;
  skinChanges: string | null;
  clubbing: string | null;

  // Section G – Preventive Health
  vaccinationComplete: string | null;
  deworming: string | null;
  handHygiene: string | null;
  dentalCheckup: string | null;
  visionScreening: string | null;

  /** Remarks for Yes answers on Yes/No fields */
  yesNoRemarks: Record<string, string> | null;

  /** Marked complete by the fieldworker (may still have blank fields) */
  assessmentComplete: boolean;

  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Staff {
  id: number;
  staffCode: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  designation?: string | null;
  department?: string | null;
  email?: string | null;
  mobileNo?: string | null;
  schoolId: number;
  school?: School;
  assessment?: StaffAssessment | null;
  createdAt: string | Date;
  _status?: {
    isComplete: boolean;
  };
}

export interface StaffAssessment {
  id: number;
  staffId: number;
  assessmentComplete: boolean;
  payload: Record<string, unknown> | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Worker {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'fieldworker';
  assignedSchoolId: number | null;
  assignedSchool?: School | null;
  createdAt: string | Date;
}

export interface AuthResponse {
  token: string;
  worker: Omit<Worker, 'createdAt'>;
}

export interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  completedRecords: number;
  pendingRecords: number;
  completionPercentage: number;
  schoolStats: Array<{
    school: School;
    total: number;
    completed: number;
    percentage: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// ── Completion check helpers ───────────────────────────────────────────
const filled = (v: unknown) =>
  v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v));

type SectionField = { key: keyof HealthRecord; label: string };

export const SCREENING_SECTIONS: Array<{ id: string; title: string; fields: SectionField[] }> = [
  {
    id: 'A',
    title: 'A — Anthropometry',
    fields: [
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'muac', label: 'MUAC' },
      { key: 'waistCircumference', label: 'Waist Circumference' },
    ],
  },
  {
    id: 'BP',
    title: 'Blood Pressure & RBS',
    fields: [
      { key: 'systolic', label: 'Systolic BP' },
      { key: 'diastolic', label: 'Diastolic BP' },
      { key: 'bpClass', label: 'BP Class' },
      { key: 'randomBloodSugar', label: 'Random Blood Sugar' },
    ],
  },
  {
    id: 'B',
    title: 'B — Diet',
    fields: [
      { key: 'breakfast', label: 'Breakfast' },
      { key: 'fruitIntake', label: 'Fruit Intake' },
      { key: 'vegetables', label: 'Vegetables' },
      { key: 'proteinIntake', label: 'Protein Intake' },
      { key: 'junkFood', label: 'Junk Food' },
      { key: 'sugaryDrinks', label: 'Sugary Drinks' },
      { key: 'waterIntake', label: 'Water Intake' },
    ],
  },
  {
    id: 'C',
    title: 'C — Lifestyle',
    fields: [
      { key: 'physicalActivity', label: 'Physical Activity' },
      { key: 'screenTime', label: 'Screen Time' },
      { key: 'outdoorPlay', label: 'Outdoor Play' },
      { key: 'sleepHours', label: 'Sleep Hours' },
      { key: 'smoking', label: 'Smoking' },
      { key: 'alcohol', label: 'Alcohol' },
    ],
  },
  {
    id: 'D',
    title: 'D — Medical History',
    fields: [
      { key: 'chronicDisease', label: 'Chronic Disease' },
      { key: 'frequentFever', label: 'Frequent Fever' },
      { key: 'weightLoss', label: 'Weight Loss' },
      { key: 'poorAppetite', label: 'Poor Appetite' },
      { key: 'repeatedInfection', label: 'Repeated Infection' },
      { key: 'hospitalisation', label: 'Hospitalisation' },
      { key: 'medication', label: 'Medication' },
    ],
  },
  {
    id: 'E',
    title: 'E — Mental Wellness',
    fields: [
      { key: 'stress', label: 'Stress' },
      { key: 'mood', label: 'Mood' },
      { key: 'concentration', label: 'Concentration' },
      { key: 'bullying', label: 'Bullying' },
    ],
  },
  {
    id: 'F',
    title: 'F — Clinical Observation',
    fields: [
      { key: 'pallor', label: 'Pallor' },
      { key: 'dentalCaries', label: 'Dental Caries' },
      { key: 'poorOralHygiene', label: 'Poor Oral Hygiene' },
      { key: 'visionProblem', label: 'Vision Problem' },
      { key: 'hairChanges', label: 'Hair Changes' },
      { key: 'skinChanges', label: 'Skin Changes' },
      { key: 'clubbing', label: 'Clubbing' },
    ],
  },
  {
    id: 'G',
    title: 'G — Preventive Health',
    fields: [
      { key: 'vaccinationComplete', label: 'Vaccination Complete' },
      { key: 'deworming', label: 'Deworming' },
      { key: 'handHygiene', label: 'Hand Hygiene' },
      { key: 'dentalCheckup', label: 'Dental Check-up' },
      { key: 'visionScreening', label: 'Vision Screening' },
    ],
  },
];

export type MissingSectionFields = {
  sectionId: string;
  sectionTitle: string;
  fields: string[];
};

/** Missing field keys + labels for a single screening section (A, BP, B–G). */
export function getMissingFieldsForSection(
  sectionId: string,
  record: Partial<HealthRecord>
): Array<{ key: keyof HealthRecord; label: string }> {
  const section = SCREENING_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return [];
  return section.fields.filter(({ key }) => !filled(record[key]));
}

/** Per-section list of unanswered screening fields (human-readable labels). */
export function getMissingScreeningFields(
  record: Partial<HealthRecord>
): MissingSectionFields[] {
  const missing: MissingSectionFields[] = [];
  for (const section of SCREENING_SECTIONS) {
    const fields = getMissingFieldsForSection(section.id, record).map(({ label }) => label);
    if (fields.length > 0) {
      missing.push({
        sectionId: section.id,
        sectionTitle: section.title,
        fields,
      });
    }
  }
  return missing;
}

/**
 * Returns the count of completed screening sections (out of 8: A, BP, B–G)
 * matching domain completeness (all inputs present in a section).
 */
export function countCompletedDomains(record: Partial<HealthRecord>): number {
  return SCREENING_SECTIONS.filter((section) =>
    section.fields.every(({ key }) => filled(record[key]))
  ).length;
}

export function isRecordComplete(record: Partial<HealthRecord>): boolean {
  if (record.assessmentComplete === true) return true;
  return countCompletedDomains(record) === 8;
}
