const IST_TIME_ZONE = 'Asia/Kolkata';

/**
 * Current IST wall-clock date/time, independent of the server process's own
 * timezone (production runs in UTC). No other timezone infra exists in this
 * codebase — every other date is a plain string, and the product is India-only.
 */
export function getIstNow(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

/** Day of week (0=Sunday..6=Saturday) for a plain 'YYYY-MM-DD' calendar date, unaffected by server timezone. */
export function getDayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

/** True if {date, time} is strictly before the current IST wall clock. */
export function isPastIst(date: string, time: string): boolean {
  const now = getIstNow();
  if (date < now.date) return true;
  if (date > now.date) return false;
  return time < now.time;
}
