import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampSwimmerPosition,
  computeArticulatedLegReach,
  computeBarDrinkingPose,
  LEVEL34_POOL_BOUNDS,
} from './level34RigMath';

test('clampSwimmerPosition keeps swimmer >= 1.2m clear of pool basin walls and steps', () => {
  const inside = clampSwimmerPosition(2.4, 11.8);
  assert.deepEqual(inside, { x: 2.4, z: 11.8 });

  const clipped = clampSwimmerPosition(8.5, 16.4);
  assert.ok(clipped.x <= LEVEL34_POOL_BOUNDS.maxX - 1.2);
  assert.ok(clipped.z <= LEVEL34_POOL_BOUNDS.maxZ - 1.2);

  const nearSteps = clampSwimmerPosition(0, 6.2);
  assert.ok(nearSteps.z >= 8.6);
});

test('computeBarDrinkingPose rests at counter, lifts smoothly, pauses 1.5s at mouth, and returns', () => {
  const rest = computeBarDrinkingPose(0.5);
  assert.equal(rest.liftBlend, 0);

  const midLift = computeBarDrinkingPose(2.25);
  assert.ok(midLift.liftBlend > 0.3 && midLift.liftBlend < 0.7);
  assert.ok(midLift.elbowX < rest.elbowX);

  const pauseStart = computeBarDrinkingPose(2.75);
  const pauseEnd = computeBarDrinkingPose(4.15);
  assert.equal(pauseStart.liftBlend, 1);
  assert.equal(pauseEnd.liftBlend, 1);
  assert.ok(pauseStart.elbowX < -1.35);

  const returned = computeBarDrinkingPose(5.2);
  assert.equal(returned.liftBlend, 0);
});

test('cabana reclining guest knees and ankles stay strictly above cabanaMattressTopY', () => {
  const cabanaMattressTopY = 0.37;
  const reach = computeArticulatedLegReach({
    rootY: cabanaMattressTopY - 0.78,
    hipRotX: -1.78,
    kneeRotX: 0.58,
  });

  assert.ok(reach.hipWorldY > cabanaMattressTopY);
  assert.ok(reach.kneeWorldY > cabanaMattressTopY + 0.1);
  assert.ok(reach.ankleWorldY >= cabanaMattressTopY);
});

test('fire-pit sofa guest knees clear front edge and feet rest on deckFloorY', () => {
  const deckFloorY = 0.15;
  const sofaSeatTopY = 0.53;
  const reach = computeArticulatedLegReach({
    rootY: sofaSeatTopY - 0.77,
    hipRotX: -1.48,
    kneeRotX: 1.44,
  });

  assert.ok(reach.hipWorldY > sofaSeatTopY);
  assert.ok(reach.kneeForwardZ > 0.4);
  assert.ok(Math.abs(reach.ankleWorldY - deckFloorY) < 0.04);
});

test('barstool patron sits cleanly at stoolTopY with feet resting on brass footrest', () => {
  const stoolTopY = 0.77;
  const footrestY = 0.34;
  const reach = computeArticulatedLegReach({
    rootY: stoolTopY - 0.78,
    hipRotX: -1.28,
    kneeRotX: 1.66,
  });

  assert.ok(reach.hipWorldY > stoolTopY);
  assert.ok(Math.abs(reach.ankleWorldY - footrestY) < 0.05);
});
