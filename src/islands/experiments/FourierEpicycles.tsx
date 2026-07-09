import { useRef, useEffect, useState, useCallback } from "react";

interface Epicycle {
  freq: number;
  radius: number;
  phase: number;
}

function computeDFT(points: { x: number; y: number }[]): Epicycle[] {
  const N = points.length;
  if (N === 0) return [];
  const coeffs: Epicycle[] = [];
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += points[n].x * Math.cos(angle) + points[n].y * Math.sin(angle);
      im += -points[n].x * Math.sin(angle) + points[n].y * Math.cos(angle);
    }
    re /= N;
    im /= N;
    const radius = Math.sqrt(re * re + im * im);
    const phase = Math.atan2(im, re);
    coeffs.push({ freq: k, radius, phase });
  }
  return coeffs.sort((a, b) => b.radius - a.radius);
}

function resamplePoints(
  pts: { x: number; y: number }[],
  target: number
): { x: number; y: number }[] {
  if (pts.length < 2) return [...pts];
  const dist: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    dist.push(dist[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }
  const total = dist[dist.length - 1];
  if (total === 0)
    return Array.from({ length: target }, () => ({ ...pts[0] }));
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < target; i++) {
    const d = (i / (target - 1)) * total;
    let idx = 0;
    while (idx < dist.length - 2 && dist[idx + 1] < d) idx++;
    const t = (d - dist[idx]) / (dist[idx + 1] - dist[idx] || 1);
    result.push({
      x: pts[idx].x + t * (pts[idx + 1].x - pts[idx].x),
      y: pts[idx].y + t * (pts[idx + 1].y - pts[idx].y),
    });
  }
  return result;
}

function computeError(
  original: { x: number; y: number }[],
  coeffs: Epicycle[],
  n: number
): number {
  if (original.length === 0 || coeffs.length === 0 || n === 0) return 0;
  const N = original.length;
  const K = Math.min(n, coeffs.length);
  let totalErr = 0;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * 2 * Math.PI;
    let rx = 0, ry = 0;
    for (let j = 0; j < K; j++) {
      const c = coeffs[j];
      const angle = c.freq * t + c.phase;
      rx += c.radius * Math.cos(angle);
      ry += c.radius * Math.sin(angle);
    }
    const dx = rx - original[i].x;
    const dy = ry - original[i].y;
    totalErr += Math.sqrt(dx * dx + dy * dy);
  }
  return totalErr / N;
}

export default function FourierEpicycles({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [mode, setMode] = useState<"draw" | "epicycles">("draw");
  const [nEpicycles, setNEpicycles] = useState(10);
  const [speed, setSpeed] = useState(1);
  const [showCircles, setShowCircles] = useState(true);
  const [pointCount, setPointCount] = useState(0);
  const [reconError, setReconError] = useState(0);

  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const centeredRef = useRef<{ x: number; y: number }[]>([]);
  const epicyclesRef = useRef<Epicycle[]>([]);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const timeRef = useRef(0);
  const isDrawingRef = useRef(false);
  const modeRef = useRef(mode);
  const nRef = useRef(nEpicycles);
  const speedRef = useRef(speed);
  const showCirclesRef = useRef(showCircles);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { nRef.current = nEpicycles; }, [nEpicycles]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { showCirclesRef.current = showCircles; }, [showCircles]);

  const handleClear = useCallback(() => {
    pointsRef.current = [];
    centeredRef.current = [];
    epicyclesRef.current = [];
    pathRef.current = [];
    timeRef.current = 0;
    setPointCount(0);
    setReconError(0);
    setMode("draw");
  }, []);

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
      h: container.clientHeight || (compact ? 192 : 500),
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

    const dt = 0.02;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const currentMode = modeRef.current;
      const currentN = nRef.current;
      const currentSpeed = speedRef.current;
      const currentShowCircles = showCirclesRef.current;
      const coeffs = epicyclesRef.current;
      const drawPts = pointsRef.current;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      if (currentMode === "draw") {
        if (drawPts.length > 1) {
          ctx.beginPath();
          ctx.moveTo(drawPts[0].x, drawPts[0].y);
          for (let i = 1; i < drawPts.length; i++) {
            ctx.lineTo(drawPts[i].x, drawPts[i].y);
          }
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();

          for (let i = 0; i < drawPts.length; i++) {
            ctx.beginPath();
            ctx.arc(drawPts[i].x, drawPts[i].y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(245,158,11,${0.3 + 0.7 * (i / drawPts.length)})`;
            ctx.fill();
          }
        }
      } else {
        if (coeffs.length > 0) {
          const centered = centeredRef.current;
          if (centered.length > 1) {
            ctx.beginPath();
            ctx.moveTo(cx + centered[0].x, cy + centered[0].y);
            for (let i = 1; i < centered.length; i++) {
              ctx.lineTo(cx + centered[i].x, cy + centered[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }

          timeRef.current += dt * currentSpeed;
          if (timeRef.current > 2 * Math.PI) {
            timeRef.current -= 2 * Math.PI;
            pathRef.current = [];
          }
          const t = timeRef.current;

          const K = Math.min(currentN, coeffs.length);
          let ex = cx;
          let ey = cy;

          for (let i = 0; i < K; i++) {
            const c = coeffs[i];
            const angle = c.freq * t + c.phase;
            const r = c.radius;

            if (currentShowCircles) {
              ctx.beginPath();
              ctx.arc(ex, ey, r, 0, 2 * Math.PI);
              ctx.strokeStyle = `rgba(255,255,255,${0.12 + 0.08 * (1 - i / K)})`;
              ctx.lineWidth = 0.5 + 0.5 * (1 - i / K);
              ctx.stroke();
            }

            const nx = ex + r * Math.cos(angle);
            const ny = ey + r * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(nx, ny);
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 0.8;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(nx, ny, 1.5, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fill();

            ex = nx;
            ey = ny;
          }

          pathRef.current.push({ x: ex, y: ey });

          const path = pathRef.current;
          if (path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.strokeStyle = "rgba(16,185,129,0.8)";
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(ex, ey, 4, 0, 2 * Math.PI);
          ctx.fillStyle = "#10b981";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex, ey, 6, 0, 2 * Math.PI);
          ctx.strokeStyle = "rgba(16,185,129,0.4)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "14px monospace";
          ctx.textAlign = "center";
          ctx.fillText("Draw a shape first", cx, cy);
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || compact) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (modeRef.current !== "draw") return;
      isDrawingRef.current = true;
      const pos = getPos(e);
      pointsRef.current = [pos];
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDrawingRef.current) return;
      const pos = getPos(e);
      pointsRef.current.push(pos);
    };

    const onPointerUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      const pts = pointsRef.current;
      if (pts.length > 2) {
        pts.push({ ...pts[0] });
        const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        const centered = pts.map((p) => ({ x: p.x - mx, y: p.y - my }));
        centeredRef.current = centered;
        const resampled = resamplePoints(centered, 200);
        const coeffs = computeDFT(resampled);
        epicyclesRef.current = coeffs;
        pathRef.current = [];
        timeRef.current = 0;
        setPointCount(resampled.length);
        const err = computeError(resampled, coeffs, nRef.current);
        setReconError(err);
        setMode("epicycles");
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [compact]);

  useEffect(() => {
    if (epicyclesRef.current.length > 0 && centeredRef.current.length > 0) {
      const err = computeError(centeredRef.current, epicyclesRef.current, nEpicycles);
      setReconError(err);
    }
  }, [nEpicycles]);

  const errorText = reconError > 0
    ? `ε=${reconError.toFixed(2)}`
    : "Draw a closed shape";

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />
      {mode === "draw" && !compact && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-bg-secondary/80 backdrop-blur-sm border border-border/40 text-text-secondary text-xs font-mono pointer-events-none">
          Draw a closed shape
        </div>
      )}
      {!compact && (
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
          <button
            onClick={() => setMode((m) => (m === "draw" ? "epicycles" : "draw"))}
            className="px-3 py-1 text-xs rounded-full border transition-all bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
          >
            {mode === "draw" ? "Epicycles →" : "← Draw"}
          </button>
          {mode === "epicycles" && epicyclesRef.current.length > 0 && (
            <>
              <button
                onClick={() => setShowCircles((v) => !v)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  showCircles
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {showCircles ? "Hide Circles" : "Show Circles"}
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-xs rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-red-500/30 transition-all"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
      {!compact && mode === "epicycles" && epicyclesRef.current.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <span>{errorText}</span>
            <span className="text-text-secondary/50">N={nEpicycles}/{pointCount}</span>
            <label className="flex items-center gap-1">
              N:
              <input
                type="range"
                min={1}
                max={100}
                value={nEpicycles}
                onChange={(e) => setNEpicycles(parseInt(e.target.value))}
                className="w-20 accent-amber-500"
              />
            </label>
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
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
