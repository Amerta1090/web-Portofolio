import { useCallback, useEffect, useRef, useState } from "react";

const PARTICLE_COUNT = 900;
const COMPACT_COUNT = 500;
const SOFT = 0.04;
const RHO_RADIUS = 0.09;
const INITIAL_RADIUS = 1.0;
const COOLING = 0.9992;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dark: boolean;
  d: number;
}

const DENSITY_STOPS: Array<[number, [number, number, number]]> = [
  [0.0, [59, 130, 246]],
  [0.34, [34, 211, 238]],
  [0.66, [245, 158, 11]],
  [1.0, [239, 68, 68]],
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function densityColorRamp(t: number): [number, number, number] {
  const tt = Math.min(1, Math.max(0, t));
  for (let i = 0; i < DENSITY_STOPS.length - 1; i++) {
    const [t0, c0] = DENSITY_STOPS[i];
    const [t1, c1] = DENSITY_STOPS[i + 1];
    if (tt <= t1) {
      const f = (tt - t0) / Math.max(t1 - t0, 1e-6);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ];
    }
  }
  return DENSITY_STOPS[DENSITY_STOPS.length - 1][1];
}

export function createParticles(
  n: number,
  dmFraction: number,
  angularMomentum: number,
  seed = 1337,
): Particle[] {
  const rnd = mulberry32(seed);
  const gauss = () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rnd();
    while (v === 0) v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const nDark = Math.round(n * Math.min(0.8, Math.max(0, dmFraction)));
  const scatter = 0.02;
  const ps: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const u = Math.sqrt(rnd());
    const theta = rnd() * Math.PI * 2;
    const r = u * INITIAL_RADIUS;
    const vtan = angularMomentum * Math.sqrt(r);
    const vx = -Math.sin(theta) * vtan + gauss() * scatter;
    const vy = Math.cos(theta) * vtan + gauss() * scatter;
    ps.push({
      x: Math.cos(theta) * r,
      y: Math.sin(theta) * r,
      vx,
      vy,
      dark: i < nDark,
      d: 0,
    });
  }
  return ps;
}

function computeForces(ps: Particle[], acc: Float64Array, rhoR: number) {
  const n = ps.length;
  acc.fill(0);
  const soft2 = SOFT * SOFT;
  const rhoR2 = rhoR * rhoR;
  for (let i = 0; i < n; i++) ps[i].d = 0;
  for (let i = 0; i < n; i++) {
    const pi = ps[i];
    const ai = i << 1;
    for (let j = i + 1; j < n; j++) {
      const pj = ps[j];
      const dx = pj.x - pi.x;
      const dy = pj.y - pi.y;
      const r2 = dx * dx + dy * dy + soft2;
      const invR = 1 / Math.sqrt(r2);
      const f = invR * invR * invR;
      const ax = dx * f;
      const ay = dy * f;
      acc[ai] += ax;
      acc[ai + 1] += ay;
      const aj = j << 1;
      acc[aj] -= ax;
      acc[aj + 1] -= ay;
      if (r2 < rhoR2) {
        const w = 1 - Math.sqrt(r2) / rhoR;
        pi.d += w;
        pj.d += w;
      }
    }
  }
}

export function stepSimulation(
  ps: Particle[],
  acc: Float64Array,
  dt: number,
  rhoR: number,
  cooling: number,
) {
  computeForces(ps, acc, rhoR);
  const n = ps.length;
  for (let i = 0; i < n; i++) {
    const p = ps[i];
    const ai = i << 1;
    p.vx += acc[ai] * dt * 0.5;
    p.vy += acc[ai + 1] * dt * 0.5;
  }
  for (let i = 0; i < n; i++) {
    const p = ps[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  computeForces(ps, acc, rhoR);
  for (let i = 0; i < n; i++) {
    const p = ps[i];
    const ai = i << 1;
    p.vx += acc[ai] * dt * 0.5;
    p.vy += acc[ai + 1] * dt * 0.5;
  }
  if (cooling !== 1) {
    for (let i = 0; i < n; i++) {
      const p = ps[i];
      p.vx *= cooling;
      p.vy *= cooling;
    }
  }
}

export default function GalaxyFormation({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const particlesRef = useRef<Particle[]>([]);
  const accRef = useRef<Float64Array>(new Float64Array(0));
  const simTimeRef = useRef(0);

  const countRef = useRef<HTMLSpanElement>(null);
  const darkRef = useRef<HTMLSpanElement>(null);
  const darkPctRef = useRef<HTMLSpanElement>(null);
  const baryRef = useRef<HTMLSpanElement>(null);
  const ageRef = useRef<HTMLSpanElement>(null);

  const [dmFraction, setDmFraction] = useState(0.3);
  const [angularMomentum, setAngularMomentum] = useState(1.0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  const dmRef = useRef(dmFraction);
  const amRef = useRef(angularMomentum);
  const speedRef = useRef(speed);
  const pausedRef = useRef(paused);

  useEffect(() => {
    dmRef.current = dmFraction;
  }, [dmFraction]);
  useEffect(() => {
    amRef.current = angularMomentum;
  }, [angularMomentum]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const initialize = useCallback(
    (frac: number, am: number) => {
      const n = compact ? COMPACT_COUNT : PARTICLE_COUNT;
      particlesRef.current = createParticles(n, frac, am, 1337);
      accRef.current = new Float64Array(n * 2);
      simTimeRef.current = 0;
    },
    [compact],
  );

  useEffect(() => {
    initialize(dmFraction, angularMomentum);
  }, [dmFraction, angularMomentum, initialize]);

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
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const ps = particlesRef.current;
      if (ps.length === 0) return;
      const n = ps.length;

      if (!pausedRef.current) {
        const total = 0.006 * speedRef.current;
        const nSub = total > 0.014 ? 4 : total > 0.007 ? 2 : 1;
        const dt = total / nSub;
        const acc = accRef.current;
        for (let s = 0; s < nSub; s++) {
          stepSimulation(ps, acc, dt, RHO_RADIUS, COOLING);
        }
        simTimeRef.current += total;
      }

      const refD = (n * RHO_RADIUS * RHO_RADIUS) / (3 * INITIAL_RADIUS * INITIAL_RADIUS);
      const invRef = 1 / (refD * 6);

      const scale = Math.min(w, h) * 0.42;
      const cx = w / 2;
      const cy = h / 2;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      const r = compact ? 1.1 : 1.4;
      for (let i = 0; i < n; i++) {
        const p = ps[i];
        const t = Math.min(1, p.d * invRef);
        const [cr, cg, cb] = densityColorRamp(t);
        ctx.beginPath();
        ctx.arc(cx + p.x * scale, cy + p.y * scale, r, 0, Math.PI * 2);
        if (p.dark) {
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = `rgba(${Math.round(cr * 0.55 + 147 * 0.45)},${Math.round(cg * 0.55 + 51 * 0.45)},${Math.round(cb * 0.55 + 234 * 0.45)},1)`;
        } else {
          ctx.globalAlpha = 0.65 + t * 0.35;
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        }
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      if (countRef.current) countRef.current.textContent = String(n);
      let dark = 0;
      for (let i = 0; i < n; i++) if (ps[i].dark) dark++;
      if (darkRef.current) darkRef.current.textContent = String(dark);
      if (darkPctRef.current) {
        darkPctRef.current.textContent = ((dark / n) * 100).toFixed(0);
      }
      if (baryRef.current) baryRef.current.textContent = String(n - dark);
      if (ageRef.current) ageRef.current.textContent = simTimeRef.current.toFixed(2);
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
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        aria-label="Galaxy formation N-body simulation"
      />
      {!compact && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className={`px-2.5 py-1 text-[10px] rounded border transition-all ${
                paused
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => initialize(dmRef.current, amRef.current)}
              className="px-2.5 py-1 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
            <label className="flex items-center gap-1">
              Dark matter:
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.01}
                value={dmFraction}
                onChange={(e) => setDmFraction(Number.parseFloat(e.target.value))}
                className="w-20 accent-amber-500"
              />
              <span className="text-amber-400 w-9 text-[10px]">
                {(dmFraction * 100).toFixed(0)}%
              </span>
            </label>
            <label className="flex items-center gap-1">
              Angular momentum:
              <input
                type="range"
                min={0}
                max={2}
                step={0.01}
                value={angularMomentum}
                onChange={(e) => setAngularMomentum(Number.parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="text-amber-400 w-7 text-[10px]">{angularMomentum.toFixed(2)}</span>
            </label>
            <label className="flex items-center gap-1">
              Speed:
              <input
                type="range"
                min={0.2}
                max={4}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number.parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="text-amber-400 w-5 text-[10px]">{speed.toFixed(1)}</span>
            </label>
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="flex flex-col gap-1 text-[11px] font-mono text-text-secondary/70 bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <span>
              Particles:{" "}
              <span ref={countRef} className="text-text-primary">
                …
              </span>
            </span>
            <span>
              Dark matter:{" "}
              <span ref={darkRef} className="text-purple-400">
                …
              </span>{" "}
              (
              <span ref={darkPctRef} className="text-purple-400">
                …
              </span>
              %)
            </span>
            <span>
              Baryonic:{" "}
              <span ref={baryRef} className="text-cyan-300">
                …
              </span>
            </span>
            <span>
              Age:{" "}
              <span ref={ageRef} className="text-amber-400">
                0.00
              </span>
            </span>
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="flex flex-col gap-1.5 text-[10px] font-mono text-text-secondary/60 bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> low density
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22d3ee]" /> moderate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> high
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> core
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> dark matter
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
