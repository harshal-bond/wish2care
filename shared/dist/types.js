// ── Completion check helpers ───────────────────────────────────────────
const filled = (v) => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && Number.isNaN(v));
export const SCREENING_SECTIONS = [
    {
        id: 'A',
        title: 'A — Anthropometry',
        fields: [
            { key: 'height', label: 'Height' },
            { key: 'weight', label: 'Weight' },
            { key: 'muac', label: 'MUAC' },
            { key: 'waistCircumference', label: 'Waist Circumference' },
        ],
    },
    {
        id: 'BP',
        title: 'Blood Pressure & RBS',
        fields: [
            { key: 'systolic', label: 'Systolic BP' },
            { key: 'diastolic', label: 'Diastolic BP' },
            { key: 'bpClass', label: 'BP Class' },
            { key: 'randomBloodSugar', label: 'Random Blood Sugar' },
        ],
    },
    {
        id: 'B',
        title: 'B — Diet',
        fields: [
            { key: 'breakfast', label: 'Breakfast' },
            { key: 'fruitIntake', label: 'Fruit Intake' },
            { key: 'vegetables', label: 'Vegetables' },
            { key: 'proteinIntake', label: 'Protein Intake' },
            { key: 'junkFood', label: 'Junk Food' },
            { key: 'sugaryDrinks', label: 'Sugary Drinks' },
            { key: 'waterIntake', label: 'Water Intake' },
        ],
    },
    {
        id: 'C',
        title: 'C — Lifestyle',
        fields: [
            { key: 'physicalActivity', label: 'Physical Activity' },
            { key: 'screenTime', label: 'Screen Time' },
            { key: 'outdoorPlay', label: 'Outdoor Play' },
            { key: 'sleepHours', label: 'Sleep Hours' },
            { key: 'smoking', label: 'Smoking' },
            { key: 'alcohol', label: 'Alcohol' },
        ],
    },
    {
        id: 'D',
        title: 'D — Medical History',
        fields: [
            { key: 'chronicDisease', label: 'Chronic Disease' },
            { key: 'frequentFever', label: 'Frequent Fever' },
            { key: 'weightLoss', label: 'Weight Loss' },
            { key: 'poorAppetite', label: 'Appetite' },
            { key: 'repeatedInfection', label: 'Repeated Infection' },
            { key: 'hospitalisation', label: 'Hospitalisation' },
            { key: 'medication', label: 'Medication' },
        ],
    },
    {
        id: 'E',
        title: 'E — Mental Wellness',
        fields: [
            { key: 'stress', label: 'Stress' },
            { key: 'mood', label: 'Mood' },
            { key: 'concentration', label: 'Concentration' },
            { key: 'bullying', label: 'Bullying' },
        ],
    },
    {
        id: 'F',
        title: 'F — Clinical Observation',
        fields: [
            { key: 'pallor', label: 'Pallor' },
            { key: 'dentalCaries', label: 'Dental Caries' },
            { key: 'poorOralHygiene', label: 'Poor Oral Hygiene' },
            { key: 'visionProblem', label: 'Vision Problem' },
            { key: 'hairChanges', label: 'Hair Changes' },
            { key: 'skinChanges', label: 'Skin Changes' },
            { key: 'clubbing', label: 'Clubbing' },
        ],
    },
    {
        id: 'G',
        title: 'G — Preventive Health',
        fields: [
            { key: 'vaccinationComplete', label: 'Vaccination Complete' },
            { key: 'deworming', label: 'Deworming' },
            { key: 'handHygiene', label: 'Hand Hygiene' },
            { key: 'dentalCheckup', label: 'Dental Check-up' },
            { key: 'visionScreening', label: 'Vision Screening' },
        ],
    },
];
/** Missing field keys + labels for a single screening section (A, BP, B–G). */
export function getMissingFieldsForSection(sectionId, record) {
    const section = SCREENING_SECTIONS.find((s) => s.id === sectionId);
    if (!section)
        return [];
    return section.fields.filter(({ key }) => !filled(record[key]));
}
/** Per-section list of unanswered screening fields (human-readable labels). */
export function getMissingScreeningFields(record) {
    const missing = [];
    for (const section of SCREENING_SECTIONS) {
        const fields = getMissingFieldsForSection(section.id, record).map(({ label }) => label);
        if (fields.length > 0) {
            missing.push({
                sectionId: section.id,
                sectionTitle: section.title,
                fields,
            });
        }
    }
    return missing;
}
/**
 * Returns the count of completed screening sections (out of 8: A, BP, B–G)
 * matching domain completeness (all inputs present in a section).
 */
export function countCompletedDomains(record) {
    return SCREENING_SECTIONS.filter((section) => section.fields.every(({ key }) => filled(record[key]))).length;
}
export function isRecordComplete(record) {
    return countCompletedDomains(record) === 8;
}
export function isCaseSubmitted(record, mentalAssessmentComplete) {
    return record?.assessmentComplete === true && isRecordComplete(record) && mentalAssessmentComplete;
}
export function buildStudentListStatus(record, mentalAssessmentComplete) {
    const completedDomains = record ? countCompletedDomains(record) : 0;
    const screeningComplete = record ? isRecordComplete(record) : false;
    return {
        completedDomains,
        screeningComplete,
        mentalAssessmentComplete,
        isComplete: isCaseSubmitted(record, mentalAssessmentComplete),
    };
}
//# sourceMappingURL=types.js.map