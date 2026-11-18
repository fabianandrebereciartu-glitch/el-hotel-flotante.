import * as THREE from 'three';

export interface AtmosphereController {
  group: THREE.Group;
  setExteriorCityVisible: (visible: boolean, keepSkyline?: boolean) => void;
  update: (elapsedTime: number, dt: number) => void;
  dispose: () => void;
}

interface TrafficStreak {
  x: number;
  z: number;
  speed: number;
  length: number;
  isAmber: boolean;
}

export function createLondonAtmosphere(isSoftwareGl = false): AtmosphereController {
  const group = new THREE.Group();
  group.name = 'londonNightAtmosphere';

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

  // 1. Moody Navy-Indigo Twilight Sky Dome Shader with Lower Amber City Fog Glow
  const skyGeo = trackGeo(new THREE.SphereGeometry(760, 40, 24));
  const skyUniforms = {
    uTime: { value: 0 },
    uFogColor: { value: new THREE.Color('#090B10') },
  };
  const fbmOctaves = isSoftwareGl ? 2 : 4;

  const skyMat = trackMat(
    new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldDir = normalize(worldPos.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uFogColor;
        varying vec3 vWorldDir;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
            u.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < ${fbmOctaves}; i++) {
            v += a * noise(p);
            p = p * 2.02 + vec2(17.1, 31.7);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldDir);
          float h = clamp(dir.y, -0.2, 1.0);

          // Rich dark navy-indigo twilight sky dome matching FogExp2('#090B10', 0.006)
          vec3 zenith = vec3(0.020, 0.027, 0.058);
          vec3 midSky = vec3(0.042, 0.056, 0.098);
          vec3 horizon = uFogColor;

          vec3 sky = mix(horizon, midSky, smoothstep(0.0, 0.28, h));
          sky = mix(sky, zenith, smoothstep(0.25, 0.85, h));

          if (dir.y > 0.015) {
            vec2 cloudUv = dir.xz / (dir.y + 0.18) * 1.4;
            cloudUv += vec2(uTime * 0.008, uTime * 0.004);
            float c1 = fbm(cloudUv);
            float c2 = fbm(cloudUv * 2.1 - vec2(uTime * 0.012, 0.0));
            float cloudDensity = smoothstep(0.42, 0.78, c1 * 0.72 + c2 * 0.28);

            float lowerDeckMask = smoothstep(0.46, 0.03, h) * smoothstep(0.015, 0.08, h);
            vec3 cloudShadow = vec3(0.028, 0.036, 0.062);
            vec3 amberCityGlow = vec3(0.48, 0.28, 0.11);
            vec3 cloudCol = mix(cloudShadow, amberCityGlow, lowerDeckMask * (0.48 + 0.52 * (1.0 - c2)));

            sky = mix(sky, cloudCol, cloudDensity * 0.65 * smoothstep(0.015, 0.15, h));

            vec2 starGrid = dir.xz / (dir.y + 0.35) * 85.0;
            float sHash = hash(floor(starGrid));
            vec2 sCell = fract(starGrid) - 0.5;
            float sDist = length(sCell);
            float star = step(0.988, sHash) * smoothstep(0.18, 0.02, sDist) * (1.0 - cloudDensity * 0.85);
            sky += vec3(0.88, 0.85, 0.78) * star * smoothstep(0.20, 0.58, h) * 0.6;
          }

          // Warm amber London city glow along the lower atmospheric fog deck
          float horizonBand = exp(-abs(h - 0.03) * 19.0);
          sky += vec3(0.22, 0.125, 0.052) * horizonBand * 0.78;

          sky = mix(uFogColor, sky, smoothstep(-0.04, 0.04, h));
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    }),
  );

  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  group.add(skyDome);

  // 2. River Thames Foreground Reflective Water Plane with Gentle Vertex Ripples (#0A1218)
  const riverGeo = trackGeo(new THREE.PlaneGeometry(820, 420, 128, 72));
  riverGeo.rotateX(-Math.PI / 2);
  const riverUniforms = {
    uTime: { value: 0 },
    uFogColor: { value: new THREE.Color('#090B10') },
    uFogDensity: { value: 0.006 },
  };

  const riverMat = trackMat(
    new THREE.ShaderMaterial({
      uniforms: riverUniforms,
      vertexShader: `
        uniform float uTime;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        varying float vWaveHeight;

        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);

          // Gentle physical vertex ripples across the River Thames
          float t = uTime * 0.95;
          float ripple1 = sin(wp.x * 0.14 + wp.z * 0.08 + t * 1.15) * 0.12;
          float ripple2 = cos(wp.z * 0.21 - wp.x * 0.09 - t * 0.9) * 0.09;
          float height = ripple1 + ripple2;
          wp.y += height;

          vWaveHeight = height;
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uFogColor;
        uniform float uFogDensity;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        varying float vWaveHeight;

        void main() {
          vec2 p = vWorldPos.xz;
          float t = uTime * 0.7;

          // Fine tidal normal perturbation layered over vertex ripples
          float w1 = sin(p.x * 0.38 + t * 1.35 + sin(p.y * 0.19)) * 0.5;
          float w2 = cos(p.y * 0.64 - t * 1.05 + p.x * 0.14) * 0.5;
          float w3 = sin((p.x - p.y) * 1.05 + t * 1.9) * 0.24;
          vec3 n = normalize(vec3((w1 + w3) * 0.12, 1.0, (w2 + w3) * 0.15));

          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 3.2);

          // Dark Thames base (#0A1218) reflecting deep navy night sky
          vec3 deepWater = vec3(0.039, 0.071, 0.094);
          vec3 skyReflect = vec3(0.082, 0.118, 0.165);

          // Elongated golden/amber specular reflections from the twin towers & Embankment lights
          float towerReflectWest = exp(-pow((vWorldPos.x + 18.0 + n.x * 17.0) * 0.11, 2.0));
          float towerReflectEast = exp(-pow((vWorldPos.x - 18.0 + n.x * 17.0) * 0.11, 2.0));
          float skybridgeReflect = exp(-pow((vWorldPos.x + n.x * 15.0) * 0.08, 2.0)) * 0.5;
          float lanternWest = exp(-pow((vWorldPos.x + 12.0 + n.x * 8.0) * 0.22, 2.0));
          float lanternEast = exp(-pow((vWorldPos.x - 12.0 + n.x * 8.0) * 0.22, 2.0));
          float nearShore = exp(-max(0.0, vWorldPos.z - 34.0) * 0.028);

          float shimmerA = 0.5 + 0.5 * sin(p.x * 0.55 + p.y * 0.85 - t * 2.2 + sin(p.x * 0.2));
          float shimmerB = 0.5 + 0.5 * cos(p.x * 0.9 - p.y * 0.65 + t * 1.7);
          float shimmer = 0.30 + 0.70 * shimmerA * shimmerB;
          float specSparkle = pow(max(0.0, shimmerA * shimmerB), 3.0) * 0.75;

          vec3 bronzeGlint = vec3(0.86, 0.62, 0.24) * (towerReflectWest + towerReflectEast + skybridgeReflect) * (shimmer * 0.45 + specSparkle * 0.35);
          vec3 lanternGlint = vec3(1.0, 0.74, 0.38) * (lanternWest + lanternEast) * nearShore * (0.4 + 0.6 * shimmer) * 0.48;

          // Distant South Bank & City amber reflection across the Thames
          float southBankBand = smoothstep(55.0, 210.0, vWorldPos.z);
          vec3 cityShimmer = vec3(0.42, 0.25, 0.10) * southBankBand * (0.28 + 0.35 * max(0.0, w1 + w2));

          vec3 col = mix(deepWater, skyReflect, fresnel * 0.7) + bronzeGlint + lanternGlint + cityShimmer;
          col += vec3(0.03, 0.05, 0.07) * vWaveHeight * 1.4;

          float dist = length(cameraPosition - vWorldPos);
          float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
          col = mix(col, uFogColor, clamp(fogFactor, 0.0, 1.0));

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  );

  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.position.set(0, -0.35, 243);
  group.add(riverMesh);

  // 3. Victoria Embankment Roadway & Nighttime Vehicular Light Trails (Z = 22..30)
  const urbanGroundGeo = trackGeo(new THREE.PlaneGeometry(1100, 720));
  urbanGroundGeo.rotateX(-Math.PI / 2);
  const urbanGroundMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#0A0C12',
      roughness: 0.9,
      metalness: 0.05,
    }),
  );
  const urbanGround = new THREE.Mesh(urbanGroundGeo, urbanGroundMat);
  urbanGround.position.set(0, -0.45, -328);
  group.add(urbanGround);

  const roadGeo = trackGeo(new THREE.BoxGeometry(440, 0.9, 8.2));
  const roadMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#11141C',
      roughness: 0.22,
      metalness: 0.28,
      envMapIntensity: 1.2,
    }),
  );
  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.position.set(0, 0.14, 26.2);
  group.add(roadMesh);

  // Dashed muted bronze-amber Embankment center line markings
  const centerLineGeo = trackGeo(new THREE.PlaneGeometry(3.8, 0.14));
  centerLineGeo.rotateX(-Math.PI / 2);
  const centerLineMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#8C7245',
      transparent: true,
      opacity: 0.65,
    }),
  );
  const dashCount = 36;
  const centerDashes = new THREE.InstancedMesh(centerLineGeo, centerLineMat, dashCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < dashCount; i++) {
    dummy.position.set(-180 + i * 10.2, 0.62, 26.2);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    centerDashes.setMatrixAt(i, dummy.matrix);
  }
  centerDashes.instanceMatrix.needsUpdate = true;
  centerDashes.computeBoundingSphere();
  group.add(centerDashes);

  // Animated Vehicular Light Trails (Warm Amber Eastbound + Warm White Westbound)
  const streakCount = 34;
  const streakGeo = trackGeo(new THREE.BoxGeometry(1, 0.18, 0.34));
  const streakMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.95,
    }),
  );
  const trafficStreaksInst = new THREE.InstancedMesh(streakGeo, streakMat, streakCount);
  trafficStreaksInst.frustumCulled = false;

  const trafficData: TrafficStreak[] = [];
  const streakColor = new THREE.Color();
  for (let i = 0; i < streakCount; i++) {
    const isEastbound = i % 2 === 0;
    const laneZ = isEastbound ? 28.0 + (i % 3) * 0.44 : 24.3 - (i % 3) * 0.44;
    const x = -190 + ((i * 29.7) % 380);
    const length = 4.5 + (i % 5) * 1.8;
    const speed = (isEastbound ? 1 : -1) * (15 + (i % 6) * 4.5);

    trafficData.push({
      x,
      z: laneZ,
      speed,
      length,
      isAmber: isEastbound,
    });

    dummy.position.set(x, 0.78, laneZ);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(length, 1, 1);
    dummy.updateMatrix();
    trafficStreaksInst.setMatrixAt(i, dummy.matrix);

    streakColor.set(isEastbound ? '#FFA640' : '#FFF6E2');
    trafficStreaksInst.setColorAt(i, streakColor);
  }
  trafficStreaksInst.instanceMatrix.needsUpdate = true;
  if (trafficStreaksInst.instanceColor) trafficStreaksInst.instanceColor.needsUpdate = true;
  trafficStreaksInst.computeBoundingSphere();
  group.add(trafficStreaksInst);

  // 4. Dense Surrounding London Cityscape (58 Curated Blocks: Brick Terraces & Skyscrapers)
  const blockCount = 58;
  const cityBlockGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
  const cityBlockMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.72,
      metalness: 0.28,
    }),
  );
  const cityBlocks = new THREE.InstancedMesh(cityBlockGeo, cityBlockMat, blockCount);

  // Setback top caps / architectural crowns on contemporary skyscrapers & pitched caps on mid-rise blocks
  const crownCapGeo = trackGeo(new THREE.BoxGeometry(1, 1, 1));
  const cityCaps = new THREE.InstancedMesh(crownCapGeo, cityBlockMat, blockCount);

  const windowGeo = trackGeo(new THREE.PlaneGeometry(1.0, 0.62));
  const windowMat = trackMat(
    new THREE.MeshBasicMaterial({
      color: '#FFFFFF',
      transparent: true,
      opacity: 0.82,
    }),
  );
  const maxWindowCount = 820;
  const cityWindows = new THREE.InstancedMesh(windowGeo, windowMat, maxWindowCount);

  const bColor = new THREE.Color();
  const wColor = new THREE.Color();
  let wIdx = 0;

  for (let i = 0; i < blockCount; i++) {
    const seed1 = ((Math.sin(i * 19.7 + 1.3) * 43758.5453) % 1 + 1) % 1;
    const seed2 = ((Math.sin(i * 53.1 + 4.7) * 24634.6345) % 1 + 1) % 1;
    const seed3 = ((Math.sin(i * 89.3 + 9.1) * 19384.2123) % 1 + 1) % 1;

    // Distribute blocks around the Westminster / Embankment wings, background skyline, and South Bank
    let x: number;
    let z: number;
    if (i < 16) {
      // Flanking Embankment & Westminster mid-rise Victorian/Georgian brick terraces
      const side = i % 2 === 0 ? -1 : 1;
      x = side * (56 + (i * 15) + seed1 * 14);
      z = -24 + (seed2 - 0.5) * 44;
    } else if (i < 44) {
      // Dense London financial & Westminster mid/high-rise silhouettes behind Aurelia Towers
      const arcAngle = -Math.PI * 0.12 - seed1 * Math.PI * 0.76;
      const dist = 76 + seed2 * 165;
      x = Math.cos(arcAngle) * dist * 1.45;
      z = Math.sin(arcAngle) * dist - 14;
    } else {
      // Distant South Bank skyline across the River Thames (Z > 185)
      x = (seed1 - 0.5) * 420;
      z = 195 + seed2 * 145;
    }

    const isContemporaryTower = i >= 20 && i < 48 && seed3 > 0.42;
    const w = isContemporaryTower ? 13 + seed1 * 12 : 16 + seed2 * 16;
    const d = isContemporaryTower ? 13 + seed2 * 11 : 14 + seed1 * 12;
    const h = isContemporaryTower ? 42 + seed3 * 58 : 16 + seed3 * 22;

    dummy.position.set(x, h * 0.5 - 0.5, z);
    dummy.rotation.set(0, isContemporaryTower ? (seed1 - 0.5) * 0.35 : 0, 0);
    dummy.scale.set(w, h, d);
    dummy.updateMatrix();
    cityBlocks.setMatrixAt(i, dummy.matrix);

    if (isContemporaryTower) {
      bColor.set('#0F1622').lerp(new THREE.Color('#182232'), seed2);
    } else {
      // Dark weathered London brick / Portland silhouette
      bColor.set('#191516').lerp(new THREE.Color('#231C1A'), seed1);
    }
    cityBlocks.setColorAt(i, bColor);

    // Architectural stepped setback penthouse / cornice cap
    const capH = isContemporaryTower ? 5 + seed2 * 8 : 2.2;
    dummy.position.set(x, h + capH * 0.5 - 0.5, z);
    dummy.scale.set(w * 0.72, capH, d * 0.72);
    dummy.updateMatrix();
    cityCaps.setMatrixAt(i, dummy.matrix);
    cityCaps.setColorAt(i, bColor.clone().multiplyScalar(1.15));

    // Scattered glowing night window grids on front & side visible facades
    const rows = Math.min(8, Math.max(3, Math.floor(h / 7)));
    const cols = 3;
    const facingZ = z < 35 ? d * 0.51 : -d * 0.51;
    const rotY = z < 35 ? 0 : Math.PI;

    for (let r = 0; r < rows && wIdx < maxWindowCount; r++) {
      for (let c = 0; c < cols && wIdx < maxWindowCount; c++) {
        const wRand = ((Math.sin((i * 41 + r * 17 + c * 13) * 12.9898) * 43758.5) % 1 + 1) % 1;
        if (wRand < 0.44) continue;

        const wx = x + ((c - 1) * w * 0.26);
        const wy = 5 + (r / rows) * (h - 7);
        dummy.position.set(wx, wy, z + facingZ);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(1.8 + (c % 2) * 1.1, 1.15, 1);
        dummy.updateMatrix();
        cityWindows.setMatrixAt(wIdx, dummy.matrix);

        if (isContemporaryTower && wRand > 0.78) {
          wColor.set('#9DB8D6').multiplyScalar(0.65);
        } else {
          wColor.set('#F4C373').multiplyScalar(0.55 + wRand * 0.45);
        }
        cityWindows.setColorAt(wIdx, wColor);
        wIdx++;
      }
    }
  }

  cityWindows.count = wIdx;
  cityBlocks.instanceMatrix.needsUpdate = true;
  if (cityBlocks.instanceColor) cityBlocks.instanceColor.needsUpdate = true;
  cityBlocks.computeBoundingSphere();

  cityCaps.instanceMatrix.needsUpdate = true;
  if (cityCaps.instanceColor) cityCaps.instanceColor.needsUpdate = true;
  cityCaps.computeBoundingSphere();

  cityWindows.instanceMatrix.needsUpdate = true;
  if (cityWindows.instanceColor) cityWindows.instanceColor.needsUpdate = true;
  cityWindows.computeBoundingSphere();

  group.add(cityBlocks);
  group.add(cityCaps);
  group.add(cityWindows);

  let exteriorCityVisible = true;
  let lastKeepSkyline = false;

  return {
    group,
    setExteriorCityVisible: (visible: boolean, keepSkyline = false) => {
      if (exteriorCityVisible === visible && lastKeepSkyline === keepSkyline) return;
      exteriorCityVisible = visible;
      lastKeepSkyline = keepSkyline;
      const showBuildings = visible || keepSkyline;
      cityBlocks.visible = showBuildings;
      cityCaps.visible = showBuildings;
      cityWindows.visible = showBuildings;
      trafficStreaksInst.visible = visible;
      roadMesh.visible = visible;
      centerDashes.visible = visible;
      urbanGround.visible = visible;
    },
    update: (elapsedTime: number, dt: number) => {
      skyUniforms.uTime.value = elapsedTime;
      riverUniforms.uTime.value = elapsedTime;

      if (!exteriorCityVisible) return;

      // Animate Embankment nighttime vehicular light trails smoothly
      for (let i = 0; i < streakCount; i++) {
        const s = trafficData[i];
        s.x += s.speed * dt;
        if (s.x > 205) s.x = -205;
        if (s.x < -205) s.x = 205;

        dummy.position.set(s.x, 0.78, s.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(s.length, 1, 1);
        dummy.updateMatrix();
        trafficStreaksInst.setMatrixAt(i, dummy.matrix);
      }
      trafficStreaksInst.instanceMatrix.needsUpdate = true;
    },
    dispose: () => {
      geometriesToDispose.forEach((g) => g.dispose());
      materialsToDispose.forEach((m) => m.dispose());
    },
  };
}
