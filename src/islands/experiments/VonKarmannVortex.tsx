import { useRef, useEffect, useState } from "react";

const GRID_X = 200;
const GRID_Y = 100;
const PARTICLE_COUNT = 500;
const TRAIL_LENGTH = 40;

function idx(i: number, j: number) { return i + j * GRID_X; }

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function bilinear(arr: Float32Array, x: number, y: number) {
  const ix = clamp(Math.floor(x), 0, GRID_X - 2);
  const iy = clamp(Math.floor(y), 0, GRID_Y - 2);
  const fx = x - ix;
  const fy = y - iy;
  const a00 = arr[idx(ix, iy)];
  const a10 = arr[idx(ix + 1, iy)];
  const a01 = arr[idx(ix, iy + 1)];
  const a11 = arr[idx(ix + 1, iy + 1)];
  return lerp(lerp(a00, a10, fx), lerp(a01, a11, fx), fy);
}

export default function VonKarmannVortex({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);

  const [Re, setRe] = useState(100);
  const [flowSpeed, setFlowSpeed] = useState(2);
  const [cylinderR, setCylinderR] = useState(15);
  const [showSL, setShowSL] = useState(true);
  const [colorMode, setColorMode] = useState<"velocity" | "vorticity">("velocity");
  const [paused, setPaused] = useState(false);

  const ReRef = useRef(Re);
  const flowRef = useRef(flowSpeed);
  const cylRef = useRef(cylinderR);
  const slRef = useRef(showSL);
  const cmRef = useRef(colorMode);
  const pausedRef = useRef(paused);

  useEffect(() => { ReRef.current = Re; }, [Re]);
  useEffect(() => { flowRef.current = flowSpeed; }, [flowSpeed]);
  useEffect(() => { cylRef.current = cylinderR; }, [cylinderR]);
  useEffect(() => { slRef.current = showSL; }, [showSL]);
  useEffect(() => { cmRef.current = colorMode; }, [colorMode]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;
    timeRef.current = 0;

    const u = new Float32Array(GRID_X * GRID_Y);
    const v = new Float32Array(GRID_X * GRID_Y);
    const uTmp = new Float32Array(GRID_X * GRID_Y);
    const vTmp = new Float32Array(GRID_X * GRID_Y);
    const vort = new Float32Array(GRID_X * GRID_Y);

    type TrailPt = { x: number; y: number };
    const particles: { x: number; y: number; trail: TrailPt[]; age: number }[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: 2,
        y: (i / PARTICLE_COUNT) * GRID_Y,
        trail: [],
        age: 0,
      });
    }

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

    const cx = GRID_X / 2;
    const cy = GRID_Y / 2;

    function insideCyl(i: number, j: number, r: number) {
      const dx = i - cx;
      const dy = j - cy;
      return dx * dx + dy * dy <= r * r;
    }

    function applyObstacle(uA: Float32Array, vA: Float32Array, r: number) {
      const r2 = r * r;
      for (let i = 0; i < GRID_X; i++) {
        for (let j = 0; j < GRID_Y; j++) {
          const dx = i - cx;
          const dy = j - cy;
          if (dx * dx + dy * dy <= r2) {
            uA[idx(i, j)] = 0;
            vA[idx(i, j)] = 0;
          }
        }
      }
    }

    function applyBC(uA: Float32Array, vA: Float32Array, U: number) {
      for (let j = 0; j < GRID_Y; j++) {
        uA[idx(0, j)] = U;
        vA[idx(0, j)] = 0;
        uA[idx(GRID_X - 1, j)] = uA[idx(GRID_X - 2, j)];
        vA[idx(GRID_X - 1, j)] = vA[idx(GRID_X - 2, j)];
      }
      for (let i = 0; i < GRID_X; i++) {
        uA[idx(i, 0)] = uA[idx(i, 1)];
        vA[idx(i, 0)] = 0;
        uA[idx(i, GRID_Y - 1)] = uA[idx(i, GRID_Y - 2)];
        vA[idx(i, GRID_Y - 1)] = 0;
      }
    }

    function advect(uS: Float32Array, vS: Float32Array, uD: Float32Array, vD: Float32Array, dt: number) {
      for (let j = 1; j < GRID_Y - 1; j++) {
        for (let i = 1; i < GRID_X - 1; i++) {
          const ui = uS[idx(i, j)];
          const vi = vS[idx(i, j)];
          let x = i - dt * ui;
          let y = j - dt * vi;
          x = clamp(x, 0, GRID_X - 1);
          y = clamp(y, 0, GRID_Y - 1);
          uD[idx(i, j)] = bilinear(uS, x, y);
          vD[idx(i, j)] = bilinear(vS, x, y);
        }
      }
    }

    function diffuse(uS: Float32Array, vS: Float32Array, uD: Float32Array, vD: Float32Array, nu: number) {
      for (let j = 1; j < GRID_Y - 1; j++) {
        for (let i = 1; i < GRID_X - 1; i++) {
          const c = idx(i, j);
          const uLap = uS[idx(i + 1, j)] + uS[idx(i - 1, j)] + uS[idx(i, j + 1)] + uS[idx(i, j - 1)] - 4 * uS[c];
          const vLap = vS[idx(i + 1, j)] + vS[idx(i - 1, j)] + vS[idx(i, j + 1)] + vS[idx(i, j - 1)] - 4 * vS[c];
          uD[c] = uS[c] + nu * uLap;
          vD[c] = vS[c] + nu * vLap;
        }
      }
    }

    function injectVort(uA: Float32Array, vA: Float32Array, t: number, U: number, r: number) {
      const St = 0.2;
      const D = 2 * r;
      const f = St * U / Math.max(1, D);
      const amp = U * 0.4;
      const omega = amp * Math.sin(2 * Math.PI * f * t);
      const wakeStart = Math.min(Math.floor(cx + r + 2), GRID_X - 5);
      const wakeEnd = Math.min(Math.floor(cx + r + 18), GRID_X - 2);
      const injW = Math.max(2, Math.floor(r * 0.4));
      for (let i = wakeStart; i < wakeEnd; i++) {
        for (let j = Math.max(1, Math.floor(cy - injW)); j < Math.min(GRID_Y - 1, Math.ceil(cy + injW)); j++) {
          const dist = Math.abs(j - cy);
          const wgt = Math.max(0, 1 - dist / injW);
          if (j < cy) {
            vA[idx(i, j)] += omega * wgt * 0.12;
          } else if (j > cy) {
            vA[idx(i, j)] -= omega * wgt * 0.12;
          }
        }
      }
    }

    function computeVort(uS: Float32Array, vS: Float32Array, vOut: Float32Array) {
      for (let j = 1; j < GRID_Y - 1; j++) {
        for (let i = 1; i < GRID_X - 1; i++) {
          vOut[idx(i, j)] = 0.5 * (vS[idx(i + 1, j)] - vS[idx(i - 1, j)] - uS[idx(i, j + 1)] + uS[idx(i, j - 1)]);
        }
      }
    }

    function velColor(mag: number, maxV: number): string {
      const t = Math.min(1, mag / Math.max(0.01, maxV));
      if (t < 0.5) {
        const s = t / 0.5;
        const r = 0;
        const g = Math.floor(s * 180);
        const b = Math.floor(100 + s * 155);
        return `rgb(${r},${g},${b})`;
      }
      const s = (t - 0.5) / 0.5;
      const r = Math.floor(s * 255);
      const g = Math.floor(180 + s * 75);
      const b = 255;
      return `rgb(${r},${g},${b})`;
    }

    function vortColor(w: number, maxW: number): string {
      const t = clamp(w / Math.max(0.01, maxW), -1, 1);
      if (t < 0) {
        const a = Math.abs(t);
        return `rgba(0,${Math.floor(80 * (1 - a))},${Math.floor(255 * (1 - a))},${a * 0.8})`;
      }
      return `rgba(255,${Math.floor(180 * (1 - t))},0,${t * 0.8})`;
    }

    function updateParticles(parts: typeof particles, uA: Float32Array, vA: Float32Array) {
      for (const p of parts) {
        const ui = bilinear(uA, p.x, p.y);
        const vi = bilinear(vA, p.x, p.y);
        p.x += ui * 0.4;
        p.y += vi * 0.4;
        p.x = clamp(p.x, 1, GRID_X - 2);
        p.y = clamp(p.y, 1, GRID_Y - 2);
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > TRAIL_LENGTH) p.trail.shift();
        p.age++;
        if (p.x >= GRID_X - 2 || p.age > 300 || p.x < 1 || p.y < 1 || p.y >= GRID_Y - 2) {
          p.x = 2;
          p.y = Math.random() * GRID_Y;
          p.trail = [];
          p.age = 0;
        }
      }
    }

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const U = flowRef.current;
      const r = cylRef.current;
      const ReVal = ReRef.current;
      const showS = slRef.current;
      const cMode = cmRef.current;
      const isPaused = pausedRef.current;

      const D = 2 * r;
      const nu = (U * D) / Math.max(1, ReVal);

      if (!isPaused) {
        const dt = 0.3;
        const steps = 4;
        for (let s = 0; s < steps; s++) {
          timeRef.current += dt;
          advect(u, v, uTmp, vTmp, dt);
          diffuse(uTmp, vTmp, u, v, nu);
          injectVort(u, v, timeRef.current, U, r);
          applyObstacle(u, v, r);
          applyBC(u, v, U);
        }
        computeVort(u, v, vort);
        updateParticles(particles, u, v);
      }

      const { w, h } = getSize();
      const scale = Math.min(w / GRID_X, h / GRID_Y);
      const ox = (w - GRID_X * scale) / 2;
      const oy = (h - GRID_Y * scale) / 2;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(ox, oy);

      let maxMag = 0.01;
      if (cMode === "velocity") {
        for (let j = 0; j < GRID_Y; j++) {
          for (let i = 0; i < GRID_X; i++) {
            const mag = Math.sqrt(u[idx(i, j)] ** 2 + v[idx(i, j)] ** 2);
            if (mag > maxMag) maxMag = mag;
          }
        }
      } else {
        let maxW = 0.01;
        for (let j = 0; j < GRID_Y; j++) {
          for (let i = 0; i < GRID_X; i++) {
            const aw = Math.abs(vort[idx(i, j)]);
            if (aw > maxW) maxW = aw;
          }
        }
        maxMag = maxW;
      }

      for (let j = 0; j < GRID_Y; j++) {
        for (let i = 0; i < GRID_X; i++) {
          const val = cMode === "velocity"
            ? Math.sqrt(u[idx(i, j)] ** 2 + v[idx(i, j)] ** 2)
            : Math.abs(vort[idx(i, j)]);
          const color = cMode === "velocity"
            ? velColor(val, maxMag)
            : vortColor(vort[idx(i, j)], maxMag);

          const inside = insideCyl(i, j, r);
          if (inside) continue;

          ctx.fillStyle = color;
          ctx.fillRect(i * scale, j * scale, Math.max(1, scale), Math.max(1, scale));
        }
      }

      const cylScreenR = r * scale;
      ctx.fillStyle = "#0a0a0c";
      ctx.beginPath();
      ctx.arc(cx * scale, cy * scale, cylScreenR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx * scale, cy * scale, cylScreenR, 0, Math.PI * 2);
      ctx.stroke();

      if (showS) {
        for (const p of particles) {
          const trail = p.trail;
          if (trail.length < 2) continue;
          for (let k = 1; k < trail.length; k++) {
            const alpha = k / trail.length;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(trail[k - 1].x * scale, trail[k - 1].y * scale);
            ctx.lineTo(trail[k].x * scale, trail[k].y * scale);
            ctx.stroke();
          }
          ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
          ctx.beginPath();
          ctx.arc(p.x * scale, p.y * scale, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      if (!compact) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "9px monospace";
        ctx.fillText(`Re = ${ReVal}`, 8, 14);
        ctx.fillText(`U = ${U.toFixed(1)}`, 8, 26);
        ctx.fillText(`ν = ${nu.toFixed(3)}`, 8, 38);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1">
              Re:
              <input
                type="range"
                min={10}
                max={500}
                step={1}
                value={Re}
                onChange={(e) => setRe(parseInt(e.target.value))}
                className="w-20 accent-amber-500"
              />
              <span className="text-amber-400 w-10">{Re}</span>
            </label>
            <label className="flex items-center gap-1">
              U:
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.1}
                value={flowSpeed}
                onChange={(e) => setFlowSpeed(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="w-8">{flowSpeed.toFixed(1)}</span>
            </label>
            <label className="flex items-center gap-1">
              R:
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={cylinderR}
                onChange={(e) => setCylinderR(parseInt(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="w-8">{cylinderR}</span>
            </label>
            <button
              onClick={() => setShowSL((s) => !s)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                showSL ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Streamlines
            </button>
            <button
              onClick={() => setColorMode((m) => (m === "velocity" ? "vorticity" : "velocity"))}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              {colorMode === "velocity" ? "Velocity" : "Vorticity"}
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                paused ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "border-border/40 text-text-secondary hover:border-amber-500/30"
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
