import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  compact?: boolean;
}

type RulePreset = "standard4d" | "highlife4d" | "custom";
type PatternName = "random" | "glider4d" | "oscillator4d";

interface Rule4D {
  name: string;
  survive: number[];
  born: number[];
}

const RULES: Record<RulePreset, Rule4D> = {
  standard4d: {
    name: "Standard 4D",
    survive: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53],
    born: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53],
  },
  highlife4d: {
    name: "HighLife 4D",
    survive: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    born: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
  },
  custom: {
    name: "Custom",
    survive: [],
    born: [],
  },
};

const RULE_KEYS: RulePreset[] = ["standard4d", "highlife4d", "custom"];
const PATTERN_KEYS: PatternName[] = ["random", "glider4d", "oscillator4d"];

const GX = 6;
const GY = 6;
const GZ = 3;
const GW = 3;
const TOTAL = GX * GY * GZ * GW;

function idx(x: number, y: number, z: number, w: number): number {
  return ((w * GZ + z) * GY + y) * GX + x;
}

function coords(i: number): [number, number, number, number] {
  const x = i % GX;
  const y = Math.floor(i / GX) % GY;
  const z = Math.floor(i / (GX * GY)) % GZ;
  const w = Math.floor(i / (GX * GY * GZ));
  return [x, y, z, w];
}

function centerCoord(i: number): [number, number, number, number] {
  const [x, y, z, w] = coords(i);
  return [
    x - (GX - 1) / 2,
    y - (GY - 1) / 2,
    z - (GZ - 1) / 2,
    w - (GW - 1) / 2,
  ];
}

function countNeighbors4D(state: boolean[], i: number): number {
  const [x, y, z, w] = coords(i);
  let count = 0;
  for (let dw = -1; dw <= 1; dw++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0 && dz === 0 && dw === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          const nz = z + dz;
          const nw = w + dw;
          if (nx < 0 || nx >= GX || ny < 0 || ny >= GY || nz < 0 || nz >= GZ || nw < 0 || nw >= GW) continue;
          if (state[idx(nx, ny, nz, nw)]) count++;
        }
      }
    }
  }
  return count;
}

function step4D(state: boolean[], survive: number[], born: number[]): boolean[] {
  const next = new Array<boolean>(TOTAL);
  for (let i = 0; i < TOTAL; i++) {
    const n = countNeighbors4D(state, i);
    next[i] = state[i] ? survive.includes(n) : born.includes(n);
  }
  return next;
}

function makePattern(name: PatternName): boolean[] {
  const state = new Array<boolean>(TOTAL).fill(false);
  if (name === "random") {
    for (let i = 0; i < TOTAL; i++) state[i] = Math.random() < 0.25;
  } else if (name === "glider4d") {
    const cx = Math.floor(GX / 2);
    const cy = Math.floor(GY / 2);
    const cz = Math.floor(GZ / 2);
    const cw = Math.floor(GW / 2);
    const offsets = [
      [0, 0, 0, 0], [1, 0, 0, 0], [2, 0, 0, 0],
      [0, 1, 0, 0], [0, 0, 1, 0],
      [1, 1, 0, 0], [1, 0, 1, 0],
      [0, 1, 1, 0],
    ];
    for (const [dx, dy, dz, dw] of offsets) {
      const nx = cx + dx - 1;
      const ny = cy + dy - 1;
      const nz = cz + dz - 1;
      const nw = cw + dw;
      if (nx >= 0 && nx < GX && ny >= 0 && ny < GY && nz >= 0 && nz < GZ && nw >= 0 && nw < GW) {
        state[idx(nx, ny, nz, nw)] = true;
      }
    }
  } else if (name === "oscillator4d") {
    const cx = Math.floor(GX / 2);
    const cy = Math.floor(GY / 2);
    const cz = Math.floor(GZ / 2);
    const cw = Math.floor(GW / 2);
    for (let dw = 0; dw < GW; dw++) {
      const z = dw === cw ? cz : cz;
      const off = Math.abs(dw - cw);
      const range = Math.max(1, 1 - off);
      for (let dz = -range; dz <= range; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) <= 1) {
              const nx = cx + dx;
              const ny = cy + dy;
              const nz = z + dz;
              if (nx >= 0 && nx < GX && ny >= 0 && ny < GY && nz >= 0 && nz < GZ) {
                state[idx(nx, ny, nz, dw)] = true;
              }
            }
          }
        }
      }
    }
  }
  return state;
}

function rotateXY(v: number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2], v[3]];
}

function rotateXZ(v: number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c, v[3]];
}

function rotateXW(v: number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c - v[3] * s, v[1], v[2], v[0] * s + v[3] * c];
}

function rotateYZ(v: number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c, v[3]];
}

function rotateYW(v: number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1] * c - v[3] * s, v[2], v[1] * s + v[3] * c];
}

function rotateZW(v: number[], a: number): number[] {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1], v[2] * c - v[3] * s, v[2] * s + v[3] * c];
}

function project4Dto3D(v: number[], dist: number): [number, number, number] {
  const scale = dist / (dist - v[3]);
  return [v[0] * scale, v[1] * scale, v[2] * scale];
}

function project3Dto2D(
  v: [number, number, number],
  fov: number,
  w: number,
  h: number,
): [number, number, number] {
  const scale = fov / (fov + v[2]);
  return [w / 2 + v[0] * scale * 180, h / 2 - v[1] * scale * 180, scale];
}

function popCount(state: boolean[]): number {
  let c = 0;
  for (let i = 0; i < TOTAL; i++) if (state[i]) c++;
  return c;
}

export default function FourDGameOfLife({ compact }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [rulePreset, setRulePreset] = useState<RulePreset>("highlife4d");
  const [speed, setSpeed] = useState(500);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const [customSurvive, setCustomSurvive] = useState("26-52");
  const [customBorn, setCustomBorn] = useState("26-54");

  const stateRef = useRef<boolean[]>(makePattern("random"));
  const anglesRef = useRef({ xy: 0.3, xz: 0.2, xw: 0.1, yz: 0.15, yw: 0.1, zw: 0.05 });
  const autoAnglesRef = useRef({ xy: 0.008, xz: 0.005, xw: 0.003, yz: 0.004, yw: 0.006, zw: 0.002 });
  const lastTickRef = useRef(0);

  function parseRange(s: string): number[] {
    const nums: number[] = [];
    for (const part of s.split(",")) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [lo, hi] = trimmed.split("-").map(Number);
        if (!isNaN(lo) && !isNaN(hi)) {
          for (let i = lo; i <= hi; i++) nums.push(i);
        }
      } else {
        const n = Number(trimmed);
        if (!isNaN(n)) nums.push(n);
      }
    }
    return [...new Set(nums)].filter((n) => n >= 0 && n <= 80);
  }

  function getRule(): Rule4D {
    if (rulePreset === "custom") {
      return {
        name: "Custom",
        survive: parseRange(customSurvive),
        born: parseRange(customBorn),
      };
    }
    return RULES[rulePreset];
  }

  function resetGrid(pattern: PatternName) {
    stateRef.current = makePattern(pattern);
    setGeneration(0);
    setPopulation(popCount(stateRef.current));
  }

  function doStep() {
    const rule = getRule();
    stateRef.current = step4D(stateRef.current, rule.survive, rule.born);
    setGeneration((g) => g + 1);
    setPopulation(popCount(stateRef.current));
  }

  function drawCube(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    depth: number,
    hue: number,
  ) {
    const half = size / 2;
    const top = cy - half * 0.6;
    const opacity = Math.max(0.25, Math.min(1, depth * 0.6 + 0.4));

    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${opacity})`;
    ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${opacity * 0.5})`;
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    ctx.moveTo(cx - half, top + half * 0.3);
    ctx.lineTo(cx - half, top + half * 1.3);
    ctx.lineTo(cx + half, top + half * 1.3);
    ctx.lineTo(cx + half, top + half * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `hsla(${hue}, 70%, 45%, ${opacity})`;
    ctx.beginPath();
    ctx.moveTo(cx - half, top + half * 1.3);
    ctx.lineTo(cx - half * 0.6, top + half * 1.6);
    ctx.lineTo(cx + half * 0.6, top + half * 1.6);
    ctx.lineTo(cx + half, top + half * 1.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
    ctx.beginPath();
    ctx.moveTo(cx + half, top + half * 0.3);
    ctx.lineTo(cx + half, top + half * 1.3);
    ctx.lineTo(cx + half * 0.6, top + half * 1.6);
    ctx.lineTo(cx + half * 0.6, top + half * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#0f0f11";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const w = rect.width;
    const h = rect.height;
    const angles = anglesRef.current;
    const dist4D = 6;
    const fov = 5;
    const cellSize = Math.min(w, h) * 0.05;

    if (autoRotate) {
      angles.xy += autoAnglesRef.current.xy;
      angles.xz += autoAnglesRef.current.xz;
      angles.xw += autoAnglesRef.current.xw;
      angles.yz += autoAnglesRef.current.yz;
      angles.yw += autoAnglesRef.current.yw;
      angles.zw += autoAnglesRef.current.zw;
    }

    const projected: {
      x: number;
      y: number;
      z: number;
      depth: number;
      hue: number;
      alive: boolean;
      i: number;
    }[] = [];

    for (let i = 0; i < TOTAL; i++) {
      const [cx, cy, cz, cw] = centerCoord(i);
      let v: number[] = [cx, cy, cz, cw];
      v = rotateXY(v, angles.xy);
      v = rotateXZ(v, angles.xz);
      v = rotateXW(v, angles.xw);
      v = rotateYZ(v, angles.yz);
      v = rotateYW(v, angles.yw);
      v = rotateZW(v, angles.zw);

      const [px, py, pz] = project4Dto3D(v, dist4D);
      const [sx, sy, sz] = project3Dto2D([px, py, pz], fov, w, h);

      const hue = ((v[0] + v[1] + v[2] + v[3] + 4) / 8) * 360;
      projected.push({
        x: sx,
        y: sy,
        z: pz,
        depth: sz,
        hue,
        alive: stateRef.current[i],
        i,
      });
    }

    projected.sort((a, b) => a.z - b.z);

    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < TOTAL; i++) {
        const [x, y, z, w_] = coords(i);
        if (x < GX - 1) {
          const j = idx(x + 1, y, z, w_);
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
        if (y < GY - 1) {
          const j = idx(x, y + 1, z, w_);
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
        if (z < GZ - 1) {
          const j = idx(x, y, z + 1, w_);
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
        if (w_ < GW - 1) {
          const j = idx(x, y, z, w_ + 1);
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
      }
    }

    for (const p of projected) {
      if (!p.alive) continue;
      const sz = cellSize * p.depth;
      drawCube(ctx, p.x, p.y, sz, p.depth, p.hue);
    }

    if (compact) {
      const now = performance.now();
      if (runningRef.current && now - lastTickRef.current >= speed) {
        lastTickRef.current = now;
        doStep();
      }
    }

    rafRef.current = requestAnimationFrame(render);
  }, [autoRotate, showGrid, compact, speed, rulePreset, customSurvive, customBorn]);

  useEffect(() => {
    if (compact) runningRef.current = true;
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  useEffect(() => {
    if (!compact) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const onWheel = (e: WheelEvent) => {
      const r = container.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.001;
      const dy = (e.clientY - r.top - r.height / 2) * 0.001;
      const a = anglesRef.current;
      a.xy += dx;
      a.xz += dy;
    };
    container.addEventListener("wheel", onWheel, { passive: true });
    return () => container.removeEventListener("wheel", onWheel);
  }, [compact]);

  const rule = getRule();

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0f0f11] relative overflow-hidden flex flex-col"
    >
      <canvas ref={canvasRef} className="w-full flex-1" />

      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3 flex flex-wrap items-center gap-2 text-xs text-white/70 z-10">
          <button
            onClick={() => {
              runningRef.current = !runningRef.current;
            }}
            className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition"
          >
            {runningRef.current ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            onClick={doStep}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 transition"
          >
            ⏭ Step
          </button>
          <button
            onClick={() => resetGrid("random")}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 transition"
          >
            ↻ Reset
          </button>

          <div className="flex items-center gap-1 ml-2">
            <span className="text-white/50">Speed:</span>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 accent-amber-500"
            />
            <span className="text-amber-300 w-10">{speed}ms</span>
          </div>

          <select
            value={rulePreset}
            onChange={(e) => setRulePreset(e.target.value as RulePreset)}
            className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80"
          >
            {RULE_KEYS.map((k) => (
              <option key={k} value={k}>
                {RULES[k].name}
              </option>
            ))}
          </select>

          {rulePreset === "custom" && (
            <>
              <input
                type="text"
                value={customSurvive}
                onChange={(e) => setCustomSurvive(e.target.value)}
                placeholder="Survive (e.g. 26-52)"
                className="w-28 px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80 placeholder:text-white/30"
              />
              <input
                type="text"
                value={customBorn}
                onChange={(e) => setCustomBorn(e.target.value)}
                placeholder="Born (e.g. 26-54)"
                className="w-28 px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80 placeholder:text-white/30"
              />
            </>
          )}

          <select
            onChange={(e) => resetGrid(e.target.value as PatternName)}
            className="px-2 py-1 rounded bg-white/10 border border-white/10 text-white/80"
          >
            {PATTERN_KEYS.map((k) => (
              <option key={k} value={k}>
                {k === "glider4d" ? "4D Glider" : k === "oscillator4d" ? "4D Oscillator" : "Random"}
              </option>
            ))}
          </select>

          <button
            onClick={() => setAutoRotate((r) => !r)}
            className={`px-3 py-1 rounded border transition ${
              autoRotate
                ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                : "bg-white/10 border-white/10 text-white/50"
            }`}
          >
            ↻ Rotate {autoRotate ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`px-3 py-1 rounded border transition ${
              showGrid
                ? "bg-amber-500/20 border-amber-500/30 text-amber-300"
                : "bg-white/10 border-white/10 text-white/50"
            }`}
          >
            ⊞ Grid {showGrid ? "ON" : "OFF"}
          </button>

          <div className="ml-auto flex items-center gap-3 text-white/50">
            <span>
              Gen: <span className="text-amber-300 font-mono">{generation}</span>
            </span>
            <span>
              Pop: <span className="text-amber-300 font-mono">{population}</span>
            </span>
            <span>
              Rule: <span className="text-white/70">{rule.name}</span>
            </span>
          </div>
        </div>
      )}

      {compact && (
        <div className="absolute top-2 left-2 text-[10px] text-white/40 font-mono pointer-events-none">
          Gen {generation} | Pop {population}
        </div>
      )}
    </div>
  );
}
