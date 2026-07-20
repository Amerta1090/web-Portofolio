import { useRef, useEffect, useState, useCallback } from "react";

type OptimizerType = "sgd" | "momentum" | "adam";

interface OptimizerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mx: number;
  my: number;
  vx2: number;
  vy2: number;
  step: number;
  trail: { x: number; y: number }[];
  loss: number;
}

interface LandscapeConfig {
  seed: number;
  bumpAmp: number;
  bumpFreq: number;
  noiseAmp: number;
  noiseFreq: number;
}

const LANDSCAPE_RANGE = 4;
const TRAIL_MAX = 600;
const GROUND_RES = 160;
const BETA1 = 0.9;
const BETA2 = 0.999;
const EPSILON = 1e-8;

function hashNoise(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 43.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hashNoise(ix, iy, seed);
  const b = hashNoise(ix + 1, iy, seed);
  const c = hashNoise(ix, iy + 1, seed);
  const d = hashNoise(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbmNoise(x: number, y: number, seed: number, octaves: number, amp: number): number {
  let val = 0;
  let a = amp;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    val += a * smoothNoise(x * f, y * f, seed + i * 100);
    a *= 0.5;
    f *= 2;
  }
  return val;
}

function lossFunc(x: number, y: number, cfg: LandscapeConfig): number {
  const base = Math.sin(x) * Math.cos(y) + 0.15 * (x * x + y * y);
  const bumps =
    cfg.bumpAmp *
    Math.sin(x * cfg.bumpFreq) *
    Math.cos(y * cfg.bumpFreq) *
    Math.exp(-0.1 * (x * x + y * y));
  const noise = cfg.noiseAmp * fbmNoise(x * cfg.noiseFreq + 5, y * cfg.noiseFreq + 5, cfg.seed, 4, 1);
  return base + bumps + noise;
}

function gradFunc(x: number, y: number, cfg: LandscapeConfig, h = 0.01): [number, number] {
  const dx = (lossFunc(x + h, y, cfg) - lossFunc(x - h, y, cfg)) / (2 * h);
  const dy = (lossFunc(x, y + h, cfg) - lossFunc(x, y - h, cfg)) / (2 * h);
  return [dx, dy];
}

function makeDefaultLandscape(): LandscapeConfig {
  return {
    seed: Math.floor(Math.random() * 1000),
    bumpAmp: 0.8 + Math.random() * 0.6,
    bumpFreq: 1.5 + Math.random() * 1.5,
    noiseAmp: 0.1 + Math.random() * 0.15,
    noiseFreq: 0.8 + Math.random() * 0.6,
  };
}

function createOptimizer(type: OptimizerType, sx: number, sy: number): OptimizerState {
  return {
    x: sx,
    y: sy,
    vx: 0,
    vy: 0,
    mx: 0,
    my: 0,
    vx2: 0,
    vy2: 0,
    step: 0,
    trail: [{ x: sx, y: sy }],
    loss: lossFunc(sx, sy, makeDefaultLandscape()),
  };
}

function updateOptimizer(
  s: OptimizerState,
  type: OptimizerType,
  lr: number,
  cfg: LandscapeConfig
): OptimizerState {
  const [gx, gy] = gradFunc(s.x, s.y, cfg);
  let nx = s.x;
  let ny = s.y;
  let nvx = s.vx;
  let nvy = s.vy;
  let nmx = s.mx;
  let nmy = s.my;
  let nvx2 = s.vx2;
  let nvy2 = s.vy2;

  if (type === "sgd") {
    nx = s.x - lr * gx;
    ny = s.y - lr * gy;
  } else if (type === "momentum") {
    nvx = BETA1 * s.vx - lr * gx;
    nvy = BETA1 * s.vy - lr * gy;
    nx = s.x + nvx;
    ny = s.y + nvy;
  } else {
    nmx = BETA1 * s.mx + (1 - BETA1) * gx;
    nmy = BETA1 * s.my + (1 - BETA1) * gy;
    nvx2 = BETA2 * s.vx2 + (1 - BETA2) * gx * gx;
    nvy2 = BETA2 * s.vy2 + (1 - BETA2) * gy * gy;
    const mhatX = nmx / (1 - Math.pow(BETA1, s.step + 1));
    const mhatY = nmy / (1 - Math.pow(BETA1, s.step + 1));
    const vhatX = nvx2 / (1 - Math.pow(BETA2, s.step + 1));
    const vhatY = nvy2 / (1 - Math.pow(BETA2, s.step + 1));
    nx = s.x - lr * mhatX / (Math.sqrt(vhatX) + EPSILON);
    ny = s.y - lr * mhatY / (Math.sqrt(vhatY) + EPSILON);
  }

  const clamp = LANDSCAPE_RANGE * 1.5;
  nx = Math.max(-clamp, Math.min(clamp, nx));
  ny = Math.max(-clamp, Math.min(clamp, ny));

  const trail = [...s.trail, { x: nx, y: ny }];
  if (trail.length > TRAIL_MAX) trail.shift();

  return {
    x: nx,
    y: ny,
    vx: nvx,
    vy: nvy,
    mx: nmx,
    my: nmy,
    vx2: nvx2,
    vy2: nvy2,
    step: s.step + 1,
    trail,
    loss: lossFunc(nx, ny, cfg),
  };
}

const OPT_COLORS: Record<OptimizerType, [number, number, number]> = {
  sgd: [245, 158, 11],
  momentum: [139, 92, 246],
  adam: [6, 182, 212],
};

const OPT_LABELS: Record<OptimizerType, string> = {
  sgd: "SGD",
  momentum: "Momentum",
  adam: "Adam",
};

function heightColor(v: number, minV: number, maxV: number): string {
  const t = Math.max(0, Math.min(1, (v - minV) / (maxV - minV + 1e-9)));
  const r = Math.round(8 + t * 40);
  const g = Math.round(10 + (0.5 - Math.abs(t - 0.5)) * 60 + t * 20);
  const b = Math.round(18 + (1 - t) * 50 + t * 10);
  return `rgb(${r},${g},${b})`;
}

export default function GradientDescent({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);

  const [visible, setVisible] = useState<Record<OptimizerType, boolean>>({
    sgd: true,
    momentum: true,
    adam: true,
  });
  const [learningRate, setLearningRate] = useState(0.1);
  const [landscape, setLandscape] = useState<LandscapeConfig>(makeDefaultLandscape);

  const visibleRef = useRef(visible);
  const lrRef = useRef(learningRate);
  const landscapeRef = useRef(landscape);

  useEffect(() => { visibleRef.current = visible; }, [visible]);
  useEffect(() => { lrRef.current = learningRate; }, [learningRate]);
  useEffect(() => { landscapeRef.current = landscape; }, [landscape]);

  const optsRef = useRef<OptimizerState[]>([]);
  const heightsRef = useRef<number[][]>([]);

  const randomizeStart = useCallback(() => {
    const pts: OptimizerState[] = [];
    for (let i = 0; i < 3; i++) {
      const sx = (Math.random() - 0.5) * LANDSCAPE_RANGE * 1.6;
      const sy = (Math.random() - 0.5) * LANDSCAPE_RANGE * 1.6;
      pts.push(createOptimizer(["sgd", "momentum", "adam"][i] as OptimizerType, sx, sy));
    }
    optsRef.current = pts;
  }, []);

  const handleReset = useCallback(() => {
    randomizeStart();
    timeRef.current = 0;
  }, [randomizeStart]);

  const handleChaos = useCallback(() => {
    setLandscape(makeDefaultLandscape());
    handleReset();
  }, [handleReset]);

  useEffect(() => {
    randomizeStart();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;

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
      precomputeHeights();
    };

    const precomputeHeights = () => {
      const cfg = landscapeRef.current;
      const grid: number[][] = [];
      for (let iy = 0; iy < GROUND_RES; iy++) {
        grid[iy] = [];
        for (let ix = 0; ix < GROUND_RES; ix++) {
          const rx = (ix / (GROUND_RES - 1) - 0.5) * 2 * LANDSCAPE_RANGE;
          const ry = (iy / (GROUND_RES - 1) - 0.5) * 2 * LANDSCAPE_RANGE;
          grid[iy][ix] = lossFunc(rx, ry, cfg);
        }
      }
      heightsRef.current = grid;
    };

    resize();
    precomputeHeights();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function toCanvas(rx: number, ry: number, w: number, h: number): [number, number] {
      const margin = compact ? 16 : 30;
      const usable = { w: w - margin * 2, h: h - margin * 2 };
      const cx = margin + (rx / LANDSCAPE_RANGE + 1) * 0.5 * usable.w;
      const cy = margin + (ry / LANDSCAPE_RANGE + 1) * 0.5 * usable.h;
      return [cx, cy];
    }

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const cfg = landscapeRef.current;
      const vis = visibleRef.current;
      const lr = lrRef.current;

      timeRef.current += 0.016;

      const grid = heightsRef.current;
      if (grid.length === 0) return;

      let minV = Infinity;
      let maxV = -Infinity;
      for (let iy = 0; iy < GROUND_RES; iy++) {
        for (let ix = 0; ix < GROUND_RES; ix++) {
          const v = grid[iy][ix];
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        }
      }

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const margin = compact ? 16 : 30;
      const usable = { w: w - margin * 2, h: h - margin * 2 };
      const cellW = usable.w / GROUND_RES;
      const cellH = usable.h / GROUND_RES;

      for (let iy = 0; iy < GROUND_RES; iy++) {
        for (let ix = 0; ix < GROUND_RES; ix++) {
          const v = grid[iy][ix];
          ctx.fillStyle = heightColor(v, minV, maxV);
          ctx.fillRect(margin + ix * cellW, margin + iy * cellH, cellW + 0.5, cellH + 0.5);
        }
      }

      if (!compact) {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 0.5;
        const contourLevels = 20;
        const step = (maxV - minV) / contourLevels;
        for (let l = 1; l < contourLevels; l++) {
          const threshold = minV + l * step;
          for (let iy = 0; iy < GROUND_RES - 1; iy++) {
            for (let ix = 0; ix < GROUND_RES - 1; ix++) {
              const v00 = grid[iy][ix];
              const v10 = grid[iy][ix + 1];
              const v01 = grid[iy + 1][ix];
              const x0 = margin + ix * cellW;
              const y0 = margin + iy * cellH;

              const above00 = v00 > threshold;
              const above10 = v10 > threshold;
              const above01 = v01 > threshold;

              const edges: [number, number][] = [];
              if (above00 !== above10) {
                const t = (threshold - v00) / (v10 - v00);
                edges.push([x0 + t * cellW, y0]);
              }
              if (above10 !== above01) {
                const t = (threshold - v10) / (v01 - v10);
                edges.push([x0 + cellW, y0 + t * cellH]);
              }
              if (above00 !== above01) {
                const t = (threshold - v00) / (v01 - v00);
                edges.push([x0, y0 + t * cellH]);
              }
              if (edges.length >= 2) {
                ctx.beginPath();
                ctx.moveTo(edges[0][0], edges[0][1]);
                ctx.lineTo(edges[1][0], edges[1][1]);
                ctx.stroke();
              }
            }
          }
        }
      }

      const types: OptimizerType[] = ["sgd", "momentum", "adam"];
      for (let i = 0; i < 3; i++) {
        const type = types[i];
        if (!vis[type]) continue;
        if (!optsRef.current[i]) continue;

        optsRef.current[i] = updateOptimizer(optsRef.current[i], type, lr, cfg);
      }

      for (let i = 0; i < 3; i++) {
        const type = types[i];
        if (!vis[type]) continue;
        const s = optsRef.current[i];
        if (!s) continue;
        const col = OPT_COLORS[type];

        if (s.trail.length > 1) {
          for (let j = 1; j < s.trail.length; j++) {
            const alpha = (j / s.trail.length) * 0.9;
            const [x1, y1] = toCanvas(s.trail[j - 1].x, s.trail[j - 1].y, w, h);
            const [x2, y2] = toCanvas(s.trail[j].x, s.trail[j].y, w, h);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
            ctx.lineWidth = compact ? 1 : 2;
            ctx.stroke();
          }
        }

        const [cx, cy] = toCanvas(s.x, s.y, w, h);

        if (!compact) {
          const [gx, gy] = gradFunc(s.x, s.y, cfg);
          const gLen = Math.sqrt(gx * gx + gy * gy);
          if (gLen > 0.01) {
            const arrowLen = Math.min(30, gLen * 15);
            const ndx = -gx / gLen;
            const ndy = -gy / gLen;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + ndx * arrowLen, cy + ndy * arrowLen);
            ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.5)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            const ax = cx + ndx * arrowLen;
            const ay = cy + ndy * arrowLen;
            const angle = Math.atan2(ndy, ndx);
            const headLen = 5;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - headLen * Math.cos(angle - 0.4), ay - headLen * Math.sin(angle - 0.4));
            ctx.moveTo(ax, ay);
            ctx.lineTo(ax - headLen * Math.cos(angle + 0.4), ay - headLen * Math.sin(angle + 0.4));
            ctx.stroke();
          }
        }

        const dotRadius = compact ? 3 : 5;
        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius + 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.3)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (!compact) {
        ctx.fillStyle = "rgba(15,15,17,0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(8, 8, 155, 52, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText("f(x,y) = sin(x)cos(y) + 0.15(x²+y²)", 14, 22);
        ctx.fillText(`LR: ${lr.toFixed(3)}  Bumps: ${cfg.bumpAmp.toFixed(2)}`, 14, 34);
        ctx.fillText(`t = ${timeRef.current.toFixed(1)}s`, 14, 46);

        const barW = 180;
        const barH = 16;
        const barX = w - barW - 12;
        const barY = 8;
        ctx.fillStyle = "rgba(15,15,17,0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH + 26, 6);
        ctx.fill();
        ctx.stroke();

        for (let i = 0; i < 3; i++) {
          const type = types[i];
          const col = OPT_COLORS[type];
          const bx = barX + 6;
          const by = barY + 4 + i * 12;
          ctx.fillStyle = vis[type]
            ? `rgba(${col[0]},${col[1]},${col[2]},1)`
            : "rgba(255,255,255,0.2)";
          ctx.fillRect(bx, by, 6, 6);
          ctx.fillStyle = vis[type] ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)";
          ctx.font = "9px monospace";
          const s = optsRef.current[i];
          ctx.fillText(
            `${OPT_LABELS[type]}: ${s ? s.loss.toFixed(3) : "—"}`,
            bx + 10,
            by + 6
          );
        }

        const minBarW = 120;
        const minBarH = 60;
        const minBarX = w - minBarW - 12;
        const minBarY = 38;
        ctx.fillStyle = "rgba(15,15,17,0.85)";
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.beginPath();
        ctx.roundRect(minBarX, minBarY, minBarW, minBarH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = "8px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.fillText("Loss Landscape", minBarX + 4, minBarY + 10);

        const thumbW = minBarW - 8;
        const thumbH = minBarH - 16;
        const thumbRes = 30;
        const thumbCellW = thumbW / thumbRes;
        const thumbCellH = thumbH / thumbRes;
        for (let ty = 0; ty < thumbRes; ty++) {
          for (let tx = 0; tx < thumbRes; tx++) {
            const rx = (tx / (thumbRes - 1) - 0.5) * 2 * LANDSCAPE_RANGE;
            const ry = (ty / (thumbRes - 1) - 0.5) * 2 * LANDSCAPE_RANGE;
            const v = lossFunc(rx, ry, cfg);
            ctx.fillStyle = heightColor(v, minV, maxV);
            ctx.fillRect(minBarX + 4 + tx * thumbCellW, minBarY + 13 + ty * thumbCellH, thumbCellW + 0.5, thumbCellH + 0.5);
          }
        }

        for (let i = 0; i < 3; i++) {
          const type = types[i];
          if (!vis[type]) continue;
          const s = optsRef.current[i];
          if (!s) continue;
          const col = OPT_COLORS[type];
          const sx = (s.x / LANDSCAPE_RANGE + 1) * 0.5;
          const sy = (s.y / LANDSCAPE_RANGE + 1) * 0.5;
          ctx.beginPath();
          ctx.arc(minBarX + 4 + sx * thumbW, minBarY + 13 + sy * thumbH, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
          ctx.fill();
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  const toggleOpt = (type: OptimizerType) => {
    setVisible(v => ({ ...v, [type]: !v[type] }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 z-10">
          <div className="flex gap-1">
            {(["sgd", "momentum", "adam"] as OptimizerType[]).map(type => {
              const col = OPT_COLORS[type];
              return (
                <button
                  key={type}
                  onClick={() => toggleOpt(type)}
                  className="px-3 py-1 text-xs rounded-full border transition-all"
                  style={{
                    backgroundColor: visible[type]
                      ? `rgba(${col[0]},${col[1]},${col[2]},0.2)`
                      : "rgba(30,30,35,0.6)",
                    borderColor: visible[type]
                      ? `rgba(${col[0]},${col[1]},${col[2]},0.5)`
                      : "rgba(255,255,255,0.1)",
                    color: visible[type]
                      ? `rgb(${col[0]},${col[1]},${col[2]})`
                      : "rgba(255,255,255,0.3)",
                  }}
                >
                  {OPT_LABELS[type]}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1 text-[11px] rounded-full bg-white/5 border border-white/10 text-white/50 hover:border-amber-500/30 transition-all"
          >
            Reset
          </button>
          <button
            onClick={handleChaos}
            className="px-3 py-1 text-[11px] rounded-full bg-white/5 border border-white/10 text-white/50 hover:border-amber-500/30 transition-all"
          >
            Chaos
          </button>
          <div className="flex items-center gap-1 ml-1">
            <span className="text-[10px] text-white/40 font-mono whitespace-nowrap">LR:</span>
            <input
              type="range"
              min={0.01}
              max={0.5}
              step={0.005}
              value={learningRate}
              onChange={e => setLearningRate(parseFloat(e.target.value))}
              className="w-20 accent-amber-500"
            />
            <span className="text-[10px] text-amber-400 font-mono w-10">{learningRate.toFixed(3)}</span>
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/40 font-mono bg-[#0f0f11]/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
            {(["sgd", "momentum", "adam"] as OptimizerType[]).map(type => {
              const col = OPT_COLORS[type];
              const s = optsRef.current[["sgd", "momentum", "adam"].indexOf(type)];
              return (
                <span key={type} className="flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: `rgb(${col[0]},${col[1]},${col[2]})` }}
                  />
                  <span style={{ color: `rgb(${col[0]},${col[1]},${col[2]})` }}>
                    {OPT_LABELS[type]}
                  </span>
                  {s && visible[type] && (
                    <span className="text-white/30">
                      L={s.loss.toFixed(3)} ({s.step} steps)
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
