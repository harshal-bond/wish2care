import { CLASSIFICATION, YES_NO, MENTAL_WELLBEING_OPTIONS, VALIDATION_RANGES } from '@wish2care/shared';
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

const CLASSIFICATION_OPTIONS = Object.values(CLASSIFICATION);

export const HEALTH_RECORD_DOMAINS: DomainConfig[] = [
  {
    title: 'Undernutrition',
    fields: [
      { key: 'height', label: 'Height', type: 'number', unit: 'cm', rangeKey: 'height' },
      { key: 'weight', label: 'Weight', type: 'number', unit: 'kg', rangeKey: 'weight' },
      { key: 'undernutritionClass', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS },
    ],
  },
  {
    title: 'Overweight / Obesity',
    fields: [{ key: 'overweightClass', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS }],
  },
  {
    title: 'Anaemia',
    fields: [
      { key: 'hb', label: 'Hb', type: 'number', unit: 'g/dL', rangeKey: 'hb' },
      { key: 'anaemiaClass', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS },
    ],
  },
  {
    title: 'Blood Pressure',
    fields: [
      { key: 'systolic', label: 'Systolic', type: 'number', unit: 'mmHg', rangeKey: 'systolic' },
      { key: 'diastolic', label: 'Diastolic', type: 'number', unit: 'mmHg', rangeKey: 'diastolic' },
      { key: 'bpClass', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS },
    ],
  },
  {
    title: 'Metabolic Risk',
    fields: [
      {
        key: 'waistCircumference',
        label: 'Waist Circumference',
        type: 'number',
        unit: 'cm',
        rangeKey: 'waistCircumference',
      },
      { key: 'familyHxCount', label: 'Family History Count', type: 'number', integer: true, rangeKey: 'familyHxCount' },
      { key: 'metabolicRiskClass', label: 'Classification', type: 'select', options: CLASSIFICATION_OPTIONS },
    ],
  },
  {
    title: 'Vision',
    fields: [
      { key: 'rightEyeAcuity', label: 'Right Eye Acuity', type: 'number', rangeKey: 'rightEyeAcuity' },
      { key: 'leftEyeAcuity', label: 'Left Eye Acuity', type: 'number', rangeKey: 'leftEyeAcuity' },
    ],
  },
  {
    title: 'Oral Health',
    fields: [
      { key: 'decayedTeethCount', label: 'Decayed Teeth Count', type: 'number', integer: true, rangeKey: 'decayedTeethCount' },
    ],
  },
  {
    title: 'Respiratory',
    fields: [
      { key: 'wheezeSymptom', label: 'Wheeze Symptom', type: 'select', options: YES_NO },
      { key: 'measuredPefr', label: 'Measured PEFR', type: 'number', unit: 'L/min', rangeKey: 'measuredPefr' },
      { key: 'predictedPefr', label: 'Predicted PEFR', type: 'number', unit: 'L/min', rangeKey: 'predictedPefr' },
    ],
  },
  {
    title: 'TB Red-Flag Screen',
    tone: 'alert',
    fields: [
      { key: 'tbCough', label: 'Cough', type: 'select', options: YES_NO },
      { key: 'tbFever', label: 'Fever', type: 'select', options: YES_NO },
      { key: 'tbNightSweats', label: 'Night Sweats', type: 'select', options: YES_NO },
      { key: 'tbWeightLoss', label: 'Weight Loss', type: 'select', options: YES_NO },
    ],
  },
  {
    title: 'Mental Wellbeing',
    tone: 'alert',
    fields: [{ key: 'mentalWellbeingResult', label: 'Result', type: 'select', options: MENTAL_WELLBEING_OPTIONS }],
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
