/**
 * Implements STUDENT SCREENING formulas from the Wish2Care SAFE Excel workbook.
 */
import {
  BP_NORMAL_RANGES,
  BP_SUBSCORE_MAP,
  DOMAIN_WEIGHTS,
  GROWTH_SCORE_BY_BMI,
  MUAC_SEVERE_THRESHOLD,
  SCORING_POINTS,
  UNDERWEIGHT_WITH_LOW_MUAC_SCORE,
  type BmiCategory,
  type BpClass,
  type RiskCategory,
} from './constants.js';

export type ScoringInput = {
  height?: number | null;
  weight?: number | null;
  muac?: number | null;
  waistCircumference?: number | null;

  systolic?: number | null;
  diastolic?: number | null;
  bpClass?: string | null;
  randomBloodSugar?: number | null;

  breakfast?: string | null;
  fruitIntake?: string | null;
  vegetables?: string | null;
  proteinIntake?: string | null;
  junkFood?: string | null;
  sugaryDrinks?: string | null;
  waterIntake?: string | null;

  physicalActivity?: string | null;
  screenTime?: string | null;
  outdoorPlay?: string | null;
  sleepHours?: string | null;
  smoking?: string | null;
  alcohol?: string | null;

  chronicDisease?: string | null;
  frequentFever?: string | null;
  weightLoss?: string | null;
  poorAppetite?: string | null;
  repeatedInfection?: string | null;
  hospitalisation?: string | null;
  medication?: string | null;

  stress?: string | null;
  mood?: string | null;
  concentration?: string | null;
  bullying?: string | null;

  pallor?: string | null;
  dentalCaries?: string | null;
  poorOralHygiene?: string | null;
  visionProblem?: string | null;
  hairChanges?: string | null;
  skinChanges?: string | null;
  clubbing?: string | null;

  vaccinationComplete?: string | null;
  deworming?: string | null;
  handHygiene?: string | null;
  dentalCheckup?: string | null;
  visionScreening?: string | null;
};

export type ScreeningScores = {
  bmi: number | null;
  bmiCategory: BmiCategory | null;
  growthAnthropometryScore: number | null;
  bpClass: BpClass | null;
  bpSubscore: number | null;
  dietScore: number | null;
  lifestyleScore: number | null;
  medicalHistoryScore: number | null;
  clinicalScore: number | null;
  mentalWellnessScore: number | null;
  preventiveScore: number | null;
  overallHealthScore: number | null;
  nutritionScore: number | null;
  undernutritionRiskScore: number | null;
  riskCategory: RiskCategory | null;
  needReferral: 'Yes' | 'No' | null;
  needDoctorReview: 'Yes' | 'No' | null;
};

/**
 * Auto BP Class from readings.
 * Normal: systolic 120–140 AND diastolic 80–100.
 * High if either value is above its normal max; else Low if either is below its normal min.
 */
export function computeBpClass(
  systolic: number | null | undefined,
  diastolic: number | null | undefined
): BpClass | null {
  if (systolic == null || diastolic == null || Number.isNaN(systolic) || Number.isNaN(diastolic)) {
    return null;
  }
  if (systolic > BP_NORMAL_RANGES.systolic.max || diastolic > BP_NORMAL_RANGES.diastolic.max) {
    return 'High';
  }
  if (systolic < BP_NORMAL_RANGES.systolic.min || diastolic < BP_NORMAL_RANGES.diastolic.min) {
    return 'Low';
  }
  return 'Normal';
}

/** BP Subscore: Normal=100, Low=60, High=20 */
export function computeBpSubscore(bpClass: string | null | undefined): number | null {
  if (!bpClass || !(bpClass in BP_SUBSCORE_MAP)) return null;
  return BP_SUBSCORE_MAP[bpClass as BpClass];
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || v === '';
}

/** BMI = ROUND(weight_kg / (height_cm/100)^2, 1) */
export function computeBmi(height: number | null | undefined, weight: number | null | undefined): number | null {
  if (height == null || weight == null || height <= 0) return null;
  const bmi = weight / (height / 100) ** 2;
  return Math.round(bmi * 10) / 10;
}

/** Adult-style cut-offs from Excel: <18.5 / <25 / <30 / else */
export function computeBmiCategory(bmi: number | null): BmiCategory | null {
  if (bmi == null) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

/**
 * Growth score from BMI Category:
 * Normal=100, Overweight=65, Obese=50,
 * Underweight=45, or 30 if MUAC is present and < 18.5
 */
export function computeGrowthScore(
  bmiCategory: BmiCategory | null,
  muac: number | null | undefined
): number | null {
  if (!bmiCategory) return null;
  if (bmiCategory === 'Underweight' && muac != null && muac < MUAC_SEVERE_THRESHOLD) {
    return UNDERWEIGHT_WITH_LOW_MUAC_SCORE;
  }
  return GROWTH_SCORE_BY_BMI[bmiCategory];
}

function lookupPoints(field: keyof typeof SCORING_POINTS, value: string | null | undefined): number | null {
  if (isBlank(value)) return null;
  const table = SCORING_POINTS[field] as Record<string, number>;
  const pts = table[value as string];
  return pts === undefined ? null : pts;
}

/** ROUND(AVERAGE(points) * 20, 0); blank if any response missing */
export function averageDomainScore(points: Array<number | null>): number | null {
  if (points.length === 0 || points.some((p) => p == null)) return null;
  const avg = (points as number[]).reduce((a, b) => a + b, 0) / points.length;
  return Math.round(avg * 20);
}

export function computeDietScore(input: ScoringInput): number | null {
  return averageDomainScore([
    lookupPoints('breakfast', input.breakfast),
    lookupPoints('fruitIntake', input.fruitIntake),
    lookupPoints('vegetables', input.vegetables),
    lookupPoints('proteinIntake', input.proteinIntake),
    lookupPoints('junkFood', input.junkFood),
    lookupPoints('sugaryDrinks', input.sugaryDrinks),
    lookupPoints('waterIntake', input.waterIntake),
  ]);
}

export function computeLifestyleScore(input: ScoringInput): number | null {
  return averageDomainScore([
    lookupPoints('physicalActivity', input.physicalActivity),
    lookupPoints('screenTime', input.screenTime),
    lookupPoints('outdoorPlay', input.outdoorPlay),
    lookupPoints('sleepHours', input.sleepHours),
    lookupPoints('smoking', input.smoking),
    lookupPoints('alcohol', input.alcohol),
  ]);
}

export function computeMedicalHistoryScore(input: ScoringInput): number | null {
  return averageDomainScore([
    lookupPoints('chronicDisease', input.chronicDisease),
    lookupPoints('frequentFever', input.frequentFever),
    lookupPoints('weightLoss', input.weightLoss),
    lookupPoints('poorAppetite', input.poorAppetite),
    lookupPoints('repeatedInfection', input.repeatedInfection),
    lookupPoints('hospitalisation', input.hospitalisation),
    lookupPoints('medication', input.medication),
  ]);
}

export function computeMentalWellnessScore(input: ScoringInput): number | null {
  return averageDomainScore([
    lookupPoints('stress', input.stress),
    lookupPoints('mood', input.mood),
    lookupPoints('concentration', input.concentration),
    lookupPoints('bullying', input.bullying),
  ]);
}

export function computeClinicalScore(input: ScoringInput): number | null {
  return averageDomainScore([
    lookupPoints('pallor', input.pallor),
    lookupPoints('dentalCaries', input.dentalCaries),
    lookupPoints('poorOralHygiene', input.poorOralHygiene),
    lookupPoints('visionProblem', input.visionProblem),
    lookupPoints('hairChanges', input.hairChanges),
    lookupPoints('skinChanges', input.skinChanges),
    lookupPoints('clubbing', input.clubbing),
  ]);
}

export function computePreventiveScore(input: ScoringInput): number | null {
  return averageDomainScore([
    lookupPoints('vaccinationComplete', input.vaccinationComplete),
    lookupPoints('deworming', input.deworming),
    lookupPoints('handHygiene', input.handHygiene),
    lookupPoints('dentalCheckup', input.dentalCheckup),
    lookupPoints('visionScreening', input.visionScreening),
  ]);
}

/** Overall = ROUND(BF*0.25 + BG*0.2 + BH*0.15 + BI*0.15 + BJ*0.1 + BK*0.1 + BL*0.05, 0) */
export function computeOverallHealthScore(parts: {
  growth: number | null;
  diet: number | null;
  lifestyle: number | null;
  medical: number | null;
  clinical: number | null;
  mental: number | null;
  preventive: number | null;
}): number | null {
  const { growth, diet, lifestyle, medical, clinical, mental, preventive } = parts;
  if (
    growth == null ||
    diet == null ||
    lifestyle == null ||
    medical == null ||
    clinical == null ||
    mental == null ||
    preventive == null
  ) {
    return null;
  }
  return Math.round(
    growth * DOMAIN_WEIGHTS.growthAnthropometry +
      diet * DOMAIN_WEIGHTS.diet +
      lifestyle * DOMAIN_WEIGHTS.lifestyle +
      medical * DOMAIN_WEIGHTS.medicalHistory +
      clinical * DOMAIN_WEIGHTS.clinical +
      mental * DOMAIN_WEIGHTS.mentalWellness +
      preventive * DOMAIN_WEIGHTS.preventive
  );
}

/** Nutrition = ROUND(growth*0.5 + diet*0.5, 0) */
export function computeNutritionScore(growth: number | null, diet: number | null): number | null {
  if (growth == null || diet == null) return null;
  return Math.round(growth * 0.5 + diet * 0.5);
}

/**
 * Undernutrition Risk = ROUND(MIN(100, MAX(0, (100-Nutrition) + weightLoss?15 : 0 + poorAppetite?15 : 0 + muac<18.5?20 : 0)), 0)
 */
export function computeUndernutritionRiskScore(
  nutritionScore: number | null,
  weightLoss: string | null | undefined,
  poorAppetite: string | null | undefined,
  muac: number | null | undefined
): number | null {
  if (nutritionScore == null) return null;
  let risk = 100 - nutritionScore;
  if (weightLoss === 'Yes') risk += 15;
  if (poorAppetite === 'Yes') risk += 15;
  if (muac != null && muac < MUAC_SEVERE_THRESHOLD) risk += 20;
  return Math.round(Math.min(100, Math.max(0, risk)));
}

export function computeRiskCategory(overall: number | null): RiskCategory | null {
  if (overall == null) return null;
  if (overall >= 90) return 'Green - Healthy';
  if (overall >= 75) return 'Light Green - Mild Watch';
  if (overall >= 60) return 'Yellow - Mild Risk';
  if (overall >= 40) return 'Orange - Moderate Risk';
  return 'Red - High Risk';
}

/** Need Referral = Yes if overall < 60 OR undernutritionRisk >= 60 OR chronicDisease = Yes */
export function computeNeedReferral(
  overall: number | null,
  undernutritionRisk: number | null,
  chronicDisease: string | null | undefined
): 'Yes' | 'No' | null {
  if (overall == null) return null;
  if (overall < 60 || (undernutritionRisk != null && undernutritionRisk >= 60) || chronicDisease === 'Yes') {
    return 'Yes';
  }
  return 'No';
}

/** Need Doctor Review = Yes if risk is Orange/Red OR needReferral = Yes */
export function computeNeedDoctorReview(
  riskCategory: RiskCategory | null,
  needReferral: 'Yes' | 'No' | null
): 'Yes' | 'No' | null {
  if (riskCategory == null || needReferral == null) return null;
  if (
    riskCategory === 'Orange - Moderate Risk' ||
    riskCategory === 'Red - High Risk' ||
    needReferral === 'Yes'
  ) {
    return 'Yes';
  }
  return 'No';
}

/** Compute all automated scores from screening inputs (mirrors Excel BF–BR). */
export function computeScreeningScores(input: ScoringInput): ScreeningScores {
  const bmi = computeBmi(input.height, input.weight);
  const bmiCategory = computeBmiCategory(bmi);
  const growthAnthropometryScore = computeGrowthScore(bmiCategory, input.muac);
  const bpClass = computeBpClass(input.systolic, input.diastolic) ?? (input.bpClass as BpClass | null) ?? null;
  const bpSubscore = computeBpSubscore(bpClass);
  const dietScore = computeDietScore(input);
  const lifestyleScore = computeLifestyleScore(input);
  const medicalHistoryScore = computeMedicalHistoryScore(input);
  const clinicalScore = computeClinicalScore(input);
  const mentalWellnessScore = computeMentalWellnessScore(input);
  const preventiveScore = computePreventiveScore(input);

  const overallHealthScore = computeOverallHealthScore({
    growth: growthAnthropometryScore,
    diet: dietScore,
    lifestyle: lifestyleScore,
    medical: medicalHistoryScore,
    clinical: clinicalScore,
    mental: mentalWellnessScore,
    preventive: preventiveScore,
  });

  const nutritionScore = computeNutritionScore(growthAnthropometryScore, dietScore);
  const undernutritionRiskScore = computeUndernutritionRiskScore(
    nutritionScore,
    input.weightLoss,
    input.poorAppetite,
    input.muac
  );
  const riskCategory = computeRiskCategory(overallHealthScore);
  const needReferral = computeNeedReferral(overallHealthScore, undernutritionRiskScore, input.chronicDisease);
  const needDoctorReview = computeNeedDoctorReview(riskCategory, needReferral);

  return {
    bmi,
    bmiCategory,
    growthAnthropometryScore,
    bpClass,
    bpSubscore,
    dietScore,
    lifestyleScore,
    medicalHistoryScore,
    clinicalScore,
    mentalWellnessScore,
    preventiveScore,
    overallHealthScore,
    nutritionScore,
    undernutritionRiskScore,
    riskCategory,
    needReferral,
    needDoctorReview,
  };
}
