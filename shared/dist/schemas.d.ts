import { z } from 'zod';
export declare const optionalNumber: () => z.ZodEffects<z.ZodTypeAny, any, unknown>;
export declare const optionalString: () => z.ZodEffects<z.ZodTypeAny, any, unknown>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerWorkerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["admin", "fieldworker", "student"]>>;
    assignedSchoolId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    name: string;
    role: "admin" | "fieldworker" | "student";
    assignedSchoolId?: number | null | undefined;
}, {
    email: string;
    password: string;
    name: string;
    role?: "admin" | "fieldworker" | "student" | undefined;
    assignedSchoolId?: number | null | undefined;
}>;
export declare const requestOtpSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const setStudentPhoneSchema: z.ZodObject<{
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
}, {
    phone: string;
}>;
export declare const schoolSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const studentSchema: z.ZodObject<{
    studentCode: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    age: z.ZodNumber;
    gender: z.ZodEnum<["M", "F"]>;
    schoolId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    age: number;
    gender: "M" | "F";
    schoolId: number;
    studentCode?: string | undefined;
}, {
    name: string;
    age: number;
    gender: "M" | "F";
    schoolId: number;
    studentCode?: string | undefined;
}>;
export declare const studentUploadRowSchema: z.ZodObject<{
    studentCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    school: z.ZodString;
    age: z.ZodNumber;
    gender: z.ZodEffects<z.ZodString, "M" | "F", string>;
}, "strip", z.ZodTypeAny, {
    name: string;
    age: number;
    gender: "M" | "F";
    school: string;
    studentCode?: string | null | undefined;
}, {
    name: string;
    age: number;
    gender: string;
    school: string;
    studentCode?: string | null | undefined;
}>;
/** Row schema for bulk upload tied to a specific school (school comes from URL, not the sheet). */
export declare const studentSchoolUploadRowSchema: z.ZodObject<{
    studentCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    age: z.ZodNumber;
    gender: z.ZodEffects<z.ZodString, "M" | "F", string>;
}, "strip", z.ZodTypeAny, {
    name: string;
    age: number;
    gender: "M" | "F";
    studentCode?: string | null | undefined;
}, {
    name: string;
    age: number;
    gender: string;
    studentCode?: string | null | undefined;
}>;
export declare const healthRecordSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    date: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    height: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    weight: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    undernutritionClass: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    overweightClass: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    hb: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    anaemiaClass: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    systolic: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    diastolic: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    bpClass: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    waistCircumference: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    familyHxCount: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    metabolicRiskClass: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    rightEyeAcuity: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    leftEyeAcuity: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    decayedTeethCount: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    wheezeSymptom: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    measuredPefr: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    predictedPefr: z.ZodEffects<z.ZodTypeAny, any, unknown>;
    tbCough: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    tbFever: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    tbNightSweats: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    tbWeightLoss: z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>;
    mentalWellbeingResult: z.ZodEffects<z.ZodTypeAny, any, unknown>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    date?: string | null | undefined;
    height?: any;
    weight?: any;
    undernutritionClass?: any;
    overweightClass?: any;
    hb?: any;
    anaemiaClass?: any;
    systolic?: any;
    diastolic?: any;
    bpClass?: any;
    waistCircumference?: any;
    familyHxCount?: any;
    metabolicRiskClass?: any;
    rightEyeAcuity?: any;
    leftEyeAcuity?: any;
    decayedTeethCount?: any;
    wheezeSymptom?: any;
    measuredPefr?: any;
    predictedPefr?: any;
    tbCough?: any;
    tbFever?: any;
    tbNightSweats?: any;
    tbWeightLoss?: any;
    mentalWellbeingResult?: any;
}, {
    studentId: number;
    date?: string | null | undefined;
    height?: unknown;
    weight?: unknown;
    undernutritionClass?: unknown;
    overweightClass?: unknown;
    hb?: unknown;
    anaemiaClass?: unknown;
    systolic?: unknown;
    diastolic?: unknown;
    bpClass?: unknown;
    waistCircumference?: unknown;
    familyHxCount?: unknown;
    metabolicRiskClass?: unknown;
    rightEyeAcuity?: unknown;
    leftEyeAcuity?: unknown;
    decayedTeethCount?: unknown;
    wheezeSymptom?: unknown;
    measuredPefr?: unknown;
    predictedPefr?: unknown;
    tbCough?: unknown;
    tbFever?: unknown;
    tbNightSweats?: unknown;
    tbWeightLoss?: unknown;
    mentalWellbeingResult?: unknown;
}>;
export declare const healthRecordPartialSchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    studentId: z.ZodNumber;
    height: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    weight: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    undernutritionClass: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    overweightClass: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    hb: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    anaemiaClass: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    systolic: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    diastolic: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    bpClass: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    waistCircumference: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    familyHxCount: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    metabolicRiskClass: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    rightEyeAcuity: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    leftEyeAcuity: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    decayedTeethCount: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    wheezeSymptom: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    measuredPefr: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    predictedPefr: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
    tbCough: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    tbFever: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    tbNightSweats: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    tbWeightLoss: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>>>;
    mentalWellbeingResult: z.ZodOptional<z.ZodEffects<z.ZodTypeAny, any, unknown>>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    date?: string | null | undefined;
    height?: any;
    weight?: any;
    undernutritionClass?: any;
    overweightClass?: any;
    hb?: any;
    anaemiaClass?: any;
    systolic?: any;
    diastolic?: any;
    bpClass?: any;
    waistCircumference?: any;
    familyHxCount?: any;
    metabolicRiskClass?: any;
    rightEyeAcuity?: any;
    leftEyeAcuity?: any;
    decayedTeethCount?: any;
    wheezeSymptom?: any;
    measuredPefr?: any;
    predictedPefr?: any;
    tbCough?: any;
    tbFever?: any;
    tbNightSweats?: any;
    tbWeightLoss?: any;
    mentalWellbeingResult?: any;
}, {
    studentId: number;
    date?: string | null | undefined;
    height?: unknown;
    weight?: unknown;
    undernutritionClass?: unknown;
    overweightClass?: unknown;
    hb?: unknown;
    anaemiaClass?: unknown;
    systolic?: unknown;
    diastolic?: unknown;
    bpClass?: unknown;
    waistCircumference?: unknown;
    familyHxCount?: unknown;
    metabolicRiskClass?: unknown;
    rightEyeAcuity?: unknown;
    leftEyeAcuity?: unknown;
    decayedTeethCount?: unknown;
    wheezeSymptom?: unknown;
    measuredPefr?: unknown;
    predictedPefr?: unknown;
    tbCough?: unknown;
    tbFever?: unknown;
    tbNightSweats?: unknown;
    tbWeightLoss?: unknown;
    mentalWellbeingResult?: unknown;
}>;
export declare const exportRequestSchema: z.ZodObject<{
    schoolId: z.ZodOptional<z.ZodNumber>;
    studentIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strip", z.ZodTypeAny, {
    schoolId?: number | undefined;
    studentIds?: number[] | undefined;
}, {
    schoolId?: number | undefined;
    studentIds?: number[] | undefined;
}>;
export declare const validationWarnings: z.ZodObject<{
    height: z.ZodEffects<z.ZodEffects<z.ZodTypeAny, any, unknown>, any, unknown>;
    weight: z.ZodEffects<z.ZodEffects<z.ZodTypeAny, any, unknown>, any, unknown>;
    hb: z.ZodEffects<z.ZodEffects<z.ZodTypeAny, any, unknown>, any, unknown>;
}, "strip", z.ZodTypeAny, {
    height?: any;
    weight?: any;
    hb?: any;
}, {
    height?: unknown;
    weight?: unknown;
    hb?: unknown;
}>;
export declare const studentMentalHealthSchema: z.ZodObject<{
    date: z.ZodString;
    responses: z.ZodRecord<z.ZodString, z.ZodNumber>;
    totalScore: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    date: string;
    responses: Record<string, number>;
    totalScore?: number | null | undefined;
}, {
    date: string;
    responses: Record<string, number>;
    totalScore?: number | null | undefined;
}>;
export declare const schoolAuditChecklistSchema: z.ZodObject<{
    dateOfAudit: z.ZodString;
    auditorName: z.ZodString;
    responses: z.ZodRecord<z.ZodString, z.ZodBoolean>;
    criticalNonCompliance: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    strengths: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    areasOfImprovement: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    correctiveActions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    recommendations: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    overallScore: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    safeGrade: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    accreditationStatus: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    responses: Record<string, boolean>;
    dateOfAudit: string;
    auditorName: string;
    criticalNonCompliance?: string[] | undefined;
    strengths?: string | null | undefined;
    areasOfImprovement?: string | null | undefined;
    correctiveActions?: string | null | undefined;
    recommendations?: string | null | undefined;
    overallScore?: number | null | undefined;
    safeGrade?: string | null | undefined;
    accreditationStatus?: string | null | undefined;
}, {
    responses: Record<string, boolean>;
    dateOfAudit: string;
    auditorName: string;
    criticalNonCompliance?: string[] | undefined;
    strengths?: string | null | undefined;
    areasOfImprovement?: string | null | undefined;
    correctiveActions?: string | null | undefined;
    recommendations?: string | null | undefined;
    overallScore?: number | null | undefined;
    safeGrade?: string | null | undefined;
    accreditationStatus?: string | null | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map