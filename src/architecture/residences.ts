export interface ResidenceOption {
  id: string;
  levelId: string;
  label: string;
  title: string;
  levelLabel: string;
  areaSqm: number;
  priceGbp: number;
  priceFormatted: string;
}

export const RESIDENCE_OPTIONS: readonly ResidenceOption[] = [
  {
    id: 'res-lvl-14',
    levelId: 'lvl-14',
    label: 'Level 14 · The Vault Club Suite · 140 m² · £4,200,000',
    title: 'The Vault Club Suite',
    levelLabel: 'Level 14',
    areaSqm: 140,
    priceGbp: 4_200_000,
    priceFormatted: '£4,200,000',
  },
  {
    id: 'res-lvl-34',
    levelId: 'lvl-34',
    label: 'Level 34 · Skybridge Lateral Suite · 220 m² · £8,900,000',
    title: 'Skybridge Lateral Suite',
    levelLabel: 'Level 34',
    areaSqm: 220,
    priceGbp: 8_900_000,
    priceFormatted: '£8,900,000',
  },
  {
    id: 'res-lvl-52',
    levelId: 'lvl-52',
    label: 'Level 52 · Sovereign Duplex Residence · 380 m² · £18,500,000',
    title: 'Sovereign Duplex Residence',
    levelLabel: 'Level 52',
    areaSqm: 380,
    priceGbp: 18_500_000,
    priceFormatted: '£18,500,000',
  },
  {
    id: 'res-lvl-68',
    levelId: 'lvl-68',
    label: 'Level 68 · The Crown Triplex Penthouse · 620 m² · £34,000,000',
    title: 'The Crown Triplex Penthouse',
    levelLabel: 'Level 68',
    areaSqm: 620,
    priceGbp: 34_000_000,
    priceFormatted: '£34,000,000',
  },
] as const;

export const DOSSIER_REFERENCE_CODE = 'AURELIA-LON/2026';

export function getDefaultResidenceForLevel(levelId?: string): ResidenceOption {
  if (levelId) {
    const match = RESIDENCE_OPTIONS.find((r) => r.levelId === levelId);
    if (match) return match;
  }
  return RESIDENCE_OPTIONS[2];
}
