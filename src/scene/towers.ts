import * as THREE from 'three';
import type { ProceduralTextureSet } from './textures';
import { createLevel34SkybridgeSpa } from './level34Spa';
import { createExteriorOverhaul } from './exteriorOverhaul';

import type { BeaconPose, WalkthroughLevelId } from '../architecture/interiors';

export interface TowersController {
  group: THREE.Group;
  walkableFloors: THREE.Object3D[];
  setBeaconPose: (pose: BeaconPose, elapsedTime: number, visible: boolean) => void;
  setWalkthroughIsolation: (activeRoomId: WalkthroughLevelId | null) => void;
  update: (elapsedTime: number, dt: number) => void;
  dispose: () => void;
}

export function createAureliaTowers(
  textures: ProceduralTextureSet,
  _isSoftwareGl: boolean,
): TowersController {
  const group = new THREE.Group();
  group.name = 'aureliaTowersGroup';

  const geometriesToDispose: THREE.BufferGeometry[] = [];
  const materialsToDispose: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometriesToDispose.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materialsToDispose.push(m);
    return m;
  };

  // === CURTAIN-WALL & ARCHITECTURAL MATERIALS ===
  // Honed Portland Stone (matches exterior megacolumns & travertine reveals)
  const travertineSlabMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe6dec8,
      map: textures.portlandAlbedo,
      bumpMap: textures.portlandBump,
      bumpScale: 0.08,
      roughness: 0.65,
      metalness: 0.08,
    }),
  );

  // Slender anodized graphite-bronze mullions & structural steel curtain-wall frame
  const anodizedMullionMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#181614',
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 1.35,
    }),
  );

  // Brushed antique bronze pinstripe accents & metalwork highlights
  const brushedBronzeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9a7832,
      metalness: 0.82,
      roughness: 0.28,
      envMapIntensity: 1.4,
    }),
  );

  const darkCoreMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#12151D',
      metalness: 0.6,
      roughness: 0.45,
      envMapIntensity: 0.9,
    }),
  );

  // Obsidian tinted reflective curtain-wall glass
  const acousticGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0b1017,
      metalness: 0.85,
      roughness: 0.12,
      envMapIntensity: 1.6,
      transparent: true,
      opacity: 0.44,
      depthWrite: false,
    }),
  );

  const clearWeirGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#88C8BE',
      metalness: 0.18,
      roughness: 0.06,
      envMapIntensity: 1.5,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );

  // =========================================================================
  // 1 & 2. MONUMENTAL PORTICO, 3D TECTONIC FACADES & VERTICAL CIRCULATION SPINE
  // =========================================================================
  const exteriorOverhaul = createExteriorOverhaul(textures, trackGeo, trackMat);
  group.add(
    exteriorOverhaul.porticoGroup,
    exteriorOverhaul.exteriorTowersGroup,
    exteriorOverhaul.circulationSpineGroup,
  );
  const towerCentersX = [-18, 18] as const;
  const dummy = new THREE.Object3D();

  // =========================================================================
  // SHARED WALKABLE INTERIOR MATERIALS & ARRIVAL PORTAL HELPER
  // =========================================================================
  const walkableFloors: THREE.Object3D[] = [];
  const smokedOakMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: textures.smokedOakAlbedo,
      bumpMap: textures.smokedOakBump,
      bumpScale: 0.04,
      roughness: 0.65,
      metalness: 0.04,
      envMapIntensity: 0.12,
    }),
  );
  const darkBasaltMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: textures.basaltAlbedo,
      bumpMap: textures.basaltBump,
      bumpScale: 0.032,
      roughnessMap: textures.basaltRoughness,
      roughness: 0.82,
      metalness: 0.03,
      envMapIntensity: 0.06,
    }),
  );
  const slateBasinMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#0D1C19',
      roughness: 0.48,
      metalness: 0.18,
      envMapIntensity: 0.4,
    }),
  );
  const flutedCedarMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#3B281B',
      bumpMap: textures.smokedOakBump,
      bumpScale: 0.035,
      roughness: 0.58,
      metalness: 0.04,
      envMapIntensity: 0.24,
    }),
  );
  const gunmetalSteelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#1C1A18',
      metalness: 0.88,
      roughness: 0.22,
      envMapIntensity: 1.35,
    }),
  );
  const boucleIvoryMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#F5EFE6',
      bumpMap: textures.boucleBump,
      bumpScale: 0.018,
      roughness: 0.92,
      metalness: 0.02,
      envMapIntensity: 0.18,
    }),
  );
  const taupeThrowMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#322D28',
      roughness: 0.93,
      metalness: 0.02,
      envMapIntensity: 0.18,
    }),
  );
  const teakWoodMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#4E311E',
      bumpMap: textures.smokedOakBump,
      bumpScale: 0.02,
      roughness: 0.48,
      metalness: 0.08,
      envMapIntensity: 0.35,
    }),
  );
  const saddleLeatherMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#5C3720',
      roughness: 0.44,
      metalness: 0.06,
      envMapIntensity: 0.45,
    }),
  );
  const honedTravertineBarMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#DECBB0',
      map: textures.portlandAlbedo,
      bumpMap: textures.portlandBump,
      bumpScale: 0.05,
      roughness: 0.5,
      metalness: 0.04,
      envMapIntensity: 0.38,
    }),
  );
  const darkMarbleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: textures.darkMarbleAlbedo,
      roughness: 0.24,
      metalness: 0.08,
      envMapIntensity: 0.32,
    }),
  );
  const sheerLinenMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#EFE8DC',
      roughness: 0.92,
      metalness: 0.01,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const backlitOnyxMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      map: textures.flutedOnyxMap,
      emissive: new THREE.Color('#FFB86C'),
      emissiveMap: textures.flutedOnyxMap,
      emissiveIntensity: 1.4,
      roughness: 0.28,
      metalness: 0.05,
    }),
  );
  const smokedGlassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#0D1014',
      metalness: 0.22,
      roughness: 0.08,
      transparent: true,
      opacity: 0.72,
      envMapIntensity: 1.45,
    }),
  );
  const woolRugMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#282420',
      roughness: 0.96,
      metalness: 0.01,
      envMapIntensity: 0.04,
    }),
  );
  const darkSmokedDoorMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#261911',
      map: textures.smokedOakAlbedo,
      bumpMap: textures.smokedOakBump,
      bumpScale: 0.025,
      roughness: 0.54,
      metalness: 0.06,
      envMapIntensity: 0.14,
    }),
  );
  const interiorCeilingMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#171412',
      roughness: 0.76,
      metalness: 0.16,
    }),
  );
  const coveLineMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFB86C',
      emissive: new THREE.Color('#FFB86C'),
      emissiveIntensity: 1.2,
      roughness: 0.4,
      metalness: 0.1,
    }),
  );
  const emberGlowMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FF9A44',
    }),
  );
  const coveAmberMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FFB86C',
    }),
  );
  const lanternGlassMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FFCE8A',
      transparent: true,
      opacity: 0.74,
    }),
  );

  // Shared helper for Private Hotel Elevator Arrival Vestibule Portals
  const portalStoneSideGeo = trackGeo(new THREE.BoxGeometry(0.42, 3.65, 0.38));
  const portalLintelGeo = trackGeo(new THREE.BoxGeometry(3.26, 0.62, 0.42));
  const portalSillGeo = trackGeo(new THREE.BoxGeometry(3.26, 0.05, 0.44));
  const portalDoorLeafGeo = trackGeo(new THREE.BoxGeometry(1.14, 3.0, 0.1));
  const portalHandleGeo = trackGeo(new THREE.CylinderGeometry(0.024, 0.024, 1.32, 10));
  const portalPlaqueFrameGeo = trackGeo(new THREE.BoxGeometry(2.38, 0.46, 0.06));
  const portalPlaqueFaceGeo = trackGeo(new THREE.PlaneGeometry(2.28, 0.38));

  const addFoyerPortal = (
    parent: THREE.Group,
    x: number,
    floorY: number,
    z: number,
    plaqueTex: THREE.CanvasTexture,
  ) => {
    const portal = new THREE.Group();
    portal.position.set(x, floorY, z);

    const jambL = new THREE.Mesh(portalStoneSideGeo, honedTravertineBarMat);
    jambL.position.set(-1.38, 1.825, 0);
    const jambR = new THREE.Mesh(portalStoneSideGeo, honedTravertineBarMat);
    jambR.position.set(1.38, 1.825, 0);

    const lintel = new THREE.Mesh(portalLintelGeo, honedTravertineBarMat);
    lintel.position.set(0, 3.34, 0.02);

    const sill = new THREE.Mesh(portalSillGeo, brushedBronzeMat);
    sill.position.set(0, 0.025, 0.02);

    const doorL = new THREE.Mesh(portalDoorLeafGeo, darkSmokedDoorMat);
    doorL.position.set(-0.59, 1.52, -0.05);
    const doorR = new THREE.Mesh(portalDoorLeafGeo, darkSmokedDoorMat);
    doorR.position.set(0.59, 1.52, -0.05);

    const handleL = new THREE.Mesh(portalHandleGeo, brushedBronzeMat);
    handleL.position.set(-0.14, 1.42, 0.05);
    const handleR = new THREE.Mesh(portalHandleGeo, brushedBronzeMat);
    handleR.position.set(0.14, 1.42, 0.05);

    const plaqueFrame = new THREE.Mesh(portalPlaqueFrameGeo, brushedBronzeMat);
    plaqueFrame.position.set(0, 3.34, 0.24);
    const plaqueMat = trackMat(new THREE.MeshBasicMaterial({ map: plaqueTex }));
    const plaqueFace = new THREE.Mesh(portalPlaqueFaceGeo, plaqueMat);
    plaqueFace.position.set(0, 3.34, 0.275);

    portal.add(jambL, jambR, lintel, sill, doorL, doorR, handleL, handleR, plaqueFrame, plaqueFace);
    parent.add(portal);
  };

  // Shared Botanical Foliage Materials (used by Level 34 Sky-Spa & Setback Terrace Greenery)
  const hedgeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#224432',
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  const trunkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#3A2E26',
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const canopyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#274E39',
      roughness: 0.84,
      metalness: 0.03,
    }),
  );

  // =========================================================================
  // 3. CANTILEVERED SKYBRIDGE & LUXURY SKY-SPA LOUNGE (LEVEL 34 · Y = 90)
  // =========================================================================
  const level34Spa = createLevel34SkybridgeSpa({
    textures,
    sharedMats: {
      travertineSlabMat,
      anodizedMullionMat,
      brushedBronzeMat,
      acousticGlassMat,
      clearWeirGlassMat,
      darkBasaltMat,
      slateBasinMat,
      flutedCedarMat,
      gunmetalSteelMat,
      boucleIvoryMat,
      taupeThrowMat,
      teakWoodMat,
      saddleLeatherMat,
      honedTravertineBarMat,
      darkMarbleMat,
      sheerLinenMat,
      backlitOnyxMat,
      darkSmokedDoorMat,
      interiorCeilingMat,
      coveLineMat,
      emberGlowMat,
      coveAmberMat,
      lanternGlassMat,
      trunkMat,
      canopyMat,
      hedgeMat,
    },
    trackGeo,
    trackMat,
    addFoyerPortal,
    walkableFloors,
  });
  const skybridgeGroup = level34Spa.group;
  group.add(skybridgeGroup);

  // =========================================================================
  // 4. CROWN PENTHOUSE PAVILIONS, LANDSCAPED TERRACES & HELIPAD (LEVEL 68)
  // =========================================================================
  const beaconMeshes: THREE.Mesh[] = [];
  const beaconMat = trackMat(new THREE.MeshBasicMaterial({ color: '#FFB85C' }));
  const aviationRedMat = trackMat(new THREE.MeshBasicMaterial({ color: '#D94B38' }));

  // Landscaped Setback Terrace Greenery:
  // Multi-part low-poly rooftop trees (trunk + dual canopy), clipped box hedges, and bronze planters
  const planterBoxGeo = trackGeo(new THREE.BoxGeometry(1.9, 0.58, 1.9));
  const planterMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#1F1C19',
      roughness: 0.55,
      metalness: 0.35,
    }),
  );
  const hedgeGeo = trackGeo(new THREE.BoxGeometry(1.55, 0.72, 1.15));
  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.17, 1.65, 6));
  const canopyGeo = trackGeo(new THREE.DodecahedronGeometry(0.85, 0));

  const planterMatrices: THREE.Matrix4[] = [];
  const hedgeMatrices: THREE.Matrix4[] = [];
  const hedgeColors: THREE.Color[] = [];
  const trunkMatrices: THREE.Matrix4[] = [];
  const canopyMatrices: THREE.Matrix4[] = [];
  const canopyColors: THREE.Color[] = [];

  const addTreeAt = (x: number, yBase: number, z: number, scale = 1) => {
    // Planter box grounded flush on terrace
    dummy.position.set(x, yBase + 0.29 * scale, z);
    dummy.rotation.set(0, (x + z) * 0.1, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    planterMatrices.push(dummy.matrix.clone());

    // Trunk
    dummy.position.set(x, yBase + (0.55 + 0.82) * scale, z);
    dummy.rotation.set(0, x * 0.3, 0);
    dummy.scale.set(scale, scale, scale);
    dummy.updateMatrix();
    trunkMatrices.push(dummy.matrix.clone());

    // Layered multi-crown canopy clusters (2 clusters per tree)
    const tint = new THREE.Color('#244B36').lerp(
      new THREE.Color('#326146'),
      Math.abs(Math.sin(x * 1.7 + z * 2.3)),
    );
    dummy.position.set(x, yBase + 2.35 * scale, z);
    dummy.rotation.set(0.15, z * 0.5, 0.1);
    dummy.scale.set(scale * 1.15, scale * 1.05, scale * 1.15);
    dummy.updateMatrix();
    canopyMatrices.push(dummy.matrix.clone());
    canopyColors.push(tint.clone());

    dummy.position.set(x + 0.28 * scale, yBase + 2.85 * scale, z - 0.18 * scale);
    dummy.rotation.set(0.3, x * 0.4, 0.2);
    dummy.scale.set(scale * 0.78, scale * 0.78, scale * 0.78);
    dummy.updateMatrix();
    canopyMatrices.push(dummy.matrix.clone());
    canopyColors.push(tint.clone().multiplyScalar(1.12));
  };

  const addHedgeAt = (x: number, yBase: number, z: number, rotY = 0, scaleX = 1) => {
    dummy.position.set(x, yBase + 0.26, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(scaleX, 0.85, 0.72);
    dummy.updateMatrix();
    planterMatrices.push(dummy.matrix.clone());

    dummy.position.set(x, yBase + 0.78, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.set(scaleX, 0.92, 0.82);
    dummy.updateMatrix();
    hedgeMatrices.push(dummy.matrix.clone());
    const hTint = new THREE.Color('#1D3D2D').lerp(
      new THREE.Color('#2A523D'),
      Math.abs(Math.cos(x + z)),
    );
    hedgeColors.push(hTint);
  };

  // =========================================================================
  // WALKABLE INTERIOR 1 · LEVEL 14 THE RIVER RESIDENCE (West Tower Y = 37.8)
  // =========================================================================
  const lvl14Group = new THREE.Group();
  lvl14Group.name = 'level14RiverResidence';
  lvl14Group.position.set(-18, 37.8, 0);

  // Dark smoked-oak parquet floor (top flush at world Y = 37.80)
  const lvl14FloorGeo = trackGeo(new THREE.BoxGeometry(15.2, 0.22, 15.2));
  const lvl14Floor = new THREE.Mesh(lvl14FloorGeo, smokedOakMat);
  lvl14Floor.position.set(0, -0.11, 0);
  lvl14Floor.userData.walkableRoomId = 'lvl-14';
  lvl14Group.add(lvl14Floor);
  walkableFloors.push(lvl14Floor);

  // Architectural Layered Coffered Ceiling + Subtle Recessed Perimeter Glow Lines (#FFB86C, intensity 1.2)
  const lvl14CeilingGeo = trackGeo(new THREE.BoxGeometry(15.2, 0.34, 15.2));
  const lvl14Ceiling = new THREE.Mesh(lvl14CeilingGeo, interiorCeilingMat);
  lvl14Ceiling.position.set(0, 5.25, 0);
  lvl14Group.add(lvl14Ceiling);

  const l14BeamXGeo = trackGeo(new THREE.BoxGeometry(14.2, 0.26, 0.48));
  const l14BeamZGeo = trackGeo(new THREE.BoxGeometry(0.48, 0.26, 13.0));
  const l14GlowXGeo = trackGeo(new THREE.BoxGeometry(4.1, 0.04, 0.08));
  const l14GlowZGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.04, 5.6));
  for (const bz of [-5.2, 0.6, 6.4]) {
    const beam = new THREE.Mesh(l14BeamXGeo, smokedOakMat);
    beam.position.set(0, 4.96, bz);
    lvl14Group.add(beam);
  }
  for (const bx of [-6.8, -2.25, 2.25, 6.8]) {
    const beam = new THREE.Mesh(l14BeamZGeo, smokedOakMat);
    beam.position.set(bx, 4.96, 0.6);
    lvl14Group.add(beam);
  }
  for (const cx of [-4.52, 0, 4.52]) {
    for (const cz of [-2.3, 3.5]) {
      const gN = new THREE.Mesh(l14GlowXGeo, coveLineMat);
      gN.position.set(cx, 5.06, cz - 2.65);
      const gS = new THREE.Mesh(l14GlowXGeo, coveLineMat);
      gS.position.set(cx, 5.06, cz + 2.65);
      const gW = new THREE.Mesh(l14GlowZGeo, coveLineMat);
      gW.position.set(cx - 2.0, 5.06, cz);
      const gE = new THREE.Mesh(l14GlowZGeo, coveLineMat);
      gE.position.set(cx + 2.0, 5.06, cz);
      lvl14Group.add(gN, gS, gW, gE);
    }
  }

  // Honed Portland-stone feature wall on North side (z = -5.6) with recessed glowing fireplace
  const hearthWallGeo = trackGeo(new THREE.BoxGeometry(11.8, 5.1, 0.72));
  const hearthWall = new THREE.Mesh(hearthWallGeo, travertineSlabMat);
  hearthWall.position.set(0, 2.55, -5.6);
  lvl14Group.add(hearthWall);

  const hearthNicheGeo = trackGeo(new THREE.BoxGeometry(4.6, 0.85, 0.25));
  const hearthNiche = new THREE.Mesh(hearthNicheGeo, anodizedMullionMat);
  hearthNiche.position.set(-0.6, 0.95, -5.18);
  lvl14Group.add(hearthNiche);

  const hearthFireGeo = trackGeo(new THREE.BoxGeometry(3.8, 0.32, 0.16));
  const hearthFire = new THREE.Mesh(hearthFireGeo, emberGlowMat);
  hearthFire.position.set(-0.6, 0.88, -5.06);
  lvl14Group.add(hearthFire);

  // Low Smoked-Oak & Fluted Bronze Credenza + Curated Minimalist Artwork along North Stone Wall
  const credBody = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.6, 0.62, 0.56)),
    smokedOakMat,
  );
  credBody.position.set(-4.35, 0.37, -4.92);
  const credTop = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.66, 0.05, 0.6)),
    darkMarbleMat,
  );
  credTop.position.set(-4.35, 0.7, -4.92);
  const credPlinth = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.46, 0.08, 0.48)),
    brushedBronzeMat,
  );
  credPlinth.position.set(-4.35, 0.04, -4.92);
  const credBowl = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.18, 0.11, 0.1, 16)),
    brushedBronzeMat,
  );
  credBowl.position.set(-4.65, 0.77, -4.92);
  const artFrame = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.75, 2.15, 0.06)),
    brushedBronzeMat,
  );
  artFrame.position.set(-4.35, 2.35, -5.2);
  const artCanvas = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.62, 2.02, 0.07)),
    honedTravertineBarMat,
  );
  artCanvas.position.set(-4.35, 2.35, -5.19);
  lvl14Group.add(credBody, credTop, credPlinth, credBowl, artFrame, artCanvas);

  // Charcoal woven area rug + Curved Organic Designer Ivory Boucle Sectional + Sculptural Ottoman
  const lvl14RugGeo = trackGeo(new THREE.BoxGeometry(7.2, 0.05, 5.4));
  const lvl14Rug = new THREE.Mesh(lvl14RugGeo, woolRugMat);
  lvl14Rug.position.set(-1.1, 0.025, -0.6);
  lvl14Group.add(lvl14Rug);

  const l14SegSeatGeo = trackGeo(new THREE.BoxGeometry(0.82, 0.36, 0.96));
  const l14SegBackGeo = trackGeo(new THREE.BoxGeometry(0.82, 0.46, 0.28));
  const l14PillowGeo = trackGeo(new THREE.BoxGeometry(0.34, 0.3, 0.14));
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const ang = -0.35 + t * 2.25; // enveloping designer crescent around coffee table
    const sx = -1.05 - Math.cos(ang) * 1.95;
    const sz = -1.45 + Math.sin(ang) * 1.85;
    const seatSeg = new THREE.Mesh(l14SegSeatGeo, boucleIvoryMat);
    seatSeg.position.set(sx, 0.22, sz);
    seatSeg.rotation.y = ang - Math.PI / 2;

    const bx = -1.05 - Math.cos(ang) * 2.38;
    const bz = -1.45 + Math.sin(ang) * 2.26;
    const backSeg = new THREE.Mesh(l14SegBackGeo, boucleIvoryMat);
    backSeg.position.set(bx, 0.46, bz);
    backSeg.rotation.y = ang - Math.PI / 2;
    lvl14Group.add(seatSeg, backSeg);

    if (i === 0 || i === 7) {
      const armBolster = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.92, 14)),
        boucleIvoryMat,
      );
      armBolster.rotation.x = Math.PI / 2;
      armBolster.rotation.z = -(ang - Math.PI / 2);
      armBolster.position.set(sx, 0.44, sz);
      lvl14Group.add(armBolster);
    }

    if (i === 2 || i === 4 || i === 6) {
      const cushion = new THREE.Mesh(
        l14PillowGeo,
        i === 4 ? taupeThrowMat : saddleLeatherMat,
      );
      cushion.position.set(-1.05 - Math.cos(ang) * 2.12, 0.5, -1.45 + Math.sin(ang) * 2.02);
      cushion.rotation.y = ang - Math.PI / 2 + 0.14;
      cushion.rotation.x = -0.22;
      lvl14Group.add(cushion);
    }
  }
  const l14Ottoman = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.58, 0.54, 0.36, 22)),
    boucleIvoryMat,
  );
  l14Ottoman.position.set(0.65, 0.21, -0.45);
  lvl14Group.add(l14Ottoman);

  // Architectural bronze interior glazing mullions + Tall Floor-to-Ceiling Sheer Linen Corner Curtains
  const lvl14MullGeo = trackGeo(new THREE.BoxGeometry(0.14, 5.1, 0.22));
  for (let mx = -6.0; mx <= 6.0; mx += 2.4) {
    const mSouth = new THREE.Mesh(lvl14MullGeo, gunmetalSteelMat);
    mSouth.position.set(mx, 2.55, 7.6);
    lvl14Group.add(mSouth);
  }
  for (let mz = -4.8; mz <= 5.0; mz += 2.45) {
    const mEast = new THREE.Mesh(lvl14MullGeo, gunmetalSteelMat);
    mEast.rotation.y = Math.PI / 2;
    mEast.position.set(7.6, 2.55, mz);
    const mWest = new THREE.Mesh(lvl14MullGeo, gunmetalSteelMat);
    mWest.rotation.y = Math.PI / 2;
    mWest.position.set(-7.6, 2.55, mz);
    lvl14Group.add(mEast, mWest);
  }

  const l14CurtainGeo = trackGeo(new THREE.CylinderGeometry(0.13, 0.15, 4.95, 10, 1, true));
  const addSheerCurtainSet = (parent: THREE.Group, x: number, y: number, z: number, alongZ: boolean) => {
    for (let p = 0; p < 4; p++) {
      const fold = new THREE.Mesh(l14CurtainGeo, sheerLinenMat);
      const offset = (p - 1.5) * 0.16;
      fold.position.set(
        alongZ ? x + (p % 2) * 0.08 : x + offset,
        y,
        alongZ ? z + offset : z + (p % 2) * 0.08,
      );
      fold.scale.set(alongZ ? 1.35 : 0.85, 1, alongZ ? 0.85 : 1.35);
      fold.renderOrder = 4;
      parent.add(fold);
    }
  };
  addSheerCurtainSet(lvl14Group, -6.75, 2.48, 7.22, false);
  addSheerCurtainSet(lvl14Group, 6.75, 2.48, 7.22, false);
  addSheerCurtainSet(lvl14Group, -7.22, 2.48, 6.2, true);
  addSheerCurtainSet(lvl14Group, 7.22, 2.48, 6.2, true);

  // Low Monolithic Dark-Marble Coffee Table + Architectural Monographs + Abstract Brass Sculpture
  const ctMarblePlinth = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.45, 0.24, 0.9)),
    darkMarbleMat,
  );
  ctMarblePlinth.position.set(-0.95, 0.14, -1.65);
  const ctMarbleTop = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(2.05, 0.09, 1.25)),
    darkMarbleMat,
  );
  ctMarbleTop.position.set(-0.95, 0.3, -1.65);
  const l14Book1 = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.42, 0.05, 0.32)),
    boucleIvoryMat,
  );
  l14Book1.position.set(-1.35, 0.37, -1.55);
  l14Book1.rotation.y = 0.18;
  const l14Book2 = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.35, 0.045, 0.27)),
    taupeThrowMat,
  );
  l14Book2.position.set(-1.34, 0.42, -1.56);
  l14Book2.rotation.y = 0.04;
  const brassPlinth = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.22, 0.05, 0.22)),
    gunmetalSteelMat,
  );
  brassPlinth.position.set(-0.48, 0.37, -1.72);
  const brassSculpture = new THREE.Mesh(
    trackGeo(new THREE.TorusKnotGeometry(0.11, 0.032, 36, 8, 2, 3)),
    brushedBronzeMat,
  );
  brassSculpture.position.set(-0.48, 0.52, -1.72);
  lvl14Group.add(ctMarblePlinth, ctMarbleTop, l14Book1, l14Book2, brassPlinth, brassSculpture);

  // Sculpted bronze floor lamp beside sofa
  const lampStemGeo = trackGeo(new THREE.CylinderGeometry(0.04, 0.05, 2.05, 8));
  const lampStem = new THREE.Mesh(lampStemGeo, brushedBronzeMat);
  lampStem.position.set(1.35, 1.02, 0.15);
  const lampShadeGeo = trackGeo(new THREE.CylinderGeometry(0.28, 0.38, 0.42, 14));
  const lampShade = new THREE.Mesh(lampShadeGeo, coveAmberMat);
  lampShade.position.set(1.35, 2.1, 0.15);
  lvl14Group.add(lampStem, lampShade);

  // Interior panoramic glazing panes for Level 14 (independent from culled exterior shell)
  const l14SouthGlass = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(15.2, 5.1, 0.08)),
    acousticGlassMat,
  );
  l14SouthGlass.position.set(0, 2.55, 7.6);
  l14SouthGlass.renderOrder = 2;
  const l14SideGlassGeo = trackGeo(new THREE.BoxGeometry(0.08, 5.1, 13.4));
  const l14EastGlass = new THREE.Mesh(l14SideGlassGeo, acousticGlassMat);
  l14EastGlass.position.set(7.6, 2.55, 1.0);
  l14EastGlass.renderOrder = 2;
  const l14WestGlass = new THREE.Mesh(l14SideGlassGeo, acousticGlassMat);
  l14WestGlass.position.set(-7.6, 2.55, 1.0);
  l14WestGlass.renderOrder = 2;
  lvl14Group.add(l14SouthGlass, l14EastGlass, l14WestGlass);

  // Formal Private Residence Foyer Entrance on Level 14 Rear Stone Wall
  addFoyerPortal(lvl14Group, 3.8, 0.0, -5.2, textures.plaqueLvl14);

  group.add(lvl14Group);

  const crownGroups: THREE.Group[] = [];
  const phFlameTongues: THREE.Mesh[] = [];

  for (let tIdx = 0; tIdx < towerCentersX.length; tIdx++) {
    const cx = towerCentersX[tIdx];
    const crownGroup = new THREE.Group();
    crownGroup.position.set(cx, 170, 0);
    crownGroups.push(crownGroup);

    if (tIdx === 1) {
      // =====================================================================
      // WALKABLE INTERIOR 3 · LEVEL 68 CROWN TRIPLEX PENTHOUSE (East Tower)
      // =====================================================================
      // Continuous smoked-oak plank floor extending onto cantilevered South sky terrace
      const phFloorGeo = trackGeo(new THREE.BoxGeometry(10.8, 0.24, 11.8));
      const phFloor = new THREE.Mesh(phFloorGeo, smokedOakMat);
      phFloor.position.set(0, 0.36, 0.45);
      phFloor.userData.walkableRoomId = 'lvl-68';
      crownGroup.add(phFloor);
      walkableFloors.push(phFloor);

      // Enclosed acoustic glazing (North/West/East) + slim bronze sliding terrace portal at Z = +3.25
      const phGlassNGeo = trackGeo(new THREE.BoxGeometry(10.6, 11.0, 0.12));
      const phGlassN = new THREE.Mesh(phGlassNGeo, acousticGlassMat);
      phGlassN.position.set(0, 5.9, -5.25);
      const phGlassWGeo = trackGeo(new THREE.BoxGeometry(0.12, 11.0, 8.6));
      const phGlassW = new THREE.Mesh(phGlassWGeo, acousticGlassMat);
      phGlassW.position.set(-5.25, 5.9, -1.0);
      const phGlassE = new THREE.Mesh(phGlassWGeo, acousticGlassMat);
      phGlassE.position.set(5.25, 5.9, -1.0);
      phGlassN.renderOrder = 2;
      phGlassW.renderOrder = 2;
      phGlassE.renderOrder = 2;
      crownGroup.add(phGlassN, phGlassW, phGlassE);

      // Slim Bronze Sliding Terrace Portal Framing (leaves wide open center doorway at Z = +3.25)
      const portalSideGlassGeo = trackGeo(new THREE.BoxGeometry(2.9, 10.6, 0.08));
      const portalGlassL = new THREE.Mesh(portalSideGlassGeo, acousticGlassMat);
      portalGlassL.position.set(-3.8, 5.7, 3.25);
      const portalGlassR = new THREE.Mesh(portalSideGlassGeo, acousticGlassMat);
      portalGlassR.position.set(3.8, 5.7, 3.25);
      const portalPostGeo = trackGeo(new THREE.BoxGeometry(0.16, 10.8, 0.24));
      const portalPostL = new THREE.Mesh(portalPostGeo, gunmetalSteelMat);
      portalPostL.position.set(-2.35, 5.8, 3.25);
      const portalPostR = new THREE.Mesh(portalPostGeo, gunmetalSteelMat);
      portalPostR.position.set(2.35, 5.8, 3.25);
      const portalHeader = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(10.6, 0.28, 0.28)),
        gunmetalSteelMat,
      );
      portalHeader.position.set(0, 11.15, 3.25);
      crownGroup.add(portalGlassL, portalGlassR, portalPostL, portalPostR, portalHeader);

      // Clear low-iron sky-terrace balustrade along South cantilevered deck (Z = +6.25)
      const terraceRailGeo = trackGeo(new THREE.BoxGeometry(10.8, 1.05, 0.08));
      const terraceRail = new THREE.Mesh(terraceRailGeo, clearWeirGlassMat);
      terraceRail.position.set(0, 1.02, 6.25);
      terraceRail.renderOrder = 4;
      crownGroup.add(terraceRail);

      // Self-contained sculpted multi-crown olive planters flanking South terrace corners
      const phPlanterGeo = trackGeo(new THREE.BoxGeometry(1.15, 0.52, 1.15));
      const phTrunkGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.11, 1.45, 7));
      const phCanopyLgGeo = trackGeo(new THREE.IcosahedronGeometry(0.46, 1));
      const phCanopySmGeo = trackGeo(new THREE.IcosahedronGeometry(0.36, 1));
      for (const px of [-4.75, 4.75]) {
        const pBox = new THREE.Mesh(phPlanterGeo, gunmetalSteelMat);
        pBox.position.set(px, 0.74, 5.65);
        const pTrunk = new THREE.Mesh(phTrunkGeo, trunkMat);
        pTrunk.position.set(px, 1.58, 5.65);
        const pCrownA = new THREE.Mesh(phCanopyLgGeo, canopyMat);
        pCrownA.position.set(px, 2.36, 5.65);
        const pCrownB = new THREE.Mesh(phCanopySmGeo, canopyMat);
        pCrownB.position.set(px + Math.sign(px) * -0.24, 2.58, 5.52);
        const pCrownC = new THREE.Mesh(phCanopySmGeo, hedgeMat);
        pCrownC.position.set(px + Math.sign(px) * 0.22, 2.22, 5.76);
        crownGroup.add(pBox, pTrunk, pCrownA, pCrownB, pCrownC);
      }

      // L-SHAPED SOLID STONE ELEVATOR CORE SPINE (Anchors staircase & houses private foyer entrance)
      const phCoreNorth = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(7.9, 10.65, 0.36)),
        honedTravertineBarMat,
      );
      phCoreNorth.position.set(-1.25, 5.8, -5.12);
      const phCoreWestCheek = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.36, 10.65, 4.15)),
        honedTravertineBarMat,
      );
      phCoreWestCheek.position.set(-5.1, 5.8, -3.15);
      crownGroup.add(phCoreNorth, phCoreWestCheek);
      addFoyerPortal(crownGroup, 0.9, 0.48, -4.9, textures.plaqueLvl68);

      // GRAND CORE-ANCHORED CURVED BRONZE STAIRCASE (Anchored to West & North Stone Core Walls)
      const stepOakGeo = trackGeo(new THREE.BoxGeometry(1.54, 0.09, 0.52));
      const stepCradleGeo = trackGeo(new THREE.BoxGeometry(1.62, 0.06, 0.56));
      const stepLedGeo = trackGeo(new THREE.BoxGeometry(1.4, 0.035, 0.09));
      const balusterGeo = trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.96, 8));
      const anchorStrutGeo = trackGeo(new THREE.BoxGeometry(0.68, 0.1, 0.14));

      const innerStringerPts: THREE.Vector3[] = [];
      const outerStringerPts: THREE.Vector3[] = [];
      const railPts: THREE.Vector3[] = [];

      for (let s = 0; s < 16; s++) {
        const u = s / 15;
        const ang = -0.15 + u * 1.97;
        const sx = -1.9 - Math.cos(ang) * 2.25;
        const sz = -1.45 - Math.sin(ang) * 2.35;
        const sy = 0.68 + u * 5.06;

        const stepOak = new THREE.Mesh(stepOakGeo, smokedOakMat);
        stepOak.position.set(sx, sy, sz);
        stepOak.rotation.y = -ang;

        const stepCradle = new THREE.Mesh(stepCradleGeo, brushedBronzeMat);
        stepCradle.position.set(sx, sy - 0.07, sz);
        stepCradle.rotation.y = -ang;

        const stepLed = new THREE.Mesh(stepLedGeo, coveAmberMat);
        stepLed.position.set(
          sx - Math.sin(ang) * 0.14,
          sy - 0.11,
          sz + Math.cos(ang) * 0.14,
        );
        stepLed.rotation.y = -ang;

        const dirX = Math.cos(ang);
        const dirZ = Math.sin(ang);
        const bx = sx + dirX * 0.72;
        const bz = sz + dirZ * 0.72;

        const baluster = new THREE.Mesh(balusterGeo, brushedBronzeMat);
        baluster.position.set(bx, sy + 0.48, bz);
        crownGroup.add(stepOak, stepCradle, stepLed, baluster);

        // Architectural bronze wall-mount anchor brackets tying outer stringer into solid stone core
        if (s % 3 === 1) {
          const anchor = new THREE.Mesh(anchorStrutGeo, gunmetalSteelMat);
          anchor.position.set(sx - dirX * 0.92, sy - 0.08, sz - dirZ * 0.92);
          anchor.rotation.y = -ang;
          crownGroup.add(anchor);
        }

        innerStringerPts.push(new THREE.Vector3(bx, sy - 0.08, bz));
        outerStringerPts.push(
          new THREE.Vector3(sx - dirX * 0.76, sy - 0.08, sz - dirZ * 0.76),
        );
        railPts.push(new THREE.Vector3(bx, sy + 0.96, bz));
      }

      const innerStrGeo = trackGeo(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(innerStringerPts), 32, 0.085, 8, false),
      );
      const outerStrGeo = trackGeo(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(outerStringerPts), 32, 0.095, 8, false),
      );
      const stairRailGeo = trackGeo(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPts), 32, 0.055, 8, false),
      );
      crownGroup.add(
        new THREE.Mesh(innerStrGeo, gunmetalSteelMat),
        new THREE.Mesh(outerStrGeo, brushedBronzeMat),
        new THREE.Mesh(stairRailGeo, brushedBronzeMat),
      );

      // WRAPAROUND L-SHAPED UPPER OBSERVATION MEZZANINE GALLERY (North Bedroom Wing + East Overlook Gallery)
      const mezzNorthDeck = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(6.65, 0.28, 3.65)),
        smokedOakMat,
      );
      mezzNorthDeck.position.set(1.85, 5.75, -3.12);
      mezzNorthDeck.userData.walkableRoomId = 'lvl-68';
      walkableFloors.push(mezzNorthDeck);

      const mezzEastDeck = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.25, 0.28, 4.35)),
        smokedOakMat,
      );
      mezzEastDeck.position.set(3.55, 5.75, 0.88);
      mezzEastDeck.userData.walkableRoomId = 'lvl-68';
      walkableFloors.push(mezzEastDeck);
      crownGroup.add(mezzNorthDeck, mezzEastDeck);

      // Continuous Bronze-Capped Glass Balustrades along all open L-shaped gallery edges
      const addMezzRailSegment = (
        x: number,
        z: number,
        len: number,
        alongZ: boolean,
      ) => {
        const edgeBeam = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(alongZ ? 0.14 : len + 0.08, 0.14, alongZ ? len + 0.08 : 0.14)),
          brushedBronzeMat,
        );
        edgeBeam.position.set(x, 5.75, z);
        const glass = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(alongZ ? 0.06 : len, 1.05, alongZ ? len : 0.06)),
          clearWeirGlassMat,
        );
        glass.position.set(x, 6.41, z);
        glass.renderOrder = 4;
        const cap = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(alongZ ? 0.08 : len + 0.04, 0.05, alongZ ? len + 0.04 : 0.08)),
          brushedBronzeMat,
        );
        cap.position.set(x, 6.95, z);
        crownGroup.add(edgeBeam, glass, cap);
      };
      // North-wing South overlook edge (X = -1.45 -> +1.95 at Z = -1.32)
      addMezzRailSegment(0.25, -1.32, 3.4, false);
      // East-wing West overlook edge (Z = -1.32 -> +3.03 at X = +1.95)
      addMezzRailSegment(1.95, 0.855, 4.35, true);
      // East-wing South overlook edge (X = +1.95 -> +5.15 at Z = +3.03)
      addMezzRailSegment(3.55, 3.03, 3.2, false);
      // West stairwell return rail (Z = -2.95 -> -1.32 at X = -1.45, leaving top landing Z = -4.5..-2.95 open)
      addMezzRailSegment(-1.45, -2.135, 1.63, true);

      // FURNISHED UPPER SKY-BEDROOM & OBSERVATION GALLERY (Mezzanine Floor Top = 5.89)
      const upRug = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(4.2, 0.035, 2.75)),
        woolRugMat,
      );
      upRug.position.set(1.9, 5.91, -3.45);
      crownGroup.add(upRug);

      // Executive King-Size Dark-Oak Platform Bed + Upholstered Headboard + Crisp Layered Linen
      const bedPlatform = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.26, 0.24, 2.28)),
        smokedOakMat,
      );
      bedPlatform.position.set(1.9, 6.01, -3.65);
      const bedHeadboard = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.85, 1.25, 0.14)),
        taupeThrowMat,
      );
      bedHeadboard.position.set(1.9, 6.56, -4.84);
      const bedMattress = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.02, 0.25, 2.04)),
        boucleIvoryMat,
      );
      bedMattress.position.set(1.9, 6.26, -3.65);
      const bedDuvetFold = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.06, 0.27, 1.38)),
        boucleIvoryMat,
      );
      bedDuvetFold.position.set(1.9, 6.27, -3.3);
      const bedThrow = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.08, 0.28, 0.62)),
        taupeThrowMat,
      );
      bedThrow.position.set(1.9, 6.28, -2.85);
      crownGroup.add(bedPlatform, bedHeadboard, bedMattress, bedDuvetFold, bedThrow);

      const pillowGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.14, 0.36));
      for (const px of [1.42, 2.38]) {
        const pRear = new THREE.Mesh(pillowGeo, boucleIvoryMat);
        pRear.position.set(px, 6.46, -4.48);
        pRear.rotation.x = 0.28;
        const pFront = new THREE.Mesh(pillowGeo, taupeThrowMat);
        pFront.position.set(px, 6.44, -4.26);
        pFront.rotation.x = 0.22;
        crownGroup.add(pRear, pFront);
      }

      // Twin Floating Dark-Oak Bedside Nightstands + Warm Wall-Mounted Bronze Bedside Sconces
      const nsFloatGeo = trackGeo(new THREE.BoxGeometry(0.58, 0.26, 0.44));
      const sconcePlateGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.42, 0.05));
      const sconceShadeGeo = trackGeo(new THREE.CylinderGeometry(0.065, 0.085, 0.24, 12));
      for (const nx of [0.35, 3.45]) {
        const nsFloat = new THREE.Mesh(nsFloatGeo, smokedOakMat);
        nsFloat.position.set(nx, 6.18, -4.55);
        const nsRim = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(0.6, 0.03, 0.46)),
          brushedBronzeMat,
        );
        nsRim.position.set(nx, 6.32, -4.55);
        const scPlate = new THREE.Mesh(sconcePlateGeo, brushedBronzeMat);
        scPlate.position.set(nx, 6.82, -4.74);
        const scShade = new THREE.Mesh(sconceShadeGeo, coveLineMat);
        scShade.position.set(nx, 6.86, -4.64);
        crownGroup.add(nsFloat, nsRim, scPlate, scShade);
      }

      // Smoked-Glass Wardrobe along East Mezzanine Wall
      const wardBack = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.1, 2.75, 2.55)),
        smokedOakMat,
      );
      wardBack.position.set(5.05, 7.26, -3.45);
      const wardTop = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.84, 0.08, 2.58)),
        gunmetalSteelMat,
      );
      wardTop.position.set(4.68, 8.65, -3.45);
      const wardBot = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.84, 0.08, 2.58)),
        gunmetalSteelMat,
      );
      wardBot.position.set(4.68, 5.93, -3.45);
      const wardGlass = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.05, 2.66, 2.48)),
        smokedGlassMat,
      );
      wardGlass.position.set(4.28, 7.29, -3.45);
      wardGlass.renderOrder = 3;
      const wardStrip = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.05, 2.55, 0.06)),
        coveAmberMat,
      );
      wardStrip.position.set(4.94, 7.29, -2.3);
      const wardShelf = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.68, 0.05, 2.4)),
        smokedOakMat,
      );
      wardShelf.position.set(4.68, 7.55, -3.45);
      crownGroup.add(wardBack, wardTop, wardBot, wardGlass, wardStrip, wardShelf);

      // East Mezzanine Observation Gallery Lounge Armchair & Bronze Pedestal Side Table
      const obsChairSeat = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.46, 0.42, 0.36, 18)),
        boucleIvoryMat,
      );
      obsChairSeat.position.set(3.85, 6.08, 1.35);
      const obsChairBack = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.48, 0.48, 0.46, 18, 1, false, Math.PI * 0.35, Math.PI * 1.15)),
        boucleIvoryMat,
      );
      obsChairBack.position.set(3.85, 6.4, 1.35);
      const obsSideTable = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.24, 0.16, 0.48, 16)),
        brushedBronzeMat,
      );
      obsSideTable.position.set(3.85, 6.13, 2.15);
      crownGroup.add(obsChairSeat, obsChairBack, obsSideTable);

      // HONED TRAVERTINE & BACKLIT FLUTED ONYX COCKTAIL BAR (East wall)
      const barBaseGeo = trackGeo(new THREE.BoxGeometry(1.12, 1.06, 3.25));
      const barBase = new THREE.Mesh(barBaseGeo, honedTravertineBarMat);
      barBase.position.set(2.92, 1.01, -1.2);
      const barApronGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.88, 2.95));
      const barApron = new THREE.Mesh(barApronGeo, flutedCedarMat);
      barApron.position.set(2.34, 0.96, -1.2);
      const barTopGeo = trackGeo(new THREE.BoxGeometry(1.32, 0.11, 3.4));
      const barTop = new THREE.Mesh(barTopGeo, honedTravertineBarMat);
      barTop.position.set(2.92, 1.59, -1.2);
      const barLipGeo = trackGeo(new THREE.BoxGeometry(1.36, 0.04, 3.44));
      const barLip = new THREE.Mesh(barLipGeo, brushedBronzeMat);
      barLip.position.set(2.92, 1.54, -1.2);

      // Glowing Backlit Fluted Onyx Backsplash + Architectural Bronze Bottle & Glassware Shelving
      const barBackGeo = trackGeo(new THREE.BoxGeometry(0.16, 2.95, 3.1));
      const barBack = new THREE.Mesh(barBackGeo, backlitOnyxMat);
      barBack.position.set(4.84, 2.4, -1.2);
      const barShelfGeo = trackGeo(new THREE.BoxGeometry(0.36, 0.05, 2.94));
      const barShelfTop = new THREE.Mesh(barShelfGeo, brushedBronzeMat);
      barShelfTop.position.set(4.62, 3.25, -1.2);
      const barShelfMid = new THREE.Mesh(barShelfGeo, brushedBronzeMat);
      barShelfMid.position.set(4.62, 2.58, -1.2);
      const barShelfBot = new THREE.Mesh(barShelfGeo, brushedBronzeMat);
      barShelfBot.position.set(4.62, 1.9, -1.2);

      const barPostGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 1.55, 8));
      for (const bz of [-2.6, -1.2, 0.2]) {
        const bPost = new THREE.Mesh(barPostGeo, brushedBronzeMat);
        bPost.position.set(4.48, 2.6, bz);
        crownGroup.add(bPost);
      }

      const tapStemGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.032, 0.34, 10));
      const tapSpoutGeo = trackGeo(new THREE.BoxGeometry(0.12, 0.03, 0.03));
      for (const tz of [-1.45, -1.15]) {
        const tStem = new THREE.Mesh(tapStemGeo, brushedBronzeMat);
        tStem.position.set(3.25, 1.81, tz);
        const tSpout = new THREE.Mesh(tapSpoutGeo, brushedBronzeMat);
        tSpout.position.set(3.19, 1.96, tz);
        crownGroup.add(tStem, tSpout);
      }

      const glassGeo = trackGeo(new THREE.CylinderGeometry(0.045, 0.038, 0.16, 10));
      const bottleGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.055, 0.32, 10));
      for (let gz = -2.35; gz <= -0.05; gz += 0.38) {
        const glass = new THREE.Mesh(glassGeo, clearWeirGlassMat);
        glass.position.set(4.6, 2.01, gz);
        const bottle = new THREE.Mesh(bottleGeo, lanternGlassMat);
        bottle.position.set(4.62, 2.77, gz);
        const topGlass = new THREE.Mesh(glassGeo, clearWeirGlassMat);
        topGlass.position.set(4.6, 3.36, gz);
        crownGroup.add(glass, bottle, topGlass);
      }
      crownGroup.add(
        barBase,
        barApron,
        barTop,
        barLip,
        barBack,
        barShelfTop,
        barShelfMid,
        barShelfBot,
      );

      // 3 Minimalist Upholstered Saddle-Leather Barstools
      const stoolFootGeo = trackGeo(new THREE.CylinderGeometry(0.19, 0.21, 0.035, 16));
      const stoolStemGeo = trackGeo(new THREE.CylinderGeometry(0.032, 0.038, 0.72, 10));
      const stoolRingGeo = trackGeo(new THREE.TorusGeometry(0.16, 0.014, 6, 16));
      stoolRingGeo.rotateX(Math.PI / 2);
      const stoolSeatGeo = trackGeo(new THREE.CylinderGeometry(0.24, 0.22, 0.11, 16));
      const stoolLumbarGeo = trackGeo(new THREE.BoxGeometry(0.07, 0.16, 0.36));
      for (const sz of [-2.05, -1.2, -0.35]) {
        const sFoot = new THREE.Mesh(stoolFootGeo, brushedBronzeMat);
        sFoot.position.set(2.04, 0.5, sz);
        const sStem = new THREE.Mesh(stoolStemGeo, brushedBronzeMat);
        sStem.position.set(2.04, 0.86, sz);
        const sRing = new THREE.Mesh(stoolRingGeo, brushedBronzeMat);
        sRing.position.set(2.04, 0.72, sz);
        const sSeat = new THREE.Mesh(stoolSeatGeo, saddleLeatherMat);
        sSeat.position.set(2.04, 1.25, sz);
        const sLumbar = new THREE.Mesh(stoolLumbarGeo, saddleLeatherMat);
        sLumbar.position.set(1.84, 1.35, sz);
        crownGroup.add(sFoot, sStem, sRing, sSeat, sLumbar);
      }

      // Lower Salon Smoked-Oak Credenza against North-East Stone Wall + Floor-to-Ceiling Sheer Corner Curtains
      const phCredBody = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(1.9, 0.62, 0.52)),
        smokedOakMat,
      );
      phCredBody.position.set(3.6, 0.83, -4.68);
      const phCredTop = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(1.96, 0.05, 0.56)),
        darkMarbleMat,
      );
      phCredTop.position.set(3.6, 1.16, -4.68);
      crownGroup.add(phCredBody, phCredTop);

      const phCurtainGeo = trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 10.6, 10, 1, true));
      const addPhCurtain = (x: number, z: number) => {
        for (let p = 0; p < 4; p++) {
          const cf = new THREE.Mesh(phCurtainGeo, sheerLinenMat);
          cf.position.set(x + (p - 1.5) * 0.16, 5.8, z + (p % 2) * 0.09);
          cf.scale.set(0.85, 1, 1.35);
          cf.renderOrder = 4;
          crownGroup.add(cf);
        }
      };
      addPhCurtain(-4.65, 2.85);
      addPhCurtain(4.65, 2.85);
      addPhCurtain(4.65, -4.85);

      // PENTHOUSE LOUNGE: Massive Circular Woven Wool Rug + Curved Organic Ivory Boucle Sectional
      const phRug = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(2.65, 2.65, 0.035, 36)),
        woolRugMat,
      );
      phRug.position.set(-0.55, 0.5, 1.15);
      crownGroup.add(phRug);

      const segSeatGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.36, 0.92));
      const segBackGeo = trackGeo(new THREE.BoxGeometry(0.76, 0.44, 0.26));
      const cushionGeo = trackGeo(new THREE.BoxGeometry(0.32, 0.3, 0.14));
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const ang = -0.35 + t * 2.1; // graceful arc cradling the coffee table
        const cxSeat = -0.25 - Math.cos(ang) * 1.48;
        const czSeat = 1.15 - Math.sin(ang) * 1.15;
        const seg = new THREE.Mesh(segSeatGeo, boucleIvoryMat);
        seg.position.set(cxSeat, 0.68, czSeat);
        seg.rotation.y = -ang + Math.PI / 2;

        const cxBack = -0.25 - Math.cos(ang) * 1.88;
        const czBack = 1.15 - Math.sin(ang) * 1.5;
        const bSeg = new THREE.Mesh(segBackGeo, boucleIvoryMat);
        bSeg.position.set(cxBack, 0.9, czBack);
        bSeg.rotation.y = -ang + Math.PI / 2;
        crownGroup.add(seg, bSeg);

        if (i === 0 || i === 5) {
          const armWrap = new THREE.Mesh(
            trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.9, 14)),
            boucleIvoryMat,
          );
          armWrap.rotation.x = Math.PI / 2;
          armWrap.rotation.z = -(-ang + Math.PI / 2);
          armWrap.position.set(cxSeat, 0.9, czSeat);
          crownGroup.add(armWrap);
        }

        if (i === 1 || i === 3 || i === 4) {
          const throwP = new THREE.Mesh(
            cushionGeo,
            i === 3 ? taupeThrowMat : saddleLeatherMat,
          );
          throwP.position.set(cxSeat - Math.cos(ang) * 0.22, 0.96, czSeat - Math.sin(ang) * 0.2);
          throwP.rotation.y = -ang + Math.PI / 2 + 0.18;
          throwP.rotation.x = -0.22;
          crownGroup.add(throwP);
        }
      }

      // Low Monolithic Dark-Marble Coffee Table + Architectural Monographs + Abstract Brass Sculpture
      const ctBase = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.46, 0.52, 0.28, 24)),
        darkMarbleMat,
      );
      ctBase.position.set(-0.22, 0.64, 1.28);
      const ctRimGeo = trackGeo(new THREE.TorusGeometry(0.79, 0.024, 8, 32));
      ctRimGeo.rotateX(Math.PI / 2);
      const ctRim = new THREE.Mesh(ctRimGeo, brushedBronzeMat);
      ctRim.position.set(-0.22, 0.83, 1.28);
      const ctMarbleSlab = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.78, 0.78, 0.08, 32)),
        darkMarbleMat,
      );
      ctMarbleSlab.position.set(-0.22, 0.83, 1.28);

      const book1 = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.42, 0.055, 0.32)),
        boucleIvoryMat,
      );
      book1.position.set(-0.36, 0.9, 1.32);
      book1.rotation.y = 0.22;
      const book2 = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.36, 0.045, 0.28)),
        gunmetalSteelMat,
      );
      book2.position.set(-0.35, 0.95, 1.3);
      book2.rotation.y = 0.05;
      const phSculptureBase = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.2, 0.04, 0.2)),
        gunmetalSteelMat,
      );
      phSculptureBase.position.set(0.1, 0.89, 1.22);
      const phBrassKnot = new THREE.Mesh(
        trackGeo(new THREE.TorusKnotGeometry(0.11, 0.03, 36, 8, 2, 3)),
        brushedBronzeMat,
      );
      phBrassKnot.position.set(0.1, 1.03, 1.22);
      crownGroup.add(ctBase, ctRim, ctMarbleSlab, book1, book2, phSculptureBase, phBrassKnot);

      // DARK BASALT FIREPLACE MONOLITH & INSET LINEAR GAS FIRE-RIBBON HEARTH (Z = +4.85)
      const firePlinthGeo = trackGeo(new THREE.BoxGeometry(3.05, 0.42, 0.94));
      const firePlinth = new THREE.Mesh(firePlinthGeo, darkBasaltMat);
      firePlinth.position.set(-1.55, 0.69, 4.88);
      const fireWallBack = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.05, 1.15, 0.34)),
        darkBasaltMat,
      );
      fireWallBack.position.set(-1.55, 1.46, 5.18);
      const fireWallCap = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.12, 0.14, 0.88)),
        darkBasaltMat,
      );
      fireWallCap.position.set(-1.55, 1.98, 4.91);
      const fireWallTrim = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(3.16, 0.04, 0.92)),
        brushedBronzeMat,
      );
      fireWallTrim.position.set(-1.55, 2.06, 4.91);

      const fireTrayGeo = trackGeo(new THREE.BoxGeometry(2.35, 0.06, 0.38));
      const fireTray = new THREE.Mesh(fireTrayGeo, brushedBronzeMat);
      fireTray.position.set(-1.55, 0.91, 4.82);
      const fireLavaBed = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.24, 0.04, 0.3)),
        gunmetalSteelMat,
      );
      fireLavaBed.position.set(-1.55, 0.93, 4.82);
      const fireEmberGeo = trackGeo(new THREE.BoxGeometry(2.1, 0.04, 0.14));
      const fireEmberStrip = new THREE.Mesh(fireEmberGeo, emberGlowMat);
      fireEmberStrip.position.set(-1.55, 0.95, 4.82);
      crownGroup.add(
        firePlinth,
        fireWallBack,
        fireWallCap,
        fireWallTrim,
        fireTray,
        fireLavaBed,
        fireEmberStrip,
      );

      const tongueGeo = trackGeo(new THREE.ConeGeometry(0.065, 0.3, 8));
      for (let f = 0; f < 11; f++) {
        const fx = -2.52 + f * 0.194;
        const tongue = new THREE.Mesh(tongueGeo, f % 2 === 0 ? emberGlowMat : coveAmberMat);
        tongue.position.set(fx, 1.09, 4.82 + ((f % 3) - 1) * 0.02);
        crownGroup.add(tongue);
        phFlameTongues.push(tongue);
      }

      // LAYERED DARK-OAK COFFERED CEILING WITH WARM EMISSIVE PERIMETER GLOW LINES (#FFB86C, intensity 1.2)
      const phCeilingGeo = trackGeo(new THREE.BoxGeometry(10.8, 0.45, 8.8));
      const phCeiling = new THREE.Mesh(phCeilingGeo, interiorCeilingMat);
      phCeiling.position.set(0, 11.45, -1.0);
      crownGroup.add(phCeiling);

      const phBeamXGeo = trackGeo(new THREE.BoxGeometry(10.4, 0.32, 0.44));
      const phBeamZGeo = trackGeo(new THREE.BoxGeometry(0.44, 0.32, 8.2));
      const phCofferGlowXGeo = trackGeo(new THREE.BoxGeometry(2.8, 0.04, 0.08));
      const phCofferGlowZGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.04, 3.35));
      for (const bz of [-4.95, -1.0, 2.95]) {
        const beam = new THREE.Mesh(phBeamXGeo, smokedOakMat);
        beam.position.set(0, 11.08, bz);
        crownGroup.add(beam);
      }
      for (const bx of [-4.95, -1.65, 1.65, 4.95]) {
        const beam = new THREE.Mesh(phBeamZGeo, smokedOakMat);
        beam.position.set(bx, 11.08, -1.0);
        crownGroup.add(beam);
      }
      for (const cx of [-3.3, 0, 3.3]) {
        for (const cz of [-2.97, 0.97]) {
          const gN = new THREE.Mesh(phCofferGlowXGeo, coveLineMat);
          gN.position.set(cx, 11.2, cz - 1.72);
          const gS = new THREE.Mesh(phCofferGlowXGeo, coveLineMat);
          gS.position.set(cx, 11.2, cz + 1.72);
          const gW = new THREE.Mesh(phCofferGlowZGeo, coveLineMat);
          gW.position.set(cx - 1.4, 11.2, cz);
          const gE = new THREE.Mesh(phCofferGlowZGeo, coveLineMat);
          gE.position.set(cx + 1.4, 11.2, cz);
          crownGroup.add(gN, gS, gW, gE);
        }
      }

      const downlightGeo = trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12));
      for (const dx of [-3.3, 0, 3.3]) {
        for (const dz of [-2.97, 0.97]) {
          const dl = new THREE.Mesh(downlightGeo, coveAmberMat);
          dl.position.set(dx, 11.21, dz);
          crownGroup.add(dl);
        }
      }
    } else {
      // West Tower Crown Observatory Lantern Pavilion (tectonic recessed reflective curtain-wall glass)
      const pavCoreGeo = trackGeo(new THREE.BoxGeometry(8.8, 10.6, 8.8));
      const pavCoreMesh = new THREE.Mesh(pavCoreGeo, darkCoreMat);
      pavCoreMesh.position.y = 5.6;

      const pavCoveRing = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(9.6, 0.16, 9.6)),
        coveAmberMat,
      );
      pavCoveRing.position.y = 10.45;

      const pavMidCove = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(9.2, 0.1, 9.2)),
        coveAmberMat,
      );
      pavMidCove.position.y = 5.6;

      const pavFloorDeck = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(10.8, 0.28, 10.8)),
        travertineSlabMat,
      );
      pavFloorDeck.position.y = 0.36;

      const pavGeo = trackGeo(new THREE.BoxGeometry(10.6, 11.2, 10.6));
      const pavMesh = new THREE.Mesh(pavGeo, acousticGlassMat);
      pavMesh.position.y = 5.6;
      pavMesh.renderOrder = 2;
      crownGroup.add(pavCoreMesh, pavCoveRing, pavMidCove, pavFloorDeck, pavMesh);
    }

    // Slender Graphite-Bronze Colonnade Fins + Bronze Pinstripe Edges around Crown Pavilion
    const finGeo = trackGeo(new THREE.BoxGeometry(0.24, 12.2, 0.5));
    const finPinGeo = trackGeo(new THREE.BoxGeometry(0.06, 12.2, 0.54));
    for (let k = -4; k <= 4; k += 2) {
      for (const zSign of [-1, 1]) {
        if (tIdx === 1 && zSign === 1 && Math.abs(k) <= 2) continue;
        const fin = new THREE.Mesh(finGeo, anodizedMullionMat);
        fin.position.set(k * 1.15, 6.1, zSign * 5.45);
        crownGroup.add(fin);
        if (k % 4 === 0) {
          const pin = new THREE.Mesh(finPinGeo, brushedBronzeMat);
          pin.position.set(k * 1.15, 6.1, zSign * 5.47);
          crownGroup.add(pin);
        }
      }
      for (const xSign of [-1, 1]) {
        const fin = new THREE.Mesh(finGeo, anodizedMullionMat);
        fin.rotation.y = Math.PI / 2;
        fin.position.set(xSign * 5.45, 6.1, k * 1.15);
        crownGroup.add(fin);
      }
    }

    // Anodized Bronze Crown Roof Parapet Ring & Recessed Travertine Band
    const roofSlabGeo = trackGeo(new THREE.BoxGeometry(11.8, 0.95, 11.8));
    const roofSlab = new THREE.Mesh(roofSlabGeo, anodizedMullionMat);
    roofSlab.position.y = 12.0;
    crownGroup.add(roofSlab);

    const roofRimGeo = trackGeo(new THREE.BoxGeometry(12.1, 0.24, 12.1));
    const roofRim = new THREE.Mesh(roofRimGeo, brushedBronzeMat);
    roofRim.position.y = 12.56;
    crownGroup.add(roofRim);

    // Landscaped Rooftop Trees & Box Hedges on Y = 170 Crown Penthouse Terrace Corners
    const terraceCorners: [number, number][] = [
      [-5.5, 5.5],
      [5.5, 5.5],
      [-5.5, -5.5],
      [5.5, -5.5],
    ];
    for (const [px, pz] of terraceCorners) {
      addTreeAt(cx + px, 170.4, pz, 0.92);
    }
    if (tIdx === 0) {
      addHedgeAt(cx, 170.4, 5.7, 0, 2.8);
    }
    addHedgeAt(cx, 170.4, -5.7, 0, 2.8);

    // East Tower: Circular Helipad Deck + Beacons; West Tower: Crown Observatory Lantern Spire
    if (tIdx === 1) {
      const heliBaseGeo = trackGeo(new THREE.CylinderGeometry(5.6, 5.8, 0.45, 32));
      const heliBase = new THREE.Mesh(heliBaseGeo, darkCoreMat);
      heliBase.position.y = 12.95;
      crownGroup.add(heliBase);

      const heliTopGeo = trackGeo(new THREE.CircleGeometry(5.3, 32));
      heliTopGeo.rotateX(-Math.PI / 2);
      const heliTopMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: '#FFFFFF',
          map: textures.helipadMap,
          roughness: 0.6,
          metalness: 0.15,
        }),
      );
      const heliTop = new THREE.Mesh(heliTopGeo, heliTopMat);
      heliTop.position.y = 13.2;
      crownGroup.add(heliTop);

      const beaconGeo = trackGeo(new THREE.SphereGeometry(0.18, 8, 8));
      for (let b = 0; b < 8; b++) {
        const ang = (b / 8) * Math.PI * 2;
        const bMesh = new THREE.Mesh(beaconGeo, b % 2 === 0 ? beaconMat : aviationRedMat);
        bMesh.position.set(Math.cos(ang) * 5.2, 13.32, Math.sin(ang) * 5.2);
        crownGroup.add(bMesh);
        beaconMeshes.push(bMesh);
      }
    } else {
      const lanternRingGeo = trackGeo(new THREE.CylinderGeometry(3.8, 4.4, 2.2, 16));
      const lanternRing = new THREE.Mesh(lanternRingGeo, acousticGlassMat);
      lanternRing.position.y = 13.8;
      crownGroup.add(lanternRing);

      const spireGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.32, 7.5, 12));
      const spire = new THREE.Mesh(spireGeo, brushedBronzeMat);
      spire.position.y = 18.2;
      crownGroup.add(spire);

      const tipGeo = trackGeo(new THREE.SphereGeometry(0.24, 10, 10));
      const tipBeacon = new THREE.Mesh(tipGeo, aviationRedMat);
      tipBeacon.position.y = 22.0;
      crownGroup.add(tipBeacon);
      beaconMeshes.push(tipBeacon);
    }

    group.add(crownGroup);
  }

  // Landscaped Setback Terrace Greenery on Level 14 (Y = 62.4) & Level 48 (Y = 126.4)
  for (const cx of towerCentersX) {
    // Level 14 Setback Terrace: Trees at outer corners + clipped boxwood hedges across front & sides
    addTreeAt(cx - 7.1, 62.4, 7.1, 1.05);
    addTreeAt(cx + 7.1, 62.4, 7.1, 1.05);
    addTreeAt(cx - 7.1, 62.4, -7.1, 0.95);
    addTreeAt(cx + 7.1, 62.4, -7.1, 0.95);
    addHedgeAt(cx - 2.6, 62.4, 7.4, 0, 2.4);
    addHedgeAt(cx + 2.6, 62.4, 7.4, 0, 2.4);
    addHedgeAt(cx - 7.4, 62.4, 0, Math.PI / 2, 3.2);
    addHedgeAt(cx + 7.4, 62.4, 0, Math.PI / 2, 3.2);

    // Upper Tier Setback Terrace (Y = 126.4)
    addTreeAt(cx - 6.1, 126.4, 6.1, 0.85);
    addTreeAt(cx + 6.1, 126.4, 6.1, 0.85);
    addHedgeAt(cx, 126.4, 6.4, 0, 3.6);
  }

  // Skybridge Roof Terrace Garden (Y = 95.4)
  addTreeAt(-9.2, 95.4, 5.2, 0.95);
  addTreeAt(9.2, 95.4, 5.2, 0.95);
  addHedgeAt(-4.2, 95.4, 6.2, 0, 2.5);
  addHedgeAt(4.2, 95.4, 6.2, 0, 2.5);

  const plantersInst = new THREE.InstancedMesh(planterBoxGeo, planterMat, planterMatrices.length);
  planterMatrices.forEach((m, i) => plantersInst.setMatrixAt(i, m));
  plantersInst.instanceMatrix.needsUpdate = true;
  plantersInst.computeBoundingSphere();
  group.add(plantersInst);

  const hedgesInst = new THREE.InstancedMesh(hedgeGeo, hedgeMat, hedgeMatrices.length);
  hedgeMatrices.forEach((m, i) => {
    hedgesInst.setMatrixAt(i, m);
    hedgesInst.setColorAt(i, hedgeColors[i]);
  });
  hedgesInst.instanceMatrix.needsUpdate = true;
  if (hedgesInst.instanceColor) hedgesInst.instanceColor.needsUpdate = true;
  hedgesInst.computeBoundingSphere();
  group.add(hedgesInst);

  const trunksInst = new THREE.InstancedMesh(trunkGeo, trunkMat, trunkMatrices.length);
  trunkMatrices.forEach((m, i) => trunksInst.setMatrixAt(i, m));
  trunksInst.instanceMatrix.needsUpdate = true;
  trunksInst.computeBoundingSphere();
  group.add(trunksInst);

  const canopiesInst = new THREE.InstancedMesh(canopyGeo, canopyMat, canopyMatrices.length);
  canopyMatrices.forEach((m, i) => {
    canopiesInst.setMatrixAt(i, m);
    canopiesInst.setColorAt(i, canopyColors[i]);
  });
  canopiesInst.instanceMatrix.needsUpdate = true;
  if (canopiesInst.instanceColor) canopiesInst.instanceColor.needsUpdate = true;
  canopiesInst.computeBoundingSphere();
  group.add(canopiesInst);

  // =========================================================================
  // 5. 3D ACTIVE LEVEL HIGHLIGHT BEACON COLLAR (aureliaFloorBeacon)
  // =========================================================================
  const floorBeaconGroup = new THREE.Group();
  floorBeaconGroup.name = 'aureliaFloorBeacon';

  const beaconCoreGeo = trackGeo(new THREE.BoxGeometry(1, 0.26, 1));
  const beaconHaloGeo = trackGeo(new THREE.BoxGeometry(1, 1.05, 1));

  const beaconCoreMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FFB86C',
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
  );

  const beaconHaloMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#C29B38',
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );

  const makeCollarPair = () => {
    const collar = new THREE.Group();
    const core = new THREE.Mesh(beaconCoreGeo, beaconCoreMat);
    const halo = new THREE.Mesh(beaconHaloGeo, beaconHaloMat);
    core.renderOrder = 6;
    halo.renderOrder = 6;
    collar.add(core, halo);
    return collar;
  };

  const centerBeaconCollar = makeCollarPair();
  const westBeaconCollar = makeCollarPair();
  const eastBeaconCollar = makeCollarPair();
  westBeaconCollar.position.x = -18;
  eastBeaconCollar.position.x = 18;
  floorBeaconGroup.add(centerBeaconCollar, westBeaconCollar, eastBeaconCollar);
  group.add(floorBeaconGroup);

  // =========================================================================
  // PER-FRAME ANIMATION & MODE-SCOPED OCCLUSION CULLING (ZERO HEAP ALLOCATIONS)
  // =========================================================================
  let lastIsolationRoom: WalkthroughLevelId | null = null;

  return {
    group,
    walkableFloors,
    setWalkthroughIsolation: (activeRoomId: WalkthroughLevelId | null) => {
      if (lastIsolationRoom === activeRoomId) return;
      lastIsolationRoom = activeRoomId;

      if (activeRoomId === null) {
        exteriorOverhaul.setVisible(true);
        skybridgeGroup.visible = true;
        lvl14Group.visible = true;
        crownGroups[0].visible = true;
        crownGroups[1].visible = true;
        plantersInst.visible = true;
        hedgesInst.visible = true;
        trunksInst.visible = true;
        canopiesInst.visible = true;
        return;
      }

      // Cull ALL exterior towers, portico, elevators, and unrelated terrace greenery for max interior FPS
      exteriorOverhaul.setVisible(false);
      plantersInst.visible = false;
      hedgesInst.visible = false;
      trunksInst.visible = false;
      canopiesInst.visible = false;

      lvl14Group.visible = activeRoomId === 'lvl-14';
      skybridgeGroup.visible = activeRoomId === 'lvl-34';
      crownGroups[0].visible = false;
      crownGroups[1].visible = activeRoomId === 'lvl-68';
    },
    setBeaconPose: (pose: BeaconPose, elapsedTime: number, visible: boolean) => {
      floorBeaconGroup.visible = visible;
      if (!visible) return;

      const breathe = 0.78 + 0.22 * Math.sin(elapsedTime * 2.8);
      beaconCoreMat.opacity = 0.76 + 0.2 * breathe;
      beaconHaloMat.opacity = 0.2 + 0.16 * breathe;

      floorBeaconGroup.position.y = pose.y;

      if (!pose.isDualTower) {
        centerBeaconCollar.visible = true;
        centerBeaconCollar.position.set(pose.centerX, 0, pose.centerZ);
        centerBeaconCollar.scale.set(pose.width + 0.7, 1, pose.depth + 0.7);
        westBeaconCollar.visible = false;
        eastBeaconCollar.visible = false;
      } else {
        westBeaconCollar.visible = true;
        westBeaconCollar.scale.set(pose.width + 0.65, 1, pose.depth + 0.65);
        eastBeaconCollar.visible = true;
        eastBeaconCollar.scale.set(pose.width + 0.65, 1, pose.depth + 0.65);

        if (pose.isSkybridgeZone) {
          centerBeaconCollar.visible = true;
          centerBeaconCollar.position.set(0, 0, 0.5);
          centerBeaconCollar.scale.set(25.2, 1, 15.1);
        } else {
          centerBeaconCollar.visible = false;
        }
      }
    },
    update: (elapsedTime: number, dt: number) => {
      exteriorOverhaul.update(elapsedTime);

      if (skybridgeGroup.visible) {
        level34Spa.update(elapsedTime, dt);
      }

      if (crownGroups[1].visible) {
        // Gentle flicker on the linear gas fire-ribbon flames
        for (let i = 0; i < phFlameTongues.length; i++) {
          const sy = 0.82 + 0.34 * Math.sin(elapsedTime * 7.2 + i * 1.7);
          phFlameTongues[i].scale.set(1, sy, 1);
        }
      }

      const pulse = 0.65 + 0.35 * Math.sin(elapsedTime * 2.4);
      for (let i = 0; i < beaconMeshes.length; i++) {
        beaconMeshes[i].scale.setScalar(0.85 + pulse * 0.3);
      }
    },
    dispose: () => {
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
    },
  };
}
