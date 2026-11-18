export interface TowerLevel {
  id: string;
  code: string;
  shortCode: string;
  tickLabel: string;
  eyebrow: string;
  headline: string;
  copy: string;
  hint?: string;
  rangeMin: number;
  rangeMax: number;
  progress: number;
  altitudeMeters: number;
  floorNumber: number;
}

export const MAX_ALTITUDE_METERS = 275;
export const TOWER_HEIGHT_UNITS = 180;
export const SKYBRIDGE_Y_UNITS = 90;

export const TOWER_LEVELS: readonly TowerLevel[] = [
  {
    id: 'lvl-00',
    code: 'LVL 00',
    shortCode: '00',
    tickLabel: '00 · PORTICO (0M)',
    eyebrow: '00 · THE ARRIVAL',
    headline: 'The Threshold of the Sky',
    copy: 'Cobblestones and quiet bronze on the Victoria Embankment.',
    hint: 'Scroll to ascend ↑',
    rangeMin: 0.0,
    rangeMax: 0.18,
    progress: 0.0,
    altitudeMeters: 0,
    floorNumber: 0,
  },
  {
    id: 'lvl-14',
    code: 'LVL 14',
    shortCode: '14',
    tickLabel: '14 · VAULT (58M)',
    eyebrow: '14 · BRASSERIE & CELLAR',
    headline: 'The Grand Vault',
    copy: 'Four thousand bottles at fifty meters.',
    rangeMin: 0.18,
    rangeMax: 0.42,
    progress: 0.211,
    altitudeMeters: 58,
    floorNumber: 14,
  },
  {
    id: 'lvl-34',
    code: 'LVL 34',
    shortCode: '34',
    tickLabel: '34 · SKYBRIDGE (138M)',
    eyebrow: '34 · HYDROTHERMAL SKYBRIDGE',
    headline: 'The Skybridge Spa',
    copy: 'Thirty-eight degrees suspended above the Thames.',
    rangeMin: 0.42,
    rangeMax: 0.68,
    progress: 0.502,
    altitudeMeters: 138,
    floorNumber: 34,
  },
  {
    id: 'lvl-52',
    code: 'LVL 52',
    shortCode: '52',
    tickLabel: '52 · SUITES (210M)',
    eyebrow: '52 · PRIVATE RESIDENCES',
    headline: 'Sovereign Suites',
    copy: 'Double-height volume above the clouds.',
    rangeMin: 0.68,
    rangeMax: 0.88,
    progress: 0.764,
    altitudeMeters: 210,
    floorNumber: 52,
  },
  {
    id: 'lvl-68',
    code: 'LVL 68',
    shortCode: '68',
    tickLabel: '68 · CROWN (275M)',
    eyebrow: '68 · THE SUMMIT',
    headline: 'The Crown Observatory',
    copy: 'Silence at two hundred and seventy-five meters.',
    rangeMin: 0.88,
    rangeMax: 1.0,
    progress: 1.0,
    altitudeMeters: 275,
    floorNumber: 68,
  },
] as const;
