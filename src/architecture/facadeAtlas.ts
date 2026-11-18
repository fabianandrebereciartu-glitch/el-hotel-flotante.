export type RoomBayMood = 'warm-suite' | 'dim-mood' | 'dark-midnight';
export type RoomSilhouetteKind = 'floor-lamp' | 'sofa' | 'headboard' | 'none';

export interface RoomBaySpec {
  col: number;
  row: number;
  mood: RoomBayMood;
  silhouette: RoomSilhouetteKind;
  warmthTone: number; // 0..1 temperature variation
  curtainPullLeft: number; // fraction of bay width (0.09..0.19)
  curtainPullRight: number; // fraction of bay width (0.09..0.19)
}

export const FACADE_ATLAS_COLS = 7;
export const FACADE_ATLAS_ROWS = 16;
export const FACADE_ATLAS_WIDTH = 1024;
export const FACADE_ATLAS_HEIGHT = 2048;

export function seededBayHash(col: number, row: number, salt = 0): number {
  const n = Math.sin((col * 127.1 + row * 311.7 + salt * 74.7) * 1.137) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Classifies each hotel room bay across the 7x16 facade atlas deterministically:
 * - ~35% warmly lit luxury suites (with subtle floor-lamp / sofa / headboard silhouettes)
 * - ~35% dimly lit evening mood rooms
 * - ~30% dark unlit midnight reflective glass
 */
export function classifyRoomBay(col: number, row: number): RoomBaySpec {
  const flatIdx = row * FACADE_ATLAS_COLS + col;
  const quasi = (flatIdx * 0.6180339887498949 + seededBayHash(col, row, 1) * 0.11) % 1;
  const h = quasi < 0 ? quasi + 1 : quasi;
  const sHash = seededBayHash(col, row, 2);
  const wHash = seededBayHash(col, row, 3);
  const cLeftHash = seededBayHash(col, row, 4);
  const cRightHash = seededBayHash(col, row, 5);

  let mood: RoomBayMood;
  if (h < 0.35) {
    mood = 'warm-suite';
  } else if (h < 0.7) {
    mood = 'dim-mood';
  } else {
    mood = 'dark-midnight';
  }

  let silhouette: RoomSilhouetteKind = 'none';
  if (mood === 'warm-suite') {
    if (sHash < 0.34) silhouette = 'floor-lamp';
    else if (sHash < 0.68) silhouette = 'sofa';
    else silhouette = 'headboard';
  } else if (mood === 'dim-mood') {
    if (sHash < 0.45) silhouette = 'sofa';
    else if (sHash < 0.8) silhouette = 'headboard';
    else silhouette = 'floor-lamp';
  }

  return {
    col,
    row,
    mood,
    silhouette,
    warmthTone: wHash,
    curtainPullLeft: 0.1 + cLeftHash * 0.085,
    curtainPullRight: 0.1 + cRightHash * 0.085,
  };
}

/**
 * Computes exact UV vertical span [vStart, vEnd] for a tower facade segment
 * from world Y = yBottom to Y = yTop so texture floor rows lock 1:1 with 3D slab ledges.
 */
export function computeTierUvTransform(
  yBottom: number,
  yTop: number,
  tierYStart: number,
  floorStep: number,
  atlasRows: number = FACADE_ATLAS_ROWS,
): { vStart: number; vEnd: number } {
  const startFloor = (yBottom - tierYStart) / floorStep;
  const endFloor = (yTop - tierYStart) / floorStep;
  return {
    vStart: startFloor / atlasRows,
    vEnd: endFloor / atlasRows,
  };
}
