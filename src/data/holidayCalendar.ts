export type HolidayKind = 'school' | 'public' | 'bridge';

export interface HolidayRange {
  id: string;
  label: string;
  kind: HolidayKind;
  startDate: string;
  endDate?: string;
}

export interface HolidayInfo {
  date: string;
  labels: string[];
  kinds: HolidayKind[];
  isSchoolHoliday: boolean;
  isPublicHoliday: boolean;
  isBridgeDay: boolean;
}

export const schoolHolidayRanges: HolidayRange[] = [
  {
    id: 'toussaint-2025-zone-c',
    label: 'Vacances de la Toussaint',
    kind: 'school',
    startDate: '2025-10-18',
    endDate: '2025-11-03',
  },
  {
    id: 'noel-2025-zone-c',
    label: 'Vacances de Noël',
    kind: 'school',
    startDate: '2025-12-20',
    endDate: '2026-01-05',
  },
  {
    id: 'hiver-2026-zone-c',
    label: "Vacances d'hiver",
    kind: 'school',
    startDate: '2026-02-21',
    endDate: '2026-03-09',
  },
  {
    id: 'printemps-2026-zone-c',
    label: 'Vacances de printemps',
    kind: 'school',
    startDate: '2026-04-18',
    endDate: '2026-05-04',
  },
  {
    id: 'ete-2026-zone-c',
    label: "Vacances d'été",
    kind: 'school',
    startDate: '2026-07-04',
    endDate: '2026-08-31',
  },
  {
    id: 'pont-ascension-2026',
    label: "Pont de l'Ascension",
    kind: 'bridge',
    startDate: '2026-05-15',
    endDate: '2026-05-16',
  },
  {
    id: 'toussaint-2026-zone-c',
    label: 'Vacances de la Toussaint',
    kind: 'school',
    startDate: '2026-10-17',
    endDate: '2026-11-02',
  },
  {
    id: 'noel-2026-zone-c',
    label: 'Vacances de Noël',
    kind: 'school',
    startDate: '2026-12-19',
    endDate: '2027-01-04',
  },
  {
    id: 'hiver-2027-zone-c',
    label: "Vacances d'hiver",
    kind: 'school',
    startDate: '2027-02-06',
    endDate: '2027-02-22',
  },
  {
    id: 'printemps-2027-zone-c',
    label: 'Vacances de printemps',
    kind: 'school',
    startDate: '2027-04-03',
    endDate: '2027-04-19',
  },
  {
    id: 'ete-2027-zone-c',
    label: "Vacances d'été",
    kind: 'school',
    startDate: '2027-07-03',
  },
  {
    id: 'pont-ascension-2027',
    label: "Pont de l'Ascension",
    kind: 'bridge',
    startDate: '2027-05-07',
    endDate: '2027-05-07',
  },
];

export const frenchPublicHolidays: HolidayRange[] = [
  {
    id: 'toussaint-2025',
    label: 'Toussaint',
    kind: 'public',
    startDate: '2025-11-01',
    endDate: '2025-11-01',
  },
  {
    id: 'armistice-2025',
    label: 'Armistice',
    kind: 'public',
    startDate: '2025-11-11',
    endDate: '2025-11-11',
  },
  {
    id: 'noel-2025',
    label: 'Noël',
    kind: 'public',
    startDate: '2025-12-25',
    endDate: '2025-12-25',
  },
  {
    id: 'jour-an-2026',
    label: "Jour de l'An",
    kind: 'public',
    startDate: '2026-01-01',
    endDate: '2026-01-01',
  },
  {
    id: 'paques-2026',
    label: 'Lundi de Pâques',
    kind: 'public',
    startDate: '2026-04-06',
    endDate: '2026-04-06',
  },
  {
    id: 'travail-2026',
    label: 'Fête du Travail',
    kind: 'public',
    startDate: '2026-05-01',
    endDate: '2026-05-01',
  },
  {
    id: 'victoire-2026',
    label: 'Victoire 1945',
    kind: 'public',
    startDate: '2026-05-08',
    endDate: '2026-05-08',
  },
  {
    id: 'ascension-2026',
    label: 'Ascension',
    kind: 'public',
    startDate: '2026-05-14',
    endDate: '2026-05-14',
  },
  {
    id: 'pentecote-2026',
    label: 'Lundi de Pentecôte',
    kind: 'public',
    startDate: '2026-05-25',
    endDate: '2026-05-25',
  },
  {
    id: 'fete-nationale-2026',
    label: 'Fête nationale',
    kind: 'public',
    startDate: '2026-07-14',
    endDate: '2026-07-14',
  },
  {
    id: 'assomption-2026',
    label: 'Assomption',
    kind: 'public',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
  },
  {
    id: 'toussaint-2026',
    label: 'Toussaint',
    kind: 'public',
    startDate: '2026-11-01',
    endDate: '2026-11-01',
  },
  {
    id: 'armistice-2026',
    label: 'Armistice 1918',
    kind: 'public',
    startDate: '2026-11-11',
    endDate: '2026-11-11',
  },
  {
    id: 'noel-2026',
    label: 'Noël',
    kind: 'public',
    startDate: '2026-12-25',
    endDate: '2026-12-25',
  },
  {
    id: 'jour-an-2027',
    label: "Jour de l'An",
    kind: 'public',
    startDate: '2027-01-01',
    endDate: '2027-01-01',
  },
  {
    id: 'paques-2027',
    label: 'Lundi de Pâques',
    kind: 'public',
    startDate: '2027-03-29',
    endDate: '2027-03-29',
  },
  {
    id: 'travail-2027',
    label: 'Fête du Travail',
    kind: 'public',
    startDate: '2027-05-01',
    endDate: '2027-05-01',
  },
  {
    id: 'ascension-2027',
    label: 'Ascension',
    kind: 'public',
    startDate: '2027-05-06',
    endDate: '2027-05-06',
  },
  {
    id: 'victoire-2027',
    label: 'Victoire 1945',
    kind: 'public',
    startDate: '2027-05-08',
    endDate: '2027-05-08',
  },
  {
    id: 'pentecote-2027',
    label: 'Lundi de Pentecôte',
    kind: 'public',
    startDate: '2027-05-17',
    endDate: '2027-05-17',
  },
  {
    id: 'fete-nationale-2027',
    label: 'Fête nationale',
    kind: 'public',
    startDate: '2027-07-14',
    endDate: '2027-07-14',
  },
  {
    id: 'assomption-2027',
    label: 'Assomption',
    kind: 'public',
    startDate: '2027-08-15',
    endDate: '2027-08-15',
  },
];

export const holidayRanges: HolidayRange[] = [
  ...schoolHolidayRanges,
  ...frenchPublicHolidays,
];

export function getHolidayInfo(date: string): HolidayInfo | undefined {
  const matchingRanges = holidayRanges.filter((range) => isDateInHolidayRange(date, range));

  if (!matchingRanges.length) {
    return undefined;
  }

  const kinds = [...new Set(matchingRanges.map((range) => range.kind))];

  return {
    date,
    labels: matchingRanges.map((range) => range.label),
    kinds,
    isSchoolHoliday: kinds.includes('school'),
    isPublicHoliday: kinds.includes('public'),
    isBridgeDay: kinds.includes('bridge'),
  };
}

export function isHolidayDate(date: string) {
  return Boolean(getHolidayInfo(date));
}

export function isSchoolHolidayDate(date: string) {
  return Boolean(getHolidayInfo(date)?.isSchoolHoliday);
}

export function isPublicHolidayDate(date: string) {
  return Boolean(getHolidayInfo(date)?.isPublicHoliday);
}

export function isDateInHolidayRange(date: string, range: HolidayRange) {
  const endDate = range.endDate ?? '9999-12-31';
  return date >= range.startDate && date <= endDate;
}
