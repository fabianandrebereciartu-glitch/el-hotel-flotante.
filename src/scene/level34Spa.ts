import * as THREE from 'three';
import type { ProceduralTextureSet } from './textures';
import {
  clampSwimmerPosition,
  computeBarDrinkingPose,
} from '../architecture/level34RigMath';

export interface Level34SpaMaterials {
  travertineSlabMat: THREE.MeshStandardMaterial;
  anodizedMullionMat: THREE.MeshStandardMaterial;
  brushedBronzeMat: THREE.MeshStandardMaterial;
  acousticGlassMat: THREE.MeshStandardMaterial;
  clearWeirGlassMat: THREE.MeshStandardMaterial;
  darkBasaltMat: THREE.MeshStandardMaterial;
  slateBasinMat: THREE.MeshStandardMaterial;
  flutedCedarMat: THREE.MeshStandardMaterial;
  gunmetalSteelMat: THREE.MeshStandardMaterial;
  boucleIvoryMat: THREE.MeshStandardMaterial;
  taupeThrowMat: THREE.MeshStandardMaterial;
  teakWoodMat: THREE.MeshStandardMaterial;
  saddleLeatherMat: THREE.MeshStandardMaterial;
  honedTravertineBarMat: THREE.MeshStandardMaterial;
  darkMarbleMat: THREE.MeshStandardMaterial;
  sheerLinenMat: THREE.MeshStandardMaterial;
  backlitOnyxMat: THREE.MeshStandardMaterial;
  darkSmokedDoorMat: THREE.MeshStandardMaterial;
  interiorCeilingMat: THREE.MeshStandardMaterial;
  coveLineMat: THREE.MeshStandardMaterial;
  emberGlowMat: THREE.MeshBasicMaterial;
  coveAmberMat: THREE.MeshBasicMaterial;
  lanternGlassMat: THREE.MeshBasicMaterial;
  trunkMat: THREE.MeshStandardMaterial;
  canopyMat: THREE.MeshStandardMaterial;
  hedgeMat: THREE.MeshStandardMaterial;
}

export interface Level34SpaDeps {
  textures: ProceduralTextureSet;
  sharedMats: Level34SpaMaterials;
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  addFoyerPortal: (
    parent: THREE.Group,
    x: number,
    floorY: number,
    z: number,
    plaqueTex: THREE.CanvasTexture,
  ) => void;
  walkableFloors: THREE.Object3D[];
}

export interface Level34SpaResult {
  group: THREE.Group;
  update: (elapsedTime: number, dt: number) => void;
}

interface HumanRig {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  elbowL: THREE.Group;
  armR: THREE.Group;
  elbowR: THREE.Group;
  handR: THREE.Group;
  legL: THREE.Group;
  kneeL: THREE.Group;
  legR: THREE.Group;
  kneeR: THREE.Group;
}

// Pre-allocated scratch vectors for zero-GC per-frame animation
const _walkPos = new THREE.Vector3();
const _walkNext = new THREE.Vector3();

export function createLevel34SkybridgeSpa({
  textures,
  sharedMats,
  trackGeo,
  trackMat,
  addFoyerPortal,
  walkableFloors,
}: Level34SpaDeps): Level34SpaResult {
  const skybridgeGroup = new THREE.Group();
  skybridgeGroup.name = 'level34Skybridge';
  skybridgeGroup.position.set(0, 90, 0);

  const {
    travertineSlabMat,
    anodizedMullionMat,
    brushedBronzeMat,
    acousticGlassMat,
    clearWeirGlassMat,
    darkBasaltMat,
    slateBasinMat,
    gunmetalSteelMat,
    boucleIvoryMat,
    taupeThrowMat,
    teakWoodMat,
    saddleLeatherMat,
    honedTravertineBarMat,
    darkMarbleMat,
    sheerLinenMat,
    backlitOnyxMat,
    interiorCeilingMat,
    coveLineMat,
    emberGlowMat,
    coveAmberMat,
    lanternGlassMat,
    trunkMat,
  } = sharedMats;

  // === BESPOKE LEVEL 34 MATERIALS (SHARED FOR 60 FPS BATCHING) ===
  // Warm Oiled Teak Wet-Deck (#69452C) using procedural plank albedo + caulked bump
  const oiledTeakDeckMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: textures.teakPlankAlbedo,
      bumpMap: textures.teakPlankBump,
      bumpScale: 0.035,
      roughness: 0.56,
      metalness: 0.04,
      envMapIntensity: 0.16,
    }),
  );

  // Sleek Dark-Bronze Conservatory Mullion & Pergola Timber Materials
  const conservatoryBronzeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#251E17',
      metalness: 0.78,
      roughness: 0.28,
      envMapIntensity: 1.15,
    }),
  );
  const darkPergolaTimberMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#342116',
      bumpMap: textures.smokedOakBump,
      bumpScale: 0.025,
      roughness: 0.62,
      metalness: 0.04,
      envMapIntensity: 0.14,
    }),
  );
  // Crisp anti-reflective conservatory glass so night skyline lights shine clearly through
  const spaConservatoryGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#102032',
      metalness: 0.22,
      roughness: 0.06,
      envMapIntensity: 0.65,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),
  );

  // Warm Aromatic Cedar Sauna Material & Clear Tempered Sauna Glass
  const warmCedarSaunaMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#734224',
      bumpMap: textures.smokedOakBump,
      bumpScale: 0.022,
      roughness: 0.55,
      metalness: 0.04,
      envMapIntensity: 0.22,
    }),
  );
  const saunaGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFE6C4',
      metalness: 0.12,
      roughness: 0.08,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      envMapIntensity: 1.1,
    }),
  );

  // Matte Honed Volcanic Stone for Pool Entry Steps (eliminates harsh white spotlight glare)
  const matteVolcanicStepMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#635B51',
      map: textures.portlandAlbedo,
      bumpMap: textures.portlandBump,
      bumpScale: 0.06,
      roughness: 0.86,
      metalness: 0.02,
      envMapIntensity: 0.05,
    }),
  );

  // Sheer Cabana Linen Curtains (opacity 0.42 per spec)
  const cabanaLinenMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#F4EDE2',
      roughness: 0.92,
      metalness: 0.01,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );

  // Botanical Greenery Materials
  const palmFrondMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#2A5939',
      roughness: 0.68,
      metalness: 0.03,
      side: THREE.DoubleSide,
      envMapIntensity: 0.2,
    }),
  );
  const fernLeafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#356B45',
      roughness: 0.72,
      metalness: 0.02,
      side: THREE.DoubleSide,
      envMapIntensity: 0.16,
    }),
  );
  const oliveLeafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#495E45',
      roughness: 0.84,
      metalness: 0.02,
      envMapIntensity: 0.12,
    }),
  );
  const soilBedMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#1A1410',
      roughness: 0.95,
      metalness: 0.01,
    }),
  );

  // Bubbling Hydrotherapy Foam & Shower Stream Material
  const bubbleFoamMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#D6EFEA',
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  const showerMistMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#CBE7E3',
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    }),
  );

  // Shared Human Figure Materials (Refined Matte Woven Textiles & Natural Skin/Hair)
  const skinWarmMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#B88463',
      roughness: 0.66,
      metalness: 0.01,
      envMapIntensity: 0.14,
    }),
  );
  const skinFairMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#D5A78A',
      roughness: 0.64,
      metalness: 0.01,
      envMapIntensity: 0.14,
    }),
  );
  const skinDeepMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#6E4631',
      roughness: 0.66,
      metalness: 0.01,
      envMapIntensity: 0.14,
    }),
  );
  const robeIvoryMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#EFE8DC',
      bumpMap: textures.boucleBump,
      bumpScale: 0.014,
      roughness: 0.88,
      metalness: 0.01,
      envMapIntensity: 0.1,
    }),
  );
  const linenTaupeClothMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#C2B49F',
      bumpMap: textures.boucleBump,
      bumpScale: 0.014,
      roughness: 0.88,
      metalness: 0.01,
      envMapIntensity: 0.1,
    }),
  );
  const robeSashMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#3D352E',
      bumpMap: textures.boucleBump,
      bumpScale: 0.01,
      roughness: 0.88,
      metalness: 0.02,
      envMapIntensity: 0.08,
    }),
  );
  const swimOliveMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#2B463C',
      roughness: 0.78,
      metalness: 0.02,
      envMapIntensity: 0.12,
    }),
  );
  const swimCharcoalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#24272C',
      roughness: 0.78,
      metalness: 0.02,
      envMapIntensity: 0.12,
    }),
  );
  const staffAttireMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#191B1F',
      bumpMap: textures.boucleBump,
      bumpScale: 0.01,
      roughness: 0.82,
      metalness: 0.04,
      envMapIntensity: 0.12,
    }),
  );
  const sandalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#2A221C',
      roughness: 0.76,
      metalness: 0.04,
    }),
  );
  const hairDarkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#1B1613',
      roughness: 0.84,
      metalness: 0.02,
      envMapIntensity: 0.1,
    }),
  );
  const hairAuburnMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#462C1E',
      roughness: 0.84,
      metalness: 0.02,
      envMapIntensity: 0.1,
    }),
  );

  // =========================================================================
  // 1. EXTERIOR SKYBRIDGE STRUCTURAL SHELL & CONSERVATORY GLAZING
  // =========================================================================
  const bridgeDeck = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(24.5, 1.05, 14.5)),
    anodizedMullionMat,
  );
  bridgeDeck.position.set(0, -4.65, 0.5);

  const bridgeDeckTrav = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(23.6, 0.2, 13.8)),
    travertineSlabMat,
  );
  bridgeDeckTrav.position.set(0, -4.1, 0.5);

  const bridgeSoffitGeo = trackGeo(new THREE.PlaneGeometry(21.0, 9.2));
  bridgeSoffitGeo.rotateX(Math.PI / 2);
  const bridgeSoffitMat = trackMat(new THREE.MeshBasicMaterial({ color: '#9E773C' }));
  const bridgeSoffit = new THREE.Mesh(bridgeSoffitGeo, bridgeSoffitMat);
  bridgeSoffit.position.set(0, -5.2, 0.5);

  const bridgeRoof = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(24.5, 1.0, 14.5)),
    anodizedMullionMat,
  );
  bridgeRoof.position.set(0, 4.9, 0.5);

  const fasciaBeamGeo = trackGeo(new THREE.BoxGeometry(24.8, 0.36, 14.8));
  const lowerFascia = new THREE.Mesh(fasciaBeamGeo, anodizedMullionMat);
  lowerFascia.position.set(0, -4.1, 0.5);
  const upperFascia = new THREE.Mesh(fasciaBeamGeo, anodizedMullionMat);
  upperFascia.position.set(0, 4.5, 0.5);

  const fasciaTrimGeo = trackGeo(new THREE.BoxGeometry(24.9, 0.08, 14.9));
  const lowerTrim = new THREE.Mesh(fasciaTrimGeo, brushedBronzeMat);
  lowerTrim.position.set(0, -4.04, 0.5);
  const upperTrim = new THREE.Mesh(fasciaTrimGeo, brushedBronzeMat);
  upperTrim.position.set(0, 4.7, 0.5);

  skybridgeGroup.add(
    bridgeDeck,
    bridgeDeckTrav,
    bridgeSoffit,
    bridgeRoof,
    lowerFascia,
    upperFascia,
    lowerTrim,
    upperTrim,
  );

  // Double-height Skybridge Glazed Conservatory Walls (central 5.6m pool portal unobstructed)
  const bridgeNorthGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(22.2, 8.4, 0.1)),
    spaConservatoryGlassMat,
  );
  bridgeNorthGlass.position.set(0, 0.2, -5.9);
  const bridgeSideGlassGeo = trackGeo(new THREE.BoxGeometry(0.1, 8.4, 12.8));
  const bridgeWestGlass = new THREE.Mesh(bridgeSideGlassGeo, spaConservatoryGlassMat);
  bridgeWestGlass.position.set(-11.1, 0.2, 0.5);
  const bridgeEastGlass = new THREE.Mesh(bridgeSideGlassGeo, spaConservatoryGlassMat);
  bridgeEastGlass.position.set(11.1, 0.2, 0.5);

  const bridgeSouthWingGlassGeo = trackGeo(new THREE.BoxGeometry(8.3, 8.4, 0.1));
  const bridgeSouthGlassL = new THREE.Mesh(bridgeSouthWingGlassGeo, spaConservatoryGlassMat);
  bridgeSouthGlassL.position.set(-6.95, 0.2, 6.85);
  const bridgeSouthGlassR = new THREE.Mesh(bridgeSouthWingGlassGeo, spaConservatoryGlassMat);
  bridgeSouthGlassR.position.set(6.95, 0.2, 6.85);

  const bridgeSouthTransom = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.6, 3.25, 0.1)),
    spaConservatoryGlassMat,
  );
  bridgeSouthTransom.position.set(0, 2.78, 6.85);
  const bridgePortalLintel = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.78, 0.16, 0.24)),
    brushedBronzeMat,
  );
  bridgePortalLintel.position.set(0, 1.15, 6.85);

  for (const gm of [
    bridgeNorthGlass,
    bridgeWestGlass,
    bridgeEastGlass,
    bridgeSouthGlassL,
    bridgeSouthGlassR,
    bridgeSouthTransom,
  ]) {
    gm.renderOrder = 3;
  }
  skybridgeGroup.add(
    bridgeNorthGlass,
    bridgeWestGlass,
    bridgeEastGlass,
    bridgeSouthGlassL,
    bridgeSouthGlassR,
    bridgeSouthTransom,
    bridgePortalLintel,
  );

  // Sleek Dark-Bronze Conservatory Mullions (Replaces harsh X scaffolding bars completely)
  const vMullionGeo = trackGeo(new THREE.BoxGeometry(0.11, 7.8, 0.18));
  const hTransomSouthWingGeo = trackGeo(new THREE.BoxGeometry(8.3, 0.09, 0.16));
  const hTransomSideGeo = trackGeo(new THREE.BoxGeometry(0.16, 0.09, 11.4));

  for (const mx of [-10.7, -8.35, -5.85, -2.85, 2.85, 5.85, 8.35, 10.7]) {
    const mS = new THREE.Mesh(vMullionGeo, conservatoryBronzeMat);
    mS.position.set(mx, 0.0, 6.85);
    skybridgeGroup.add(mS);
  }
  for (const mz of [-4.2, -1.6, 1.0, 3.6, 6.2]) {
    const mW = new THREE.Mesh(vMullionGeo, conservatoryBronzeMat);
    mW.rotation.y = Math.PI / 2;
    mW.position.set(-10.85, 0.0, mz);
    const mE = new THREE.Mesh(vMullionGeo, conservatoryBronzeMat);
    mE.rotation.y = Math.PI / 2;
    mE.position.set(10.85, 0.0, mz);
    skybridgeGroup.add(mW, mE);
  }
  // Crisp horizontal conservatory transoms framing city lights cleanly
  for (const ty of [-0.55, 2.2]) {
    const tL = new THREE.Mesh(hTransomSouthWingGeo, conservatoryBronzeMat);
    tL.position.set(-6.95, ty, 6.85);
    const tR = new THREE.Mesh(hTransomSouthWingGeo, conservatoryBronzeMat);
    tR.position.set(6.95, ty, 6.85);
    const tW = new THREE.Mesh(hTransomSideGeo, conservatoryBronzeMat);
    tW.position.set(-10.85, ty, 1.0);
    const tE = new THREE.Mesh(hTransomSideGeo, conservatoryBronzeMat);
    tE.position.set(10.85, ty, 1.0);
    skybridgeGroup.add(tL, tR, tW, tE);
  }

  // Sheer Acoustic Linen Curtains tucked organically along outer conservatory corners
  const spaCurtainFoldGeo = trackGeo(new THREE.CylinderGeometry(0.13, 0.15, 7.35, 10, 1, true));
  for (const cx of [-9.95, -3.25, 3.25, 9.95]) {
    for (let p = 0; p < 3; p++) {
      const cFold = new THREE.Mesh(spaCurtainFoldGeo, sheerLinenMat);
      cFold.position.set(cx + (p - 1) * 0.16, -0.15, 6.48 + (p % 2) * 0.08);
      cFold.scale.set(0.85, 1, 1.3);
      cFold.renderOrder = 4;
      skybridgeGroup.add(cFold);
    }
  }

  // Underslung Structural Steel Haunches (strictly BELOW the deck at y = -8.4..-12.6)
  const underTrussGeo = trackGeo(new THREE.BoxGeometry(0.58, 12.2, 0.58));
  const crossTieGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.32, 11.6));
  const gussetPlateGeo = trackGeo(new THREE.BoxGeometry(1.1, 1.1, 0.72));
  for (const zPos of [-5.2, 6.2]) {
    const haunchWest = new THREE.Mesh(underTrussGeo, gunmetalSteelMat);
    haunchWest.position.set(-7.9, -8.4, zPos);
    haunchWest.rotation.z = -0.78;
    const haunchEast = new THREE.Mesh(underTrussGeo, gunmetalSteelMat);
    haunchEast.position.set(7.9, -8.4, zPos);
    haunchEast.rotation.z = 0.78;

    const lowerChordWest = new THREE.Mesh(underTrussGeo, gunmetalSteelMat);
    lowerChordWest.position.set(-8.9, -11.2, zPos);
    lowerChordWest.rotation.z = -1.12;
    const lowerChordEast = new THREE.Mesh(underTrussGeo, gunmetalSteelMat);
    lowerChordEast.position.set(8.9, -11.2, zPos);
    lowerChordEast.rotation.z = 1.12;

    const gussetW = new THREE.Mesh(gussetPlateGeo, brushedBronzeMat);
    gussetW.position.set(-10.8, -12.6, zPos);
    const gussetE = new THREE.Mesh(gussetPlateGeo, brushedBronzeMat);
    gussetE.position.set(10.8, -12.6, zPos);

    skybridgeGroup.add(haunchWest, haunchEast, lowerChordWest, lowerChordEast, gussetW, gussetE);
  }
  for (const tx of [-7.5, -3.5, 3.5, 7.5]) {
    const tie = new THREE.Mesh(crossTieGeo, gunmetalSteelMat);
    tie.position.set(tx, -7.8, 0.5);
    skybridgeGroup.add(tie);
  }

  // =========================================================================
  // 2. HEATED BASALT FLOOR, WARM OILED TEAK WET-DECK & PERGOLA CANOPY
  // =========================================================================
  // Honed Charcoal Basalt Base Floor (local top = -3.86 => world Y = 86.14)
  const spaFloor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(21.6, 0.24, 11.7)),
    darkBasaltMat,
  );
  spaFloor.position.set(0, -3.98, 0.25);
  spaFloor.userData.walkableRoomId = 'lvl-34';
  skybridgeGroup.add(spaFloor);
  walkableFloors.push(spaFloor);

  // Warm Oiled Teak Wet-Deck Islands & Poolside Promenade Apron (offset +0.025 on Y, zero Z-fighting)
  const addTeakDeckPad = (x: number, z: number, w: number, d: number) => {
    const deck = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(w, 0.03, d)),
      oiledTeakDeckMat,
    );
    deck.position.set(x, -3.848, z);
    const trim = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(w + 0.08, 0.02, d + 0.08)),
      brushedBronzeMat,
    );
    trim.position.set(x, -3.854, z);
    skybridgeGroup.add(trim, deck);
  };
  // South Poolside Wet-Deck Apron flanking central stone walkway
  addTeakDeckPad(-6.55, 4.45, 7.2, 2.85);
  addTeakDeckPad(6.55, 4.45, 7.2, 2.85);
  // West Tea Bar & Lounge Teak Deck Island
  addTeakDeckPad(-7.35, -1.15, 5.6, 5.2);
  // East Cabana & Sauna Sanctuary Teak Deck Island
  addTeakDeckPad(6.6, -0.5, 6.8, 6.5);

  // Overhead Dark-Timber Slatted Pergola Canopy + Warm Recessed Light Strips (#FFB86C)
  const spaCeiling = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(21.6, 0.35, 12.2)),
    interiorCeilingMat,
  );
  spaCeiling.position.set(0, 3.92, 0.5);
  skybridgeGroup.add(spaCeiling);

  // Longitudinal dark timber pergola girders
  const girderGeo = trackGeo(new THREE.BoxGeometry(20.6, 0.22, 0.2));
  for (const gz of [-3.6, -0.8, 2.0, 4.8]) {
    const girder = new THREE.Mesh(girderGeo, darkPergolaTimberMat);
    girder.position.set(0, 3.62, gz);
    skybridgeGroup.add(girder);
  }
  // Cross timber pergola slats (InstancedMesh)
  const pergolaSlatGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.14, 10.2));
  const pergolaSlatCount = 28;
  const pergolaSlatsInst = new THREE.InstancedMesh(
    pergolaSlatGeo,
    darkPergolaTimberMat,
    pergolaSlatCount,
  );
  const pDummy = new THREE.Object3D();
  for (let i = 0; i < pergolaSlatCount; i++) {
    pDummy.position.set(-9.75 + i * 0.72, 3.48, 0.75);
    pDummy.updateMatrix();
    pergolaSlatsInst.setMatrixAt(i, pDummy.matrix);
  }
  pergolaSlatsInst.instanceMatrix.needsUpdate = true;
  skybridgeGroup.add(pergolaSlatsInst);

  // Warm Emissive Cove Strips tucked softly into pergola bays & floor perimeter
  const pergolaLightGeo = trackGeo(new THREE.BoxGeometry(20.2, 0.04, 0.09));
  for (const lz of [-2.2, 0.6, 3.4]) {
    const strip = new THREE.Mesh(pergolaLightGeo, coveLineMat);
    strip.position.set(0, 3.71, lz);
    skybridgeGroup.add(strip);
  }
  const spaCoveHorizGeo = trackGeo(new THREE.BoxGeometry(20.2, 0.05, 0.1));
  const spaCoveSideGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.05, 10.6));
  const spaFloorCoveB = new THREE.Mesh(spaCoveHorizGeo, coveAmberMat);
  spaFloorCoveB.position.set(0, -3.835, -4.16);
  const spaFloorCoveL = new THREE.Mesh(spaCoveSideGeo, coveAmberMat);
  spaFloorCoveL.position.set(-10.35, -3.835, 0.7);
  const spaFloorCoveR = new THREE.Mesh(spaCoveSideGeo, coveAmberMat);
  spaFloorCoveR.position.set(10.35, -3.835, 0.7);
  skybridgeGroup.add(spaFloorCoveB, spaFloorCoveL, spaFloorCoveR);

  // Honed Portland-Stone Rear Wall + Private Spa Foyer Portal + Slatted Walnut Wings + Sconces
  const spaBackWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(20.6, 7.6, 0.5)),
    honedTravertineBarMat,
  );
  spaBackWall.position.set(0, -0.1, -4.5);
  skybridgeGroup.add(spaBackWall);
  addFoyerPortal(skybridgeGroup, 0, -3.86, -4.16, textures.plaqueLvl34);

  const walnutBackGeo = trackGeo(new THREE.BoxGeometry(7.3, 4.4, 0.08));
  const walnutBackL = new THREE.Mesh(walnutBackGeo, interiorCeilingMat);
  walnutBackL.position.set(-5.85, -1.66, -4.22);
  const walnutBackR = new THREE.Mesh(walnutBackGeo, interiorCeilingMat);
  walnutBackR.position.set(5.85, -1.66, -4.22);
  skybridgeGroup.add(walnutBackL, walnutBackR);

  const walnutSlatGeo = trackGeo(new THREE.BoxGeometry(0.08, 4.3, 0.09));
  const slatsPerWing = 24;
  const walnutSlatsInst = new THREE.InstancedMesh(walnutSlatGeo, teakWoodMat, slatsPerWing * 2);
  let wsIdx = 0;
  for (const wingStart of [-9.35, 2.35]) {
    for (let i = 0; i < slatsPerWing; i++) {
      pDummy.position.set(wingStart + i * 0.3, -1.66, -4.16);
      pDummy.updateMatrix();
      walnutSlatsInst.setMatrixAt(wsIdx++, pDummy.matrix);
    }
  }
  walnutSlatsInst.instanceMatrix.needsUpdate = true;
  skybridgeGroup.add(walnutSlatsInst);

  const wingCoveGeo = trackGeo(new THREE.BoxGeometry(7.1, 0.07, 0.09));
  for (const wx of [-5.85, 5.85]) {
    const topCove = new THREE.Mesh(wingCoveGeo, coveAmberMat);
    topCove.position.set(wx, 0.56, -4.14);
    skybridgeGroup.add(topCove);
  }
  const sconceBackGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.56, 0.06));
  const sconceGlowGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.44, 10));
  for (const sx of [-8.6, -4.9, 4.9, 8.6]) {
    const sPlate = new THREE.Mesh(sconceBackGeo, brushedBronzeMat);
    sPlate.position.set(sx, -1.55, -4.1);
    const sTube = new THREE.Mesh(sconceGlowGeo, coveAmberMat);
    sTube.position.set(sx, -1.55, -4.05);
    skybridgeGroup.add(sPlate, sTube);
  }

  // Slender Fluted Gunmetal-Bronze Structural Columns
  const colShaftGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 7.45, 14));
  const colCollarGeo = trackGeo(new THREE.CylinderGeometry(0.175, 0.175, 0.15, 14));
  const colCoords: [number, number][] = [];
  for (const sx of [-7.8, -2.85, 2.85, 7.8]) {
    colCoords.push([sx, 5.85], [sx, -3.85]);
  }
  const colShaftsInst = new THREE.InstancedMesh(colShaftGeo, gunmetalSteelMat, colCoords.length);
  const colCollarsInst = new THREE.InstancedMesh(colCollarGeo, brushedBronzeMat, colCoords.length * 2);
  let collarIdx = 0;
  colCoords.forEach(([sx, sz], cIdx) => {
    pDummy.position.set(sx, -0.08, sz);
    pDummy.updateMatrix();
    colShaftsInst.setMatrixAt(cIdx, pDummy.matrix);

    pDummy.position.set(sx, -3.77, sz);
    pDummy.updateMatrix();
    colCollarsInst.setMatrixAt(collarIdx++, pDummy.matrix);

    pDummy.position.set(sx, 3.63, sz);
    pDummy.updateMatrix();
    colCollarsInst.setMatrixAt(collarIdx++, pDummy.matrix);
  });
  colShaftsInst.instanceMatrix.needsUpdate = true;
  colCollarsInst.instanceMatrix.needsUpdate = true;
  skybridgeGroup.add(colShaftsInst, colCollarsInst);

  // =========================================================================
  // 3. CANTILEVERED INFINITY POOL (GLARE-FREE VOLCANIC TEAL + AMBER RIM)
  // =========================================================================
  const spaWingRailGeo = trackGeo(new THREE.BoxGeometry(4.8, 1.05, 0.08));
  const spaBalustradeL = new THREE.Mesh(spaWingRailGeo, clearWeirGlassMat);
  spaBalustradeL.position.set(-5.25, -3.35, 6.05);
  spaBalustradeL.renderOrder = 4;
  const spaBalustradeR = new THREE.Mesh(spaWingRailGeo, clearWeirGlassMat);
  spaBalustradeR.position.set(5.25, -3.35, 6.05);
  spaBalustradeR.renderOrder = 4;
  const railPostGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 1.08, 10));
  for (const px of [-7.6, -2.85, 2.85, 7.6]) {
    const rPost = new THREE.Mesh(railPostGeo, brushedBronzeMat);
    rPost.position.set(px, -3.34, 6.05);
    skybridgeGroup.add(rPost);
  }
  skybridgeGroup.add(spaBalustradeL, spaBalustradeR);

  // Natural Matte Stone Walk-in Threshold + 3 Submerged Steps + Grab Rails
  const thresholdStone = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(5.6, 0.04, 0.85)),
    matteVolcanicStepMat,
  );
  thresholdStone.position.set(0, -3.845, 5.7);
  const thresholdReveal = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.75, 0.03, 0.06)),
    coveLineMat,
  );
  thresholdReveal.position.set(0, -3.83, 6.09);
  skybridgeGroup.add(thresholdStone, thresholdReveal);

  const poolStepGeo = trackGeo(new THREE.BoxGeometry(4.8, 0.16, 0.56));
  const poolStep1 = new THREE.Mesh(poolStepGeo, matteVolcanicStepMat);
  poolStep1.position.set(0, -3.96, 6.32);
  const poolStep2 = new THREE.Mesh(poolStepGeo, matteVolcanicStepMat);
  poolStep2.position.set(0, -4.16, 6.84);
  const poolStep3 = new THREE.Mesh(poolStepGeo, matteVolcanicStepMat);
  poolStep3.position.set(0, -4.36, 7.36);
  const poolStepLed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(4.6, 0.04, 0.05)),
    coveAmberMat,
  );
  poolStepLed.position.set(0, -4.05, 6.59);
  skybridgeGroup.add(poolStep1, poolStep2, poolStep3, poolStepLed);

  const grabPostGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.92, 10));
  for (const gx of [-2.25, 2.25]) {
    const postTop = new THREE.Mesh(grabPostGeo, brushedBronzeMat);
    postTop.position.set(gx, -3.4, 5.98);
    const postBot = new THREE.Mesh(grabPostGeo, brushedBronzeMat);
    postBot.position.set(gx, -3.88, 7.45);
    const grabCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(gx, -2.96, 5.88),
      new THREE.Vector3(gx, -2.96, 6.2),
      new THREE.Vector3(gx, -3.44, 7.45),
      new THREE.Vector3(gx, -3.56, 7.52),
    ]);
    const grabRail = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(grabCurve, 18, 0.028, 8, false)),
      brushedBronzeMat,
    );
    skybridgeGroup.add(postTop, postBot, grabRail);
  }

  // Pool Basin Structure, Coping & Amber Underwater Rim Strip
  const poolBase = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(15.6, 0.92, 11.2)),
    gunmetalSteelMat,
  );
  poolBase.position.set(0, -5.06, 11.0);
  const poolTrim = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(16.0, 0.18, 11.5)),
    brushedBronzeMat,
  );
  poolTrim.position.set(0, -4.56, 11.0);

  const poolSlateFloorGeo = trackGeo(new THREE.PlaneGeometry(14.0, 10.4));
  poolSlateFloorGeo.rotateX(-Math.PI / 2);
  const poolSlateFloor = new THREE.Mesh(poolSlateFloorGeo, slateBasinMat);
  poolSlateFloor.position.set(0, -4.55, 11.3);

  // Delicate Glowing Amber Underwater Rim Strip tracing pool perimeter
  const rimN = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(13.8, 0.04, 0.06)), coveAmberMat);
  rimN.position.set(0, -4.22, 6.22);
  const rimS = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(13.8, 0.04, 0.06)), coveAmberMat);
  rimS.position.set(0, -4.22, 16.36);
  const rimW = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.04, 10.1)), coveAmberMat);
  rimW.position.set(-6.92, -4.22, 11.3);
  const rimE = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.06, 0.04, 10.1)), coveAmberMat);
  rimE.position.set(6.92, -4.22, 11.3);

  const weirGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(14.8, 0.68, 0.18)),
    clearWeirGlassMat,
  );
  weirGlass.position.set(0, -4.24, 16.55);
  weirGlass.renderOrder = 4;

  const poolSideGeo = trackGeo(new THREE.BoxGeometry(0.6, 0.72, 10.6));
  const poolSideL = new THREE.Mesh(poolSideGeo, matteVolcanicStepMat);
  poolSideL.position.set(-7.35, -4.22, 11.2);
  const poolSideR = new THREE.Mesh(poolSideGeo, matteVolcanicStepMat);
  poolSideR.position.set(7.35, -4.22, 11.2);
  skybridgeGroup.add(
    poolBase,
    poolTrim,
    poolSlateFloor,
    rimN,
    rimS,
    rimW,
    rimE,
    weirGlass,
    poolSideL,
    poolSideR,
  );

  // Subtle Underwater Fiber-Optic Nodes
  const fiberOpticNodes: THREE.Mesh[] = [];
  const fiberGeo = trackGeo(new THREE.CircleGeometry(0.22, 14));
  fiberGeo.rotateX(-Math.PI / 2);
  for (const fx of [-4.6, 0, 4.6]) {
    for (const fz of [9.0, 13.4]) {
      const node = new THREE.Mesh(fiberGeo, coveAmberMat);
      node.position.set(fx, -4.53, fz);
      skybridgeGroup.add(node);
      fiberOpticNodes.push(node);
    }
  }

  // Deep Volcanic Teal Pool Surface (#114B42, roughness 0.30, zero white glare hotspot)
  const waterSurfaceY = -3.98;
  const thermalWaterGeo = trackGeo(new THREE.PlaneGeometry(14.0, 10.4, 24, 18));
  thermalWaterGeo.rotateX(-Math.PI / 2);
  const waterBasePos = new Float32Array(
    (thermalWaterGeo.attributes.position as THREE.BufferAttribute).array as Float32Array,
  );
  const poolWaterMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#114B42',
      roughness: 0.3,
      metalness: 0.02,
      envMapIntensity: 0.04,
      transparent: true,
      opacity: 0.84,
    }),
  );
  const thermalWater = new THREE.Mesh(thermalWaterGeo, poolWaterMat);
  thermalWater.position.set(0, waterSurfaceY, 11.3);
  thermalWater.renderOrder = 3;
  skybridgeGroup.add(thermalWater);

  // Expanding concentric swimmer water ripple rings
  const swimmerRippleRings: THREE.Mesh[] = [];
  const swimmerRippleMats: THREE.MeshBasicMaterial[] = [];
  const swimmerRippleGeo = trackGeo(new THREE.RingGeometry(0.32, 0.39, 28));
  swimmerRippleGeo.rotateX(-Math.PI / 2);
  for (let r = 0; r < 3; r++) {
    const rMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: '#BCE5DF',
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    const rMesh = new THREE.Mesh(swimmerRippleGeo, rMat);
    rMesh.position.set(0, waterSurfaceY + 0.015, 11.2);
    rMesh.renderOrder = 4;
    skybridgeGroup.add(rMesh);
    swimmerRippleRings.push(rMesh);
    swimmerRippleMats.push(rMat);
  }

  // Soft Low-Hovering Thermal Steam Wisps (over Main Pool & Vitality Whirlpool)
  const steamCount = 96;
  const steamPositions = new Float32Array(steamCount * 3);
  const steamSeeds = new Float32Array(steamCount * 3);
  for (let i = 0; i < steamCount; i++) {
    const rx = ((Math.sin(i * 19.3) * 43758.5) % 1 + 1) % 1;
    const rz = ((Math.sin(i * 41.7) * 24634.6) % 1 + 1) % 1;
    const ry = ((Math.sin(i * 73.1) * 19384.2) % 1 + 1) % 1;

    if (i < 76) {
      steamPositions[i * 3] = (rx - 0.5) * 12.6;
      steamPositions[i * 3 + 1] = -3.92 + ry * 2.6;
      steamPositions[i * 3 + 2] = 6.7 + rz * 9.0;
    } else {
      // Whirlpool mist wisps above (-6.1, 3.85)
      const ang = rx * Math.PI * 2;
      const rad = rz * 1.05;
      steamPositions[i * 3] = -6.1 + Math.cos(ang) * rad;
      steamPositions[i * 3 + 1] = -3.32 + ry * 1.65;
      steamPositions[i * 3 + 2] = 3.85 + Math.sin(ang) * rad;
    }

    steamSeeds[i * 3] = rx;
    steamSeeds[i * 3 + 1] = ry;
    steamSeeds[i * 3 + 2] = rz;
  }

  const steamGeo = trackGeo(new THREE.BufferGeometry());
  steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
  const steamMat = trackMat(
    new THREE.PointsMaterial({
      map: textures.steamSprite,
      color: '#DCEAE7',
      size: 3.1,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  const steamPoints = new THREE.Points(steamGeo, steamMat);
  steamPoints.renderOrder = 5;
  skybridgeGroup.add(steamPoints);

  // =========================================================================
  // 4. ZONE 1 · VITALITY WHIRLPOOL & 2 BRUSHED-BRASS RAINFALL SHOWERS
  // =========================================================================
  const whirlpoolGroup = new THREE.Group();
  whirlpoolGroup.position.set(-6.1, -3.835, 3.85);

  const wpPlinth = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.72, 1.78, 0.14, 44)),
    matteVolcanicStepMat,
  );
  wpPlinth.position.y = 0.07;

  const wpLedToe = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(1.74, 0.025, 8, 48)),
    coveAmberMat,
  );
  wpLedToe.rotation.x = Math.PI / 2;
  wpLedToe.position.y = 0.03;

  // Sculpted Cylindrical Stone Rim & Recessed Slate Basin (high radial count for silky curve)
  const wpWall = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.52, 1.56, 0.44, 44, 1, true)),
    honedTravertineBarMat,
  );
  wpWall.position.y = 0.34;
  const wpInnerWall = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.26, 1.26, 0.42, 40, 1, true)),
    slateBasinMat,
  );
  wpInnerWall.material = trackMat(slateBasinMat.clone());
  wpInnerWall.material.side = THREE.BackSide;
  wpInnerWall.position.y = 0.34;

  const wpCopingRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(1.39, 0.135, 16, 48)),
    honedTravertineBarMat,
  );
  wpCopingRing.rotation.x = Math.PI / 2;
  wpCopingRing.scale.set(1, 1, 0.45);
  wpCopingRing.position.y = 0.56;

  const wpBenchRing = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.74, 1.24, 36)),
    matteVolcanicStepMat,
  );
  wpBenchRing.rotation.x = -Math.PI / 2;
  wpBenchRing.position.y = 0.24;

  const wpWater = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(1.26, 44)),
    poolWaterMat,
  );
  wpWater.rotation.x = -Math.PI / 2;
  wpWater.position.y = 0.46;
  wpWater.renderOrder = 3;

  // Animated Hydrotherapy Bubble Rings
  const wpBubbleRings: THREE.Mesh[] = [];
  for (let b = 0; b < 3; b++) {
    const bRing = new THREE.Mesh(
      trackGeo(new THREE.RingGeometry(0.18 + b * 0.26, 0.23 + b * 0.26, 24)),
      bubbleFoamMat,
    );
    bRing.rotation.x = -Math.PI / 2;
    bRing.position.y = 0.475;
    bRing.renderOrder = 4;
    whirlpoolGroup.add(bRing);
    wpBubbleRings.push(bRing);
  }

  // Entry Step on North-East Edge of Whirlpool
  const wpEntryStep = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.92, 0.26, 0.44)),
    matteVolcanicStepMat,
  );
  wpEntryStep.position.set(1.05, 0.13, -1.25);
  wpEntryStep.rotation.y = -0.68;

  whirlpoolGroup.add(wpPlinth, wpLedToe, wpWall, wpInnerWall, wpCopingRing, wpBenchRing, wpWater, wpEntryStep);
  skybridgeGroup.add(whirlpoolGroup);

  // 2 Sculpted Brushed-Brass Poolside Rainfall Shower Arches
  const showerDrainGeo = trackGeo(new THREE.CylinderGeometry(0.46, 0.48, 0.04, 20));
  const showerArchCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.04, 0),
    new THREE.Vector3(0, 1.82, 0),
    new THREE.Vector3(0, 2.24, 0.16),
    new THREE.Vector3(0, 2.34, 0.42),
    new THREE.Vector3(0, 2.18, 0.56),
  ]);
  const showerArchGeo = trackGeo(new THREE.TubeGeometry(showerArchCurve, 22, 0.028, 10, false));
  const showerHeadGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.24, 0.045, 18));
  const showerDialGeo = trackGeo(new THREE.CylinderGeometry(0.048, 0.048, 0.04, 12));
  showerDialGeo.rotateX(Math.PI / 2);
  const showerMistGeo = trackGeo(new THREE.CylinderGeometry(0.16, 0.26, 1.95, 12, 1, true));

  const showerStreams: THREE.Mesh[] = [];
  for (const [sx, sz, ry] of [
    [-3.72, 4.78, 0.22],
    [-8.48, 4.78, -0.35],
  ] as const) {
    const shGroup = new THREE.Group();
    shGroup.position.set(sx, -3.835, sz);
    shGroup.rotation.y = ry;

    const drainPad = new THREE.Mesh(showerDrainGeo, teakWoodMat);
    drainPad.position.set(0, 0.02, 0.42);
    const arch = new THREE.Mesh(showerArchGeo, brushedBronzeMat);
    const head = new THREE.Mesh(showerHeadGeo, brushedBronzeMat);
    head.position.set(0, 2.16, 0.56);
    const dial = new THREE.Mesh(showerDialGeo, brushedBronzeMat);
    dial.position.set(0, 1.08, 0.04);
    const mist = new THREE.Mesh(showerMistGeo, showerMistMat);
    mist.position.set(0, 1.15, 0.56);
    mist.renderOrder = 4;

    shGroup.add(drainPad, arch, head, dial, mist);
    skybridgeGroup.add(shGroup);
    showerStreams.push(mist);
  }

  // =========================================================================
  // 5. ZONE 2 · 2 DRAPED LINEN CABANAS & CIRCULAR SUNKEN FIRE-BOWL LOUNGE
  // =========================================================================
  // Zone 2A: Circular Sunken Fire-Bowl Sofa Lounge at (0.0, 1.0)
  const fireLoungeGroup = new THREE.Group();
  fireLoungeGroup.position.set(0.0, -3.86, 1.0);

  const pitOuterRim = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.86, 1.92, 0.14, 32)),
    matteVolcanicStepMat,
  );
  pitOuterRim.position.y = 0.07;
  const pitTeakInlay = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(1.74, 1.74, 0.15, 32)),
    oiledTeakDeckMat,
  );
  pitTeakInlay.position.y = 0.075;
  const pitGlowRim = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(1.89, 0.02, 6, 32)),
    coveAmberMat,
  );
  pitGlowRim.rotation.x = Math.PI / 2;
  pitGlowRim.position.y = 0.025;
  fireLoungeGroup.add(pitOuterRim, pitTeakInlay, pitGlowRim);

  // Seamless Curved Crescent Banquette Cushion & Backrest (beveled ExtrudeGeometry, zero Lego facets)
  const makeArcExtrusion = (innerR: number, outerR: number, spanRad: number, depth: number) => {
    const startA = -spanRad * 0.5;
    const endA = spanRad * 0.5;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerR, startA, endA, false);
    shape.absarc(0, 0, innerR, endA, startA, true);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.032,
      bevelSegments: 3,
      curveSegments: 26,
    });
    geo.rotateX(Math.PI / 2);
    return trackGeo(geo);
  };

  const fireBanquetteMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#D5CEC2',
      bumpMap: textures.boucleBump,
      bumpScale: 0.016,
      roughness: 0.92,
      metalness: 0.01,
      envMapIntensity: 0.08,
    }),
  );

  const banqSeatArcGeo = makeArcExtrusion(0.88, 1.48, 1.58, 0.34);
  const banqBackArcGeo = makeArcExtrusion(1.34, 1.54, 1.58, 0.24);
  const banqPillowGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.24, 0.11));

  const sofaSeatTopY = 0.53;
  for (const arcOffset of [0, Math.PI]) {
    const seatArc = new THREE.Mesh(banqSeatArcGeo, fireBanquetteMat);
    seatArc.position.y = sofaSeatTopY - 0.035; // bevelThickness = 0.035 => top strictly at 0.53
    seatArc.rotation.y = arcOffset;

    const backArc = new THREE.Mesh(banqBackArcGeo, fireBanquetteMat);
    backArc.position.y = 0.69;
    backArc.rotation.y = arcOffset;
    fireLoungeGroup.add(seatArc, backArc);

    for (let i = 0; i < 3; i++) {
      const a = arcOffset - 0.44 + i * 0.44;
      const p = new THREE.Mesh(banqPillowGeo, i === 1 ? saddleLeatherMat : taupeThrowMat);
      p.position.set(Math.cos(a) * 1.24, 0.61, Math.sin(a) * 1.24);
      p.rotation.y = -a + Math.PI / 2;
      p.rotation.x = -0.22;
      fireLoungeGroup.add(p);
    }
  }

  // Central Monolithic Basalt & Bronze Fire Bowl (strictly separated layers: zero Z-fighting)
  // 1. darkStoneBowl: top at y = 0.39
  const darkStoneBowl = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.48, 0.34, 0.24, 28)),
    gunmetalSteelMat,
  );
  darkStoneBowl.position.y = 0.27;
  const fireBowlRim = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.47, 0.045, 10, 32)),
    brushedBronzeMat,
  );
  fireBowlRim.rotation.x = Math.PI / 2;
  fireBowlRim.position.y = 0.41;

  // 2. lavaRockPebbleBed (+0.04 above stone bowl top => top at y = 0.43)
  const lavaRockPebbleBed = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.41, 0.39, 0.04, 24)),
    matteVolcanicStepMat,
  );
  lavaRockPebbleBed.position.y = 0.41;

  const pebbleGeo = trackGeo(new THREE.DodecahedronGeometry(0.048, 1));
  for (let p = 0; p < 10; p++) {
    const ang = (p / 10) * Math.PI * 2 + 0.2;
    const rad = 0.18 + (p % 3) * 0.075;
    const pebble = new THREE.Mesh(pebbleGeo, gunmetalSteelMat);
    pebble.scale.set(1.2, 0.55, 0.95);
    pebble.position.set(Math.cos(ang) * rad, 0.438, Math.sin(ang) * rad);
    pebble.rotation.y = ang;
    fireLoungeGroup.add(pebble);
  }

  // 3. glowingEmberDisc (+0.03 above lava bed top => y = 0.46)
  const glowingEmberMat = trackMat(new THREE.MeshBasicMaterial({ color: '#FF8533' }));
  const glowingEmberDisc = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.33, 24)),
    glowingEmberMat,
  );
  glowingEmberDisc.rotation.x = -Math.PI / 2;
  glowingEmberDisc.position.y = 0.46;
  fireLoungeGroup.add(darkStoneBowl, fireBowlRim, lavaRockPebbleBed, glowingEmberDisc);

  // 4. Smooth Tapered Translucent Flame Cones (above ember disc, renderOrder 3)
  const spaFlameOuterMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FF7A28',
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }),
  );
  const spaFlameInnerMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FFD580',
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    }),
  );
  const spaFlameTongues: THREE.Mesh[] = [];
  const spaFlameGeo = trackGeo(new THREE.ConeGeometry(0.068, 0.34, 12));
  for (let f = 0; f < 8; f++) {
    const ang = (f / 8) * Math.PI * 2;
    const rad = (f % 2) * 0.13 + 0.05;
    const flame = new THREE.Mesh(spaFlameGeo, f % 2 === 0 ? spaFlameOuterMat : spaFlameInnerMat);
    flame.position.set(Math.cos(ang) * rad, 0.64, Math.sin(ang) * rad);
    flame.renderOrder = 3;
    fireLoungeGroup.add(flame);
    spaFlameTongues.push(flame);
  }
  skybridgeGroup.add(fireLoungeGroup);

  // Zone 2B: 2 Draped Sheer-Linen Architectural Teak Cabanas (Center-East)
  const cabPostGeo = trackGeo(new THREE.BoxGeometry(0.11, 2.38, 0.11));
  const cabBeamXGeo = trackGeo(new THREE.BoxGeometry(2.42, 0.1, 0.11));
  const cabBeamZGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.1, 2.18));
  const cabLouverGeo = trackGeo(new THREE.BoxGeometry(2.26, 0.04, 0.08));
  const cabDrapeGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.18, 2.26, 10, 1, true));
  const cabPlatformGeo = trackGeo(new THREE.BoxGeometry(2.14, 0.16, 1.92));
  const cabMattressGeo = trackGeo(new THREE.BoxGeometry(1.94, 0.18, 1.72));
  const cabBolsterGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 1.72, 12));
  cabBolsterGeo.rotateZ(Math.PI / 2);
  const cabThrowGeo = trackGeo(new THREE.BoxGeometry(1.96, 0.05, 0.54));
  const towelRollGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.4, 10));
  towelRollGeo.rotateZ(Math.PI / 2);

  const cabanaMattressTopY = 0.37; // mattress center 0.28 + half-height 0.09
  const cabGroups: THREE.Group[] = [];
  for (const [cx, cz, yaw] of [
    [4.65, -1.6, 0],
    [4.65, 2.7, -0.18],
  ] as const) {
    const cab = new THREE.Group();
    cab.position.set(cx, -3.835, cz);
    cab.rotation.y = yaw;

    // 4 Oiled Teak Pavilion Posts & Perimeter Canopy Frame
    for (const px of [-1.14, 1.14]) {
      for (const pz of [-1.02, 1.02]) {
        const post = new THREE.Mesh(cabPostGeo, teakWoodMat);
        post.position.set(px, 1.19, pz);
        cab.add(post);

        // Corner-gathered sheer ivory linen drapes (opacity 0.42)
        for (let d = 0; d < 2; d++) {
          const drape = new THREE.Mesh(cabDrapeGeo, cabanaLinenMat);
          drape.position.set(
            px - Math.sign(px) * (0.09 + d * 0.12),
            1.15,
            pz - Math.sign(pz) * (0.09 + (1 - d) * 0.1),
          );
          drape.renderOrder = 4;
          cab.add(drape);
        }
      }
    }

    for (const pz of [-1.02, 1.02]) {
      const bx = new THREE.Mesh(cabBeamXGeo, teakWoodMat);
      bx.position.set(0, 2.34, pz);
      cab.add(bx);
    }
    for (const px of [-1.14, 1.14]) {
      const bz = new THREE.Mesh(cabBeamZGeo, teakWoodMat);
      bz.position.set(px, 2.34, 0);
      cab.add(bz);
    }
    for (let l = 0; l < 6; l++) {
      const lv = new THREE.Mesh(cabLouverGeo, darkPergolaTimberMat);
      lv.position.set(0, 2.34, -0.75 + l * 0.3);
      cab.add(lv);
    }

    // Double Daybed Cushion Platform, Bolsters, Throw & Rolled Towels
    const platform = new THREE.Mesh(cabPlatformGeo, teakWoodMat);
    platform.position.set(0, 0.12, -0.05);
    const mattress = new THREE.Mesh(cabMattressGeo, boucleIvoryMat);
    mattress.position.set(0, 0.28, -0.05);
    const bolster = new THREE.Mesh(cabBolsterGeo, boucleIvoryMat);
    bolster.position.set(0, 0.44, -0.72);
    const throwBlanket = new THREE.Mesh(cabThrowGeo, taupeThrowMat);
    throwBlanket.position.set(0, 0.38, 0.45);
    cab.add(platform, mattress, bolster, throwBlanket);

    // Rolled Egyptian cotton towels & glowing bronze table lantern
    const tL = new THREE.Mesh(towelRollGeo, boucleIvoryMat);
    tL.position.set(-0.52, 0.44, 0.48);
    const tR = new THREE.Mesh(towelRollGeo, boucleIvoryMat);
    tR.position.set(-0.52, 0.44, 0.34);
    const tTop = new THREE.Mesh(towelRollGeo, boucleIvoryMat);
    tTop.position.set(-0.52, 0.54, 0.41);

    const sideTbl = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 16)),
      brushedBronzeMat,
    );
    sideTbl.position.set(0.84, 0.21, 0.72);
    const lanCore = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.035, 0.04, 0.12, 10)),
      coveAmberMat,
    );
    lanCore.position.set(0.84, 0.5, 0.72);
    const lanGlass = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 12)),
      lanternGlassMat,
    );
    lanGlass.position.set(0.84, 0.52, 0.72);
    cab.add(tL, tR, tTop, sideTbl, lanCore, lanGlass);

    skybridgeGroup.add(cab);
    cabGroups.push(cab);
  }

  // =========================================================================
  // 6. ZONE 3 · CURVED TEA & CHAMPAGNE SPA BAR (LEFT WING)
  // =========================================================================
  const barGroup = new THREE.Group();
  barGroup.position.set(-8.65, -3.835, -1.25);

  // Curved Travertine & Fluted-Walnut Counter (arc facing East toward Spa Lounge)
  const barSegBaseGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.96, 0.56));
  const barSegSlatGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.9, 0.1));
  const barSegTopGeo = trackGeo(new THREE.BoxGeometry(0.94, 0.09, 0.64));
  const barSegTrimGeo = trackGeo(new THREE.BoxGeometry(0.96, 0.035, 0.66));

  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    const ang = -0.68 + u * 1.36;
    const rad = 1.62;
    const bx = Math.cos(ang) * rad;
    const bz = Math.sin(ang) * rad;

    const segBase = new THREE.Mesh(barSegBaseGeo, honedTravertineBarMat);
    segBase.position.set(bx, 0.48, bz);
    segBase.rotation.y = -ang;

    const segFlute = new THREE.Mesh(barSegSlatGeo, darkPergolaTimberMat);
    segFlute.position.set(Math.cos(ang) * (rad + 0.39), 0.46, Math.sin(ang) * (rad + 0.39));
    segFlute.rotation.y = -ang;

    const segTop = new THREE.Mesh(barSegTopGeo, honedTravertineBarMat);
    segTop.position.set(bx, 1.0, bz);
    segTop.rotation.y = -ang;

    const segTrim = new THREE.Mesh(barSegTrimGeo, brushedBronzeMat);
    segTrim.position.set(bx, 0.955, bz);
    segTrim.rotation.y = -ang;

    barGroup.add(segBase, segFlute, segTop, segTrim);
  }

  // Backlit Warm-Amber Onyx Bar Shelving & Bottles/Glassware against West Side
  const spaBarBack = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.14, 2.75, 2.9)),
    backlitOnyxMat,
  );
  spaBarBack.position.set(-1.12, 1.45, 0);
  const spaBarFrame = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.46, 2.82, 3.02)),
    darkPergolaTimberMat,
  );
  spaBarFrame.position.set(-1.26, 1.45, 0);
  barGroup.add(spaBarFrame, spaBarBack);

  const spaShelfGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.045, 2.74));
  for (const sy of [1.05, 1.72, 2.38]) {
    const shelf = new THREE.Mesh(spaShelfGeo, brushedBronzeMat);
    shelf.position.set(-0.92, sy, 0);
    barGroup.add(shelf);
  }

  const fluteGeo = trackGeo(new THREE.CylinderGeometry(0.036, 0.024, 0.18, 10));
  const bottleGeo = trackGeo(new THREE.CylinderGeometry(0.044, 0.056, 0.3, 10));
  for (let gz = -1.1; gz <= 1.1; gz += 0.36) {
    const fl = new THREE.Mesh(fluteGeo, clearWeirGlassMat);
    fl.position.set(-0.9, 1.16, gz);
    const bt = new THREE.Mesh(bottleGeo, lanternGlassMat);
    bt.position.set(-0.9, 1.89, gz);
    const flTop = new THREE.Mesh(fluteGeo, clearWeirGlassMat);
    flTop.position.set(-0.9, 2.49, gz);
    barGroup.add(fl, bt, flTop);
  }

  // Crafted Brushed Brass Gooseneck Taps & Artisanal Teapot + Porcelain Cup Tray on Counter
  const tapSpoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.24, 0),
    new THREE.Vector3(0.06, 0.3, 0),
    new THREE.Vector3(0.11, 0.23, 0),
  ]);
  const tapGooseneckGeo = trackGeo(new THREE.TubeGeometry(tapSpoutCurve, 12, 0.015, 8, false));
  const tapBaseGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.036, 0.04, 10));
  for (const tz of [-0.26, 0.04]) {
    const tBase = new THREE.Mesh(tapBaseGeo, brushedBronzeMat);
    tBase.position.set(1.56, 1.06, tz);
    const tNeck = new THREE.Mesh(tapGooseneckGeo, brushedBronzeMat);
    tNeck.position.set(1.56, 1.08, tz);
    barGroup.add(tBase, tNeck);
  }

  // Wooden Tea Tray + Cast-Iron Teapot (with curved brass spout, handle & lid finial) + 2 Cups
  const teaTray = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.42, 0.024, 0.56)),
    teakWoodMat,
  );
  teaTray.position.set(1.48, 1.055, 0.54);
  const teaPotBody = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.095, 16, 12)),
    gunmetalSteelMat,
  );
  teaPotBody.scale.set(1, 0.72, 1);
  teaPotBody.position.set(1.48, 1.13, 0.48);
  const teaPotFinial = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.018, 0.022, 0.03, 10)),
    brushedBronzeMat,
  );
  teaPotFinial.position.set(1.48, 1.205, 0.48);
  const teaPotSpout = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.012, 0.022, 0.1, 8)),
    brushedBronzeMat,
  );
  teaPotSpout.position.set(1.57, 1.15, 0.48);
  teaPotSpout.rotation.z = -0.85;
  const teaPotHandle = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.095, 0.01, 6, 14, Math.PI)),
    brushedBronzeMat,
  );
  teaPotHandle.position.set(1.48, 1.17, 0.48);
  const cupGeo = trackGeo(new THREE.CylinderGeometry(0.034, 0.024, 0.052, 12));
  const cup1 = new THREE.Mesh(cupGeo, boucleIvoryMat);
  cup1.position.set(1.42, 1.09, 0.68);
  const cup2 = new THREE.Mesh(cupGeo, boucleIvoryMat);
  cup2.position.set(1.54, 1.09, 0.71);
  barGroup.add(teaTray, teaPotBody, teaPotFinial, teaPotSpout, teaPotHandle, cup1, cup2);

  // Stacked Spa Towels on Back Counter Credenza
  for (let t = 0; t < 3; t++) {
    const st = new THREE.Mesh(towelRollGeo, boucleIvoryMat);
    st.position.set(-0.9, 0.42 + t * 0.12, -1.05);
    barGroup.add(st);
  }

  // 3 Minimalist Brass & Saddle-Leather Barstools along Front Arc (with Brass Footrest Ring)
  const bsFootGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.2, 0.035, 16));
  const bsStemGeo = trackGeo(new THREE.CylinderGeometry(0.028, 0.034, 0.68, 12));
  const bsFootrestGeo = trackGeo(new THREE.TorusGeometry(0.17, 0.015, 8, 20));
  bsFootrestGeo.rotateX(Math.PI / 2);
  const bsSeatGeo = trackGeo(new THREE.CylinderGeometry(0.22, 0.2, 0.1, 18));
  const bsBackGeo = trackGeo(new THREE.BoxGeometry(0.065, 0.14, 0.32));
  const stoolTopY = 0.77;

  for (const a of [-0.52, 0.0, 0.52]) {
    const sx = Math.cos(a) * 2.38;
    const sz = Math.sin(a) * 2.38;
    const stool = new THREE.Group();
    stool.position.set(sx, 0, sz);
    stool.rotation.y = -a;

    const foot = new THREE.Mesh(bsFootGeo, brushedBronzeMat);
    foot.position.y = 0.02;
    const stem = new THREE.Mesh(bsStemGeo, brushedBronzeMat);
    stem.position.y = 0.36;
    const footrest = new THREE.Mesh(bsFootrestGeo, brushedBronzeMat);
    footrest.position.y = 0.34;
    const seat = new THREE.Mesh(bsSeatGeo, saddleLeatherMat);
    seat.position.y = 0.72;
    const back = new THREE.Mesh(bsBackGeo, saddleLeatherMat);
    back.position.set(0.17, 0.82, 0);
    stool.add(foot, stem, footrest, seat, back);
    barGroup.add(stool);
  }
  skybridgeGroup.add(barGroup);

  // =========================================================================
  // 7. ZONE 4 · GLASS-WALLED CEDAR SAUNA PAVILION (RIGHT WING)
  // =========================================================================
  const saunaGroup = new THREE.Group();
  saunaGroup.position.set(8.85, -3.835, -0.7);

  // Cedar Slatted Floor Pad, Back/Side Walls & Glowing Warm Interior Cove
  const saunaFloorPad = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.75, 0.04, 5.2)),
    warmCedarSaunaMat,
  );
  saunaFloorPad.position.set(0, 0.02, 0);

  const saunaBackWall = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.16, 2.85, 5.2)),
    warmCedarSaunaMat,
  );
  saunaBackWall.position.set(1.3, 1.425, 0);
  const saunaSideN = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.75, 2.85, 0.16)),
    warmCedarSaunaMat,
  );
  saunaSideN.position.set(0, 1.425, -2.52);
  const saunaSideS = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.75, 2.85, 0.16)),
    warmCedarSaunaMat,
  );
  saunaSideS.position.set(0, 1.425, 2.52);
  const saunaRoof = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.85, 0.16, 5.3)),
    darkPergolaTimberMat,
  );
  saunaRoof.position.set(0, 2.88, 0);

  // Glowing Warm Amber Interior Sauna Batten Strips (radiates rich golden spa sanctuary light)
  const saunaGlowStripGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.08, 4.75));
  const saunaGlowTop = new THREE.Mesh(saunaGlowStripGeo, coveAmberMat);
  saunaGlowTop.position.set(1.16, 2.45, 0);
  const saunaGlowBench = new THREE.Mesh(saunaGlowStripGeo, coveAmberMat);
  saunaGlowBench.position.set(0.32, 0.88, 0);
  const saunaGlowLow = new THREE.Mesh(saunaGlowStripGeo, coveAmberMat);
  saunaGlowLow.position.set(-0.22, 0.42, 0);

  // 2-Tiered Cedar Sauna Benches inside
  const upperBench = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.88, 0.11, 4.7)),
    warmCedarSaunaMat,
  );
  upperBench.position.set(0.76, 0.96, 0);
  const lowerBench = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.68, 0.11, 3.8)),
    warmCedarSaunaMat,
  );
  lowerBench.position.set(0.14, 0.48, 0.35);

  // Volcanic Sauna Stone Heater Stove + Wooden Bucket & Ladle
  const saunaStoveBody = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.3, 0.32, 0.72, 16)),
    gunmetalSteelMat,
  );
  saunaStoveBody.position.set(-0.58, 0.38, -1.78);
  const saunaCoals = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.24, 12, 8)),
    emberGlowMat,
  );
  saunaCoals.scale.set(1, 0.48, 1);
  saunaCoals.position.set(-0.58, 0.76, -1.78);
  const saunaBucket = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.11, 0.22, 12)),
    teakWoodMat,
  );
  saunaBucket.position.set(0.55, 1.12, 1.45);

  // Bronze-Framed Floor-to-Ceiling Clear Glass Front Wall & Door + Teak Handle
  const saunaGlassFixed = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.06, 2.75, 3.85)),
    saunaGlassMat,
  );
  saunaGlassFixed.position.set(-1.35, 1.42, -0.6);
  saunaGlassFixed.renderOrder = 4;

  const saunaGlassDoor = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.06, 2.65, 1.08)),
    saunaGlassMat,
  );
  saunaGlassDoor.position.set(-1.44, 1.38, 1.92);
  saunaGlassDoor.rotation.y = 0.22; // Welcoming slightly-ajar sauna glass door
  saunaGlassDoor.renderOrder = 4;

  const saunaDoorHandle = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8)),
    teakWoodMat,
  );
  saunaDoorHandle.position.set(-1.54, 1.25, 1.56);

  const saunaMullGeo = trackGeo(new THREE.BoxGeometry(0.09, 2.85, 0.09));
  for (const sz of [-2.52, -0.95, 0.65, 1.35, 2.52]) {
    const sm = new THREE.Mesh(saunaMullGeo, conservatoryBronzeMat);
    sm.position.set(-1.35, 1.425, sz);
    saunaGroup.add(sm);
  }
  const saunaHeader = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.11, 0.12, 5.15)),
    conservatoryBronzeMat,
  );
  saunaHeader.position.set(-1.35, 2.82, 0);

  saunaGroup.add(
    saunaFloorPad,
    saunaBackWall,
    saunaSideN,
    saunaSideS,
    saunaRoof,
    saunaGlowTop,
    saunaGlowBench,
    saunaGlowLow,
    upperBench,
    lowerBench,
    saunaStoveBody,
    saunaCoals,
    saunaBucket,
    saunaGlassFixed,
    saunaGlassDoor,
    saunaDoorHandle,
    saunaHeader,
  );
  skybridgeGroup.add(saunaGroup);

  // =========================================================================
  // 8. LUSH BOTANICAL GREENERY (PALMS, OLIVE TREES, FERNS & SOIL UPLIGHTS)
  // =========================================================================
  const potOuterGeo = trackGeo(new THREE.CylinderGeometry(0.46, 0.38, 0.56, 16));
  const potRimGeo = trackGeo(new THREE.TorusGeometry(0.45, 0.032, 6, 18));
  potRimGeo.rotateX(Math.PI / 2);
  const potSoilGeo = trackGeo(new THREE.CylinderGeometry(0.41, 0.41, 0.05, 14));
  const potUplightGeo = trackGeo(new THREE.RingGeometry(0.28, 0.34, 16));
  potUplightGeo.rotateX(-Math.PI / 2);

  // Gracefully Arching Segmented Palm Fronds (natural tropical curve, no stiff straight rectangles)
  const frondSeg1Geo = trackGeo(new THREE.BoxGeometry(0.19, 0.016, 0.48));
  const frondSeg2Geo = trackGeo(new THREE.BoxGeometry(0.16, 0.015, 0.48));
  const frondSeg3Geo = trackGeo(new THREE.BoxGeometry(0.11, 0.013, 0.44));
  const frondSeg4Geo = trackGeo(new THREE.BoxGeometry(0.06, 0.01, 0.36));
  const fernBladeGeo = trackGeo(new THREE.BoxGeometry(0.075, 0.012, 0.36));

  const addPalmPlanter = (x: number, z: number, scale = 1.0, seed = 0) => {
    const g = new THREE.Group();
    g.position.set(x, -3.845, z);

    const pot = new THREE.Mesh(potOuterGeo, honedTravertineBarMat);
    pot.position.y = 0.28;
    const rim = new THREE.Mesh(potRimGeo, brushedBronzeMat);
    rim.position.y = 0.56;
    const soil = new THREE.Mesh(potSoilGeo, soilBedMat);
    soil.position.y = 0.52;
    const upGlow = new THREE.Mesh(potUplightGeo, coveAmberMat);
    upGlow.position.y = 0.55;
    g.add(pot, rim, soil, upGlow);

    // Dual curving palm stems
    const stems: [number, number, number][] = [
      [0, 0, 2.2 * scale],
      [0.12, -0.08, 1.6 * scale],
    ];
    stems.forEach(([ox, oz, h], sIdx) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ox, 0.5, oz),
        new THREE.Vector3(ox + Math.cos(seed + sIdx) * 0.14, 0.5 + h * 0.5, oz + 0.08),
        new THREE.Vector3(ox + Math.cos(seed + sIdx) * 0.24, 0.5 + h, oz + 0.14),
      ]);
      const stem = new THREE.Mesh(
        trackGeo(new THREE.TubeGeometry(curve, 10, 0.048 - sIdx * 0.01, 6, false)),
        trunkMat,
      );
      g.add(stem);

      const crownTip = curve.getPoint(1);
      const frondCount = sIdx === 0 ? 8 : 6;
      for (let f = 0; f < frondCount; f++) {
        const ang = (f / frondCount) * Math.PI * 2 + seed + sIdx * 0.4;
        const frondGroup = new THREE.Group();
        frondGroup.position.copy(crownTip);
        frondGroup.rotation.y = ang;
        frondGroup.rotation.x = -0.15 + (f % 2) * 0.14;

        const b1 = new THREE.Mesh(frondSeg1Geo, palmFrondMat);
        b1.position.set(0, 0.09, 0.22 * scale);
        b1.rotation.x = -0.34;
        b1.scale.set(scale, 1, scale);

        const b2 = new THREE.Mesh(frondSeg2Geo, palmFrondMat);
        b2.position.set(0, 0.11, 0.62 * scale);
        b2.rotation.x = 0.06;
        b2.scale.set(scale, 1, scale);

        const b3 = new THREE.Mesh(frondSeg3Geo, fernLeafMat);
        b3.position.set(0, -0.02, 1.0 * scale);
        b3.rotation.x = 0.44;
        b3.scale.set(scale, 1, scale);

        const b4 = new THREE.Mesh(frondSeg4Geo, fernLeafMat);
        b4.position.set(0, -0.24, 1.28 * scale);
        b4.rotation.x = 0.82;
        b4.scale.set(scale, 1, scale);

        frondGroup.add(b1, b2, b3, b4);
        g.add(frondGroup);
      }
    });

    // Underplanting fern rosette around soil rim
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const blade = new THREE.Mesh(fernBladeGeo, fernLeafMat);
      blade.position.set(Math.cos(a) * 0.22, 0.64, Math.sin(a) * 0.22);
      blade.rotation.y = -a + Math.PI / 2;
      blade.rotation.x = 0.48;
      g.add(blade);
    }

    skybridgeGroup.add(g);
  };

  // Organic Multi-Branch Coastal Olive Trees (forked branches + 8 textured foliage puffs)
  const olivePuffGeo = trackGeo(new THREE.DodecahedronGeometry(0.28, 1));
  const oliveTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.05, 0.09, 1.35, 7));
  const oliveBranchGeo = trackGeo(new THREE.CylinderGeometry(0.026, 0.044, 0.72, 6));

  const addOlivePlanter = (x: number, z: number, scale = 1.0, seed = 0) => {
    const g = new THREE.Group();
    g.position.set(x, -3.845, z);

    const pot = new THREE.Mesh(potOuterGeo, gunmetalSteelMat);
    pot.position.y = 0.28;
    const rim = new THREE.Mesh(potRimGeo, brushedBronzeMat);
    rim.position.y = 0.56;
    const upGlow = new THREE.Mesh(potUplightGeo, coveAmberMat);
    upGlow.position.y = 0.55;

    const trunk = new THREE.Mesh(oliveTrunkGeo, trunkMat);
    trunk.position.y = 1.15;
    trunk.rotation.z = Math.sin(seed) * 0.07;

    const br1 = new THREE.Mesh(oliveBranchGeo, trunkMat);
    br1.position.set(0.18 * scale, 1.85 * scale, 0.06);
    br1.rotation.z = -0.52;
    const br2 = new THREE.Mesh(oliveBranchGeo, trunkMat);
    br2.position.set(-0.16 * scale, 1.82 * scale, -0.08);
    br2.rotation.z = 0.48;
    g.add(pot, rim, upGlow, trunk, br1, br2);

    const puffOffsets: [number, number, number, number][] = [
      [0.0, 2.26, 0.0, 1.18],
      [0.32, 2.12, 0.14, 0.96],
      [-0.32, 2.04, -0.12, 0.94],
      [0.14, 2.38, -0.24, 0.88],
      [-0.18, 2.32, 0.24, 0.9],
      [0.42, 1.94, -0.18, 0.76],
      [-0.4, 1.88, 0.16, 0.78],
      [0.04, 1.98, 0.34, 0.8],
    ];
    puffOffsets.forEach(([ox, oy, oz, sc], pIdx) => {
      const puff = new THREE.Mesh(olivePuffGeo, pIdx % 2 === 0 ? oliveLeafMat : fernLeafMat);
      puff.position.set(ox * scale, oy * scale, oz * scale);
      puff.scale.set(sc * scale * 1.12, sc * scale * 0.78, sc * scale * 1.05);
      puff.rotation.set(pIdx * 0.5, seed + pIdx * 0.9, pIdx * 0.3);
      g.add(puff);
    });

    skybridgeGroup.add(g);
  };

  // Rich Strategic Botanical Placement around Foyer, Pool Edge, Bar, Sauna & Cabanas
  addPalmPlanter(-2.35, -3.55, 1.05, 0.3);
  addPalmPlanter(2.35, -3.55, 1.05, 1.9);
  addOlivePlanter(-9.75, 2.45, 0.98, 0.7);
  addPalmPlanter(-9.65, 5.35, 1.08, 2.4);
  addOlivePlanter(-3.1, 5.35, 0.92, 1.2);
  addOlivePlanter(3.1, 5.35, 0.92, 2.9);
  addPalmPlanter(9.65, 5.25, 1.12, 0.9);
  addPalmPlanter(6.85, 2.95, 0.95, 3.1);
  addOlivePlanter(6.85, -3.35, 0.95, 4.2);

  // =========================================================================
  // 9. 8 ARTICULATED HUMAN FIGURES (TWO-SEGMENT LIMBS & ANATOMICAL CRAFT)
  // =========================================================================
  const headGeo = trackGeo(new THREE.SphereGeometry(0.102, 16, 14));
  const hairCapGeo = trackGeo(
    new THREE.SphereGeometry(0.109, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
  );
  const hairBunGeo = trackGeo(new THREE.SphereGeometry(0.056, 12, 10));
  const neckGeo = trackGeo(new THREE.CylinderGeometry(0.038, 0.048, 0.09, 12));
  const chestGeo = trackGeo(new THREE.CylinderGeometry(0.155, 0.115, 0.27, 14));
  const waistGeo = trackGeo(new THREE.CylinderGeometry(0.115, 0.132, 0.15, 14));
  const shoulderCapGeo = trackGeo(new THREE.SphereGeometry(0.054, 10, 8));
  const pelvisGeo = trackGeo(new THREE.CylinderGeometry(0.132, 0.125, 0.16, 14));
  const robeSkirtGeo = trackGeo(new THREE.CylinderGeometry(0.138, 0.19, 0.42, 14));
  const robeSashGeo = trackGeo(new THREE.TorusGeometry(0.125, 0.018, 8, 18));
  robeSashGeo.rotateX(Math.PI / 2);

  // Two-segment articulated arm & leg geometries (pivots at Shoulder/Elbow & Hip/Knee)
  const armUpperGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.036, 0.24, 10));
  const elbowJointGeo = trackGeo(new THREE.SphereGeometry(0.035, 8, 8));
  const armForeGeo = trackGeo(new THREE.CylinderGeometry(0.034, 0.026, 0.22, 10));
  const handMeshGeo = trackGeo(new THREE.SphereGeometry(0.032, 10, 8));

  const thighGeo = trackGeo(new THREE.CylinderGeometry(0.062, 0.048, 0.4, 12));
  const kneeJointGeo = trackGeo(new THREE.SphereGeometry(0.046, 10, 8));
  const shinGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.032, 0.38, 12));
  const footGeo = trackGeo(new THREE.BoxGeometry(0.075, 0.042, 0.155));

  const buildHumanRig = (
    skinMat: THREE.Material,
    topMat: THREE.Material,
    bottomMat: THREE.Material,
    hairMat: THREE.Material,
    hasRobeSkirt: boolean,
    hasBun = false,
  ): HumanRig => {
    const root = new THREE.Group();

    const hipY = 0.86;
    const pelvis = new THREE.Mesh(pelvisGeo, bottomMat);
    pelvis.position.y = hipY;
    pelvis.scale.set(1.06, 1, 0.82);
    root.add(pelvis);

    const torso = new THREE.Group();
    torso.position.y = hipY + 0.07;

    const waist = new THREE.Mesh(waistGeo, topMat);
    waist.position.y = 0.075;
    waist.scale.set(1.06, 1, 0.78);
    torso.add(waist);

    const chest = new THREE.Mesh(chestGeo, topMat);
    chest.position.y = 0.275;
    chest.scale.set(1.08, 1, 0.74);
    torso.add(chest);

    if (hasRobeSkirt) {
      const skirt = new THREE.Mesh(robeSkirtGeo, topMat);
      skirt.position.y = -0.13;
      const sash = new THREE.Mesh(robeSashGeo, robeSashMat);
      sash.position.y = 0.05;
      sash.scale.set(1.08, 0.82, 1);
      torso.add(skirt, sash);
    }

    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 0.445;
    torso.add(neck);

    const head = new THREE.Group();
    head.position.y = 0.565;
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.scale.set(0.95, 1.05, 0.98);
    const hairMesh = new THREE.Mesh(hairCapGeo, hairMat);
    hairMesh.position.y = 0.015;
    hairMesh.rotation.x = -0.22;
    head.add(headMesh, hairMesh);
    if (hasBun) {
      const bun = new THREE.Mesh(hairBunGeo, hairMat);
      bun.position.set(0, 0.02, -0.115);
      head.add(bun);
    }
    torso.add(head);

    const makeArm = (xSide: number): { shoulder: THREE.Group; elbow: THREE.Group; hand: THREE.Group } => {
      const shoulder = new THREE.Group();
      shoulder.position.set(xSide * 0.205, 0.37, 0);

      const sCap = new THREE.Mesh(shoulderCapGeo, hasRobeSkirt ? topMat : skinMat);
      const upper = new THREE.Mesh(armUpperGeo, hasRobeSkirt ? topMat : skinMat);
      upper.position.y = -0.125;

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.25, 0);
      const eCap = new THREE.Mesh(elbowJointGeo, skinMat);
      const fore = new THREE.Mesh(armForeGeo, skinMat);
      fore.position.y = -0.11;

      const hand = new THREE.Group();
      hand.position.set(0, -0.23, 0);
      const handMesh = new THREE.Mesh(handMeshGeo, skinMat);
      handMesh.scale.set(0.85, 1.15, 0.65);
      hand.add(handMesh);

      elbow.add(eCap, fore, hand);
      shoulder.add(sCap, upper, elbow);
      return { shoulder, elbow, hand };
    };

    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);
    torso.add(leftArm.shoulder, rightArm.shoulder);
    root.add(torso);

    const makeLeg = (xSide: number): { hip: THREE.Group; knee: THREE.Group } => {
      const hip = new THREE.Group();
      hip.position.set(xSide * 0.095, hipY, 0);
      const thigh = new THREE.Mesh(thighGeo, bottomMat);
      thigh.position.y = -0.21;

      const knee = new THREE.Group();
      knee.position.set(0, -0.42, 0);
      const kCap = new THREE.Mesh(kneeJointGeo, hasRobeSkirt ? skinMat : bottomMat);
      const shin = new THREE.Mesh(shinGeo, hasRobeSkirt ? skinMat : bottomMat);
      shin.position.y = -0.2;

      const foot = new THREE.Mesh(footGeo, bottomMat === swimOliveMat || bottomMat === swimCharcoalMat ? skinMat : sandalMat);
      foot.position.set(0, -0.415, 0.038);

      knee.add(kCap, shin, foot);
      hip.add(thigh, knee);
      return { hip, knee };
    };

    const leftLeg = makeLeg(-1);
    const rightLeg = makeLeg(1);
    root.add(leftLeg.hip, rightLeg.hip);

    return {
      root,
      torso,
      head,
      armL: leftArm.shoulder,
      elbowL: leftArm.elbow,
      armR: rightArm.shoulder,
      elbowR: rightArm.elbow,
      handR: rightArm.hand,
      legL: leftLeg.hip,
      kneeL: leftLeg.knee,
      legR: rightLeg.hip,
      kneeR: rightLeg.knee,
    };
  };

  // --- Guest 1: Strolling Promenade Guest (Woven Ivory Resort Robe + Bun) ---
  const stroller1 = buildHumanRig(skinWarmMat, robeIvoryMat, robeIvoryMat, hairDarkMat, true, true);
  skybridgeGroup.add(stroller1.root);
  const stroller1Path = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-4.0, -3.845, 2.0),
      new THREE.Vector3(-2.6, -3.845, 4.1),
      new THREE.Vector3(2.2, -3.845, 4.35),
      new THREE.Vector3(2.6, -3.845, -1.6),
      new THREE.Vector3(-2.8, -3.845, -1.6),
    ],
    true,
    'catmullrom',
    0.5,
  );

  // --- Guest 2: Strolling East Gallery Guest (Linen Tunic & Trousers) ---
  const stroller2 = buildHumanRig(skinFairMat, linenTaupeClothMat, robeIvoryMat, hairAuburnMat, false, false);
  skybridgeGroup.add(stroller2.root);
  const stroller2Path = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(2.8, -3.845, -3.1),
      new THREE.Vector3(6.65, -3.845, -3.1),
      new THREE.Vector3(6.65, -3.845, 4.05),
      new THREE.Vector3(2.85, -3.845, 4.15),
    ],
    true,
    'catmullrom',
    0.5,
  );

  // --- Guest 3: Pool Swimmer Submerged Mid-Torso in Infinity Water ---
  const swimmerPivot = new THREE.Group();
  const swimmer1 = buildHumanRig(skinWarmMat, skinWarmMat, swimOliveMat, hairDarkMat, false, false);
  // Tilted horizontally belly-down along +Z swim axis so waterline cuts across mid-torso & shoulders
  swimmer1.root.rotation.x = Math.PI * 0.47;
  swimmer1.root.position.set(0, 0.02, -1.02);
  swimmer1.head.rotation.x = -0.82; // chin & face cleanly above waterSurfaceY
  swimmerPivot.position.set(-1.6, waterSurfaceY - 0.08, 11.1);
  swimmerPivot.add(swimmer1.root);
  skybridgeGroup.add(swimmerPivot);

  // --- Guest 4: Standing Bather Waist-Deep Leaning Relaxed near Infinity Weir ---
  const bather2 = buildHumanRig(skinDeepMat, skinDeepMat, swimCharcoalMat, hairDarkMat, false, true);
  bather2.root.position.set(1.85, waterSurfaceY - 0.55, 15.85);
  bather2.root.rotation.y = 0.14;
  bather2.torso.rotation.x = 0.16;
  bather2.head.rotation.x = -0.06;
  bather2.armL.rotation.x = -0.55;
  bather2.elbowL.rotation.x = -0.85;
  bather2.armR.rotation.x = -0.62;
  bather2.elbowR.rotation.x = -0.78;
  skybridgeGroup.add(bather2.root);

  // --- Guest 5: Fire-Pit Sofa Guest Seated on sofaSeatTopY with Feet on deckFloorY ---
  const loungerFire = buildHumanRig(skinFairMat, robeIvoryMat, robeIvoryMat, hairAuburnMat, true, true);
  loungerFire.root.position.set(1.16, sofaSeatTopY - 0.77, 0.0);
  loungerFire.root.rotation.y = -Math.PI / 2;
  loungerFire.legL.rotation.x = -1.48;
  loungerFire.kneeL.rotation.x = 1.44;
  loungerFire.legR.rotation.x = -1.48;
  loungerFire.kneeR.rotation.x = 1.44;
  loungerFire.torso.rotation.x = -0.14;
  loungerFire.armL.rotation.x = -0.35;
  loungerFire.elbowL.rotation.x = -0.52;
  loungerFire.armR.rotation.x = -0.38;
  loungerFire.elbowR.rotation.x = -0.55;
  fireLoungeGroup.add(loungerFire.root);

  // --- Guest 6: Cabana 1 Guest Reclining Cleanly Above cabanaMattressTopY ---
  const loungerCabana = buildHumanRig(skinDeepMat, linenTaupeClothMat, robeIvoryMat, hairDarkMat, false, true);
  loungerCabana.root.position.set(0, cabanaMattressTopY - 0.78, -0.34);
  loungerCabana.torso.rotation.x = -0.62;
  loungerCabana.legL.rotation.x = -1.78;
  loungerCabana.kneeL.rotation.x = 0.58;
  loungerCabana.legR.rotation.x = -1.74;
  loungerCabana.kneeR.rotation.x = 0.54;
  loungerCabana.armL.rotation.z = 0.16;
  loungerCabana.armL.rotation.x = -0.25;
  loungerCabana.elbowL.rotation.x = -0.45;
  loungerCabana.armR.rotation.z = -0.16;
  loungerCabana.armR.rotation.x = -0.28;
  loungerCabana.elbowR.rotation.x = -0.48;
  cabGroups[0].add(loungerCabana.root);

  // --- Staff 7: Tea & Champagne Bar Attendant (Dark Hospitality Tunic + Brass Shaker) ---
  const barAttendant = buildHumanRig(skinFairMat, staffAttireMat, staffAttireMat, hairDarkMat, false, false);
  barAttendant.root.position.set(0.7, 0, 0);
  barAttendant.root.rotation.y = Math.PI / 2;
  const shakerMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.036, 0.028, 0.17, 12)),
    brushedBronzeMat,
  );
  shakerMesh.position.set(0, 0.04, 0.03);
  barAttendant.handR.add(shakerMesh);
  barGroup.add(barAttendant.root);

  // --- Guest 8: Bar Patron Seated on Center Barstool with Feet on Footrest & Drinking Cycle ---
  const barGuest = buildHumanRig(skinWarmMat, robeIvoryMat, linenTaupeClothMat, hairAuburnMat, false, true);
  const barStoolAngle = 0.0;
  barGuest.root.position.set(
    Math.cos(barStoolAngle) * 2.43,
    stoolTopY - 0.78,
    Math.sin(barStoolAngle) * 2.43,
  );
  barGuest.root.rotation.y = -barStoolAngle - Math.PI / 2;
  barGuest.legL.rotation.x = -1.28;
  barGuest.kneeL.rotation.x = 1.66;
  barGuest.legR.rotation.x = -1.28;
  barGuest.kneeR.rotation.x = 1.66;
  barGuest.armL.rotation.x = -0.42;
  barGuest.elbowL.rotation.x = -0.92;
  const guestFlute = new THREE.Mesh(fluteGeo, clearWeirGlassMat);
  guestFlute.position.set(0, -0.04, 0.02);
  guestFlute.rotation.x = Math.PI * 0.45;
  barGuest.handR.add(guestFlute);
  barGroup.add(barGuest.root);

  // =========================================================================
  // 10. ANIMATION LOOP (ZERO HEAP ALLOCATIONS, LOCKED 60 FPS)
  // =========================================================================
  return {
    group: skybridgeGroup,
    update: (elapsedTime: number, dt: number) => {
      // 1. Subtle physical wave shimmer across volcanic thermal pool
      const waterPosAttr = thermalWaterGeo.attributes.position as THREE.BufferAttribute;
      const wArr = waterPosAttr.array as Float32Array;
      const vertCount = waterPosAttr.count;
      for (let i = 0; i < vertCount; i++) {
        const bx = waterBasePos[i * 3];
        const bz = waterBasePos[i * 3 + 2];
        wArr[i * 3 + 1] =
          Math.sin(bx * 0.72 + elapsedTime * 1.35) * 0.02 +
          Math.cos(bz * 0.85 - elapsedTime * 1.05) * 0.016;
      }
      waterPosAttr.needsUpdate = true;

      // 2. Underwater fiber-optic shimmer & whirlpool effervescent bubbles
      for (let i = 0; i < fiberOpticNodes.length; i++) {
        fiberOpticNodes[i].scale.setScalar(0.9 + 0.18 * Math.sin(elapsedTime * 2.1 + i * 1.1));
      }
      for (let b = 0; b < wpBubbleRings.length; b++) {
        const pulse = 0.88 + 0.16 * Math.sin(elapsedTime * 3.8 + b * 1.8);
        wpBubbleRings[b].scale.setScalar(pulse);
      }

      // 3. Sunken Fire-Bowl Flames (smooth vertical pulse & warm opacity) + Shower Mist
      for (let f = 0; f < spaFlameTongues.length; f++) {
        const sy = 0.76 + 0.34 * Math.sin(elapsedTime * 6.5 + f * 1.5);
        spaFlameTongues[f].scale.set(1, sy, 1);
      }
      spaFlameOuterMat.opacity = 0.64 + 0.14 * Math.sin(elapsedTime * 5.4);
      spaFlameInnerMat.opacity = 0.78 + 0.14 * Math.cos(elapsedTime * 6.2);

      for (let s = 0; s < showerStreams.length; s++) {
        showerStreams[s].rotation.y = elapsedTime * (s === 0 ? 0.5 : -0.5);
      }

      // 4. Gentle Low-Hovering Thermal Steam Wisps
      const posAttr = steamGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < steamCount; i++) {
        const idx = i * 3;
        const seedX = steamSeeds[idx];
        const seedZ = steamSeeds[idx + 2];

        arr[idx + 1] += dt * (0.48 + seedX * 0.38);
        arr[idx] += Math.sin(elapsedTime * 0.8 + i) * dt * 0.22;
        arr[idx + 2] += Math.cos(elapsedTime * 0.65 + i * 0.7) * dt * 0.18;

        if (i < 76) {
          if (arr[idx + 1] > -1.05) {
            arr[idx] = (seedX - 0.5) * 12.6;
            arr[idx + 1] = -3.92;
            arr[idx + 2] = 6.7 + seedZ * 9.0;
          }
        } else {
          if (arr[idx + 1] > -1.5) {
            const ang = seedX * Math.PI * 2;
            const rad = seedZ * 1.05;
            arr[idx] = -6.1 + Math.cos(ang) * rad;
            arr[idx + 1] = -3.32;
            arr[idx + 2] = 3.85 + Math.sin(ang) * rad;
          }
        }
      }
      posAttr.needsUpdate = true;

      // 5. Animate All 8 Articulated Guests & Staff Smoothly
      // Strolling Guest 1 (articulated knee & elbow stride)
      const u1 = (elapsedTime * 0.032) % 1;
      stroller1Path.getPointAt(u1, _walkPos);
      stroller1Path.getPointAt((u1 + 0.015) % 1, _walkNext);
      stroller1.root.position.copy(_walkPos);
      stroller1.root.rotation.y = Math.atan2(_walkNext.x - _walkPos.x, _walkNext.z - _walkPos.z);
      const stride1 = Math.sin(elapsedTime * 4.4);
      stroller1.legL.rotation.x = stride1 * 0.36;
      stroller1.kneeL.rotation.x = 0.2 + Math.max(0, -stride1) * 0.42;
      stroller1.legR.rotation.x = -stride1 * 0.36;
      stroller1.kneeR.rotation.x = 0.2 + Math.max(0, stride1) * 0.42;
      stroller1.armL.rotation.x = -stride1 * 0.24;
      stroller1.elbowL.rotation.x = -0.22 - Math.max(0, stride1) * 0.18;
      stroller1.armR.rotation.x = stride1 * 0.24;
      stroller1.elbowR.rotation.x = -0.22 - Math.max(0, -stride1) * 0.18;
      stroller1.head.rotation.y = Math.sin(elapsedTime * 0.9) * 0.2;

      // Strolling Guest 2 (articulated knee & elbow stride)
      const u2 = (elapsedTime * 0.036 + 0.38) % 1;
      stroller2Path.getPointAt(u2, _walkPos);
      stroller2Path.getPointAt((u2 + 0.015) % 1, _walkNext);
      stroller2.root.position.copy(_walkPos);
      stroller2.root.rotation.y = Math.atan2(_walkNext.x - _walkPos.x, _walkNext.z - _walkPos.z);
      const stride2 = Math.sin(elapsedTime * 4.6 + 1.2);
      stroller2.legL.rotation.x = stride2 * 0.34;
      stroller2.kneeL.rotation.x = 0.2 + Math.max(0, -stride2) * 0.4;
      stroller2.legR.rotation.x = -stride2 * 0.34;
      stroller2.kneeR.rotation.x = 0.2 + Math.max(0, stride2) * 0.4;
      stroller2.armL.rotation.x = -stride2 * 0.22;
      stroller2.elbowL.rotation.x = -0.22;
      stroller2.armR.rotation.x = stride2 * 0.22;
      stroller2.elbowR.rotation.x = -0.22;
      stroller2.head.rotation.y = Math.cos(elapsedTime * 0.85) * 0.18;

      // Swimmer 1 gliding cleanly submerged with bent-elbow breaststroke & concentric ripples
      const swimT = elapsedTime * 0.26;
      const clampedNow = clampSwimmerPosition(
        Math.sin(swimT) * 3.4,
        11.2 + Math.cos(swimT * 2) * 1.45,
      );
      const clampedNext = clampSwimmerPosition(
        Math.sin(swimT + 0.05) * 3.4,
        11.2 + Math.cos((swimT + 0.05) * 2) * 1.45,
      );
      swimmerPivot.position.set(
        clampedNow.x,
        waterSurfaceY - 0.08 + Math.sin(elapsedTime * 2.1) * 0.014,
        clampedNow.z,
      );
      swimmerPivot.rotation.y = Math.atan2(
        clampedNext.x - clampedNow.x,
        clampedNext.z - clampedNow.z,
      );

      const strokePhase = elapsedTime * 2.1;
      const sweepPull = Math.max(0, Math.sin(strokePhase));
      const armReachX = -2.35 + Math.cos(strokePhase) * 0.55;
      const armSweepZ = -0.32 - sweepPull * 0.65;
      const elbowBend = -0.45 - sweepPull * 0.72;
      swimmer1.armL.rotation.set(armReachX, 0, armSweepZ);
      swimmer1.elbowL.rotation.x = elbowBend;
      swimmer1.armR.rotation.set(armReachX, 0, -armSweepZ);
      swimmer1.elbowR.rotation.x = elbowBend;

      const kickPhase = elapsedTime * 5.2;
      swimmer1.legL.rotation.x = 0.08 + Math.sin(kickPhase) * 0.16;
      swimmer1.kneeL.rotation.x = 0.22 + Math.max(0, Math.sin(kickPhase)) * 0.26;
      swimmer1.legR.rotation.x = 0.08 - Math.sin(kickPhase) * 0.16;
      swimmer1.kneeR.rotation.x = 0.22 + Math.max(0, -Math.sin(kickPhase)) * 0.26;

      for (let r = 0; r < swimmerRippleRings.length; r++) {
        const rp = (elapsedTime * 0.55 + r * 0.333) % 1;
        swimmerRippleRings[r].position.set(clampedNow.x, waterSurfaceY + 0.015, clampedNow.z);
        swimmerRippleRings[r].scale.setScalar(1 + rp * 2.4);
        swimmerRippleMats[r].opacity = (1 - rp) * 0.42;
      }

      // Bather 2 relaxing waist-deep near infinity weir edge
      bather2.root.position.y = waterSurfaceY - 0.55 + Math.sin(elapsedTime * 1.4) * 0.018;
      bather2.head.rotation.y = Math.sin(elapsedTime * 0.55) * 0.24;
      bather2.torso.rotation.z = Math.sin(elapsedTime * 1.1) * 0.03;

      // Lounging Guest 1 seated cleanly on Fire Lounge banquette
      loungerFire.torso.rotation.x = -0.14 + Math.sin(elapsedTime * 1.3) * 0.02;
      loungerFire.head.rotation.y = Math.sin(elapsedTime * 0.65) * 0.16;

      // Lounging Guest 2 reclining cleanly on Cabana 1 mattress
      loungerCabana.torso.rotation.x = -0.62 + Math.sin(elapsedTime * 1.15) * 0.02;
      loungerCabana.head.rotation.y = Math.sin(elapsedTime * 0.48) * 0.18;

      // Bar Attendant preparing tea & drinks behind counter with bent elbows
      barAttendant.torso.rotation.y = Math.sin(elapsedTime * 0.8) * 0.16;
      barAttendant.armR.rotation.x = -0.45 + Math.sin(elapsedTime * 2.6) * 0.18;
      barAttendant.elbowR.rotation.x = -0.95 + Math.sin(elapsedTime * 5.2) * 0.16;
      barAttendant.armL.rotation.x = -0.38;
      barAttendant.elbowL.rotation.x = -0.78 + Math.cos(elapsedTime * 1.8) * 0.14;
      barAttendant.head.rotation.y = Math.sin(elapsedTime * 0.9) * 0.18;

      // Bar Patron seated on barstool executing natural bent-elbow drinking cycle
      const drinkPose = computeBarDrinkingPose(elapsedTime);
      barGuest.armR.rotation.x = drinkPose.shoulderX;
      barGuest.elbowR.rotation.x = drinkPose.elbowX;
      barGuest.head.rotation.x = drinkPose.headPitchX;
      barGuest.head.rotation.y = Math.cos(elapsedTime * 0.65) * 0.12 * (1 - drinkPose.liftBlend * 0.7);
      guestFlute.rotation.x = -(drinkPose.shoulderX + drinkPose.elbowX);
    },
  };
}
