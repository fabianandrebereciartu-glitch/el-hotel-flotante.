import * as THREE from 'three';
import {
  classifyRoomBay,
  FACADE_ATLAS_COLS,
  FACADE_ATLAS_HEIGHT,
  FACADE_ATLAS_ROWS,
  FACADE_ATLAS_WIDTH,
} from '../architecture/facadeAtlas';

export interface ProceduralTextureSet {
  portlandAlbedo: THREE.CanvasTexture;
  portlandBump: THREE.CanvasTexture;
  cobbleAlbedo: THREE.CanvasTexture;
  cobbleBump: THREE.CanvasTexture;
  basaltAlbedo: THREE.CanvasTexture;
  basaltBump: THREE.CanvasTexture;
  basaltRoughness: THREE.CanvasTexture;
  smokedOakAlbedo: THREE.CanvasTexture;
  smokedOakBump: THREE.CanvasTexture;
  teakPlankAlbedo: THREE.CanvasTexture;
  teakPlankBump: THREE.CanvasTexture;
  darkMarbleAlbedo: THREE.CanvasTexture;
  boucleBump: THREE.CanvasTexture;
  flutedOnyxMap: THREE.CanvasTexture;
  helipadMap: THREE.CanvasTexture;
  steamSprite: THREE.CanvasTexture;
  plaqueLvl14: THREE.CanvasTexture;
  plaqueLvl34: THREE.CanvasTexture;
  plaqueLvl68: THREE.CanvasTexture;
  towerFacadeAlbedo: THREE.CanvasTexture;
  towerFacadeEmissive: THREE.CanvasTexture;
  towerFacadeRoughness: THREE.CanvasTexture;
  dispose: () => void;
}

function seededNoise(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Portland Stone Ashlar Albedo + Bump
  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = 512;
  stoneCanvas.height = 512;
  const sCtx = stoneCanvas.getContext('2d')!;

  const stoneBumpCanvas = document.createElement('canvas');
  stoneBumpCanvas.width = 512;
  stoneBumpCanvas.height = 512;
  const sbCtx = stoneBumpCanvas.getContext('2d')!;

  sCtx.fillStyle = '#EAE2D3';
  sCtx.fillRect(0, 0, 512, 512);
  sbCtx.fillStyle = '#909090';
  sbCtx.fillRect(0, 0, 512, 512);

  const rows = 8;
  const rowH = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const cols = 4;
    const colW = 512 / cols;
    const offset = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * colW + offset;
      const by = r * rowH;
      const tone = 224 + Math.floor((seededNoise(c + 5, r + 3) - 0.5) * 16);
      sCtx.fillStyle = `rgb(${tone}, ${tone - 6}, ${tone - 16})`;
      sCtx.fillRect(bx + 2, by + 2, colW - 4, rowH - 4);

      const bumpTone = 148 + Math.floor((seededNoise(c + 13, r + 7) - 0.5) * 26);
      sbCtx.fillStyle = `rgb(${bumpTone}, ${bumpTone}, ${bumpTone})`;
      sbCtx.fillRect(bx + 2, by + 2, colW - 4, rowH - 4);
    }
  }

  for (let i = 0; i < 4500; i++) {
    const x = seededNoise(i, 1.3) * 512;
    const y = seededNoise(i, 7.9) * 512;
    const alpha = 0.03 + seededNoise(i, 4.1) * 0.05;
    sCtx.fillStyle =
      seededNoise(i, 9.2) > 0.5
        ? `rgba(40,36,30,${alpha})`
        : `rgba(255,252,245,${alpha})`;
    sCtx.fillRect(x, y, 2, 2);
  }

  const portlandAlbedo = new THREE.CanvasTexture(stoneCanvas);
  portlandAlbedo.colorSpace = THREE.SRGBColorSpace;
  portlandAlbedo.wrapS = THREE.RepeatWrapping;
  portlandAlbedo.wrapT = THREE.RepeatWrapping;
  portlandAlbedo.repeat.set(3, 3);
  portlandAlbedo.anisotropy = maxAnisotropy;

  const portlandBump = new THREE.CanvasTexture(stoneBumpCanvas);
  portlandBump.colorSpace = THREE.NoColorSpace;
  portlandBump.wrapS = THREE.RepeatWrapping;
  portlandBump.wrapT = THREE.RepeatWrapping;
  portlandBump.repeat.set(3, 3);
  portlandBump.anisotropy = maxAnisotropy;

  // 2. Damp London Embankment Cobblestone Albedo + Bump
  const cobbleCanvas = document.createElement('canvas');
  cobbleCanvas.width = 512;
  cobbleCanvas.height = 512;
  const cCtx = cobbleCanvas.getContext('2d')!;

  const cobbleBumpCanvas = document.createElement('canvas');
  cobbleBumpCanvas.width = 512;
  cobbleBumpCanvas.height = 512;
  const cbCtx = cobbleBumpCanvas.getContext('2d')!;

  cCtx.fillStyle = '#15161B';
  cCtx.fillRect(0, 0, 512, 512);
  cbCtx.fillStyle = '#242424';
  cbCtx.fillRect(0, 0, 512, 512);

  const cRows = 16;
  const cCols = 12;
  const cw = 512 / cCols;
  const ch = 512 / cRows;
  for (let r = 0; r < cRows; r++) {
    const rowShift = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cCols; c++) {
      const n = seededNoise(c * 3.1, r * 5.7);
      const x = c * cw + rowShift + 2;
      const y = r * ch + 2;
      const w = cw - 4;
      const h = ch - 4;
      const v = 32 + Math.floor(n * 24);
      cCtx.fillStyle = `rgb(${v}, ${v + 1}, ${v + 6})`;
      cCtx.fillRect(x, y, w, h);

      const bv = 135 + Math.floor(n * 95);
      cbCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
      cbCtx.fillRect(x + 1, y + 1, w - 2, h - 2);
    }
  }

  const cobbleAlbedo = new THREE.CanvasTexture(cobbleCanvas);
  cobbleAlbedo.colorSpace = THREE.SRGBColorSpace;
  cobbleAlbedo.wrapS = THREE.RepeatWrapping;
  cobbleAlbedo.wrapT = THREE.RepeatWrapping;
  cobbleAlbedo.repeat.set(14, 10);
  cobbleAlbedo.anisotropy = maxAnisotropy;

  const cobbleBump = new THREE.CanvasTexture(cobbleBumpCanvas);
  cobbleBump.colorSpace = THREE.NoColorSpace;
  cobbleBump.wrapS = THREE.RepeatWrapping;
  cobbleBump.wrapT = THREE.RepeatWrapping;
  cobbleBump.repeat.set(14, 10);
  cobbleBump.anisotropy = maxAnisotropy;

  // 3. Heated Honed Charcoal Basalt 60x60cm Tile Albedo + Bump + Roughness
  const basaltCanvas = document.createElement('canvas');
  basaltCanvas.width = 512;
  basaltCanvas.height = 512;
  const bCtx = basaltCanvas.getContext('2d')!;

  const basaltBumpCanvas = document.createElement('canvas');
  basaltBumpCanvas.width = 512;
  basaltBumpCanvas.height = 512;
  const bbCtx = basaltBumpCanvas.getContext('2d')!;

  const basaltRoughCanvas = document.createElement('canvas');
  basaltRoughCanvas.width = 512;
  basaltRoughCanvas.height = 512;
  const brCtx = basaltRoughCanvas.getContext('2d')!;

  // Crisp recessed grout line base
  bCtx.fillStyle = '#0D0E10';
  bCtx.fillRect(0, 0, 512, 512);
  bbCtx.fillStyle = '#383838';
  bbCtx.fillRect(0, 0, 512, 512);
  brCtx.fillStyle = '#D8D8D8';
  brCtx.fillRect(0, 0, 512, 512);

  const tiles = 4;
  const tilePx = 512 / tiles;
  for (let tr = 0; tr < tiles; tr++) {
    for (let tc = 0; tc < tiles; tc++) {
      const n = seededNoise(tc * 7.3 + 2, tr * 11.1 + 5);
      const tx = tc * tilePx + 2;
      const ty = tr * tilePx + 2;
      const ts = tilePx - 4;

      const baseR = 20 + Math.floor(n * 8);
      const baseG = 22 + Math.floor(n * 8);
      const baseB = 25 + Math.floor(n * 9);
      bCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
      bCtx.fillRect(tx, ty, ts, ts);

      // Subtle mineral veining streak across honed basalt slab
      bCtx.fillStyle = `rgba(180, 188, 195, ${0.025 + n * 0.025})`;
      bCtx.fillRect(tx + n * 24, ty + ((tr * 19) % 40), ts * 0.65, 2);

      const bv = 190 + Math.floor(n * 22);
      bbCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
      bbCtx.fillRect(tx, ty, ts, ts);

      const rv = 182 + Math.floor(n * 24); // ~0.71-0.81 honed matte basalt (no harsh glare)
      brCtx.fillStyle = `rgb(${rv}, ${rv}, ${rv})`;
      brCtx.fillRect(tx, ty, ts, ts);
    }
  }

  for (let i = 0; i < 3600; i++) {
    const px = seededNoise(i, 2.7) * 512;
    const py = seededNoise(i, 6.4) * 512;
    const alpha = 0.02 + seededNoise(i, 8.1) * 0.035;
    bCtx.fillStyle =
      seededNoise(i, 3.5) > 0.5
        ? `rgba(12, 13, 15, ${alpha})`
        : `rgba(85, 92, 98, ${alpha})`;
    bCtx.fillRect(px, py, 2, 2);
  }

  const basaltAlbedo = new THREE.CanvasTexture(basaltCanvas);
  basaltAlbedo.colorSpace = THREE.SRGBColorSpace;
  basaltAlbedo.wrapS = THREE.RepeatWrapping;
  basaltAlbedo.wrapT = THREE.RepeatWrapping;
  basaltAlbedo.repeat.set(9, 5);
  basaltAlbedo.anisotropy = maxAnisotropy;

  const basaltBump = new THREE.CanvasTexture(basaltBumpCanvas);
  basaltBump.colorSpace = THREE.NoColorSpace;
  basaltBump.wrapS = THREE.RepeatWrapping;
  basaltBump.wrapT = THREE.RepeatWrapping;
  basaltBump.repeat.set(9, 5);
  basaltBump.anisotropy = maxAnisotropy;

  const basaltRoughness = new THREE.CanvasTexture(basaltRoughCanvas);
  basaltRoughness.colorSpace = THREE.NoColorSpace;
  basaltRoughness.wrapS = THREE.RepeatWrapping;
  basaltRoughness.wrapT = THREE.RepeatWrapping;
  basaltRoughness.repeat.set(9, 5);
  basaltRoughness.anisotropy = maxAnisotropy;

  // 4. Smoked-Oak Herringbone Architectural Parquet Albedo + Bump
  const oakCanvas = document.createElement('canvas');
  oakCanvas.width = 512;
  oakCanvas.height = 512;
  const oCtx = oakCanvas.getContext('2d')!;

  const oakBumpCanvas = document.createElement('canvas');
  oakBumpCanvas.width = 512;
  oakBumpCanvas.height = 512;
  const obCtx = oakBumpCanvas.getContext('2d')!;

  oCtx.fillStyle = '#1E140D';
  oCtx.fillRect(0, 0, 512, 512);
  obCtx.fillStyle = '#525252';
  obCtx.fillRect(0, 0, 512, 512);

  // Subtle tileable herringbone chevron parquet blocks
  const hbCols = 8;
  const hbRows = 16;
  const cellW = 512 / hbCols;
  const cellH = 512 / hbRows;
  for (let r = -2; r <= hbRows + 2; r++) {
    for (let c = -2; c <= hbCols + 2; c++) {
      const n = seededNoise(c * 5.1 + 3, r * 8.7 + 7);
      const isRightSlope = (c + r) % 2 === 0;
      const cx = c * cellW;
      const cy = r * cellH;
      const rCol = 34 + Math.floor(n * 16);
      const gCol = 23 + Math.floor(n * 11);
      const bCol = 16 + Math.floor(n * 8);
      const bv = 164 + Math.floor(n * 34);

      const drawBlock = (ctx: CanvasRenderingContext2D, fill: string, inset: number) => {
        ctx.save();
        ctx.translate(cx + cellW * 0.5, cy + cellH * 0.5);
        ctx.rotate(isRightSlope ? Math.PI / 4 : -Math.PI / 4);
        ctx.fillStyle = fill;
        ctx.fillRect(-cellW * 0.52 + inset, -cellH * 0.42 + inset, cellW * 1.04 - inset * 2, cellH * 0.84 - inset * 2);
        ctx.restore();
      };

      drawBlock(oCtx, `rgb(${rCol}, ${gCol}, ${bCol})`, 1);
      drawBlock(obCtx, `rgb(${bv}, ${bv}, ${bv})`, 1);

      // Fine wood grain striations inside each herringbone block
      oCtx.save();
      oCtx.translate(cx + cellW * 0.5, cy + cellH * 0.5);
      oCtx.rotate(isRightSlope ? Math.PI / 4 : -Math.PI / 4);
      for (let g = 0; g < 3; g++) {
        const gn = seededNoise(r * 11 + g, c * 7 + 1);
        oCtx.fillStyle = `rgba(16, 10, 6, ${0.12 + gn * 0.14})`;
        oCtx.fillRect(-cellW * 0.48, -cellH * 0.3 + g * (cellH * 0.24), cellW * 0.96, 1.5);
      }
      oCtx.restore();
    }
  }

  const smokedOakAlbedo = new THREE.CanvasTexture(oakCanvas);
  smokedOakAlbedo.colorSpace = THREE.SRGBColorSpace;
  smokedOakAlbedo.wrapS = THREE.RepeatWrapping;
  smokedOakAlbedo.wrapT = THREE.RepeatWrapping;
  smokedOakAlbedo.repeat.set(4, 4);
  smokedOakAlbedo.anisotropy = maxAnisotropy;

  const smokedOakBump = new THREE.CanvasTexture(oakBumpCanvas);
  smokedOakBump.colorSpace = THREE.NoColorSpace;
  smokedOakBump.wrapS = THREE.RepeatWrapping;
  smokedOakBump.wrapT = THREE.RepeatWrapping;
  smokedOakBump.repeat.set(4, 4);
  smokedOakBump.anisotropy = maxAnisotropy;

  // 4a. Warm Oiled Teak Spa Wet-Deck Plank Albedo (#69452C) + Caulking Bump
  const teakCanvas = document.createElement('canvas');
  teakCanvas.width = 512;
  teakCanvas.height = 512;
  const tCtx = teakCanvas.getContext('2d')!;

  const teakBumpCanvas = document.createElement('canvas');
  teakBumpCanvas.width = 512;
  teakBumpCanvas.height = 512;
  const tbCtx = teakBumpCanvas.getContext('2d')!;

  // Dark waterproof deck caulking between teak boards
  tCtx.fillStyle = '#1B1410';
  tCtx.fillRect(0, 0, 512, 512);
  tbCtx.fillStyle = '#383838';
  tbCtx.fillRect(0, 0, 512, 512);

  const plankRows = 12;
  const plankH = 512 / plankRows;
  for (let pr = 0; pr < plankRows; pr++) {
    const joints = pr % 2 === 0 ? [0, 210, 512] : [0, 340, 512];
    for (let pj = 0; pj < joints.length - 1; pj++) {
      const px0 = joints[pj] + 2;
      const pw = joints[pj + 1] - joints[pj] - 4;
      const py0 = pr * plankH + 2;
      const ph = plankH - 4;

      const n = seededNoise(pr * 7.1 + pj * 3.9, pr * 2.3);
      const rCol = 96 + Math.floor(n * 20); // ~#69452C warm oiled teak
      const gCol = 62 + Math.floor(n * 15);
      const bCol = 39 + Math.floor(n * 11);
      tCtx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
      tCtx.fillRect(px0, py0, pw, ph);

      const bv = 175 + Math.floor(n * 30);
      tbCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
      tbCtx.fillRect(px0, py0, pw, ph);

      // Fine longitudinal wood grain lines
      for (let g = 0; g < 6; g++) {
        const gn = seededNoise(pr * 13 + g, pj * 5 + g);
        const gy = py0 + 3 + (g / 6) * (ph - 6);
        tCtx.fillStyle =
          g % 2 === 0
            ? `rgba(42, 24, 12, ${0.14 + gn * 0.14})`
            : `rgba(148, 102, 68, ${0.08 + gn * 0.1})`;
        tCtx.fillRect(px0, gy, pw, 1.8);
      }
    }
  }

  const teakPlankAlbedo = new THREE.CanvasTexture(teakCanvas);
  teakPlankAlbedo.colorSpace = THREE.SRGBColorSpace;
  teakPlankAlbedo.wrapS = THREE.RepeatWrapping;
  teakPlankAlbedo.wrapT = THREE.RepeatWrapping;
  teakPlankAlbedo.repeat.set(3, 3);
  teakPlankAlbedo.anisotropy = maxAnisotropy;

  const teakPlankBump = new THREE.CanvasTexture(teakBumpCanvas);
  teakPlankBump.colorSpace = THREE.NoColorSpace;
  teakPlankBump.wrapS = THREE.RepeatWrapping;
  teakPlankBump.wrapT = THREE.RepeatWrapping;
  teakPlankBump.repeat.set(3, 3);
  teakPlankBump.anisotropy = maxAnisotropy;

  // 4b. Dark Nero Marquina Monolithic Marble Albedo
  const marbleCanvas = document.createElement('canvas');
  marbleCanvas.width = 512;
  marbleCanvas.height = 512;
  const mCtx = marbleCanvas.getContext('2d')!;
  mCtx.fillStyle = '#141315';
  mCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2400; i++) {
    const mx = seededNoise(i, 1.9) * 512;
    const my = seededNoise(i, 5.3) * 512;
    const ma = 0.03 + seededNoise(i, 8.8) * 0.04;
    mCtx.fillStyle = `rgba(38, 36, 40, ${ma})`;
    mCtx.fillRect(mx, my, 3, 3);
  }
  for (let v = 0; v < 9; v++) {
    mCtx.beginPath();
    let vx = seededNoise(v, 2.1) * 512;
    let vy = 0;
    mCtx.moveTo(vx, vy);
    for (let step = 1; step <= 16; step++) {
      vx += (seededNoise(v * 17 + step, 3.3) - 0.45) * 48;
      vy = (step / 16) * 512;
      mCtx.lineTo(vx, vy);
    }
    mCtx.strokeStyle = v % 3 === 0 ? 'rgba(218, 198, 165, 0.24)' : 'rgba(244, 239, 230, 0.14)';
    mCtx.lineWidth = v % 3 === 0 ? 1.8 : 1.0;
    mCtx.stroke();
  }
  const darkMarbleAlbedo = new THREE.CanvasTexture(marbleCanvas);
  darkMarbleAlbedo.colorSpace = THREE.SRGBColorSpace;
  darkMarbleAlbedo.wrapS = THREE.RepeatWrapping;
  darkMarbleAlbedo.wrapT = THREE.RepeatWrapping;
  darkMarbleAlbedo.anisotropy = maxAnisotropy;

  // 4c. Subtle Ivory Boucle Textile Weave Bump
  const boucleCanvas = document.createElement('canvas');
  boucleCanvas.width = 256;
  boucleCanvas.height = 256;
  const bcCtx = boucleCanvas.getContext('2d')!;
  bcCtx.fillStyle = '#888888';
  bcCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const bx = seededNoise(i, 3.1) * 256;
    const by = seededNoise(i, 9.7) * 256;
    const shade = 96 + Math.floor(seededNoise(i, 4.4) * 115);
    bcCtx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    bcCtx.fillRect(bx, by, 2, 2);
  }
  const boucleBump = new THREE.CanvasTexture(boucleCanvas);
  boucleBump.colorSpace = THREE.NoColorSpace;
  boucleBump.wrapS = THREE.RepeatWrapping;
  boucleBump.wrapT = THREE.RepeatWrapping;
  boucleBump.repeat.set(6, 6);
  boucleBump.anisotropy = maxAnisotropy;

  // 5. Backlit Fluted Warm-Amber Onyx Backsplash Texture
  const onyxCanvas = document.createElement('canvas');
  onyxCanvas.width = 512;
  onyxCanvas.height = 512;
  const xCtx = onyxCanvas.getContext('2d')!;
  const onyxGrad = xCtx.createLinearGradient(0, 0, 0, 512);
  onyxGrad.addColorStop(0, '#B5792E');
  onyxGrad.addColorStop(0.38, '#E7AE58');
  onyxGrad.addColorStop(0.62, '#F7CC82');
  onyxGrad.addColorStop(1, '#9E6222');
  xCtx.fillStyle = onyxGrad;
  xCtx.fillRect(0, 0, 512, 512);

  // Diagonal warm honey mineral bands
  for (let band = 0; band < 10; band++) {
    const by = band * 52;
    xCtx.fillStyle = band % 2 === 0 ? 'rgba(255, 232, 185, 0.18)' : 'rgba(92, 48, 12, 0.18)';
    xCtx.fillRect(0, by, 512, 18);
  }
  // Vertical architectural fluting ribs
  for (let fx = 0; fx < 512; fx += 16) {
    xCtx.fillStyle = 'rgba(42, 22, 6, 0.28)';
    xCtx.fillRect(fx, 0, 4, 512);
    xCtx.fillStyle = 'rgba(255, 240, 200, 0.14)';
    xCtx.fillRect(fx + 5, 0, 3, 512);
  }

  const flutedOnyxMap = new THREE.CanvasTexture(onyxCanvas);
  flutedOnyxMap.colorSpace = THREE.SRGBColorSpace;
  flutedOnyxMap.anisotropy = maxAnisotropy;

  // 6. Helipad Deck Marking Texture ("H" + Bronze Circle)
  const heliCanvas = document.createElement('canvas');
  heliCanvas.width = 512;
  heliCanvas.height = 512;
  const hCtx = heliCanvas.getContext('2d')!;
  hCtx.fillStyle = '#14151A';
  hCtx.fillRect(0, 0, 512, 512);

  hCtx.strokeStyle = '#C29B38';
  hCtx.lineWidth = 10;
  hCtx.beginPath();
  hCtx.arc(256, 256, 210, 0, Math.PI * 2);
  hCtx.stroke();

  hCtx.strokeStyle = 'rgba(244, 239, 230, 0.35)';
  hCtx.lineWidth = 3;
  hCtx.setLineDash([18, 14]);
  hCtx.beginPath();
  hCtx.arc(256, 256, 186, 0, Math.PI * 2);
  hCtx.stroke();
  hCtx.setLineDash([]);

  hCtx.fillStyle = '#F4EFE6';
  hCtx.fillRect(184, 152, 26, 208);
  hCtx.fillRect(302, 152, 26, 208);
  hCtx.fillRect(184, 243, 144, 26);

  const helipadMap = new THREE.CanvasTexture(heliCanvas);
  helipadMap.colorSpace = THREE.SRGBColorSpace;
  helipadMap.anisotropy = maxAnisotropy;

  // 7. Soft Radial Steam / Mist Sprite
  const steamCanvas = document.createElement('canvas');
  steamCanvas.width = 128;
  steamCanvas.height = 128;
  const stCtx = steamCanvas.getContext('2d')!;
  const grad = stCtx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(244, 239, 230, 0.45)');
  grad.addColorStop(0.45, 'rgba(200, 224, 220, 0.16)');
  grad.addColorStop(1, 'rgba(200, 224, 220, 0)');
  stCtx.fillStyle = grad;
  stCtx.fillRect(0, 0, 128, 128);

  const steamSprite = new THREE.CanvasTexture(steamCanvas);
  steamSprite.colorSpace = THREE.SRGBColorSpace;

  // 8. Illuminated Architectural Foyer Plaques (Generated strictly ONCE on mount)
  const makePlaqueTexture = (label: string): THREE.CanvasTexture => {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 512;
    pCanvas.height = 96;
    const pCtx = pCanvas.getContext('2d')!;

    pCtx.fillStyle = '#12100D';
    pCtx.fillRect(0, 0, 512, 96);

    pCtx.strokeStyle = '#C29B38';
    pCtx.lineWidth = 3;
    pCtx.strokeRect(8, 8, 496, 80);

    pCtx.strokeStyle = 'rgba(244, 239, 230, 0.22)';
    pCtx.lineWidth = 1;
    pCtx.strokeRect(14, 14, 484, 68);

    pCtx.save();
    pCtx.font = '600 20px "IBM Plex Mono", ui-monospace, monospace';
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'middle';
    pCtx.shadowColor = 'rgba(255, 184, 108, 0.85)';
    pCtx.shadowBlur = 10;
    pCtx.fillStyle = '#FFE4B8';
    pCtx.fillText(label, 256, 49);
    pCtx.restore();

    const tex = new THREE.CanvasTexture(pCanvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return tex;
  };

  const plaqueLvl14 = makePlaqueTexture('[ LEVEL 14 · RESIDENCE FOYER ]');
  const plaqueLvl34 = makePlaqueTexture('[ LEVEL 34 · SPA FOYER ]');
  const plaqueLvl68 = makePlaqueTexture('[ LEVEL 68 · PRIVATE PENTHOUSE FOYER ]');

  // 9. High-Resolution Architectural Hotel Room Facade Atlas (1024x2048, generated ONCE)
  const facadeW = FACADE_ATLAS_WIDTH;
  const facadeH = FACADE_ATLAS_HEIGHT;

  const facadeAlbedoCanvas = document.createElement('canvas');
  facadeAlbedoCanvas.width = facadeW;
  facadeAlbedoCanvas.height = facadeH;
  const faCtx = facadeAlbedoCanvas.getContext('2d')!;

  const facadeEmissiveCanvas = document.createElement('canvas');
  facadeEmissiveCanvas.width = facadeW;
  facadeEmissiveCanvas.height = facadeH;
  const feCtx = facadeEmissiveCanvas.getContext('2d')!;

  const facadeRoughCanvas = document.createElement('canvas');
  facadeRoughCanvas.width = facadeW;
  facadeRoughCanvas.height = facadeH;
  const frCtx = facadeRoughCanvas.getContext('2d')!;

  // Base fill: Dark graphite-bronze spandrels/mullions (roughness 0.35 => 89/255)
  faCtx.fillStyle = '#171514';
  faCtx.fillRect(0, 0, facadeW, facadeH);
  feCtx.fillStyle = '#000000';
  feCtx.fillRect(0, 0, facadeW, facadeH);
  frCtx.fillStyle = 'rgb(89, 89, 89)';
  frCtx.fillRect(0, 0, facadeW, facadeH);

  const bayColW = facadeW / FACADE_ATLAS_COLS;
  const bayRowH = facadeH / FACADE_ATLAS_ROWS;

  for (let row = 0; row < FACADE_ATLAS_ROWS; row++) {
    // v=0 is canvas bottom, so row 0 starts near bottom (bayRowH=128px)
    const y0 = facadeH - (row + 1) * bayRowH;
    const spandrelPad = 7;
    const mullionPad = 4;
    const gy = y0 + spandrelPad;
    const gh = bayRowH - spandrelPad * 2;

    for (let col = 0; col < FACADE_ATLAS_COLS; col++) {
      const x0 = col * bayColW;
      const gx = x0 + mullionPad;
      const gw = bayColW - mullionPad * 2;
      const bay = classifyRoomBay(col, row);

      // Roughness map: super glossy architectural window glass (0.08 => 20/255)
      frCtx.fillStyle = 'rgb(20, 20, 20)';
      frCtx.fillRect(gx, gy, gw, gh);

      // Base glass pane interior & glow by mood
      if (bay.mood === 'warm-suite') {
        const albGrad = faCtx.createLinearGradient(0, gy, 0, gy + gh);
        albGrad.addColorStop(0, bay.warmthTone > 0.5 ? '#E8B778' : '#DCAA68');
        albGrad.addColorStop(0.28, '#9A693A');
        albGrad.addColorStop(0.75, '#4A311D');
        albGrad.addColorStop(1, '#261910');
        faCtx.fillStyle = albGrad;
        faCtx.fillRect(gx, gy, gw, gh);

        // 2700K ceiling-cove gradient glowing brightest near ceiling, fading smoothly down
        const emGrad = feCtx.createLinearGradient(0, gy, 0, gy + gh);
        emGrad.addColorStop(0, bay.warmthTone > 0.5 ? '#FFE5B4' : '#FFD493');
        emGrad.addColorStop(0.16, '#E9A754');
        emGrad.addColorStop(0.55, '#7A481E');
        emGrad.addColorStop(1, '#241308');
        feCtx.fillStyle = emGrad;
        feCtx.fillRect(gx, gy, gw, gh);

        // Crisp recessed ceiling cove glow strip at top edge
        feCtx.fillStyle = '#FFF1D2';
        feCtx.fillRect(gx + 6, gy + 2, gw - 12, 5);
      } else if (bay.mood === 'dim-mood') {
        const albGrad = faCtx.createLinearGradient(0, gy, 0, gy + gh);
        albGrad.addColorStop(0, '#36281F');
        albGrad.addColorStop(0.5, '#1D1C22');
        albGrad.addColorStop(1, '#101520');
        faCtx.fillStyle = albGrad;
        faCtx.fillRect(gx, gy, gw, gh);

        const emGrad = feCtx.createLinearGradient(0, gy, 0, gy + gh);
        emGrad.addColorStop(0, '#59391B');
        emGrad.addColorStop(0.42, '#281A0E');
        emGrad.addColorStop(1, '#090708');
        feCtx.fillStyle = emGrad;
        feCtx.fillRect(gx, gy, gw, gh);
      } else {
        // Dark unlit midnight reflective glass
        const albGrad = faCtx.createLinearGradient(0, gy, 0, gy + gh);
        albGrad.addColorStop(0, '#091422');
        albGrad.addColorStop(0.55, '#0D1C2F');
        albGrad.addColorStop(1, '#070F1B');
        faCtx.fillStyle = albGrad;
        faCtx.fillRect(gx, gy, gw, gh);

        feCtx.fillStyle = '#030508';
        feCtx.fillRect(gx, gy, gw, gh);
      }

      // Faint subtle architectural interior silhouettes (floor lamp / sofa / headboard)
      if (bay.silhouette !== 'none') {
        const drawSilhouette = (ctx: CanvasRenderingContext2D, color: string) => {
          ctx.fillStyle = color;
          if (bay.silhouette === 'floor-lamp') {
            const side = bay.warmthTone > 0.5 ? gx + gw * 0.27 : gx + gw * 0.73;
            // Stem + base + tapered shade
            ctx.fillRect(side - 1.5, gy + gh * 0.34, 3, gh * 0.64);
            ctx.fillRect(side - 9, gy + gh * 0.94, 18, 4);
            ctx.beginPath();
            ctx.moveTo(side - 9, gy + gh * 0.36);
            ctx.lineTo(side + 9, gy + gh * 0.36);
            ctx.lineTo(side + 13, gy + gh * 0.52);
            ctx.lineTo(side - 13, gy + gh * 0.52);
            ctx.closePath();
            ctx.fill();
            // Low credenza across opposite side
            const credX = bay.warmthTone > 0.5 ? gx + gw * 0.45 : gx + gw * 0.22;
            ctx.fillRect(credX, gy + gh * 0.78, gw * 0.36, gh * 0.2);
          } else if (bay.silhouette === 'sofa') {
            const sx = gx + gw * 0.22;
            const sw = gw * 0.56;
            // Backrest + seat + armrests
            ctx.fillRect(sx, gy + gh * 0.64, sw, gh * 0.34);
            ctx.fillRect(sx - 5, gy + gh * 0.72, sw + 10, gh * 0.26);
            // Low coffee table silhouette
            ctx.fillRect(sx + sw * 0.22, gy + gh * 0.87, sw * 0.56, gh * 0.11);
          } else if (bay.silhouette === 'headboard') {
            const hx = gx + gw * 0.24;
            const hw = gw * 0.52;
            ctx.fillRect(hx, gy + gh * 0.54, hw, gh * 0.44);
            ctx.fillRect(hx + hw * 0.14, gy + gh * 0.7, hw * 0.72, gh * 0.28);
          }
        };

        const alpha = bay.mood === 'warm-suite' ? 0.58 : 0.68;
        drawSilhouette(faCtx, `rgba(18, 12, 8, ${alpha})`);
        drawSilhouette(feCtx, `rgba(14, 9, 5, ${alpha + 0.18})`);

        // Subtle warm bedside/lamp accent halo for headboards & dim mood lamps
        if (bay.silhouette === 'headboard' && bay.mood === 'warm-suite') {
          for (const lx of [gx + gw * 0.26, gx + gw * 0.74]) {
            const lampHalo = feCtx.createRadialGradient(
              lx,
              gy + gh * 0.64,
              1,
              lx,
              gy + gh * 0.64,
              14,
            );
            lampHalo.addColorStop(0, 'rgba(255, 224, 165, 0.75)');
            lampHalo.addColorStop(1, 'rgba(255, 180, 95, 0)');
            feCtx.fillStyle = lampHalo;
            feCtx.fillRect(lx - 15, gy + gh * 0.5, 30, 28);
          }
        }
      }

      // Soft vertical linen drapes / curtains framing left & right window sides
      const leftDrapeW = Math.round(gw * bay.curtainPullLeft);
      const rightDrapeW = Math.round(gw * bay.curtainPullRight);

      const drawDrapes = (dx: number, dw: number, isLeft: boolean) => {
        const foldCount = 3;
        const foldW = dw / foldCount;
        for (let f = 0; f < foldCount; f++) {
          const fx = dx + f * foldW;
          const isLit = bay.mood === 'warm-suite';
          const isDim = bay.mood === 'dim-mood';

          // Albedo curtain pleats
          const shade = f % 2 === 0 ? 1 : 0.78;
          if (isLit) {
            faCtx.fillStyle = `rgba(${Math.round(78 * shade)}, ${Math.round(62 * shade)}, ${Math.round(48 * shade)}, 0.76)`;
          } else if (isDim) {
            faCtx.fillStyle = `rgba(${Math.round(38 * shade)}, ${Math.round(33 * shade)}, ${Math.round(30 * shade)}, 0.82)`;
          } else {
            faCtx.fillStyle = `rgba(${Math.round(22 * shade)}, ${Math.round(25 * shade)}, ${Math.round(32 * shade)}, 0.85)`;
          }
          faCtx.fillRect(fx, gy, Math.ceil(foldW), gh);

          // Emissive curtain attenuation (subtle warm edge transmission on lit suites)
          if (isLit) {
            const innerEdge = isLeft ? f === foldCount - 1 : f === 0;
            feCtx.fillStyle = innerEdge
              ? 'rgba(24, 14, 7, 0.52)'
              : 'rgba(10, 6, 3, 0.78)';
            feCtx.fillRect(fx, gy, Math.ceil(foldW), gh);
          } else if (isDim) {
            feCtx.fillStyle = 'rgba(6, 4, 2, 0.82)';
            feCtx.fillRect(fx, gy, Math.ceil(foldW), gh);
          }
        }
      };

      drawDrapes(gx, leftDrapeW, true);
      drawDrapes(gx + gw - rightDrapeW, rightDrapeW, false);

      // Subtle diagonal architectural glass reflection sheen across pane
      const reflGrad = faCtx.createLinearGradient(gx, gy, gx + gw, gy + gh);
      reflGrad.addColorStop(0, 'rgba(130, 175, 220, 0.08)');
      reflGrad.addColorStop(0.35, 'rgba(180, 210, 240, 0.02)');
      reflGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.0)');
      reflGrad.addColorStop(1, 'rgba(90, 140, 195, 0.06)');
      faCtx.fillStyle = reflGrad;
      faCtx.fillRect(gx, gy, gw, gh);
    }
  }

  const towerFacadeAlbedo = new THREE.CanvasTexture(facadeAlbedoCanvas);
  towerFacadeAlbedo.colorSpace = THREE.SRGBColorSpace;
  towerFacadeAlbedo.wrapS = THREE.RepeatWrapping;
  towerFacadeAlbedo.wrapT = THREE.RepeatWrapping;
  towerFacadeAlbedo.anisotropy = maxAnisotropy;

  const towerFacadeEmissive = new THREE.CanvasTexture(facadeEmissiveCanvas);
  towerFacadeEmissive.colorSpace = THREE.SRGBColorSpace;
  towerFacadeEmissive.wrapS = THREE.RepeatWrapping;
  towerFacadeEmissive.wrapT = THREE.RepeatWrapping;
  towerFacadeEmissive.anisotropy = maxAnisotropy;

  const towerFacadeRoughness = new THREE.CanvasTexture(facadeRoughCanvas);
  towerFacadeRoughness.colorSpace = THREE.NoColorSpace;
  towerFacadeRoughness.wrapS = THREE.RepeatWrapping;
  towerFacadeRoughness.wrapT = THREE.RepeatWrapping;
  towerFacadeRoughness.anisotropy = maxAnisotropy;

  return {
    portlandAlbedo,
    portlandBump,
    cobbleAlbedo,
    cobbleBump,
    basaltAlbedo,
    basaltBump,
    basaltRoughness,
    smokedOakAlbedo,
    smokedOakBump,
    teakPlankAlbedo,
    teakPlankBump,
    darkMarbleAlbedo,
    boucleBump,
    flutedOnyxMap,
    helipadMap,
    steamSprite,
    plaqueLvl14,
    plaqueLvl34,
    plaqueLvl68,
    towerFacadeAlbedo,
    towerFacadeEmissive,
    towerFacadeRoughness,
    dispose: () => {
      portlandAlbedo.dispose();
      portlandBump.dispose();
      cobbleAlbedo.dispose();
      cobbleBump.dispose();
      basaltAlbedo.dispose();
      basaltBump.dispose();
      basaltRoughness.dispose();
      smokedOakAlbedo.dispose();
      smokedOakBump.dispose();
      teakPlankAlbedo.dispose();
      teakPlankBump.dispose();
      darkMarbleAlbedo.dispose();
      boucleBump.dispose();
      flutedOnyxMap.dispose();
      helipadMap.dispose();
      steamSprite.dispose();
      plaqueLvl14.dispose();
      plaqueLvl34.dispose();
      plaqueLvl68.dispose();
      towerFacadeAlbedo.dispose();
      towerFacadeEmissive.dispose();
      towerFacadeRoughness.dispose();
    },
  };
}
