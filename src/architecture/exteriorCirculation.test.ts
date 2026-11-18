import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyParallaxRoom,
  ELEVATOR_MILESTONE_STOPS_Y,
  evaluatePanoramicElevatorCar,
  EXTERIOR_TIERS,
  isWestTowerWalkableLevel14Band,
  isWithinTransferBand,
  PANORAMIC_ELEVATOR_SCHEDULES,
  type ElevatorCarState,
} from './exteriorCirculation';

test('exterior tiers align seamlessly from 14m triple-height portico to 170m crown', () => {
  assert.equal(EXTERIOR_TIERS[0].yStart, 14);
  assert.equal(EXTERIOR_TIERS[0].yEnd, EXTERIOR_TIERS[1].yStart);
  assert.equal(EXTERIOR_TIERS[1].yEnd, EXTERIOR_TIERS[2].yStart);
  assert.equal(EXTERIOR_TIERS[2].yEnd, 170);

  for (const tier of EXTERIOR_TIERS) {
    assert.equal(tier.glassInset, 0.7);
    assert.equal(tier.slabProjection, 0.8);
  }
});

test('parallax room classification produces diverse warm, alabaster, and unlit depths', () => {
  const counts: Record<string, number> = {
    'warm-champagne': 0,
    'warm-amber': 0,
    'cool-alabaster': 0,
    'dark-unlit': 0,
  };
  for (let t = 0; t < 2; t++) {
    for (let fl = 0; fl < 16; fl++) {
      for (let side = 0; side < 4; side++) {
        for (let bay = 0; bay < 4; bay++) {
          const room = classifyParallaxRoom(t, 0, fl, side, bay);
          counts[room.palette] += 1;
        }
      }
    }
  }
  assert.ok(counts['warm-champagne'] > 40);
  assert.ok(counts['warm-amber'] > 30);
  assert.ok(counts['cool-alabaster'] > 20);
  assert.ok(counts['dark-unlit'] > 40);
});

test('transfer bands and West Tower Level 14 walkable opening never collide', () => {
  assert.equal(isWestTowerWalkableLevel14Band(0, 40.3), true);
  assert.equal(isWestTowerWalkableLevel14Band(1, 40.3), false);
  assert.equal(isWithinTransferBand(40.3), false);
  assert.equal(isWithinTransferBand(36.0), true);
  assert.equal(isWithinTransferBand(138.0), true);
  assert.equal(isWithinTransferBand(168.0), true);
});

test('4 panoramic elevators stay within shaft bounds, dwell smoothly, and stay staggered', () => {
  assert.equal(PANORAMIC_ELEVATOR_SCHEDULES.length, 4);
  const state: ElevatorCarState = { y: 0, velocityY: 0, isDwelling: false, nearestStopY: 0 };
  const minBound = ELEVATOR_MILESTONE_STOPS_Y.lvl00;
  const maxBound = ELEVATOR_MILESTONE_STOPS_Y.lvl68;

  const yAtT0: number[] = [];
  let observedDwell = false;
  let observedMotion = false;

  for (const sched of PANORAMIC_ELEVATOR_SCHEDULES) {
    evaluatePanoramicElevatorCar(sched, 0, state);
    yAtT0.push(state.y);

    let prevY = state.y;
    for (let s = 0; s <= 120; s++) {
      const t = s * 0.5;
      evaluatePanoramicElevatorCar(sched, t, state);
      assert.ok(
        state.y >= minBound - 0.001 && state.y <= maxBound + 0.001,
        `car ${sched.carIndex} y=${state.y} within [${minBound}, ${maxBound}]`,
      );
      if (state.isDwelling) {
        observedDwell = true;
        assert.equal(state.velocityY, 0);
      } else {
        observedMotion = true;
      }
      if (s > 0) {
        // Max velocity over 0.5s step should be well-bounded and smooth
        assert.ok(Math.abs(state.y - prevY) < 12, `car ${sched.carIndex} step smooth`);
      }
      prevY = state.y;
    }
  }

  assert.equal(observedDwell, true);
  assert.equal(observedMotion, true);
  const uniquePositions = new Set(yAtT0.map((v) => Math.round(v)));
  assert.ok(uniquePositions.size >= 3, `expected staggered elevator positions at t=0, got ${yAtT0}`);
});
