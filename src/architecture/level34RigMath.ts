export interface DrinkingPose {
  liftBlend: number;
  shoulderX: number;
  elbowX: number;
  headPitchX: number;
}

export interface ArticulatedLegReach {
  hipWorldY: number;
  kneeWorldY: number;
  ankleWorldY: number;
  kneeForwardZ: number;
}

export interface PoolBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  wallMargin: number;
}

export const LEVEL34_POOL_BOUNDS: PoolBounds = {
  minX: -7.0,
  maxX: 7.0,
  minZ: 6.1,
  maxZ: 16.5,
  wallMargin: 1.2,
};

export function clampSwimmerPosition(
  x: number,
  z: number,
  bounds: PoolBounds = LEVEL34_POOL_BOUNDS,
): { x: number; z: number } {
  const safeMinX = bounds.minX + bounds.wallMargin;
  const safeMaxX = bounds.maxX - bounds.wallMargin;
  // Also stay strictly south of the submerged entry steps (Z <= 7.64)
  const safeMinZ = Math.max(bounds.minZ + bounds.wallMargin, 8.6);
  const safeMaxZ = bounds.maxZ - bounds.wallMargin;
  return {
    x: Math.min(safeMaxX, Math.max(safeMinX, x)),
    z: Math.min(safeMaxZ, Math.max(safeMinZ, z)),
  };
}

function smoothstep01(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * Computes the bent-elbow bar patron drinking cycle:
 * - 0.0..1.8s: Forearm resting near counter top
 * - 1.8..2.7s: Smooth lift to mouth height
 * - 2.7..4.2s: 1.5s sip pause at mouth height
 * - 4.2..5.2s: Smooth return to counter top
 */
export function computeBarDrinkingPose(elapsedTime: number): DrinkingPose {
  const period = 5.2;
  const phase = ((elapsedTime % period) + period) % period;

  let liftBlend = 0;
  if (phase >= 1.8 && phase < 2.7) {
    liftBlend = smoothstep01((phase - 1.8) / 0.9);
  } else if (phase >= 2.7 && phase < 4.2) {
    liftBlend = 1;
  } else if (phase >= 4.2) {
    liftBlend = 1 - smoothstep01((phase - 4.2) / 1.0);
  }

  return {
    liftBlend,
    shoulderX: -0.42 - liftBlend * 0.38,
    elbowX: -0.92 - liftBlend * 0.56,
    headPitchX: -liftBlend * 0.07,
  };
}

/**
 * Forward kinematics along Y/Z for a two-segment leg (hip -> knee -> ankle)
 * given rootY, hipY offset, hipRotX (negative = forward +Z), kneeRotX (positive = bend down),
 * thighLen, and shinLen.
 */
export function computeArticulatedLegReach(params: {
  rootY: number;
  hipOffsetY?: number;
  hipRotX: number;
  kneeRotX: number;
  thighLen?: number;
  shinLen?: number;
}): ArticulatedLegReach {
  const hipOffsetY = params.hipOffsetY ?? 0.86;
  const thighLen = params.thighLen ?? 0.42;
  const shinLen = params.shinLen ?? 0.4;

  const hipWorldY = params.rootY + hipOffsetY;
  const kneeWorldY = hipWorldY - thighLen * Math.cos(params.hipRotX);
  const kneeForwardZ = -thighLen * Math.sin(params.hipRotX);

  const shinWorldAngle = params.hipRotX + params.kneeRotX;
  const ankleWorldY = kneeWorldY - shinLen * Math.cos(shinWorldAngle);

  return {
    hipWorldY,
    kneeWorldY,
    ankleWorldY,
    kneeForwardZ,
  };
}
