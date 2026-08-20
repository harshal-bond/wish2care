import { pgTable, serial, varchar, timestamp, integer, boolean, real, jsonb, text, index } from 'drizzle-orm/pg-core';
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
  dateOfBirth: varchar('date_of_birth', { length: 50 }),
  bloodGroup: varchar('blood_group', { length: 10 }),
  email: varchar('email', { length: 255 }),
  mobileNo: varchar('mobile_no', { length: 20 }),
  fatherMobileNo: varchar('father_mobile_no', { length: 20 }),
  nomineeName: varchar('nominee_name', { length: 255 }),
  relationship: varchar('relationship', { length: 50 }),
  courseName: varchar('course_name', { length: 255 }),
  collegeStream: varchar('college_stream', { length: 255 }),
  localAddress: text('local_address'),
  area: varchar('area', { length: 255 }),
  schoolId: integer('school_id')
    .notNull()
    .references(() => schools.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  schoolIdIdx: index('students_school_id_idx').on(t.schoolId),
}));

// ── Staff (college employees as screenees — not app login workers) ─────
export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  staffCode: varchar('staff_code', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  age: real('age').notNull(),
  gender: varchar('gender', { length: 10 }).notNull(), // 'M' | 'F'
  designation: varchar('designation', { length: 255 }),
  department: varchar('department', { length: 255 }),
  email: varchar('email', { length: 255 }),
  mobileNo: varchar('mobile_no', { length: 20 }),
  schoolId: integer('school_id')
    .notNull()
    .references(() => schools.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  schoolIdIdx: index('staff_school_id_idx').on(t.schoolId),
}));

// Stub assessment row — questionnaire fields arrive later via payload / columns
export const staffAssessments = pgTable('staff_assessments', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id')
    .notNull()
    .unique()
    .references(() => staff.id, { onDelete: 'cascade' }),
  assessmentComplete: boolean('assessment_complete').default(false).notNull(),
  payload: jsonb('payload').$type<Record<string, unknown> | null>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Health Records (1-to-1 with Student) ───────────────────────────────
// Aligned with STUDENT SCREENING Sections A–G. Scores are computed in app/Excel.
export const healthRecords = pgTable('health_records', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .notNull()
    .unique()
    .references(() => students.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 50 }), // YYYY-MM-DD format

  // Section A – Anthropometry (reuses height/weight/waist_circumference)
  height: real('height'),
  weight: real('weight'),
  muac: real('muac'),
  waistCircumference: real('waist_circumference'),

  // Blood Pressure & Random Blood Sugar (systolic/diastolic/bp_class reused)
  randomBloodSugar: real('random_blood_sugar'),

  // Section B – Diet
  breakfast: varchar('breakfast', { length: 50 }),
  fruitIntake: varchar('fruit_intake', { length: 50 }),
  vegetables: varchar('vegetables', { length: 50 }),
  proteinIntake: varchar('protein_intake', { length: 50 }),
  junkFood: varchar('junk_food', { length: 50 }),
  sugaryDrinks: varchar('sugary_drinks', { length: 50 }),
  waterIntake: varchar('water_intake', { length: 50 }),

  // Section C – Lifestyle
  physicalActivity: varchar('physical_activity', { length: 50 }),
  screenTime: varchar('screen_time', { length: 50 }),
  outdoorPlay: varchar('outdoor_play', { length: 50 }),
  sleepHours: varchar('sleep_hours', { length: 50 }),
  smoking: varchar('smoking', { length: 50 }),
  alcohol: varchar('alcohol', { length: 50 }),

  // Section D – Medical History
  chronicDisease: varchar('chronic_disease', { length: 10 }),
  frequentFever: varchar('frequent_fever', { length: 10 }),
  weightLoss: varchar('weight_loss', { length: 10 }),
  poorAppetite: varchar('poor_appetite', { length: 10 }),
  repeatedInfection: varchar('repeated_infection', { length: 10 }),
  hospitalisation: varchar('hospitalisation', { length: 10 }),
  medication: varchar('medication', { length: 10 }),

  // Section E – Mental Wellness
  stress: varchar('stress', { length: 50 }),
  mood: varchar('mood', { length: 50 }),
  concentration: varchar('concentration', { length: 50 }),
  bullying: varchar('bullying', { length: 10 }),

  // Section F – Clinical Observation
  pallor: varchar('pallor', { length: 10 }),
  dentalCaries: varchar('dental_caries', { length: 10 }),
  poorOralHygiene: varchar('poor_oral_hygiene', { length: 10 }),
  visionProblem: varchar('vision_problem', { length: 10 }),
  hairChanges: varchar('hair_changes', { length: 10 }),
  skinChanges: varchar('skin_changes', { length: 10 }),
  clubbing: varchar('clubbing', { length: 10 }),

  // Section G – Preventive Health
  vaccinationComplete: varchar('vaccination_complete', { length: 20 }),
  deworming: varchar('deworming', { length: 20 }),
  handHygiene: varchar('hand_hygiene', { length: 50 }),
  dentalCheckup: varchar('dental_checkup', { length: 10 }),
  visionScreening: varchar('vision_screening', { length: 10 }),

  /** Remarks for Yes answers: { fieldName: comment } */
  yesNoRemarks: jsonb('yes_no_remarks').$type<Record<string, string> | null>(),

  /** Explicit complete flag — set when user confirms Complete Screening (even with blanks) */
  assessmentComplete: boolean('assessment_complete').default(false).notNull(),

  // Legacy columns retained so existing rows migrate without data loss
  undernutritionClass: varchar('undernutrition_class', { length: 50 }),
  overweightClass: varchar('overweight_class', { length: 50 }),
  hb: real('hb'),
  anaemiaClass: varchar('anaemia_class', { length: 50 }),
  systolic: real('systolic'),
  diastolic: real('diastolic'),
  bpClass: varchar('bp_class', { length: 50 }),
  familyHxCount: integer('family_hx_count'),
  metabolicRiskClass: varchar('metabolic_risk_class', { length: 50 }),
  rightEyeAcuity: real('right_eye_acuity'),
  leftEyeAcuity: real('left_eye_acuity'),
  decayedTeethCount: integer('decayed_teeth_count'),
  wheezeSymptom: varchar('wheeze_symptom', { length: 10 }),
  measuredPefr: real('measured_pefr'),
  predictedPefr: real('predicted_pefr'),
  tbCough: varchar('tb_cough', { length: 10 }),
  tbFever: varchar('tb_fever', { length: 10 }),
  tbNightSweats: varchar('tb_night_sweats', { length: 10 }),
  tbWeightLoss: varchar('tb_weight_loss', { length: 10 }),
  mentalWellbeingResult: varchar('mental_wellbeing_result', { length: 50 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Relations ──────────────────────────────────────────────────────────
export const schoolsRelations = relations(schools, ({ many }) => ({
  students: many(students),
  staff: many(staff),
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

export const staffRelations = relations(staff, ({ one }) => ({
  school: one(schools, {
    fields: [staff.schoolId],
    references: [schools.id],
  }),
  assessment: one(staffAssessments, {
    fields: [staff.id],
    references: [staffAssessments.staffId],
  }),
}));

export const staffAssessmentsRelations = relations(staffAssessments, ({ one }) => ({
  staffMember: one(staff, {
    fields: [staffAssessments.staffId],
    references: [staff.id],
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

// ── Student Mental Health Assessments ──────────────────────────────────
export const studentMentalHealthAssessments = pgTable('student_mental_health_assessments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .notNull()
    .references(() => students.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 50 }).notNull(),
  responses: jsonb('responses').notNull(),
  totalScore: integer('total_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── School Audit Checklists ────────────────────────────────────────────
export const schoolAuditChecklists = pgTable('school_audit_checklists', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id')
    .notNull()
    .references(() => schools.id, { onDelete: 'cascade' }),
  dateOfAudit: varchar('date_of_audit', { length: 50 }).notNull(),
  auditorName: varchar('auditor_name', { length: 255 }).notNull(),
  responses: jsonb('responses').notNull(),
  criticalNonCompliance: jsonb('critical_non_compliance'),
  strengths: text('strengths'),
  areasOfImprovement: text('areas_of_improvement'),
  correctiveActions: text('corrective_actions'),
  recommendations: text('recommendations'),
  overallScore: integer('overall_score'),
  safeGrade: varchar('safe_grade', { length: 50 }),
  accreditationStatus: varchar('accreditation_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const studentMentalHealthAssessmentsRelations = relations(studentMentalHealthAssessments, ({ one }) => ({
  student: one(students, {
    fields: [studentMentalHealthAssessments.studentId],
    references: [students.id],
  }),
}));

export const schoolAuditChecklistsRelations = relations(schoolAuditChecklists, ({ one }) => ({
  school: one(schools, {
    fields: [schoolAuditChecklists.schoolId],
    references: [schools.id],
  }),
}));
