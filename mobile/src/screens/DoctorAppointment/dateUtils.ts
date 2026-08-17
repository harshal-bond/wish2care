import type { Appointment } from '@wish2care/shared';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayLocalDate(): string {
  return toDateStr(new Date());
}

export function nowLocalTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

export function isSunday(dateStr: string): boolean {
  return new Date(`${dateStr}T00:00:00`).getDay() === 0;
}

export function formatDateShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatDateLong(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Next `count` calendar dates starting today, skipping Sundays (doctors never work Sundays). */
export function nextBookableDates(count: number): string[] {
  const dates: string[] = [];
  let cursor = todayLocalDate();
  while (dates.length < count) {
    if (!isSunday(cursor)) dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

/** A booked appointment that hasn't happened yet (date/time still ahead of now). */
export function isUpcoming(appt: Appointment, today: string, now: string): boolean {
  if (appt.status !== 'booked') return false;
  if (appt.appointmentDate > today) return true;
  if (appt.appointmentDate < today) return false;
  return appt.startTime >= now;
}
