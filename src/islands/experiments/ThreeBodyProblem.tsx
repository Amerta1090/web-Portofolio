import { useCallback, useEffect, useRef, useState } from "react";

interface BodyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

type Preset = "figure8" | "lagrange" | "broucke";

interface PresetConfig {
  name: string;
  init: () => BodyState[];
}

const G = 1;
const SOFTENING = 0.01;
const TRAIL_LENGTH = 600;
const BASE_DT = 0.002;

const COLORS: [number, number, number][] = [
  [245, 158, 11],
  [6, 182, 212],
  [168, 85, 247],
];

const BODY_NAMES = ["Body 1", "Body 2", "Body 3"];

const PRESET_MAP: Record<Preset, PresetConfig> = {
  figure8: {
    name: "Figure-8",
    init: () => [
      { x: -0.97000436, y: 0.24308753, vx: 0.466203685, vy: 0.43236573, mass: 1 },
      { x: 0.97000436, y: -0.24308753, vx: 0.466203685, vy: 0.43236573, mass: 1 },
      { x: 0, y: 0, vx: -0.93240737, vy: -0.86473146, mass: 1 },
    ],
  },
  lagrange: {
    name: "Lagrange L4/L5",
    init: () => {
      const s3 = Math.sqrt(3);
      const r = 1 / s3;
      const w = Math.sqrt(G * 3);
      return [
        { x: 0, y: r, vx: -w * r, vy: 0, mass: 1 },
        { x: -0.5, y: -r / 2, vx: (w * r) / 2, vy: (-w * r * s3) / 2, mass: 1 },
        { x: 0.5, y: -r / 2, vx: (-w * r) / 2, vy: (-w * r * s3) / 2, mass: 1 },
      ];
    },
  },
  broucke: {
    name: "Broucke Orbit",
    init: () => [
      { x: -0.45, y: 0, vx: 0, vy: 0.6, mass: 1.2 },
      { x: 0.45, y: 0, vx: 0, vy: -0.6, mass: 1.2 },
      { x: 0, y: 0.75, vx: -0.22, vy: 0, mass: 0.6 },
    ],
  },
};

function computeAccelerations(bodies: BodyState[]): { ax: number; ay: number }[] {
  const n = bodies.length;
  const accs: { ax: number; ay: number }[] = new Array(n);
  for (let i = 0; i < n; i++) accs[i] = { ax: 0, ay: 0 };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq + SOFTENING * SOFTENING);
      const f = G / (distSq * dist + 1e-12);
      accs[i].ax += f * bodies[j].mass * dx;
      accs[i].ay += f * bodies[j].mass * dy;
      accs[j].ax -= f * bodies[i].mass * dx;
      accs[j].ay -= f * bodies[i].mass * dy;
    }
  }
  return accs;
}

function velocityVerlet(bodies: BodyState[], dt: number): void {
  const accs = computeAccelerations(bodies);
  const halfDt2 = 0.5 * dt * dt;
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].x += bodies[i].vx * dt + accs[i].ax * halfDt2;
    bodies[i].y += bodies[i].vy * dt + accs[i].ay * halfDt2;
    bodies[i].vx += 0.5 * accs[i].ax * dt;
    bodies[i].vy += 0.5 * accs[i].ay * dt;
  }
  const newAccs = computeAccelerations(bodies);
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].vx += 0.5 * newAccs[i].ax * dt;
    bodies[i].vy += 0.5 * newAccs[i].ay * dt;
  }
}

function computeEnergy(bodies: BodyState[]): { ke: number; pe: number } {
  let ke = 0;
  let pe = 0;
  for (let i = 0; i < bodies.length; i++) {
    ke += 0.5 * bodies[i].mass * (bodies[i].vx * bodies[i].vx + bodies[i].vy * bodies[i].vy);
    for (let j = i + 1; j < bodies.length; j++) {
      const dx = bodies[j].x - bodies[i].x;
      const dy = bodies[j].y - bodies[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1e-10) pe -= (G * bodies[i].mass * bodies[j].mass) / dist;
    }
  }
  return { ke, pe };
}

function computeMomentum(bodies: BodyState[]): { px: number; py: number } {
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return { px, py };
}

function centerOfMass(bodies: BodyState[]): { x: number; y: number } {
  let totalMass = 0;
  let x = 0;
  let y = 0;
  for (const b of bodies) {
    totalMass += b.mass;
    x += b.x * b.mass;
    y += b.y * b.mass;
  }
  if (totalMass === 0) return { x: 0, y: 0 };
  return { x: x / totalMass, y: y / totalMass };
}

export default function ThreeBodyProblem({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const bodiesRef = useRef<BodyState[]>([]);
  const trailsRef = useRef<TrailPoint[][]>([[], [], []]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const dragIdxRef = useRef(-1);
  const timeRef = useRef(0);
  const stepCountRef = useRef(0);
  const hudFrameRef = useRef(0);

  const [preset, setPreset] = useState<Preset>("figure8");
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [ke, setKe] = useState(0);
  const [pe, setPe] = useState(0);
  const [totalE, setTotalE] = useState(0);
  const [px, setPx] = useState(0);
  const [py, setPy] = useState(0);
  const [stepCount, setStepCount] = useState(0);

  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  const presetRef = useRef(preset);
  const draggingRef = useRef(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  const resetSim = useCallback((targetPreset?: Preset) => {
    const target = targetPreset ?? presetRef.current;
    presetRef.current = target;
    const cfg = PRESET_MAP[target];
    const bodies = cfg.init();
    bodiesRef.current = bodies;
    trailsRef.current = [[], [], []];
    timeRef.current = 0;
    dragIdxRef.current = -1;
    const e = computeEnergy(bodies);
    const mom = computeMomentum(bodies);
    setKe(e.ke);
    setPe(e.pe);
    setTotalE(e.ke + e.pe);
    setPx(mom.px);
    setPy(mom.py);
    stepCountRef.current = 0;
    setStepCount(0);
    hudFrameRef.current = 0;
  }, []);

  useEffect(() => {
    resetSim(preset);
  }, [preset, resetSim]);

  useEffect(() => {
    if (!compact) {
      runningRef.current = true;
    }
  }, [compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

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

    function step(dt: number) {
      if (pausedRef.current) return;
      if (bodiesRef.current.length < 2) return;
      velocityVerlet(bodiesRef.current, dt);
      const bodies = bodiesRef.current;
      const trails = trailsRef.current;
      for (let i = 0; i < bodies.length; i++) {
        trails[i].push({ x: bodies[i].x, y: bodies[i].y });
        if (trails[i].length > TRAIL_LENGTH) trails[i].shift();
      }
      timeRef.current += dt;
      stepCountRef.current += 1;
    }

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const bodies = bodiesRef.current;
      const trails = trailsRef.current;
      if (bodies.length === 0) return;

      const substeps = compact ? 3 : speedRef.current;
      for (let s = 0; s < substeps; s++) step(BASE_DT);

      const cm = centerOfMass(bodies);
      const scale = Math.min(w, h) * 0.16;
      const cx = w / 2;
      const cy = h / 2;

      const toScreen = (x: number, y: number) => ({
        sx: cx + (x - cm.x) * scale,
        sy: cy - (y - cm.y) * scale,
      });

      const e = computeEnergy(bodies);
      const mom = computeMomentum(bodies);
      hudFrameRef.current += 1;
      if (hudFrameRef.current % 12 === 1) {
        setKe(e.ke);
        setPe(e.pe);
        setTotalE(e.ke + e.pe);
        setPx(mom.px);
        setPy(mom.py);
        setStepCount(stepCountRef.current);
      }

      const cmScreen = toScreen(cm.x, cm.y);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cmScreen.sx - 5, cmScreen.sy);
      ctx.lineTo(cmScreen.sx + 5, cmScreen.sy);
      ctx.moveTo(cmScreen.sx, cmScreen.sy - 5);
      ctx.lineTo(cmScreen.sx, cmScreen.sy + 5);
      ctx.stroke();

      if (!compact) {
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 0.5;
        for (const gx of [-2, -1, 1, 2]) {
          const p = toScreen(cm.x + (gx / scale) * (w / 2) * 0, cm.y);
          ctx.beginPath();
          ctx.moveTo(p.sx, 0);
          ctx.lineTo(p.sx, h);
          ctx.stroke();
        }
      }

      for (let i = 0; i < bodies.length; i++) {
        const trail = trails[i];
        const color = COLORS[i % COLORS.length];

        if (trail.length > 1) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          for (let j = 1; j < trail.length; j++) {
            const alpha = (j / trail.length) * 0.55 + 0.04;
            const a = toScreen(trail[j - 1].x, trail[j - 1].y);
            const b = toScreen(trail[j].x, trail[j].y);
            ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
            ctx.lineWidth = compact ? 1 : 1.5;
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }

        const body = bodies[i];
        const s = toScreen(body.x, body.y);
        const radius = compact ? 4 : 5 + Math.min(3, body.mass * 1.5);

        const glow = ctx.createRadialGradient(s.sx, s.sy, 0, s.sx, s.sy, radius * 4);
        glow.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.28)`);
        glow.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},1)`;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.sx, s.sy, radius + 1.5, 0, Math.PI * 2);
        ctx.stroke();

        const speedVal = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
        if (speedVal > 0.005) {
          const vecScale = Math.min(w, h) * 0.22;
          const vLen = Math.min(1, speedVal / 0.8) * vecScale;
          const nx = (body.vx / speedVal) * vLen;
          const ny = -(body.vy / speedVal) * vLen;
          ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},0.75)`;
          ctx.lineWidth = compact ? 1 : 1.5;
          ctx.beginPath();
          ctx.moveTo(s.sx, s.sy);
          ctx.lineTo(s.sx + nx, s.sy + ny);
          ctx.stroke();
          const arrowSize = compact ? 3 : 5;
          const ang = Math.atan2(ny, nx);
          ctx.beginPath();
          ctx.moveTo(s.sx + nx, s.sy + ny);
          ctx.lineTo(
            s.sx + nx - arrowSize * Math.cos(ang - 0.45),
            s.sy + ny - arrowSize * Math.sin(ang - 0.45),
          );
          ctx.lineTo(
            s.sx + nx - arrowSize * Math.cos(ang + 0.45),
            s.sy + ny - arrowSize * Math.sin(ang + 0.45),
          );
          ctx.closePath();
          ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.75)`;
          ctx.fill();
        }
      }

      if (!compact) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "10px monospace";
        ctx.fillText(`t = ${timeRef.current.toFixed(1)}  ·  G = 1`, 10, 16);
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const hitTest = (mx: number, my: number) => {
      const bodies = bodiesRef.current;
      const w = canvas.clientWidth || 400;
      const h = canvas.clientHeight || (compact ? 192 : 600);
      const cm = centerOfMass(bodies);
      const scale = Math.min(w, h) * 0.16;
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        const sx = w / 2 + (b.x - cm.x) * scale;
        const sy = h / 2 - (b.y - cm.y) * scale;
        const dx = mx - sx;
        const dy = my - sy;
        if (dx * dx + dy * dy < 12 * 12) return i;
      }
      return -1;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (pausedRef.current) return;
      const pos = getCanvasPos(e);
      const idx = hitTest(pos.x, pos.y);
      if (idx >= 0) {
        dragIdxRef.current = idx;
        draggingRef.current = true;
        mouseRef.current = pos;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e);
      mouseRef.current = pos;
      const idx = dragIdxRef.current;
      if (idx >= 0 && idx < bodiesRef.current.length) {
        const bodies = bodiesRef.current;
        const w = canvas.clientWidth || 400;
        const h = canvas.clientHeight || (compact ? 192 : 600);
        const cm = centerOfMass(bodies);
        const scale = Math.min(w, h) * 0.16;
        const b = bodies[idx];
        b.x = cm.x + (pos.x - w / 2) / scale;
        b.y = cm.y - (pos.y - h / 2) / scale;
        b.vx = 0;
        b.vy = 0;
        trailsRef.current[idx] = [];
      }
    };

    const handleMouseUp = () => {
      dragIdxRef.current = -1;
      draggingRef.current = false;
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [compact]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {compact && (
        <div className="absolute top-2 left-2 text-[10px] text-white/40 font-mono pointer-events-none">
          3-Body
        </div>
      )}
      {!compact && (
        <>
          <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2 text-[11px] font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1 text-white/60">
              Preset:
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as Preset)}
                className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-white/80 text-[11px]"
              >
                {Object.entries(PRESET_MAP).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-white/30">·</span>
            <span className="text-white/40">Drag a body to edit its position</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/60 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className={`px-3 py-1 text-[11px] rounded-full border transition-all ${
                  paused
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {paused ? "▶ Play" : "⏸ Pause"}
              </button>
              <button
                type="button"
                onClick={() => resetSim()}
                className="px-3 py-1 text-[11px] rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                ↻ Reset
              </button>
              <label className="flex items-center gap-1">
                Speed:
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={speed}
                  onChange={(e) => setSpeed(Number.parseInt(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-8">{speed}×</span>
              </label>
              <span className="hidden md:flex items-center gap-3 ml-2 text-white/50">
                <span>
                  KE <span className="text-amber-300">{ke.toFixed(3)}</span>
                </span>
                <span>
                  PE <span className="text-cyan-300">{pe.toFixed(3)}</span>
                </span>
                <span>
                  E<sub>tot</sub> <span className="text-white/80">{totalE.toFixed(3)}</span>
                </span>
                <span className="w-px h-3 bg-white/15" />
                <span>
                  p = (<span className="text-emerald-300">{px.toFixed(3)}</span>,{" "}
                  <span className="text-emerald-300">{py.toFixed(3)}</span>)
                </span>
                <span className="w-px h-3 bg-white/15" />
                <span>
                  steps <span className="text-white/70">{stepCount}</span>
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
