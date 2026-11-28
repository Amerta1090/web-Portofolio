/** Pure math for the PCA / t-SNE lab experiment (no React, no DOM). */

export type PCAStep = "center" | "covariance" | "eigenvectors" | "project";

export interface ClusterConfig {
  count: number;
  dims: number;
  pointsPerCluster: number;
}

/* ------------------------------------------------------------------ */
/*  Math helpers                                                      */
/* ------------------------------------------------------------------ */

export function randn(): number {
  // Box-Muller transform
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length,
    n = A[0].length,
    p = B[0].length;
  const out: number[][] = Array.from({ length: m }, () => new Array(p).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < p; j++) for (let k = 0; k < n; k++) out[i][j] += A[i][k] * B[k][j];
  return out;
}

export function matT(M: number[][]): number[][] {
  const r = M.length,
    c = M[0].length;
  return Array.from({ length: c }, (_, j) => Array.from({ length: r }, (_, i) => M[i][j]));
}

export function matScale(M: number[][], s: number): number[][] {
  return M.map((row) => row.map((v) => v * s));
}

export function vecSub(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - (b[i] ?? 0));
}

export function vecNorm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

export function vecDot(a: number[], b: number[]): number {
  return a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
}

export function makeIdentity(n: number): number[][] {
  return Array.from({ length: n }, (_, i) => {
    const row = new Array(n).fill(0);
    row[i] = 1;
    return row;
  });
}

/* ------------------------------------------------------------------ */
/*  Cluster generation                                                */
/* ------------------------------------------------------------------ */

export function generateClusters(cfg: ClusterConfig): {
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
      const point = center.map((mu) => mu + randn() * spread);
      data[idx] = point;
      labels[idx] = c;
    }
  }
  return { data, labels, clusterCenters };
}

/* ------------------------------------------------------------------ */
/*  PCA Implementation                                                */
/* ------------------------------------------------------------------ */

export function centerData(data: number[][]): { centered: number[][]; mean: number[] } {
  const n = data.length;
  const dims = data[0].length;
  const mean = new Array(dims).fill(0);
  for (const row of data) {
    for (let d = 0; d < dims; d++) mean[d] += row[d] / n;
  }
  const centered = data.map((row) => vecSub(row, mean));
  return { centered, mean };
}

export function computeCovariance(centered: number[][]): number[][] {
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
export function powerIterate(
  mat: number[][],
  k: number,
  maxIter = 200,
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = mat.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];

  // Deflate and find each eigenvector
  const M = mat.map((row) => [...row]);

  for (let ev = 0; ev < k; ev++) {
    let v = Array.from({ length: n }, () => randn());
    let prevLambda = 0;
    for (let iter = 0; iter < maxIter; iter++) {
      // Normalize
      const norm = vecNorm(v);
      v = v.map((x) => x / (norm + 1e-15));
      // Multiply M * v
      const Mv = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Mv[i] += M[i][j] * v[j];
      // Rayleigh quotient
      const lambda = vecDot(Mv, v);
      v = Mv;
      if (Math.abs(lambda - prevLambda) < 1e-8) break;
      prevLambda = lambda;
    }
    const norm = vecNorm(v);
    v = v.map((x) => x / (norm + 1e-15));
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

export function projectPCA(centered: number[][], eigenvectors: number[][]): number[][] {
  // Project onto first 2 eigenvectors → 2D
  const proj = centered.map((row) => [vecDot(row, eigenvectors[0]), vecDot(row, eigenvectors[1])]);
  return proj;
}

/* ------------------------------------------------------------------ */
/*  Simplified t-SNE Implementation                                   */
/* ------------------------------------------------------------------ */

export function computePairwiseDistSq(data: number[][]): number[][] {
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
export function binarySearchSigma(distRow: number[], targetPerp: number, maxIter = 50): number {
  let lo = 1e-10,
    hi = 100;
  for (let iter = 0; iter < maxIter; iter++) {
    const mid = (lo + hi) / 2;
    let sumP = 0;
    for (let j = 0; j < distRow.length; j++) {
      if (j === 0) continue; // skip self (index 0 is self in our usage)
      sumP += Math.exp(-distRow[j] / (mid + 1e-15));
    }
    const H =
      Math.log(sumP + 1e-15) +
      (sumP > 0
        ? (1 / (sumP + 1e-15)) *
          distRow.reduce((s, d, j) => {
            if (j === 0) return s;
            return s + (d / (mid + 1e-15)) * Math.exp(-d / (mid + 1e-15));
          }, 0)
        : 0);
    const perp = Math.exp(H);
    if (perp > targetPerp) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

export function computeP(data: number[][], perplexity: number): number[][] {
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

export function computeQ(y: number[][]): number[][] {
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
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Q[i][j] /= Z;
  }
  return Q;
}

export function computeTSNEGradient(y: number[][], P: number[][], Q: number[][]): number[][] {
  const n = y.length;
  const grad: number[][] = Array.from({ length: n }, () => [0, 0]);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const diff = P[i][j] - Q[i][j];
      const dist = 1 + (y[i][0] - y[j][0]) ** 2 + (y[i][1] - y[j][1]) ** 2;
      const factor = (4 * diff) / (dist + 1e-15);
      grad[i][0] += factor * (y[i][0] - y[j][0]);
      grad[i][1] += factor * (y[i][1] - y[j][1]);
    }
  }
  return grad;
}
