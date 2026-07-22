import { pgTable, serial, varchar, timestamp, integer, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// ── Schools ────────────────────────────────────────────────────────────
export const schools = pgTable('schools', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// ── Workers (Admin & Fieldworker) ──────────────────────────────────────
export const workers = pgTable('workers', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('fieldworker'), // 'admin' | 'fieldworker'
    assignedSchoolId: integer('assigned_school_id').references(() => schools.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// ── Students ───────────────────────────────────────────────────────────
export const students = pgTable('students', {
    id: serial('id').primaryKey(),
    studentCode: varchar('student_code', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    age: real('age').notNull(),
    gender: varchar('gender', { length: 10 }).notNull(), // 'M' | 'F'
    schoolId: integer('school_id')
        .notNull()
        .references(() => schools.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// ── Health Records (1-to-1 with Student) ───────────────────────────────
export const healthRecords = pgTable('health_records', {
    id: serial('id').primaryKey(),
    studentId: integer('student_id')
        .notNull()
        .unique()
        .references(() => students.id, { onDelete: 'cascade' }),
    date: varchar('date', { length: 50 }), // YYYY-MM-DD format
    // Domain 1: Undernutrition
    height: real('height'),
    weight: real('weight'),
    undernutritionClass: varchar('undernutrition_class', { length: 50 }),
    // Domain 2: Overweight/Obesity
    overweightClass: varchar('overweight_class', { length: 50 }),
    // Domain 3: Anaemia
    hb: real('hb'),
    anaemiaClass: varchar('anaemia_class', { length: 50 }),
    // Domain 4: Blood Pressure
    systolic: real('systolic'),
    diastolic: real('diastolic'),
    bpClass: varchar('bp_class', { length: 50 }),
    // Domain 5: Metabolic Risk
    waistCircumference: real('waist_circumference'),
    familyHxCount: integer('family_hx_count'),
    metabolicRiskClass: varchar('metabolic_risk_class', { length: 50 }),
    // Domain 6: Vision
    rightEyeAcuity: real('right_eye_acuity'),
    leftEyeAcuity: real('left_eye_acuity'),
    // Domain 7: Oral Health
    decayedTeethCount: integer('decayed_teeth_count'),
    // Domain 8: Respiratory
    wheezeSymptom: varchar('wheeze_symptom', { length: 10 }), // 'Yes' | 'No'
    measuredPefr: real('measured_pefr'),
    predictedPefr: real('predicted_pefr'),
    // TB Red-Flag Screen
    tbCough: varchar('tb_cough', { length: 10 }),
    tbFever: varchar('tb_fever', { length: 10 }),
    tbNightSweats: varchar('tb_night_sweats', { length: 10 }),
    tbWeightLoss: varchar('tb_weight_loss', { length: 10 }),
    // Mental Wellbeing
    mentalWellbeingResult: varchar('mental_wellbeing_result', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// ── Relations ──────────────────────────────────────────────────────────
export const schoolsRelations = relations(schools, ({ many }) => ({
    students: many(students),
    workers: many(workers),
}));
export const studentsRelations = relations(students, ({ one }) => ({
    school: one(schools, {
        fields: [students.schoolId],
        references: [schools.id],
    }),
    healthRecord: one(healthRecords, {
        fields: [students.id],
        references: [healthRecords.studentId],
    }),
}));
export const workersRelations = relations(workers, ({ one }) => ({
    assignedSchool: one(schools, {
        fields: [workers.assignedSchoolId],
        references: [schools.id],
    }),
}));
export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
    student: one(students, {
        fields: [healthRecords.studentId],
        references: [students.id],
    }),
}));
//# sourceMappingURL=schema.js.map