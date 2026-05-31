import { describe, expect, it } from 'vitest';
import {
  getHolidayInfo,
  isHolidayDate,
  isPublicHolidayDate,
  isSchoolHolidayDate,
} from './holidayCalendar';

describe('holidayCalendar', () => {
  it('detects Zone C school holidays for Perpignan', () => {
    const holiday = getHolidayInfo('2026-02-25');

    expect(holiday?.isSchoolHoliday).toBe(true);
    expect(holiday?.labels).toContain("Vacances d'hiver");
    expect(isSchoolHolidayDate('2026-02-25')).toBe(true);
  });

  it('detects French public holidays', () => {
    const holiday = getHolidayInfo('2026-05-14');

    expect(holiday?.isPublicHoliday).toBe(true);
    expect(holiday?.labels).toContain('Ascension');
    expect(isPublicHolidayDate('2026-05-14')).toBe(true);
  });

  it('detects the national Ascension bridge days', () => {
    const holiday = getHolidayInfo('2026-05-15');

    expect(holiday?.isBridgeDay).toBe(true);
    expect(holiday?.labels).toContain("Pont de l'Ascension");
    expect(isHolidayDate('2026-05-15')).toBe(true);
  });

  it('returns undefined for ordinary training dates', () => {
    expect(getHolidayInfo('2026-06-10')).toBeUndefined();
  });

  it('detects Zone C school holidays for the 2026-2027 season', () => {
    expect(getHolidayInfo('2026-10-20')?.labels).toContain('Vacances de la Toussaint');
    expect(getHolidayInfo('2026-12-24')?.labels).toContain('Vacances de Noël');
    expect(getHolidayInfo('2027-02-10')?.labels).toContain("Vacances d'hiver");
    expect(getHolidayInfo('2027-04-07')?.labels).toContain('Vacances de printemps');
    expect(getHolidayInfo('2027-07-03')?.labels).toContain("Vacances d'été");
  });

  it('detects 2026-2027 public holidays and Ascension bridge', () => {
    expect(getHolidayInfo('2026-11-11')?.labels).toContain('Armistice 1918');
    expect(getHolidayInfo('2027-03-29')?.labels).toContain('Lundi de Pâques');
    expect(getHolidayInfo('2027-05-06')?.labels).toContain('Ascension');
    expect(getHolidayInfo('2027-05-07')?.labels).toContain("Pont de l'Ascension");
    expect(getHolidayInfo('2027-05-17')?.labels).toContain('Lundi de Pentecôte');
  });
});
