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
    height: number | null;
    weight: number | null;
    muac: number | null;
    waistCircumference: number | null;
    breakfast: string | null;
    fruitIntake: string | null;
    vegetables: string | null;
    proteinIntake: string | null;
    junkFood: string | null;
    sugaryDrinks: string | null;
    waterIntake: string | null;
    physicalActivity: string | null;
    screenTime: string | null;
    outdoorPlay: string | null;
    sleepHours: string | null;
    smoking: string | null;
    alcohol: string | null;
    chronicDisease: string | null;
    frequentFever: string | null;
    weightLoss: string | null;
    poorAppetite: string | null;
    repeatedInfection: string | null;
    hospitalisation: string | null;
    medication: string | null;
    stress: string | null;
    mood: string | null;
    concentration: string | null;
    bullying: string | null;
    pallor: string | null;
    dentalCaries: string | null;
    poorOralHygiene: string | null;
    visionProblem: string | null;
    hairChanges: string | null;
    skinChanges: string | null;
    vaccinationComplete: string | null;
    deworming: string | null;
    handHygiene: string | null;
    dentalCheckup: string | null;
    visionScreening: string | null;
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
 * Returns the count of completed screening sections (out of 7: A–G)
 * matching Excel domain completeness (all inputs present in a section).
 */
export declare function countCompletedDomains(record: Partial<HealthRecord>): number;
export declare function isRecordComplete(record: Partial<HealthRecord>): boolean;
//# sourceMappingURL=types.d.ts.map