import type { HealthRecord } from '@wish2care/shared';
import { buildStudentListStatus } from '@wish2care/shared';
import { healthRecords } from '../db/schema.js';

/** Health-record columns selected for domain status computation on list endpoints. */
export type HealthRecordStatusRow = {
  hrId: number | null;
  updatedAt: Date | null;
  assessmentComplete: boolean | null;
  height: number | null;
  weight: number | null;
  muac: number | null;
  waistCircumference: number | null;
  systolic: number | null;
  diastolic: number | null;
  bpClass: string | null;
  randomBloodSugar: number | null;
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
  clubbing: string | null;
  vaccinationComplete: string | null;
  deworming: string | null;
  handHygiene: string | null;
  dentalCheckup: string | null;
  visionScreening: string | null;
};

export const healthRecordStatusSelect = {
  hrId: healthRecords.id,
  updatedAt: healthRecords.updatedAt,
  assessmentComplete: healthRecords.assessmentComplete,
  height: healthRecords.height,
  weight: healthRecords.weight,
  muac: healthRecords.muac,
  waistCircumference: healthRecords.waistCircumference,
  systolic: healthRecords.systolic,
  diastolic: healthRecords.diastolic,
  bpClass: healthRecords.bpClass,
  randomBloodSugar: healthRecords.randomBloodSugar,
  breakfast: healthRecords.breakfast,
  fruitIntake: healthRecords.fruitIntake,
  vegetables: healthRecords.vegetables,
  proteinIntake: healthRecords.proteinIntake,
  junkFood: healthRecords.junkFood,
  sugaryDrinks: healthRecords.sugaryDrinks,
  waterIntake: healthRecords.waterIntake,
  physicalActivity: healthRecords.physicalActivity,
  screenTime: healthRecords.screenTime,
  outdoorPlay: healthRecords.outdoorPlay,
  sleepHours: healthRecords.sleepHours,
  smoking: healthRecords.smoking,
  alcohol: healthRecords.alcohol,
  chronicDisease: healthRecords.chronicDisease,
  frequentFever: healthRecords.frequentFever,
  weightLoss: healthRecords.weightLoss,
  poorAppetite: healthRecords.poorAppetite,
  repeatedInfection: healthRecords.repeatedInfection,
  hospitalisation: healthRecords.hospitalisation,
  medication: healthRecords.medication,
  stress: healthRecords.stress,
  mood: healthRecords.mood,
  concentration: healthRecords.concentration,
  bullying: healthRecords.bullying,
  pallor: healthRecords.pallor,
  dentalCaries: healthRecords.dentalCaries,
  poorOralHygiene: healthRecords.poorOralHygiene,
  visionProblem: healthRecords.visionProblem,
  hairChanges: healthRecords.hairChanges,
  skinChanges: healthRecords.skinChanges,
  clubbing: healthRecords.clubbing,
  vaccinationComplete: healthRecords.vaccinationComplete,
  deworming: healthRecords.deworming,
  handHygiene: healthRecords.handHygiene,
  dentalCheckup: healthRecords.dentalCheckup,
  visionScreening: healthRecords.visionScreening,
} as const;

export function healthRecordFromStatusRow(row: HealthRecordStatusRow): Partial<HealthRecord> | null {
  if (row.hrId == null) return null;
  return {
    assessmentComplete: row.assessmentComplete === true,
    height: row.height,
    weight: row.weight,
    muac: row.muac,
    waistCircumference: row.waistCircumference,
    systolic: row.systolic,
    diastolic: row.diastolic,
    bpClass: row.bpClass,
    randomBloodSugar: row.randomBloodSugar,
    breakfast: row.breakfast,
    fruitIntake: row.fruitIntake,
    vegetables: row.vegetables,
    proteinIntake: row.proteinIntake,
    junkFood: row.junkFood,
    sugaryDrinks: row.sugaryDrinks,
    waterIntake: row.waterIntake,
    physicalActivity: row.physicalActivity,
    screenTime: row.screenTime,
    outdoorPlay: row.outdoorPlay,
    sleepHours: row.sleepHours,
    smoking: row.smoking,
    alcohol: row.alcohol,
    chronicDisease: row.chronicDisease,
    frequentFever: row.frequentFever,
    weightLoss: row.weightLoss,
    poorAppetite: row.poorAppetite,
    repeatedInfection: row.repeatedInfection,
    hospitalisation: row.hospitalisation,
    medication: row.medication,
    stress: row.stress,
    mood: row.mood,
    concentration: row.concentration,
    bullying: row.bullying,
    pallor: row.pallor,
    dentalCaries: row.dentalCaries,
    poorOralHygiene: row.poorOralHygiene,
    visionProblem: row.visionProblem,
    hairChanges: row.hairChanges,
    skinChanges: row.skinChanges,
    clubbing: row.clubbing,
    vaccinationComplete: row.vaccinationComplete,
    deworming: row.deworming,
    handHygiene: row.handHygiene,
    dentalCheckup: row.dentalCheckup,
    visionScreening: row.visionScreening,
  };
}

export function statusFromRow(row: HealthRecordStatusRow, mentalAssessmentComplete: boolean) {
  const record = healthRecordFromStatusRow(row);
  return buildStudentListStatus(record, mentalAssessmentComplete);
}
