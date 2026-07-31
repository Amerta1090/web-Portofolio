import { useRef, useEffect, useState, useCallback } from "react";

const PLANET_COLORS = [
  [245, 158, 11],
  [139, 92, 246],
  [6, 182, 212],
  [236, 72, 153],
  [16, 185, 129],
  [251, 191, 36],
  [99, 102, 241],
  [244, 63, 94],
];

interface PlanetData {
  name: string;
  a: number;
  T: number;
  color: number[];
}

const SOLAR_DATA: PlanetData[] = [
  { name: "Mercury", a: 0.387, T: 0.241, color: [185, 175, 160] },
  { name: "Venus", a: 0.723, T: 0.615, color: [232, 195, 130] },
  { name: "Earth", a: 1.0, T: 1.0, color: [75, 180, 240] },
  { name: "Mars", a: 1.524, T: 1.881, color: [220, 100, 70] },
  { name: "Jupiter", a: 5.203, T: 11.862, color: [210, 170, 120] },
  { name: "Saturn", a: 9.537, T: 29.457, color: [200, 185, 130] },
  { name: "Uranus", a: 19.191, T: 84.011, color: [150, 210, 220] },
  { name: "Neptune", a: 30.069, T: 164.8, color: [80, 120, 220] },
];

function computeKepler(a: number, e: number, theta: number): [number, number] {
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e;
  const x = a * Math.cos(theta) - c;
  const y = b * Math.sin(theta);
  return [x, y];
}

function approximateE(a: number, e: number, M: number, tol = 1e-10): number {
  let E = M;
  for (let i = 0; i < 100; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

function animateValue(
  start: number,
  end: number,
  duration: number,
  onUpdate: (v: number) => void,
) {
  const t0 = performance.now();
  const tick = (now: number) => {
    const t = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    onUpdate(start + (end - start) * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function KeplersLaws({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const thetaRef = useRef(0);
  const lawRef = useRef<1 | 2 | 3>(1);

  const [selectedLaw, setSelectedLaw] = useState<1 | 2 | 3>(1);
  const [eccentricity, setEccentricity] = useState(0.5);
  const [semiMajorAxis, setSemiMajorAxis] = useState(2);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [orbits, setOrbits] = useState(0);
  const [sweepAreas, setSweepAreas] = useState<{ x: number; y: number }[]>([]);
  const [sweepCount, setSweepCount] = useState(0);

  const eccRef = useRef(eccentricity);
  const aRef = useRef(semiMajorAxis);
  const speedRef = useRef(speed);
  const pausedRef = useRef(paused);
  const sweepCountRef = useRef(0);
  const sweepAreasRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => { eccRef.current = eccentricity; }, [eccentricity]);
  useEffect(() => { aRef.current = semiMajorAxis; }, [semiMajorAxis]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => { lawRef.current = selectedLaw; }, [selectedLaw]);

  const resetOrbit = useCallback(() => {
    thetaRef.current = 0;
    setOrbits(0);
    setSweepAreas([]);
    setSweepCount(0);
    sweepCountRef.current = 0;
    sweepAreasRef.current = [];
  }, []);

  useEffect(() => {
    resetOrbit();
  }, [selectedLaw, eccentricity, semiMajorAxis, resetOrbit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;
    thetaRef.current = 0;

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

    let lastSweepTheta = 0;
    let accTime = 0;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const dt = 0.016 * speedRef.current;
      const cx = w / 2;
      const cy = h / 2 + (compact ? 0 : 10);
      const scale = Math.min(w, h) * 0.28;
      const law = lawRef.current;
      const e = eccRef.current;
      const a = aRef.current;

      if (law === 1 || law === 2) {
        if (!pausedRef.current) {
          accTime += dt;
          if (accTime >= 0.008) {
            thetaRef.current += accTime * 0.4;
            accTime = 0;
          }
          if (thetaRef.current > Math.PI * 2) {
            thetaRef.current -= Math.PI * 2;
            setOrbits((o) => o + 1);
          }

          if (law === 2) {
            const step = 0.12;
            if (thetaRef.current - lastSweepTheta >= step) {
              lastSweepTheta = thetaRef.current;
              sweepCountRef.current++;
              const [px, py] = computeKepler(a, e, thetaRef.current);
              const newSweeps = [...sweepAreasRef.current, { x: px * scale, y: py * scale }];
              if (newSweeps.length > 60) newSweeps.shift();
              sweepAreasRef.current = newSweeps;
              setSweepAreas(newSweeps);
              setSweepCount(sweepCountRef.current);
            }
          }
        }

        ctx.fillStyle = "#0f0f11";
        ctx.fillRect(0, 0, w, h);

        const b = a * Math.sqrt(1 - e * e);
        const focalDist = a * e;

        ctx.strokeStyle = "rgba(245,158,11,0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(cx - focalDist * scale, cy, a * scale, b * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        const [px, py] = computeKepler(a, e, thetaRef.current);

        if (law === 2 && sweepAreasRef.current.length > 0) {
          const pts = sweepAreasRef.current;
          for (let i = 0; i < pts.length; i++) {
            const alpha = 0.15 + 0.25 * (i / pts.length);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(pts[i].x + cx, pts[i].y + cy);
            const nextIdx = (i + 1) % pts.length;
            ctx.lineTo(pts[nextIdx].x + cx, pts[nextIdx].y + cy);
            ctx.closePath();
            ctx.fillStyle = `rgba(245,158,11,${alpha})`;
            ctx.fill();
          }

          for (let i = 0; i < pts.length; i++) {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(pts[i].x + cx, pts[i].y + cy);
            ctx.strokeStyle = `rgba(245,158,11,0.3)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px * scale + cx, py * scale + cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#22d3ee";
        ctx.fill();

        if (!compact) {
          ctx.fillStyle = "rgba(245,158,11,0.5)";
          ctx.font = "9px monospace";
          ctx.fillText("★ Sun (focus)", cx + 12, cy + 4);

          ctx.fillStyle = "rgba(34,211,238,0.6)";
          ctx.fillText("● Planet", px * scale + cx + 10, py * scale + cy + 4);

          ctx.fillStyle = "#9ca3af";
          ctx.font = "8px monospace";
          ctx.fillText(`e = ${e.toFixed(3)}`, 10, h - 10);
          ctx.fillText(`Orbits: ${orbits}`, 10, h - 22);
          ctx.fillText(`a = ${a.toFixed(2)} AU`, 10, h - 34);

          if (law === 2) {
            ctx.fillStyle = "rgba(245,158,11,0.6)";
            ctx.fillText(`Sectors: ${sweepCount}`, w - 110, h - 10);
            ctx.fillText("Equal areas in equal time", w - 150, h - 22);
          }

          if (e > 0) {
            const f1x = cx - focalDist * scale;
            ctx.strokeStyle = "rgba(239,68,68,0.3)";
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(f1x, cy);
            ctx.lineTo(px * scale + cx, py * scale + cy);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        if (compact) {
          ctx.fillStyle = "rgba(245,158,11,0.4)";
          ctx.font = "7px monospace";
          ctx.fillText(`Kepler's Law ${law}`, 4, 10);
        }
      } else if (law === 3) {
        ctx.fillStyle = "#0f0f11";
        ctx.fillRect(0, 0, w, h);

        const margin = { top: compact ? 10 : 40, right: compact ? 10 : 30, bottom: compact ? 10 : 50, left: compact ? 10 : 50 };
        const chartW = w - margin.left - margin.right;
        const chartH = h - margin.top - margin.bottom;

        const maxA = 35;
        const maxT2 = 30000;

        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 0.5;
        for (let t = 0; t <= 4; t++) {
          const y = margin.top + (chartH * t) / 4;
          ctx.beginPath();
          ctx.moveTo(margin.left, y);
          ctx.lineTo(margin.left + chartW, y);
          ctx.stroke();
        }
        for (let t = 0; t <= 4; t++) {
          const x = margin.left + (chartW * t) / 4;
          ctx.beginPath();
          ctx.moveTo(x, margin.top);
          ctx.lineTo(x, margin.top + chartH);
          ctx.stroke();
        }

        const visible = SOLAR_DATA.filter((p) => p.a <= maxA);
        for (const p of visible) {
          const x = margin.left + (p.a / maxA) * chartW;
          const yVal = (p.T * p.T) / maxT2;
          const y = margin.top + chartH - yVal * chartH;
          const r = Math.max(3, 6 - p.a * 0.15);

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.8)`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.3)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        const kConstant = (1 * 1) / (1 * 1 * 1);
        ctx.strokeStyle = "rgba(245,158,11,0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top + chartH);
        for (let i = 0; i <= 100; i++) {
          const aVal = (i / 100) * maxA;
          const t2Val = kConstant * aVal * aVal * aVal;
          const x = margin.left + (aVal / maxA) * chartW;
          const y = margin.top + chartH - (t2Val / maxT2) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        const keplerRatio = (SOLAR_DATA[2].T * SOLAR_DATA[2].T) / (SOLAR_DATA[2].a * SOLAR_DATA[2].a * SOLAR_DATA[2].a);

        if (!compact) {
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 11px monospace";
          ctx.fillText("KEPLER'S THIRD LAW", margin.left, 18);

          ctx.fillStyle = "#9ca3af";
          ctx.font = "9px monospace";
          ctx.fillText("T² vs a³ — P² ∝ a³", margin.left, 32);

          ctx.fillStyle = "#6b7280";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText("Semi-major axis a (AU) →", margin.left + chartW / 2, h - 10);

          ctx.save();
          ctx.translate(12, margin.top + chartH / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText("Period² T² (years²) →", 0, 0);
          ctx.restore();

          ctx.textAlign = "right";
          ctx.fillStyle = "rgba(245,158,11,0.7)";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`k = T²/a³ = ${keplerRatio.toFixed(4)}`, w - margin.right, margin.top + 14);

          let constSum = 0;
          let constCount = 0;
          for (const p of SOLAR_DATA) {
            const k = (p.T * p.T) / (p.a * p.a * p.a);
            constSum += k;
            constCount++;
          }
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "8px monospace";
          ctx.fillText(`mean k = ${(constSum / constCount).toFixed(4)}  ±  ${Math.abs(constSum / constCount - 1).toFixed(4)}`, w - margin.right, margin.top + 28);

          let legendY = margin.top + 50;
          for (const p of visible) {
            const k = (p.T * p.T) / (p.a * p.a * p.a);
            ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0.8)`;
            ctx.fillRect(w - margin.right - 130, legendY, 6, 6);
            ctx.fillStyle = "#d1d5db";
            ctx.font = "7px monospace";
            ctx.textAlign = "left";
            ctx.fillText(`${p.name.padEnd(8)} a=${p.a.toFixed(3)}  T²=${(p.T * p.T).toFixed(2)}  k=${k.toFixed(4)}`, w - margin.right - 120, legendY + 6);
            legendY += 14;
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
  }, [compact, selectedLaw, eccentricity, semiMajorAxis, orbits, sweepCount, sweepAreas]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <button
              onClick={() => { setSelectedLaw(1); resetOrbit(); }}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                selectedLaw === 1
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Law 1
            </button>
            <button
              onClick={() => { setSelectedLaw(2); resetOrbit(); }}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                selectedLaw === 2
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Law 2
            </button>
            <button
              onClick={() => { setSelectedLaw(3); resetOrbit(); }}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                selectedLaw === 3
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Law 3
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                paused
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              onClick={resetOrbit}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            {selectedLaw !== 3 && (
              <>
                <label className="flex items-center gap-1">
                  Eccentricity e:
                  <input
                    type="range"
                    min={0}
                    max={0.9}
                    step={0.01}
                    value={eccentricity}
                    onChange={(e) => setEccentricity(parseFloat(e.target.value))}
                    className="w-16 accent-amber-500"
                  />
                  <span className="text-amber-400 w-8 text-[10px]">{eccentricity.toFixed(2)}</span>
                </label>
                <label className="flex items-center gap-1">
                  Semi-major a:
                  <input
                    type="range"
                    min={0.5}
                    max={4}
                    step={0.1}
                    value={semiMajorAxis}
                    onChange={(e) => setSemiMajorAxis(parseFloat(e.target.value))}
                    className="w-16 accent-amber-500"
                  />
                  <span className="text-amber-400 w-6 text-[10px]">{semiMajorAxis.toFixed(1)}</span>
                </label>
              </>
            )}
            <label className="flex items-center gap-1">
              Speed:
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="text-amber-400 w-6 text-[10px]">{speed.toFixed(1)}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
