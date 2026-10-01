import {
  VALIDATION_RANGES,
  YES_NO,
  YES_PARTIAL_NO,
  BP_CLASS_OPTIONS,
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
} from '@wish2care/shared';
import type { HealthRecordPartial } from '@wish2care/shared';

type NumberFieldConfig = {
  key: keyof HealthRecordPartial;
  label: string;
  type: 'number';
  unit?: string;
  integer?: boolean;
  rangeKey?: keyof typeof VALIDATION_RANGES;
};

type SelectFieldConfig = {
  key: keyof HealthRecordPartial;
  label: string;
  type: 'select';
  options: readonly string[];
};

export type FieldConfig = NumberFieldConfig | SelectFieldConfig;

export type DomainConfig = {
  title: string;
  tone?: 'alert';
  fields: FieldConfig[];
};

export const HEALTH_RECORD_DOMAINS: DomainConfig[] = [
  {
    title: 'A — Anthropometry',
    fields: [
      { key: 'height', label: 'Height', type: 'number', unit: 'cm', rangeKey: 'height' },
      { key: 'weight', label: 'Weight', type: 'number', unit: 'kg', rangeKey: 'weight' },
      { key: 'muac', label: 'MUAC', type: 'number', unit: 'cm', rangeKey: 'muac' },
      {
        key: 'waistCircumference',
        label: 'Waist Circumference',
        type: 'number',
        unit: 'cm',
        rangeKey: 'waistCircumference',
      },
    ],
  },
  {
    title: 'Blood Pressure & RBS',
    fields: [
      { key: 'systolic', label: 'Systolic BP', type: 'number', unit: 'mmHg', rangeKey: 'systolic' },
      { key: 'diastolic', label: 'Diastolic BP', type: 'number', unit: 'mmHg', rangeKey: 'diastolic' },
      { key: 'bpClass', label: 'BP Class', type: 'select', options: BP_CLASS_OPTIONS },
      {
        key: 'randomBloodSugar',
        label: 'Random Blood Sugar',
        type: 'number',
        unit: 'mg/dL',
        rangeKey: 'randomBloodSugar',
      },
    ],
  },
  {
    title: 'B — Diet',
    fields: [
      { key: 'breakfast', label: 'Breakfast', type: 'select', options: BREAKFAST_OPTIONS },
      { key: 'fruitIntake', label: 'Fruit Intake', type: 'select', options: FRUIT_INTAKE_OPTIONS },
      { key: 'vegetables', label: 'Vegetables', type: 'select', options: VEGETABLES_OPTIONS },
      { key: 'proteinIntake', label: 'Protein Intake', type: 'select', options: PROTEIN_INTAKE_OPTIONS },
      { key: 'junkFood', label: 'Junk Food', type: 'select', options: JUNK_FOOD_OPTIONS },
      { key: 'sugaryDrinks', label: 'Sugary Drinks', type: 'select', options: SUGARY_DRINKS_OPTIONS },
      { key: 'waterIntake', label: 'Water Intake', type: 'select', options: WATER_INTAKE_OPTIONS },
    ],
  },
  {
    title: 'C — Lifestyle',
    fields: [
      { key: 'physicalActivity', label: 'Physical Activity', type: 'select', options: PHYSICAL_ACTIVITY_OPTIONS },
      { key: 'screenTime', label: 'Screen Time', type: 'select', options: SCREEN_TIME_OPTIONS },
      { key: 'outdoorPlay', label: 'Outdoor Play', type: 'select', options: OUTDOOR_PLAY_OPTIONS },
      { key: 'sleepHours', label: 'Sleep Hours', type: 'select', options: SLEEP_HOURS_OPTIONS },
      { key: 'smoking', label: 'Smoking', type: 'select', options: SMOKING_OPTIONS },
      { key: 'alcohol', label: 'Alcohol', type: 'select', options: ALCOHOL_OPTIONS },
    ],
  },
  {
    title: 'D — Medical History',
    fields: [
      { key: 'chronicDisease', label: 'Chronic Disease', type: 'select', options: YES_NO },
      { key: 'frequentFever', label: 'Frequent Fever', type: 'select', options: YES_NO },
      { key: 'weightLoss', label: 'Weight Loss', type: 'select', options: YES_NO },
      { key: 'poorAppetite', label: 'Poor Appetite', type: 'select', options: YES_NO },
      { key: 'repeatedInfection', label: 'Repeated Infection', type: 'select', options: YES_NO },
      { key: 'hospitalisation', label: 'Hospitalisation', type: 'select', options: YES_NO },
      { key: 'medication', label: 'Medication', type: 'select', options: YES_NO },
    ],
  },
  {
    title: 'E — Mental Wellness',
    fields: [
      { key: 'stress', label: 'Stress', type: 'select', options: STRESS_OPTIONS },
      { key: 'mood', label: 'Mood', type: 'select', options: MOOD_OPTIONS },
      { key: 'concentration', label: 'Concentration', type: 'select', options: CONCENTRATION_OPTIONS },
      { key: 'bullying', label: 'Bullying', type: 'select', options: YES_NO },
    ],
  },
  {
    title: 'F — Clinical Observation',
    fields: [
      { key: 'pallor', label: 'Pallor', type: 'select', options: YES_NO },
      { key: 'dentalCaries', label: 'Dental Caries', type: 'select', options: YES_NO },
      { key: 'poorOralHygiene', label: 'Poor Oral Hygiene', type: 'select', options: YES_NO },
      { key: 'visionProblem', label: 'Vision Problem', type: 'select', options: YES_NO },
      { key: 'hairChanges', label: 'Hair Changes', type: 'select', options: YES_NO },
      { key: 'skinChanges', label: 'Skin Changes', type: 'select', options: YES_NO },
      { key: 'clubbing', label: 'Clubbing', type: 'select', options: YES_NO },
    ],
  },
  {
    title: 'G — Preventive Health',
    fields: [
      { key: 'vaccinationComplete', label: 'Vaccination Complete', type: 'select', options: YES_PARTIAL_NO },
      { key: 'deworming', label: 'Deworming', type: 'select', options: YES_PARTIAL_NO },
      { key: 'handHygiene', label: 'Hand Hygiene', type: 'select', options: HAND_HYGIENE_OPTIONS },
      { key: 'dentalCheckup', label: 'Dental Check-up', type: 'select', options: YES_NO },
      { key: 'visionScreening', label: 'Vision Screening', type: 'select', options: YES_NO },
    ],
  },
];

export function toNumberOrNull(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}

export function getRangeHint(
  rangeKey: keyof typeof VALIDATION_RANGES | undefined,
  value: number | null | undefined
): string | undefined {
  if (!rangeKey || value == null) return undefined;
  const range = VALIDATION_RANGES[rangeKey];
  if (value < range.min || value > range.max) {
    return `Typical range: ${range.min}–${range.max} ${range.unit}`;
  }
  return undefined;
}
