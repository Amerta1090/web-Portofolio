import { useRef, useState, useEffect, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

const MAX_POINTS = 10;

const PRESETS: Record<string, Point[]> = {
  'S-Curve': [
    { x: 100, y: 350 },
    { x: 200, y: 100 },
    { x: 400, y: 400 },
    { x: 550, y: 150 },
  ],
  Loop: [
    { x: 300, y: 100 },
    { x: 500, y: 200 },
    { x: 450, y: 400 },
    { x: 250, y: 450 },
    { x: 100, y: 300 },
    { x: 200, y: 150 },
  ],
  Star: (() => {
    const pts: Point[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
      const outerR = 180;
      const cx = 350, cy = 280;
      pts.push({ x: cx + outerR * Math.cos(a), y: cy - outerR * Math.sin(a) });
      const innerA = a + Math.PI / 5;
      const innerR = 80;
      pts.push({ x: cx + innerR * Math.cos(innerA), y: cy - innerR * Math.sin(innerA) });
    }
    return pts;
  })(),
  Spiral: (() => {
    const pts: Point[] = [];
    const cx = 350, cy = 280;
    for (let i = 0; i < 8; i++) {
      const a = (i * 2 * Math.PI) / 6;
      const r = 40 + i * 30;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    return pts;
  })(),
};

type CurveType = 'bezier' | 'bspline' | 'catmull-rom';

const LEVEL_COLORS = [
  'rgba(245,158,11,0.6)',
  'rgba(96,165,250,0.5)',
  'rgba(52,211,153,0.5)',
  'rgba(248,113,113,0.5)',
  'rgba(167,139,250,0.5)',
  'rgba(251,146,60,0.4)',
  'rgba(156,163,175,0.4)',
];

const BERNSTEIN_COLORS = [
  '#f59e0b', '#60a5fa', '#34d399', '#f87171', '#a78bfa',
  '#fb923c', '#94a3b8', '#fbbf24', '#818cf8', '#2dd4bf',
];

function deCasteljau(points: Point[], t: number): Point[][] {
  const levels: Point[][] = [points];
  let current = points;
  while (current.length > 1) {
    const next: Point[] = [];
    for (let i = 0; i < current.length - 1; i++) {
      next.push({
        x: (1 - t) * current[i].x + t * current[i + 1].x,
        y: (1 - t) * current[i].y + t * current[i + 1].y,
      });
    }
    levels.push(next);
    current = next;
  }
  return levels;
}

function binomial(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  for (let i = 0; i < k; i++) {
    res = res * (n - i) / (i + 1);
  }
  return res;
}

function bernsteinBasis(n: number, i: number, t: number): number {
  return binomial(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
}

function computeBezierPoints(points: Point[], steps: number): Point[] {
  const result: Point[] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const levels = deCasteljau(points, t);
    result.push(levels[levels.length - 1][0]);
  }
  return result;
}

function computeUniformBSpline(points: Point[], steps: number): Point[] {
  if (points.length < 4) return computeBezierPoints(points, steps);
  const result: Point[] = [];
  const n = points.length;
  const numSegments = n - 3;
  for (let seg = 0; seg < numSegments; seg++) {
    const p0 = points[seg];
    const p1 = points[seg + 1];
    const p2 = points[seg + 2];
    const p3 = points[seg + 3];
    const segSteps = Math.ceil(steps / numSegments);
    for (let s = 0; s < segSteps; s++) {
      const t = s / segSteps;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        ((-t3 + 3 * t2 - 3 * t + 1) * p0.x +
          (3 * t3 - 6 * t2 + 4) * p1.x +
          (-3 * t3 + 3 * t2 + 3 * t + 0) * p2.x +
          t3 * p3.x) /
        6;
      const y =
        ((-t3 + 3 * t2 - 3 * t + 1) * p0.y +
          (3 * t3 - 6 * t2 + 4) * p1.y +
          (-3 * t3 + 3 * t2 + 3 * t + 0) * p2.y +
          t3 * p3.y) /
        6;
      result.push({ x, y });
    }
  }
  return result;
}

function computeCatmullRom(points: Point[], steps: number): Point[] {
  if (points.length < 2) return points.slice();
  const result: Point[] = [];
  const n = points.length;
  const numSegments = n - 1;
  for (let seg = 0; seg < numSegments; seg++) {
    const p0 = points[Math.max(0, seg - 1)];
    const p1 = points[seg];
    const p2 = points[Math.min(n - 1, seg + 1)];
    const p3 = points[Math.min(n - 1, seg + 2)];
    const segSteps = Math.ceil(steps / numSegments);
    for (let s = 0; s < segSteps; s++) {
      const t = s / segSteps;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        ((-t3 + 2 * t2 - t) * p0.x +
          (3 * t3 - 5 * t2 + 2) * p1.x +
          (-3 * t3 + 4 * t2 + t) * p2.x +
          (t3 - t2) * p3.x);
      const y =
        0.5 *
        ((-t3 + 2 * t2 - t) * p0.y +
          (3 * t3 - 5 * t2 + 2) * p1.y +
          (-3 * t3 + 4 * t2 + t) * p2.y +
          (t3 - t2) * p3.y);
      result.push({ x, y });
    }
  }
  return result;
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawBernsteinChart(
  ctx: CanvasRenderingContext2D,
  n: number,
  chartX: number,
  chartY: number,
  chartW: number,
  chartH: number,
) {
  ctx.fillStyle = 'rgba(15,15,17,0.85)';
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  const r = 8;
  ctx.beginPath();
  ctx.roundRect(chartX, chartY, chartW, chartH, r);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '10px monospace';
  ctx.fillText('Bernstein Basis', chartX + 8, chartY + 14);

  const pad = 20;
  const gx = chartX + pad;
  const gy = chartY + 24;
  const gw = chartW - pad * 2;
  const gh = chartH - 38;

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(gx, gy + gh);
  ctx.lineTo(gx + gw, gy + gh);
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx, gy + gh);
  ctx.stroke();

  const steps = 80;
  for (let i = 0; i <= n; i++) {
    ctx.strokeStyle = BERNSTEIN_COLORS[i % BERNSTEIN_COLORS.length];
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const val = bernsteinBasis(n, i, t);
      const px = gx + t * gw;
      const py = gy + gh - val * gh;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export default function BezierPlayground({ compact }: { compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [showConstruction, setShowConstruction] = useState(false);
  const [curveType, setCurveType] = useState<CurveType>('bezier');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [animT, setAnimT] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const animRef = useRef<number>(0);
  const animStartRef = useRef(0);
  const pointsRef = useRef<Point[]>([]);
  pointsRef.current = points;

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = compact ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = compact ? 192 : rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);

    const pts = compact
      ? [
          { x: w * 0.15, y: h * 0.7 },
          { x: w * 0.35, y: h * 0.15 },
          { x: w * 0.65, y: h * 0.85 },
          { x: w * 0.85, y: h * 0.25 },
        ]
      : pointsRef.current;

    if (pts.length < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Click to add control points', w / 2, h / 2);
      return;
    }

    const degree = pts.length - 1;
    const steps = 200;

    let curvePoints: Point[];
    if (compact || curveType === 'bezier') {
      curvePoints = computeBezierPoints(pts, steps);
    } else if (curveType === 'bspline') {
      curvePoints = computeUniformBSpline(pts, steps);
    } else {
      curvePoints = computeCatmullRom(pts, steps);
    }

    const t = compact ? 0.5 : animT;

    if (!compact && showConstruction && pts.length >= 2 && curveType === 'bezier') {
      const levels = deCasteljau(pts, t);
      for (let l = 1; l < levels.length; l++) {
        const level = levels[l];
        const prev = levels[l - 1];
        ctx.strokeStyle = LEVEL_COLORS[(l - 1) % LEVEL_COLORS.length];
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < level.length; i++) {
          ctx.moveTo(prev[i].x, prev[i].y);
          ctx.lineTo(prev[i + 1].x, prev[i + 1].y);
        }
        ctx.stroke();

        ctx.fillStyle = LEVEL_COLORS[(l - 1) % LEVEL_COLORS.length];
        for (const p of level) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const final = levels[levels.length - 1][0];
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(final.x, final.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < curvePoints.length; i++) {
      if (i === 0) ctx.moveTo(curvePoints[i].x, curvePoints[i].y);
      else ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (!compact) {
      for (let i = 0; i < pts.length; i++) {
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), pts[i].x, pts[i].y);
      }

      if (pts.length >= 2) {
        drawBernsteinChart(ctx, degree, w - 216, h - 136, 200, 120);
      }
    }
  }, [compact, showConstruction, curveType, animT]);

  useEffect(() => {
    if (compact) {
      drawFrame();
      return;
    }
    let running = true;
    const loop = () => {
      if (!running) return;
      drawFrame();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [compact, drawFrame]);

  useEffect(() => {
    if (!isAnimating || compact || curveType !== 'bezier' || points.length < 2) return;
    animStartRef.current = performance.now();
    let running = true;
    const animate = (now: number) => {
      if (!running) return;
      const elapsed = now - animStartRef.current;
      const duration = 2500;
      const progress = (elapsed % (duration * 2)) / duration;
      const t = progress <= 1 ? progress : 2 - progress;
      setAnimT(t);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [isAnimating, compact, curveType, points.length]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (compact) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (let i = 0; i < pointsRef.current.length; i++) {
        const p = pointsRef.current[i];
        const dx = p.x - x;
        const dy = p.y - y;
        if (dx * dx + dy * dy < 144) {
          setDragIdx(i);
          canvas.setPointerCapture(e.pointerId);
          return;
        }
      }

      if (pointsRef.current.length < MAX_POINTS) {
        setPoints((prev) => [...prev, { x, y }]);
      }
    },
    [compact],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (compact || dragIdx === null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPoints((prev) => {
        const next = [...prev];
        next[dragIdx] = { x, y };
        return next;
      });
    },
    [compact, dragIdx],
  );

  const handlePointerUp = useCallback(() => {
    setDragIdx(null);
  }, []);

  const loadPreset = useCallback((name: string) => {
    const preset = PRESETS[name];
    if (preset) setPoints(preset.map((p) => ({ ...p })));
  }, []);

  const clearAll = useCallback(() => {
    setPoints([]);
    setAnimT(0);
    setIsAnimating(false);
  }, []);

  const degree = Math.max(0, points.length - 1);

  if (compact) {
    return (
      <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
        <div className="bg-[#1a1a1f]/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-mono text-white/70 border border-white/10">
          {points.length} points, Degree {degree}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => {
              setShowConstruction((v) => !v);
              setIsAnimating(!showConstruction ? false : isAnimating);
            }}
            className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
              showConstruction
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            Construction {showConstruction ? 'ON' : 'OFF'}
          </button>

          {showConstruction && (
            <button
              onClick={() => setIsAnimating((v) => !v)}
              className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
                isAnimating
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {isAnimating ? 'Pause' : 'Animate t'}
            </button>
          )}
        </div>

        <div className="flex gap-1">
          {(['bezier', 'bspline', 'catmull-rom'] as CurveType[]).map((type) => (
            <button
              key={type}
              onClick={() => setCurveType(type)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                curveType === type
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              }`}
            >
              {type === 'bezier' ? 'Bézier' : type === 'bspline' ? 'B-Spline' : 'Catmull-Rom'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => loadPreset(name)}
              className="px-2 py-1 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70 transition-all"
            >
              {name}
            </button>
          ))}
        </div>

        <button
          onClick={clearAll}
          className="px-2.5 py-1 rounded text-xs font-mono bg-white/5 border border-white/10 text-red-400/70 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
        >
          Clear
        </button>

        <div className="text-[10px] font-mono text-white/30 mt-1">
          Click to add points, drag to move
        </div>
      </div>
    </div>
  );
}
