/**
 * Domain weights, dropdown options, and scoring lookups from the Excel workbook
 * "Wish2Care SAFE Health Intelligence System" — STUDENT SCREENING / SCORING MASTER
 */
// ── Yes/No ─────────────────────────────────────────────────────────────
export const YES_NO = ['Yes', 'No'];
export const YES_PARTIAL_NO = ['Yes', 'Partial', 'No'];
// ── Gender ─────────────────────────────────────────────────────────────
export const GENDER_OPTIONS = ['M', 'F'];
// ── Roles ──────────────────────────────────────────────────────────────
export const ROLES = ['admin', 'fieldworker'];
// ── Diet Quality options ───────────────────────────────────────────────
export const BREAKFAST_OPTIONS = ['Always', 'Sometimes', 'Never'];
export const FRUIT_INTAKE_OPTIONS = ['Daily', '3-5 per week', 'Rarely'];
export const VEGETABLES_OPTIONS = ['Daily', 'Sometimes', 'Rarely'];
export const PROTEIN_INTAKE_OPTIONS = ['Daily', '3-5 per week', 'Rarely'];
export const JUNK_FOOD_OPTIONS = ['Never', 'Weekly', 'Daily'];
export const SUGARY_DRINKS_OPTIONS = ['Never', 'Weekly', 'Daily'];
export const WATER_INTAKE_OPTIONS = ['More than 2L', '1-2L', 'Less than 1L'];
// ── Lifestyle options ──────────────────────────────────────────────────
export const PHYSICAL_ACTIVITY_OPTIONS = ['Daily', '3-5 per week', 'Rarely'];
export const SCREEN_TIME_OPTIONS = ['Less than 2 hrs', '2-4 hrs', 'More than 4 hrs'];
export const OUTDOOR_PLAY_OPTIONS = ['Daily', '3-5 per week', 'Rarely'];
export const SLEEP_HOURS_OPTIONS = ['8+ hrs', '6-8 hrs', 'Less than 6 hrs'];
export const SMOKING_OPTIONS = ['Never', 'Occasional', 'Regular', 'Not Applicable'];
export const ALCOHOL_OPTIONS = ['Never', 'Occasional', 'Regular', 'Not Applicable'];
// ── Mental Wellness options ────────────────────────────────────────────
export const STRESS_OPTIONS = ['Low', 'Moderate', 'High'];
export const MOOD_OPTIONS = ['Happy', 'Neutral', 'Low'];
export const CONCENTRATION_OPTIONS = ['Good', 'Average', 'Poor'];
// ── Preventive Health options ──────────────────────────────────────────
export const HAND_HYGIENE_OPTIONS = ['Good', 'Average', 'Poor'];
// ── BMI Category ───────────────────────────────────────────────────────
export const BMI_CATEGORIES = ['Underweight', 'Normal', 'Overweight', 'Obese'];
// ── Risk Category bands (Overall Health Score) ─────────────────────────
export const RISK_CATEGORIES = [
    'Green - Healthy',
    'Light Green - Mild Watch',
    'Yellow - Mild Risk',
    'Orange - Moderate Risk',
    'Red - High Risk',
];
// ── Domain score weights for Overall Health Score ──────────────────────
export const DOMAIN_WEIGHTS = {
    growthAnthropometry: 0.25,
    diet: 0.2,
    lifestyle: 0.15,
    medicalHistory: 0.15,
    clinical: 0.1,
    mentalWellness: 0.1,
    preventive: 0.05,
};
// ── Scoring Master: response → points (0–5) ────────────────────────────
/** Points are averaged then ×20 to get a 0–100 domain score (Excel ROUND(AVERAGE(...)*20, 0)). */
export const SCORING_POINTS = {
    breakfast: { Always: 5, Sometimes: 3, Never: 0 },
    fruitIntake: { Daily: 5, '3-5 per week': 3, Rarely: 0 },
    vegetables: { Daily: 5, Sometimes: 3, Rarely: 0 },
    proteinIntake: { Daily: 5, '3-5 per week': 3, Rarely: 0 },
    junkFood: { Never: 5, Weekly: 3, Daily: 0 },
    sugaryDrinks: { Never: 5, Weekly: 3, Daily: 0 },
    waterIntake: { 'More than 2L': 5, '1-2L': 3, 'Less than 1L': 0 },
    physicalActivity: { Daily: 5, '3-5 per week': 3, Rarely: 0 },
    screenTime: { 'Less than 2 hrs': 5, '2-4 hrs': 3, 'More than 4 hrs': 0 },
    outdoorPlay: { Daily: 5, '3-5 per week': 3, Rarely: 0 },
    sleepHours: { '8+ hrs': 5, '6-8 hrs': 3, 'Less than 6 hrs': 0 },
    smoking: { Never: 5, Occasional: 2, Regular: 0, 'Not Applicable': 5 },
    alcohol: { Never: 5, Occasional: 2, Regular: 0, 'Not Applicable': 5 },
    chronicDisease: { No: 5, Yes: 0 },
    frequentFever: { No: 5, Yes: 0 },
    weightLoss: { No: 5, Yes: 0 },
    poorAppetite: { No: 5, Yes: 0 },
    repeatedInfection: { No: 5, Yes: 0 },
    hospitalisation: { No: 5, Yes: 0 },
    medication: { No: 5, Yes: 0 },
    stress: { Low: 5, Moderate: 3, High: 0 },
    mood: { Happy: 5, Neutral: 3, Low: 0 },
    concentration: { Good: 5, Average: 3, Poor: 0 },
    bullying: { No: 5, Yes: 0 },
    pallor: { No: 5, Yes: 0 },
    dentalCaries: { No: 5, Yes: 0 },
    poorOralHygiene: { No: 5, Yes: 0 },
    visionProblem: { No: 5, Yes: 0 },
    hairChanges: { No: 5, Yes: 0 },
    skinChanges: { No: 5, Yes: 0 },
    vaccinationComplete: { Yes: 5, Partial: 3, No: 0 },
    deworming: { Yes: 5, Partial: 3, No: 0 },
    handHygiene: { Good: 5, Average: 3, Poor: 0 },
    dentalCheckup: { Yes: 5, No: 0 },
    visionScreening: { Yes: 5, No: 0 },
};
// ── Growth & Anthropometry score from BMI category ─────────────────────
// Normal=100, Overweight=65, Obese=50, Underweight=45 (or 30 if MUAC < 18.5)
export const GROWTH_SCORE_BY_BMI = {
    Normal: 100,
    Overweight: 65,
    Obese: 50,
    Underweight: 45,
};
export const MUAC_SEVERE_THRESHOLD = 18.5;
export const UNDERWEIGHT_WITH_LOW_MUAC_SCORE = 30;
// ── Validation ranges (warn, not block) ────────────────────────────────
export const VALIDATION_RANGES = {
    height: { min: 80, max: 220, unit: 'cm' },
    weight: { min: 5, max: 200, unit: 'kg' },
    muac: { min: 10, max: 40, unit: 'cm' },
    waistCircumference: { min: 30, max: 150, unit: 'cm' },
    age: { min: 2, max: 99, unit: 'years' },
};
// ── Excel cell mapping (DB field → Excel column letter) ────────────────
// STUDENT SCREENING sheet: row 3 = headers, data from row 4
export const EXCEL_COLUMN_MAP = {
    // Student Registration
    studentCode: 'A',
    date: 'B',
    school: 'C',
    // D District, E State, F Class, G Division, H Roll — not stored yet
    studentName: 'I',
    age: 'J',
    gender: 'K',
    dateOfBirth: 'L',
    parentName: 'M',
    parentMobile: 'N',
    emergencyContact: 'O',
    bloodGroup: 'P',
    // Section A – Anthropometry
    height: 'Q',
    weight: 'R',
    // S BMI (formula), T BMI Category (formula)
    muac: 'U',
    waistCircumference: 'V',
    // Section B – Diet
    breakfast: 'W',
    fruitIntake: 'X',
    vegetables: 'Y',
    proteinIntake: 'Z',
    junkFood: 'AA',
    sugaryDrinks: 'AB',
    waterIntake: 'AC',
    // Section C – Lifestyle
    physicalActivity: 'AD',
    screenTime: 'AE',
    outdoorPlay: 'AF',
    sleepHours: 'AG',
    smoking: 'AH',
    alcohol: 'AI',
    // Section D – Medical History
    chronicDisease: 'AJ',
    frequentFever: 'AK',
    weightLoss: 'AL',
    poorAppetite: 'AM',
    repeatedInfection: 'AN',
    hospitalisation: 'AO',
    medication: 'AP',
    // Section E – Mental Wellness
    stress: 'AQ',
    mood: 'AR',
    concentration: 'AS',
    bullying: 'AT',
    // Section F – Clinical Observation
    pallor: 'AU',
    dentalCaries: 'AV',
    poorOralHygiene: 'AW',
    visionProblem: 'AX',
    hairChanges: 'AY',
    skinChanges: 'AZ',
    // Section G – Preventive Health
    vaccinationComplete: 'BA',
    deworming: 'BB',
    handHygiene: 'BC',
    dentalCheckup: 'BD',
    visionScreening: 'BE',
    // BF–BR = Automated Scoring (formulas)
};
export const EXCEL_SHEET_NAME = 'STUDENT SCREENING';
export const EXCEL_DATA_START_ROW = 4;
export const EXCEL_TEMPLATE_LAST_ROW = 303; // pre-built formula rows 4–303
// ── Legacy exports kept for any remaining imports ──────────────────────
/** @deprecated Old 3-tier clinical classification — not used by new screening form */
export const CLASSIFICATION = {
    NORMAL: 'Normal',
    CAUTION: 'Caution',
    HIGH_RISK: 'High-risk',
};
/** @deprecated */
export const SUBSCORE_MAP = {
    [CLASSIFICATION.NORMAL]: 100,
    [CLASSIFICATION.CAUTION]: 60,
    [CLASSIFICATION.HIGH_RISK]: 20,
};
/** @deprecated */
export const MENTAL_WELLBEING_OPTIONS = ['Clear', 'REFER'];
/** @deprecated */
export const TB_RESULT = {
    CLEAR: 'Clear',
    REFER: 'REFER - TB symptom screen positive',
};
/** @deprecated */
export const SCORE_BANDS = {
    GREEN: { label: 'Green - On Track', min: 80, max: 100 },
    AMBER: { label: 'Amber - Monitor', min: 60, max: 79 },
    RED: { label: 'Red - Refer', min: 0, max: 59 },
};
// ── SAFE Programme Audit ───────────────────────────────────────────────
export const SAFE_GRADES = ['Platinum', 'Gold', 'Silver', 'Bronze', 'None'];
export const ACCREDITATION_STATUSES = [
    'Accredited',
    'Provisionally Accredited',
    'Reassessment Required',
    'Not Accredited',
];
//# sourceMappingURL=constants.js.map