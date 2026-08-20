/**
 * Domain weights, dropdown options, and scoring lookups from the Excel workbook
 * "Wish2Care SAFE Health Intelligence System" — STUDENT SCREENING / SCORING MASTER
 */
export declare const YES_NO: readonly ["Yes", "No"];
export type YesNo = (typeof YES_NO)[number];
export declare const YES_PARTIAL_NO: readonly ["Yes", "Partial", "No"];
export type YesPartialNo = (typeof YES_PARTIAL_NO)[number];
export declare const GENDER_OPTIONS: readonly ["M", "F"];
export type Gender = (typeof GENDER_OPTIONS)[number];
export declare const ROLES: readonly ["admin", "fieldworker", "student"];
export type Role = (typeof ROLES)[number];
export declare const BREAKFAST_OPTIONS: readonly ["Always", "Sometimes", "Never"];
export declare const FRUIT_INTAKE_OPTIONS: readonly ["Daily", "3-5 per week", "Rarely"];
export declare const VEGETABLES_OPTIONS: readonly ["Daily", "Sometimes", "Rarely"];
export declare const PROTEIN_INTAKE_OPTIONS: readonly ["Daily", "3-5 per week", "Rarely"];
export declare const JUNK_FOOD_OPTIONS: readonly ["Never", "Weekly", "Daily"];
export declare const SUGARY_DRINKS_OPTIONS: readonly ["Never", "Weekly", "Daily"];
export declare const WATER_INTAKE_OPTIONS: readonly ["More than 2L", "1-2L", "Less than 1L"];
export declare const PHYSICAL_ACTIVITY_OPTIONS: readonly ["Daily", "3-5 per week", "Rarely"];
export declare const SCREEN_TIME_OPTIONS: readonly ["Less than 2 hrs", "2-4 hrs", "More than 4 hrs"];
export declare const OUTDOOR_PLAY_OPTIONS: readonly ["Daily", "3-5 per week", "Rarely"];
export declare const SLEEP_HOURS_OPTIONS: readonly ["8+ hrs", "6-8 hrs", "Less than 6 hrs"];
export declare const SMOKING_OPTIONS: readonly ["Never", "Occasional", "Regular", "Not Applicable"];
export declare const ALCOHOL_OPTIONS: readonly ["Never", "Occasional", "Regular", "Not Applicable"];
export declare const STRESS_OPTIONS: readonly ["Low", "Moderate", "High"];
export declare const MOOD_OPTIONS: readonly ["Happy", "Neutral", "Low"];
export declare const CONCENTRATION_OPTIONS: readonly ["Good", "Average", "Poor"];
export declare const HAND_HYGIENE_OPTIONS: readonly ["Good", "Average", "Poor"];
export declare const BMI_CATEGORIES: readonly ["Underweight", "Normal", "Overweight", "Obese"];
export type BmiCategory = (typeof BMI_CATEGORIES)[number];
export declare const RISK_CATEGORIES: readonly ["Green - Healthy", "Light Green - Mild Watch", "Yellow - Mild Risk", "Orange - Moderate Risk", "Red - High Risk"];
export type RiskCategory = (typeof RISK_CATEGORIES)[number];
export declare const DOMAIN_WEIGHTS: {
    readonly growthAnthropometry: 0.25;
    readonly diet: 0.2;
    readonly lifestyle: 0.15;
    readonly medicalHistory: 0.15;
    readonly clinical: 0.1;
    readonly mentalWellness: 0.1;
    readonly preventive: 0.05;
};
export type DomainKey = keyof typeof DOMAIN_WEIGHTS;
/** Points are averaged then ×20 to get a 0–100 domain score (Excel ROUND(AVERAGE(...)*20, 0)). */
export declare const SCORING_POINTS: {
    readonly breakfast: {
        readonly Always: 5;
        readonly Sometimes: 3;
        readonly Never: 0;
    };
    readonly fruitIntake: {
        readonly Daily: 5;
        readonly '3-5 per week': 3;
        readonly Rarely: 0;
    };
    readonly vegetables: {
        readonly Daily: 5;
        readonly Sometimes: 3;
        readonly Rarely: 0;
    };
    readonly proteinIntake: {
        readonly Daily: 5;
        readonly '3-5 per week': 3;
        readonly Rarely: 0;
    };
    readonly junkFood: {
        readonly Never: 5;
        readonly Weekly: 3;
        readonly Daily: 0;
    };
    readonly sugaryDrinks: {
        readonly Never: 5;
        readonly Weekly: 3;
        readonly Daily: 0;
    };
    readonly waterIntake: {
        readonly 'More than 2L': 5;
        readonly '1-2L': 3;
        readonly 'Less than 1L': 0;
    };
    readonly physicalActivity: {
        readonly Daily: 5;
        readonly '3-5 per week': 3;
        readonly Rarely: 0;
    };
    readonly screenTime: {
        readonly 'Less than 2 hrs': 5;
        readonly '2-4 hrs': 3;
        readonly 'More than 4 hrs': 0;
    };
    readonly outdoorPlay: {
        readonly Daily: 5;
        readonly '3-5 per week': 3;
        readonly Rarely: 0;
    };
    readonly sleepHours: {
        readonly '8+ hrs': 5;
        readonly '6-8 hrs': 3;
        readonly 'Less than 6 hrs': 0;
    };
    readonly smoking: {
        readonly Never: 5;
        readonly Occasional: 2;
        readonly Regular: 0;
        readonly 'Not Applicable': 5;
    };
    readonly alcohol: {
        readonly Never: 5;
        readonly Occasional: 2;
        readonly Regular: 0;
        readonly 'Not Applicable': 5;
    };
    readonly chronicDisease: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly frequentFever: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly weightLoss: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly poorAppetite: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly repeatedInfection: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly hospitalisation: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly medication: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly stress: {
        readonly Low: 5;
        readonly Moderate: 3;
        readonly High: 0;
    };
    readonly mood: {
        readonly Happy: 5;
        readonly Neutral: 3;
        readonly Low: 0;
    };
    readonly concentration: {
        readonly Good: 5;
        readonly Average: 3;
        readonly Poor: 0;
    };
    readonly bullying: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly pallor: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly dentalCaries: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly poorOralHygiene: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly visionProblem: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly hairChanges: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly skinChanges: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly clubbing: {
        readonly No: 5;
        readonly Yes: 0;
    };
    readonly vaccinationComplete: {
        readonly Yes: 5;
        readonly Partial: 3;
        readonly No: 0;
    };
    readonly deworming: {
        readonly Yes: 5;
        readonly Partial: 3;
        readonly No: 0;
    };
    readonly handHygiene: {
        readonly Good: 5;
        readonly Average: 3;
        readonly Poor: 0;
    };
    readonly dentalCheckup: {
        readonly Yes: 5;
        readonly No: 0;
    };
    readonly visionScreening: {
        readonly Yes: 5;
        readonly No: 0;
    };
};
export declare const GROWTH_SCORE_BY_BMI: Record<BmiCategory, number>;
export declare const MUAC_SEVERE_THRESHOLD = 18.5;
export declare const UNDERWEIGHT_WITH_LOW_MUAC_SCORE = 30;
export declare const VALIDATION_RANGES: {
    readonly height: {
        readonly min: 80;
        readonly max: 220;
        readonly unit: "cm";
    };
    readonly weight: {
        readonly min: 5;
        readonly max: 200;
        readonly unit: "kg";
    };
    readonly muac: {
        readonly min: 10;
        readonly max: 40;
        readonly unit: "cm";
    };
    readonly waistCircumference: {
        readonly min: 30;
        readonly max: 150;
        readonly unit: "cm";
    };
    readonly systolic: {
        readonly min: 60;
        readonly max: 200;
        readonly unit: "mmHg";
    };
    readonly diastolic: {
        readonly min: 30;
        readonly max: 130;
        readonly unit: "mmHg";
    };
    readonly randomBloodSugar: {
        readonly min: 40;
        readonly max: 600;
        readonly unit: "mg/dL";
    };
    readonly age: {
        readonly min: 2;
        readonly max: 99;
        readonly unit: "years";
    };
};
export declare const BP_CLASS_OPTIONS: readonly ["Low", "Normal", "High"];
export type BpClass = (typeof BP_CLASS_OPTIONS)[number];
/** Normal ranges: Systolic 120–140 mmHg, Diastolic 80–100 mmHg */
export declare const BP_NORMAL_RANGES: {
    readonly systolic: {
        readonly min: 120;
        readonly max: 140;
    };
    readonly diastolic: {
        readonly min: 80;
        readonly max: 100;
    };
};
/** Subscore for auto BP class */
export declare const BP_SUBSCORE_MAP: Record<BpClass, number>;
/** Yes/No (or Yes/Partial/No) fields that can collect Remarks when answer is Yes */
export declare const YES_NO_REMARK_FIELDS: readonly ["chronicDisease", "frequentFever", "weightLoss", "poorAppetite", "repeatedInfection", "hospitalisation", "medication", "bullying", "pallor", "dentalCaries", "poorOralHygiene", "visionProblem", "hairChanges", "skinChanges", "clubbing", "vaccinationComplete", "deworming", "dentalCheckup", "visionScreening"];
export type YesNoRemarkField = (typeof YES_NO_REMARK_FIELDS)[number];
export declare const EXCEL_COLUMN_MAP: {
    readonly studentCode: "A";
    readonly date: "B";
    readonly school: "C";
    readonly studentName: "I";
    readonly age: "J";
    readonly gender: "K";
    readonly dateOfBirth: "L";
    readonly parentName: "M";
    readonly parentMobile: "N";
    readonly emergencyContact: "O";
    readonly bloodGroup: "P";
    readonly height: "Q";
    readonly weight: "R";
    readonly muac: "U";
    readonly waistCircumference: "V";
    readonly breakfast: "W";
    readonly fruitIntake: "X";
    readonly vegetables: "Y";
    readonly proteinIntake: "Z";
    readonly junkFood: "AA";
    readonly sugaryDrinks: "AB";
    readonly waterIntake: "AC";
    readonly physicalActivity: "AD";
    readonly screenTime: "AE";
    readonly outdoorPlay: "AF";
    readonly sleepHours: "AG";
    readonly smoking: "AH";
    readonly alcohol: "AI";
    readonly chronicDisease: "AJ";
    readonly frequentFever: "AK";
    readonly weightLoss: "AL";
    readonly poorAppetite: "AM";
    readonly repeatedInfection: "AN";
    readonly hospitalisation: "AO";
    readonly medication: "AP";
    readonly stress: "AQ";
    readonly mood: "AR";
    readonly concentration: "AS";
    readonly bullying: "AT";
    readonly pallor: "AU";
    readonly dentalCaries: "AV";
    readonly poorOralHygiene: "AW";
    readonly visionProblem: "AX";
    readonly hairChanges: "AY";
    readonly skinChanges: "AZ";
    readonly vaccinationComplete: "BA";
    readonly deworming: "BB";
    readonly handHygiene: "BC";
    readonly dentalCheckup: "BD";
    readonly visionScreening: "BE";
};
export declare const EXCEL_SHEET_NAME = "STUDENT SCREENING";
export declare const EXCEL_DATA_START_ROW = 4;
export declare const EXCEL_TEMPLATE_LAST_ROW = 303;
/** @deprecated Old 3-tier clinical classification — not used by new screening form */
export declare const CLASSIFICATION: {
    readonly NORMAL: "Normal";
    readonly CAUTION: "Caution";
    readonly HIGH_RISK: "High-risk";
};
export type Classification = (typeof CLASSIFICATION)[keyof typeof CLASSIFICATION];
/** @deprecated */
export declare const SUBSCORE_MAP: Record<Classification, number>;
/** @deprecated */
export declare const MENTAL_WELLBEING_OPTIONS: readonly ["Clear", "REFER"];
/** @deprecated */
export declare const TB_RESULT: {
    readonly CLEAR: "Clear";
    readonly REFER: "REFER - TB symptom screen positive";
};
/** @deprecated */
export declare const SCORE_BANDS: {
    readonly GREEN: {
        readonly label: "Green - On Track";
        readonly min: 80;
        readonly max: 100;
    };
    readonly AMBER: {
        readonly label: "Amber - Monitor";
        readonly min: 60;
        readonly max: 79;
    };
    readonly RED: {
        readonly label: "Red - Refer";
        readonly min: 0;
        readonly max: 59;
    };
};
export declare const APPOINTMENT_STATUS: readonly ["booked", "cancelled"];
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];
export declare const SAFE_GRADES: readonly ["Platinum", "Gold", "Silver", "Bronze", "None"];
export type SafeGrade = (typeof SAFE_GRADES)[number];
export declare const ACCREDITATION_STATUSES: readonly ["Accredited", "Provisionally Accredited", "Reassessment Required", "Not Accredited"];
export type AccreditationStatus = (typeof ACCREDITATION_STATUSES)[number];
//# sourceMappingURL=constants.d.ts.map