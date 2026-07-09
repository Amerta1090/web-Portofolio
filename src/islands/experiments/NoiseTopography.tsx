import { useRef, useEffect, useState, useCallback } from "react";

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function seededPerm(seed: number): number[] {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = Math.max(1, seed + 1);
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  return perm;
}

function perlin2D(x: number, y: number, perm: number[]): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);
  const aa = perm[perm[X] + Y];
  const ab = perm[perm[X] + Y + 1];
  const ba = perm[perm[X + 1] + Y];
  const bb = perm[perm[X + 1] + Y + 1];
  return lerp(
    lerp(grad(perm[aa], xf, yf), grad(perm[ba], xf - 1, yf), u),
    lerp(grad(perm[ab], xf, yf - 1), grad(perm[bb], xf - 1, yf - 1), u),
    v,
  );
}

function fbm(
  x: number, y: number,
  octaves: number, persistence: number, lacunarity: number,
  perm: number[],
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * perlin2D(x * frequency, y * frequency, perm);
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return maxValue > 0 ? value / maxValue : 0;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function terrainColor(height: number, maxH: number): [number, number, number] {
  const n = maxH > 0 ? Math.max(-1, Math.min(1, height / maxH)) * 0.5 + 0.5 : 0.5;
  if (n < 0.25) return lerpColor([20, 60, 140], [30, 100, 180], n / 0.25);
  if (n < 0.45) return lerpColor([30, 100, 180], [60, 160, 80], (n - 0.25) / 0.2);
  if (n < 0.65) return lerpColor([60, 160, 80], [160, 140, 50], (n - 0.45) / 0.2);
  if (n < 0.85) return lerpColor([160, 140, 50], [180, 160, 140], (n - 0.65) / 0.2);
  return lerpColor([180, 160, 140], [240, 240, 240], (n - 0.85) / 0.15);
}

function triangleNormal(
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  x3: number, y3: number, z3: number,
): [number, number, number] {
  const ux = x2 - x1, uy = y2 - y1, uz = z2 - z1;
  const vx = x3 - x1, vy = y3 - y1, vz = z3 - z1;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len < 1e-8) return [0, 1, 0];
  return [nx / len, ny / len, nz / len];
}

function diffuseShade(
  x1: number, z1: number, h1: number,
  x2: number, z2: number, h2: number,
  x3: number, z3: number, h3: number,
  lx: number, ly: number, lz: number,
): number {
  const [nx, ny, nz] = triangleNormal(x1, h1, z1, x2, h2, z2, x3, h3, z3);
  const dot = nx * lx + ny * ly + nz * lz;
  return 0.3 + 0.7 * Math.max(0, dot);
}

function exportSTL(heights: number[][], gridW: number, gridH: number, cellSize: number, heightMult: number): void {
  if (!heights || heights.length < 2) return;
  const hScale = heightMult * 0.5;
  const ox = gridW * cellSize * 0.5;
  const oz = gridH * cellSize * 0.5;
  let stl = "solid noise_topography\n";
  for (let y = 0; y < gridH - 1; y++) {
    for (let x = 0; x < gridW - 1; x++) {
      const h00 = heights[y][x] * hScale;
      const h10 = heights[y][x + 1] * hScale;
      const h01 = heights[y + 1][x] * hScale;
      const h11 = heights[y + 1][x + 1] * hScale;
      const x0 = x * cellSize - ox, x1 = (x + 1) * cellSize - ox;
      const z0 = y * cellSize - oz, z1 = (y + 1) * cellSize - oz;
      const n1 = triangleNormal(x0, h00, z0, x1, h10, z0, x0, h01, z1);
      const n2 = triangleNormal(x1, h10, z0, x1, h11, z1, x0, h01, z1);
      stl += `facet normal ${n1[0].toFixed(6)} ${n1[1].toFixed(6)} ${n1[2].toFixed(6)}\nouter loop\n`;
      stl += `vertex ${x0.toFixed(4)} ${h00.toFixed(4)} ${z0.toFixed(4)}\n`;
      stl += `vertex ${x1.toFixed(4)} ${h10.toFixed(4)} ${z0.toFixed(4)}\n`;
      stl += `vertex ${x0.toFixed(4)} ${h01.toFixed(4)} ${z1.toFixed(4)}\n`;
      stl += `endloop\nendfacet\n`;
      stl += `facet normal ${n2[0].toFixed(6)} ${n2[1].toFixed(6)} ${n2[2].toFixed(6)}\nouter loop\n`;
      stl += `vertex ${x1.toFixed(4)} ${h10.toFixed(4)} ${z0.toFixed(4)}\n`;
      stl += `vertex ${x1.toFixed(4)} ${h11.toFixed(4)} ${z1.toFixed(4)}\n`;
      stl += `vertex ${x0.toFixed(4)} ${h01.toFixed(4)} ${z1.toFixed(4)}\n`;
      stl += `endloop\nendfacet\n`;
    }
  }
  stl += "endsolid noise_topography\n";
  const blob = new Blob([stl], { type: "application/sla" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "noise-terrain.stl";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const OCTAVE_COLORS = [
  "#f59e0b", "#8b5cf6", "#06b6d4", "#10b981",
  "#ec4899", "#f97316", "#14b8a6", "#a855f7",
];

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

export default function NoiseTopography({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const permRef = useRef<number[]>(seededPerm(42));
  const heightsRef = useRef<number[][]>([]);
  const maxHRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const gridWRef = useRef(80);
  const gridHRef = useRef(60);

  const [octaves, setOctaves] = useState(4);
  const [persistence, setPersistence] = useState(0.5);
  const [lacunarity, setLacunarity] = useState(2.0);
  const [seed, setSeed] = useState(42);
  const [heightMult, setHeightMult] = useState(100);
  const [autoRotate, setAutoRotate] = useState(true);

  const octavesRef = useRef(octaves);
  const persistenceRef = useRef(persistence);
  const lacunarityRef = useRef(lacunarity);
  const seedRef = useRef(seed);
  const heightMultRef = useRef(heightMult);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => { octavesRef.current = octaves; }, [octaves]);
  useEffect(() => { persistenceRef.current = persistence; }, [persistence]);
  useEffect(() => { lacunarityRef.current = lacunarity; }, [lacunarity]);
  useEffect(() => { heightMultRef.current = heightMult; }, [heightMult]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => {
    seedRef.current = seed;
    permRef.current = seededPerm(seed);
  }, [seed]);

  const handleExportSTL = useCallback(() => {
    const h = heightsRef.current;
    if (!h || h.length < 2) return;
    const gW = h[0]?.length || 80;
    const gH = h.length;
    const cs = Math.min(containerRef.current?.clientWidth || 800, containerRef.current?.clientHeight || 600);
    const cellSize = cs * 0.75 / (Math.max(gW, gH) * 1.5);
    exportSTL(h, gW, gH, cellSize, heightMultRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;
    timeRef.current = 0;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 600),
    });

    const resize = () => {
      const { w, h } = getSize();
      const dpr = compact ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function render() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(render);

      const { w, h } = getSize();
      const oct = octavesRef.current;
      const pers = persistenceRef.current;
      const lac = lacunarityRef.current;
      const perm = permRef.current;
      const hm = heightMultRef.current;
      const auto = autoRotateRef.current;

      const gridW = compact ? 40 : 80;
      const gridH = compact ? 30 : 60;
      gridWRef.current = gridW;
      gridHRef.current = gridH;

      const maxSpan = Math.max(gridW, gridH) * 1.5;
      const cellSize = Math.min(w, h) * 0.75 / maxSpan;
      const hScale = hm * 0.015;

      const halfW = (gridW - 1) / 2;
      const halfH = (gridH - 1) / 2;
      const cx = w / 2 - (halfW - halfH) * cellSize * COS30;
      const cy = h / 2 - (halfW + halfH) * cellSize * SIN30 + cellSize * 2;

      if (auto) {
        offsetXRef.current += 0.004;
      }

      const ox = offsetXRef.current;
      const oy = offsetYRef.current;

      const heights: number[][] = [];
      let maxH = 0;
      for (let gy = 0; gy < gridH; gy++) {
        const row: number[] = [];
        for (let gx = 0; gx < gridW; gx++) {
          const nx = (gx / gridW) * 5 + ox;
          const ny = (gy / gridH) * 5 + oy;
          const val = fbm(nx, ny, oct, pers, lac, perm);
          row.push(val);
          maxH = Math.max(maxH, Math.abs(val));
        }
        heights.push(row);
      }
      heightsRef.current = heights;
      maxHRef.current = maxH || 1;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const scale = cellSize;
      const lightDir: [number, number, number] = [0.4, -0.7, 0.6];
      const lightLen = Math.sqrt(lightDir[0] ** 2 + lightDir[1] ** 2 + lightDir[2] ** 2);
      const lx = lightDir[0] / lightLen;
      const ly = lightDir[1] / lightLen;
      const lz = lightDir[2] / lightLen;

      for (let gy = 0; gy < gridH - 1; gy++) {
        for (let gx = 0; gx < gridW - 1; gx++) {
          const h00 = heights[gy][gx] * hScale;
          const h10 = heights[gy][gx + 1] * hScale;
          const h01 = heights[gy + 1][gx] * hScale;
          const h11 = heights[gy + 1][gx + 1] * hScale;

          const px00 = cx + (gx - gy) * scale * COS30;
          const py00 = cy + (gx + gy) * scale * SIN30 - h00;

          const px10 = cx + (gx + 1 - gy) * scale * COS30;
          const py10 = cy + (gx + 1 + gy) * scale * SIN30 - h10;

          const px01 = cx + (gx - (gy + 1)) * scale * COS30;
          const py01 = cy + (gx + gy + 1) * scale * SIN30 - h01;

          const px11 = cx + (gx + 1 - (gy + 1)) * scale * COS30;
          const py11 = cy + (gx + 1 + gy + 1) * scale * SIN30 - h11;

          const avgH1 = (heights[gy][gx] + heights[gy][gx + 1] + heights[gy + 1][gx]) / 3;
          const avgH2 = (heights[gy][gx + 1] + heights[gy + 1][gx + 1] + heights[gy + 1][gx]) / 3;

          const maxHv = maxHRef.current;
          const base1 = terrainColor(avgH1, maxHv);
          const base2 = terrainColor(avgH2, maxHv);

          const shade1 = diffuseShade(gx, gy, heights[gy][gx], gx + 1, gy, heights[gy][gx + 1], gx, gy + 1, heights[gy + 1][gx], lx, ly, lz);
          const shade2 = diffuseShade(gx + 1, gy, heights[gy][gx + 1], gx + 1, gy + 1, heights[gy + 1][gx + 1], gx, gy + 1, heights[gy + 1][gx], lx, ly, lz);

          ctx.beginPath();
          ctx.moveTo(px00, py00);
          ctx.lineTo(px10, py10);
          ctx.lineTo(px01, py01);
          ctx.closePath();
          ctx.fillStyle = `rgb(${Math.round(base1[0] * shade1)},${Math.round(base1[1] * shade1)},${Math.round(base1[2] * shade1)})`;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(px10, py10);
          ctx.lineTo(px11, py11);
          ctx.lineTo(px01, py01);
          ctx.closePath();
          ctx.fillStyle = `rgb(${Math.round(base2[0] * shade2)},${Math.round(base2[1] * shade2)},${Math.round(base2[2] * shade2)})`;
          ctx.fill();
        }
      }

      if (!compact) {
        const overlayX = w - 215;
        const overlayY = 10;
        const overlayW = 200;
        const overlayH = 105;

        ctx.fillStyle = "rgba(15,15,17,0.85)";
        ctx.fillRect(overlayX, overlayY, overlayW, overlayH);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(overlayX, overlayY, overlayW, overlayH);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "9px monospace";
        ctx.fillText("Noise Profile", overlayX + 6, overlayY + 11);

        const graphX = overlayX + 8;
        const graphY = overlayY + 16;
        const graphW = overlayW - 16;
        const graphH = overlayH - 22;

        for (let o = 0; o < oct; o++) {
          const amp = pers ** o;
          const freq = lac ** o;
          ctx.beginPath();
          ctx.strokeStyle = OCTAVE_COLORS[o % OCTAVE_COLORS.length] + "40";
          ctx.lineWidth = 0.8;
          for (let i = 0; i <= graphW; i++) {
            const t = i / graphW;
            const val = amp * perlin2D(t * 4 * freq, 0.5, perm);
            const py = graphY + graphH / 2 - val * (graphH / 2 - 2);
            if (i === 0) ctx.moveTo(graphX + i, py);
            else ctx.lineTo(graphX + i, py);
          }
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i <= graphW; i++) {
          const t = i / graphW;
          const val = fbm(t * 4, 0.5, oct, pers, lac, perm);
          const py = graphY + graphH / 2 - val * (graphH / 2 - 2);
          if (i === 0) ctx.moveTo(graphX + i, py);
          else ctx.lineTo(graphX + i, py);
        }
        ctx.stroke();
      }

      if (!compact) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "9px monospace";
        ctx.fillText(`Oct:${oct} Pers:${pers.toFixed(2)} Lac:${lac.toFixed(2)} Seed:${seedRef.current}`, 10, h - 8);
      }
    }

    rafRef.current = requestAnimationFrame(render);

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      offsetXRef.current -= dx * 0.005;
      offsetYRef.current -= dy * 0.005;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [compact]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <button
            onClick={() => setAutoRotate((v) => !v)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              autoRotate
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
            }`}
          >
            {autoRotate ? "✦ Auto" : "◉ Manual"}
          </button>
          <button
            onClick={handleExportSTL}
            className="px-3 py-1.5 text-xs rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
          >
            Export STL
          </button>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1">
              Oct:
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={octaves}
                onChange={(e) => setOctaves(parseInt(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="text-[10px] w-3">{octaves}</span>
            </label>
            <label className="flex items-center gap-1">
              Pers:
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.02}
                value={persistence}
                onChange={(e) => setPersistence(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              Lac:
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={lacunarity}
                onChange={(e) => setLacunarity(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              Seed:
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              Ht:
              <input
                type="range"
                min={20}
                max={200}
                step={5}
                value={heightMult}
                onChange={(e) => setHeightMult(parseInt(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
