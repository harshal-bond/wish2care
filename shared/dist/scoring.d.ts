/**
 * Implements STUDENT SCREENING formulas from the Wish2Care SAFE Excel workbook.
 */
import { type BmiCategory, type BpClass, type RiskCategory } from './constants.js';
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
export declare function computeBpClass(systolic: number | null | undefined, diastolic: number | null | undefined): BpClass | null;
/** BP Subscore: Normal=100, Low=60, High=20 */
export declare function computeBpSubscore(bpClass: string | null | undefined): number | null;
/** BMI = ROUND(weight_kg / (height_cm/100)^2, 1) */
export declare function computeBmi(height: number | null | undefined, weight: number | null | undefined): number | null;
/** Adult-style cut-offs from Excel: <18.5 / <25 / <30 / else */
export declare function computeBmiCategory(bmi: number | null): BmiCategory | null;
/**
 * Growth score from BMI Category:
 * Normal=100, Overweight=65, Obese=50,
 * Underweight=45, or 30 if MUAC is present and < 18.5
 */
export declare function computeGrowthScore(bmiCategory: BmiCategory | null, muac: number | null | undefined): number | null;
/** ROUND(AVERAGE(points) * 20, 0); blank if any response missing */
export declare function averageDomainScore(points: Array<number | null>): number | null;
export declare function computeDietScore(input: ScoringInput): number | null;
export declare function computeLifestyleScore(input: ScoringInput): number | null;
export declare function computeMedicalHistoryScore(input: ScoringInput): number | null;
export declare function computeMentalWellnessScore(input: ScoringInput): number | null;
export declare function computeClinicalScore(input: ScoringInput): number | null;
export declare function computePreventiveScore(input: ScoringInput): number | null;
/** Overall = ROUND(BF*0.25 + BG*0.2 + BH*0.15 + BI*0.15 + BJ*0.1 + BK*0.1 + BL*0.05, 0) */
export declare function computeOverallHealthScore(parts: {
    growth: number | null;
    diet: number | null;
    lifestyle: number | null;
    medical: number | null;
    clinical: number | null;
    mental: number | null;
    preventive: number | null;
}): number | null;
/** Nutrition = ROUND(growth*0.5 + diet*0.5, 0) */
export declare function computeNutritionScore(growth: number | null, diet: number | null): number | null;
/**
 * Undernutrition Risk = ROUND(MIN(100, MAX(0, (100-Nutrition) + weightLoss?15 : 0 + poorAppetite?15 : 0 + muac<18.5?20 : 0)), 0)
 */
export declare function computeUndernutritionRiskScore(nutritionScore: number | null, weightLoss: string | null | undefined, poorAppetite: string | null | undefined, muac: number | null | undefined): number | null;
export declare function computeRiskCategory(overall: number | null): RiskCategory | null;
/** Need Referral = Yes if overall < 60 OR undernutritionRisk >= 60 OR chronicDisease = Yes */
export declare function computeNeedReferral(overall: number | null, undernutritionRisk: number | null, chronicDisease: string | null | undefined): 'Yes' | 'No' | null;
/** Need Doctor Review = Yes if risk is Orange/Red OR needReferral = Yes */
export declare function computeNeedDoctorReview(riskCategory: RiskCategory | null, needReferral: 'Yes' | 'No' | null): 'Yes' | 'No' | null;
/** Compute all automated scores from screening inputs (mirrors Excel BF–BR). */
export declare function computeScreeningScores(input: ScoringInput): ScreeningScores;
//# sourceMappingURL=scoring.d.ts.map