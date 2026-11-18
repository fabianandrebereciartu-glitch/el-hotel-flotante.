import { MAX_ALTITUDE_METERS } from './levels';

export type WalkthroughLevelId = 'lvl-14' | 'lvl-34' | 'lvl-68';

export interface WalkObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface InteriorSpaceSpec {
  id: WalkthroughLevelId;
  code: string;
  name: string;
  subtitle: string;
  areaSqm: number;
  amenities: readonly string[];
  floorY: number;
  eyeHeight: number;
  ceilingY: number;
  spawnX: number;
  spawnZ: number;
  initialYaw: number;
  initialPitch: number;
  entryStartOffset: readonly [number, number, number];
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  obstacles: readonly WalkObstacle[];
}

export interface BeaconPose {
  y: number;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  isDualTower: boolean;
  isSkybridgeZone: boolean;
  anchorX: number;
  anchorZ: number;
  codeLabel: string;
  altitudeMeters: number;
}

export const INTERIOR_SPACES: Readonly<Record<WalkthroughLevelId, InteriorSpaceSpec>> = {
  'lvl-14': {
    id: 'lvl-14',
    code: 'LVL 14',
    name: 'THE RIVER RESIDENCE',
    subtitle: 'WEST TOWER · LEVEL 14 SALON',
    areaSqm: 315,
    amenities: [
      'Smoked-Oak Herringbone',
      'Honed Portland Hearth',
      'Thames Acoustic Glazing',
      'Private Sommelier Pantry',
    ],
    floorY: 37.8,
    eyeHeight: 1.65,
    ceilingY: 42.9,
    spawnX: -12.4,
    spawnZ: 4.5,
    initialYaw: 0.62,
    initialPitch: -0.06,
    entryStartOffset: [2.5, 1.5, 22],
    bounds: {
      minX: -24.4,
      maxX: -11.6,
      minZ: -4.5,
      maxZ: 6.4,
    },
    obstacles: [
      // Modular L-sofa & travertine coffee table central lounge island
      { minX: -21.8, maxX: -16.6, minZ: -2.4, maxZ: 1.0 },
    ],
  },
  'lvl-34': {
    id: 'lvl-34',
    code: 'LVL 34',
    name: 'THE SKYBRIDGE SPA LOUNGE',
    subtitle: 'GEOTHERMAL GALLERY · LEVEL 34',
    areaSqm: 480,
    amenities: [
      '38°C Cantilevered Infinity Pool',
      'Vitality Whirlpool & Brass Showers',
      'Draped Cabanas & Sunken Fire Pit',
      'Tea Bar & Glass Cedar Sauna',
    ],
    floorY: 86.12,
    eyeHeight: 1.65,
    ceilingY: 93.75,
    spawnX: -8.6,
    spawnZ: 1.55,
    initialYaw: -1.55,
    initialPitch: -0.04,
    entryStartOffset: [0, 3.0, 26],
    bounds: {
      minX: -9.6,
      maxX: 9.6,
      minZ: -3.4,
      maxZ: 5.5,
    },
    obstacles: [
      // Zone 3: Curved Tea & Champagne Spa Bar + 3 Barstools (Left Wing)
      { minX: -9.8, maxX: -5.85, minZ: -3.3, maxZ: 0.45 },
      // Zone 1: Raised Circular Stone Vitality Whirlpool (Front-Left Poolside)
      { minX: -7.7, maxX: -4.5, minZ: 2.35, maxZ: 5.35 },
      // Zone 2A: Circular Sunken Fire-Bowl Sofa Lounge (Center Gallery)
      { minX: -1.85, maxX: 1.85, minZ: -0.75, maxZ: 2.75 },
      // Zone 2B: Draped Linen Cabana 1 (Center-East North)
      { minX: 3.35, maxX: 5.95, minZ: -2.85, maxZ: -0.35 },
      // Zone 2B: Draped Linen Cabana 2 (Center-East South)
      { minX: 3.35, maxX: 5.95, minZ: 1.45, maxZ: 3.95 },
      // Zone 4: Glass-Walled Cedar Sauna Pavilion (Right Wing)
      { minX: 7.4, maxX: 10.4, minZ: -3.5, maxZ: 2.15 },
    ],
  },
  'lvl-68': {
    id: 'lvl-68',
    code: 'LVL 68',
    name: 'THE CROWN TRIPLEX PENTHOUSE',
    subtitle: 'EAST TOWER SUMMIT · LEVEL 68',
    areaSqm: 740,
    amenities: [
      'Helical Bronze & LED Staircase',
      'Backlit Fluted Onyx Bar',
      'Curved Ivory Bouclé Salon',
      'Open-Air Gas Fire-Ribbon',
    ],
    floorY: 170.48,
    eyeHeight: 1.65,
    ceilingY: 181.45,
    spawnX: 19.2,
    spawnZ: 5.05,
    initialYaw: 0.2,
    initialPitch: 0.02,
    entryStartOffset: [-2.0, 3.5, 22],
    bounds: {
      minX: 13.4,
      maxX: 22.3,
      minZ: -4.4,
      maxZ: 5.7,
    },
    obstacles: [
      // Under-stair structural core on ground floor (leaves bottom step at Z=-1.58 open for ascending)
      { minX: 13.0, maxX: 15.6, minZ: -4.8, maxZ: -2.65 },
      // Travertine & backlit onyx cocktail bar + leather stools on East wall
      { minX: 19.6, maxX: 22.8, minZ: -2.6, maxZ: 0.2 },
      // Open-air sky-terrace linear gas fire-ribbon hearth
      { minX: 14.9, maxX: 18.0, minZ: 4.3, maxZ: 5.4 },
      // Curved ivory bouclé sectional & circular smoked-glass coffee table
      { minX: 15.6, maxX: 18.9, minZ: -0.3, maxZ: 2.3 },
    ],
  },
};

export function isWalkthroughLevel(levelId: string): levelId is WalkthroughLevelId {
  return levelId === 'lvl-14' || levelId === 'lvl-34' || levelId === 'lvl-68';
}

export function getInteriorForLevel(levelId: string): InteriorSpaceSpec | null {
  if (!isWalkthroughLevel(levelId)) return null;
  return INTERIOR_SPACES[levelId];
}

/**
 * Resolves a player's next horizontal (x, z) coordinate inside a modeled
 * interior room, clamping smoothly to architectural glazing/walls and
 * sliding cleanly along central furniture obstacles without snagging.
 */
export function clampWalkPosition(
  spaceId: WalkthroughLevelId,
  x: number,
  z: number,
): { x: number; z: number } {
  const space = INTERIOR_SPACES[spaceId];
  let nx = Math.max(space.bounds.minX, Math.min(space.bounds.maxX, x));
  let nz = Math.max(space.bounds.minZ, Math.min(space.bounds.maxZ, z));

  const pad = 0.32;
  for (let i = 0; i < space.obstacles.length; i++) {
    const ob = space.obstacles[i];
    const minX = ob.minX - pad;
    const maxX = ob.maxX + pad;
    const minZ = ob.minZ - pad;
    const maxZ = ob.maxZ + pad;

    if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
      const distLeft = nx - minX;
      const distRight = maxX - nx;
      const distBack = nz - minZ;
      const distFront = maxZ - nz;
      const minDist = Math.min(distLeft, distRight, distBack, distFront);

      if (minDist === distLeft) nx = minX;
      else if (minDist === distRight) nx = maxX;
      else if (minDist === distBack) nz = minZ;
      else nz = maxZ;
    }
  }

  nx = Math.max(space.bounds.minX, Math.min(space.bounds.maxX, nx));
  nz = Math.max(space.bounds.minZ, Math.min(space.bounds.maxZ, nz));
  return { x: nx, z: nz };
}

export interface WalkPose {
  x: number;
  z: number;
  floorOffset: number;
}

const LVL68_MEZZ_HEIGHT = 5.41;
const LVL68_STAIR_CENTER_X = 16.1;
const LVL68_STAIR_CENTER_Z = -1.45;
const LVL68_MEZZ_OBSTACLES: readonly WalkObstacle[] = [
  // Executive king-size dark-oak platform bed + floating nightstands on upper mezzanine North wing
  { minX: 18.4, maxX: 21.4, minZ: -4.95, maxZ: -2.4 },
  // Smoked-glass wardrobe on East mezzanine wall
  { minX: 22.05, maxX: 23.2, minZ: -4.85, maxZ: -2.1 },
  // Observation armchair & bronze side table on East mezzanine gallery wing
  { minX: 21.25, maxX: 22.45, minZ: 0.75, maxZ: 1.95 },
];

function deflectFromObstacles(
  x: number,
  z: number,
  obstacles: readonly WalkObstacle[],
  pad = 0.32,
): { x: number; z: number } {
  let nx = x;
  let nz = z;
  for (let i = 0; i < obstacles.length; i++) {
    const ob = obstacles[i];
    const minX = ob.minX - pad;
    const maxX = ob.maxX + pad;
    const minZ = ob.minZ - pad;
    const maxZ = ob.maxZ + pad;

    if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
      const distLeft = nx - minX;
      const distRight = maxX - nx;
      const distBack = nz - minZ;
      const distFront = maxZ - nz;
      const minDist = Math.min(distLeft, distRight, distBack, distFront);

      if (minDist === distLeft) nx = minX;
      else if (minDist === distRight) nx = maxX;
      else if (minDist === distBack) nz = minZ;
      else nz = maxZ;
    }
  }
  return { x: nx, z: nz };
}

/**
 * Full 3D architectural walk solver supporting:
 * - Level 34 walk-in submerged pool entry steps (central opening x in [-2.15, 2.15])
 * - Level 68 core-anchored helical stair ramp (0m -> 5.41m) & L-shaped upper observation gallery
 */
export function resolveWalkPose(
  spaceId: WalkthroughLevelId,
  x: number,
  z: number,
  currentFloorOffset = 0,
): WalkPose {
  if (spaceId === 'lvl-14') {
    const c = clampWalkPosition('lvl-14', x, z);
    return { x: c.x, z: c.z, floorOffset: 0 };
  }

  if (spaceId === 'lvl-34') {
    const space = INTERIOR_SPACES['lvl-34'];
    // Allow descending into the central 3-step pool entry between the flanking balustrades
    if (z > space.bounds.maxZ && x >= -2.15 && x <= 2.15) {
      const nx = Math.max(-2.1, Math.min(2.1, x));
      const nz = Math.max(space.bounds.maxZ, Math.min(7.6, z));
      const t = Math.max(0, Math.min(1, (nz - 6.0) / 1.55));
      return { x: nx, z: nz, floorOffset: -0.46 * t };
    }
    const c = clampWalkPosition('lvl-34', x, z);
    return { x: c.x, z: c.z, floorOffset: 0 };
  }

  // Level 68: Two-level penthouse circulation (lower salon + core-anchored stair ramp + L-shaped mezzanine gallery)
  const dxNorm = -(x - LVL68_STAIR_CENTER_X) / 2.25;
  const dzNorm = -(z - LVL68_STAIR_CENTER_Z) / 2.35;
  const stairRadius = Math.hypot(dxNorm, dzNorm);
  const stairAngle = Math.atan2(dzNorm, dxNorm);

  const inStairArc =
    stairRadius >= 0.55 &&
    stairRadius <= 1.45 &&
    stairAngle >= -0.32 &&
    stairAngle <= 2.02;

  if (inStairArc) {
    const u = Math.max(0, Math.min(1, (stairAngle + 0.15) / 1.97));
    const stairHeight = u * LVL68_MEZZ_HEIGHT;
    // Hysteresis prevents snapping through the underside of the upper stair flight
    if (Math.abs(stairHeight - currentFloorOffset) <= 1.75) {
      const clampedR = Math.max(0.72, Math.min(1.22, stairRadius));
      const sx = LVL68_STAIR_CENTER_X - Math.cos(stairAngle) * 2.25 * clampedR;
      const sz = LVL68_STAIR_CENTER_Z - Math.sin(stairAngle) * 2.35 * clampedR;
      return { x: sx, z: sz, floorOffset: stairHeight };
    }
  }

  // Upper L-shaped observation mezzanine gallery (North bedroom wing + East observation gallery)
  if (currentFloorOffset >= 3.8) {
    const clampL = (px: number, pz: number): { x: number; z: number } => {
      let lx = Math.max(16.6, Math.min(22.45, px));
      let lz = Math.max(-4.58, Math.min(2.68, pz));
      // Enforce inner L-corner balustrade (South balustrade at z = -1.68 for x < 20.28, West balustrade at x = 20.28 for z > -1.68)
      if (lx < 20.28 && lz > -1.68) {
        if (20.28 - lx < lz - -1.68) lx = 20.28;
        else lz = -1.68;
      }
      return { x: lx, z: lz };
    };

    const initial = clampL(x, z);
    const deflected = deflectFromObstacles(initial.x, initial.z, LVL68_MEZZ_OBSTACLES, 0.28);
    const finalPos = clampL(deflected.x, deflected.z);
    return { x: finalPos.x, z: finalPos.z, floorOffset: LVL68_MEZZ_HEIGHT };
  }

  const c = clampWalkPosition('lvl-68', x, z);
  return { x: c.x, z: c.z, floorOffset: 0 };
}

interface BeaconAnchorPoint {
  progress: number;
  y: number;
  codeLabel: string;
}

const BEACON_CURVE_POINTS: readonly BeaconAnchorPoint[] = [
  { progress: 0.0, y: 5.2, codeLabel: '[ LVL 00 · PORTICO ]' },
  { progress: 0.211, y: 40.3, codeLabel: '[ LVL 14 · THE VAULT ]' },
  { progress: 0.502, y: 90.0, codeLabel: '[ LVL 34 · SKYBRIDGE ]' },
  { progress: 0.764, y: 138.0, codeLabel: '[ LVL 52 · SUITES ]' },
  { progress: 1.0, y: 175.8, codeLabel: '[ LVL 68 · PENTHOUSE ]' },
];

export function progressToBeaconPose(progress: number): BeaconPose {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;

  let y = BEACON_CURVE_POINTS[BEACON_CURVE_POINTS.length - 1].y;
  for (let i = 0; i < BEACON_CURVE_POINTS.length - 1; i++) {
    const a = BEACON_CURVE_POINTS[i];
    const b = BEACON_CURVE_POINTS[i + 1];
    if (p >= a.progress && p <= b.progress) {
      const t = (p - a.progress) / Math.max(b.progress - a.progress, 0.0001);
      y = a.y + (b.y - a.y) * t;
      break;
    }
  }

  let codeLabel = BEACON_CURVE_POINTS[BEACON_CURVE_POINTS.length - 1].codeLabel;
  if (p < 0.18) codeLabel = '[ LVL 00 · PORTICO ]';
  else if (p < 0.42) codeLabel = '[ LVL 14 · THE VAULT ]';
  else if (p < 0.68) codeLabel = '[ LVL 34 · SKYBRIDGE ]';
  else if (p < 0.88) codeLabel = '[ LVL 52 · SUITES ]';

  const altitudeMeters = Math.round(p * MAX_ALTITUDE_METERS);

  // Determine structural envelope dimensions for the architectural collar
  if (y <= 10.4) {
    return {
      y,
      centerX: 0,
      centerZ: 0,
      width: 57.6,
      depth: 19.6,
      isDualTower: false,
      isSkybridgeZone: false,
      anchorX: 28.8,
      anchorZ: 9.8,
      codeLabel,
      altitudeMeters,
    };
  }

  const isSkybridgeZone = y >= 84.5 && y <= 95.5;
  let width = 12.8;
  let depth = 12.8;
  if (y < 62.0) {
    width = 16.8;
    depth = 16.8;
  } else if (y < 126.0) {
    width = 14.8;
    depth = 14.8;
  } else if (y >= 170.0) {
    width = 11.4;
    depth = 11.4;
  }

  // Smoothly select anchor side along the tower silhouette
  let anchorX = 18 + width * 0.5;
  let anchorZ = depth * 0.5;
  if (p < 0.42) {
    // West Tower showcase at Level 14
    anchorX = -18 - width * 0.5;
    anchorZ = depth * 0.5;
  } else if (isSkybridgeZone) {
    anchorX = 12.6;
    anchorZ = 7.6;
  }

  return {
    y,
    centerX: 0,
    centerZ: 0,
    width,
    depth,
    isDualTower: true,
    isSkybridgeZone,
    anchorX,
    anchorZ,
    codeLabel,
    altitudeMeters,
  };
}
