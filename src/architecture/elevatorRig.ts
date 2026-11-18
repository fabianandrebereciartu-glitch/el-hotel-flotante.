import * as THREE from 'three';
import { MAX_ALTITUDE_METERS, TOWER_LEVELS, type TowerLevel } from './levels';

export interface Vec3Like {
  x: number;
  y: number;
  z: number;
}

export interface ResponsiveCameraConfig {
  fov: number;
  distanceMultiplier: number;
  isPortraitOrMobile: boolean;
}

// Smooth cinema-jib anchor path along the Victoria Embankment & south Thames facade.
// Monotonic elevation and a single sweeping arc eliminate violent horizontal whips between chapters.
const CAMERA_POS_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 7.2, 92),
    new THREE.Vector3(10.5, 34, 78),
    new THREE.Vector3(17.5, 62, 66),
    new THREE.Vector3(19.0, 95, 58),
    new THREE.Vector3(13.5, 132, 60),
    new THREE.Vector3(3.0, 166, 64),
    new THREE.Vector3(-8.5, 198, 68),
  ],
  false,
  'centripetal',
  0.5,
);

const CAMERA_LOOK_CURVE = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0, 29, 4),
    new THREE.Vector3(0, 44, 2),
    new THREE.Vector3(0, 66, 2),
    new THREE.Vector3(0, 89, 5),
    new THREE.Vector3(0, 122, 1),
    new THREE.Vector3(0, 152, 0),
    new THREE.Vector3(0, 174, -2),
  ],
  false,
  'centripetal',
  0.5,
);

const POOL_INSPECT_PIVOT: readonly [number, number, number] = [0, 88.5, 4.5];
const POOL_INSPECT_RADIUS = 35.0;
const POOL_INSPECT_BASE_AZIMUTH = 0.52;
const POOL_INSPECT_BASE_HEIGHT = 7.5;

// Pre-allocated scratch vectors for zero-GC spline sampling
const _curvePos = new THREE.Vector3();
const _curveTarget = new THREE.Vector3();

/**
 * Evaluates the continuous Catmull-Rom cinema-jib position and look-at target
 * with zero heap allocations, responsive aspect distance scaling, and optional
 * Skybridge Pool inspection close-up + 360° orbit drag.
 */
export function sampleElevatorCameraPose(
  progress: number,
  outPos: Vec3Like,
  outTarget: Vec3Like,
  yawOffset = 0,
  pitchOffset = 0,
  distanceMultiplier = 1,
  poolInspectBlend = 0,
  inspectOrbitYaw = 0,
  inspectOrbitPitch = 0,
): void {
  const p = clampProgress(progress);

  CAMERA_POS_CURVE.getPoint(p, _curvePos);
  CAMERA_LOOK_CURVE.getPoint(p, _curveTarget);

  let px = _curvePos.x * distanceMultiplier;
  let py = _curvePos.y;
  let pz = _curvePos.z * distanceMultiplier;

  let tx = _curveTarget.x;
  let ty = _curveTarget.y;
  let tz = _curveTarget.z;

  const inspect = Math.max(0, Math.min(1, poolInspectBlend));
  if (inspect > 0.0001) {
    const inspectDistScale = 1 + (distanceMultiplier - 1) * 0.45;
    const azimuth = POOL_INSPECT_BASE_AZIMUTH + inspectOrbitYaw;
    const radius = POOL_INSPECT_RADIUS * inspectDistScale;
    const ipx = POOL_INSPECT_PIVOT[0] + Math.sin(azimuth) * radius;
    const ipy = POOL_INSPECT_PIVOT[1] + POOL_INSPECT_BASE_HEIGHT + inspectOrbitPitch * 10;
    const ipz = POOL_INSPECT_PIVOT[2] + Math.cos(azimuth) * radius;

    px = px + (ipx - px) * inspect;
    py = py + (ipy - py) * inspect;
    pz = pz + (ipz - pz) * inspect;
    tx = tx + (POOL_INSPECT_PIVOT[0] - tx) * inspect;
    ty = ty + (POOL_INSPECT_PIVOT[1] - ty) * inspect;
    tz = tz + (POOL_INSPECT_PIVOT[2] - tz) * inspect;
  }

  if ((yawOffset !== 0 || pitchOffset !== 0) && inspect < 0.98) {
    const parallaxScale = 1 - inspect;
    const dx = px - tx;
    const dz = pz - tz;
    const cosY = Math.cos(yawOffset * parallaxScale);
    const sinY = Math.sin(yawOffset * parallaxScale);
    px = tx + dx * cosY - dz * sinY;
    pz = tz + dx * sinY + dz * cosY;
    py = Math.max(2.2, py + pitchOffset * 12 * parallaxScale);
  }

  outPos.x = px;
  outPos.y = py;
  outPos.z = pz;

  outTarget.x = tx;
  outTarget.y = ty;
  outTarget.z = tz;
}

export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.max(0, Math.min(1, progress));
}

export function computeResponsiveCameraConfig(
  width: number,
  height: number,
): ResponsiveCameraConfig {
  const safeW = Math.max(width, 1);
  const safeH = Math.max(height, 1);
  const aspect = safeW / safeH;
  const isPortraitOrMobile = safeW < 768 || aspect < 1;
  return {
    isPortraitOrMobile,
    fov: isPortraitOrMobile ? 62 : 46,
    distanceMultiplier: isPortraitOrMobile ? 1.65 : 1.0,
  };
}

export function dampScalar(
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number {
  const clampedDt = Math.min(Math.max(dt, 0), 0.5);
  return current + (target - current) * (1 - Math.exp(-lambda * clampedDt));
}

export function progressToAltitudeMeters(progress: number): number {
  return Math.round(clampProgress(progress) * MAX_ALTITUDE_METERS);
}

export function formatAltitudeReadout(meters: number): string {
  const clamped = Math.max(0, Math.min(MAX_ALTITUDE_METERS, Math.round(meters)));
  return `ALT ${String(clamped).padStart(3, '0')}M`;
}

export function findActiveChapter(progress: number): TowerLevel {
  const p = clampProgress(progress);
  for (let i = 0; i < TOWER_LEVELS.length; i++) {
    const lvl = TOWER_LEVELS[i];
    if (p >= lvl.rangeMin && p < lvl.rangeMax) {
      return lvl;
    }
  }
  return TOWER_LEVELS[TOWER_LEVELS.length - 1];
}
