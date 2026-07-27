/**
 * Domain weights and reference values from the Excel workbook
 * "Reference & Weights" sheet
 */
export declare const CLASSIFICATION: {
    readonly NORMAL: "Normal";
    readonly CAUTION: "Caution";
    readonly HIGH_RISK: "High-risk";
};
export type Classification = (typeof CLASSIFICATION)[keyof typeof CLASSIFICATION];
export declare const SUBSCORE_MAP: Record<Classification, number>;
export declare const DOMAIN_WEIGHTS: {
    readonly undernutrition: 13;
    readonly overweight: 15;
    readonly anaemia: 15;
    readonly bloodPressure: 13;
    readonly metabolicRisk: 15;
    readonly vision: 8;
    readonly oralHealth: 11;
    readonly respiratory: 10;
};
export type DomainKey = keyof typeof DOMAIN_WEIGHTS;
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
export declare const TB_RESULT: {
    readonly CLEAR: "Clear";
    readonly REFER: "REFER - TB symptom screen positive";
};
export declare const MENTAL_WELLBEING_OPTIONS: readonly ["Clear", "REFER"];
export declare const YES_NO: readonly ["Yes", "No"];
export type YesNo = (typeof YES_NO)[number];
export declare const GENDER_OPTIONS: readonly ["M", "F"];
export type Gender = (typeof GENDER_OPTIONS)[number];
export declare const ROLES: readonly ["admin", "fieldworker"];
export type Role = (typeof ROLES)[number];
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
    readonly hb: {
        readonly min: 0;
        readonly max: 20;
        readonly unit: "g/dL";
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
    readonly waistCircumference: {
        readonly min: 30;
        readonly max: 150;
        readonly unit: "cm";
    };
    readonly rightEyeAcuity: {
        readonly min: 0.05;
        readonly max: 2;
        readonly unit: "decimal";
    };
    readonly leftEyeAcuity: {
        readonly min: 0.05;
        readonly max: 2;
        readonly unit: "decimal";
    };
    readonly decayedTeethCount: {
        readonly min: 0;
        readonly max: 32;
        readonly unit: "count";
    };
    readonly measuredPefr: {
        readonly min: 50;
        readonly max: 800;
        readonly unit: "L/min";
    };
    readonly predictedPefr: {
        readonly min: 50;
        readonly max: 800;
        readonly unit: "L/min";
    };
    readonly familyHxCount: {
        readonly min: 0;
        readonly max: 2;
        readonly unit: "count";
    };
    readonly age: {
        readonly min: 5;
        readonly max: 25;
        readonly unit: "years";
    };
};
export declare const EXCEL_COLUMN_MAP: {
    readonly studentCode: "A";
    readonly school: "B";
    readonly date: "C";
    readonly age: "D";
    readonly gender: "E";
    readonly height: "F";
    readonly weight: "G";
    readonly undernutritionClass: "I";
    readonly overweightClass: "K";
    readonly hb: "M";
    readonly anaemiaClass: "N";
    readonly systolic: "P";
    readonly diastolic: "Q";
    readonly bpClass: "R";
    readonly waistCircumference: "T";
    readonly familyHxCount: "U";
    readonly metabolicRiskClass: "V";
    readonly rightEyeAcuity: "X";
    readonly leftEyeAcuity: "Y";
    readonly decayedTeethCount: "AB";
    readonly wheezeSymptom: "AE";
    readonly measuredPefr: "AF";
    readonly predictedPefr: "AG";
    readonly tbCough: "AK";
    readonly tbFever: "AL";
    readonly tbNightSweats: "AM";
    readonly tbWeightLoss: "AN";
    readonly mentalWellbeingResult: "AP";
};
export declare const EXCEL_DATA_START_ROW = 4;
export declare const EXCEL_TEMPLATE_LAST_ROW = 63;
//# sourceMappingURL=constants.d.ts.map