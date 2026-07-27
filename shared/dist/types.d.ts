import { z } from 'zod';
import type { loginSchema, registerWorkerSchema, studentSchema, studentUploadRowSchema, studentSchoolUploadRowSchema, healthRecordSchema, healthRecordPartialSchema, exportRequestSchema, schoolSchema } from './schemas.js';
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterWorkerInput = z.infer<typeof registerWorkerSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type StudentUploadRow = z.infer<typeof studentUploadRowSchema>;
export type StudentSchoolUploadRow = z.infer<typeof studentSchoolUploadRowSchema>;
export interface StudentUploadResult {
    imported: number;
    skipped: number;
    errors: Array<{
        row: number;
        message: string;
    }>;
}
export type HealthRecordInput = z.infer<typeof healthRecordSchema>;
export type HealthRecordPartial = z.infer<typeof healthRecordPartialSchema>;
export type ExportRequest = z.infer<typeof exportRequestSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
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
    height: number | null;
    weight: number | null;
    undernutritionClass: string | null;
    overweightClass: string | null;
    hb: number | null;
    anaemiaClass: string | null;
    systolic: number | null;
    diastolic: number | null;
    bpClass: string | null;
    waistCircumference: number | null;
    familyHxCount: number | null;
    metabolicRiskClass: string | null;
    rightEyeAcuity: number | null;
    leftEyeAcuity: number | null;
    decayedTeethCount: number | null;
    wheezeSymptom: string | null;
    measuredPefr: number | null;
    predictedPefr: number | null;
    tbCough: string | null;
    tbFever: string | null;
    tbNightSweats: string | null;
    tbWeightLoss: string | null;
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
/**
 * Returns the count of completed scored domains (out of 8) based on
 * the presence of the required input fields for each domain.
 */
export declare function countCompletedDomains(record: Partial<HealthRecord>): number;
export declare function isRecordComplete(record: Partial<HealthRecord>): boolean;
//# sourceMappingURL=types.d.ts.map