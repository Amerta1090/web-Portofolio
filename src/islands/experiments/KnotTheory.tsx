import { useRef, useEffect, useState, useCallback } from "react";

type KnotPreset = "trefoil" | "figure-eight" | "cinquefoil" | "hopf" | "unknot";
type ReidemeisterMove = "I" | "II" | "III";
type ViewMode = "2d" | "3d";

interface KnotDef {
  id: KnotPreset;
  label: string;
  crossingNum: number;
  writhe: number;
  tricolorable: boolean;
  jones: string;
  param: (t: number) => [number, number, number];
}

const ZOOM = 3.2;
const SAMPLES = 500;
const BG = "#0f0f11";

const KNOTS: KnotDef[] = [
  {
    id: "trefoil",
    label: "Trefoil (3\u2081)",
    crossingNum: 3,
    writhe: 3,
    tricolorable: true,
    jones: "t\u207B\u00B9 + t\u207B\u00B3 \u2212 t\u207B\u2074",
    param: (t) => [
      Math.sin(t) + 2 * Math.sin(2 * t),
      Math.cos(t) - 2 * Math.cos(2 * t),
      -Math.sin(3 * t),
    ],
  },
  {
    id: "figure-eight",
    label: "Figure-Eight (4\u2081)",
    crossingNum: 4,
    writhe: 0,
    tricolorable: true,
    jones: "t\u207B\u00B2 \u2212 t\u207B\u00B9 + 1 \u2212 t + t\u00B2",
    param: (t) => [
      (2 + Math.cos(2 * t)) * Math.cos(3 * t),
      (2 + Math.cos(2 * t)) * Math.sin(3 * t),
      Math.sin(4 * t),
    ],
  },
  {
    id: "cinquefoil",
    label: "Cinquefoil (5\u2081)",
    crossingNum: 5,
    writhe: 5,
    tricolorable: true,
    jones: "t\u207B\u00B2 + t\u207B\u2074 \u2212 t\u207B\u2075 + t\u207B\u2076 \u2212 t\u207B\u2077",
    param: (t) => [
      Math.sin(2 * t) + 2 * Math.sin(3 * t),
      Math.cos(2 * t) + 2 * Math.cos(3 * t),
      -Math.sin(5 * t),
    ],
  },
  {
    id: "hopf",
    label: "Hopf Link",
    crossingNum: 2,
    writhe: 2,
    tricolorable: false,
    jones: "\u2212t\u207B\u00B9\u00B2 \u2212 t\u00B9\u00B2",
    param: (t) => {
      const r1 = 1.5;
      const r2 = 0.6;
      const cx2 = r1 * Math.cos(t);
      const cy2 = r1 * Math.sin(t);
      return [
        cx2 + r2 * Math.cos(2 * t),
        cy2 + r2 * Math.sin(2 * t),
        r2 * Math.sin(2 * t) * 0.6,
      ];
    },
  },
  {
    id: "unknot",
    label: "Unknot (0\u2081)",
    crossingNum: 0,
    writhe: 0,
    tricolorable: false,
    jones: "1",
    param: (t) => [2 * Math.cos(t), 2 * Math.sin(t), 0],
  },
];

function project(x: number, y: number, z: number, zoom: number): [number, number] {
  const d = 1 + z / zoom;
  return [x / (d || 0.01), y / (d || 0.01)];
}

interface Pt3D {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
}

function sampleKnot(knot: KnotDef, n: number, rotY = 0): Pt3D[] {
  const pts: Pt3D[] = [];
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI;
    const [px, py, pz] = knot.param(t);
    const rx = px * cosR + pz * sinR;
    const rz = -px * sinR + pz * cosR;
    const [sx, sy] = project(rx, py, rz, ZOOM);
    pts.push({ x: rx, y: py, z: rz, sx, sy });
  }
  return pts;
}

interface Crossing {
  segA: number;
  segB: number;
  sx: number;
  sy: number;
  overSeg: number;
  underSeg: number;
  sign: number;
}

function findCrossings(pts: Pt3D[]): Crossing[] {
  const crossings: Crossing[] = [];
  const step = 4;
  for (let i = 0; i < pts.length - step; i += step) {
    for (let j = i + step * 4; j < pts.length - step; j += step) {
      const a1 = pts[i];
      const a2 = pts[Math.min(i + step, pts.length - 1)];
      const b1 = pts[j];
      const b2 = pts[Math.min(j + step, pts.length - 1)];

      const dax = a2.sx - a1.sx;
      const day = a2.sy - a1.sy;
      const dbx = b2.sx - b1.sx;
      const dby = b2.sy - b1.sy;
      const denom = dax * dby - day * dbx;
      if (Math.abs(denom) < 1e-8) continue;

      const t1 = ((b1.sx - a1.sx) * dby - (b1.sy - a1.sy) * dbx) / denom;
      const t2 = ((b1.sx - a1.sx) * day - (b1.sy - a1.sy) * dax) / denom;

      if (t1 > 0.05 && t1 < 0.95 && t2 > 0.05 && t2 < 0.95) {
        const ix = a1.sx + t1 * dax;
        const iy = a1.sy + t1 * day;
        const zA = a1.z + t1 * (a2.z - a1.z);
        const zB = b1.z + t2 * (b2.z - b1.z);
        const isDup = crossings.some(
          (c) => Math.abs(c.sx - ix) < 10 && Math.abs(c.sy - iy) < 10
        );
        if (!isDup) {
          crossings.push({
            segA: i,
            segB: j,
            sx: ix,
            sy: iy,
            overSeg: zA > zB ? i : j,
            underSeg: zA > zB ? j : i,
            sign: zA > zB ? 1 : -1,
          });
        }
      }
    }
  }
  return crossings;
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawKnot2D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pts: Pt3D[],
  crossings: Crossing[],
  _time: number,
  showGaps: boolean
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 8;

  ctx.clearRect(0, 0, w, h);

  const GAP = 14;

  const isNearUnderCrossing = (idx: number): boolean => {
    if (!showGaps) return false;
    for (const c of crossings) {
      const underCenter = c.underSeg;
      const overCenter = c.overSeg;
      const minS = Math.min(underCenter, overCenter);
      const maxS = Math.max(underCenter, overCenter);
      const nearIdx =
        (idx >= minS && idx <= maxS) ||
        (idx >= underCenter - GAP && idx <= underCenter + GAP);
      if (nearIdx) {
        const px = pts[idx].sx * scale + cx;
        const py = pts[idx].sy * scale + cy;
        const d = Math.hypot(px - c.sx, py - c.sy);
        if (d < GAP * 1.5) return true;
      }
    }
    return false;
  };

  for (let i = 0; i < pts.length - 1; i++) {
    if (isNearUnderCrossing(i)) continue;

    const t = (i / pts.length) * 2 * Math.PI;
    const hue = (t / (2 * Math.PI)) * 300 + 180;
    const x1 = pts[i].sx * scale + cx;
    const y1 = pts[i].sy * scale + cy;
    const x2 = pts[i + 1].sx * scale + cx;
    const y2 = pts[i + 1].sy * scale + cy;
    const brightness = 50 + pts[i].z * 3;
    drawSegment(ctx, x1, y1, x2, y2, `hsl(${hue}, 75%, ${Math.max(30, Math.min(70, brightness))}%)`, 3.5);
  }

  for (const c of crossings) {
    const r = 6;
    ctx.beginPath();
    ctx.arc(c.sx, c.sy, r, 0, Math.PI * 2);
    ctx.fillStyle = BG;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(c.sx, c.sy, r + 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  pts: Pt3D[],
  time: number,
  scale: number,
  cx: number,
  cy: number
) {
  const idx = ((time % 1) * (pts.length - 1)) | 0;
  const frac = (time % 1) * (pts.length - 1) - idx;
  const p1 = pts[idx];
  const p2 = pts[Math.min(idx + 1, pts.length - 1)];
  const px = (p1.sx + (p2.sx - p1.sx) * frac) * scale + cx;
  const py = (p1.sy + (p2.sy - p1.sy) * frac) * scale + cy;

  const grad = ctx.createRadialGradient(px, py, 0, px, py, 12);
  grad.addColorStop(0, "rgba(245,158,11,1)");
  grad.addColorStop(0.4, "rgba(245,158,11,0.5)");
  grad.addColorStop(1, "rgba(245,158,11,0)");
  ctx.beginPath();
  ctx.arc(px, py, 12, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#f59e0b";
  ctx.fill();
}

function drawKnot3D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pts: Pt3D[],
  crossings: Crossing[],
  time: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) / 8;

  ctx.clearRect(0, 0, w, h);

  const sorted = [...pts].map((p, i) => ({ ...p, origIdx: i }));
  sorted.sort((a, b) => a.z - b.z);

  const GAP = 12;

  const underSegs = new Set<number>();
  for (const c of crossings) {
    const minI = Math.min(c.underSeg, c.segB);
    const maxI = Math.max(c.underSeg, c.segB);
    for (let i = minI; i <= Math.max(maxI, minI + GAP); i++) {
      if (i < pts.length) underSegs.add(i);
    }
  }

  const step = 2;
  for (let i = 0; i < pts.length - step; i += step) {
    const p = pts[i];
    const p2 = pts[Math.min(i + step, pts.length - 1)];
    const isUnder = underSegs.has(i);

    const t = (i / pts.length) * 2 * Math.PI;
    const hue = (t / (2 * Math.PI)) * 300 + 180;
    const depthFactor = 0.4 + 0.6 * ((p.z + 3) / 6);
    const lightness = isUnder ? 25 : 30 + depthFactor * 35;
    const alpha = isUnder ? 0.5 : 0.8 + depthFactor * 0.2;

    const x1 = p.sx * scale + cx;
    const y1 = p.sy * scale + cy;
    const x2 = p2.sx * scale + cx;
    const y2 = p2.sy * scale + cy;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = `hsla(${hue}, 75%, ${lightness}%, ${alpha})`;
    ctx.lineWidth = isUnder ? 2.5 : 3.5;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  for (const c of crossings) {
    const overP = pts[c.overSeg] || pts[0];
    const depthFactor = 0.4 + 0.6 * ((overP.z + 3) / 6);
    const brightness = 50 + depthFactor * 30;

    ctx.beginPath();
    ctx.arc(c.sx, c.sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = BG;
    ctx.fill();
    ctx.strokeStyle = `hsla(45, 90%, ${brightness}%, 0.8)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const particleIdx = ((time % 1) * (pts.length - 1)) | 0;
  const pp = pts[particleIdx];
  const ppx = pp.sx * scale + cx;
  const ppy = pp.sy * scale + cy;

  const grad = ctx.createRadialGradient(ppx, ppy, 0, ppx, ppy, 10);
  grad.addColorStop(0, "rgba(245,158,11,1)");
  grad.addColorStop(0.5, "rgba(245,158,11,0.3)");
  grad.addColorStop(1, "rgba(245,158,11,0)");
  ctx.beginPath();
  ctx.arc(ppx, ppy, 10, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ppx, ppy, 3, 0, Math.PI * 2);
  ctx.fillStyle = "#f59e0b";
  ctx.fill();
}

function drawReidemeisterOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  moveType: ReidemeisterMove,
  progress: number
) {
  const cx = w / 2;
  const cy = h / 2;
  const alpha = progress < 0.1 ? progress * 10 : progress > 0.9 ? (1 - progress) * 10 : 1;

  ctx.save();
  ctx.globalAlpha = alpha * 0.9;

  const label = moveType === "I" ? "Reidemeister I" : moveType === "II" ? "Reidemeister II" : "Reidemeister III";
  ctx.font = "bold 13px monospace";
  ctx.fillStyle = "#f59e0b";
  ctx.textAlign = "center";
  ctx.fillText(label, cx, 28);

  ctx.font = "11px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  if (moveType === "I") {
    ctx.fillText("Add / remove a twist (curl)", cx, 46);
  } else if (moveType === "II") {
    ctx.fillText("Slide one strand over another (two crossings)", cx, 46);
  } else {
    ctx.fillText("Slide a strand across a crossing", cx, 46);
  }

  const animT = progress * Math.PI * 2;
  const wiggle = Math.sin(animT * 2) * 15;

  if (moveType === "I") {
    const rx = 80;
    const ry = 50;
    const twist = progress * Math.PI * 2;

    ctx.beginPath();
    ctx.ellipse(cx, cy + 20, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(34,211,238,0.4)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 100, cy + 20);
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const loopR = 25 * Math.sin(t / 2 + twist) * progress;
      const lx = cx - 100 + (200 * i) / steps;
      const ly = cy + 20 + loopR * Math.sin(t * 3);
      if (i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.stroke();

    const arrowX = cx + wiggle;
    const arrowY = cy + 20 - 60;
    drawArrow(ctx, arrowX, arrowY, arrowX + 20, arrowY, "#f59e0b");
    drawArrow(ctx, arrowX + 20, arrowY, arrowX, arrowY, "#f59e0b");
    ctx.beginPath();
    ctx.arc(arrowX + 10, arrowY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(245,158,11,0.6)";
    ctx.fill();
  } else if (moveType === "II") {
    const offset = wiggle * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 100, cy - 10 + offset);
    ctx.bezierCurveTo(cx - 30, cy - 10 + offset, cx + 30, cy + 10 - offset, cx + 100, cy + 10 - offset);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 100, cy + 10 - offset);
    ctx.bezierCurveTo(cx - 30, cy + 10 - offset, cx + 30, cy - 10 + offset, cx + 100, cy - 10 + offset);
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 3;
    ctx.stroke();

    drawArrow(ctx, cx + 10, cy - 40, cx + 10, cy - 55, "#f59e0b");
    drawArrow(ctx, cx + 10, cy + 40, cx + 10, cy + 55, "#f59e0b");
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(245,158,11,0.7)";
    ctx.fillText("\u21C5", cx + 30, cy);
  } else {
    const ox = wiggle * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy - 30);
    ctx.lineTo(cx + 80, cy + 30);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 60 + ox, cy + 30);
    ctx.bezierCurveTo(cx - 20 + ox, cy - 10, cx + 20 + ox, cy + 10, cx + 60 + ox, cy - 30);
    ctx.strokeStyle = "#a78bfa";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 10);
    ctx.lineTo(cx + 40, cy - 10);
    ctx.strokeStyle = "#f472b6";
    ctx.lineWidth = 3;
    ctx.stroke();

    const dx = ox * 0.3;
    drawArrow(ctx, cx - 90, cy - 30, cx - 90 + dx, cy - 30, "#f59e0b");
    drawArrow(ctx, cx + 90, cy - 30, cx + 90 + dx, cy - 30, "#f59e0b");

    ctx.font = "bold 16px serif";
    ctx.fillStyle = "rgba(245,158,11,0.8)";
    ctx.fillText("\u0394", cx, cy + 5);
  }

  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function KnotTheory({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);
  const rotRef = useRef(0);
  const lastFrameRef = useRef(0);

  const [knotId, setKnotId] = useState<KnotPreset>("trefoil");
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const [showGaps, setShowGaps] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(0.3);
  const [reidemeister, setReidemeister] = useState<ReidemeisterMove | null>(null);
  const reidProgressRef = useRef(0);
  const [autoRotate, setAutoRotate] = useState(true);

  const currentKnot = KNOTS.find((k) => k.id === knotId) || KNOTS[0];

  const triggerReidemeister = useCallback((move: ReidemeisterMove) => {
    reidProgressRef.current = 0;
    setReidemeister(move);
  }, []);

  useEffect(() => {
    if (!reidemeister) return;
    let raf: number;
    const tick = () => {
      reidProgressRef.current += 0.012;
      if (reidProgressRef.current >= 1) {
        setReidemeister(null);
        reidProgressRef.current = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reidemeister]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    });
    ro.observe(container);

    const render = (ts: number) => {
      const dt = lastFrameRef.current ? (ts - lastFrameRef.current) / 1000 : 0.016;
      lastFrameRef.current = ts;

      if (!compact) {
        timeRef.current += dt * animSpeed;
        if (autoRotate) rotRef.current += dt * 0.3;
      } else {
        timeRef.current += dt * 0.5;
        rotRef.current += dt * 0.4;
      }

      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rot = viewMode === "3d" || autoRotate ? rotRef.current : 0;
      const pts = sampleKnot(currentKnot, SAMPLES, rot);
      const crossings = findCrossings(pts);

      const scale = Math.min(w, h) / 8;
      const cx = w / 2;
      const cy = h / 2;

      if (viewMode === "2d") {
        drawKnot2D(ctx, w, h, pts, crossings, timeRef.current, showGaps);
      } else {
        drawKnot3D(ctx, w, h, pts, crossings, timeRef.current);
      }

      drawParticle(ctx, pts, timeRef.current, scale, cx, cy);

      if (reidemeister) {
        drawReidemeisterOverlay(ctx, w, h, reidemeister, reidProgressRef.current);
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [knotId, viewMode, showGaps, animSpeed, autoRotate, reidemeister, currentKnot, compact]);

  if (compact) {
    return (
      <div ref={containerRef} className="w-full h-full bg-[#0a0a0c] overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Top-left: Knot selector */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1.5">
          {KNOTS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKnotId(k.id)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-all duration-200 ${
                knotId === k.id
                  ? "bg-amber-500/90 text-black font-semibold shadow-lg shadow-amber-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top-right: View controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
        <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1">
          <button
            onClick={() => setViewMode("2d")}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              viewMode === "2d"
                ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            2D Diagram
          </button>
          <button
            onClick={() => setViewMode("3d")}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              viewMode === "3d"
                ? "bg-purple-500/20 border border-purple-500/40 text-purple-400"
                : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
          >
            3D Wireframe
          </button>
          <span className="w-px h-4 bg-white/10 mx-1" />
          <button
            onClick={() => setShowGaps(!showGaps)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              showGaps
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                : "text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            Crossings
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              autoRotate
                ? "bg-green-500/20 border border-green-500/40 text-green-400"
                : "text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            Rotate
          </button>
        </div>
      </div>

      {/* Invariants panel */}
      <div className="absolute top-14 left-3 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-[11px] space-y-1 font-mono">
          <div className="text-white/40 uppercase tracking-wider text-[9px] mb-1">Invariants</div>
          <div className="flex justify-between gap-4">
            <span className="text-white/40">Crossings:</span>
            <span className="text-cyan-400">{currentKnot.crossingNum}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/40">Writhe:</span>
            <span className="text-purple-400">{currentKnot.writhe > 0 ? "+" : ""}{currentKnot.writhe}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-white/40">Tricolorable:</span>
            <span className={currentKnot.tricolorable ? "text-green-400" : "text-red-400"}>
              {currentKnot.tricolorable ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40">Jones polynomial:</span>
            <span className="text-amber-400 text-[10px]">{currentKnot.jones}</span>
          </div>
        </div>
      </div>

      {/* Reidemeister moves */}
      <div className="absolute bottom-14 left-3">
        <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1.5 flex flex-col gap-1">
          <div className="text-[9px] text-white/30 uppercase tracking-wider px-1">Moves</div>
          {(["I", "II", "III"] as ReidemeisterMove[]).map((m) => (
            <button
              key={m}
              onClick={() => triggerReidemeister(m)}
              disabled={!!reidemeister}
              className={`px-3 py-1 rounded text-[10px] font-mono transition-all ${
                reidemeister === m
                  ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                  : "text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-40"
              }`}
            >
              Move {m}
            </button>
          ))}
        </div>
      </div>

      {/* Speed control */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
        <span className="text-white/40 text-[10px] font-mono">Speed</span>
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.05}
          value={animSpeed}
          onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
          className="w-24 h-1 accent-amber-500 cursor-pointer"
        />
        <span className="text-white/30 text-[10px] font-mono w-8">{animSpeed.toFixed(1)}x</span>
      </div>
    </div>
  );
}
