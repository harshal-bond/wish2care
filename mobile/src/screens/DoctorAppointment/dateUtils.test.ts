import { addDays, isSunday, nextBookableDates } from './dateUtils';

describe('dateUtils', () => {
  it('addDays rolls over month/year boundaries correctly', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('isSunday identifies Sundays correctly', () => {
    expect(isSunday('2026-08-16')).toBe(true); // confirmed Sunday
    expect(isSunday('2026-08-17')).toBe(false); // Monday
  });

  it('nextBookableDates never includes a Sunday and returns the requested count', () => {
    const dates = nextBookableDates(14);
    expect(dates).toHaveLength(14);
    expect(dates.every((d) => !isSunday(d))).toBe(true);
  });

  it('nextBookableDates returns consecutive non-Sunday dates with no gaps besides Sundays', () => {
    const dates = nextBookableDates(5);
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(`${dates[i - 1]}T00:00:00`);
      const cur = new Date(`${dates[i]}T00:00:00`);
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
      expect(diffDays === 1 || diffDays === 2).toBe(true); // 2 only when a Sunday was skipped
    }
  });
});
