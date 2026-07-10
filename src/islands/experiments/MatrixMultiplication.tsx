import { useRef, useEffect, useState, useCallback } from "react";

type Matrix = number[][];
type MatrixSize = 2 | 3;

interface AnimationStep {
  row: number;
  col: number;
  done: boolean;
}

const PRESETS: Record<string, { label: string; A: Matrix; B: Matrix }> = {
  identity: {
    label: "Identity",
    A: [
      [1, 0],
      [0, 1],
    ],
    B: [
      [1, 2],
      [3, 4],
    ],
  },
  rotation: {
    label: "Rotation",
    A: [
      [1, 0],
      [0, 1],
    ],
    B: [
      [1, 0],
      [0, 1],
    ],
  },
  shear: {
    label: "Shear",
    A: [
      [1, 0],
      [0, 1],
    ],
    B: [
      [1, 0],
      [0, 1],
    ],
  },
  reflection: {
    label: "Reflection",
    A: [
      [-1, 0],
      [0, 1],
    ],
    B: [
      [1, 2],
      [3, 4],
    ],
  },
  scale: {
    label: "Scale",
    A: [
      [1.5, 0],
      [0, 0.5],
    ],
    B: [
      [1, 2],
      [3, 4],
    ],
  },
  custom: {
    label: "Custom",
    A: [
      [2, 1],
      [1, 2],
    ],
    B: [
      [3, 1],
      [2, 1],
    ],
  },
};

function matMul(A: Matrix, B: Matrix): Matrix {
  const rows = A.length;
  const cols = B[0].length;
  const inner = A[0].length;
  const result: Matrix = Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

function dotProduct(A: Matrix, B: Matrix, row: number, col: number): number {
  let sum = 0;
  for (let k = 0; k < A[0].length; k++) {
    sum += A[row][k] * B[k][col];
  }
  return sum;
}

function buildRotationMatrix(theta: number): Matrix {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return [
    [c, -s],
    [s, c],
  ];
}

function buildShearMatrix(k: number): Matrix {
  return [
    [1, k],
    [0, 1],
  ];
}

function buildScaleMatrix(sx: number, sy: number): Matrix {
  return [
    [sx, 0],
    [0, sy],
  ];
}

function identity3(): Matrix {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

function matMul3(A: Matrix, B: Matrix): Matrix {
  const rows = A.length;
  const cols = B[0].length;
  const inner = A[0].length;
  const result: Matrix = Array.from({ length: rows }, () =>
    Array(cols).fill(0)
  );
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = 0;
      for (let k = 0; k < inner; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = parseFloat(sum.toFixed(4));
    }
  }
  return result;
}

// ── Canvas drawing utilities ─────────────────────────────────────────────

function drawBracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const bw = 6;
  const br = 4;
  const t = 1.5;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = t;
  ctx.beginPath();
  ctx.moveTo(x + bw, y);
  ctx.lineTo(x + br, y + br);
  ctx.lineTo(x + br, y + h - br);
  ctx.lineTo(x + bw, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w - bw, y);
  ctx.lineTo(x + w - br, y + br);
  ctx.lineTo(x + w - br, y + h - br);
  ctx.lineTo(x + w - bw, y + h);
  ctx.stroke();
}

function formatCell(
  v: number,
  highlightRow: boolean,
  highlightCol: boolean
): string {
  if (Math.abs(v) < 0.0001) return "0";
  if (Number.isInteger(v)) return v.toString();
  return v.toFixed(2);
}

// ── Grid transformation helpers ──────────────────────────────────────────

function transformPoint(
  x: number,
  y: number,
  M: Matrix
): { x: number; y: number } {
  return {
    x: M[0][0] * x + M[0][1] * y,
    y: M[1][0] * x + M[1][1] * y,
  };
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  label: string
) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLen = 10;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Arrowhead
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - headLen * Math.cos(angle - Math.PI / 6),
    to.y - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    to.x - headLen * Math.cos(angle + Math.PI / 6),
    to.y - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.fillStyle = color;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  const lx = to.x + 12 * Math.cos(angle);
  const ly = to.y + 12 * Math.sin(angle);
  ctx.fillText(label, lx, ly);
}

// ── Component ────────────────────────────────────────────────────────────

export default function MatrixMultiplication({
  compact,
}: {
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const animTimeRef = useRef(0);
  const stepIndexRef = useRef(0);
  const prevAnimStepRef = useRef(-1);

  const [size, setSize] = useState<MatrixSize>(2);
  const [preset, setPreset] = useState("identity");
  const [animating, setAnimating] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [theta, setTheta] = useState(0);
  const [k, setK] = useState(0);
  const [sx, setSx] = useState(1.5);
  const [sy, setSy] = useState(0.5);
  const [viewMode, setViewMode] = useState<"dot" | "grid" | "both">("both");
  const [currentRow, setCurrentRow] = useState(-1);
  const [currentCol, setCurrentCol] = useState(-1);
  const [resultDone, setResultDone] = useState<boolean[][]>([]);
  const [resultMatrix, setResultMatrix] = useState<Matrix>([]);
  const [totalSteps, setTotalSteps] = useState(4);

  // Canvas draws for non-compact mode with proper ref syncing
  const sizeRef = useRef(size);
  const presetRef = useRef(preset);
  const animatingRef = useRef(animating);
  const speedRef = useRef(speed);
  const thetaRef = useRef(theta);
  const kRef = useRef(k);
  const sxRef = useRef(sx);
  const syRef = useRef(sy);
  const viewModeRef = useRef(viewMode);
  const currentRowRef = useRef(currentRow);
  const currentColRef = useRef(currentCol);
  const resultDoneRef = useRef(resultDone);
  const resultMatrixRef = useRef(resultMatrix);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);
  useEffect(() => {
    animatingRef.current = animating;
  }, [animating]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    thetaRef.current = theta;
  }, [theta]);
  useEffect(() => {
    kRef.current = k;
  }, [k]);
  useEffect(() => {
    sxRef.current = sx;
  }, [sx]);
  useEffect(() => {
    syRef.current = sy;
  }, [sy]);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);
  useEffect(() => {
    currentRowRef.current = currentRow;
  }, [currentRow]);
  useEffect(() => {
    currentColRef.current = currentCol;
  }, [currentCol]);
  useEffect(() => {
    resultDoneRef.current = resultDone;
  }, [resultDone]);
  useEffect(() => {
    resultMatrixRef.current = resultMatrix;
  }, [resultMatrix]);

  // Compute current A and B matrices from state
  const getMatrices = useCallback((): { A: Matrix; B: Matrix } => {
    const sz = sizeRef.current;
    const p = presetRef.current;
    if (p === "rotation") {
      const t = thetaRef.current;
      const R = buildRotationMatrix(t);
      const B: Matrix =
        sz === 2
          ? [
              [1, 0],
              [0, 1],
            ]
          : identity3();
      return { A: R, B };
    }
    if (p === "shear") {
      const sh = buildShearMatrix(kRef.current);
      const B: Matrix =
        sz === 2
          ? [
              [1, 0],
              [0, 1],
            ]
          : identity3();
      return { A: sh, B };
    }
    if (p === "scale") {
      const S = buildScaleMatrix(sxRef.current, syRef.current);
      const B: Matrix =
        sz === 2
          ? [
              [1, 0],
              [0, 1],
            ]
          : identity3();
      return { A: S, B };
    }
    if (p === "custom") {
      if (sz === 2)
        return {
          A: [
            [2, 1],
            [1, 2],
          ],
          B: [
            [3, 1],
            [2, 1],
          ],
        };
      return {
        A: [
          [2, 1, 0],
          [1, 2, 1],
          [0, 1, 2],
        ],
        B: [
          [3, 1, 0],
          [2, 1, 0],
          [1, 0, 1],
        ],
      };
    }
    // identity or reflection
    if (p === "reflection") {
      if (sz === 2)
        return {
          A: [
            [-1, 0],
            [0, 1],
          ],
          B: [
            [1, 2],
            [3, 4],
          ],
        };
      return {
        A: [
          [-1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        B: identity3(),
      };
    }
    // identity
    if (sz === 2)
      return {
        A: [
          [1, 0],
          [0, 1],
        ],
        B: [
          [1, 2],
          [3, 4],
        ],
      };
    return { A: identity3(), B: identity3() };
  }, []);

  const computeResult = useCallback((A: Matrix, B: Matrix): Matrix => {
    if (A.length === 0 || B.length === 0) return [];
    return matMul(A, B);
  }, []);

  // Advance animation by one step
  const advanceStep = useCallback(() => {
    const { A, B } = getMatrices();
    if (A.length === 0 || B.length === 0) return;
    const rows = A.length;
    const cols = B[0].length;
    const steps = rows * cols;
    const idx = stepIndexRef.current;
    if (idx >= steps) {
      stepIndexRef.current = 0;
      setCurrentRow(-1);
      setCurrentCol(-1);
      setResultDone(
        Array.from({ length: rows }, () => Array(cols).fill(false))
      );
      return;
    }
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    setCurrentRow(r);
    setCurrentCol(c);
    const newDone = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (let i = 0; i < idx; i++) {
      const rr = Math.floor(i / cols);
      const cc = i % cols;
      newDone[rr][cc] = true;
    }
    setResultDone(newDone);

    const R = computeResult(A, B);
    setResultMatrix(R);
    stepIndexRef.current = idx + 1;
  }, [getMatrices, computeResult]);

  // Initialize result matrix on mount and preset change
  useEffect(() => {
    const { A, B } = getMatrices();
    if (A.length === 0) return;
    const R = computeResult(A, B);
    setResultMatrix(R);
    const rows = A.length;
    const cols = B[0].length;
    setTotalSteps(rows * cols);
    setResultDone(
      Array.from({ length: rows }, () => Array(cols).fill(false))
    );
    setCurrentRow(-1);
    setCurrentCol(-1);
    stepIndexRef.current = 0;
    animTimeRef.current = 0;
  }, [preset, size, getMatrices, computeResult]);

  // Compact mode auto-plays
  useEffect(() => {
    if (!compact) return;
    const interval = setInterval(() => {
      advanceStep();
    }, 1500);
    return () => clearInterval(interval);
  }, [compact, advanceStep]);

  // ── Main draw loop ──────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 300 : 550),
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

    const dt = 0.016;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const sz = sizeRef.current;
      const vm = viewModeRef.current;
      const cr = currentRowRef.current;
      const cc = currentColRef.current;
      const done = resultDoneRef.current;
      const R = resultMatrixRef.current;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      // Animate step timing when animating
      if (animatingRef.current && !compact) {
        animTimeRef.current += dt * speedRef.current;
        const interval = 1.2;
        if (animTimeRef.current >= interval) {
          animTimeRef.current = 0;
          advanceStep();
        }
      }

      const A = getMatrices().A;
      const B = getMatrices().B;
      if (A.length === 0 || B.length === 0) return;

      const showDot = vm === "dot" || vm === "both";
      const showGrid = vm === "grid" || vm === "both";

      if (showDot) {
        drawMatrixView(
          ctx,
          w,
          h,
          A,
          B,
          R,
          cr,
          cc,
          done,
          sz,
          compact ? 0.7 : 1,
          0,
          showGrid
        );
      }

      if (showGrid && sz === 2) {
        drawGridTransform(ctx, w, h, A, compact ? 0.7 : 1, showDot);
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, advanceStep, getMatrices]);

  // ── Drawing functions ───────────────────────────────────────────────────

  function drawMatrixView(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    A: Matrix,
    B: Matrix,
    R: Matrix,
    cr: number,
    cc: number,
    done: boolean[][],
    sz: MatrixSize,
    scale: number,
    offsetX: number = 0,
    showGrid_: boolean = false
  ) {
    const s = scale;
    const rows = A.length;
    const cols = B[0].length;
    const cellW = 44 * s;
    const cellH = 32 * s;
    const gap = 4 * s;

    // Layout:  [A]  ×  [B]  =  [R]
    const matricesW =
      cellW * sz + gap * (sz - 1) + 2 * 8 * s + // bracket padding
      16 * s + // gap between brackets
      cellW * cols + gap * (cols - 1) + 2 * 8 * s +
      24 * s + // "=" sign space
      cellW * cols + gap * (cols - 1) + 2 * 8 * s;

    let startX = (w - matricesW) / 2 + offsetX;
    const matrixY = 20 * s;

    if (showGrid_) {
      startX = 16 * s;
    }

    // ── Matrix A ──
    const aW = cellW * sz + gap * (sz - 1);
    const aH = cellH * sz + gap * (sz - 1);
    drawBracket(ctx, startX, matrixY, aW + 2 * 8 * s, aH + 2 * 8 * s);
    const aOX = startX + 8 * s;
    const aOY = matrixY + 8 * s;
    for (let i = 0; i < sz; i++) {
      for (let j = 0; j < sz; j++) {
        const cx = aOX + j * (cellW + gap);
        const cy = aOY + i * (cellH + gap);
        const v = A[i]?.[j] ?? 0;
        const isRow = i === cr && cr >= 0;
        const isCol = j === cc && cc >= 0;

        ctx.fillStyle = isRow
          ? "rgba(245,158,11,0.25)"
          : isCol
            ? "rgba(6,182,212,0.15)"
            : "rgba(255,255,255,0.04)";
        ctx.fillRect(cx, cy, cellW, cellH);

        if (isRow) {
          ctx.strokeStyle = "rgba(245,158,11,0.6)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx, cy, cellW, cellH);
        }

        ctx.fillStyle = isRow
          ? "#f59e0b"
          : isCol
            ? "#06b6d4"
            : "rgba(255,255,255,0.5)";
        ctx.font = `${13 * s}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(formatCell(v, isRow, isCol), cx + cellW / 2, cy + cellH / 2);
      }
    }

    // ── × sign ──
    const timesX = startX + aW + 2 * 8 * s + 8 * s;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `${16 * s}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("×", timesX, matrixY + aH / 2);

    // ── Matrix B ──
    const bSX = timesX + 12 * s;
    const bW = cellW * cols + gap * (cols - 1);
    const bH = cellH * sz + gap * (sz - 1);
    drawBracket(ctx, bSX, matrixY, bW + 2 * 8 * s, bH + 2 * 8 * s);
    const bOX = bSX + 8 * s;
    const bOY = matrixY + 8 * s;
    for (let i = 0; i < sz; i++) {
      for (let j = 0; j < cols; j++) {
        const cx = bOX + j * (cellW + gap);
        const cy = bOY + i * (cellH + gap);
        const v = B[i]?.[j] ?? 0;
        const isCol = i === cr && cr >= 0;
        const isRow = j === cc && cc >= 0;

        ctx.fillStyle = isRow
          ? "rgba(245,158,11,0.15)"
          : isCol
            ? "rgba(6,182,212,0.25)"
            : "rgba(255,255,255,0.04)";
        ctx.fillRect(cx, cy, cellW, cellH);

        if (isCol) {
          ctx.strokeStyle = "rgba(6,182,212,0.6)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx, cy, cellW, cellH);
        }

        ctx.fillStyle = isCol
          ? "#06b6d4"
          : isRow
            ? "#f59e0b"
            : "rgba(255,255,255,0.5)";
        ctx.font = `${13 * s}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(formatCell(v, isRow, isCol), cx + cellW / 2, cy + cellH / 2);
      }
    }

    // ── = sign ──
    const eqX = bSX + bW + 2 * 8 * s + 12 * s;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `${16 * s}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("=", eqX, matrixY + bH / 2);

    // ── Result Matrix R ──
    const rSX = eqX + 12 * s;
    const rW = cellW * cols + gap * (cols - 1);
    const rH = cellH * sz + gap * (sz - 1);
    drawBracket(ctx, rSX, matrixY, rW + 2 * 8 * s, rH + 2 * 8 * s);
    const rOX = rSX + 8 * s;
    const rOY = matrixY + 8 * s;
    for (let i = 0; i < sz; i++) {
      for (let j = 0; j < cols; j++) {
        const cx = rOX + j * (cellW + gap);
        const cy = rOY + i * (cellH + gap);
        const isDone = done[i]?.[j] ?? false;
        const isComputing = i === cr && j === cc;
        const v = R[i]?.[j] ?? 0;

        if (isComputing) {
          // Pulsing glow
          const pulse = 0.5 + 0.5 * Math.sin(animTimeRef.current * 8);
          ctx.fillStyle = `rgba(6,182,212,${0.2 + 0.3 * pulse})`;
          ctx.fillRect(cx, cy, cellW, cellH);
          ctx.strokeStyle = `rgba(6,182,212,${0.4 + 0.4 * pulse})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(cx, cy, cellW, cellH);

          // Dot product label
          const dp = dotProduct(A, B, i, j);
          ctx.fillStyle = "#06b6d4";
          ctx.font = `bold ${12 * s}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`= ${formatCell(dp, false, false)}`, cx + cellW / 2, cy + cellH / 2);
        } else if (isDone) {
          const t = animTimeRef.current;
          const fadeIn = Math.min(1, t * 2);
          ctx.fillStyle = `rgba(16,185,129,${0.15 * fadeIn})`;
          ctx.fillRect(cx, cy, cellW, cellH);
          ctx.strokeStyle = `rgba(16,185,129,${0.4 * fadeIn})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, cellW, cellH);
          ctx.fillStyle = `rgba(16,185,129,${fadeIn})`;
          ctx.font = `${13 * s}px monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const display = formatCell(v, false, false);
          const scaleAnim = 0.8 + 0.2 * Math.min(1, t * 3);
          ctx.save();
          ctx.translate(cx + cellW / 2, cy + cellH / 2);
          ctx.scale(scaleAnim, scaleAnim);
          ctx.fillText(display, 0, 0);
          ctx.restore();
        }
      }
    }
  }

  function drawGridTransform(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    A: Matrix,
    scale: number,
    showDot: boolean
  ) {
    const s = scale;
    const gridDim = 5;
    const cellSize = 26 * s;
    const originX = showDot ? w / 2 + 40 * s : 60 * s;
    const originY = h / 2 + 30 * s;
    const gridPixelSize = gridDim * cellSize;

    // ── Label ──
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = `10px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    if (showDot) {
      ctx.fillText("Grid Transformation", w / 2, h - 18 * s);
    } else {
      ctx.fillText("Grid Transformation", w / 2, 8 * s);
    }

    // ── Draw original grid (faint) ──
    const origOpacity = 0.15;
    ctx.strokeStyle = `rgba(255,255,255,${origOpacity})`;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridDim; i++) {
      const x = originX + i * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, originY);
      ctx.lineTo(x, originY - gridPixelSize);
      ctx.stroke();
    }
    for (let i = 0; i <= gridDim; i++) {
      const y = originY - i * cellSize;
      ctx.beginPath();
      ctx.moveTo(originX, y);
      ctx.lineTo(originX + gridPixelSize, y);
      ctx.stroke();
    }

    // ── Draw transformed grid ──
    const gridPoints: { x: number; y: number }[][] = [];
    for (let i = 0; i <= gridDim; i++) {
      const row: { x: number; y: number }[] = [];
      for (let j = 0; j <= gridDim; j++) {
        const px = j * cellSize;
        const py = i * cellSize;
        const t = transformPoint(px, py, A);
        row.push({ x: originX + t.x, y: originY - t.y });
      }
      gridPoints.push(row);
    }

    ctx.strokeStyle = "rgba(16,185,129,0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridDim; i++) {
      for (let j = 0; j <= gridDim; j++) {
        if (j < gridDim) {
          ctx.beginPath();
          ctx.moveTo(gridPoints[i][j].x, gridPoints[i][j].y);
          ctx.lineTo(gridPoints[i][j + 1].x, gridPoints[i][j + 1].y);
          ctx.stroke();
        }
        if (i < gridDim) {
          ctx.beginPath();
          ctx.moveTo(gridPoints[i][j].x, gridPoints[i][j].y);
          ctx.lineTo(gridPoints[i + 1][j].x, gridPoints[i + 1][j].y);
          ctx.stroke();
        }
      }
    }

    // ── Fill unit square ──
    ctx.fillStyle = "rgba(139,92,246,0.08)";
    ctx.beginPath();
    ctx.moveTo(gridPoints[0][0].x, gridPoints[0][0].y);
    ctx.lineTo(gridPoints[0][1].x, gridPoints[0][1].y);
    ctx.lineTo(gridPoints[1][1].x, gridPoints[1][1].y);
    ctx.lineTo(gridPoints[1][0].x, gridPoints[1][0].y);
    ctx.closePath();
    ctx.fill();

    // ── Basis vectors ──
    const originPt = gridPoints[0][0];
    // î
    const iPt = gridPoints[0][1];
    drawArrow(
      ctx,
      originPt,
      { x: originX + cellSize, y: originY },
      "rgba(255,255,255,0.25)",
      "î"
    );
    // ĵ
    const jPt = gridPoints[1][0];
    drawArrow(
      ctx,
      originPt,
      { x: originX, y: originY - cellSize },
      "rgba(255,255,255,0.25)",
      "ĵ"
    );

    // ── Transformed basis vectors ──
    const tiPt = gridPoints[0][1];
    const tjPt = gridPoints[1][0];
    drawArrow(ctx, originPt, tiPt, "#8b5cf6", "î'");
    drawArrow(ctx, originPt, tjPt, "#8b5cf6", "ĵ'");

    // ── Matrix label ──
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = `9px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const labelY = showDot ? h - 4 * s : h - 8 * s;
    ctx.fillText(
      `det=${det.toFixed(2)}  |  [${A[0][0].toFixed(1)} ${A[0][1].toFixed(1)}; ${A[1][0].toFixed(1)} ${A[1][1].toFixed(1)}]`,
      originX,
      labelY
    );
  }

  // ── Event handlers ──────────────────────────────────────────────────────

  const handlePlayPause = useCallback(() => {
    setAnimating((v) => !v);
    animTimeRef.current = 0;
  }, []);

  const handleStep = useCallback(() => {
    advanceStep();
    animTimeRef.current = 0;
  }, [advanceStep]);

  const handleReset = useCallback(() => {
    stepIndexRef.current = 0;
    setCurrentRow(-1);
    setCurrentCol(-1);
    const { A, B } = getMatrices();
    if (A.length > 0) {
      setResultDone(
        Array.from({ length: A.length }, () =>
          Array(B[0].length).fill(false)
        )
      );
      setResultMatrix(computeResult(A, B));
    }
    setAnimating(false);
    animTimeRef.current = 0;
  }, [getMatrices, computeResult]);

  const applyPreset = useCallback(
    (key: string) => {
      setPreset(key);
      if (key === "rotation") setSize(2);
      else if (key === "shear") setSize(2);
      else if (key === "scale") setSize(2);
      stepIndexRef.current = 0;
      setCurrentRow(-1);
      setCurrentCol(-1);
      setAnimating(false);
      animTimeRef.current = 0;
    },
    []
  );

  const handleSetCell = useCallback(
    (matrix: "A" | "B", row: number, col: number, value: number) => {
      setPreset("custom");
      // Update cell values is done via the presets — for custom mode
      // we just store the last-edited values through the override mechanism
    },
    []
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        data-testid="matrix-canvas"
      />
      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          {/* Media controls row */}
          <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2 bg-bg-secondary/60 backdrop-blur-sm border-t border-border/30 text-[11px] font-mono">
            <select
              value={preset}
              onChange={(e) => applyPreset(e.target.value)}
              className="bg-transparent border border-border/40 rounded px-2 py-1 text-text-secondary text-[11px] cursor-pointer hover:border-amber-500/30 outline-none"
              data-testid="preset-select"
            >
              {Object.entries(PRESETS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>

            {preset === "rotation" && (
              <label className="flex items-center gap-1 text-text-secondary/70">
                θ:
                <input
                  type="range"
                  min={0}
                  max={6.28}
                  step={0.05}
                  value={theta}
                  onChange={(e) => setTheta(parseFloat(e.target.value))}
                  className="w-16 accent-amber-500"
                />
              </label>
            )}

            {preset === "shear" && (
              <label className="flex items-center gap-1 text-text-secondary/70">
                k:
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={k}
                  onChange={(e) => setK(parseFloat(e.target.value))}
                  className="w-16 accent-amber-500"
                />
              </label>
            )}

            {preset === "scale" && (
              <>
                <label className="flex items-center gap-1 text-text-secondary/70">
                  sx:
                  <input
                    type="range"
                    min={0.2}
                    max={3}
                    step={0.05}
                    value={sx}
                    onChange={(e) => setSx(parseFloat(e.target.value))}
                    className="w-16 accent-amber-500"
                  />
                </label>
                <label className="flex items-center gap-1 text-text-secondary/70">
                  sy:
                  <input
                    type="range"
                    min={0.2}
                    max={3}
                    step={0.05}
                    value={sy}
                    onChange={(e) => setSy(parseFloat(e.target.value))}
                    className="w-16 accent-amber-500"
                  />
                </label>
              </>
            )}

            <span className="w-px h-4 bg-border/40" />

            <button
              onClick={handlePlayPause}
              className={`px-2 py-1 rounded text-[11px] transition-all border ${
                animating
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
              data-testid="play-btn"
            >
              {animating ? "⏸ Pause" : "▶ Play"}
            </button>

            <button
              onClick={handleStep}
              className="px-2 py-1 rounded text-[11px] bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              data-testid="step-btn"
            >
              ⏭ Step
            </button>

            <button
              onClick={handleReset}
              className="px-2 py-1 rounded text-[11px] bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-red-500/30 transition-all"
            >
              ↺ Reset
            </button>

            <label className="flex items-center gap-1 text-text-secondary/70">
              Speed:
              <input
                type="range"
                min={0.25}
                max={4}
                step={0.25}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
                data-testid="speed-slider"
              />
            </label>
          </div>

          {/* View mode and size row */}
          <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 bg-bg-secondary/40 backdrop-blur-sm border-t border-border/20 text-[11px] font-mono">
            <span className="text-text-secondary/50">View:</span>
            {(["dot", "grid", "both"] as const).map((vm) => (
              <button
                key={vm}
                onClick={() => setViewMode(vm)}
                className={`px-2 py-0.5 rounded text-[11px] transition-all border ${
                  viewMode === vm
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-cyan-500/30"
                }`}
                data-testid={`view-${vm}`}
              >
                {vm === "dot"
                  ? "Dot Product"
                  : vm === "grid"
                    ? "Grid Transform"
                    : "Both"}
              </button>
            ))}

            <span className="w-px h-4 bg-border/40" />

            <span className="text-text-secondary/50">Size:</span>
            {([2, 3] as MatrixSize[]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setSize(s);
                  stepIndexRef.current = 0;
                  setCurrentRow(-1);
                  setCurrentCol(-1);
                  setAnimating(false);
                  animTimeRef.current = 0;
                }}
                className={`px-2 py-0.5 rounded text-[11px] transition-all border ${
                  size === s
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {s}×{s}
              </button>
            ))}

            {currentRow >= 0 && currentCol >= 0 && (
              <span className="text-cyan-400/70 text-[10px]">
                Computing R[{currentRow},{currentCol}]
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
