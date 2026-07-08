import { useRef, useEffect, useState, useCallback } from "react";

interface AttractorParams {
  sigma: number;
  rho: number;
  beta: number;
}

interface AttractorConfig {
  name: string;
  params: AttractorParams;
  init: [number, number, number];
  step: (p: [number, number, number], params: AttractorParams, dt: number) => [number, number, number];
}

const attractors: Record<string, AttractorConfig> = {
  lorenz: {
    name: "Lorenz",
    params: { sigma: 10, rho: 28, beta: 8 / 3 },
    init: [0.1, 0.1, 0.1],
    step: ([x, y, z], p, dt) => [
      x + dt * p.sigma * (y - x),
      y + dt * (x * (p.rho - z) - y),
      z + dt * (x * y - p.beta * z),
    ],
  },
  rossler: {
    name: "Rössler",
    params: { sigma: 0.2, rho: 0.2, beta: 5.7 },
    init: [0.1, 0.1, 0.1],
    step: ([x, y, z], p, dt) => [
      x + dt * (-y - z),
      y + dt * (x + p.sigma * y),
      z + dt * (p.beta + z * (x - p.rho)),
    ],
  },
  aizawa: {
    name: "Aizawa",
    params: { sigma: 0.95, rho: 0.7, beta: 0.6 },
    init: [0.1, 0, 0],
    step: ([x, y, z], p, dt) => {
      const a = p.sigma, b = p.rho, c = p.beta, d = 3.5, e = 0.25, f = 0.1;
      return [
        x + dt * ((z - b) * x - d * y),
        y + dt * (d * x + (z - b) * y),
        z + dt * (c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x),
      ];
    },
  },
  thomas: {
    name: "Thomas",
    params: { sigma: 0.19, rho: 0, beta: 0 },
    init: [0.1, 0, 0],
    step: ([x, y, z], p, _dt) => {
      const b = p.sigma;
      const dt = 0.05;
      return [
        x + dt * (Math.sin(y) - b * x),
        y + dt * (Math.sin(z) - b * y),
        z + dt * (Math.sin(x) - b * z),
      ];
    },
  },
};

const COLORS = [
  [245, 158, 11],
  [139, 92, 246],
  [6, 182, 212],
  [236, 72, 153],
  [16, 185, 129],
];

const TRAIL_LENGTH = 300;
const PARTICLE_COUNT = 4;

function project3D(x: number, y: number, z: number, rotX: number, rotY: number, scale: number, cx: number, cy: number) {
  let rx = x;
  let ry = y * Math.cos(rotX) - z * Math.sin(rotX);
  let rz = y * Math.sin(rotX) + z * Math.cos(rotX);
  let tx = rx * Math.cos(rotY) + rz * Math.sin(rotY);
  let tz = -rx * Math.sin(rotY) + rz * Math.cos(rotY);
  return [cx + tx * scale, cy + ry * scale, tz];
}

export default function StrangeAttractorZoo({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);

  const [type, setType] = useState("lorenz");
  const [params, setParams] = useState<AttractorParams>({ sigma: 10, rho: 28, beta: 8 / 3 });
  const [sensitivity, setSensitivity] = useState(0.0001);
  const [rotX, setRotX] = useState(0.3);
  const [rotY, setRotY] = useState(0.5);

  const trailsRef = useRef<[number, number, number][][]>(
    Array.from({ length: PARTICLE_COUNT }, () => [])
  );
  const positionsRef = useRef<[number, number, number][]>(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => [
      attractors.lorenz.init[0] + i * 0.001,
      attractors.lorenz.init[1] + i * 0.001,
      attractors.lorenz.init[2] + i * 0.001,
    ])
  );
  const typeRef = useRef(type);
  const paramsRef = useRef(params);
  const sensRef = useRef(sensitivity);

  useEffect(() => { typeRef.current = type; }, [type]);
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { sensRef.current = sensitivity; }, [sensitivity]);

  useEffect(() => {
    const keys = Object.keys(attractors);
    if (keys.includes(type)) {
      const cfg = attractors[type];
      setParams(cfg.params);
      trailsRef.current = Array.from({ length: PARTICLE_COUNT }, () => []);
      positionsRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => [
        cfg.init[0] + i * sensRef.current,
        cfg.init[1] + i * sensRef.current,
        cfg.init[2] + i * sensRef.current,
      ]);
    }
  }, [type, sensitivity]);

  const handleReset = useCallback(() => {
    const keys = Object.keys(attractors);
    if (keys.includes(typeRef.current)) {
      const cfg = attractors[typeRef.current];
      trailsRef.current = Array.from({ length: PARTICLE_COUNT }, () => []);
      positionsRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => [
        cfg.init[0] + i * sensRef.current,
        cfg.init[1] + i * sensRef.current,
        cfg.init[2] + i * sensRef.current,
      ]);
    }
  }, []);

  const handleRandomize = useCallback(() => {
    setParams({
      sigma: 0.5 + Math.random() * 20,
      rho: 5 + Math.random() * 40,
      beta: 0.5 + Math.random() * 4,
    });
    handleReset();
  }, [handleReset]);

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

    const dt = 0.008;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const cfg = attractors[typeRef.current];
      if (!cfg) return;

      const p = paramsRef.current;
      const scale = Math.min(w, h) * 0.12;
      const cx = w / 2;
      const cy = h / 2;
      timeRef.current += dt;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const pos = positionsRef.current[i];
        const np = cfg.step(pos, p, dt);
        positionsRef.current[i] = np;

        const trail = trailsRef.current[i];
        trail.push(np);
        if (trail.length > TRAIL_LENGTH) trail.shift();
      }

      ctx.globalAlpha = compact ? 0.05 : 0.04;
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      const rx = rotX + timeRef.current * 0.05;
      const ry = rotY + timeRef.current * 0.03;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const trail = trailsRef.current[i];
        if (trail.length < 2) continue;

        const color = COLORS[i % COLORS.length];
        ctx.beginPath();
        for (let j = 0; j < trail.length; j++) {
          const [x, y, z] = trail[j];
          const [px, py] = project3D(x, y, z, rx, ry, scale, cx, cy);
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const alpha = 0.3 + 0.7 * (i / PARTICLE_COUNT);
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
        ctx.lineWidth = compact ? 0.8 : 1.5;
        ctx.stroke();
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, rotX, rotY]);

  const formulaOverlay = type === "lorenz"
    ? "σ=" + params.sigma.toFixed(1) + " ρ=" + params.rho.toFixed(1) + " β=" + params.beta.toFixed(2)
    : type === "rossler"
    ? "a=" + params.sigma.toFixed(2) + " b=" + params.rho.toFixed(2) + " c=" + params.beta.toFixed(2)
    : type === "aizawa"
    ? "α=" + params.sigma.toFixed(2) + " β=" + params.rho.toFixed(2) + " γ=" + params.beta.toFixed(2)
    : "b=" + params.sigma.toFixed(3);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
          <div className="flex flex-wrap gap-1">
            {Object.entries(attractors).map(([key, a]) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  type === key
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleReset}
              className="px-3 py-1 text-[11px] rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleRandomize}
              className="px-3 py-1 text-[11px] rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Chaos Mode
            </button>
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <span>{formulaOverlay}</span>
            <label className="flex items-center gap-1">
              Sensitivity:
              <input
                type="range"
                min={0.00001}
                max={0.01}
                step={0.00001}
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-20 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              σ:
              <input
                type="range"
                min={0.1}
                max={30}
                step={0.1}
                value={params.sigma}
                onChange={(e) => setParams(p => ({ ...p, sigma: parseFloat(e.target.value) }))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              ρ:
              <input
                type="range"
                min={0.1}
                max={50}
                step={0.1}
                value={params.rho}
                onChange={(e) => setParams(p => ({ ...p, rho: parseFloat(e.target.value) }))}
                className="w-16 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              β:
              <input
                type="range"
                min={0.01}
                max={10}
                step={0.01}
                value={params.beta}
                onChange={(e) => setParams(p => ({ ...p, beta: parseFloat(e.target.value) }))}
                className="w-16 accent-amber-500"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
