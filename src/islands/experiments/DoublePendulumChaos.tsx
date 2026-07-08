import { useRef, useEffect, useState, useCallback } from "react";

interface PendulumState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
}

function derivs(s: PendulumState, m1: number, m2: number, l1: number, l2: number, g: number): [number, number, number, number] {
  const { theta1, theta2, omega1, omega2 } = s;
  const delta = theta2 - theta1;
  const den = 2 * m1 + m2 - m2 * Math.cos(2 * delta);
  const a1 = (-g * (2 * m1 + m2) * Math.sin(theta1) - m2 * g * Math.sin(theta1 - 2 * theta2) - 2 * Math.sin(delta) * m2 * (omega2 * omega2 * l2 + omega1 * omega1 * l1 * Math.cos(delta))) / (l1 * den);
  const a2 = (2 * Math.sin(delta) * (omega1 * omega1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(theta1) + omega2 * omega2 * l2 * m2 * Math.cos(delta))) / (l2 * den);
  return [omega1, omega2, a1, a2];
}

function rk4Step(s: PendulumState, dt: number, m1: number, m2: number, l1: number, l2: number, g: number): PendulumState {
  const [k1a, k1b, k1c, k1d] = derivs(s, m1, m2, l1, l2, g);
  const s2: PendulumState = { theta1: s.theta1 + 0.5 * dt * k1a, theta2: s.theta2 + 0.5 * dt * k1b, omega1: s.omega1 + 0.5 * dt * k1c, omega2: s.omega2 + 0.5 * dt * k1d };
  const [k2a, k2b, k2c, k2d] = derivs(s2, m1, m2, l1, l2, g);
  const s3: PendulumState = { theta1: s.theta1 + 0.5 * dt * k2a, theta2: s.theta2 + 0.5 * dt * k2b, omega1: s.omega1 + 0.5 * dt * k2c, omega2: s.omega2 + 0.5 * dt * k2d };
  const [k3a, k3b, k3c, k3d] = derivs(s3, m1, m2, l1, l2, g);
  const s4: PendulumState = { theta1: s.theta1 + dt * k3a, theta2: s.theta2 + dt * k3b, omega1: s.omega1 + dt * k3c, omega2: s.omega2 + dt * k3d };
  const [k4a, k4b, k4c, k4d] = derivs(s4, m1, m2, l1, l2, g);
  return {
    theta1: s.theta1 + (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a),
    theta2: s.theta2 + (dt / 6) * (k1b + 2 * k2b + 2 * k3b + k4b),
    omega1: s.omega1 + (dt / 6) * (k1c + 2 * k2c + 2 * k3c + k4c),
    omega2: s.omega2 + (dt / 6) * (k1d + 2 * k2d + 2 * k3d + k4d),
  };
}

function computeLyapunovApprox(s1: PendulumState, s2: PendulumState): number {
  const dTheta1 = s1.theta1 - s2.theta1;
  const dTheta2 = s1.theta2 - s2.theta2;
  const dOmega1 = s1.omega1 - s2.omega1;
  const dOmega2 = s1.omega2 - s2.omega2;
  const dist = Math.sqrt(dTheta1 * dTheta1 + dTheta2 * dTheta2 + dOmega1 * dOmega1 + dOmega2 * dOmega2);
  return Math.log(Math.max(1e-10, dist));
}

const TRAIL_LENGTH = 600;

interface PhasePoint { theta: number; omega: number; }

export default function DoublePendulumChaos({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);

  const [split, setSplit] = useState(0.0001);
  const [m1, setM1] = useState(1);
  const [m2, setM2] = useState(1);
  const [l1, setL1] = useState(1);
  const [l2, setL2] = useState(1);
  const [damping, setDamping] = useState(0.999);
  const [showPhase, setShowPhase] = useState(false);
  const [lyapunov, setLyapunov] = useState(0);

  const state1Ref = useRef<PendulumState>({ theta1: Math.PI * 0.75, theta2: Math.PI * 0.5, omega1: 0, omega2: 0 });
  const state2Ref = useRef<PendulumState>({ theta1: Math.PI * 0.75, theta2: Math.PI * 0.5, omega1: 0, omega2: 0 });

  const trail1Ref = useRef<[number, number][]>([]);
  const trail2Ref = useRef<[number, number][]>([]);
  const phase1Ref = useRef<PhasePoint[]>([]);
  const phase2Ref = useRef<PhasePoint[]>([]);

  const splitRef = useRef(split);
  const m1Ref = useRef(m1);
  const m2Ref = useRef(m2);
  const l1Ref = useRef(l1);
  const l2Ref = useRef(l2);
  const dampRef = useRef(damping);

  useEffect(() => { splitRef.current = split; }, [split]);
  useEffect(() => { m1Ref.current = m1; }, [m1]);
  useEffect(() => { m2Ref.current = m2; }, [m2]);
  useEffect(() => { l1Ref.current = l1; }, [l1]);
  useEffect(() => { l2Ref.current = l2; }, [l2]);
  useEffect(() => { dampRef.current = damping; }, [damping]);

  const handleReset = useCallback(() => {
    state1Ref.current = { theta1: Math.PI * 0.75, theta2: Math.PI * 0.5, omega1: 0, omega2: 0 };
    state2Ref.current = { theta1: Math.PI * 0.75 + splitRef.current, theta2: Math.PI * 0.5, omega1: 0, omega2: 0 };
    trail1Ref.current = [];
    trail2Ref.current = [];
    phase1Ref.current = [];
    phase2Ref.current = [];
    setLyapunov(0);
    timeRef.current = 0;
  }, []);

  useEffect(() => {
    handleReset();
  }, [split, m1, m2, l1, l2, damping, handleReset]);

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

    let lyapSum = 0;
    let lyapCount = 0;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const g = 9.81;
      const dt = 0.016;
      const dm = dampRef.current;
      const m1v = m1Ref.current;
      const m2v = m2Ref.current;
      const l1v = l1Ref.current;
      const l2v = l2Ref.current;
      timeRef.current += dt;

      const s1 = state1Ref.current;
      const s2 = state2Ref.current;

      const n1 = rk4Step(s1, dt, m1v, m2v, l1v, l2v, g);
      const n2 = rk4Step(s2, dt, m1v, m2v, l1v, l2v, g);

      n1.omega1 *= dm; n1.omega2 *= dm;
      n2.omega1 *= dm; n2.omega2 *= dm;

      state1Ref.current = n1;
      state2Ref.current = n2;

      const x1a = l1v * Math.sin(n1.theta1);
      const y1a = l1v * Math.cos(n1.theta1);
      const x2a = x1a + l2v * Math.sin(n1.theta2);
      const y2a = y1a + l2v * Math.cos(n1.theta2);

      const x1b = l1v * Math.sin(n2.theta1);
      const y1b = l1v * Math.cos(n2.theta1);
      const x2b = x1b + l2v * Math.sin(n2.theta2);
      const y2b = y1b + l2v * Math.cos(n2.theta2);

      trail1Ref.current.push([x2a, y2a]);
      if (trail1Ref.current.length > TRAIL_LENGTH) trail1Ref.current.shift();
      trail2Ref.current.push([x2b, y2b]);
      if (trail2Ref.current.length > TRAIL_LENGTH) trail2Ref.current.shift();

      if (showPhase) {
        phase1Ref.current.push({ theta: n1.theta1, omega: n1.omega1 });
        if (phase1Ref.current.length > 300) phase1Ref.current.shift();
        phase2Ref.current.push({ theta: n2.theta1, omega: n2.omega1 });
        if (phase2Ref.current.length > 300) phase2Ref.current.shift();
      }

      lyapSum += computeLyapunovApprox(n1, n2);
      lyapCount++;
      if (lyapCount % 30 === 0) {
        setLyapunov(lyapSum / lyapCount);
      }

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const scale = Math.min(w, h) * 0.2;
      const cx = w / 2;
      const cy = h * 0.4;

      if (showPhase) {
        const pw = w * 0.35;
        const ph = h * 0.3;
        const pcx = w / 2;
        const pcy = h * 0.78;

        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.strokeRect(pcx - pw / 2, pcy - ph / 2, pw, ph);

        const drawPhase = (pts: PhasePoint[], color: string) => {
          if (pts.length < 2) return;
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const tx = pcx + (pts[i].theta / Math.PI) * (pw / 3);
            const ty = pcy + pts[i].omega * (ph / 8);
            if (i === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.stroke();
        };
        drawPhase(phase1Ref.current, "rgba(245,158,11,0.6)");
        drawPhase(phase2Ref.current, "rgba(139,92,246,0.6)");

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "9px monospace";
        ctx.fillText("Phase Space (θ vs ω)", pcx - 30, pcy - ph / 2 + 10);
      }

      const drawPendulum = (x2: number, y2: number, x1: number, y1: number, color: string, trail: [number, number][]) => {
        const px = cx + x2 * scale;
        const py = cy + y2 * scale;
        const p1x = cx + x1 * scale;
        const p1y = cy + y1 * scale;

        for (let i = 1; i < trail.length; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + trail[i - 1][0] * scale, cy + trail[i - 1][1] * scale);
          ctx.lineTo(cx + trail[i][0] * scale, cy + trail[i][1] * scale);
          ctx.strokeStyle = color.replace("0.6)", `${0.1 + 0.5 * (i / trail.length)})`);
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p1x, p1y);
        ctx.lineTo(px, py);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p1x, p1y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      };

      drawPendulum(x2a, y2a, x1a, y1a, "rgba(245,158,11,0.8)", trail1Ref.current);
      drawPendulum(x2b, y2b, x1b, y1b, "rgba(139,92,246,0.8)", trail2Ref.current);

      ctx.fillStyle = "rgba(245,158,11,0.5)";
      ctx.font = "9px monospace";
      ctx.fillText("θ₁=θ₂", 10, 14);

      ctx.fillStyle = "rgba(139,92,246,0.5)";
      ctx.fillText("θ₁=θ₂+" + split.toFixed(5) + "°", 10, 26);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, showPhase, split]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <span className="text-amber-400 font-bold">λ ≈ {lyapunov.toFixed(3)}</span>
            <button
              onClick={() => setShowPhase(s => !s)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                showPhase ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Phase Space
            </button>
            <button
              onClick={handleReset}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1">
              Δθ:
              <input
                type="range"
                min={0.00001}
                max={0.01}
                step={0.00001}
                value={split}
                onChange={(e) => setSplit(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              m₁:
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={m1}
                onChange={(e) => setM1(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              m₂:
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={m2}
                onChange={(e) => setM2(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              l₁:
              <input
                type="range"
                min={0.2}
                max={2}
                step={0.1}
                value={l1}
                onChange={(e) => setL1(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              l₂:
              <input
                type="range"
                min={0.2}
                max={2}
                step={0.1}
                value={l2}
                onChange={(e) => setL2(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              Damping:
              <input
                type="range"
                min={0.99}
                max={1}
                step={0.001}
                value={damping}
                onChange={(e) => setDamping(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
