/** Pure math for the SVD image compression lab experiment (Jacobi eigendecomposition, rank-k reconstruction). */

/* ───────── SVD – eigendecomposition via cyclic Jacobi ───────── */

/** Symmetric eigendecomposition via cyclic Jacobi (one-sided). Returns eigenvalues sorted descending + eigenvectors as columns of V. */
export function symmetricEig(A: number[][]): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = A.length;
  // V = identity
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );
  // Copy A into B (will be diagonalized in place)
  const B: number[][] = A.map((row) => [...row]);

  const tol = 1e-10;
  const maxSweeps = 50;

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxOff = 0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        const absVal = Math.abs(B[p][q]);
        if (absVal > maxOff) maxOff = absVal;
        if (absVal < tol) continue;

        const alpha = (B[q][q] - B[p][p]) / (2 * B[p][q] + 1e-30);
        const t = Math.sign(alpha) / (Math.abs(alpha) + Math.sqrt(1 + alpha * alpha));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;

        // Rotate B
        const tau = s / (1 + c);
        for (let r = 0; r < n; r++) {
          if (r === p || r === q) continue;
          const B_rp = B[r][p];
          const B_rq = B[r][q];
          B[r][p] = B_rp - s * (B_rq + tau * B_rp);
          B[r][q] = B_rq + s * (B_rp - tau * B_rq);
          // Symmetry
          B[p][r] = B[r][p];
          B[q][r] = B[r][q];
        }
        const Bpp = B[p][p];
        const Bqq = B[q][q];
        const Bpq = B[p][q];
        B[p][p] = Bpp - t * Bpq;
        B[q][q] = Bqq + t * Bpq;
        B[p][q] = 0;
        B[q][p] = 0;

        // Rotate V
        for (let r = 0; r < n; r++) {
          const V_rp = V[r][p];
          const V_rq = V[r][q];
          V[r][p] = V_rp - s * (V_rq + tau * V_rp);
          V[r][q] = V_rq + s * (V_rp - tau * V_rq);
        }
      }
    }
    if (maxOff < tol) break;
  }

  // Extract eigenvalues from diagonal of B
  const eigenvalues: number[] = Array.from({ length: n }, (_, i) => B[i][i]);
  // Sort descending
  const idx = eigenvalues.map((_, i) => i).sort((a, b) => eigenvalues[b] - eigenvalues[a]);
  const sortedEigenvalues = idx.map((i) => Math.abs(eigenvalues[i]));
  const sortedEigenvectors: number[][] = Array.from({ length: n }, (_, i) =>
    idx.map((j) => V[i][j]),
  );

  return { eigenvalues: sortedEigenvalues, eigenvectors: sortedEigenvectors };
}

/** Matrix transpose */
export function transpose(M: number[][]): number[][] {
  const m = M.length;
  const n = M[0].length;
  return Array.from({ length: n }, (_, j) => Array.from({ length: m }, (_, i) => M[i][j]));
}

/** Matrix multiply A (m×k) × B (k×n) */
export function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const k = A[0].length;
  const n = B[0].length;
  const result: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let t = 0; t < k; t++) sum += A[i][t] * B[t][j];
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Full SVD via eigendecomposition of A^T A.
 * 1. Compute C = A^T A (symmetric, n×n)
 * 2. Eigendecompose C → V (eigenvectors as columns), S² (eigenvalues)
 * 3. S = sqrt(S²)
 * 4. U[:,i] = (1/s_i) * A * V[:,i]
 */
export function svd(A: number[][]): { U: number[][]; S: number[]; Vt: number[][] } {
  const At = transpose(A);
  const C = matMul(At, A); // n×n symmetric
  const { eigenvalues, eigenvectors } = symmetricEig(C);

  const n = eigenvalues.length;
  const S = eigenvalues.map((v) => Math.sqrt(Math.max(0, v)));

  // Compute U = A * V * S^{-1}
  const V = eigenvectors; // columns are eigenvectors, rows are original dims
  const m = A.length;
  const U: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let t = 0; t < n; t++) {
        sum += A[i][t] * V[t][j];
      }
      U[i][j] = S[j] > 1e-12 ? sum / S[j] : 0;
    }
  }

  const Vt = transpose(V);
  return { U, S, Vt };
}

/** Reconstruct from rank-k SVD: A_k = U_k * S_k * Vt_k */
export function reconstruct(U: number[][], S: number[], Vt: number[][], k: number): number[][] {
  const m = U.length;
  const n = Vt[0].length;
  const kk = Math.min(k, S.length);
  const result: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let r = 0; r < kk; r++) {
        sum += U[i][r] * S[r] * Vt[r][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/** Convert an ImageData to a grayscale matrix (rows × cols) */
export function imageDataToGray(img: ImageData): number[][] {
  const { width, height, data } = img;
  const mat: number[][] = Array.from({ length: height }, () => new Array(width).fill(0));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Luminance weights
      mat[y][x] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
  }
  return mat;
}

/** Convert a grayscale matrix back to ImageData (clamp, 8-bit) */
export function matrixToImageData(mat: number[][], width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const v = Math.max(0, Math.min(255, Math.round(mat[y]?.[x] ?? 0)));
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, width, height);
}

/** Resize a grayscale matrix to target size via nearest-neighbour */
export function resizeMatrix(mat: number[][], newW: number, newH: number): number[][] {
  const h = mat.length;
  const w = mat[0].length;
  const result: number[][] = Array.from({ length: newH }, () => new Array(newW).fill(0));
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const sy = Math.min(h - 1, Math.round((y / newH) * (h - 1)));
      const sx = Math.min(w - 1, Math.round((x / newW) * (w - 1)));
      result[y][x] = mat[sy][sx];
    }
  }
  return result;
}

/* ───────── Built-in test pattern generator ───────── */

export const TEST_IMG_SIZE = 64;

export function generateTestPattern(): number[][] {
  const size = TEST_IMG_SIZE;
  const mat: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Gradient
      let v = (x / size) * 200 + (y / size) * 55;
      // Circle
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (d < size * 0.35) v += 80;
      // Square
      if (Math.abs(x - cx) < size * 0.15 && Math.abs(y - cy) < size * 0.15) v += 60;
      // Diagonal stripe
      const stripe = (x + y) % 12 < 4 ? 40 : 0;
      v += stripe;
      // Ring
      if (Math.abs(d - size * 0.2) < 3) v += 100;
      mat[y][x] = Math.max(0, Math.min(255, v));
    }
  }
  return mat;
}

/* ───────── Component ───────── */
