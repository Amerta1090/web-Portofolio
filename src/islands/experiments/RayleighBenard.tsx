import { useRef, useEffect, useState, useCallback } from "react";

function idx(i: number, j: number, nx: number): number {
  return i * nx + j;
}

function temperatureColor(t: number): [number, number, number] {
  const c = Math.max(0, Math.min(1, t));
  if (c < 0.5) {
    const s = c / 0.5;
    return [
      Math.round(10 + s * 30),
      Math.round(10 + s * 30),
      Math.round(140 - s * 100),
    ];
  }
  const s = (c - 0.5) / 0.5;
  return [
    Math.round(40 + s * 205),
    Math.round(40 + s * 118),
    Math.round(40 - s * 29),
  ];
}

interface SimState {
  T: Float64Array;
  omega: Float64Array;
  psi: Float64Array;
  psiNew: Float64Array;
  u: Float64Array;
  v: Float64Array;
  nx: number;
  ny: number;
}

function initSim(nx: number, ny: number): SimState {
  const n = ny * nx;
  const T = new Float64Array(n);
  const omega = new Float64Array(n);
  const psi = new Float64Array(n);
  const psiNew = new Float64Array(n);
  const u = new Float64Array(n);
  const v = new Float64Array(n);

  for (let i = 0; i < ny; i++) {
    const tLinear = i / (ny - 1);
    for (let j = 0; j < nx; j++) {
      const pert = (Math.random() - 0.5) * 0.1;
      T[idx(i, j, nx)] = Math.max(0, Math.min(1, tLinear + pert));
    }
  }

  return { T, omega, psi, psiNew, u, v, nx, ny };
}

const JACOBI_ITERS = 20;

export default function RayleighBenard({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const simRef = useRef<SimState | null>(null);

  const [ra, setRa] = useState(3000);
  const [pr, setPr] = useState(1.0);
  const [gridSize, setGridSize] = useState(80);
  const [showArrows, setShowArrows] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const raRef = useRef(ra);
  const prRef = useRef(pr);
  const showArrowsRef = useRef(showArrows);
  const showOverlayRef = useRef(showOverlay);
  const pausedRef = useRef(paused);

  useEffect(() => { raRef.current = ra; }, [ra]);
  useEffect(() => { prRef.current = pr; }, [pr]);
  useEffect(() => { showArrowsRef.current = showArrows; }, [showArrows]);
  useEffect(() => { showOverlayRef.current = showOverlay; }, [showOverlay]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const handleReset = useCallback(() => {
    setResetKey(k => k + 1);
  }, []);

  const handlePause = useCallback(() => {
    setPaused(p => !p);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;

    const nx = Math.max(20, gridSize);
    const ny = Math.max(16, Math.floor(nx * 0.6));

    simRef.current = initSim(nx, ny);

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

    function simStep(sim: SimState, Ra: number, Pr: number, dt: number) {
      const { T, omega, psi, psiNew, u, v, nx, ny } = sim;

      for (let i = 1; i < ny - 1; i++) {
        for (let j = 1; j < nx - 1; j++) {
          const ii = idx(i, j, nx);

          const dTdx = (T[idx(i, j + 1, nx)] - T[idx(i, j - 1, nx)]) * 0.5;
          const buoyancy = Pr * Ra * dTdx;

          const laplOmega =
            omega[idx(i - 1, j, nx)] +
            omega[idx(i + 1, j, nx)] +
            omega[idx(i, j - 1, nx)] +
            omega[idx(i, j + 1, nx)] -
            4 * omega[ii];
          const diffusion = Pr * laplOmega;

          const uVal = (psi[idx(i, j + 1, nx)] - psi[idx(i, j - 1, nx)]) * 0.5;
          const vVal = -(psi[idx(i + 1, j, nx)] - psi[idx(i - 1, j, nx)]) * 0.5;
          const dOx =
            (omega[idx(i, j + 1, nx)] - omega[idx(i, j - 1, nx)]) * 0.5;
          const dOy =
            (omega[idx(i + 1, j, nx)] - omega[idx(i - 1, j, nx)]) * 0.5;
          const advection = uVal * dOx + vVal * dOy;

          omega[ii] += dt * (diffusion + buoyancy - advection);
        }
      }

      for (let iter = 0; iter < JACOBI_ITERS; iter++) {
        for (let i = 1; i < ny - 1; i++) {
          for (let j = 1; j < nx - 1; j++) {
            const ii = idx(i, j, nx);
            psiNew[ii] =
              (psi[idx(i - 1, j, nx)] +
                psi[idx(i + 1, j, nx)] +
                psi[idx(i, j - 1, nx)] +
                psi[idx(i, j + 1, nx)] +
                omega[ii]) *
              0.25;
          }
        }
        for (let i = 1; i < ny - 1; i++) {
          for (let j = 1; j < nx - 1; j++) {
            psi[idx(i, j, nx)] = psiNew[idx(i, j, nx)];
          }
        }
      }

      for (let i = 1; i < ny - 1; i++) {
        for (let j = 1; j < nx - 1; j++) {
          const ii = idx(i, j, nx);
          u[ii] = (psi[idx(i, j + 1, nx)] - psi[idx(i, j - 1, nx)]) * 0.5;
          v[ii] = -(psi[idx(i + 1, j, nx)] - psi[idx(i - 1, j, nx)]) * 0.5;
        }
      }

      for (let i = 1; i < ny - 1; i++) {
        for (let j = 1; j < nx - 1; j++) {
          const ii = idx(i, j, nx);

          const laplT =
            T[idx(i - 1, j, nx)] +
            T[idx(i + 1, j, nx)] +
            T[idx(i, j - 1, nx)] +
            T[idx(i, j + 1, nx)] -
            4 * T[ii];

          const dTdx =
            (T[idx(i, j + 1, nx)] - T[idx(i, j - 1, nx)]) * 0.5;
          const dTdy =
            (T[idx(i + 1, j, nx)] - T[idx(i - 1, j, nx)]) * 0.5;
          const advT = u[ii] * dTdx + v[ii] * dTdy;

          T[ii] += dt * (laplT - advT);
        }
      }

      for (let j = 0; j < nx; j++) {
        T[idx(0, j, nx)] = 0;
        psi[idx(0, j, nx)] = 0;
        omega[idx(0, j, nx)] = 0;
        T[idx(ny - 1, j, nx)] = 1;
        psi[idx(ny - 1, j, nx)] = 0;
        omega[idx(ny - 1, j, nx)] = 0;
      }
      for (let i = 0; i < ny; i++) {
        T[idx(i, 0, nx)] = T[idx(i, 1, nx)];
        T[idx(i, nx - 1, nx)] = T[idx(i, nx - 2, nx)];
        psi[idx(i, 0, nx)] = 0;
        psi[idx(i, nx - 1, nx)] = 0;
        omega[idx(i, 0, nx)] = 0;
        omega[idx(i, nx - 1, nx)] = 0;
      }
    }

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const sim = simRef.current;
      if (!sim) return;

      const dt = 0.03 / Math.max(1, prRef.current);

      if (!pausedRef.current) {
        const stepsPerFrame = 2;
        for (let s = 0; s < stepsPerFrame; s++) {
          simStep(sim, raRef.current, prRef.current, dt);
        }
      }

      const { w, h } = getSize();
      const { T, u, v, nx, ny } = sim;
      const cellW = w / nx;
      const cellH = h / ny;
      const showV = showArrowsRef.current && showOverlayRef.current;

      for (let i = 0; i < ny; i++) {
        for (let j = 0; j < nx; j++) {
          const tVal = T[idx(i, j, nx)];
          const [r, g, b] = temperatureColor(tVal);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(
            j * cellW,
            (ny - 1 - i) * cellH,
            cellW + 0.5,
            cellH + 0.5,
          );
        }
      }

      if (showV) {
        const step = Math.max(2, Math.floor(Math.min(nx, ny) / 12));
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 0.5;
        for (let i = step; i < ny - 1; i += step) {
          for (let j = step; j < nx - 1; j += step) {
            const uVal = u[idx(i, j, nx)];
            const vVal = v[idx(i, j, nx)];
            const mag = Math.sqrt(uVal * uVal + vVal * vVal);
            if (mag > 0.001) {
              const cx = (j + 0.5) * cellW;
              const cy = (ny - 1 - i + 0.5) * cellH;
              const len = Math.min(cellW, cellH) * 0.5;
              const dx = (uVal / mag) * len * 0.5;
              const dy = -(vVal / mag) * len * 0.5;
              ctx.beginPath();
              ctx.moveTo(cx - dx, cy - dy);
              ctx.lineTo(cx + dx, cy + dy);
              ctx.stroke();
            }
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, gridSize, resetKey]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1">
              Ra:
              <input
                type="range"
                min={500}
                max={10000}
                step={100}
                value={ra}
                onChange={(e) => setRa(parseInt(e.target.value))}
                className="w-20 accent-amber-500"
              />
              <span className="text-amber-400 w-14">{ra}</span>
            </label>
            <label className="flex items-center gap-1">
              Pr:
              <input
                type="range"
                min={0.1}
                max={10}
                step={0.1}
                value={pr}
                onChange={(e) => setPr(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="text-amber-400 w-10">{pr.toFixed(1)}</span>
            </label>
            <label className="flex items-center gap-1">
              Grid:
              <input
                type="range"
                min={40}
                max={120}
                step={10}
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="text-amber-400 w-8">{gridSize}</span>
            </label>
            <button
              onClick={() => setShowArrows((s) => !s)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                showArrows
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Arrows
            </button>
            <button
              onClick={() => setShowOverlay((s) => !s)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                showOverlay
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Overlay
            </button>
            <button
              onClick={handleReset}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
            <button
              onClick={handlePause}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                paused
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
