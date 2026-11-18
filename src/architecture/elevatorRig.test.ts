import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampProgress,
  computeResponsiveCameraConfig,
  dampScalar,
  findActiveChapter,
  formatAltitudeReadout,
  progressToAltitudeMeters,
  sampleElevatorCameraPose,
} from './elevatorRig';
import { MAX_ALTITUDE_METERS } from './levels';
import {
  DOSSIER_REFERENCE_CODE,
  RESIDENCE_OPTIONS,
  getDefaultResidenceForLevel,
} from './residences';

test('altitude mapping and telemetry formatting cover 0m to 275m', () => {
  assert.equal(progressToAltitudeMeters(-0.5), 0);
  assert.equal(progressToAltitudeMeters(0), 0);
  assert.equal(progressToAltitudeMeters(0.5), 138);
  assert.equal(progressToAltitudeMeters(1), MAX_ALTITUDE_METERS);
  assert.equal(progressToAltitudeMeters(1.5), MAX_ALTITUDE_METERS);

  assert.equal(formatAltitudeReadout(0), 'ALT 000M');
  assert.equal(formatAltitudeReadout(58), 'ALT 058M');
  assert.equal(formatAltitudeReadout(138), 'ALT 138M');
  assert.equal(formatAltitudeReadout(275), 'ALT 275M');
});

test('scroll chapter selection maps all 5 Phase 2 ranges accurately', () => {
  assert.equal(findActiveChapter(0.0).id, 'lvl-00');
  assert.equal(findActiveChapter(0.17).id, 'lvl-00');
  assert.equal(findActiveChapter(0.18).id, 'lvl-14');
  assert.equal(findActiveChapter(0.41).id, 'lvl-14');
  assert.equal(findActiveChapter(0.42).id, 'lvl-34');
  assert.equal(findActiveChapter(0.67).id, 'lvl-34');
  assert.equal(findActiveChapter(0.68).id, 'lvl-52');
  assert.equal(findActiveChapter(0.87).id, 'lvl-52');
  assert.equal(findActiveChapter(0.88).id, 'lvl-68');
  assert.equal(findActiveChapter(1.0).id, 'lvl-68');
});

test('responsive camera config widens FOV to 62 and increases distance 1.65x on mobile portrait', () => {
  const mobile = computeResponsiveCameraConfig(390, 844);
  assert.equal(mobile.isPortraitOrMobile, true);
  assert.equal(mobile.fov, 62);
  assert.equal(mobile.distanceMultiplier, 1.65);

  const desktop = computeResponsiveCameraConfig(1440, 900);
  assert.equal(desktop.isPortraitOrMobile, false);
  assert.equal(desktop.fov, 46);
  assert.equal(desktop.distanceMultiplier, 1.0);
});

test('exponential camera damping converges smoothly toward target', () => {
  let value = 0;
  const dt = 1 / 120;
  for (let i = 0; i < 120; i++) {
    value = dampScalar(value, 0.5, 9, dt);
  }
  assert.ok(Math.abs(value - 0.5) < 0.001, `expected convergence near 0.5, got ${value}`);
});

test('camera spline stays clear of twin towers and supports full 360-degree pool inspect orbit', () => {
  const desktopPos = { x: 0, y: 0, z: 0 };
  const mobilePos = { x: 0, y: 0, z: 0 };
  const target = { x: 0, y: 0, z: 0 };

  for (let i = 0; i <= 100; i++) {
    const p = clampProgress(i / 100);
    sampleElevatorCameraPose(p, desktopPos, target, 0, 0, 1.0, 0);
    sampleElevatorCameraPose(p, mobilePos, target, 0, 0, 1.65, 0);

    assert.ok(desktopPos.z >= 36, `desktop z >= 36 at p=${p}, got ${desktopPos.z}`);
    assert.ok(mobilePos.z >= desktopPos.z * 1.6, `mobile pulls back proportionally at p=${p}`);
  }

  const frontPos = { x: 0, y: 0, z: 0 };
  const backPos = { x: 0, y: 0, z: 0 };
  const poolTarget = { x: 0, y: 0, z: 0 };
  sampleElevatorCameraPose(0.502, frontPos, poolTarget, 0, 0, 1.0, 1.0, 0, 0);
  sampleElevatorCameraPose(0.502, backPos, poolTarget, 0, 0, 1.0, 1.0, Math.PI, 0);

  assert.ok(frontPos.z > poolTarget.z && backPos.z < poolTarget.z, '180-deg orbit swings behind Skybridge pivot');
  const frontRadius = Math.hypot(frontPos.x - poolTarget.x, frontPos.z - poolTarget.z);
  const backRadius = Math.hypot(backPos.x - poolTarget.x, backPos.z - poolTarget.z);
  assert.ok(Math.abs(frontRadius - backRadius) < 0.01, '360-degree orbit preserves constant radius around pivot');

  for (let deg = 0; deg < 360; deg += 10) {
    const yaw = (deg * Math.PI) / 180;
    const p = { x: 0, y: 0, z: 0 };
    sampleElevatorCameraPose(0.502, p, poolTarget, 0, 0, 1.0, 1.0, yaw, 0);
    const insideTowerX = Math.abs(p.x) >= 10.5 && Math.abs(p.x) <= 26.0;
    const insideTowerZ = Math.abs(p.z) <= 8.0;
    assert.ok(!(insideTowerX && insideTowerZ), `360 orbit yaw=${deg}deg must clear tower volume (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  }
});

test('continuous CatmullRomCurve3 spline has smooth steps and monotonic elevation', () => {
  const prevPos = { x: 0, y: 0, z: 0 };
  const prevTarget = { x: 0, y: 0, z: 0 };
  const currPos = { x: 0, y: 0, z: 0 };
  const currTarget = { x: 0, y: 0, z: 0 };

  sampleElevatorCameraPose(0, prevPos, prevTarget, 0, 0, 1.0, 0);
  for (let i = 1; i <= 100; i++) {
    const p = i / 100;
    sampleElevatorCameraPose(p, currPos, currTarget, 0, 0, 1.0, 0);

    const stepDist = Math.hypot(
      currPos.x - prevPos.x,
      currPos.y - prevPos.y,
      currPos.z - prevPos.z,
    );
    const dx = Math.abs(currPos.x - prevPos.x);
    assert.ok(stepDist < 3.0, `continuous spline step stays smooth (<3.0 units/1%), got ${stepDist.toFixed(2)}`);
    assert.ok(dx < 1.2, `no violent horizontal whip at p=${p}, dx=${dx.toFixed(2)}`);
    assert.ok(currPos.y >= prevPos.y - 0.01, `elevation climbs smoothly at p=${p}`);

    prevPos.x = currPos.x;
    prevPos.y = currPos.y;
    prevPos.z = currPos.z;
    prevTarget.x = currTarget.x;
    prevTarget.y = currTarget.y;
    prevTarget.z = currTarget.z;
  }
});

test('residence dossier catalog exposes all 4 priced tiers and default level matching', () => {
  assert.equal(DOSSIER_REFERENCE_CODE, 'AURELIA-LON/2026');
  assert.equal(RESIDENCE_OPTIONS.length, 4);
  assert.equal(getDefaultResidenceForLevel('lvl-14').priceFormatted, '£4,200,000');
  assert.equal(getDefaultResidenceForLevel('lvl-34').priceFormatted, '£8,900,000');
  assert.equal(getDefaultResidenceForLevel('lvl-52').priceFormatted, '£18,500,000');
  assert.equal(getDefaultResidenceForLevel('lvl-68').priceFormatted, '£34,000,000');
  assert.equal(getDefaultResidenceForLevel('lvl-00').levelId, 'lvl-52');
});
