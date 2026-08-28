/** Map legacy Yes/No appetite values to Good/Poor for display and scoring. */
export function normalizeAppetiteValue(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  if (value === 'Yes') return 'Poor';
  if (value === 'No') return 'Good';
  return value;
}
