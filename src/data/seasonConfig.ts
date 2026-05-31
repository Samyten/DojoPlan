export interface DojoSeason {
  id: string;
  label: string;
  schoolStartDate: string;
  seasonStartDate: string;
  seasonEndDate: string;
}

export const dojoSeasons: DojoSeason[] = [
  {
    id: '2025-2026',
    label: 'Saison 2025-2026',
    schoolStartDate: '2025-09-01',
    seasonStartDate: '2025-09-08',
    seasonEndDate: '2026-07-03',
  },
  {
    id: '2026-2027',
    label: 'Saison 2026-2027',
    schoolStartDate: '2026-09-01',
    seasonStartDate: '2026-09-08',
    seasonEndDate: '2027-07-02',
  },
];

export const activeDojoSeason = dojoSeasons.find((season) => season.id === '2026-2027') ?? dojoSeasons[0];
