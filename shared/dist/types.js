// ── Completion check helpers ───────────────────────────────────────────
/**
 * Returns the count of completed scored domains (out of 8) based on
 * the presence of the required input fields for each domain.
 */
export function countCompletedDomains(record) {
    let count = 0;
    // Domain 1: Undernutrition — needs height, weight, and classification
    if (record.height != null && record.weight != null && record.undernutritionClass)
        count++;
    // Domain 2: Overweight/Obesity — needs classification
    if (record.overweightClass)
        count++;
    // Domain 3: Anaemia — needs Hb and classification
    if (record.hb != null && record.anaemiaClass)
        count++;
    // Domain 4: Blood Pressure — needs systolic, diastolic, classification
    if (record.systolic != null && record.diastolic != null && record.bpClass)
        count++;
    // Domain 5: Metabolic Risk — needs waist, familyHx, classification
    if (record.waistCircumference != null && record.metabolicRiskClass)
        count++;
    // Domain 6: Vision — needs both eye acuities (classification auto-computed)
    if (record.rightEyeAcuity != null && record.leftEyeAcuity != null)
        count++;
    // Domain 7: Oral Health — needs decayed teeth count (classification auto-computed)
    if (record.decayedTeethCount != null)
        count++;
    // Domain 8: Respiratory — needs wheeze or PEFR data (classification auto-computed)
    if (record.wheezeSymptom != null || record.measuredPefr != null)
        count++;
    return count;
}
export function isRecordComplete(record) {
    return countCompletedDomains(record) === 8;
}
//# sourceMappingURL=types.js.map