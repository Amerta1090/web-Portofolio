import { useRef, useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type MatrixPreset = "identity" | "rotation" | "shear" | "stretch" | "random";
type DisplayMode = "vectorfield" | "pca" | "overlay";

interface Vec2 {
  x: number;
  y: number;
}

interface Mat2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

/* ------------------------------------------------------------------ */
/*  2×2 linear algebra helpers                                        */
/* ------------------------------------------------------------------ */

function det(m: Mat2): number {
  return m.a * m.d - m.b * m.c;
}

function trace(m: Mat2): number {
  return m.a + m.d;
}

function eigenDecompose(m: Mat2): {
  λ1: number;
  λ2: number;
  v1: Vec2;
  v2: Vec2;
} {
  const tr = trace(m);
  const d = det(m);
  const disc = tr * tr - 4 * d;
  if (disc < 0) {
    // complex eigenvalues – fallback to identity-like decomposition
    return { λ1: 1, λ2: 1, v1: { x: 1, y: 0 }, v2: { x: 0, y: 1 } };
  }
  const sqrtDisc = Math.sqrt(disc);
  const λ1 = (tr + sqrtDisc) / 2;
  const λ2 = (tr - sqrtDisc) / 2;

  // Eigenvectors for λ1 and λ2
  const computeEigenvec = (λ: number, otherVec?: Vec2): Vec2 => {
    const tol = 1e-8;
    if (Math.abs(m.b) > tol) {
      const vx = 1;
      const vy = (λ - m.a) / m.b;
      const len = Math.sqrt(vx * vx + vy * vy);
      return { x: vx / len, y: vy / len };
    }
    if (Math.abs(m.c) > tol) {
      const vy = 1;
      const vx = (λ - m.d) / m.c;
      const len = Math.sqrt(vx * vx + vy * vy);
      return { x: vx / len, y: vy / len };
    }
    // Diagonal matrix: eigenvectors are axis-aligned
    // If eigenvalues are distinct, assign distinct eigenvectors.
    // For degenerate eigenvalues, pick an orthonormal pair.
    if (m.a !== m.d) {
      // λ1 corresponds to a (since λ1 >= λ2 when trace^2 > 4det)
      const diff1 = Math.abs(λ - m.a);
      const diff2 = Math.abs(λ - m.d);
      if (diff1 < diff2) return { x: 1, y: 0 };
      return { x: 0, y: 1 };
    }
    // Degenerate: use identity basis or orthogonal to otherVec
    if (otherVec) {
      const dot = otherVec.x * 1 + otherVec.y * 0;
      if (Math.abs(dot) < tol) return { x: 1, y: 0 };
      return { x: -otherVec.y, y: otherVec.x };
    }
    return { x: 1, y: 0 };
  };

  const v1 = computeEigenvec(λ1);
  const v2 = computeEigenvec(λ2, v1);
  return { λ1, λ2, v1, v2 };
}

function matMulVector(m: Mat2, v: Vec2): Vec2 {
  return {
    x: m.a * v.x + m.b * v.y,
    y: m.c * v.x + m.d * v.y,
  };
}

/* ------------------------------------------------------------------ */
/*  Covariance & PCA helpers                                          */
/* ------------------------------------------------------------------ */

function mean(data: Vec2[]): Vec2 {
  const n = data.length;
  if (n === 0) return { x: 0, y: 0 };
  let sx = 0,
    sy = 0;
  for (const p of data) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / n, y: sy / n };
}

function covarianceMatrix(data: Vec2[]): Mat2 {
  const n = data.length;
  if (n < 2) return { a: 1, b: 0, c: 0, d: 1 };
  const m = mean(data);
  let sxx = 0,
    sxy = 0,
    syy = 0;
  for (const p of data) {
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const inv = 1 / (n - 1);
  return { a: sxx * inv, b: sxy * inv, c: sxy * inv, d: syy * inv };
}

function generateCluster(
  cx: number,
  cy: number,
  spread: number,
  count: number
): Vec2[] {
  const pts: Vec2[] = [];
  for (let i = 0; i < count; i++) {
    // Box-Muller normal
    const u1 = Math.random();
    const u2 = Math.random();
    const z1 = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    const z2 = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.sin(2 * Math.PI * u2);
    pts.push({
      x: cx + z1 * spread,
      y: cy + z2 * spread,
    });
  }
  return pts;
}

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

const PRESETS: Record<MatrixPreset, Mat2> = {
  identity: { a: 1, b: 0, c: 0, d: 1 },
  rotation: { a: 0.8, b: -0.6, c: 0.6, d: 0.8 },
  shear: { a: 1, b: 0.8, c: 0, d: 1 },
  stretch: { a: 2, b: 0, c: 0, d: 0.5 },
  random: { a: 1.2, b: 0.3, c: -0.4, d: 0.9 },
};

/* ------------------------------------------------------------------ */
/*  Drawing helpers                                                    */
/* ------------------------------------------------------------------ */

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Vec2,
  to: Vec2,
  color: string,
  lineWidth = 2
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  const headLen = Math.min(8, len * 0.3);
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle - 0.4),
    to.y - headLen * Math.sin(angle - 0.4)
  );
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle + 0.4),
    to.y - headLen * Math.sin(angle + 0.4)
  );
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
  color: string,
  lineWidth = 2
) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), angle, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // faint fill
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), angle, 0, 2 * Math.PI);
  ctx.fillStyle = color.replace(")", ",0.08)").replace("rgb", "rgba");
  ctx.fill();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  scale: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 0.5;
  const step = 40 * scale;
  if (step < 4) {
    ctx.restore();
    return;
  }
  ctx.beginPath();
  for (let x = (ox % step) - step; x < w + step; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = (oy % step) - step; y < h + step; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  // Axes
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, oy);
  ctx.lineTo(w, oy);
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, h);
  ctx.stroke();

  // Axis labels
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("x", w - 16, oy - 6);
  ctx.fillText("y", ox + 6, 14);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EigenvectorFlowField({
  compact,
}: {
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  // State
  const [preset, setPreset] = useState<MatrixPreset>("stretch");
  const [matrix, setMatrix] = useState<Mat2>(PRESETS.stretch);
  const [mode, setMode] = useState<DisplayMode>("overlay");
  const [animating, setAnimating] = useState(false);
  const [dragPoint, setDragPoint] = useState<Vec2 | null>(null);
  const [eigenvalues, setEigenvalues] = useState<[number, number]>([2, 0.5]);
  const [pcaStep, setPcaStep] = useState(0);

  // Refs for animation loop
  const matrixRef = useRef(matrix);
  const modeRef = useRef(mode);
  const animatingRef = useRef(animating);
  const dragPointRef = useRef<Vec2 | null>(null);
  const pcaDataRef = useRef<Vec2[]>([]);
  const pcaStepRef = useRef(pcaStep);
  const timeRef = useRef(0);
  const traceRef = useRef<Vec2[]>([]);
  const isDraggingRef = useRef(false);

  // Sync refs
  useEffect(() => {
    matrixRef.current = matrix;
  }, [matrix]);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);
  useEffect(() => {
    animatingRef.current = animating;
  }, [animating]);
  useEffect(() => {
    pcaStepRef.current = pcaStep;
  }, [pcaStep]);

  // Handle preset selection
  const handlePreset = useCallback((p: MatrixPreset) => {
    setPreset(p);
    setMatrix(PRESETS[p]);
    timeRef.current = 0;
    traceRef.current = [];
  }, []);

  // Handle slider changes
  const handleMatrixChange = useCallback(
    (key: keyof Mat2, value: number) => {
      const next = { ...matrixRef.current, [key]: value };
      setMatrix(next);
      if (preset !== "random") setPreset("random");
      timeRef.current = 0;
      traceRef.current = [];
    },
    [preset]
  );

  // Animate PCA
  const toggleAnimating = useCallback(() => {
    setAnimating((v) => !v);
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    setDragPoint(null);
    dragPointRef.current = null;
    traceRef.current = [];
    timeRef.current = 0;
    setPcaStep(0);
    pcaStepRef.current = 0;
  }, []);

  // Initialize PCA data
  useEffect(() => {
    // Generate two clusters for interesting PCA
    const c1 = generateCluster(-40, -30, 12, 50);
    const c2 = generateCluster(50, 40, 10, 50);
    pcaDataRef.current = [...c1, ...c2];
  }, []);

  // --- Main render loop ---
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

    // World → screen mapping
    const worldToScreen = (
      wx: number,
      wy: number,
      cw: number,
      ch: number
    ): Vec2 => ({
      x: cw / 2 + wx,
      y: ch / 2 + wy,
    });

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const cx = w / 2;
      const cy = h / 2;
      const currentMat = matrixRef.current;
      const currentMode = modeRef.current;
      const isAnimating = animatingRef.current;
      const currentDrag = dragPointRef.current;
      const currentTrace = traceRef.current;
      const pcaData = pcaDataRef.current;
      const currentPcaStep = pcaStepRef.current;

      // Clear
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      // Grid
      drawGrid(ctx, w, h, cx, cy, 1);

      // Eigen decomposition
      const { λ1, λ2, v1, v2 } = eigenDecompose(currentMat);
      setEigenvalues([λ1, λ2]);

      // === FLOW LINES (purple) ===
      const flowScale = 20;
      if (currentMode === "vectorfield" || currentMode === "overlay") {
        const step = 40;
        const arrowLen = 16;
        for (let gx = step; gx < w; gx += step) {
          for (let gy = step; gy < h; gy += step) {
            const wx = gx - cx;
            const wy = gy - cy;
            const vec = matMulVector(currentMat, { x: wx / flowScale, y: wy / flowScale });
            const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
            if (len < 0.01) continue;
            const nx = vec.x / len;
            const ny = vec.y / len;
            const aLen = Math.min(arrowLen, arrowLen * 0.3 + len * 2);
            const from: Vec2 = {
              x: gx - nx * (aLen / 2),
              y: gy - ny * (aLen / 2),
            };
            const to: Vec2 = {
              x: gx + nx * (aLen / 2),
              y: gy + ny * (aLen / 2),
            };
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.strokeStyle = `rgba(139,92,246,${Math.min(0.4, 0.1 + len * 0.04)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // === EIGENVECTORS (amber) ===
      if (currentMode === "vectorfield" || currentMode === "overlay") {
        const evLen = 80;
        const e1: Vec2 = { x: v1.x * evLen * Math.sign(λ1), y: v1.y * evLen * Math.sign(λ1) };
        const e2: Vec2 = { x: v2.x * evLen * Math.sign(λ2), y: v2.y * evLen * Math.sign(λ2) };

        const s1 = worldToScreen(e1.x, e1.y, w, h);
        const s2 = worldToScreen(e2.x, e2.y, w, h);

        drawArrow(ctx, { x: cx, y: cy }, s1, "rgba(245,158,11,0.8)", 2.5);
        drawArrow(ctx, { x: cx, y: cy }, s2, "rgba(245,158,11,0.5)", 2);

        // Labels
        ctx.fillStyle = "rgba(245,158,11,0.6)";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `λ₁=${λ1.toFixed(2)}`,
          s1.x + 12 * Math.sign(v1.x),
          s1.y - 8
        );
        ctx.fillText(
          `λ₂=${λ2.toFixed(2)}`,
          s2.x + 12 * Math.sign(v2.x),
          s2.y - 8
        );
      }

      // === PCA MODE ===
      if (currentMode === "pca" || currentMode === "overlay") {
        // Draw data points
        for (const pt of pcaData) {
          const sp = worldToScreen(pt.x, pt.y, w, h);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(6,182,212,0.5)";
          ctx.fill();
        }

        // Covariance matrix & PCA
        const cov = covarianceMatrix(pcaData);
        const { λ1: pcλ1, λ2: pcλ2, v1: pcv1, v2: pcv2 } =
          eigenDecompose(cov);
        const m = mean(pcaData);
        const sm = worldToScreen(m.x, m.y, w, h);

        // Covariance ellipse (green)
        const ellipseScale = 2;
        const rx = Math.sqrt(Math.abs(pcλ1)) * ellipseScale;
        const ry = Math.sqrt(Math.abs(pcλ2)) * ellipseScale;
        const angle = Math.atan2(pcv1.y, pcv1.x);

        drawEllipse(ctx, sm.x, sm.y, rx, ry, angle, "rgba(16,185,129,0.7)", 2);

        // Principal components (amber arrows)
        const pcLen = Math.sqrt(Math.abs(pcλ1)) * ellipseScale * 1.2;
        const pc2Len = Math.sqrt(Math.abs(pcλ2)) * ellipseScale * 1.2;
        const pc1End = worldToScreen(
          m.x + pcv1.x * pcLen,
          m.y + pcv1.y * pcLen,
          w,
          h
        );
        const pc2End = worldToScreen(
          m.x + pcv2.x * pc2Len,
          m.y + pcv2.y * pc2Len,
          w,
          h
        );

        drawArrow(ctx, sm, pc1End, "rgba(245,158,11,0.9)", 2.5);
        drawArrow(ctx, sm, pc2End, "rgba(245,158,11,0.5)", 2);

        // PCA step counter
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
          `PC1 var=${(pcλ1 / (pcλ1 + pcλ2) * 100).toFixed(1)}%`,
          8,
          16
        );
        ctx.fillText(
          `PC2 var=${(pcλ2 / (pcλ1 + pcλ2) * 100).toFixed(1)}%`,
          8,
          30
        );
      }

      // === DRAG POINT TRACE ===
      if (currentDrag && (currentMode === "vectorfield" || currentMode === "overlay")) {
        // Draw trace
        if (currentTrace.length > 1) {
          ctx.beginPath();
          ctx.moveTo(
            cx + currentTrace[0].x,
            cy + currentTrace[0].y
          );
          for (let i = 1; i < currentTrace.length; i++) {
            ctx.lineTo(
              cx + currentTrace[i].x,
              cy + currentTrace[i].y
            );
          }
          ctx.strokeStyle = "rgba(16,185,129,0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Drag point
        const sp = worldToScreen(currentDrag.x, currentDrag.y, w, h);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(245,158,11,0.9)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 9, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(245,158,11,0.4)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // === PCA ANIMATION ===
      if (isAnimating && currentMode !== "vectorfield") {
        timeRef.current += 0.008;
        if (timeRef.current > 1) {
          timeRef.current = 0;
          // Regenerate clusters
          const c1 = generateCluster(-40, -30, 12, 50);
          const c2 = generateCluster(50, 40, 10, 50);
          pcaDataRef.current = [...c1, ...c2];
        }

        // Animate rotation of PCA angle
        const animAngle = timeRef.current * 2 * Math.PI;
        const rotCos = Math.cos(animAngle);
        const rotSin = Math.sin(animAngle);
        const rotatedData = pcaDataRef.current.map((p) => ({
          x: p.x * rotCos - p.y * rotSin,
          y: p.x * rotSin + p.y * rotCos,
        }));
        pcaDataRef.current = rotatedData;
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  // --- Pointer events ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || compact) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      return {
        x: e.clientX - rect.left - cx,
        y: e.clientY - rect.top - cy,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      const pos = getPos(e);
      dragPointRef.current = pos;
      traceRef.current = [pos];
      setDragPoint(pos);
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const pos = getPos(e);
      dragPointRef.current = pos;
      traceRef.current.push(pos);
      setDragPoint(pos);
    };

    const onPointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
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

  /* ---- Render ---- */
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {/* Compact hint */}
      {compact && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-bg-secondary/80 backdrop-blur-sm border border-border/40 text-[10px] text-text-secondary/60 font-mono pointer-events-none">
          Eigenvector Flow Field
        </div>
      )}

      {/* Controls (non-compact only) */}
      {!compact && (
        <>
          {/* Top controls bar */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2">
            {/* Preset selector */}
            <select
              value={preset}
              onChange={(e) => handlePreset(e.target.value as MatrixPreset)}
              className="px-2 py-1 text-[11px] rounded-lg bg-bg-secondary/70 backdrop-blur-sm border border-border/40 text-text-secondary font-mono outline-none cursor-pointer hover:border-amber-500/40 transition-colors"
            >
              <option value="identity">Identity</option>
              <option value="rotation">Rotation</option>
              <option value="shear">Shear</option>
              <option value="stretch">Stretch</option>
              <option value="random">Random</option>
            </select>

            {/* Mode toggle */}
            <div className="flex gap-1">
              {(["vectorfield", "pca", "overlay"] as DisplayMode[]).map(
                (m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-2 py-1 text-[11px] rounded-full border transition-all font-mono ${
                      mode === m
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                    }`}
                  >
                    {m === "vectorfield"
                      ? "Field"
                      : m === "pca"
                        ? "PCA"
                        : "Overlay"}
                  </button>
                )
              )}
            </div>

            {/* Animate PCA button */}
            <button
              onClick={toggleAnimating}
              className={`px-2 py-1 text-[11px] rounded-full border transition-all font-mono ${
                animating
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-green-500/30"
              }`}
            >
              {animating ? "⏹ Stop" : "▶ Animate PCA"}
            </button>

            {/* Reset */}
            <button
              onClick={resetView}
              className="px-2 py-1 text-[11px] rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-red-500/30 transition-all font-mono"
            >
              Reset
            </button>
          </div>

          {/* Bottom controls — matrix sliders and info */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              {/* Matrix sliders */}
              <label className="flex items-center gap-1">
                a:
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.05}
                  value={matrix.a}
                  onChange={(e) =>
                    handleMatrixChange("a", parseFloat(e.target.value))
                  }
                  className="w-16 accent-amber-500"
                />
                <span className="w-8 text-right tabular-nums">
                  {matrix.a.toFixed(1)}
                </span>
              </label>
              <label className="flex items-center gap-1">
                b:
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.05}
                  value={matrix.b}
                  onChange={(e) =>
                    handleMatrixChange("b", parseFloat(e.target.value))
                  }
                  className="w-16 accent-amber-500"
                />
                <span className="w-8 text-right tabular-nums">
                  {matrix.b.toFixed(1)}
                </span>
              </label>
              <label className="flex items-center gap-1">
                c:
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.05}
                  value={matrix.c}
                  onChange={(e) =>
                    handleMatrixChange("c", parseFloat(e.target.value))
                  }
                  className="w-16 accent-amber-500"
                />
                <span className="w-8 text-right tabular-nums">
                  {matrix.c.toFixed(1)}
                </span>
              </label>
              <label className="flex items-center gap-1">
                d:
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.05}
                  value={matrix.d}
                  onChange={(e) =>
                    handleMatrixChange("d", parseFloat(e.target.value))
                  }
                  className="w-16 accent-amber-500"
                />
                <span className="w-8 text-right tabular-nums">
                  {matrix.d.toFixed(1)}
                </span>
              </label>

              {/* Spacer */}
              <span className="hidden sm:inline text-text-secondary/40">|</span>

              {/* Eigenvalue display */}
              <span className="text-amber-400/70">
                λ₁={eigenvalues[0].toFixed(2)}
              </span>
              <span className="text-amber-500/50">
                λ₂={eigenvalues[1].toFixed(2)}
              </span>
              <span className="text-text-secondary/40">
                det={det(matrix).toFixed(2)}
              </span>

              {/* Drag hint */}
              {!dragPoint && (
                <span className="text-text-secondary/30 italic hidden md:inline">
                  Drag on canvas to trace
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
