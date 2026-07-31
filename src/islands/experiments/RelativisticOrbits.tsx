import { useCallback, useEffect, useRef, useState } from "react";

const G = 1;
const C = 50;
const DT = 0.005;
const A = 1;
const E = 0.5;
const MAX_TRAIL = 6000;
const DEG = 180 / Math.PI;
const ARCSEC = DEG * 3600;

interface OrbitState {
  r: number;
  theta: number;
  vr: number;
  vtheta: number;
}

function initState(mass: number): OrbitState {
  const L = Math.sqrt(G * mass * A * (1 - E * E));
  const r = A * (1 - E);
  return { r, theta: 0, vr: 0, vtheta: L / (r * r) };
}

function derivatives(s: OrbitState, mass: number, isGR: boolean): [number, number, number, number] {
  const { r, vr, vtheta } = s;
  const ar =
    r * vtheta * vtheta - mass / (r * r) - (isGR ? (3 * mass * vtheta * vtheta) / (C * C) : 0);
  return [vr, vtheta, ar, (-2 * vr * vtheta) / r];
}

function rk4Step(s: OrbitState, mass: number, isGR: boolean, dt: number): OrbitState {
  const k1 = derivatives(s, mass, isGR);
  const s2: OrbitState = {
    r: s.r + 0.5 * dt * k1[0],
    theta: s.theta + 0.5 * dt * k1[1],
    vr: s.vr + 0.5 * dt * k1[2],
    vtheta: s.vtheta + 0.5 * dt * k1[3],
  };
  const k2 = derivatives(s2, mass, isGR);
  const s3: OrbitState = {
    r: s.r + 0.5 * dt * k2[0],
    theta: s.theta + 0.5 * dt * k2[1],
    vr: s.vr + 0.5 * dt * k2[2],
    vtheta: s.vtheta + 0.5 * dt * k2[3],
  };
  const k3 = derivatives(s3, mass, isGR);
  const s4: OrbitState = {
    r: s.r + dt * k3[0],
    theta: s.theta + dt * k3[1],
    vr: s.vr + dt * k3[2],
    vtheta: s.vtheta + dt * k3[3],
  };
  const k4 = derivatives(s4, mass, isGR);
  return {
    r: s.r + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    theta: s.theta + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    vr: s.vr + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    vtheta: s.vtheta + (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]),
  };
}

const COLORS = {
  newton: "#22d3ee",
  gr: "#f59e0b",
  label: "#9ca3af",
  accent: "#f59e0b",
};

function drawOrbit(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  trail: { r: number; theta: number }[],
  state: OrbitState,
  color: string,
  mass: number,
  label: string,
  absorbed: boolean,
  isLeft: boolean,
  vpX: number,
  vpY: number,
  vpW: number,
  vpH: number,
) {
  ctx.fillStyle = "#0f0f11";
  ctx.fillRect(vpX, vpY, vpW, vpH);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 0.5;
  for (let r = 0.25; r <= 2.01; r += 0.25) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  const rs = (2 * mass) / (C * C);
  const rPh = 1.5 * rs;
  if (rs * scale > 2) {
    ctx.strokeStyle = "rgba(239,68,68,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, rs * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (rPh * scale > 2) {
    ctx.strokeStyle = "rgba(251,146,60,0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, rPh * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (trail.length > 1) {
    const segments = [
      { start: Math.max(0, trail.length - 100), alpha: 1 },
      { start: Math.max(0, trail.length - 500), alpha: 0.5 },
      { start: Math.max(0, trail.length - 2000), alpha: 0.2 },
      { start: 0, alpha: 0.06 },
    ];
    for (const seg of segments) {
      if (seg.start >= trail.length - 1) continue;
      ctx.globalAlpha = seg.alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = seg.start; i < trail.length; i++) {
        const px = cx + trail[i].r * scale * Math.cos(trail[i].theta);
        const py = cy - trail[i].r * scale * Math.sin(trail[i].theta);
        if (i === seg.start) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6);
  cGrad.addColorStop(0, "#fbbf24");
  cGrad.addColorStop(0.4, "#f59e0b");
  cGrad.addColorStop(1, "rgba(245, 158, 11, 0)");
  ctx.fillStyle = cGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  const px = cx + state.r * scale * Math.cos(state.theta);
  const py = cy - state.r * scale * Math.sin(state.theta);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#d1d5db";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, vpX + 10, vpY + 18);

  if (rs * scale > 2) {
    ctx.fillStyle = "rgba(239,68,68,0.7)";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Rₛ", vpX + 10, vpY + vpH - 8);
  }
  if (rPh * scale > 2) {
    ctx.fillStyle = "rgba(251,146,60,0.7)";
    ctx.font = "8px monospace";
    ctx.textAlign = "right";
    ctx.fillText("R_ph", vpX + vpW - 10, vpY + vpH - 8);
  }

  if (absorbed) {
    ctx.fillStyle = "rgba(239,68,68,0.25)";
    ctx.fillRect(vpX, vpY, vpW, vpH);
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ABSORBED", cx, cy);
  }
}

export default function RelativisticOrbits({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  const massRef = useRef(1);
  const speedRef = useRef(5);
  const pausedRef = useRef(false);

  const newtState = useRef<OrbitState>(initState(1));
  const grState = useRef<OrbitState>(initState(1));
  const newtTrail = useRef<{ r: number; theta: number }[]>([]);
  const grTrail = useRef<{ r: number; theta: number }[]>([]);
  const newtPeriTheta = useRef<number[]>([]);
  const grPeriTheta = useRef<number[]>([]);
  const prevNewtVr = useRef(0);
  const prevGrVr = useRef(0);
  const absorbedRef = useRef(false);

  const [mass, setMass] = useState(1);
  const [speed, setSpeed] = useState(5);
  const [paused, setPaused] = useState(false);
  const [shiftArcsec, setShiftArcsec] = useState(0);
  const [orbitCount, setOrbitCount] = useState(0);
  const [grAbsorbed, setGrAbsorbed] = useState(false);

  const rs = (2 * mass) / (C * C);
  const rPh = 1.5 * rs;

  const reset = useCallback(() => {
    const m = massRef.current;
    newtState.current = initState(m);
    grState.current = initState(m);
    newtTrail.current = [];
    grTrail.current = [];
    newtPeriTheta.current = [];
    grPeriTheta.current = [];
    prevNewtVr.current = 0;
    prevGrVr.current = 0;
    absorbedRef.current = false;
    setShiftArcsec(0);
    setOrbitCount(0);
    setGrAbsorbed(false);
  }, []);

  useEffect(() => {
    massRef.current = mass;
  }, [mass]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset must re-run when mass changes (reads massRef, already updated by the effect above)
  useEffect(() => {
    reset();
  }, [mass, reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = rect.width;
    const h = rect.height;
    const m = massRef.current;

    if (compact) {
      const sp = speedRef.current;
      const isPaused = pausedRef.current;

      if (!isPaused && !absorbedRef.current) {
        const steps = Math.round(sp * 2);
        for (let i = 0; i < steps; i++) {
          const state = grState.current;
          if (state.r < 0.02) {
            absorbedRef.current = true;
            setGrAbsorbed(true);
            break;
          }
          const prevVr = prevGrVr.current;
          grState.current = rk4Step(state, m, true, DT);
          prevGrVr.current = state.vr;
          grTrail.current.push({ r: state.r, theta: state.theta });
          if (grTrail.current.length > MAX_TRAIL) grTrail.current.shift();
          if (prevVr < 0 && state.vr >= 0) {
            grPeriTheta.current.push(state.theta);
            if (grPeriTheta.current.length >= 2) {
              const n = grPeriTheta.current.length;
              const shift = grPeriTheta.current[n - 1] - grPeriTheta.current[n - 2] - 2 * Math.PI;
              setShiftArcsec(shift * ARCSEC);
              setOrbitCount(n);
            }
          }
        }
      }

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) / 3.5;
      drawOrbit(
        ctx,
        cx,
        cy,
        scale,
        grTrail.current,
        grState.current,
        COLORS.gr,
        m,
        "GR ORBIT",
        absorbedRef.current,
        true,
        0,
        0,
        w,
        h,
      );
    } else {
      const sp = speedRef.current;
      const isPaused = pausedRef.current;

      if (!isPaused) {
        const steps = Math.round(sp * 2);
        for (let i = 0; i < steps; i++) {
          const ns = newtState.current;
          const prevNvr = prevNewtVr.current;
          newtState.current = rk4Step(ns, m, false, DT);
          prevNewtVr.current = ns.vr;
          newtTrail.current.push({ r: ns.r, theta: ns.theta });
          if (newtTrail.current.length > MAX_TRAIL) newtTrail.current.shift();
          if (prevNvr < 0 && ns.vr >= 0) {
            newtPeriTheta.current.push(ns.theta);
          }
        }
        for (let i = 0; i < steps; i++) {
          const gs = grState.current;
          if (gs.r < 0.02) {
            absorbedRef.current = true;
            setGrAbsorbed(true);
            break;
          }
          const prevGvr = prevGrVr.current;
          grState.current = rk4Step(gs, m, true, DT);
          prevGrVr.current = gs.vr;
          grTrail.current.push({ r: gs.r, theta: gs.theta });
          if (grTrail.current.length > MAX_TRAIL) grTrail.current.shift();
          if (prevGvr < 0 && gs.vr >= 0) {
            grPeriTheta.current.push(gs.theta);
            if (grPeriTheta.current.length >= 2) {
              const n = grPeriTheta.current.length;
              const shift = grPeriTheta.current[n - 1] - grPeriTheta.current[n - 2] - 2 * Math.PI;
              setShiftArcsec(shift * ARCSEC);
              setOrbitCount(n);
            }
          }
        }
      }

      const midX = Math.floor(w / 2);
      const dcxL = midX / 2;
      const dcyL = h / 2;
      const scaleL = Math.min(midX, h) / 3.5;
      drawOrbit(
        ctx,
        dcxL,
        dcyL,
        scaleL,
        newtTrail.current,
        newtState.current,
        COLORS.newton,
        m,
        "NEWTONIAN",
        false,
        0,
        0,
        midX,
        h,
      );

      const dcxR = midX + (w - midX) / 2;
      const dcyR = h / 2;
      const scaleR = Math.min(w - midX, h) / 3.5;
      drawOrbit(
        ctx,
        dcxR,
        dcyR,
        scaleR,
        grTrail.current,
        grState.current,
        COLORS.gr,
        m,
        "GENERAL RELATIVITY",
        absorbedRef.current,
        midX,
        0,
        w - midX,
        h,
      );

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, h);
      ctx.stroke();
    }

    rafRef.current = requestAnimationFrame(render);
  }, [compact]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  if (compact) {
    return (
      <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0" />
        <div className="absolute top-1 right-1 z-10 text-[8px] font-mono text-amber-400/70 pointer-events-none">
          {grAbsorbed ? "ABSORBED" : `${orbitCount} orbits`}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden flex flex-col"
    >
      <canvas ref={canvasRef} className="w-full flex-1" />
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/70 z-10">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition"
        >
          {paused ? "▶ Play" : "⏸ Pause"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 transition"
        >
          ↻ Reset
        </button>
        <label className="flex items-center gap-1.5">
          <span className="text-white/50">Speed:</span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-16 accent-amber-500"
          />
          <span className="text-amber-300 w-4">{speed}</span>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-white/50">Mass:</span>
          <input
            type="range"
            min={1}
            max={150}
            step={1}
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
            className="w-20 accent-amber-500"
          />
          <span className="text-amber-300 w-8 font-mono">{mass}</span>
        </label>
        <div className="flex items-center gap-3 ml-auto text-white/50 font-mono">
          <span>
            R<sub>s</sub>: <span className="text-red-400">{rs.toFixed(4)}</span>
          </span>
          <span>
            R<sub>ph</sub>: <span className="text-orange-400">{rPh.toFixed(4)}</span>
          </span>
          <span>
            Δφ: <span className="text-amber-300">{shiftArcsec.toFixed(1)}"</span>/orb
          </span>
          <span>
            Orbits: <span className="text-amber-300">{orbitCount}</span>
          </span>
        </div>
        {grAbsorbed && <span className="text-red-400 font-bold ml-auto">PARTICLE ABSORBED</span>}
      </div>
    </div>
  );
}
