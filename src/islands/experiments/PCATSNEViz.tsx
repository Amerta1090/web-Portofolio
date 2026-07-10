import { useRef, useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Props {
  compact?: boolean;
}

type PCAStep = "center" | "covariance" | "eigenvectors" | "project";

interface ClusterConfig {
  count: number;
  dims: number;
  pointsPerCluster: number;
}

/* ------------------------------------------------------------------ */
/*  Math helpers                                                      */
/* ------------------------------------------------------------------ */

function randn(): number {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length, n = A[0].length, p = B[0].length;
  const out: number[][] = Array.from({ length: m }, () => new Array(p).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < p; j++)
      for (let k = 0; k < n; k++)
        out[i][j] += A[i][k] * B[k][j];
  return out;
}

function matT(M: number[][]): number[][] {
  const r = M.length, c = M[0].length;
  return Array.from({ length: c }, (_, j) => Array.from({ length: r }, (_, i) => M[i][j]));
}

function matScale(M: number[][], s: number): number[][] {
  return M.map(row => row.map(v => v * s));
}

function vecSub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - (b[i] ?? 0));
}

function vecNorm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function vecDot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
}

function makeIdentity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => {
    const row = new Array(n).fill(0);
    row[i] = 1;
    return row;
  });
}

/* ------------------------------------------------------------------ */
/*  Cluster generation                                                */
/* ------------------------------------------------------------------ */

function generateClusters(cfg: ClusterConfig): {
  data: number[][];
  labels: number[];
  clusterCenters: number[][];
} {
  const { count, dims, pointsPerCluster } = cfg;
  const total = count * pointsPerCluster;
  const data: number[][] = new Array(total);
  const labels: number[] = new Array(total);
  const clusterCenters: number[][] = [];

  for (let c = 0; c < count; c++) {
    // Random cluster center in [-5, 5]^dims
    const center = Array.from({ length: dims }, () => (Math.random() - 0.5) * 10);
    clusterCenters.push(center);
    const spread = 0.5 + Math.random() * 1.0; // per-cluster variance
    for (let p = 0; p < pointsPerCluster; p++) {
      const idx = c * pointsPerCluster + p;
      const point = center.map(mu => mu + randn() * spread);
      data[idx] = point;
      labels[idx] = c;
    }
  }
  return { data, labels, clusterCenters };
}

/* ------------------------------------------------------------------ */
/*  PCA Implementation                                                */
/* ------------------------------------------------------------------ */

function centerData(data: number[][]): { centered: number[][]; mean: number[] } {
  const n = data.length;
  const dims = data[0].length;
  const mean = new Array(dims).fill(0);
  for (const row of data) {
    for (let d = 0; d < dims; d++) mean[d] += row[d] / n;
  }
  const centered = data.map(row => vecSub(row, mean));
  return { centered, mean };
}

function computeCovariance(centered: number[][]): number[][] {
  const n = centered.length;
  const dims = centered[0].length;
  const cov: number[][] = Array.from({ length: dims }, () => new Array(dims).fill(0));
  for (const row of centered) {
    for (let i = 0; i < dims; i++) {
      for (let j = 0; j < dims; j++) {
        cov[i][j] += (row[i] * row[j]) / (n - 1);
      }
    }
  }
  return cov;
}

/** Power iteration to compute top-k eigenvalues/eigenvectors of a symmetric matrix */
function powerIterate(
  mat: number[][],
  k: number,
  maxIter = 200,
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = mat.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];

  // Deflate and find each eigenvector
  let M = mat.map(row => [...row]);

  for (let ev = 0; ev < k; ev++) {
    let v = Array.from({ length: n }, () => randn());
    let prevLambda = 0;
    for (let iter = 0; iter < maxIter; iter++) {
      // Normalize
      const norm = vecNorm(v);
      v = v.map(x => x / (norm + 1e-15));
      // Multiply M * v
      const Mv = new Array(n).fill(0);
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          Mv[i] += M[i][j] * v[j];
      // Rayleigh quotient
      const lambda = vecDot(Mv, v);
      v = Mv;
      if (Math.abs(lambda - prevLambda) < 1e-8) break;
      prevLambda = lambda;
    }
    const norm = vecNorm(v);
    v = v.map(x => x / (norm + 1e-15));
    eigenvalues.push(Math.abs(prevLambda));
    eigenvectors.push([...v]);

    // Deflate: M = M - λ * v * v^T
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        M[i][j] -= prevLambda * v[i] * v[j];
      }
    }
  }

  return { eigenvalues, eigenvectors };
}

function projectPCA(
  centered: number[][],
  eigenvectors: number[][],
): number[][] {
  // Project onto first 2 eigenvectors → 2D
  const proj = centered.map(row => [
    vecDot(row, eigenvectors[0]),
    vecDot(row, eigenvectors[1]),
  ]);
  return proj;
}

/* ------------------------------------------------------------------ */
/*  Simplified t-SNE Implementation                                   */
/* ------------------------------------------------------------------ */

function computePairwiseDistSq(data: number[][]): number[][] {
  const n = data.length;
  const D: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d2 = data[i].reduce((s, v, k) => s + (v - data[j][k]) ** 2, 0);
      D[i][j] = d2;
      D[j][i] = d2;
    }
  }
  return D;
}

/** Binary search for sigma that gives target perplexity */
function binarySearchSigma(
  distRow: number[],
  targetPerp: number,
  maxIter = 50,
): number {
  let lo = 1e-10, hi = 100;
  for (let iter = 0; iter < maxIter; iter++) {
    const mid = (lo + hi) / 2;
    let sumP = 0;
    for (let j = 0; j < distRow.length; j++) {
      if (j === 0) continue; // skip self (index 0 is self in our usage)
      sumP += Math.exp(-distRow[j] / (mid + 1e-15));
    }
    const H = Math.log(sumP + 1e-15) + (sumP > 0 ? (1 / (sumP + 1e-15)) * distRow.reduce((s, d, j) => {
      if (j === 0) return s;
      return s + (d / (mid + 1e-15)) * Math.exp(-d / (mid + 1e-15));
    }, 0) : 0);
    const perp = Math.exp(H);
    if (perp > targetPerp) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

function computeP(
  data: number[][],
  perplexity: number,
): number[][] {
  const n = data.length;
  const D = computePairwiseDistSq(data);
  const P: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    const distRow = [0].concat(D[i].filter((_, j) => j !== i));
    const sigma = binarySearchSigma(distRow, perplexity);
    let sum = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      P[i][j] = Math.exp(-D[i][j] / (sigma + 1e-15));
      sum += P[i][j];
    }
    if (sum > 0) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        P[i][j] /= sum;
      }
    }
  }

  // Symmetrize and normalize
  const P_sym: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      P_sym[i][j] = (P[i][j] + P[j][i]) / (2 * n);
    }
  }
  return P_sym;
}

function computeQ(y: number[][]): number[][] {
  const n = y.length;
  const Q: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let Z = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d2 = (y[i][0] - y[j][0]) ** 2 + (y[i][1] - y[j][1]) ** 2;
      const val = 1 / (1 + d2);
      Q[i][j] = val;
      Q[j][i] = val;
      Z += 2 * val;
    }
  }
  if (Z > 0) {
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        Q[i][j] /= Z;
  }
  return Q;
}

function computeTSNEGradient(
  y: number[][],
  P: number[][],
  Q: number[][],
): number[][] {
  const n = y.length;
  const grad: number[][] = Array.from({ length: n }, () => [0, 0]);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const diff = P[i][j] - Q[i][j];
      const dist = 1 + (y[i][0] - y[j][0]) ** 2 + (y[i][1] - y[j][1]) ** 2;
      const factor = 4 * diff / (dist + 1e-15);
      grad[i][0] += factor * (y[i][0] - y[j][0]);
      grad[i][1] += factor * (y[i][1] - y[j][1]);
    }
  }
  return grad;
}

const TSNE_COLORS = ["#f59e0b", "#06b6d4", "#8b5cf6", "#10b981"];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const CLUSTER_COLORS = ["#f59e0b", "#06b6d4", "#8b5cf6", "#10b981"];
const PCA_COLOR = "#f59e0b";
const TSNE_COLOR = "#06b6d4";

export default function PCATSNEViz({ compact }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Data
  const [clusterCount, setClusterCount] = useState(3);
  const [dims, setDims] = useState(5);
  const [pointsPerCluster] = useState(50);

  // PCA state
  const [pcaStep, setPCAStep] = useState<PCAStep>("center");
  const [showCovHeatmap, setShowCovHeatmap] = useState(true);
  const [showExplainedVariance, setShowExplainedVariance] = useState(true);
  const [pcaProjected, setPCAProjected] = useState<number[][]>([]);
  const [explainedVariance, setExplainedVariance] = useState<number[]>([]);

  // t-SNE state
  const [perplexity, setPerplexity] = useState(30);
  const [tsneRunning, setTsneRunning] = useState(false);
  const [tsneSpeed, setTsneSpeed] = useState(1);
  const [tsneIter, setTsneIter] = useState(0);
  const [tsnePositions, setTsnePositions] = useState<number[][]>([]);
  const [tsneData, setTsneData] = useState<{ P: number[][]; labels: number[] } | null>(null);

  // Shared data
  const [data, setData] = useState<number[][]>([]);
  const [labels, setLabels] = useState<number[]>([]);
  const [mean, setMean] = useState<number[]>([]);
  const [centered, setCentered] = useState<number[][]>([]);
  const [covMatrix, setCovMatrix] = useState<number[][]>([]);
  const [eigenvalues, setEigenvalues] = useState<number[]>([]);
  const [eigenvectors, setEigenvectors] = useState<number[][]>([]);

  const totalPoints = clusterCount * pointsPerCluster;

  /* ---- Generate fresh data ---- */
  const generateData = useCallback(() => {
    const cfg: ClusterConfig = { count: clusterCount, dims, pointsPerCluster };
    const { data: raw, labels: lbls } = generateClusters(cfg);

    // Center
    const { centered: c, mean: m } = centerData(raw);
    // Covariance
    const cov = computeCovariance(c);
    // Eigen-decompose
    const maxK = Math.min(dims, 5);
    const { eigenvalues: evals, eigenvectors: evecs } = powerIterate(cov, maxK);

    // Explained variance
    const totalVar = evals.reduce((s, v) => s + v, 0);
    const evRatios = evals.map(v => v / (totalVar + 1e-15));

    // PCA project to 2D
    const proj = projectPCA(c, evecs);

    // t-SNE init from PCA result
    const initY = proj.map(p => [p[0] + (Math.random() - 0.5) * 0.1, p[1] + (Math.random() - 0.5) * 0.1]);

    setData(raw);
    setLabels(lbls);
    setMean(m);
    setCentered(c);
    setCovMatrix(cov);
    setEigenvalues(evals);
    setEigenvectors(evecs);
    setExplainedVariance(evRatios);
    setPCAProjected(proj);
    setTsnePositions(initY);
    setTsneIter(0);
    setTsneRunning(false);
    setPCAStep("center");

    // Pre-compute P matrix for t-SNE (computationally expensive)
    const P = computeP(raw, perplexity);
    setTsneData({ P, labels: lbls });
  }, [clusterCount, dims, pointsPerCluster, perplexity]);

  /* ---- Initialize data on mount ---- */
  useEffect(() => {
    generateData();
  }, []);

  /* ---- PCA step animation ---- */
  useEffect(() => {
    if (compact) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || data.length === 0) return;

    const W = canvas.width;
    const H = canvas.height;
    const leftW = Math.floor(W * 0.48);
    const rightW = W - leftW;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0f0f11";
    ctx.fillRect(0, 0, W, H);

    // Draw divider
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftW, 0);
    ctx.lineTo(leftW, H);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("PCA Projection", leftW / 2, 8);
    ctx.fillText("t-SNE Embedding", leftW + rightW / 2, 8);

    // Draw PCA side
    drawPCASide(ctx, 0, 30, leftW, H - 30, pcaStep);

    // Draw t-SNE side
    drawTSNESide(ctx, leftW, 30, rightW, H - 30);

    // Draw explained variance if enabled
    if (showExplainedVariance && explainedVariance.length > 0) {
      drawExplainedVariance(
        ctx,
        leftW - 120,
        H - 70,
        110,
        55,
        explainedVariance,
      );
    }
  }, [data, labels, centered, covMatrix, eigenvalues, eigenvectors, pcaProjected, pcaStep, showCovHeatmap, showExplainedVariance, tsnePositions, tsneIter, explainedVariance, compact]);

  /* ---- Compact mode rendering ---- */
  useEffect(() => {
    if (!compact) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || data.length === 0) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f0f11";
    ctx.fillRect(0, 0, W, H);

    // In compact mode, show both PCA and t-SNE side by side
    const halfW = Math.floor(W / 2);

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(halfW, H);
    ctx.stroke();

    // Draw compact PCA
    drawPCASide(ctx, 0, 0, halfW, H, "project");

    // Draw compact t-SNE
    drawTSNESide(ctx, halfW, 0, W - halfW, H);
  }, [data, labels, pcaProjected, tsnePositions, compact]);

  /* ---- Drawing helpers ---- */

  function drawScatter(
    ctx: CanvasRenderingContext2D,
    points: number[][],
    labels: number[],
    ox: number,
    oy: number,
    scale: number,
    colors: string[],
  ) {
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      const px = ox + x * scale;
      const py = oy - y * scale;
      const color = colors[labels[i] % colors.length];
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPCASide(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    w: number,
    h: number,
    step: PCAStep,
  ) {
    const cx = ox + w / 2;
    const cy = oy + h / 2;
    const scale = Math.min(w, h) * 0.35;

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ox + 10, cy);
    ctx.lineTo(ox + w - 10, cy);
    ctx.moveTo(cx, oy + 10);
    ctx.lineTo(cx, oy + h - 10);
    ctx.stroke();

    if (step === "center" && centered.length > 0) {
      // Show raw data in original high-D (first 2 dims as fallback)
      const raw2d = data.map(row => [row[0], row[1]]);
      drawScatter(ctx, raw2d, labels, cx, cy, scale * 0.8, CLUSTER_COLORS);

      // Overlay: show the mean
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(cx + (mean[0] ?? 0) * scale * 0.8, cy - (mean[1] ?? 0) * scale * 0.8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Mean", cx + (mean[0] ?? 0) * scale * 0.8, cy - (mean[1] ?? 0) * scale * 0.8 + 10);
    }

    if (step === "covariance" && covMatrix.length > 0) {
      // Show mean-centered data (first 2 dims)
      const centered2d = centered.map(row => [row[0], row[1]]);
      drawScatter(ctx, centered2d, labels, cx, cy, scale * 0.8, CLUSTER_COLORS);

      // Covariance heatmap on the side
      if (showCovHeatmap) {
        drawCovHeatmap(ctx, ox + w - 90, oy + 10, 70, 70, covMatrix);
      }
    }

    if (step === "eigenvectors" && eigenvectors.length > 0 && eigenvalues.length > 0) {
      const centered2d = centered.map(row => [row[0], row[1]]);
      drawScatter(ctx, centered2d, labels, cx, cy, scale * 0.8, CLUSTER_COLORS);

      // Draw eigenvectors as arrows
      const eVecLen = scale * 0.6;
      for (let k = 0; k < Math.min(eigenvectors.length, 2); k++) {
        const ev = eigenvectors[k];
        const evMag = eigenvalues[k] / (eigenvalues[0] + 1e-15);
        const ex = ev[0] ?? 0;
        const ey = ev[1] ?? 0;
        const eLen = vecNorm([ex, ey]);
        const nx = ex / (eLen + 1e-15);
        const ny = ey / (eLen + 1e-15);
        const arrowLen = eVecLen * (0.4 + 0.6 * evMag);

        ctx.strokeStyle = PCA_COLOR;
        ctx.globalAlpha = 0.6 + 0.4 * evMag;
        ctx.lineWidth = 2 + evMag * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + nx * arrowLen, cy - ny * arrowLen);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(-ny, nx);
        const headLen = 8;
        ctx.beginPath();
        ctx.moveTo(cx + nx * arrowLen, cy - ny * arrowLen);
        ctx.lineTo(cx + nx * arrowLen - headLen * Math.cos(angle - 0.4), cy - ny * arrowLen - headLen * Math.sin(angle - 0.4));
        ctx.lineTo(cx + nx * arrowLen - headLen * Math.cos(angle + 0.4), cy - ny * arrowLen - headLen * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fillStyle = PCA_COLOR;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = PCA_COLOR;
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `PC${k + 1} (${(eigenvalues[k] / (eigenvalues.reduce((a, b) => a + b, 0) + 1e-15) * 100).toFixed(0)}%)`,
          cx + nx * (arrowLen + 20),
          cy - ny * (arrowLen + 20),
        );
      }
    }

    if (step === "project" && pcaProjected.length > 0) {
      drawScatter(ctx, pcaProjected, labels, cx, cy, scale, CLUSTER_COLORS);

      // Axis labels
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("PC1", cx + scale + 10, cy + 12);
      ctx.textAlign = "left";
      ctx.fillText("PC2", cx + 4, cy - scale - 6);
    }
  }

  function drawTSNESide(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    w: number,
    h: number,
  ) {
    const cx = ox + w / 2;
    const cy = oy + h / 2;
    const scale = Math.min(w, h) * 0.35;

    // Axes
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ox + 10, cy);
    ctx.lineTo(ox + w - 10, cy);
    ctx.moveTo(cx, oy + 10);
    ctx.lineTo(cx, oy + h - 10);
    ctx.stroke();

    if (tsnePositions.length > 0) {
      // Compute bounds for centering
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of tsnePositions) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const rScale = Math.max(rangeX, rangeY);
      const s = scale * 0.9;

      for (let i = 0; i < tsnePositions.length; i++) {
        const nx = ((tsnePositions[i][0] - minX) / rScale - 0.5) * 2;
        const ny = ((tsnePositions[i][1] - minY) / rScale - 0.5) * 2;
        const px = cx + nx * s;
        const py = cy - ny * s;
        const color = TSNE_COLORS[labels[i] % TSNE_COLORS.length];
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawCovHeatmap(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    w: number,
    h: number,
    mat: number[][],
  ) {
    const n = mat.length;
    const cellW = w / n;
    const cellH = h / n;

    // Find max abs value
    let maxAbs = 0;
    for (const row of mat) {
      for (const v of row) {
        if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
      }
    }
    maxAbs = maxAbs || 1;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const val = mat[i][j] / maxAbs;
        // Blue-white-red diverging
        const r = val > 0 ? 245 : 100;
        const g = val > 0 ? Math.round(150 - Math.abs(val) * 120) : Math.round(150 - Math.abs(val) * 120);
        const b = val > 0 ? 100 : 245;
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.abs(val) * 0.6 + 0.2})`;
        ctx.fillRect(ox + j * cellW, oy + i * cellH, cellW, cellH);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(ox + j * cellW, oy + i * cellH, cellW, cellH);
      }
    }

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Cov Σ", ox + w / 2, oy + h + 10);
  }

  function drawExplainedVariance(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    w: number,
    h: number,
    ratios: number[],
  ) {
    // Background
    ctx.fillStyle = "rgba(15,15,17,0.7)";
    ctx.fillRect(ox - 5, oy - 5, w + 10, h + 10);

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Explained Variance", ox + w / 2, oy);

    const barW = w / ratios.length / 1.5;
    const maxH = h - 14;

    for (let i = 0; i < ratios.length; i++) {
      const barH = ratios[i] * maxH;
      const bx = ox + (i + 0.5) * (w / ratios.length) - barW / 2;
      const by = oy + h - 8 - barH;

      ctx.fillStyle = `hsl(${40 + i * 30}, 80%, ${50 + i * 8}%)`;
      ctx.fillRect(bx, by, barW, barH);

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`PC${i + 1}`, bx + barW / 2, oy + h - 2);
    }
  }

  /* ---- t-SNE iteration loop ---- */
  useEffect(() => {
    if (!tsneRunning || !tsneData) return;

    let running = true;
    let iterCount = tsneIter;

    function step() {
      if (!running) return;
      const td = tsneData;
      if (!td) return;

      const P = td.P;
      const Q = computeQ(tsnePositions);
      const grad = computeTSNEGradient(tsnePositions, P, Q);

      // Update with momentum
      const lr = 200 / (1 + iterCount * 0.01) * tsneSpeed;
      setTsnePositions((prev) => {
        return prev.map((pos, i) => [
          pos[0] - lr * grad[i][0],
          pos[1] - lr * grad[i][1],
        ]);
      });

      iterCount++;
      setTsneIter(iterCount);

      if (iterCount < 500 && running) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setTsneRunning(false);
      }
    }

    animRef.current = requestAnimationFrame(step);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [tsneRunning, tsneData, tsneSpeed]);

  const handlePlayPause = useCallback(() => {
    if (tsneRunning) {
      setTsneRunning(false);
    } else {
      if (tsneIter >= 500) {
        // Reset t-SNE
        setTsnePositions(pcaProjected.map(p => [p[0] + (Math.random() - 0.5) * 0.1, p[1] + (Math.random() - 0.5) * 0.1]));
        setTsneIter(0);
      }
      setTsneRunning(true);
    }
  }, [tsneRunning, tsneIter, pcaProjected]);

  const handleResetTSNE = useCallback(() => {
    setTsneRunning(false);
    setTsnePositions(pcaProjected.map(p => [p[0] + (Math.random() - 0.5) * 0.1, p[1] + (Math.random() - 0.5) * 0.1]));
    setTsneIter(0);
  }, [pcaProjected]);

  const handleStepTSNE = useCallback(() => {
    if (!tsneData) return;
    const P = tsneData.P;
    const Q = computeQ(tsnePositions);
    const grad = computeTSNEGradient(tsnePositions, P, Q);
    const lr = 200 / (1 + tsneIter * 0.01) * tsneSpeed;
    setTsnePositions(prev =>
      prev.map((pos, i) => [
        pos[0] - lr * grad[i][0],
        pos[1] - lr * grad[i][1],
      ]),
    );
    setTsneIter(i => i + 1);
  }, [tsneData, tsnePositions, tsneIter, tsneSpeed]);

  const dataLabel = `${totalPoints} pts × ${dims}D`;

  return (
    <div
      className={`relative bg-[#0f0f11] rounded-xl overflow-hidden ${
        compact ? "w-full h-full" : "w-full max-w-4xl mx-auto"
      }`}
      style={compact ? {} : { minHeight: 420 }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={compact ? 400 : 700}
        height={compact ? 250 : 380}
        className="w-full h-full"
      />

      {/* Overlay label in compact mode */}
      {compact && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-amber-400/70 whitespace-nowrap">
          PCA + t-SNE
        </div>
      )}

      {/* Controls — only when not compact */}
      {!compact && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none">
          {/* Controls panel */}
          <div className="mx-2 mb-2 p-2 pointer-events-auto rounded-lg bg-bg-secondary/60 backdrop-blur-sm border border-border/30 space-y-1.5">
            {/* Row 1: Data generation */}
            <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono">
              <button
                onClick={generateData}
                className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] hover:bg-amber-500/30 transition-colors border border-amber-500/30"
              >
                Generate New Data ⚡
              </button>

              <span className="text-text-secondary/50">{dataLabel}</span>

              <label className="flex items-center gap-1 text-text-secondary/60">
                Clusters:
                <input
                  type="range"
                  min={2}
                  max={5}
                  value={clusterCount}
                  onChange={(e) => setClusterCount(Number(e.target.value))}
                  className="w-12 accent-amber-500"
                />
                <span className="text-amber-400 w-3">{clusterCount}</span>
              </label>

              <label className="flex items-center gap-1 text-text-secondary/60">
                Dims:
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={dims}
                  onChange={(e) => setDims(Number(e.target.value))}
                  className="w-12 accent-amber-500"
                />
                <span className="text-amber-400 w-4">{dims}</span>
              </label>
            </div>

            {/* Row 2: PCA controls */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
              <span className="text-text-secondary/50">PCA:</span>
              {(["center", "covariance", "eigenvectors", "project"] as PCAStep[]).map((step) => (
                <button
                  key={step}
                  onClick={() => setPCAStep(step)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${
                    pcaStep === step
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-bg-secondary/40 text-text-secondary/60 border border-transparent hover:text-text-secondary"
                  }`}
                >
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </button>
              ))}

              <div className="w-px h-4 bg-border/30 mx-1" />

              <label className="flex items-center gap-1 text-text-secondary/60">
                <input
                  type="checkbox"
                  checked={showCovHeatmap}
                  onChange={(e) => setShowCovHeatmap(e.target.checked)}
                  className="accent-amber-500 w-2.5 h-2.5"
                />
                Cov Σ
              </label>

              <label className="flex items-center gap-1 text-text-secondary/60">
                <input
                  type="checkbox"
                  checked={showExplainedVariance}
                  onChange={(e) => setShowExplainedVariance(e.target.checked)}
                  className="accent-amber-500 w-2.5 h-2.5"
                />
                Expl. Var
              </label>
            </div>

            {/* Row 3: t-SNE controls */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
              <span className="text-text-secondary/50">t-SNE:</span>

              <button
                onClick={handlePlayPause}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-all border ${
                  tsneRunning
                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                    : "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/30"
                }`}
              >
                {tsneRunning ? "⏸ Pause" : tsneIter >= 500 ? "⟳ Restart" : "▶ Play"}
              </button>

              <button
                onClick={handleStepTSNE}
                disabled={tsneRunning || tsneIter >= 500}
                className="px-1.5 py-0.5 rounded text-[10px] bg-bg-secondary/60 text-text-secondary/60 border border-border/30 disabled:opacity-30 hover:text-text-secondary"
              >
                Step →
              </button>

              <button
                onClick={handleResetTSNE}
                className="px-1.5 py-0.5 rounded text-[10px] bg-bg-secondary/60 text-text-secondary/60 border border-border/30 hover:text-text-secondary"
              >
                ↺ Reset
              </button>

              <label className="flex items-center gap-1 text-text-secondary/60">
                Perplexity:
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={perplexity}
                  onChange={(e) => setPerplexity(Number(e.target.value))}
                  className="w-16 accent-cyan-500"
                />
                <span className="text-cyan-400 w-5">{perplexity}</span>
              </label>

              <label className="flex items-center gap-1 text-text-secondary/60">
                Speed:
                <input
                  type="range"
                  min={0.1}
                  max={3}
                  step={0.1}
                  value={tsneSpeed}
                  onChange={(e) => setTsneSpeed(Number(e.target.value))}
                  className="w-12 accent-cyan-500"
                />
              </label>

              <span className="text-text-secondary/40">
                Iter: {tsneIter}/500
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
