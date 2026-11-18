import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRoomBay,
  computeTierUvTransform,
  FACADE_ATLAS_COLS,
  FACADE_ATLAS_ROWS,
} from './facadeAtlas';

test('facade atlas distributes ~35% warm suites, ~35% dim mood rooms, and ~30% dark glass', () => {
  let warm = 0;
  let dim = 0;
  let dark = 0;
  const total = FACADE_ATLAS_COLS * FACADE_ATLAS_ROWS;

  for (let r = 0; r < FACADE_ATLAS_ROWS; r++) {
    for (let c = 0; c < FACADE_ATLAS_COLS; c++) {
      const spec = classifyRoomBay(c, r);
      assert.ok(spec.curtainPullLeft >= 0.09 && spec.curtainPullLeft <= 0.2);
      assert.ok(spec.curtainPullRight >= 0.09 && spec.curtainPullRight <= 0.2);
      if (spec.mood === 'warm-suite') {
        warm++;
        assert.notEqual(spec.silhouette, 'none');
      } else if (spec.mood === 'dim-mood') {
        dim++;
      } else {
        dark++;
        assert.equal(spec.silhouette, 'none');
      }
    }
  }

  const warmPct = warm / total;
  const dimPct = dim / total;
  const darkPct = dark / total;

  assert.ok(warmPct >= 0.26 && warmPct <= 0.44, `Unexpected warm ratio: ${warmPct}`);
  assert.ok(dimPct >= 0.26 && dimPct <= 0.44, `Unexpected dim ratio: ${dimPct}`);
  assert.ok(darkPct >= 0.21 && darkPct <= 0.39, `Unexpected dark ratio: ${darkPct}`);
});

test('computeTierUvTransform aligns full and Level-14-split tiers cleanly to floor steps', () => {
  const floorStep = 52 / 18;
  const full = computeTierUvTransform(10, 62, 10, floorStep);
  assert.ok(Math.abs(full.vStart - 0) < 1e-6);
  assert.ok(Math.abs(full.vEnd - 18 / 16) < 1e-6);

  const lower = computeTierUvTransform(10, 37.58, 10, floorStep);
  const upper = computeTierUvTransform(43.22, 62, 10, floorStep);
  assert.ok(lower.vEnd > lower.vStart);
  assert.ok(upper.vStart > lower.vEnd);
  assert.ok(Math.abs(upper.vEnd - full.vEnd) < 1e-6);
});
