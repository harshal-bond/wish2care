/** Display gender from stored M/F/null value. */
export function formatGender(gender) {
    if (!gender)
        return '—';
    const g = gender.trim().toUpperCase();
    if (g === 'M' || g.startsWith('MALE'))
        return 'Male';
    if (g === 'F' || g.startsWith('FEMALE'))
        return 'Female';
    return '—';
}
/** Format age for display. */
export function formatAge(age) {
    if (age == null || age === '')
        return '—';
    return `${age} yrs`;
}
//# sourceMappingURL=gender.js.map