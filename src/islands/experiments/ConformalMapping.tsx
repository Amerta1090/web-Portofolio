import { useRef, useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types & Complex helpers                                           */
/* ------------------------------------------------------------------ */

type C = { re: number; im: number };

function cMul(a: C, b: C): C {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function cDiv(a: C, b: C): C {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}
function cExp(z: C): C {
  const r = Math.exp(z.re);
  return { re: r * Math.cos(z.im), im: r * Math.sin(z.im) };
}
function cSin(z: C): C {
  return { re: Math.sin(z.re) * Math.cosh(z.im), im: Math.cos(z.re) * Math.sinh(z.im) };
}
function cSqrt(z: C): C {
  const r = Math.sqrt(Math.sqrt(z.re * z.re + z.im * z.im));
  const t = Math.atan2(z.im, z.re) / 2;
  return { re: r * Math.cos(t), im: r * Math.sin(t) };
}
function cPow3(z: C): C {
  return cMul(z, cMul(z, z));
}

/* ------------------------------------------------------------------ */
/*  Function definitions                                              */
/* ------------------------------------------------------------------ */

type FuncId = "z2" | "inv" | "exp" | "sin" | "z3" | "sqrt";

interface FuncDef {
  id: FuncId;
  label: string;
  formula: string;
  apply: (z: C) => C;
  poles: C[];
  zeros: C[];
}

const FUNCTIONS: FuncDef[] = [
  {
    id: "z2",
    label: "z\u00B2",
    formula: "f(z) = z\u00B2",
    apply: (z) => cMul(z, z),
    poles: [],
    zeros: [{ re: 0, im: 0 }],
  },
  {
    id: "inv",
    label: "1/z",
    formula: "f(z) = 1/z",
    apply: (z) => cDiv({ re: 1, im: 0 }, z),
    poles: [{ re: 0, im: 0 }],
    zeros: [],
  },
  {
    id: "exp",
    label: "e\u02E3",
    formula: "f(z) = e\u02E3",
    apply: cExp,
    poles: [],
    zeros: [],
  },
  {
    id: "sin",
    label: "sin(z)",
    formula: "f(z) = sin(z)",
    apply: cSin,
    poles: [],
    zeros: (() => {
      const zs: C[] = [];
      for (let n = -4; n <= 4; n++) zs.push({ re: n * Math.PI, im: 0 });
      return zs;
    })(),
  },
  {
    id: "z3",
    label: "z\u00B3",
    formula: "f(z) = z\u00B3",
    apply: cPow3,
    poles: [],
    zeros: [{ re: 0, im: 0 }],
  },
  {
    id: "sqrt",
    label: "\u221Az",
    formula: "f(z) = \u221Az",
    apply: cSqrt,
    poles: [],
    zeros: [{ re: 0, im: 0 }],
  },
];

const FUNC_MAP = Object.fromEntries(FUNCTIONS.map((f) => [f.id, f])) as Record<FuncId, FuncDef>;

/* ------------------------------------------------------------------ */
/*  Lerp between two complex functions for morph animation            */
/* ------------------------------------------------------------------ */

function lerpFunc(a: FuncDef, b: FuncDef, t: number): (z: C) => C {
  if (a.id === b.id) return a.apply;
  const ease = t * t * (3 - 2 * t); // smoothstep
  return (z: C) => {
    const wa = a.apply(z);
    const wb = b.apply(z);
    return {
      re: wa.re + (wb.re - wa.re) * ease,
      im: wa.im + (wb.im - wa.im) * ease,
    };
  };
}

/* ------------------------------------------------------------------ */
/*  Grid drawing helpers                                              */
/* ------------------------------------------------------------------ */

const GRID_RANGE = 3.5;
const GRID_STEP = 0.5;

function worldToScreen(
  wx: number,
  wy: number,
  cx: number,
  cy: number,
  scale: number
): [number, number] {
  return [cx + wx * scale, cy - wy * scale];
}

function screenToWorld(
  sx: number,
  sy: number,
  cx: number,
  cy: number,
  scale: number
): [number, number] {
  return [(sx - cx) / scale, (cy - sy) / scale];
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  cx: number,
  cy: number,
  scale: number,
  fn: (z: C) => C,
  showAngles: boolean
) {
  ctx.save();
  ctx.lineWidth = 0.7;

  const range = GRID_RANGE;
  const step = GRID_STEP;

  // Horizontal lines (constant Im → mapped by fn)
  for (let im = -range; im <= range; im += step) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(6,182,212,${im === 0 ? 0.6 : 0.3})`;
    ctx.shadowColor = "rgba(6,182,212,0.15)";
    ctx.shadowBlur = 4;
    let first = true;
    for (let re = -range; re <= range; re += 0.05) {
      const z = { re, im };
      const wz = fn(z);
      const [sx, sy] = worldToScreen(wz.re, wz.im, cx, cy, scale);
      if (sx < -200 || sx > cw + 200 || sy < -200 || sy > ch + 200) {
        first = true;
        continue;
      }
      if (first) {
        ctx.moveTo(sx, sy);
        first = false;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  // Vertical lines (constant Re → mapped by fn)
  for (let re = -range; re <= range; re += step) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(245,158,11,${re === 0 ? 0.6 : 0.3})`;
    ctx.shadowColor = "rgba(245,158,11,0.15)";
    ctx.shadowBlur = 4;
    let first = true;
    for (let im = -range; im <= range; im += 0.05) {
      const z = { re, im };
      const wz = fn(z);
      const [sx, sy] = worldToScreen(wz.re, wz.im, cx, cy, scale);
      if (sx < -200 || sx > cw + 200 || sy < -200 || sy > ch + 200) {
        first = true;
        continue;
      }
      if (first) {
        ctx.moveTo(sx, sy);
        first = false;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  // Angle preservation markers at grid intersections
  if (showAngles) {
    const markerR = 8;
    ctx.lineWidth = 1;
    for (let re = -range; re <= range; re += step) {
      for (let im = -range; im <= range; im += step) {
        if (re === 0 && im === 0) continue;
        const z = { re, im };
        const wz = fn(z);
        const [sx, sy] = worldToScreen(wz.re, wz.im, cx, cy, scale);
        if (sx < -20 || sx > cw + 20 || sy < -20 || sy > ch + 20) continue;

        // Tangent directions via small perturbation
        const eps = 0.001;
        const wRe = fn({ re: re + eps, im });
        const wIm = fn({ re, im: im + eps });
        const dRe = { re: (wRe.re - wz.re) / eps, im: (wRe.im - wz.im) / eps };
        const dIm = { re: (wIm.re - wz.re) / eps, im: (wIm.im - wz.im) / eps };

        const aRe = Math.atan2(-dRe.im, dRe.re); // negative because screen y is flipped
        const aIm = Math.atan2(-dIm.im, dIm.re);

        // Draw small arcs between the two tangent directions
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.arc(sx, sy, markerR, aRe, aIm, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx, sy, markerR, aIm, aRe, false);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function drawPolesAndZeros(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  poles: C[],
  zeros: C[]
) {
  ctx.save();
  ctx.lineWidth = 1.5;

  for (const p of poles) {
    const [sx, sy] = worldToScreen(p.re, p.im, cx, cy, scale);
    const s = 6;
    ctx.strokeStyle = "rgba(239,68,68,0.85)";
    ctx.shadowColor = "rgba(239,68,68,0.5)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(sx - s, sy - s);
    ctx.lineTo(sx + s, sy + s);
    ctx.moveTo(sx + s, sy - s);
    ctx.lineTo(sx - s, sy + s);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;

  for (const z of zeros) {
    const [sx, sy] = worldToScreen(z.re, z.im, cx, cy, scale);
    ctx.fillStyle = "rgba(34,197,94,0.85)";
    ctx.shadowColor = "rgba(34,197,94,0.5)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function ConformalMapping({
  compact,
}: {
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [funcId, setFuncId] = useState<FuncId>("z2");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  // Morph animation state
  const [prevFuncId, setPrevFuncId] = useState<FuncId>("z2");
  const morphRef = useRef(1); // 0→1 progress
  const morphingRef = useRef(false);
  const morphFromRef = useRef<FuncId>("z2");
  const morphToRef = useRef<FuncId>("z2");

  // Refs for animation loop
  const funcIdRef = useRef(funcId);
  const zoomRef = useRef(zoom);
  const panXRef = useRef(panX);
  const panYRef = useRef(panY);

  useEffect(() => { funcIdRef.current = funcId; }, [funcId]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panXRef.current = panX; }, [panX]);
  useEffect(() => { panYRef.current = panY; }, [panY]);

  // Drag state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const handleFuncChange = useCallback((id: FuncId) => {
    if (id === funcIdRef.current) return;
    morphFromRef.current = funcIdRef.current;
    morphToRef.current = id;
    morphRef.current = 0;
    morphingRef.current = true;
    setPrevFuncId(funcIdRef.current);
    setFuncId(id);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    setZoom((z) => Math.max(0.2, Math.min(5, z * (1 + delta))));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, []);

  // --- Main render loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 300 : 500),
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

    const MORPH_SPEED = 0.025;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const cx = w / 2 + panXRef.current;
      const cy = h / 2 + panYRef.current;
      const scale = Math.min(w, h) / (GRID_RANGE * 2 + 1) * zoomRef.current;

      // Advance morph
      if (morphingRef.current) {
        morphRef.current = Math.min(1, morphRef.current + MORPH_SPEED);
        if (morphRef.current >= 1) {
          morphingRef.current = false;
        }
      }

      // Compute current function (with morph)
      const fromDef = FUNC_MAP[morphFromRef.current];
      const toDef = FUNC_MAP[morphToRef.current];
      const currentFn = morphingRef.current
        ? lerpFunc(fromDef, toDef, morphRef.current)
        : FUNC_MAP[funcIdRef.current].apply;

      // Current definition for poles/zeros (snap to target when morphing completes)
      const currentDef = morphingRef.current ? toDef : FUNC_MAP[funcIdRef.current];

      // Clear
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      // Draw axes (subtle)
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const [ax0] = worldToScreen(-GRID_RANGE * 2, 0, cx, cy, scale);
      const [ax1] = worldToScreen(GRID_RANGE * 2, 0, cx, cy, scale);
      ctx.moveTo(ax0, cy);
      ctx.lineTo(ax1, cy);
      const [, ay0] = worldToScreen(0, -GRID_RANGE * 2, cx, cy, scale);
      const [, ay1] = worldToScreen(0, GRID_RANGE * 2, cx, cy, scale);
      ctx.moveTo(cx, ay0);
      ctx.lineTo(cx, ay1);
      ctx.stroke();
      ctx.restore();

      // Draw transformed grid
      drawGrid(ctx, w, h, cx, cy, scale, currentFn, !compact);

      // Draw poles and zeros
      if (!compact) {
        drawPolesAndZeros(ctx, cx, cy, scale, currentDef.poles, currentDef.zeros);
      }
    }

    draw();

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, prevFuncId]);

  // Mouse handlers for pan
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (compact) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { x: panXRef.current, y: panYRef.current };
    },
    [compact]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPanX(panStart.current.x + dx);
      setPanY(panStart.current.y + dy);
    },
    []
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (compact) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.max(0.2, Math.min(5, z * (1 + delta))));
    },
    [compact]
  );

  const currentDef = FUNC_MAP[funcId];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />

      {!compact && (
        <>
          {/* Formula overlay */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2">
              <span className="text-white/90 font-mono text-sm tracking-wide">
                {currentDef.formula}
              </span>
              {morphingRef.current && (
                <span className="text-amber-400/60 text-xs ml-2">
                  (morphing)
                </span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute top-3 right-3 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-0.5 bg-cyan-400 rounded" />
                <span className="text-white/50">Re-lines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-0.5 bg-amber-400 rounded" />
                <span className="text-white/50">Im-lines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                <span className="text-white/50">Pole (×)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                <span className="text-white/50">Zero (●)</span>
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            {/* Function selector */}
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1.5">
              {FUNCTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFuncChange(f.id)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all duration-200 ${
                    funcId === f.id
                      ? "bg-amber-500/90 text-black font-semibold shadow-lg shadow-amber-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1">
              <button
                onClick={() => handleZoom(-0.2)}
                className="w-7 h-7 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
              >
                −
              </button>
              <span className="text-white/40 text-xs font-mono w-12 text-center tabular-nums">
                {(zoom * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => handleZoom(0.2)}
                className="w-7 h-7 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
              >
                +
              </button>
              <span className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={resetView}
                className="px-2 py-1 rounded text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
