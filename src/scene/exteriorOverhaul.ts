import * as THREE from 'three';
import {
  classifyParallaxRoom,
  evaluatePanoramicElevatorCar,
  EXTERIOR_TIERS,
  isWestTowerWalkableLevel14Band,
  isWithinTransferBand,
  PANORAMIC_ELEVATOR_SCHEDULES,
  TRANSFER_BANDS,
  type ElevatorCarState,
} from '../architecture/exteriorCirculation';
import type { ProceduralTextureSet } from './textures';

export interface ExteriorOverhaulResult {
  porticoGroup: THREE.Group;
  exteriorTowersGroup: THREE.Group;
  circulationSpineGroup: THREE.Group;
  update: (elapsedTime: number) => void;
  setVisible: (visible: boolean) => void;
}

const _elevState: ElevatorCarState = {
  y: 0,
  velocityY: 0,
  isDwelling: false,
  nearestStopY: 0,
};

export function createExteriorOverhaul(
  textures: ProceduralTextureSet,
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T,
  trackMat: <T extends THREE.Material>(m: T) => T,
): ExteriorOverhaulResult {
  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  // =========================================================================
  // BESPOKE ARCHITECTURAL PBR MATERIALS (60 FPS SHARED BATCHES)
  // =========================================================================
  const curtainWallGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0b1017,
      metalness: 0.85,
      roughness: 0.12,
      envMapIntensity: 1.75,
      transparent: true,
      opacity: 0.54,
      depthWrite: false,
    }),
  );

  const antiqueBronzeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9a7832,
      metalness: 0.82,
      roughness: 0.28,
      envMapIntensity: 1.4,
    }),
  );

  const portlandStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe6dec8,
      map: textures.portlandAlbedo,
      bumpMap: textures.portlandBump,
      bumpScale: 0.08,
      metalness: 0.08,
      roughness: 0.65,
      envMapIntensity: 0.72,
    }),
  );

  const darkBronzeFrameMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1a1714,
      metalness: 0.84,
      roughness: 0.26,
      envMapIntensity: 1.25,
    }),
  );

  const innerCoreMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x090b10,
      metalness: 0.35,
      roughness: 0.72,
    }),
  );

  const warmLedMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffe2a8,
    }),
  );

  const cofferGlowMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffd796,
    }),
  );

  const parallaxRoomMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
    }),
  );

  const balconyGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x7eb0c2,
      metalness: 0.48,
      roughness: 0.08,
      envMapIntensity: 1.45,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    }),
  );

  const atriumClearGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x111d2d,
      metalness: 0.85,
      roughness: 0.08,
      envMapIntensity: 1.55,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    }),
  );

  const flutedShaftGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8ea4b8,
      metalness: 0.38,
      roughness: 0.2,
      envMapIntensity: 1.2,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
  );

  const lobbyTravertineMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe8dfd1,
      map: textures.portlandAlbedo,
      bumpMap: textures.portlandBump,
      bumpScale: 0.04,
      roughness: 0.36,
      metalness: 0.06,
      envMapIntensity: 0.85,
    }),
  );

  const embankmentStoneMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c574f,
      map: textures.portlandAlbedo,
      bumpMap: textures.portlandBump,
      bumpScale: 0.1,
      roughness: 0.84,
      metalness: 0.04,
    }),
  );

  const cobbleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: textures.cobbleAlbedo,
      bumpMap: textures.cobbleBump,
      bumpScale: 0.14,
      roughness: 0.32,
      metalness: 0.2,
      envMapIntensity: 1.15,
    }),
  );

  const graniteForecourtMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x26282e,
      roughness: 0.42,
      metalness: 0.14,
      envMapIntensity: 0.9,
    }),
  );

  const silhouetteMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x141317,
      roughness: 0.72,
      metalness: 0.12,
    }),
  );

  const foliageMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x254834,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );

  // =========================================================================
  // 1. MONUMENTAL TRIPLE-HEIGHT STREET-LEVEL ARRIVAL (LEVEL 00 · Y = 0..14)
  // =========================================================================
  const porticoGroup = new THREE.Group();
  porticoGroup.name = 'embankmentPortico';

  // Cobblestone Embankment Plaza (stops cleanly behind Z = 22..30 Victoria Embankment roadway)
  const plazaMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(220, 1.1, 34)), cobbleMat);
  plazaMesh.position.set(0, 0.05, 5);
  porticoGroup.add(plazaMesh);

  // Embankment Riverside Promenade Walkway (Z = 30.2..33.4) & River Wall
  const promenadeMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(420, 1.0, 3.4)),
    embankmentStoneMat,
  );
  promenadeMesh.position.set(0, 0.05, 31.8);
  const riverWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(420, 1.4, 1.3)),
    embankmentStoneMat,
  );
  riverWall.position.set(0, -0.05, 33.1);
  const parapetCap = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(420, 0.16, 1.55)),
    portlandStoneMat,
  );
  parapetCap.position.set(0, 0.72, 33.1);
  const railMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(416, 0.05, 0.05)),
    antiqueBronzeMat,
  );
  railMesh.position.set(0, 1.05, 33.1);
  porticoGroup.add(promenadeMesh, riverWall, parapetCap, railMesh);

  // Granite Arrival Forecourt & Drop-off Bay (Z = 9.2..21.5)
  const forecourtMain = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(58, 0.18, 12.2)),
    graniteForecourtMat,
  );
  forecourtMain.position.set(0, 0.64, 15.2);
  const forecourtCenterDrop = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(11.5, 11.8, 0.16, 36, 1, false, -Math.PI * 0.5, Math.PI)),
    graniteForecourtMat,
  );
  forecourtCenterDrop.position.set(0, 0.63, 14.0);
  const forecourtTrim = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(58.4, 0.06, 0.22)),
    antiqueBronzeMat,
  );
  forecourtTrim.position.set(0, 0.73, 21.25);
  porticoGroup.add(forecourtMain, forecourtCenterDrop, forecourtTrim);

  // Security Bollards with warm glowing collars along arrival curb
  const bollardGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.13, 0.92, 12));
  const bollardRingGeo = trackGeo(new THREE.CylinderGeometry(0.116, 0.116, 0.08, 12));
  const bollardXs = [-16.5, -13.0, -9.5, -6.2, 6.2, 9.5, 13.0, 16.5];
  const bollardsInst = new THREE.InstancedMesh(bollardGeo, darkBronzeFrameMat, bollardXs.length);
  const bollardRingsInst = new THREE.InstancedMesh(bollardRingGeo, warmLedMat, bollardXs.length);
  bollardXs.forEach((bx, idx) => {
    dummy.position.set(bx, 1.18, 20.85);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bollardsInst.setMatrixAt(idx, dummy.matrix);

    dummy.position.set(bx, 1.52, 20.85);
    dummy.updateMatrix();
    bollardRingsInst.setMatrixAt(idx, dummy.matrix);
  });
  bollardsInst.instanceMatrix.needsUpdate = true;
  bollardRingsInst.instanceMatrix.needsUpdate = true;
  porticoGroup.add(bollardsInst, bollardRingsInst);

  // Manicured Portland Stone Planters flanking the Arrival Forecourt
  const fPlanterGeo = trackGeo(new THREE.BoxGeometry(3.2, 0.78, 1.65));
  const fTrimGeo = trackGeo(new THREE.BoxGeometry(3.3, 0.08, 1.75));
  const fShrubGeo = trackGeo(new THREE.DodecahedronGeometry(0.68, 0));
  for (const px of [-21.5, -13.2, 13.2, 21.5]) {
    const pBox = new THREE.Mesh(fPlanterGeo, portlandStoneMat);
    pBox.position.set(px, 1.1, 14.6);
    const pTrim = new THREE.Mesh(fTrimGeo, antiqueBronzeMat);
    pTrim.position.set(px, 1.5, 14.6);
    for (const sx of [-0.85, 0, 0.85]) {
      const shrub = new THREE.Mesh(fShrubGeo, foliageMat);
      shrub.position.set(px + sx, 1.85, 14.6);
      shrub.scale.set(1.05, 0.88, 0.95);
      porticoGroup.add(shrub);
    }
    porticoGroup.add(pBox, pTrim);
  }

  // Triple-Height Grand Podium Envelope (Y = 0.7..14.0, uniting West -18 & East +18)
  const lobbyFloor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(56.4, 0.35, 18.4)),
    lobbyTravertineMat,
  );
  lobbyFloor.position.set(0, 0.74, 0);

  const lobbyFloorBorder = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(44, 0.04, 12.6)),
    antiqueBronzeMat,
  );
  lobbyFloorBorder.position.set(0, 0.925, 0.5);

  const podiumCeiling = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(57.2, 0.6, 19.2)),
    darkBronzeFrameMat,
  );
  podiumCeiling.position.set(0, 13.5, 0);

  // Podium Crown Portland Stone Frieze + Antique Bronze Cornice (Y = 13.6..14.2)
  const podiumStoneFrieze = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(57.8, 0.75, 19.8)),
    portlandStoneMat,
  );
  podiumStoneFrieze.position.set(0, 13.85, 0);

  const podiumBronzeCornice = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(58.2, 0.18, 20.2)),
    antiqueBronzeMat,
  );
  podiumBronzeCornice.position.set(0, 14.28, 0);

  const podiumSoffitLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(55.0, 0.06, 0.1)),
    warmLedMat,
  );
  podiumSoffitLed.position.set(0, 13.2, 8.95);

  // Podium Side Walls & Rear Structural Framing (leaving center X = -5.4..+5.4 open at rear to Vertical Circulation Spine)
  const podiumWingBackGeo = trackGeo(new THREE.BoxGeometry(22.2, 12.8, 0.75));
  const podiumBackWest = new THREE.Mesh(podiumWingBackGeo, innerCoreMat);
  podiumBackWest.position.set(-16.8, 7.1, -8.8);
  const podiumBackEast = new THREE.Mesh(podiumWingBackGeo, innerCoreMat);
  podiumBackEast.position.set(16.8, 7.1, -8.8);

  const lobbyWarmWallGeo = trackGeo(new THREE.BoxGeometry(19.5, 9.2, 0.18));
  const lobbyGlowWallMat = trackMat(new THREE.MeshBasicMaterial({ color: 0xe6ad63 }));
  const lobbyBackFeatureL = new THREE.Mesh(lobbyWarmWallGeo, lobbyGlowWallMat);
  lobbyBackFeatureL.position.set(-16.5, 6.0, -8.35);
  const lobbyBackFeatureR = new THREE.Mesh(lobbyWarmWallGeo, lobbyGlowWallMat);
  lobbyBackFeatureR.position.set(16.5, 6.0, -8.35);

  // Side Atrium Glass Walls
  const podiumSideGlassGeo = trackGeo(new THREE.BoxGeometry(0.14, 12.6, 17.8));
  const podiumSideGlassW = new THREE.Mesh(podiumSideGlassGeo, atriumClearGlassMat);
  podiumSideGlassW.position.set(-27.8, 7.1, 0);
  const podiumSideGlassE = new THREE.Mesh(podiumSideGlassGeo, atriumClearGlassMat);
  podiumSideGlassE.position.set(27.8, 7.1, 0);
  podiumSideGlassW.renderOrder = 2;
  podiumSideGlassE.renderOrder = 2;

  // Front Atrium Ultra-Transparent Glazing (X = -27.8..+27.8, Z = +8.5, Y = 0.9..13.5)
  const atriumFrontGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(55.4, 12.5, 0.12)),
    atriumClearGlassMat,
  );
  atriumFrontGlass.position.set(0, 7.15, 8.45);
  atriumFrontGlass.renderOrder = 2;

  porticoGroup.add(
    lobbyFloor,
    lobbyFloorBorder,
    podiumCeiling,
    podiumStoneFrieze,
    podiumBronzeCornice,
    podiumSoffitLed,
    podiumBackWest,
    podiumBackEast,
    lobbyBackFeatureL,
    lobbyBackFeatureR,
    podiumSideGlassW,
    podiumSideGlassE,
    atriumFrontGlass,
  );

  // Monumental 14m Fluted Portland Stone Colonnade Piers + Vertical Warm LED Uplight Strips
  const pierXs = [-27.2, -20.6, -14.0, -7.4, 7.4, 14.0, 20.6, 27.2];
  const porticoPierGeo = trackGeo(new THREE.BoxGeometry(1.25, 13.0, 1.35));
  const pierFluteAccentGeo = trackGeo(new THREE.BoxGeometry(0.18, 13.0, 1.42));
  const pierUplightGeo = trackGeo(new THREE.BoxGeometry(0.08, 12.4, 0.08));

  const porticoPiersInst = new THREE.InstancedMesh(
    porticoPierGeo,
    portlandStoneMat,
    pierXs.length + 4,
  );
  const pierAccentsInst = new THREE.InstancedMesh(
    pierFluteAccentGeo,
    antiqueBronzeMat,
    pierXs.length,
  );
  const pierUplightsInst = new THREE.InstancedMesh(
    pierUplightGeo,
    warmLedMat,
    pierXs.length * 2,
  );

  pierXs.forEach((px, idx) => {
    dummy.position.set(px, 7.1, 9.15);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    porticoPiersInst.setMatrixAt(idx, dummy.matrix);

    pierAccentsInst.setMatrixAt(idx, dummy.matrix);

    // Warm LED uplight strips recessed along left/right flutes of each colonnade pier
    dummy.position.set(px - 0.62, 7.1, 9.75);
    dummy.updateMatrix();
    pierUplightsInst.setMatrixAt(idx * 2, dummy.matrix);

    dummy.position.set(px + 0.62, 7.1, 9.75);
    dummy.updateMatrix();
    pierUplightsInst.setMatrixAt(idx * 2 + 1, dummy.matrix);
  });
  // Side return piers
  const sidePiers: [number, number][] = [
    [-27.8, 3.0],
    [-27.8, -3.5],
    [27.8, 3.0],
    [27.8, -3.5],
  ];
  sidePiers.forEach(([sx, sz], i) => {
    dummy.position.set(sx, 7.1, sz);
    dummy.updateMatrix();
    porticoPiersInst.setMatrixAt(pierXs.length + i, dummy.matrix);
  });
  porticoPiersInst.instanceMatrix.needsUpdate = true;
  pierAccentsInst.instanceMatrix.needsUpdate = true;
  pierUplightsInst.instanceMatrix.needsUpdate = true;
  porticoGroup.add(porticoPiersInst, pierAccentsInst, pierUplightsInst);

  // Atrium Front Mullions between Colonnade Piers
  const atriumMullionGeo = trackGeo(new THREE.BoxGeometry(0.14, 12.5, 0.2));
  for (let mx = -24; mx <= 24; mx += 3.2) {
    if (Math.abs(mx) < 5.6) continue; // keep revolving entrance bay wide open
    const m = new THREE.Mesh(atriumMullionGeo, antiqueBronzeMat);
    m.position.set(mx, 7.15, 8.48);
    porticoGroup.add(m);
  }

  // Cantilevered Porte-Cochere projecting 8m outward (Z = 9.2..17.2) with Glowing Coffered Ceiling
  const porteFrame = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.4, 0.72, 8.0)),
    darkBronzeFrameMat,
  );
  porteFrame.position.set(0, 5.72, 13.2);

  const porteBronzeFascia = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.8, 0.24, 8.2)),
    antiqueBronzeMat,
  );
  porteBronzeFascia.position.set(0, 5.98, 13.2);

  const porteFrontLipLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.4, 0.08, 0.08)),
    warmLedMat,
  );
  porteFrontLipLed.position.set(0, 5.56, 17.24);

  const porteEdgeLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.2, 0.06, 7.7)),
    warmLedMat,
  );
  porteEdgeLed.position.set(0, 5.42, 13.2);

  // Coffered soffit grid under Porte-Cochere
  const cofferPanelGeo = trackGeo(new THREE.PlaneGeometry(3.4, 2.8));
  cofferPanelGeo.rotateX(Math.PI / 2);
  const cofferCountX = 5;
  const cofferCountZ = 2;
  const coffersInst = new THREE.InstancedMesh(
    cofferPanelGeo,
    cofferGlowMat,
    cofferCountX * cofferCountZ,
  );
  let cofIdx = 0;
  for (let cx = 0; cx < cofferCountX; cx++) {
    for (let cz = 0; cz < cofferCountZ; cz++) {
      dummy.position.set(-7.6 + cx * 3.8, 5.34, 11.45 + cz * 3.4);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      coffersInst.setMatrixAt(cofIdx++, dummy.matrix);
    }
  }
  coffersInst.instanceMatrix.needsUpdate = true;

  // Tie-rods supporting cantilevered Porte-Cochere from upper stone piers
  const tieRodGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.06, 8.6, 8));
  for (const tx of [-7.4, 7.4]) {
    const rod = new THREE.Mesh(tieRodGeo, antiqueBronzeMat);
    rod.position.set(tx, 8.4, 12.8);
    rod.rotation.x = 0.72;
    porticoGroup.add(rod);
  }
  porticoGroup.add(porteFrame, porteBronzeFascia, porteFrontLipLed, porteEdgeLed, coffersInst);

  // Twin Brass & Glass Revolving Entry Doors (Z = +8.55, X = -2.6, +2.6)
  const revRingGeo = trackGeo(new THREE.CylinderGeometry(1.72, 1.72, 0.24, 24));
  const revGlassGeo = trackGeo(new THREE.CylinderGeometry(1.62, 1.62, 3.25, 24, 1, true));
  const revFinGeo = trackGeo(new THREE.BoxGeometry(3.1, 3.15, 0.07));
  const revLedRingGeo = trackGeo(new THREE.TorusGeometry(1.66, 0.04, 8, 28));
  revLedRingGeo.rotateX(Math.PI / 2);

  for (const rx of [-2.65, 2.65]) {
    const revGroup = new THREE.Group();
    revGroup.position.set(rx, 0.92, 8.55);
    const canopy = new THREE.Mesh(revRingGeo, antiqueBronzeMat);
    canopy.position.y = 3.35;
    const drumGlass = new THREE.Mesh(revGlassGeo, atriumClearGlassMat);
    drumGlass.position.y = 1.65;
    drumGlass.renderOrder = 3;
    const bladeA = new THREE.Mesh(revFinGeo, antiqueBronzeMat);
    bladeA.position.y = 1.6;
    bladeA.rotation.y = 0.55;
    const bladeB = new THREE.Mesh(revFinGeo, antiqueBronzeMat);
    bladeB.position.y = 1.6;
    bladeB.rotation.y = 0.55 + Math.PI / 2;
    const topLight = new THREE.Mesh(revLedRingGeo, warmLedMat);
    topLight.position.y = 3.2;
    revGroup.add(canopy, drumGlass, bladeA, bladeB, topLight);
    porticoGroup.add(revGroup);
  }

  // Interior Lobby Architecture (Concierge Desk, Stone Columns, 3 Ring Chandeliers, Guests)
  const deskPlinth = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(7.2, 1.08, 1.35)),
    antiqueBronzeMat,
  );
  deskPlinth.position.set(0, 1.46, 1.6);
  const deskMarbleTop = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(7.6, 0.14, 1.55)),
    lobbyTravertineMat,
  );
  deskMarbleTop.position.set(0, 2.04, 1.6);
  const deskLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(7.1, 0.06, 0.08)),
    warmLedMat,
  );
  deskLed.position.set(0, 1.0, 2.3);
  porticoGroup.add(deskPlinth, deskMarbleTop, deskLed);

  // Monumental Interior Portland Stone Columns
  const intColGeo = trackGeo(new THREE.CylinderGeometry(0.55, 0.62, 12.4, 16));
  const intColsInst = new THREE.InstancedMesh(intColGeo, portlandStoneMat, 6);
  const intColCoords: [number, number][] = [
    [-16, 2.6],
    [-8.5, 2.6],
    [8.5, 2.6],
    [16, 2.6],
    [-8.5, -4.4],
    [8.5, -4.4],
  ];
  intColCoords.forEach(([ix, iz], i) => {
    dummy.position.set(ix, 7.1, iz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    intColsInst.setMatrixAt(i, dummy.matrix);
  });
  intColsInst.instanceMatrix.needsUpdate = true;
  porticoGroup.add(intColsInst);

  // 3 Suspended Warm Ring Chandeliers inside Triple-Height Atrium
  const chandOuterGeo = trackGeo(new THREE.TorusGeometry(2.35, 0.11, 10, 36));
  chandOuterGeo.rotateX(Math.PI / 2);
  const chandInnerGeo = trackGeo(new THREE.TorusGeometry(1.45, 0.09, 10, 32));
  chandInnerGeo.rotateX(Math.PI / 2);
  const chandGlowGeo = trackGeo(new THREE.TorusGeometry(2.35, 0.06, 8, 36));
  chandGlowGeo.rotateX(Math.PI / 2);
  const chandRodGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 3.6, 6));

  for (const [cx, cy] of [
    [-12.5, 9.8],
    [0, 10.6],
    [12.5, 9.8],
  ] as const) {
    const chGroup = new THREE.Group();
    chGroup.position.set(cx, cy, 2.8);
    const outerFrame = new THREE.Mesh(chandOuterGeo, antiqueBronzeMat);
    const outerGlow = new THREE.Mesh(chandGlowGeo, warmLedMat);
    outerGlow.position.y = -0.06;
    const innerRing = new THREE.Mesh(chandInnerGeo, warmLedMat);
    innerRing.position.y = -0.65;
    for (let r = 0; r < 3; r++) {
      const ang = (r / 3) * Math.PI * 2;
      const rod = new THREE.Mesh(chandRodGeo, antiqueBronzeMat);
      rod.position.set(Math.cos(ang) * 2.35, 1.8, Math.sin(ang) * 2.35);
      chGroup.add(rod);
    }
    chGroup.add(outerFrame, outerGlow, innerRing);
    porticoGroup.add(chGroup);
  }

  // Arriving / Walking Guest & Concierge Silhouettes (Instanced/Grouped cleanly)
  const figHeadGeo = trackGeo(new THREE.SphereGeometry(0.14, 8, 8));
  const figTorsoGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.22, 0.78, 8));
  const figLegsGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.1, 0.82, 8));
  const guestCoords: [number, number, number][] = [
    [-1.4, 0.92, 11.4],
    [-0.7, 0.92, 11.1],
    [2.6, 0.92, 6.2],
    [-4.8, 0.92, 4.4],
    [0.4, 0.92, 0.7], // concierge behind desk
    [1.6, 0.92, -3.8],
  ];
  guestCoords.forEach(([gx, gy, gz]) => {
    const fig = new THREE.Group();
    fig.position.set(gx, gy, gz);
    const legs = new THREE.Mesh(figLegsGeo, silhouetteMat);
    legs.position.y = 0.41;
    const torso = new THREE.Mesh(figTorsoGeo, silhouetteMat);
    torso.position.y = 1.15;
    const head = new THREE.Mesh(figHeadGeo, silhouetteMat);
    head.position.y = 1.68;
    fig.add(legs, torso, head);
    porticoGroup.add(fig);
  });

  // Heritage Embankment Lanterns along Promenade & Plaza Edge
  const postProfile = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.38, 0.0),
    new THREE.Vector2(0.34, 0.42),
    new THREE.Vector2(0.2, 0.78),
    new THREE.Vector2(0.12, 3.6),
    new THREE.Vector2(0.22, 3.8),
    new THREE.Vector2(0.07, 3.95),
  ];
  const postGeo = trackGeo(new THREE.LatheGeometry(postProfile, 12));
  const lanternGlassGeo = trackGeo(new THREE.CylinderGeometry(0.3, 0.2, 0.62, 8));
  const lanternCapGeo = trackGeo(new THREE.ConeGeometry(0.38, 0.32, 8));
  const lanternPositions: [number, number][] = [
    [-28, 20.5],
    [-12, 20.5],
    [12, 20.5],
    [28, 20.5],
    [-42, 31.6],
    [-18, 31.6],
    [18, 31.6],
    [42, 31.6],
  ];
  lanternPositions.forEach(([lx, lz]) => {
    const lanternGroup = new THREE.Group();
    lanternGroup.position.set(lx, 0, lz);
    const post = new THREE.Mesh(postGeo, darkBronzeFrameMat);
    const bulb = new THREE.Mesh(lanternGlassGeo, warmLedMat);
    bulb.position.y = 4.25;
    const cap = new THREE.Mesh(lanternCapGeo, antiqueBronzeMat);
    cap.position.y = 4.7;
    lanternGroup.add(post, bulb, cap);
    porticoGroup.add(lanternGroup);
  });

  // =========================================================================
  // 2. TRUE 3D TECTONIC DUAL-TOWER FACADES (INSTANCED EXOSKELETON + PARALLAX DEPTH)
  // =========================================================================
  const exteriorTowersGroup = new THREE.Group();
  exteriorTowersGroup.name = 'exteriorTectonicFacades';

  const towerCentersX = [-18, 18] as const;

  const megacolumnMats: THREE.Matrix4[] = [];
  const stoneTrimMats: THREE.Matrix4[] = [];
  const slabMats: THREE.Matrix4[] = [];
  const mullionMats: THREE.Matrix4[] = [];
  const balconyDeckMats: THREE.Matrix4[] = [];
  const balconyGlassMats: THREE.Matrix4[] = [];
  const balconyLedMats: THREE.Matrix4[] = [];
  const louverMats: THREE.Matrix4[] = [];
  const transferLedMats: THREE.Matrix4[] = [];
  const parallaxRoomMats: THREE.Matrix4[] = [];
  const parallaxRoomColors: THREE.Color[] = [];
  const parallaxCeilingMats: THREE.Matrix4[] = [];

  for (let tIdx = 0; tIdx < towerCentersX.length; tIdx++) {
    const cx = towerCentersX[tIdx];
    const towerSubGroup = new THREE.Group();
    towerSubGroup.position.x = cx;

    for (let tierIdx = 0; tierIdx < EXTERIOR_TIERS.length; tierIdx++) {
      const tier = EXTERIOR_TIERS[tierIdx];
      const tierH = tier.yEnd - tier.yStart;
      const tierMidY = (tier.yStart + tier.yEnd) * 0.5;

      // 0.7m Recessed Curtain Wall Glass Envelope + Solid Inner Structural Core
      const glassW = tier.outerWidth - tier.glassInset * 2;
      const glassD = tier.outerDepth - tier.glassInset * 2;
      const coreW = glassW - 3.6;
      const coreD = glassD - 3.6;
      const hwGlass = glassW * 0.5;
      const hdGlass = glassD * 0.5;
      const hwOuter = tier.outerWidth * 0.5;
      const hdOuter = tier.outerDepth * 0.5;

      if (tIdx === 0 && tierIdx === 0) {
        // West Tower Tier 1 keeps Level 14 (Y = 37.55..43.25) transparent & open for walkthrough
        const l14Min = 37.55;
        const l14Max = 43.25;

        const lowH = l14Min - tier.yStart;
        const lowGlass = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(glassW, lowH, glassD)),
          curtainWallGlassMat,
        );
        lowGlass.position.y = tier.yStart + lowH * 0.5;
        lowGlass.renderOrder = 2;
        const lowCore = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(coreW, lowH, coreD)),
          innerCoreMat,
        );
        lowCore.position.y = tier.yStart + lowH * 0.5;

        const winH = l14Max - l14Min;
        const winGlass = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(glassW, winH, glassD)),
          atriumClearGlassMat,
        );
        winGlass.position.y = l14Min + winH * 0.5;
        winGlass.renderOrder = 2;

        const upH = tier.yEnd - l14Max;
        const upGlass = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(glassW, upH, glassD)),
          curtainWallGlassMat,
        );
        upGlass.position.y = l14Max + upH * 0.5;
        upGlass.renderOrder = 2;
        const upCore = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(coreW, upH, coreD)),
          innerCoreMat,
        );
        upCore.position.y = l14Max + upH * 0.5;

        towerSubGroup.add(lowCore, lowGlass, winGlass, upCore, upGlass);
      } else {
        const glassMesh = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(glassW, tierH, glassD)),
          curtainWallGlassMat,
        );
        glassMesh.position.y = tierMidY;
        glassMesh.renderOrder = 2;

        const coreMesh = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(coreW, tierH, coreD)),
          innerCoreMat,
        );
        coreMesh.position.y = tierMidY;

        towerSubGroup.add(coreMesh, glassMesh);
      }

      // Setback Entablature Collar (Portland Stone + Bronze Reveal)
      const setbackStone = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(tier.outerWidth + 0.65, 0.54, tier.outerDepth + 0.65)),
        portlandStoneMat,
      );
      setbackStone.position.y = tier.yEnd;
      const setbackBronze = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(tier.outerWidth + 0.78, 0.16, tier.outerDepth + 0.78)),
        antiqueBronzeMat,
      );
      setbackBronze.position.y = tier.yEnd + 0.32;
      towerSubGroup.add(setbackStone, setbackBronze);

      // Protruding Portland Stone Corner Megacolumns + Spine Piers (prouder than glass by 0.7m+)
      const corners: [number, number][] = [
        [-hwOuter + 0.1, -hdOuter + 0.1],
        [hwOuter - 0.1, -hdOuter + 0.1],
        [-hwOuter + 0.1, hdOuter - 0.1],
        [hwOuter - 0.1, hdOuter - 0.1],
      ];
      for (const [ox, oz] of corners) {
        dummy.position.set(cx + ox, tierMidY, oz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.25, tierH, 1.25);
        dummy.updateMatrix();
        megacolumnMats.push(dummy.matrix.clone());

        // Outer bronze inlay fillet on corner megacolumn
        dummy.position.set(cx + ox + Math.sign(ox) * 0.62, tierMidY, oz + Math.sign(oz) * 0.62);
        dummy.scale.set(0.14, tierH, 0.14);
        dummy.updateMatrix();
        stoneTrimMats.push(dummy.matrix.clone());
      }

      // Central Spine Megacolumns on all 4 faces
      const spineCoords: [number, number, number][] = [
        [0, hdOuter + 0.1, 0],
        [0, -hdOuter - 0.1, 0],
        [hwOuter + 0.1, 0, Math.PI / 2],
        [-hwOuter - 0.1, 0, Math.PI / 2],
      ];
      for (const [sx, sz, rotY] of spineCoords) {
        dummy.position.set(cx + sx, tierMidY, sz);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(1.05, tierH, 0.78);
        dummy.updateMatrix();
        megacolumnMats.push(dummy.matrix.clone());
      }

      // Vertical Bronze Structural Mullions (~3.5m spacing around recessed curtain wall glass)
      const bays = tier.baysPerFace;
      for (let b = 1; b < bays; b++) {
        if (b * 2 === bays) continue; // center already carries spine megacolumn
        const u = -0.5 + b / bays;
        const mx = u * glassW;
        const mz = u * glassD;

        for (const zS of [-1, 1]) {
          dummy.position.set(cx + mx, tierMidY, zS * (hdGlass + 0.08));
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(0.16, tierH, 0.28);
          dummy.updateMatrix();
          mullionMats.push(dummy.matrix.clone());
        }
        for (const xS of [-1, 1]) {
          dummy.position.set(cx + xS * (hwGlass + 0.08), tierMidY, mz);
          dummy.rotation.set(0, Math.PI / 2, 0);
          dummy.scale.set(0.16, tierH, 0.28);
          dummy.updateMatrix();
          mullionMats.push(dummy.matrix.clone());
        }
      }

      // Projecting Bronze Floor Slabs (+0.8m outward from glass), Cantilevered Balconies & Parallax Rooms
      const floorStep = tierH / tier.floorCount;
      const slabW = glassW + tier.slabProjection * 2;
      const slabD = glassD + tier.slabProjection * 2;
      const bayWidth = glassW / bays;
      const bayDepth = glassD / bays;

      for (let fl = 0; fl < tier.floorCount; fl++) {
        const floorY = tier.yStart + fl * floorStep;
        const roomMidY = floorY + floorStep * 0.5;
        const inLvl14Open = isWestTowerWalkableLevel14Band(tIdx, roomMidY);
        const inTransfer = isWithinTransferBand(roomMidY);

        if (!inLvl14Open) {
          dummy.position.set(cx, floorY, 0);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(slabW, 0.24, slabD);
          dummy.updateMatrix();
          slabMats.push(dummy.matrix.clone());
        }

        if (inLvl14Open || inTransfer) continue;

        // Recessed Cantilevered Balconies with Glass Balustrades on alternating floors
        if (fl % 3 === 1) {
          const balW = glassW * 0.42;
          const balD = 1.05;
          for (const zS of [-1, 1]) {
            const xOff = zS > 0 ? -glassW * 0.24 : glassW * 0.24;
            const balZ = zS * (hdGlass + tier.slabProjection + balD * 0.35);

            dummy.position.set(cx + xOff, floorY + 0.02, balZ);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(balW, 0.16, balD);
            dummy.updateMatrix();
            balconyDeckMats.push(dummy.matrix.clone());

            dummy.position.set(cx + xOff, floorY + 0.56, balZ + zS * (balD * 0.46));
            dummy.scale.set(balW, 0.92, 0.06);
            dummy.updateMatrix();
            balconyGlassMats.push(dummy.matrix.clone());

            dummy.position.set(cx + xOff, floorY - 0.08, balZ + zS * 0.2);
            dummy.scale.set(balW * 0.88, 0.05, 0.06);
            dummy.updateMatrix();
            balconyLedMats.push(dummy.matrix.clone());
          }
        }

        // Parallax Interior Window Depth Boxes inside all 4 faces (deeply recessed ~0.9m behind glass)
        const roomH = floorStep * 0.66;
        const roomInsetBehindGlass = 1.48;
        const roomBoxThick = 1.12;

        for (let side = 0; side < 4; side++) {
          for (let b = 0; b < bays; b++) {
            const style = classifyParallaxRoom(tIdx, tierIdx, fl, side, b);
            const u = -0.5 + (b + 0.5) / bays;
            const spanW = (side < 2 ? bayWidth : bayDepth) * 0.7;

            if (side === 0 || side === 1) {
              const zS = side === 0 ? 1 : -1;
              dummy.position.set(
                cx + u * glassW,
                roomMidY - 0.1,
                zS * (hdGlass - roomInsetBehindGlass),
              );
              dummy.rotation.set(0, 0, 0);
              dummy.scale.set(spanW, roomH, roomBoxThick);
            } else {
              const xS = side === 2 ? 1 : -1;
              dummy.position.set(
                cx + xS * (hwGlass - roomInsetBehindGlass),
                roomMidY - 0.1,
                u * glassD,
              );
              dummy.rotation.set(0, Math.PI / 2, 0);
              dummy.scale.set(spanW, roomH, roomBoxThick);
            }
            dummy.updateMatrix();
            parallaxRoomMats.push(dummy.matrix.clone());
            // Attenuate room back-wall brightness so dark reflective glass & ceiling cove strips create 3D depth
            if (style.palette === 'warm-champagne') tempColor.setHex(0xc9964f);
            else if (style.palette === 'warm-amber') tempColor.setHex(0xa86f34);
            else if (style.palette === 'cool-alabaster') tempColor.setHex(0x3a4a5e);
            else tempColor.setHex(0x0a0e15);
            parallaxRoomColors.push(tempColor.clone());

            if (style.isLit) {
              // Glowing ceiling recess line tucked deeply behind glass at top of room
              if (side === 0 || side === 1) {
                const zS = side === 0 ? 1 : -1;
                dummy.position.set(
                  cx + u * glassW,
                  floorY + floorStep - 0.26,
                  zS * (hdGlass - 0.85),
                );
                dummy.rotation.set(0, 0, 0);
                dummy.scale.set(spanW * 0.78, 0.08, 0.52);
              } else {
                const xS = side === 2 ? 1 : -1;
                dummy.position.set(
                  cx + xS * (hwGlass - 0.85),
                  floorY + floorStep - 0.26,
                  u * glassD,
                );
                dummy.rotation.set(0, Math.PI / 2, 0);
                dummy.scale.set(spanW * 0.78, 0.08, 0.52);
              }
              dummy.updateMatrix();
              parallaxCeilingMats.push(dummy.matrix.clone());
            }
          }
        }
      }

      // Double-Height Mechanical Transfer Bands within this tier
      for (const band of TRANSFER_BANDS) {
        if (band.tierIndex !== tierIdx) continue;
        const bandH = band.yTop - band.yBottom;
        const bandMidY = (band.yBottom + band.yTop) * 0.5;

        // Deep recessed mechanical gallery core + warm perimeter grazing LEDs
        const mechCore = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(glassW - 0.2, bandH, glassD - 0.2)),
          darkBronzeFrameMat,
        );
        mechCore.position.y = bandMidY;
        towerSubGroup.add(mechCore);

        // Horizontal warm grazing LED lines on upper & lower louver reveals
        for (const ly of [band.yBottom + 0.14, band.yTop - 0.14]) {
          for (const zS of [-1, 1]) {
            dummy.position.set(cx, ly, zS * (hdGlass + 0.15));
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(glassW - 0.8, 0.08, 0.08);
            dummy.updateMatrix();
            transferLedMats.push(dummy.matrix.clone());
          }
          for (const xS of [-1, 1]) {
            dummy.position.set(cx + xS * (hwGlass + 0.15), ly, 0);
            dummy.rotation.set(0, Math.PI / 2, 0);
            dummy.scale.set(glassD - 0.8, 0.08, 0.08);
            dummy.updateMatrix();
            transferLedMats.push(dummy.matrix.clone());
          }
        }

        // Dense vertical antique-bronze architectural louvers wrapping all 4 faces
        const louverCount = 12;
        for (let lv = 1; lv < louverCount; lv++) {
          const u = -0.5 + lv / louverCount;
          if (Math.abs(u) < 0.06) continue;
          for (const zS of [-1, 1]) {
            dummy.position.set(cx + u * (glassW - 1.2), bandMidY, zS * (hdGlass + 0.08));
            dummy.rotation.set(0, 0, 0);
            dummy.scale.set(0.14, bandH - 0.25, 0.42);
            dummy.updateMatrix();
            louverMats.push(dummy.matrix.clone());
          }
          for (const xS of [-1, 1]) {
            dummy.position.set(cx + xS * (hwGlass + 0.08), bandMidY, u * (glassD - 1.2));
            dummy.rotation.set(0, Math.PI / 2, 0);
            dummy.scale.set(0.14, bandH - 0.25, 0.42);
            dummy.updateMatrix();
            louverMats.push(dummy.matrix.clone());
          }
        }
      }
    }

    exteriorTowersGroup.add(towerSubGroup);
  }

  // Finalize consolidated InstancedMeshes for Twin Tower Tectonic Exoskeleton
  const unitBoxGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
  const buildInstanced = (
    matrices: THREE.Matrix4[],
    mat: THREE.Material,
    colors?: THREE.Color[],
  ) => {
    const count = Math.max(1, matrices.length);
    const inst = new THREE.InstancedMesh(unitBoxGeo, mat, count);
    if (matrices.length === 0) {
      inst.count = 0;
    } else {
      for (let i = 0; i < matrices.length; i++) {
        inst.setMatrixAt(i, matrices[i]);
        if (colors) inst.setColorAt(i, colors[i]);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    if (colors && inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    exteriorTowersGroup.add(inst);
    return inst;
  };

  buildInstanced(megacolumnMats, portlandStoneMat);
  buildInstanced(stoneTrimMats, antiqueBronzeMat);
  buildInstanced(slabMats, antiqueBronzeMat);
  buildInstanced(mullionMats, antiqueBronzeMat);
  buildInstanced(balconyDeckMats, antiqueBronzeMat);
  buildInstanced(balconyGlassMats, balconyGlassMat);
  buildInstanced(balconyLedMats, warmLedMat);
  buildInstanced(louverMats, antiqueBronzeMat);
  buildInstanced(transferLedMats, warmLedMat);
  buildInstanced(parallaxRoomMats, parallaxRoomMat, parallaxRoomColors);
  buildInstanced(parallaxCeilingMats, warmLedMat);

  // =========================================================================
  // 3. VISIBLE VERTICAL CIRCULATION SPINE (0M..CROWN) & 4 ANIMATED ELEVATORS
  // =========================================================================
  const circulationSpineGroup = new THREE.Group();
  circulationSpineGroup.name = 'verticalCirculationSpine';

  const spineHeight = 176;
  const spineCenterZ = -8.2;

  // Glazed Express Core Glass Enclosure & Structural Spine Framing
  const spineGlassShell = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(10.8, spineHeight, 2.7)),
    atriumClearGlassMat,
  );
  spineGlassShell.position.set(0, spineHeight * 0.5 + 0.5, spineCenterZ);
  spineGlassShell.renderOrder = 2;
  circulationSpineGroup.add(spineGlassShell);

  // 4 Full-Height Vertical Bronze Guide-Rail Tracks (X = -3.9, -2.05, +2.05, +3.9)
  const railColumnGeo = trackGeo(new THREE.BoxGeometry(0.14, spineHeight, 0.18));
  for (const sched of PANORAMIC_ELEVATOR_SCHEDULES) {
    for (const rxOff of [-0.76, 0.76]) {
      const railL = new THREE.Mesh(railColumnGeo, antiqueBronzeMat);
      railL.position.set(sched.xOffset + rxOff, spineHeight * 0.5 + 0.5, spineCenterZ + 0.25);
      circulationSpineGroup.add(railL);
    }
  }

  // Horizontal Bronze Cross-Bracing Rings every 4 floors (~12m intervals)
  const braceFrameGeo = trackGeo(new THREE.BoxGeometry(11.1, 0.24, 2.9));
  const braceFloors = Math.floor(spineHeight / 12);
  const crossBracesInst = new THREE.InstancedMesh(
    braceFrameGeo,
    darkBronzeFrameMat,
    braceFloors,
  );
  for (let b = 0; b < braceFloors; b++) {
    dummy.position.set(0, 14 + b * 12, spineCenterZ);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    crossBracesInst.setMatrixAt(b, dummy.matrix);
  }
  crossBracesInst.instanceMatrix.needsUpdate = true;
  crossBracesInst.computeBoundingSphere();
  circulationSpineGroup.add(crossBracesInst);

  // Glazed Sky-Lobby Bridge Walkways tying Spine into Twin Towers at Levels 14, 52, 68
  const skyBridgeWalkGeo = trackGeo(new THREE.BoxGeometry(7.2, 2.9, 2.5));
  const skyBridgeFloorGeo = trackGeo(new THREE.BoxGeometry(7.2, 0.28, 2.65));
  for (const bridgeY of [38.0, 138.0, 170.5]) {
    for (const xSide of [-8.1, 8.1]) {
      const bGlass = new THREE.Mesh(skyBridgeWalkGeo, atriumClearGlassMat);
      bGlass.position.set(xSide, bridgeY + 1.45, spineCenterZ + 0.6);
      bGlass.renderOrder = 2;
      const bDeck = new THREE.Mesh(skyBridgeFloorGeo, antiqueBronzeMat);
      bDeck.position.set(xSide, bridgeY, spineCenterZ + 0.6);
      circulationSpineGroup.add(bGlass, bDeck);
    }
  }

  // Central Semi-Translucent Fluted Glass Stairwell Shaft + Glowing Zigzag Scissor Staircase
  const stairShaftGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.05, spineHeight, 2.35)),
    flutedShaftGlassMat,
  );
  stairShaftGlass.position.set(0, spineHeight * 0.5 + 0.5, spineCenterZ);
  stairShaftGlass.renderOrder = 3;
  circulationSpineGroup.add(stairShaftGlass);

  const stairFlightGeo = trackGeo(new THREE.BoxGeometry(1.55, 0.14, 2.2));
  const stairLedGeo = trackGeo(new THREE.BoxGeometry(1.45, 0.05, 2.05));
  const flightStepH = 3.0;
  const flightCount = Math.floor((spineHeight - 2) / flightStepH);
  const stairFlightsInst = new THREE.InstancedMesh(
    stairFlightGeo,
    darkBronzeFrameMat,
    flightCount,
  );
  const stairLedsInst = new THREE.InstancedMesh(stairLedGeo, warmLedMat, flightCount);
  for (let f = 0; f < flightCount; f++) {
    const sy = 2.0 + f * flightStepH;
    const tilt = f % 2 === 0 ? 0.62 : -0.62;
    dummy.position.set(0, sy + flightStepH * 0.5, spineCenterZ);
    dummy.rotation.set(0, 0, tilt);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    stairFlightsInst.setMatrixAt(f, dummy.matrix);

    dummy.position.set(0, sy + flightStepH * 0.5 - 0.12, spineCenterZ);
    dummy.updateMatrix();
    stairLedsInst.setMatrixAt(f, dummy.matrix);
  }
  stairFlightsInst.instanceMatrix.needsUpdate = true;
  stairLedsInst.instanceMatrix.needsUpdate = true;
  stairFlightsInst.computeBoundingSphere();
  stairLedsInst.computeBoundingSphere();
  circulationSpineGroup.add(stairFlightsInst, stairLedsInst);

  // Stepped Portland Stone & Antique Bronze Crown Headhouse at Summit of Circulation Spine
  const spineCrownStone = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(11.2, 1.35, 3.05)),
    portlandStoneMat,
  );
  spineCrownStone.position.set(0, spineHeight + 0.55, spineCenterZ);
  const spineCrownBronze = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(11.45, 0.28, 3.25)),
    antiqueBronzeMat,
  );
  spineCrownBronze.position.set(0, spineHeight + 1.32, spineCenterZ);
  const spineCrownLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(10.6, 0.09, 2.8)),
    warmLedMat,
  );
  spineCrownLed.position.set(0, spineHeight - 0.14, spineCenterZ);
  circulationSpineGroup.add(spineCrownStone, spineCrownBronze, spineCrownLed);

  // 4 Detailed Glass-and-Bronze Panoramic Elevator Cars (Cached Direct Refs)
  const carGroups: THREE.Group[] = [];
  const carCapGeo = trackGeo(new THREE.BoxGeometry(1.48, 0.24, 1.66));
  const carGlassGeo = trackGeo(new THREE.BoxGeometry(1.36, 2.52, 1.52));
  const carPostGeo = trackGeo(new THREE.BoxGeometry(0.09, 2.74, 0.09));
  const carCeilLedGeo = trackGeo(new THREE.BoxGeometry(1.22, 0.08, 1.36));
  const carBackGlowGeo = trackGeo(new THREE.BoxGeometry(1.12, 2.15, 0.06));
  const carBackGlowMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xffcf85,
      transparent: true,
      opacity: 0.56,
    }),
  );
  const carBeaconGeo = trackGeo(new THREE.BoxGeometry(1.38, 0.11, 0.09));
  const passBodyGeo = trackGeo(new THREE.CylinderGeometry(0.13, 0.16, 1.28, 8));
  const passHeadGeo = trackGeo(new THREE.SphereGeometry(0.11, 8, 8));

  for (const sched of PANORAMIC_ELEVATOR_SCHEDULES) {
    const car = new THREE.Group();
    car.position.set(sched.xOffset, sched.stopsY[0], spineCenterZ + 0.12);

    const floorCap = new THREE.Mesh(carCapGeo, antiqueBronzeMat);
    floorCap.position.y = -1.32;
    const roofCap = new THREE.Mesh(carCapGeo, antiqueBronzeMat);
    roofCap.position.y = 1.32;

    const glassCab = new THREE.Mesh(carGlassGeo, atriumClearGlassMat);
    glassCab.renderOrder = 4;

    const ceilLed = new THREE.Mesh(carCeilLedGeo, warmLedMat);
    ceilLed.position.y = 1.18;

    const backWallGlow = new THREE.Mesh(carBackGlowGeo, carBackGlowMat);
    backWallGlow.position.set(0, 0, -0.58);

    const extIndicatorBar = new THREE.Mesh(carBeaconGeo, warmLedMat);
    extIndicatorBar.position.set(0, -1.32, 0.84);

    const extTopBar = new THREE.Mesh(carBeaconGeo, warmLedMat);
    extTopBar.position.set(0, 1.32, 0.84);

    for (const px of [-0.68, 0.68]) {
      for (const pz of [-0.75, 0.75]) {
        const post = new THREE.Mesh(carPostGeo, antiqueBronzeMat);
        post.position.set(px, 0, pz);
        car.add(post);
      }
    }

    // Subtle passenger silhouettes inside panoramic cab
    for (const pax of [-0.28, 0.24]) {
      const pBody = new THREE.Mesh(passBodyGeo, silhouetteMat);
      pBody.position.set(pax, -0.56, 0.12);
      const pHead = new THREE.Mesh(passHeadGeo, silhouetteMat);
      pHead.position.set(pax, 0.2, 0.12);
      car.add(pBody, pHead);
    }

    car.add(floorCap, roofCap, glassCab, ceilLed, backWallGlow, extIndicatorBar, extTopBar);
    circulationSpineGroup.add(car);
    carGroups.push(car);
  }

  return {
    porticoGroup,
    exteriorTowersGroup,
    circulationSpineGroup,
    update: (elapsedTime: number) => {
      if (!circulationSpineGroup.visible) return;
      for (let i = 0; i < PANORAMIC_ELEVATOR_SCHEDULES.length; i++) {
        const sched = PANORAMIC_ELEVATOR_SCHEDULES[i];
        evaluatePanoramicElevatorCar(sched, elapsedTime, _elevState);
        carGroups[i].position.y = _elevState.y;
      }
    },
    setVisible: (visible: boolean) => {
      porticoGroup.visible = visible;
      exteriorTowersGroup.visible = visible;
      circulationSpineGroup.visible = visible;
    },
  };
}
