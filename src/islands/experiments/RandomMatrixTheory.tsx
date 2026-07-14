import { useRef, useEffect, useState, useCallback } from "react";

type Ensemble = "GOE" | "GUE" | "GSE";

const WIGNER_COEFF: Record<Ensemble, { a: number; b: number; power: number }> = {
  GOE: { a: Math.PI / 2, b: Math.PI / 4, power: 1 },
  GUE: { a: 32 / (Math.PI * Math.PI), b: 4 / Math.PI, power: 2 },
  GSE: { a: 218 / (6561 * Math.PI * Math.PI * Math.PI), b: 64 / (9 * Math.PI), power: 4 },
};

function wignerSurmise(s: number, ens: Ensemble): number {
  const c = WIGNER_COEFF[ens];
  return c.a * Math.pow(s, c.power) * Math.exp(-c.b * s * s);
}

function boxMullerRandom(): [number, number] {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return [Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2),
          Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2)];
}

function generateMatrix(n: number, ens: Ensemble): number[][] {
  if (ens === "GOE") {
    const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const [r] = boxMullerRandom();
        m[i][j] = r;
        m[j][i] = r;
      }
    }
    return m;
  }

  if (ens === "GUE") {
    // Build complex Hermitian H = A + iB, then embed as 2N x 2N real-symmetric
    // [[A, -B], [B, A]] has eigenvalues = eigenvalues of H, each with multiplicity 2
    const A: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const B: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const [r1, r2] = boxMullerRandom();
        if (i === j) {
          A[i][j] = r1;
          B[i][j] = 0;
        } else {
          A[i][j] = r1 / Math.SQRT2;
          A[j][i] = r1 / Math.SQRT2;
          B[i][j] = r2 / Math.SQRT2;
          B[j][i] = -r2 / Math.SQRT2;
        }
      }
    }
    const sz = 2 * n;
    const m: number[][] = Array.from({ length: sz }, () => new Array(sz).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        m[i][j] = A[i][j];
        m[i][j + n] = -B[i][j];
        m[i + n][j] = B[i][j];
        m[i + n][j + n] = A[i][j];
      }
    }
    return m;
  }

  // GSE: 4N x 4N block structure with quaternionic entries
  const sz = 4 * n;
  const raw: number[][] = Array.from({ length: sz }, () => new Array(sz).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const [a, b] = boxMullerRandom();
      const [c, d] = boxMullerRandom();
      const bi = 4 * i;
      const bj = 4 * j;
      const s2 = Math.SQRT2;
      if (i === j) {
        // Diagonal quaternion block: a*I + b*I_i + c*I_j + d*I_k
        raw[bi][bj] = a;
        raw[bi][bj + 1] = -b;
        raw[bi][bj + 2] = c;
        raw[bi][bj + 3] = d;
        raw[bi + 1][bj] = b;
        raw[bi + 1][bj + 1] = a;
        raw[bi + 1][bj + 2] = -d;
        raw[bi + 1][bj + 3] = c;
        raw[bi + 2][bj] = -c;
        raw[bi + 2][bj + 1] = d;
        raw[bi + 2][bj + 2] = a;
        raw[bi + 2][bj + 3] = -b;
        raw[bi + 3][bj] = -d;
        raw[bi + 3][bj + 1] = -c;
        raw[bi + 3][bj + 2] = b;
        raw[bi + 3][bj + 3] = a;
      } else {
        // Off-diagonal: quaternion Gaussian / sqrt(2)
        const q = [
          [a / s2, b / s2, c / s2, d / s2],
          [-b / s2, a / s2, -d / s2, c / s2],
          [-c / s2, d / s2, a / s2, -b / s2],
          [-d / s2, -c / s2, b / s2, a / s2],
        ];
        for (let bi2 = 0; bi2 < 4; bi2++) {
          for (let bj2 = 0; bj2 < 4; bj2++) {
            raw[bi + bi2][bj + bj2] = q[bi2][bj2];
            raw[bj + bj2][bi + bi2] = q[bi2][bj2];
          }
        }
      }
    }
  }
  return raw;
}

function jacobiEigenvalues(matrix: number[][], maxIter: number = 200): number[] {
  const n = matrix.length;
  const a: number[][] = matrix.map((r) => [...r]);

  for (let iter = 0; iter < maxIter; iter++) {
    let maxVal = 0;
    let p = 0;
    let q = 1;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(a[i][j]) > maxVal) {
          maxVal = Math.abs(a[i][j]);
          p = i;
          q = j;
        }
      }
    }
    if (maxVal < 1e-10) break;

    const diff = a[q][q] - a[p][p];
    let t;
    if (Math.abs(a[p][q]) < 1e-15 * Math.abs(diff)) {
      t = a[p][q] / diff;
    } else {
      const phi = diff / (2 * a[p][q]);
      t = 1 / (Math.abs(phi) + Math.sqrt(phi * phi + 1));
      if (phi < 0) t = -t;
    }

    const c = 1 / Math.sqrt(t * t + 1);
    const s = t * c;
    const tau = s / (1 + c);

    const aip = a[p][p];
    const aiq = a[p][q];
    const aiq2 = a[q][q];

    a[p][p] = aip - t * aiq;
    a[q][q] = aiq2 + t * aiq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let i = 0; i < n; i++) {
      if (i === p || i === q) continue;
      const aip2 = a[i][p];
      const aiq3 = a[i][q];
      a[i][p] = aip2 - s * (aiq3 + tau * aip2);
      a[p][i] = a[i][p];
      a[i][q] = aiq3 + s * (aip2 - tau * aiq3);
      a[q][i] = a[i][q];
    }
  }

  const eigenvalues: number[] = [];
  for (let i = 0; i < n; i++) {
    eigenvalues.push(a[i][i]);
  }
  eigenvalues.sort((x, y) => x - y);
  return eigenvalues;
}

function computeSpacings(eigenvalues: number[]): number[] {
  if (eigenvalues.length < 2) return [];
  const spacings: number[] = [];
  for (let i = 1; i < eigenvalues.length; i++) {
    spacings.push(eigenvalues[i] - eigenvalues[i - 1]);
  }
  const mean = spacings.reduce((a, b) => a + b, 0) / spacings.length;
  if (mean === 0) return spacings;
  return spacings.map((s) => s / mean);
}

function buildHistogram(data: number[], bins: number, maxVal: number): number[] {
  const hist = new Array(bins).fill(0);
  const binWidth = maxVal / bins;
  for (const v of data) {
    const idx = Math.floor(v / binWidth);
    if (idx >= 0 && idx < bins) hist[idx]++;
  }
  const total = data.length * binWidth;
  return hist.map((h) => h / total);
}

export default function RandomMatrixTheory({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [ensemble, setEnsemble] = useState<Ensemble>("GOE");
  const [matrixSize, setMatrixSize] = useState(50);
  const [sampleCount, setSampleCount] = useState(200);
  const [generating, setGenerating] = useState(false);
  const [autoGen, setAutoGen] = useState(false);

  const [spacings, setSpacings] = useState<number[]>([]);
  const [eigenvalueRange, setEigenvalueRange] = useState<[number, number]>([0, 0]);
  const [meanSpacing, setMeanSpacing] = useState(0);
  const [levelRepulsion, setLevelRepulsion] = useState(0);

  const ensembleRef = useRef(ensemble);
  const matrixSizeRef = useRef(matrixSize);
  const sampleCountRef = useRef(sampleCount);
  const autoGenRef = useRef(autoGen);
  const spacingsRef = useRef<number[]>([]);
  const eigenRangeRef = useRef<[number, number]>([0, 0]);
  const sampleEigenRef = useRef<number[]>([]);

  useEffect(() => { ensembleRef.current = ensemble; }, [ensemble]);
  useEffect(() => { matrixSizeRef.current = matrixSize; }, [matrixSize]);
  useEffect(() => { sampleCountRef.current = sampleCount; }, [sampleCount]);
  useEffect(() => { autoGenRef.current = autoGen; }, [autoGen]);

  const generate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      const ens = ensembleRef.current;
      const n = matrixSizeRef.current;
      const count = sampleCountRef.current;
      const allSpacings: number[] = [];
      let minE = Infinity;
      let maxE = -Infinity;

      for (let s = 0; s < count; s++) {
        const mat = generateMatrix(n, ens);
        const evals = jacobiEigenvalues(mat, ens === "GSE" ? 300 : 200);
        if (evals.length > 0) {
          minE = Math.min(minE, evals[0]);
          maxE = Math.max(maxE, evals[evals.length - 1]);
        }
        const sp = computeSpacings(evals);
        allSpacings.push(...sp);
      }

      spacingsRef.current = allSpacings;
      eigenRangeRef.current = [minE, maxE];

      // Pre-compute sample eigenvalues for display
      const sampleMat = generateMatrix(Math.min(n, 50), ens);
      sampleEigenRef.current = jacobiEigenvalues(sampleMat, 200);

      const mean = allSpacings.length > 0
        ? allSpacings.reduce((a, b) => a + b, 0) / allSpacings.length
        : 0;
      const nearZero = allSpacings.filter((s) => s < 0.1).length;
      const repulsion = allSpacings.length > 0
        ? nearZero / allSpacings.length
        : 0;

      setSpacings([...allSpacings]);
      setEigenvalueRange([minE, maxE]);
      setMeanSpacing(mean);
      setLevelRepulsion(repulsion);
      setGenerating(false);
    }, 50);
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  useEffect(() => {
    if (!autoGen) return;
    const id = setInterval(() => {
      generate();
    }, 2000);
    return () => clearInterval(id);
  }, [autoGen, generate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ro = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    });
    ro.observe(container);

    runningRef.current = true;

    let animPhase = 0;

    function draw() {
      if (!runningRef.current || !canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const dpr = devicePixelRatio;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, W, H);

      const sp = spacingsRef.current;
      const [minE, maxE] = eigenRangeRef.current;
      const ens = ensembleRef.current;

      if (compact) {
        drawCompact(ctx, W, H, dpr, sp, ens, animPhase);
      } else {
        drawFull(ctx, W, H, dpr, sp, minE, maxE, ens, animPhase, sampleEigenRef.current);
      }

      animPhase += 0.02;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-3 left-3 right-3 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <div className="flex gap-1">
              {(["GOE", "GUE", "GSE"] as Ensemble[]).map((e) => (
                <button
                  key={e}
                  onClick={() => setEnsemble(e)}
                  className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                    ensemble === e
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                      : "border-border/40 text-text-secondary hover:border-amber-500/30"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1">
              N:
              <input
                type="range"
                min={2}
                max={200}
                step={1}
                value={matrixSize}
                onChange={(e) => setMatrixSize(parseInt(e.target.value))}
                className="w-24 accent-amber-500"
              />
              <span className="text-amber-400 w-8">{matrixSize}</span>
            </label>

            <label className="flex items-center gap-1">
              Samples:
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={sampleCount}
                onChange={(e) => setSampleCount(parseInt(e.target.value))}
                className="w-20 accent-amber-500"
              />
              <span className="text-amber-400 w-10">{sampleCount}</span>
            </label>

            <button
              onClick={generate}
              disabled={generating}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all disabled:opacity-40"
            >
              {generating ? "Generating..." : "Generate"}
            </button>

            <button
              onClick={() => setAutoGen((a) => !a)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                autoGen
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Auto
            </button>

            <span className="text-text-secondary/50 ml-1">
              Mean spacing: {meanSpacing.toFixed(3)} | Level repulsion: {levelRepulsion.toFixed(3)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function drawCompact(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dpr: number,
  spacings: number[],
  ens: Ensemble,
  phase: number,
) {
  const pad = 12 * dpr;
  const w = W - pad * 2;
  const h = H - pad * 2;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad, pad, w, h);

  const bins = 40;
  const maxS = 4;
  const hist = spacings.length > 0 ? buildHistogram(spacings, bins, maxS) : [];
  const maxH = hist.length > 0 ? Math.max(...hist, 0.01) : 1;

  for (let i = 0; i < bins; i++) {
    const bx = pad + (i / bins) * w;
    const bw = w / bins;
    const bh = (hist[i] / maxH) * h * 0.8;
    ctx.fillStyle = "rgba(245,158,11,0.25)";
    ctx.fillRect(bx, pad + h - bh, bw, bh);
  }

  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const s = (i / 100) * maxS;
    const y = wignerSurmise(s, ens);
    const px = pad + (s / maxS) * w;
    const py = pad + h - (y / maxH) * h * 0.8;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  const dotCount = Math.min(12, Math.floor(4 + 4 * (0.5 + 0.5 * Math.sin(phase))));
  ctx.fillStyle = "rgba(245,158,11,0.7)";
  for (let i = 0; i < dotCount; i++) {
    const x = pad + ((Math.sin(phase * 0.7 + i * 1.3) + 1) / 2) * w;
    const y = pad + ((Math.cos(phase * 0.5 + i * 0.9) + 1) / 2) * h;
    ctx.beginPath();
    ctx.arc(x, y, 2 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFull(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  dpr: number,
  spacings: number[],
  minE: number,
  maxE: number,
  ens: Ensemble,
  phase: number,
  eigenvalues: number[],
) {
  if (spacings.length === 0) {
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = `${14 * dpr}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("Click Generate to compute", W / 2, H / 2);
    return;
  }

  const splitX = W * 0.42;
  const pad = 20 * dpr;
  const topPad = 60 * dpr;
  const botPad = 30 * dpr;

  // Left panel: eigenvalue spectrum
  const leftW = splitX - pad * 2;
  const leftH = H - topPad - botPad;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(pad, topPad, leftW, leftH);

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = `${10 * dpr}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("Eigenvalue Spectrum", pad + leftW / 2, topPad - 6 * dpr);

  if (maxE > minE) {
    const range = maxE - minE;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = `${8 * dpr}px monospace`;
    for (let i = 0; i <= 5; i++) {
      const val = minE + (i / 5) * range;
      const x = pad + (i / 5) * leftW;
      ctx.fillText(val.toFixed(1), x, topPad + leftH + 14 * dpr);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, topPad + leftH);
      ctx.stroke();
    }
  }

  const evalArray = eigenvalues;
  if (maxE > minE) {
    for (let i = 0; i < evalArray.length; i++) {
      const e = evalArray[i];
      const x = pad + ((e - minE) / (maxE - minE)) * leftW;
      const jitter = Math.sin(phase + i * 0.3) * 3 * dpr;
      const y = topPad + leftH * 0.3 + jitter + (Math.sin(i * 0.5) * leftH * 0.2);

      ctx.fillStyle = `rgba(245,158,11,${0.3 + 0.4 * Math.sin(phase + i)})`;
      ctx.beginPath();
      ctx.arc(x, y, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,255,255,${0.15 + 0.1 * Math.sin(phase + i * 0.7)})`;
      ctx.beginPath();
      ctx.arc(x, y, 5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Vertical line for each eigenvalue
  if (maxE > minE && evalArray.length > 0) {
    ctx.strokeStyle = "rgba(245,158,11,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < evalArray.length; i++) {
      const e = evalArray[i];
      const x = pad + ((e - minE) / (maxE - minE)) * leftW;
      ctx.beginPath();
      ctx.moveTo(x, topPad);
      ctx.lineTo(x, topPad + leftH);
      ctx.stroke();
    }
  }

  // Right panel: spacing histogram + Wigner
  const rightX = splitX + 10 * dpr;
  const rightW = W - rightX - pad;
  const rightH = H - topPad - botPad;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX, topPad, rightW, rightH);

  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = `${10 * dpr}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("Spacing Distribution vs Wigner Surmise", rightX + rightW / 2, topPad - 6 * dpr);

  const bins = 50;
  const maxS = 4;
  const hist = buildHistogram(spacings, bins, maxS);
  const maxHist = Math.max(...hist, 0.01);

  // Axis labels
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.font = `${8 * dpr}px monospace`;
  ctx.textAlign = "center";
  for (let i = 0; i <= 4; i++) {
    const s = i;
    const x = rightX + (s / maxS) * rightW;
    ctx.fillText(s.toString(), x, topPad + rightH + 14 * dpr);
  }
  ctx.textAlign = "right";
  for (let i = 0; i <= 3; i++) {
    const v = (i / 3) * maxHist;
    const y = topPad + rightH - (i / 3) * rightH;
    ctx.fillText(v.toFixed(2), rightX - 4 * dpr, y + 3 * dpr);
  }

  // Histogram bars
  for (let i = 0; i < bins; i++) {
    const bx = rightX + (i / bins) * rightW;
    const bw = rightW / bins;
    const bh = (hist[i] / maxHist) * rightH;
    const alpha = 0.15 + 0.2 * (hist[i] / maxHist);
    ctx.fillStyle = `rgba(245,158,11,${alpha})`;
    ctx.fillRect(bx, topPad + rightH - bh, bw, bh);
    ctx.strokeStyle = `rgba(245,158,11,${alpha + 0.1})`;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, topPad + rightH - bh, bw, bh);
  }

  // Wigner surmise curve
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2.5 * dpr;
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 6 * dpr;
  ctx.beginPath();
  for (let i = 0; i <= 200; i++) {
    const s = (i / 200) * maxS;
    const y = wignerSurmise(s, ens);
    const px = rightX + (s / maxS) * rightW;
    const py = topPad + rightH - (y / maxHist) * rightH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Legend
  const legX = rightX + rightW - 120 * dpr;
  const legY = topPad + 12 * dpr;
  ctx.fillStyle = "rgba(15,15,17,0.8)";
  ctx.fillRect(legX, legY, 115 * dpr, 36 * dpr);
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(legX, legY, 115 * dpr, 36 * dpr);

  ctx.fillStyle = "rgba(245,158,11,0.6)";
  ctx.fillRect(legX + 6 * dpr, legY + 8 * dpr, 12 * dpr, 8 * dpr);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `${8 * dpr}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText("Empirical", legX + 22 * dpr, legY + 16 * dpr);

  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  ctx.moveTo(legX + 6 * dpr, legY + 28 * dpr);
  ctx.lineTo(legX + 18 * dpr, legY + 28 * dpr);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText(`Wigner ${ens}`, legX + 22 * dpr, legY + 31 * dpr);
}
