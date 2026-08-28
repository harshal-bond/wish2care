/** Display gender from stored M/F/null value. */
export function formatGender(gender: string | null | undefined): 'Male' | 'Female' | '—' {
  if (!gender) return '—';
  const g = gender.trim().toUpperCase();
  if (g === 'M' || g.startsWith('MALE')) return 'Male';
  if (g === 'F' || g.startsWith('FEMALE')) return 'Female';
  return '—';
}

/** Format age for display. */
export function formatAge(age: number | string | null | undefined): string {
  if (age == null || age === '') return '—';
  return `${age} yrs`;
}
