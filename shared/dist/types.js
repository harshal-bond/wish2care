// ── Completion check helpers ───────────────────────────────────────────
const filled = (v) => v !== null && v !== undefined && v !== '';
/**
 * Returns the count of completed screening sections (out of 8: A, BP, B–G)
 * matching domain completeness (all inputs present in a section).
 */
export function countCompletedDomains(record) {
    let count = 0;
    // A – Anthropometry
    if (filled(record.height) && filled(record.weight) && filled(record.muac) && filled(record.waistCircumference)) {
        count++;
    }
    // Blood Pressure & RBS
    if (filled(record.systolic) &&
        filled(record.diastolic) &&
        filled(record.bpClass) &&
        filled(record.randomBloodSugar)) {
        count++;
    }
    // B – Diet
    if (filled(record.breakfast) &&
        filled(record.fruitIntake) &&
        filled(record.vegetables) &&
        filled(record.proteinIntake) &&
        filled(record.junkFood) &&
        filled(record.sugaryDrinks) &&
        filled(record.waterIntake)) {
        count++;
    }
    // C – Lifestyle
    if (filled(record.physicalActivity) &&
        filled(record.screenTime) &&
        filled(record.outdoorPlay) &&
        filled(record.sleepHours) &&
        filled(record.smoking) &&
        filled(record.alcohol)) {
        count++;
    }
    // D – Medical History
    if (filled(record.chronicDisease) &&
        filled(record.frequentFever) &&
        filled(record.weightLoss) &&
        filled(record.poorAppetite) &&
        filled(record.repeatedInfection) &&
        filled(record.hospitalisation) &&
        filled(record.medication)) {
        count++;
    }
    // E – Mental Wellness
    if (filled(record.stress) &&
        filled(record.mood) &&
        filled(record.concentration) &&
        filled(record.bullying)) {
        count++;
    }
    // F – Clinical Observation
    if (filled(record.pallor) &&
        filled(record.dentalCaries) &&
        filled(record.poorOralHygiene) &&
        filled(record.visionProblem) &&
        filled(record.hairChanges) &&
        filled(record.skinChanges) &&
        filled(record.clubbing)) {
        count++;
    }
    // G – Preventive Health
    if (filled(record.vaccinationComplete) &&
        filled(record.deworming) &&
        filled(record.handHygiene) &&
        filled(record.dentalCheckup) &&
        filled(record.visionScreening)) {
        count++;
    }
    return count;
}
export function isRecordComplete(record) {
    return countCompletedDomains(record) === 8;
}
//# sourceMappingURL=types.js.map