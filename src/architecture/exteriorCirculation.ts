export interface ExteriorTierSpec {
  tierIndex: number;
  yStart: number;
  yEnd: number;
  outerWidth: number;
  outerDepth: number;
  glassInset: number;
  slabProjection: number;
  floorCount: number;
  baysPerFace: number;
}

export interface TransferBandSpec {
  id: string;
  yBottom: number;
  yTop: number;
  tierIndex: number;
}

export type ParallaxRoomPalette =
  | 'warm-champagne'
  | 'warm-amber'
  | 'cool-alabaster'
  | 'dark-unlit';

export interface ParallaxRoomStyle {
  palette: ParallaxRoomPalette;
  colorHex: number;
  isLit: boolean;
}

export interface ElevatorCarSchedule {
  carIndex: number;
  xOffset: number;
  cycleSeconds: number;
  phaseOffsetSeconds: number;
  stopsY: readonly number[];
  dwellSeconds: number;
}

export interface ElevatorCarState {
  y: number;
  velocityY: number;
  isDwelling: boolean;
  nearestStopY: number;
}

export const EXTERIOR_TIERS: readonly ExteriorTierSpec[] = [
  {
    tierIndex: 0,
    yStart: 14,
    yEnd: 62,
    outerWidth: 16.2,
    outerDepth: 16.2,
    glassInset: 0.7,
    slabProjection: 0.8,
    floorCount: 16,
    baysPerFace: 4,
  },
  {
    tierIndex: 1,
    yStart: 62,
    yEnd: 126,
    outerWidth: 14.2,
    outerDepth: 14.2,
    glassInset: 0.7,
    slabProjection: 0.8,
    floorCount: 21,
    baysPerFace: 4,
  },
  {
    tierIndex: 2,
    yStart: 126,
    yEnd: 170,
    outerWidth: 12.2,
    outerDepth: 12.2,
    glassInset: 0.7,
    slabProjection: 0.8,
    floorCount: 15,
    baysPerFace: 3,
  },
] as const;

export const TRANSFER_BANDS: readonly TransferBandSpec[] = [
  { id: 'lvl-14-transfer', yBottom: 34.4, yTop: 37.5, tierIndex: 0 },
  { id: 'lvl-34-lower-transfer', yBottom: 82.8, yTop: 85.4, tierIndex: 1 },
  { id: 'lvl-34-upper-transfer', yBottom: 95.3, yTop: 98.0, tierIndex: 1 },
  { id: 'lvl-52-transfer', yBottom: 136.4, yTop: 140.2, tierIndex: 2 },
  { id: 'lvl-68-transfer', yBottom: 166.2, yTop: 170.0, tierIndex: 2 },
] as const;

export const WEST_LVL14_WINDOW_MIN_Y = 37.55;
export const WEST_LVL14_WINDOW_MAX_Y = 43.25;

// Milestone Y coordinates aligned with BEACON_CURVE_POINTS (00, 14, 34, 52, 68)
export const ELEVATOR_MILESTONE_STOPS_Y = {
  lvl00: 2.2,
  lvl14: 38.0,
  lvl34: 89.0,
  lvl52: 138.0,
  lvl68: 171.2,
} as const;

export const PANORAMIC_ELEVATOR_SCHEDULES: readonly ElevatorCarSchedule[] = [
  {
    carIndex: 0,
    xOffset: -3.9,
    cycleSeconds: 54,
    phaseOffsetSeconds: 2.0,
    stopsY: [
      ELEVATOR_MILESTONE_STOPS_Y.lvl00,
      ELEVATOR_MILESTONE_STOPS_Y.lvl34,
      ELEVATOR_MILESTONE_STOPS_Y.lvl68,
      ELEVATOR_MILESTONE_STOPS_Y.lvl34,
    ],
    dwellSeconds: 2.6,
  },
  {
    carIndex: 1,
    xOffset: -2.05,
    cycleSeconds: 62,
    phaseOffsetSeconds: 18.5,
    stopsY: [
      ELEVATOR_MILESTONE_STOPS_Y.lvl68,
      ELEVATOR_MILESTONE_STOPS_Y.lvl52,
      ELEVATOR_MILESTONE_STOPS_Y.lvl14,
      ELEVATOR_MILESTONE_STOPS_Y.lvl00,
      ELEVATOR_MILESTONE_STOPS_Y.lvl14,
      ELEVATOR_MILESTONE_STOPS_Y.lvl52,
    ],
    dwellSeconds: 2.2,
  },
  {
    carIndex: 2,
    xOffset: 2.05,
    cycleSeconds: 56,
    phaseOffsetSeconds: 9.0,
    stopsY: [
      ELEVATOR_MILESTONE_STOPS_Y.lvl14,
      ELEVATOR_MILESTONE_STOPS_Y.lvl34,
      ELEVATOR_MILESTONE_STOPS_Y.lvl52,
      ELEVATOR_MILESTONE_STOPS_Y.lvl68,
      ELEVATOR_MILESTONE_STOPS_Y.lvl34,
      ELEVATOR_MILESTONE_STOPS_Y.lvl00,
    ],
    dwellSeconds: 2.0,
  },
  {
    carIndex: 3,
    xOffset: 3.9,
    cycleSeconds: 68,
    phaseOffsetSeconds: 31.0,
    stopsY: [
      ELEVATOR_MILESTONE_STOPS_Y.lvl00,
      ELEVATOR_MILESTONE_STOPS_Y.lvl14,
      ELEVATOR_MILESTONE_STOPS_Y.lvl34,
      ELEVATOR_MILESTONE_STOPS_Y.lvl52,
      ELEVATOR_MILESTONE_STOPS_Y.lvl68,
      ELEVATOR_MILESTONE_STOPS_Y.lvl52,
      ELEVATOR_MILESTONE_STOPS_Y.lvl34,
      ELEVATOR_MILESTONE_STOPS_Y.lvl14,
    ],
    dwellSeconds: 1.9,
  },
] as const;

function deterministicHash(a: number, b: number, c: number, d: number, e: number): number {
  const n =
    Math.sin(a * 12.9898 + b * 78.233 + c * 37.719 + d * 93.137 + e * 51.413) * 43758.5453123;
  return n - Math.floor(n);
}

/**
 * Classifies recessed parallax interior rooms across the twin towers
 * with varied luxury color temperatures (#ffdfa0, #f5c478, #d9e4ec) and dark unlit rooms.
 */
export function classifyParallaxRoom(
  towerIndex: number,
  tierIndex: number,
  floorIndex: number,
  sideIndex: number,
  bayIndex: number,
): ParallaxRoomStyle {
  const h = deterministicHash(towerIndex + 1, tierIndex + 1, floorIndex + 3, sideIndex + 5, bayIndex + 7);
  if (h < 0.28) {
    return { palette: 'warm-champagne', colorHex: 0xffdfa0, isLit: true };
  }
  if (h < 0.5) {
    return { palette: 'warm-amber', colorHex: 0xf5c478, isLit: true };
  }
  if (h < 0.65) {
    return { palette: 'cool-alabaster', colorHex: 0xd9e4ec, isLit: true };
  }
  return { palette: 'dark-unlit', colorHex: 0x0d121a, isLit: false };
}

/**
 * Determines whether a given floor elevation overlaps a double-height mechanical transfer louver band
 * or the walkable Level 14 glass opening in the West Tower.
 */
export function isWithinTransferBand(yCenter: number): boolean {
  for (let i = 0; i < TRANSFER_BANDS.length; i++) {
    const band = TRANSFER_BANDS[i];
    if (yCenter >= band.yBottom - 0.1 && yCenter <= band.yTop + 0.1) {
      return true;
    }
  }
  return false;
}

export function isWestTowerWalkableLevel14Band(towerIndex: number, yCenter: number): boolean {
  return (
    towerIndex === 0 &&
    yCenter >= WEST_LVL14_WINDOW_MIN_Y &&
    yCenter <= WEST_LVL14_WINDOW_MAX_Y
  );
}

function easeInOutSine(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/**
 * Zero-allocation trajectory solver for the 4 visible exterior panoramic elevator cars.
 * Produces smooth eased ascents/descents with authentic dwell pauses at milestone floors.
 */
export function evaluatePanoramicElevatorCar(
  schedule: ElevatorCarSchedule,
  elapsedTime: number,
  out: ElevatorCarState,
): void {
  const stops = schedule.stopsY;
  const segmentCount = stops.length;
  const totalTime = Math.max(1, schedule.cycleSeconds);
  const rawCycle = (elapsedTime + schedule.phaseOffsetSeconds) % totalTime;
  const wrappedCycle = rawCycle < 0 ? rawCycle + totalTime : rawCycle;

  const segDuration = totalTime / segmentCount;
  const segIdx = Math.min(segmentCount - 1, Math.floor(wrappedCycle / segDuration));
  const localTime = wrappedCycle - segIdx * segDuration;

  const dwell = Math.min(schedule.dwellSeconds, segDuration * 0.45);
  const travelDuration = Math.max(0.001, segDuration - dwell);

  const fromY = stops[segIdx];
  const toY = stops[(segIdx + 1) % segmentCount];

  if (localTime <= dwell) {
    out.y = fromY;
    out.velocityY = 0;
    out.isDwelling = true;
    out.nearestStopY = fromY;
    return;
  }

  const u = Math.max(0, Math.min(1, (localTime - dwell) / travelDuration));
  const eased = easeInOutSine(u);
  const dy = toY - fromY;
  out.y = fromY + dy * eased;
  out.velocityY = (dy * Math.PI * 0.5 * Math.sin(Math.PI * u)) / travelDuration;
  out.isDwelling = false;
  out.nearestStopY = u < 0.5 ? fromY : toY;
}
