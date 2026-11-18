import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  clampProgress,
  computeResponsiveCameraConfig,
  dampScalar,
  findActiveChapter,
  formatAltitudeReadout,
  progressToAltitudeMeters,
  sampleElevatorCameraPose,
} from '../architecture/elevatorRig';
import {
  getInteriorForLevel,
  progressToBeaconPose,
  resolveWalkPose,
  type WalkthroughLevelId,
} from '../architecture/interiors';
import { createLondonAtmosphere } from '../scene/atmosphere';
import { createProceduralTextures } from '../scene/textures';
import { createAureliaTowers } from '../scene/towers';

interface AureliaViewportProps {
  targetProgressRef: React.MutableRefObject<number>;
  isPoolInspecting: boolean;
  isPoolInspectingRef: React.MutableRefObject<boolean>;
  walkthroughLevelId: WalkthroughLevelId | null;
  walkthroughLevelIdRef: React.MutableRefObject<WalkthroughLevelId | null>;
  onActiveChapterChange: (chapterId: string) => void;
  onPoolInspectAutoExit: () => void;
  onAltitudeFrame?: (progress: number) => void;
  altitudeTextRef: React.RefObject<HTMLSpanElement | null>;
  progressFillRef: React.RefObject<HTMLDivElement | null>;
  elevatorCarRef: React.RefObject<HTMLDivElement | null>;
  beaconCalloutRef: React.RefObject<HTMLDivElement | null>;
  beaconLabelRef: React.RefObject<HTMLSpanElement | null>;
  beaconLineRef: React.RefObject<SVGLineElement | null>;
  beaconDotRef: React.RefObject<SVGCircleElement | null>;
  fpsTextRef?: React.RefObject<HTMLSpanElement | null>;
  onSceneReady?: () => void;
}

// Pre-allocated scratch structures outside render loop (zero GC)
const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _smoothedCamPos = new THREE.Vector3();
const _smoothedTarget = new THREE.Vector3();
const _extCamQuat = new THREE.Quaternion();
const _intCamQuat = new THREE.Quaternion();
const _intCamPos = new THREE.Vector3();
const _intEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _lookMat = new THREE.Matrix4();
const _camUp = new THREE.Vector3(0, 1, 0);
const _beaconScreenVec = new THREE.Vector3();
const _pointerNdc = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();

function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function AureliaViewport({
  targetProgressRef,
  isPoolInspecting,
  isPoolInspectingRef,
  walkthroughLevelId,
  walkthroughLevelIdRef,
  onActiveChapterChange,
  onPoolInspectAutoExit,
  onAltitudeFrame,
  altitudeTextRef,
  progressFillRef,
  elevatorCarRef,
  beaconCalloutRef,
  beaconLabelRef,
  beaconLineRef,
  beaconDotRef,
  fpsTextRef,
  onSceneReady,
}: AureliaViewportProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resetInspectOrbitRef = useRef<(() => void) | null>(null);
  const enterWalkthroughRef = useRef<((levelId: WalkthroughLevelId) => void) | null>(null);
  const exitWalkthroughRef = useRef<(() => void) | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);

  const onActiveChapterChangeRef = useRef(onActiveChapterChange);
  onActiveChapterChangeRef.current = onActiveChapterChange;

  const onPoolInspectAutoExitRef = useRef(onPoolInspectAutoExit);
  onPoolInspectAutoExitRef.current = onPoolInspectAutoExit;

  const onAltitudeFrameRef = useRef(onAltitudeFrame);
  onAltitudeFrameRef.current = onAltitudeFrame;

  const onSceneReadyRef = useRef(onSceneReady);
  onSceneReadyRef.current = onSceneReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    const activeInteractive = isPoolInspecting || walkthroughLevelId !== null;
    if (canvas) {
      canvas.style.touchAction = activeInteractive ? 'none' : 'pan-y';
      canvas.style.cursor = activeInteractive ? 'grab' : 'default';
    }
    if (!isPoolInspecting) {
      resetInspectOrbitRef.current?.();
    }
  }, [isPoolInspecting, walkthroughLevelId]);

  useEffect(() => {
    if (walkthroughLevelId) {
      enterWalkthroughRef.current?.(walkthroughLevelId);
    } else {
      exitWalkthroughRef.current?.();
    }
  }, [walkthroughLevelId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextError('WebGL rendering context could not be initialized on this device.');
      return;
    }

    let viewW = container.clientWidth || window.innerWidth;
    let viewH = container.clientHeight || window.innerHeight;
    let camConfig = computeResponsiveCameraConfig(viewW, viewH);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setSize(viewW, viewH);
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.autoUpdate = false;

    const canvas = renderer.domElement;
    canvasRef.current = canvas;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    const initialInteractive =
      isPoolInspectingRef.current || walkthroughLevelIdRef.current !== null;
    canvas.style.touchAction = initialInteractive ? 'none' : 'pan-y';
    canvas.style.cursor = initialInteractive ? 'grab' : 'default';
    canvas.setAttribute('data-testid', 'aurelia-webgl-canvas');
    canvas.dataset.walkthroughCulled = 'false';
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090B10');
    const expFog = new THREE.FogExp2('#090B10', 0.0056);
    scene.fog = expFog;

    const camera = new THREE.PerspectiveCamera(
      camConfig.fov,
      viewW / Math.max(viewH, 1),
      0.28,
      980,
    );

    // Lightweight Procedural PMREM Environment (warm bronze/amber lower bounce + cool navy-obsidian sky)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMiniScene = new THREE.Scene();
    envMiniScene.background = new THREE.Color('#070B14');
    const envGeos: THREE.BufferGeometry[] = [];
    const envMats: THREE.Material[] = [];
    const addEnvPlane = (
      w: number,
      h: number,
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
      colorHex: number,
    ) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, 0);
      envMiniScene.add(mesh);
      envGeos.push(geo);
      envMats.push(mat);
    };
    // Lower warm Embankment / bronze bounce planes
    addEnvPlane(24, 24, 0, -6, 0, Math.PI / 2, 0, 0x8f5d28);
    addEnvPlane(18, 5, 0, -2.2, 9, 0, 0, 0xdba052);
    addEnvPlane(18, 5, 0, -2.2, -9, 0, 0, 0xb87e38);
    addEnvPlane(18, 5, 9, -2.2, 0, 0, Math.PI / 2, 0xc78b40);
    addEnvPlane(18, 5, -9, -2.2, 0, 0, Math.PI / 2, 0x9c662a);
    // Upper deep navy-obsidian sky reflection cards & crisp zenith gradient
    addEnvPlane(26, 26, 0, 9, 0, Math.PI / 2, 0, 0x0a1324);
    addEnvPlane(18, 6, 0, 3.8, 9, 0, 0, 0x162844);
    addEnvPlane(18, 6, 0, 3.8, -9, 0, 0, 0x111f36);
    addEnvPlane(14, 3.5, 6, 1.5, 7, 0, -0.5, 0xffd79b);

    const envTarget = pmremGenerator.fromScene(envMiniScene, 0.04);
    scene.environment = envTarget.texture;
    envGeos.forEach((g) => g.dispose());
    envMats.forEach((m) => m.dispose());
    pmremGenerator.dispose();

    // Exterior Nocturnal Architectural Lighting Rig (Strictly 1 Ambient + 1 Directional + 1 Hemisphere)
    const extAmbientLight = new THREE.AmbientLight('#D6CCC0', 0.52);
    scene.add(extAmbientLight);

    const hemiLight = new THREE.HemisphereLight('#47628A', '#261A10', 0.72);
    hemiLight.position.set(0, 220, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFD9A6', 1.38);
    keyLight.position.set(72, 175, 96);
    keyLight.castShadow = false;
    scene.add(keyLight);

    // Walkthrough Lighting Rig (Strictly MAX 2 Lights Total, Zero Shadows)
    const walkAmbientLight = new THREE.AmbientLight('#FAF4EA', 1.28);
    const walkKeyLight = new THREE.DirectionalLight('#FFD8A8', 0.68);
    walkKeyLight.position.set(28, 22, -26);
    walkKeyLight.castShadow = false;

    const maxAniso = isSoftwareGl ? 1 : Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    const textures = createProceduralTextures(maxAniso);
    const atmosphere = createLondonAtmosphere(isSoftwareGl);
    const towers = createAureliaTowers(textures, isSoftwareGl);

    scene.add(atmosphere.group);
    scene.add(towers.group);

    // Click-to-walk bronze floor indicator ring + subtle hover reticle
    const ringGeo = new THREE.RingGeometry(0.28, 0.44, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const destRingMat = new THREE.MeshBasicMaterial({
      color: '#FFB86C',
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const floorDestRing = new THREE.Mesh(ringGeo, destRingMat);
    floorDestRing.visible = false;
    floorDestRing.renderOrder = 8;
    scene.add(floorDestRing);

    const hoverRingGeo = new THREE.RingGeometry(0.22, 0.3, 28);
    hoverRingGeo.rotateX(-Math.PI / 2);
    const hoverRingMat = new THREE.MeshBasicMaterial({
      color: '#C29B38',
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const floorHoverRing = new THREE.Mesh(hoverRingGeo, hoverRingMat);
    floorHoverRing.visible = false;
    floorHoverRing.renderOrder = 8;
    scene.add(floorHoverRing);

    let currentProgress = clampProgress(targetProgressRef.current);
    let currentDistMult = camConfig.distanceMultiplier;
    let targetDistMult = camConfig.distanceMultiplier;
    let currentFov = camConfig.fov;
    let targetFov = camConfig.fov;
    let poolInspectBlend = isPoolInspectingRef.current ? 1 : 0;

    // Exterior cursor parallax & Skybridge orbit state
    let targetYaw = 0;
    let targetPitch = 0;
    let currentYaw = 0;
    let currentPitch = 0;
    let targetInspectYaw = 0;
    let targetInspectPitch = 0;
    let currentInspectYaw = 0;
    let currentInspectPitch = 0;

    // First-person Interior Walkthrough state
    let activeWalkSpaceId: WalkthroughLevelId | null = walkthroughLevelIdRef.current;
    let walkthroughBlend = activeWalkSpaceId ? 1 : 0;
    let walkX = 0;
    let walkY = 0;
    let walkZ = 0;
    let walkFloorOffset = 0;
    let targetWalkFloorOffset = 0;
    let walkYaw = Math.PI;
    let walkPitch = 0;
    let targetWalkYaw = Math.PI;
    let targetWalkPitch = 0;
    let clickWalkActive = false;
    let clickWalkTargetX = 0;
    let clickWalkTargetZ = 0;
    const pressedKeys = new Set<string>();

    let isWalkthroughCulled = false;
    let culledRoomId: WalkthroughLevelId | null = null;
    const applyWalkthroughPerformanceIsolation = (roomId: WalkthroughLevelId | null) => {
      if (roomId !== null) {
        if (isWalkthroughCulled && culledRoomId === roomId) return;
        isWalkthroughCulled = true;
        culledRoomId = roomId;
        atmosphere.setExteriorCityVisible(false, false);
        towers.setWalkthroughIsolation(roomId);
        scene.remove(extAmbientLight, hemiLight, keyLight);
        scene.add(walkAmbientLight, walkKeyLight);
        renderer.shadowMap.enabled = false;
        renderer.shadowMap.autoUpdate = false;
        canvas.dataset.walkthroughCulled = 'true';
      } else {
        if (!isWalkthroughCulled) return;
        isWalkthroughCulled = false;
        culledRoomId = null;
        atmosphere.setExteriorCityVisible(true);
        towers.setWalkthroughIsolation(null);
        scene.remove(walkAmbientLight, walkKeyLight);
        scene.add(extAmbientLight, hemiLight, keyLight);
        renderer.shadowMap.enabled = false;
        renderer.shadowMap.autoUpdate = false;
        canvas.dataset.walkthroughCulled = 'false';
      }
    };

    if (activeWalkSpaceId) {
      const initialSpace = getInteriorForLevel(activeWalkSpaceId);
      if (initialSpace) {
        walkX = initialSpace.spawnX;
        walkFloorOffset = 0;
        targetWalkFloorOffset = 0;
        walkY = initialSpace.floorY + initialSpace.eyeHeight;
        walkZ = initialSpace.spawnZ;
        walkYaw = initialSpace.initialYaw;
        walkPitch = initialSpace.initialPitch;
        targetWalkYaw = initialSpace.initialYaw;
        targetWalkPitch = initialSpace.initialPitch;
        targetFov = 68;
        currentFov = 68;
        applyWalkthroughPerformanceIsolation(activeWalkSpaceId);
      }
    }

    let isDraggingCanvas = false;
    let activePointerId: number | null = null;
    let lastDragX = 0;
    let lastDragY = 0;
    let totalDragDist = 0;
    let lastReportedChapterId = findActiveChapter(currentProgress).id;
    let lastDisplayedMeters = -1;
    let lastBeaconLabel = '';

    resetInspectOrbitRef.current = () => {
      targetInspectYaw = 0;
      targetInspectPitch = 0;
      isDraggingCanvas = false;
      activePointerId = null;
    };

    enterWalkthroughRef.current = (levelId: WalkthroughLevelId) => {
      const space = getInteriorForLevel(levelId);
      if (!space) return;
      activeWalkSpaceId = levelId;
      walkX = space.spawnX;
      walkFloorOffset = 0;
      targetWalkFloorOffset = 0;
      walkY = space.floorY + space.eyeHeight;
      walkZ = space.spawnZ;
      walkYaw = space.initialYaw;
      walkPitch = space.initialPitch;
      targetWalkYaw = space.initialYaw;
      targetWalkPitch = space.initialPitch;
      clickWalkActive = false;
      floorDestRing.visible = false;
      floorHoverRing.visible = false;
      pressedKeys.clear();
      targetFov = 68;
      if (isWalkthroughCulled) {
        applyWalkthroughPerformanceIsolation(levelId);
      }
    };

    exitWalkthroughRef.current = () => {
      clickWalkActive = false;
      floorDestRing.visible = false;
      floorHoverRing.visible = false;
      pressedKeys.clear();
      targetFov = camConfig.fov;
      applyWalkthroughPerformanceIsolation(null);
    };

    sampleElevatorCameraPose(
      currentProgress,
      _camPos,
      _camTarget,
      0,
      0,
      currentDistMult,
      poolInspectBlend,
      0,
      0,
    );
    _smoothedCamPos.copy(_camPos);
    _smoothedTarget.copy(_camTarget);
    camera.position.copy(_smoothedCamPos);
    camera.lookAt(_smoothedTarget);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    onSceneReadyRef.current?.();

    const tryRaycastFloor = (clientX: number, clientY: number, spaceId: WalkthroughLevelId) => {
      const rect = canvas.getBoundingClientRect();
      const space = getInteriorForLevel(spaceId);
      if (!space || rect.width <= 0 || rect.height <= 0) return null;
      _pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      _pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(towers.walkableFloors, false);
      for (let i = 0; i < hits.length; i++) {
        if (hits[i].object.userData.walkableRoomId === spaceId) {
          const hitHeightHint = hits[i].point.y - space.floorY;
          if (Math.abs(hitHeightHint - targetWalkFloorOffset) <= 2.4) {
            return resolveWalkPose(spaceId, hits[i].point.x, hits[i].point.z, targetWalkFloorOffset);
          }
        }
      }
      return null;
    };

    const handleCanvasPointerDown = (e: PointerEvent) => {
      if (!isPoolInspectingRef.current && walkthroughLevelIdRef.current === null) return;
      isDraggingCanvas = true;
      activePointerId = e.pointerId;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      totalDragDist = 0;
      canvas.style.cursor = 'grabbing';
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore synthetic events without capture support
      }
    };

    const handleCanvasPointerMove = (e: PointerEvent) => {
      const walkId = walkthroughLevelIdRef.current;

      if (isDraggingCanvas && activePointerId === e.pointerId) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        totalDragDist += Math.hypot(dx, dy);

        if (walkId !== null) {
          // Natural non-inverted drag-to-look: drag right turns right, drag up tilts up
          targetWalkYaw -= dx * 0.0045;
          targetWalkPitch = THREE.MathUtils.clamp(targetWalkPitch - dy * 0.0045, -1.2, 1.2);
          floorHoverRing.visible = false;
        } else if (isPoolInspectingRef.current) {
          targetInspectYaw -= dx * 0.0085;
          targetInspectPitch = THREE.MathUtils.clamp(targetInspectPitch + dy * 0.0045, -0.35, 0.55);
        }
        return;
      }

      if (walkId !== null && walkthroughBlend > 0.88 && e.pointerType !== 'touch') {
        const space = getInteriorForLevel(walkId);
        const hit = tryRaycastFloor(e.clientX, e.clientY, walkId);
        if (space && hit) {
          floorHoverRing.position.set(hit.x, space.floorY + hit.floorOffset + 0.04, hit.z);
          floorHoverRing.visible = true;
          canvas.style.cursor = 'pointer';
        } else {
          floorHoverRing.visible = false;
          canvas.style.cursor = 'grab';
        }
      }
    };

    const handleCanvasPointerEnd = (e: PointerEvent) => {
      if (activePointerId !== e.pointerId) return;
      const walkId = walkthroughLevelIdRef.current;
      const wasShortClick = totalDragDist < 6;

      isDraggingCanvas = false;
      activePointerId = null;
      canvas.style.cursor =
        isPoolInspectingRef.current || walkId !== null ? 'grab' : 'default';

      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }

      if (walkId !== null && wasShortClick && walkthroughBlend > 0.85) {
        const space = getInteriorForLevel(walkId);
        const hit = tryRaycastFloor(e.clientX, e.clientY, walkId);
        if (space && hit) {
          clickWalkTargetX = hit.x;
          clickWalkTargetZ = hit.z;
          clickWalkActive = true;
          floorDestRing.position.set(hit.x, space.floorY + hit.floorOffset + 0.045, hit.z);
          floorDestRing.visible = true;
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (
        e.pointerType === 'touch' ||
        isPoolInspectingRef.current ||
        walkthroughLevelIdRef.current !== null
      ) {
        return;
      }
      const nx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      const ny = (e.clientY / Math.max(window.innerHeight, 1)) * 2 - 1;
      targetYaw = THREE.MathUtils.clamp(-nx * 0.075, -0.35, 0.35);
      targetPitch = THREE.MathUtils.clamp(-ny * 0.045, -0.2, 0.2);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (walkthroughLevelIdRef.current === null) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD'
      ) {
        if (e.code.startsWith('Arrow')) {
          e.preventDefault();
        }
        pressedKeys.add(e.code);
        clickWalkActive = false;
        floorDestRing.visible = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.code);
    };

    const handleResize = () => {
      viewW = container.clientWidth || window.innerWidth;
      viewH = container.clientHeight || window.innerHeight;
      camConfig = computeResponsiveCameraConfig(viewW, viewH);
      targetDistMult = camConfig.distanceMultiplier;
      targetFov = walkthroughLevelIdRef.current !== null ? 68 : camConfig.fov;

      camera.aspect = viewW / Math.max(viewH, 1);
      camera.fov = targetFov;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(viewW, viewH);
      currentFov = targetFov;
      currentDistMult = targetDistMult;
    };

    let contextLost = false;
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      setContextError('3D architectural viewport paused while graphics context restores.');
    };
    const handleContextRestored = () => {
      contextLost = false;
      setContextError(null);
    };

    canvas.addEventListener('pointerdown', handleCanvasPointerDown);
    canvas.addEventListener('pointermove', handleCanvasPointerMove);
    canvas.addEventListener('pointerup', handleCanvasPointerEnd);
    canvas.addEventListener('pointercancel', handleCanvasPointerEnd);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    let disposed = false;
    let frameId = 0;
    const startMs = performance.now();
    let prevMs = startMs;
    let fpsSampleStartMs = startMs;
    let fpsFrames = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      if (!sync) {
        frameId = window.setTimeout(cb, 16);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 4);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 16);
        }
      };
      frameId = window.setTimeout(poll, 4);
    }

    function updateBeaconCalloutDom(
      pose: ReturnType<typeof progressToBeaconPose>,
      visible: boolean,
    ) {
      const callout = beaconCalloutRef.current;
      const label = beaconLabelRef.current;
      const line = beaconLineRef.current;
      const dot = beaconDotRef.current;
      if (!callout || !label || !line || !dot) return;

      if (!visible) {
        callout.style.display = 'none';
        line.style.display = 'none';
        dot.style.display = 'none';
        return;
      }

      _beaconScreenVec.set(pose.anchorX, pose.y, pose.anchorZ).project(camera);
      if (
        !Number.isFinite(_beaconScreenVec.x) ||
        !Number.isFinite(_beaconScreenVec.y) ||
        _beaconScreenVec.z >= 1 ||
        _beaconScreenVec.z <= -1
      ) {
        callout.style.display = 'none';
        line.style.display = 'none';
        dot.style.display = 'none';
        return;
      }

      const sx = (_beaconScreenVec.x * 0.5 + 0.5) * viewW;
      const sy = (-_beaconScreenVec.y * 0.5 + 0.5) * viewH;

      const isCompact = viewW < 768;
      const badgeW = isCompact ? 164 : 186;
      const badgeH = 26;
      const rightHudReserve = isCompact ? 56 : 240;

      // Keep badge comfortably clear of top header, bottom chapter card, and right elevator telemetry
      const preferredOffsetX =
        sx < viewW * 0.46 && sx - badgeW - 36 > 16 ? -(badgeW + 36) : 36;
      const badgeX = THREE.MathUtils.clamp(
        sx + preferredOffsetX,
        16,
        Math.max(16, viewW - rightHudReserve - badgeW),
      );
      const badgeY = THREE.MathUtils.clamp(
        sy - 32,
        isCompact ? 76 : 88,
        Math.max(90, viewH - (isCompact ? 210 : 175)),
      );

      const lineEndX = preferredOffsetX < 0 ? badgeX + badgeW : badgeX;
      const lineEndY = badgeY + badgeH * 0.5;

      callout.style.display = 'flex';
      callout.style.transform = `translate3d(${badgeX.toFixed(1)}px, ${badgeY.toFixed(1)}px, 0)`;

      if (pose.codeLabel !== lastBeaconLabel) {
        lastBeaconLabel = pose.codeLabel;
        label.textContent = pose.codeLabel;
      }

      dot.style.display = 'block';
      dot.setAttribute('cx', sx.toFixed(1));
      dot.setAttribute('cy', sy.toFixed(1));

      line.style.display = 'block';
      line.setAttribute('x1', sx.toFixed(1));
      line.setAttribute('y1', sy.toFixed(1));
      line.setAttribute('x2', lineEndX.toFixed(1));
      line.setAttribute('y2', lineEndY.toFixed(1));
    }

    function updateHudDomDirect(progress: number) {
      const meters = progressToAltitudeMeters(progress);
      if (meters !== lastDisplayedMeters && altitudeTextRef.current) {
        altitudeTextRef.current.textContent = formatAltitudeReadout(meters);
        lastDisplayedMeters = meters;
      }
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleY(${progress.toFixed(4)})`;
      }
      if (elevatorCarRef.current) {
        elevatorCarRef.current.style.bottom = `${(progress * 100).toFixed(2)}%`;
      }
      const chapter = findActiveChapter(progress);
      if (chapter.id !== lastReportedChapterId) {
        lastReportedChapterId = chapter.id;
        onActiveChapterChangeRef.current(chapter.id);
        if (chapter.id !== 'lvl-34' && isPoolInspectingRef.current) {
          isPoolInspectingRef.current = false;
          onPoolInspectAutoExitRef.current();
        }
      }
    }

    updateHudDomDirect(currentProgress);

    function tick() {
      if (disposed) return;

      const nowMs = performance.now();
      const rawDt = Math.max(0.001, (nowMs - prevMs) * 0.001);
      prevMs = nowMs;
      const elapsed = (nowMs - startMs) * 0.001;
      const animDt = Math.min(rawDt, 0.1);

      fpsFrames += 1;
      const fpsElapsedMs = nowMs - fpsSampleStartMs;
      if (fpsElapsedMs >= 400) {
        const measuredFps = Math.min(120, Math.round((fpsFrames * 1000) / fpsElapsedMs));
        if (fpsTextRef?.current) {
          fpsTextRef.current.textContent = `${measuredFps} FPS`;
        }
        fpsFrames = 0;
        fpsSampleStartMs = nowMs;
      }

      if (!contextLost) {
        // Silky motorized cinema-jib exponential damping (1 - Math.exp(-6 * dt))
        currentProgress = dampScalar(currentProgress, targetProgressRef.current, 6, rawDt);
        currentYaw = dampScalar(currentYaw, targetYaw, 6, rawDt);
        currentPitch = dampScalar(currentPitch, targetPitch, 6, rawDt);
        currentInspectYaw = dampScalar(currentInspectYaw, targetInspectYaw, 7.5, rawDt);
        currentInspectPitch = dampScalar(currentInspectPitch, targetInspectPitch, 7.5, rawDt);
        currentDistMult = dampScalar(currentDistMult, targetDistMult, 7, rawDt);

        const inspectTarget = isPoolInspectingRef.current ? 1 : 0;
        poolInspectBlend = dampScalar(poolInspectBlend, inspectTarget, 6, rawDt);

        const walkGoal = walkthroughLevelIdRef.current !== null ? 1 : 0;
        targetFov = walkGoal > 0.5 ? 68 : camConfig.fov;
        currentFov = dampScalar(currentFov, targetFov, 7, rawDt);

        walkthroughBlend = dampScalar(walkthroughBlend, walkGoal, 8.5, rawDt);
        if (walkGoal === 1 && walkthroughBlend > 0.72 && activeWalkSpaceId) {
          applyWalkthroughPerformanceIsolation(activeWalkSpaceId);
        } else if (walkGoal === 0) {
          applyWalkthroughPerformanceIsolation(null);
          if (walkthroughBlend < 0.004) {
            walkthroughBlend = 0;
            activeWalkSpaceId = null;
          }
        }

        if (Math.abs(camera.fov - currentFov) > 0.05) {
          camera.fov = currentFov;
          camera.updateProjectionMatrix();
        }

        // Summit breakout: thin London embankment mist smoothly above 220m (keep haze crisp during interior walkthroughs)
        const summitBreakout = THREE.MathUtils.smoothstep(currentProgress, 0.78, 1.0);
        const exteriorFog = 0.006 - summitBreakout * 0.0038;
        expFog.density = exteriorFog * (1 - walkthroughBlend * 0.65);

        // Update first-person movement while inside a modeled interior room
        if (walkthroughLevelIdRef.current !== null && activeWalkSpaceId) {
          walkYaw = dampScalar(walkYaw, targetWalkYaw, 16, rawDt);
          walkPitch = dampScalar(walkPitch, targetWalkPitch, 16, rawDt);

          let moveFwd = 0;
          let moveStrafe = 0;
          if (pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) moveFwd += 1;
          if (pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown')) moveFwd -= 1;
          if (pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) moveStrafe += 1;
          if (pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft')) moveStrafe -= 1;

          const fwdX = -Math.sin(walkYaw);
          const fwdZ = -Math.cos(walkYaw);
          const rightX = Math.cos(walkYaw);
          const rightZ = -Math.sin(walkYaw);

          if (moveFwd !== 0 || moveStrafe !== 0) {
            let vx = fwdX * moveFwd + rightX * moveStrafe;
            let vz = fwdZ * moveFwd + rightZ * moveStrafe;
            const len = Math.hypot(vx, vz) || 1;
            vx /= len;
            vz /= len;
            const speed = 4.2;
            const pose = resolveWalkPose(
              activeWalkSpaceId,
              walkX + vx * speed * animDt,
              walkZ + vz * speed * animDt,
              targetWalkFloorOffset,
            );
            walkX = pose.x;
            walkZ = pose.z;
            targetWalkFloorOffset = pose.floorOffset;
          } else if (clickWalkActive) {
            const dx = clickWalkTargetX - walkX;
            const dz = clickWalkTargetZ - walkZ;
            const dist = Math.hypot(dx, dz);
            if (dist < 0.16) {
              const pose = resolveWalkPose(
                activeWalkSpaceId,
                clickWalkTargetX,
                clickWalkTargetZ,
                targetWalkFloorOffset,
              );
              walkX = pose.x;
              walkZ = pose.z;
              targetWalkFloorOffset = pose.floorOffset;
              clickWalkActive = false;
              floorDestRing.visible = false;
            } else {
              const step = Math.min(dist, 4.6 * animDt);
              const pose = resolveWalkPose(
                activeWalkSpaceId,
                walkX + (dx / dist) * step,
                walkZ + (dz / dist) * step,
                targetWalkFloorOffset,
              );
              walkX = pose.x;
              walkZ = pose.z;
              targetWalkFloorOffset = pose.floorOffset;
            }
          }

          const activeSpaceSpec = getInteriorForLevel(activeWalkSpaceId);
          if (activeSpaceSpec) {
            walkFloorOffset = dampScalar(walkFloorOffset, targetWalkFloorOffset, 14, rawDt);
            walkY = activeSpaceSpec.floorY + activeSpaceSpec.eyeHeight + walkFloorOffset;
          }

          if (floorDestRing.visible) {
            const ringPulse = 0.92 + 0.12 * Math.sin(elapsed * 4.5);
            floorDestRing.scale.setScalar(ringPulse);
          }
        }

        sampleElevatorCameraPose(
          currentProgress,
          _camPos,
          _camTarget,
          currentYaw,
          currentPitch,
          currentDistMult,
          poolInspectBlend,
          currentInspectYaw,
          currentInspectPitch,
        );
        const camAlpha = 1 - Math.exp(-6 * Math.min(rawDt, 0.5));
        _smoothedCamPos.lerp(_camPos, camAlpha);
        _smoothedTarget.lerp(_camTarget, camAlpha);

        if (walkthroughBlend > 0.001 && activeWalkSpaceId) {
          _intCamPos.set(walkX, walkY, walkZ);
          _intEuler.set(walkPitch, walkYaw, 0, 'YXZ');
          _intCamQuat.setFromEuler(_intEuler);

          if (walkthroughBlend >= 0.996 && walkGoal === 1) {
            camera.position.copy(_intCamPos);
            camera.quaternion.copy(_intCamQuat);
          } else {
            const easeBlend =
              walkthroughBlend * walkthroughBlend * (3 - 2 * walkthroughBlend);
            _lookMat.lookAt(_smoothedCamPos, _smoothedTarget, _camUp);
            _extCamQuat.setFromRotationMatrix(_lookMat);

            camera.position.lerpVectors(_smoothedCamPos, _intCamPos, easeBlend);
            camera.quaternion.slerpQuaternions(_extCamQuat, _intCamQuat, easeBlend);
          }
        } else {
          camera.position.copy(_smoothedCamPos);
          camera.lookAt(_smoothedTarget);
        }

        camera.updateMatrixWorld();

        const showBeacon = walkthroughBlend < 0.08 && poolInspectBlend < 0.08;
        const beaconPose = progressToBeaconPose(currentProgress);
        towers.setBeaconPose(beaconPose, elapsed, showBeacon);
        updateBeaconCalloutDom(beaconPose, showBeacon);

        atmosphere.update(elapsed, animDt);
        towers.update(elapsed, animDt);
        onAltitudeFrameRef.current?.(currentProgress);

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        const renderedProgress = currentProgress;
        afterDraw(() => {
          updateHudDomDirect(renderedProgress);
          tick();
        });
      } else {
        updateHudDomDirect(currentProgress);
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      renderer.render(scene, camera);
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      resetInspectOrbitRef.current = null;
      enterWalkthroughRef.current = null;
      exitWalkthroughRef.current = null;
      canvasRef.current = null;
      canvas.removeEventListener('pointerdown', handleCanvasPointerDown);
      canvas.removeEventListener('pointermove', handleCanvasPointerMove);
      canvas.removeEventListener('pointerup', handleCanvasPointerEnd);
      canvas.removeEventListener('pointercancel', handleCanvasPointerEnd);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      ringGeo.dispose();
      destRingMat.dispose();
      hoverRingGeo.dispose();
      hoverRingMat.dispose();

      atmosphere.dispose();
      towers.dispose();
      textures.dispose();
      envTarget.dispose();
      renderer.dispose();

      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [
    altitudeTextRef,
    beaconCalloutRef,
    beaconDotRef,
    beaconLabelRef,
    beaconLineRef,
    elevatorCarRef,
    fpsTextRef,
    isPoolInspectingRef,
    progressFillRef,
    targetProgressRef,
    walkthroughLevelIdRef,
  ]);

  const activeTouchNone = isPoolInspecting || walkthroughLevelId !== null;

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-[#09090B]"
      style={{ touchAction: activeTouchNone ? 'none' : 'pan-y' }}
    >
      <div
        ref={mountRef}
        className="h-full w-full"
        style={{ touchAction: activeTouchNone ? 'none' : 'pan-y' }}
        aria-label="Interactive 3D architectural view of The Aurelia Towers on Victoria Embankment, London"
      />
      {contextError && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#09090B]/95 p-8 text-center"
        >
          <div className="max-w-md border border-[rgba(244,239,230,0.12)] bg-[#0E0E12] p-8">
            <p className="font-display text-sm tracking-[0.15em] uppercase text-[#C29B38]">
              Architectural Viewport
            </p>
            <p className="mt-3 text-sm font-light leading-[1.7] text-[#F4EFE6]/80">
              {contextError}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
