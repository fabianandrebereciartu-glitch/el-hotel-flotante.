import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERIOR_SPACES,
  clampWalkPosition,
  getInteriorForLevel,
  isWalkthroughLevel,
  progressToBeaconPose,
  resolveWalkPose,
} from './interiors';

test('getInteriorForLevel exposes all 3 walkable rooms and excludes non-walkthrough levels', () => {
  assert.equal(isWalkthroughLevel('lvl-00'), false);
  assert.equal(isWalkthroughLevel('lvl-14'), true);
  assert.equal(isWalkthroughLevel('lvl-34'), true);
  assert.equal(isWalkthroughLevel('lvl-52'), false);
  assert.equal(isWalkthroughLevel('lvl-68'), true);

  assert.equal(getInteriorForLevel('lvl-00'), null);
  assert.equal(getInteriorForLevel('lvl-52'), null);

  const l14 = getInteriorForLevel('lvl-14');
  const l34 = getInteriorForLevel('lvl-34');
  const l68 = getInteriorForLevel('lvl-68');
  assert.ok(l14 && l14.name === 'THE RIVER RESIDENCE' && l14.areaSqm === 315);
  assert.ok(l34 && l34.name === 'THE SKYBRIDGE SPA LOUNGE' && l34.areaSqm === 480);
  assert.ok(l68 && l68.name === 'THE CROWN TRIPLEX PENTHOUSE' && l68.areaSqm === 740);
});

test('clampWalkPosition keeps spawns safe and clamps walls and obstacles in all 3 rooms', () => {
  for (const id of ['lvl-14', 'lvl-34', 'lvl-68'] as const) {
    const space = INTERIOR_SPACES[id];
    const spawnClamped = clampWalkPosition(id, space.spawnX, space.spawnZ);
    assert.equal(spawnClamped.x, space.spawnX, `${id} spawnX must lie inside walkable zone`);
    assert.equal(spawnClamped.z, space.spawnZ, `${id} spawnZ must lie inside walkable zone`);

    const clampedOut = clampWalkPosition(id, 999, -999);
    assert.equal(clampedOut.x, space.bounds.maxX);
    assert.equal(clampedOut.z, space.bounds.minZ);
  }

  // Test obstacle deflection around Level 14 central sofa island & Level 68 cocktail bar
  const sofaPush = clampWalkPosition('lvl-14', -19.2, -0.7);
  const sofaOb = INTERIOR_SPACES['lvl-14'].obstacles[0];
  assert.ok(
    sofaPush.x <= sofaOb.minX - 0.31 ||
      sofaPush.x >= sofaOb.maxX + 0.31 ||
      sofaPush.z <= sofaOb.minZ - 0.31 ||
      sofaPush.z >= sofaOb.maxZ + 0.31,
    'lvl-14 sofa obstacle keeps eye outside sofa footprint',
  );

  const barPush = clampWalkPosition('lvl-68', 21.0, -1.2);
  const barOb = INTERIOR_SPACES['lvl-68'].obstacles[1];
  assert.ok(
    barPush.x <= barOb.minX - 0.31 ||
      barPush.x >= barOb.maxX + 0.31 ||
      barPush.z <= barOb.minZ - 0.31 ||
      barPush.z >= barOb.maxZ + 0.31,
    'lvl-68 cocktail bar deflects player cleanly',
  );

  const firePush = clampWalkPosition('lvl-68', 16.4, 4.85);
  const fireOb = INTERIOR_SPACES['lvl-68'].obstacles[2];
  assert.ok(
    firePush.x <= fireOb.minX - 0.31 ||
      firePush.x >= fireOb.maxX + 0.31 ||
      firePush.z <= fireOb.minZ - 0.31 ||
      firePush.z >= fireOb.maxZ + 0.31,
    'lvl-68 linear fire-ribbon deflects player cleanly',
  );

  const salonPush = clampWalkPosition('lvl-68', 17.2, 1.0);
  const salonOb = INTERIOR_SPACES['lvl-68'].obstacles[3];
  assert.ok(
    salonPush.x <= salonOb.minX - 0.31 ||
      salonPush.x >= salonOb.maxX + 0.31 ||
      salonPush.z <= salonOb.minZ - 0.31 ||
      salonPush.z >= salonOb.maxZ + 0.31,
    'lvl-68 curved boucle sectional deflects player cleanly',
  );

  // Level 34 4-zone obstacles (Bar, Whirlpool, Sunken Fire Lounge, Cabana, Sauna) deflect player cleanly
  for (const [idx, probeX, probeZ, label] of [
    [0, -7.4, -1.2, 'Tea & Champagne Bar'],
    [1, -6.1, 3.8, 'Vitality Whirlpool'],
    [2, 0.0, 1.0, 'Sunken Fire Lounge'],
    [3, 4.6, -1.55, 'Draped Cabana 1'],
    [5, 8.8, -0.7, 'Cedar Sauna Pavilion'],
  ] as const) {
    const ob = INTERIOR_SPACES['lvl-34'].obstacles[idx];
    const pushed = clampWalkPosition('lvl-34', probeX, probeZ);
    assert.ok(
      pushed.x <= ob.minX - 0.31 ||
        pushed.x >= ob.maxX + 0.31 ||
        pushed.z <= ob.minZ - 0.31 ||
        pushed.z >= ob.maxZ + 0.31,
      `lvl-34 ${label} deflects player cleanly`,
    );
  }
});

test('progressToBeaconPose tracks facade silhouette and active level callout labels cleanly', () => {
  const b0 = progressToBeaconPose(0.0);
  const b14 = progressToBeaconPose(0.211);
  const b34 = progressToBeaconPose(0.502);
  const b52 = progressToBeaconPose(0.764);
  const b68 = progressToBeaconPose(1.0);

  assert.equal(b0.codeLabel, '[ LVL 00 · PORTICO ]');
  assert.equal(b0.isDualTower, false);

  assert.equal(b14.codeLabel, '[ LVL 14 · THE VAULT ]');
  assert.equal(b14.isDualTower, true);
  assert.ok(b14.y > 37 && b14.y < 43);

  assert.equal(b34.codeLabel, '[ LVL 34 · SKYBRIDGE ]');
  assert.equal(b34.isSkybridgeZone, true);
  assert.ok(Math.abs(b34.y - 90) < 0.2);

  assert.equal(b52.codeLabel, '[ LVL 52 · SUITES ]');
  assert.equal(b68.codeLabel, '[ LVL 68 · PENTHOUSE ]');
  assert.ok(b0.y < b14.y && b14.y < b34.y && b34.y < b52.y && b52.y < b68.y);
});

test('resolveWalkPose enables Level 34 central pool step descent while blocking balustrade wings', () => {
  // Stepping through the central opening descends smoothly into the thermal water
  const stepTop = resolveWalkPose('lvl-34', 0, 6.2, 0);
  assert.ok(stepTop.z > 5.5 && stepTop.floorOffset < 0 && stepTop.floorOffset > -0.2);

  const submerged = resolveWalkPose('lvl-34', 0.4, 7.6, stepTop.floorOffset);
  assert.equal(submerged.z, 7.6);
  assert.ok(Math.abs(submerged.floorOffset - -0.46) < 0.02);

  // Outside the central opening, flanking glass balustrades keep the visitor on the deck
  const wingClamp = resolveWalkPose('lvl-34', -5.0, 6.5, 0);
  assert.equal(wingClamp.z, 5.5);
  assert.equal(wingClamp.floorOffset, 0);
});

test('resolveWalkPose supports Level 68 core-anchored helical stair ramp, ground hysteresis, and L-shaped upper gallery', () => {
  // Bottom step from ground floor enters stair ramp cleanly along West core
  const bottomStep = resolveWalkPose('lvl-68', 13.88, -1.1, 0);
  assert.ok(bottomStep.floorOffset >= 0 && bottomStep.floorOffset < 0.6);

  // Walking near upper stair overhang on the ground floor must NOT teleport up
  const underStairGround = resolveWalkPose('lvl-68', 15.8, -3.7, 0);
  assert.equal(underStairGround.floorOffset, 0);

  // Ascending mid-flight and top landing progresses smoothly to mezzanine height (5.41m)
  const midStair = resolveWalkPose('lvl-68', 14.59, -3.19, 2.2);
  assert.ok(midStair.floorOffset > 2.2 && midStair.floorOffset < 3.4);

  const topStair = resolveWalkPose('lvl-68', 16.65, -3.73, 4.4);
  assert.ok(topStair.floorOffset > 5.1 && topStair.floorOffset <= 5.42);

  // North mezzanine wing clamps visitor behind South balustrade (z <= -1.68)
  const northRailClamp = resolveWalkPose('lvl-68', 18.2, -0.8, 5.41);
  assert.equal(northRailClamp.floorOffset, 5.41);
  assert.equal(northRailClamp.z, -1.68);

  // East L-shaped observation wing lets visitor walk South overlooking salon up to z = 2.68
  const eastGallery = resolveWalkPose('lvl-68', 21.0, 2.2, 5.41);
  assert.equal(eastGallery.floorOffset, 5.41);
  assert.ok(eastGallery.z > 1.8 && eastGallery.x >= 20.28);

  // Deflects cleanly around executive bed, wardrobe, and observation armchair
  const bedDeflect = resolveWalkPose('lvl-68', 19.9, -3.5, 5.41);
  assert.equal(bedDeflect.floorOffset, 5.41);
  assert.ok(bedDeflect.z >= -2.13 || bedDeflect.x <= 18.13 || bedDeflect.x >= 21.67);

  const wardrobeDeflect = resolveWalkPose('lvl-68', 22.3, -3.5, 5.41);
  assert.equal(wardrobeDeflect.floorOffset, 5.41);
  assert.ok(wardrobeDeflect.x <= 21.78);

  const chairDeflect = resolveWalkPose('lvl-68', 21.8, 1.35, 5.41);
  assert.equal(chairDeflect.floorOffset, 5.41);
  assert.ok(chairDeflect.x <= 20.98 || chairDeflect.z <= 0.48 || chairDeflect.z >= 2.22);
});

