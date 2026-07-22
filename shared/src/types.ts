import { z } from 'zod';
import type {
  loginSchema,
  registerWorkerSchema,
  studentSchema,
  studentUploadRowSchema,
  healthRecordSchema,
  healthRecordPartialSchema,
  exportRequestSchema,
  schoolSchema,
} from './schemas.js';

// ── Inferred types from schemas ────────────────────────────────────────
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterWorkerInput = z.infer<typeof registerWorkerSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type StudentUploadRow = z.infer<typeof studentUploadRowSchema>;
export type HealthRecordInput = z.infer<typeof healthRecordSchema>;
export type HealthRecordPartial = z.infer<typeof healthRecordPartialSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;

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
  createdAt: string | Date;
}

export interface HealthRecord {
  id: number;
  studentId: number;
  date: string | null;

  // Domain 1: Undernutrition
  height: number | null;
  weight: number | null;
  undernutritionClass: string | null;

  // Domain 2: Overweight/Obesity
  overweightClass: string | null;

  // Domain 3: Anaemia
  hb: number | null;
  anaemiaClass: string | null;

  // Domain 4: Blood Pressure
  systolic: number | null;
  diastolic: number | null;
  bpClass: string | null;

  // Domain 5: Metabolic Risk
  waistCircumference: number | null;
  familyHxCount: number | null;
  metabolicRiskClass: string | null;

  // Domain 6: Vision
  rightEyeAcuity: number | null;
  leftEyeAcuity: number | null;

  // Domain 7: Oral Health
  decayedTeethCount: number | null;

  // Domain 8: Respiratory
  wheezeSymptom: string | null;
  measuredPefr: number | null;
  predictedPefr: number | null;

  // TB Red-Flag Screen
  tbCough: string | null;
  tbFever: string | null;
  tbNightSweats: string | null;
  tbWeightLoss: string | null;

  // Mental Wellbeing
  mentalWellbeingResult: string | null;

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
/**
 * Returns the count of completed scored domains (out of 8) based on
 * the presence of the required input fields for each domain.
 */
export function countCompletedDomains(record: Partial<HealthRecord>): number {
  let count = 0;

  // Domain 1: Undernutrition — needs height, weight, and classification
  if (record.height != null && record.weight != null && record.undernutritionClass) count++;

  // Domain 2: Overweight/Obesity — needs classification
  if (record.overweightClass) count++;

  // Domain 3: Anaemia — needs Hb and classification
  if (record.hb != null && record.anaemiaClass) count++;

  // Domain 4: Blood Pressure — needs systolic, diastolic, classification
  if (record.systolic != null && record.diastolic != null && record.bpClass) count++;

  // Domain 5: Metabolic Risk — needs waist, familyHx, classification
  if (record.waistCircumference != null && record.metabolicRiskClass) count++;

  // Domain 6: Vision — needs both eye acuities (classification auto-computed)
  if (record.rightEyeAcuity != null && record.leftEyeAcuity != null) count++;

  // Domain 7: Oral Health — needs decayed teeth count (classification auto-computed)
  if (record.decayedTeethCount != null) count++;

  // Domain 8: Respiratory — needs wheeze or PEFR data (classification auto-computed)
  if (record.wheezeSymptom != null || record.measuredPefr != null) count++;

  return count;
}

export function isRecordComplete(record: Partial<HealthRecord>): boolean {
  return countCompletedDomains(record) === 8;
}
