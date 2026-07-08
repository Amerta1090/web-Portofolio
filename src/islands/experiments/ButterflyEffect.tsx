import { useRef, useEffect, useState, useCallback } from "react";

const TRAIL_LENGTH = 500;
const NUM_PATHS = 6;

type SystemType = "lorenz" | "rossler";

function lorenzStep(p: [number, number, number], sigma: number, rho: number, beta: number, dt: number): [number, number, number] {
  return [
    p[0] + dt * sigma * (p[1] - p[0]),
    p[1] + dt * (p[0] * (rho - p[2]) - p[1]),
    p[2] + dt * (p[0] * p[1] - beta * p[2]),
  ];
}

function rosslerStep(p: [number, number, number], a: number, b: number, c: number, dt: number): [number, number, number] {
  return [
    p[0] + dt * (-p[1] - p[2]),
    p[1] + dt * (p[0] + a * p[1]),
    p[2] + dt * (b + p[2] * (p[0] - c)),
  ];
}

const PATH_COLORS = [
  [245, 158, 11],
  [139, 92, 246],
  [6, 182, 212],
  [236, 72, 153],
  [16, 185, 129],
  [251, 191, 36],
];

function computeLyapunovApprox(trails: [number, number, number][][]): number {
  if (trails.length < 2) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 1; i < trails.length; i++) {
    for (let j = 0; j < Math.min(trails[0].length, trails[i].length); j++) {
      const dx = trails[0][j][0] - trails[i][j][0];
      const dy = trails[0][j][1] - trails[i][j][1];
      const dz = trails[0][j][2] - trails[i][j][2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 1e-10) {
        sum += Math.log(dist);
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

function project3D(x: number, y: number, z: number, rotX: number, rotY: number, scale: number, cx: number, cy: number): [number, number] {
  let rx = x;
  let ry = y * Math.cos(rotX) - z * Math.sin(rotX);
  let rz = y * Math.sin(rotX) + z * Math.cos(rotX);
  let tx = rx * Math.cos(rotY) + rz * Math.sin(rotY);
  let ty = ry;
  return [cx + tx * scale, cy + ty * scale];
}

export default function ButterflyEffect({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);

  const [system, setSystem] = useState<SystemType>("lorenz");
  const [sigma, setSigma] = useState(10);
  const [rho, setRho] = useState(28);
  const [beta, setBeta] = useState(8 / 3);
  const [spread, setSpread] = useState(0.001);
  const [dragging, setDragging] = useState(false);
  const [lyapunov, setLyapunov] = useState(0);

  const trailsRef = useRef<[number, number, number][][]>(
    Array.from({ length: NUM_PATHS }, () => [])
  );
  const positionsRef = useRef<[number, number, number][]>(
    Array.from({ length: NUM_PATHS }, (_, i) => [0.1 + i * 0.001, 0.1 + i * 0.001, 0.1 + i * 0.001])
  );

  const systemRef = useRef(system);
  const sigmaRef = useRef(sigma);
  const rhoRef = useRef(rho);
  const betaRef = useRef(beta);
  const spreadRef = useRef(spread);

  useEffect(() => { systemRef.current = system; }, [system]);
  useEffect(() => { sigmaRef.current = sigma; }, [sigma]);
  useEffect(() => { rhoRef.current = rho; }, [rho]);
  useEffect(() => { betaRef.current = beta; }, [beta]);
  useEffect(() => { spreadRef.current = spread; }, [spread]);

  const initPositions = useCallback(() => {
    const base = systemRef.current === "lorenz" ? [0.1, 0.1, 0.1] : [0.1, 0.1, 0.1];
    positionsRef.current = Array.from({ length: NUM_PATHS }, (_, i) => [
      base[0] + (i * spreadRef.current),
      base[1] + (i * spreadRef.current),
      base[2] + (i * spreadRef.current),
    ]);
    trailsRef.current = Array.from({ length: NUM_PATHS }, () => []);
  }, []);

  useEffect(() => {
    initPositions();
  }, [system, spread, initPositions]);

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

    const dt = 0.006;
    let lyapCount = 0;
    let lyapSum = 0;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const scale = Math.min(w, h) * 0.1;
      const cx = w / 2;
      const cy = h / 2;
      const rx = 0.4 + timeRef.current * 0.03;
      const ry = 0.6 + timeRef.current * 0.02;

      timeRef.current += dt;

      const isLorenz = systemRef.current === "lorenz";
      const s = sigmaRef.current;
      const ro = rhoRef.current;
      const be = betaRef.current;

      for (let i = 0; i < NUM_PATHS; i++) {
        const pos = positionsRef.current[i];
        const np = isLorenz
          ? lorenzStep(pos, s, ro, be, dt)
          : rosslerStep(pos, s, ro < 10 ? 0.2 : 0.2, be > 6 ? 5.7 : 5.7, dt);
        positionsRef.current[i] = np;
        const trail = trailsRef.current[i];
        trail.push(np);
        if (trail.length > TRAIL_LENGTH) trail.shift();
      }

      lyapSum += computeLyapunovApprox(trailsRef.current);
      lyapCount++;
      if (lyapCount % 20 === 0) {
        setLyapunov(lyapSum / lyapCount);
      }

      ctx.globalAlpha = compact ? 0.05 : 0.03;
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      for (let i = 0; i < NUM_PATHS; i++) {
        const trail = trailsRef.current[i];
        if (trail.length < 2) continue;
        const color = PATH_COLORS[i % PATH_COLORS.length];
        ctx.beginPath();
        for (let j = 0; j < trail.length; j++) {
          const [x, y, z] = trail[j];
          const [px, py] = project3D(x, y, z, rx, ry, scale, cx, cy);
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const alpha = 0.3 + 0.5 * (i / NUM_PATHS);
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
        ctx.lineWidth = compact ? 0.8 : 1.2;
        ctx.stroke();
      }

      if (!compact) {
        const legendX = w - 110;
        const legendY = 10;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(legendX, legendY, 100, NUM_PATHS * 14 + 6);
        ctx.font = "8px monospace";
        for (let i = 0; i < NUM_PATHS; i++) {
          const c = PATH_COLORS[i % PATH_COLORS.length];
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.6)`;
          ctx.fillRect(legendX + 4, legendY + 4 + i * 14, 8, 8);
          ctx.fillText(`±${(i * spreadRef.current).toFixed(5)}`, legendX + 16, legendY + 11 + i * 14);
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

  const handleRandomize = useCallback(() => {
    setSigma(1 + Math.random() * 20);
    setRho(5 + Math.random() * 40);
    setBeta(0.5 + Math.random() * 4);
    initPositions();
  }, [initPositions]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (compact) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 30 - 15;
    const ny = ((e.clientY - rect.top) / rect.height) * 30 - 15;
    positionsRef.current = Array.from({ length: NUM_PATHS }, (_, i) => [
      nx + Math.random() * 0.01,
      ny + Math.random() * 0.01,
      Math.random() * 10,
    ]);
    trailsRef.current = Array.from({ length: NUM_PATHS }, () => []);
  }, [compact]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
      />
      {!compact && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <button
              onClick={() => setSystem(s => s === "lorenz" ? "rossler" : "lorenz")}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                system === "lorenz"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold"
                  : "bg-purple-500/20 border-purple-500/50 text-purple-400 font-bold"
              }`}
            >
              {system === "lorenz" ? "Lorenz" : "Rössler"}
            </button>
            <span className="text-amber-400">λ ≈ {lyapunov.toFixed(3)}</span>
            <label className="flex items-center gap-1">
              Spread:
              <input
                type="range"
                min={0.0001}
                max={0.05}
                step={0.0001}
                value={spread}
                onChange={(e) => setSpread(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1">
              σ:
              <input
                type="range"
                min={1}
                max={30}
                step={0.1}
                value={sigma}
                onChange={(e) => setSigma(parseFloat(e.target.value))}
                className="w-20 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              ρ:
              <input
                type="range"
                min={5}
                max={50}
                step={0.1}
                value={rho}
                onChange={(e) => setRho(parseFloat(e.target.value))}
                className="w-20 accent-amber-500"
              />
            </label>
            <label className="flex items-center gap-1">
              β:
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.01}
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-20 accent-amber-500"
              />
            </label>
            <button
              onClick={initPositions}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleRandomize}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Chaos
            </button>
          </div>
          <div className="mt-1 text-[10px] text-text-secondary/40 font-mono">
            Click canvas to set new initial conditions
          </div>
        </div>
      )}
    </div>
  );
}
