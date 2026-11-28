import { useCallback, useEffect, useRef, useState } from "react";
import {
  TEST_IMG_SIZE,
  generateTestPattern,
  imageDataToGray,
  matrixToImageData,
  reconstruct,
  svd,
} from "../../lib/experiments/svd";
import { useRafGuard } from "../../lib/useRafGuard";

interface SVDResult {
  U: number[][];
  S: number[];
  Vt: number[][];
  originalMat: number[][];
  width: number;
  height: number;
}

interface Props {
  compact?: boolean;
}

type ViewMode = "side-by-side" | "singular-values" | "both";

export default function SVDImageCompression({ compact }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [svdResult, setSvdResult] = useState<SVDResult | null>(null);
  const [rank, setRank] = useState(8);
  const [maxRank, setMaxRank] = useState(64);
  const [autoAnimate, setAutoAnimate] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("side-by-side");
  const [compressionRatio, setCompressionRatio] = useState("—");
  const [storagePct, setStoragePct] = useState("—");

  const imageSize = compact ? 48 : 64;

  // Refs for anim loop
  const svdRef = useRef<SVDResult | null>(null);
  const rankRef = useRef(rank);
  const autoRef = useRef(autoAnimate);
  const speedRef = useRef(animSpeed);
  const viewRef = useRef(viewMode);
  const animDirRef = useRef(1); // direction for sweep
  const autoRankRef = useRef(rank);

  const guard = useRafGuard(containerRef);

  useEffect(() => {
    rankRef.current = rank;
  }, [rank]);
  useEffect(() => {
    autoRef.current = autoAnimate;
  }, [autoAnimate]);
  useEffect(() => {
    speedRef.current = animSpeed;
  }, [animSpeed]);
  useEffect(() => {
    viewRef.current = viewMode;
  }, [viewMode]);
  useEffect(() => {
    svdRef.current = svdResult;
  }, [svdResult]);

  // ── Load initial test pattern ──
  useEffect(() => {
    const mat = generateTestPattern();
    const result = svd(mat);
    setSvdResult({
      ...result,
      originalMat: mat,
      width: TEST_IMG_SIZE,
      height: TEST_IMG_SIZE,
    });
    const mr = Math.min(mat.length, mat[0].length);
    setMaxRank(mr);
    setRank(Math.min(8, mr));
  }, []);

  // ── Update compression info ──
  useEffect(() => {
    if (!svdResult) return;
    const { width: w, height: h } = svdResult;
    const totalPixels = w * h;
    const k = rank;
    const compressedSize = k * (w + h + 1); // U(m×k) + S(k) + Vt(k×n)
    const ratio = totalPixels / Math.max(1, compressedSize);
    const pct = (compressedSize / totalPixels) * 100;
    setCompressionRatio(`${ratio.toFixed(1)}:1`);
    setStoragePct(`${pct.toFixed(1)}%`);
  }, [svdResult, rank]);

  // ── Canvas render loop ──
  // biome-ignore lint/correctness/useExhaustiveDependencies: values read via refs in animation loop
  useEffect(() => {
    if (guard.paused) return; // off-screen / tab hidden / reduced-motion → hentikan loop
    const canvasEl = canvasRef.current;
    const containerEl = containerRef.current;
    if (!canvasEl || !containerEl) return;
    const ctxRaw = canvasEl.getContext("2d");
    if (!ctxRaw) return;
    const ctx: CanvasRenderingContext2D = ctxRaw;

    const container = containerEl;

    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 500),
    });

    const resize = () => {
      const { w, h } = getSize();
      const dpr = compact ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      canvasEl.width = Math.max(1, w * dpr);
      canvasEl.height = Math.max(1, h * dpr);
      canvasEl.style.width = `${w}px`;
      canvasEl.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let frameCount = 0;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);
      frameCount++;

      const { w, h } = getSize();
      const s = svdRef.current;
      const k = rankRef.current;
      const anim = autoRef.current;
      const speed = speedRef.current;
      const vMode = viewRef.current;
      const isCompact = !!compact;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      if (!s) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Computing SVD...", w / 2, h / 2);
        return;
      }

      const { U, S, Vt, originalMat, width: imgW, height: imgH } = s;
      const totalRank = S.length;

      // Handle auto-animate sweep
      if (anim && frameCount % Math.max(1, Math.round(6 / speed)) === 0) {
        let nextRank = autoRankRef.current + animDirRef.current;
        if (nextRank >= totalRank) {
          nextRank = totalRank - 1;
          animDirRef.current = -1;
        } else if (nextRank < 1) {
          nextRank = 1;
          animDirRef.current = 1;
        }
        autoRankRef.current = nextRank;
        // This is read by the rank state via the setter below
        // We just update the local ref and the render uses rankRef
        // The actual state update is debounced in the animation loop
        rankRef.current = nextRank;
      }

      // Reconstruct
      const recon = reconstruct(U, S, Vt, k);

      const pad = 10;
      const labelH = 20;
      const sideBySide = vMode === "side-by-side" || vMode === "both";
      const showSV = vMode === "singular-values" || vMode === "both";

      // ── Side-by-side images ──
      if (sideBySide) {
        const availW = w - 3 * pad;
        const halfW = Math.min(availW / 2, 320);
        const imgH_ = Math.min(h - labelH - 2 * pad, isCompact ? 120 : 220);
        const scaleX = halfW / imgW;
        const scaleY = imgH_ / imgH;
        const scale = Math.min(scaleX, scaleY);
        const drawW = imgW * scale;
        const drawH = imgH * scale;

        // Original (left)
        const origX = pad;
        const origY = pad + labelH;
        ctx.fillStyle = "#06b6d4";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Original", origX + drawW / 2, pad + 12);
        const origImg = matrixToImageData(originalMat, imgW, imgH);
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = imgW;
        tempCanvas.height = imgH;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;
        tempCtx.putImageData(origImg, 0, 0);
        ctx.drawImage(tempCanvas, origX, origY, drawW, drawH);
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 1;
        ctx.strokeRect(origX, origY, drawW, drawH);

        // Reconstructed (right)
        const recX = w - pad - drawW;
        const recY = pad + labelH;
        ctx.fillStyle = "#f59e0b";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`Rank ${k} reconstructed`, recX + drawW / 2, pad + 12);
        const recImg = matrixToImageData(recon, imgW, imgH);
        tempCanvas.width = imgW;
        tempCanvas.height = imgH;
        tempCtx.putImageData(recImg, 0, 0);
        ctx.drawImage(tempCanvas, recX, recY, drawW, drawH);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1;
        ctx.strokeRect(recX, recY, drawW, drawH);
      }

      // ── Singular values bar chart ──
      if (showSV && !isCompact) {
        const chartTop = sideBySide ? Math.min(250, h - 220) : pad + labelH;
        const chartH = 150;
        const chartLeft = pad;
        const chartW = w - 2 * pad;

        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(chartLeft, chartTop, chartW, chartH);

        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "10px monospace";
        ctx.textAlign = "left";
        ctx.fillText("Singular Values (σ)", chartLeft + 4, chartTop + 12);

        const barCount = Math.min(40, totalRank);
        const barW = (chartW - 8) / barCount;
        const maxS = S[0] || 1;

        for (let i = 0; i < barCount; i++) {
          const barH = (S[i] / maxS) * (chartH - 30);
          const bx = chartLeft + 4 + i * barW;
          const by = chartTop + chartH - 10 - barH;

          const isKept = i < k;
          ctx.fillStyle = isKept
            ? `rgba(245, 158, 11, ${0.6 + 0.4 * (1 - i / k)})`
            : "rgba(239, 68, 68, 0.25)";
          ctx.fillRect(bx, by, Math.max(1, barW - 1), barH);

          // Label every 5th bar
          if (i % 5 === 0) {
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.font = "7px monospace";
            ctx.textAlign = "center";
            ctx.fillText(`σ${i + 1}`, bx + barW / 2, chartTop + chartH - 1);
          }
        }

        // Info overlay
        ctx.fillStyle = "#8b5cf6";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(
          `Rank k: ${k}/${totalRank} — Ratio: ${compressionRatio} — Storage: ${storagePct}`,
          w - pad - 4,
          chartTop + 12,
        );
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, guard.paused]);

  // ── Sync auto-animate rank back to state for controls ──
  useEffect(() => {
    if (!autoAnimate) return;
    const interval = setInterval(() => {
      if (autoRef.current && svdRef.current) {
        setRank(rankRef.current);
        setAutoRank(rankRef.current);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [autoAnimate]);

  const setAutoRank = useCallback((v: number) => {
    autoRankRef.current = v;
  }, []);

  // ── Handle file upload ──
  const handleFile = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const size = imageSize;
          // Draw to offscreen canvas at target size
          const offscreen = document.createElement("canvas");
          offscreen.width = size;
          offscreen.height = size;
          const offCtx = offscreen.getContext("2d");
          if (!offCtx) return;
          offCtx.drawImage(img, 0, 0, size, size);
          const imageData = offCtx.getImageData(0, 0, size, size);
          const mat = imageDataToGray(imageData);
          try {
            const result = svd(mat);
            setSvdResult({
              ...result,
              originalMat: mat,
              width: size,
              height: size,
            });
            const mr = Math.min(mat.length, mat[0].length);
            setMaxRank(mr);
            setRank(Math.min(8, mr));
          } catch (err) {
            console.error("SVD computation failed:", err);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [imageSize],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleReset = useCallback(() => {
    const mat = generateTestPattern();
    const result = svd(mat);
    setSvdResult({
      ...result,
      originalMat: mat,
      width: TEST_IMG_SIZE,
      height: TEST_IMG_SIZE,
    });
    const mr = Math.min(mat.length, mat[0].length);
    setMaxRank(mr);
    setRank(Math.min(8, mr));
    setAutoAnimate(false);
    setAnimSpeed(1);
    setViewMode("side-by-side");
  }, []);

  const handleRankChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number.parseInt(e.target.value);
    setRank(v);
    rankRef.current = v;
    autoRankRef.current = v;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden select-none"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Compact mode overlay — minimal */}
      {compact && svdResult && (
        <div className="absolute bottom-2 left-2 z-10">
          <span className="text-[10px] font-mono text-amber-400/60">
            SVD k={rank}/{maxRank}
          </span>
        </div>
      )}

      {/* Full controls */}
      {!compact && (
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-1 pointer-events-none">
          {/* Top row: buttons */}
          <div className="flex flex-wrap items-center gap-2 p-2 pointer-events-auto">
            {/* File input */}
            <label className="px-3 py-1 text-xs rounded-full border transition-all cursor-pointer bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30 backdrop-blur-sm">
              Upload Image
              <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
            </label>

            <button
              onClick={handleReset}
              type="button"
              className="px-3 py-1 text-xs rounded-full border transition-all bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30 backdrop-blur-sm"
            >
              Reset
            </button>

            {/* Auto-animate toggle */}
            <button
              onClick={() => setAutoAnimate((v) => !v)}
              type="button"
              className={`px-3 py-1 text-xs rounded-full border transition-all backdrop-blur-sm ${
                autoAnimate
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {autoAnimate ? "Auto ◉" : "Auto ○"}
            </button>

            {/* View mode toggle */}
            <div className="flex rounded-full overflow-hidden border border-border/40 backdrop-blur-sm">
              {(["side-by-side", "singular-values", "both"] as ViewMode[]).map((vm) => (
                <button
                  key={vm}
                  type="button"
                  onClick={() => setViewMode(vm)}
                  className={`px-2 py-1 text-[10px] transition-all ${
                    viewMode === vm
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-bg-secondary/60 text-text-secondary/60 hover:text-text-secondary"
                  }`}
                >
                  {vm === "side-by-side"
                    ? "Side-by-side"
                    : vm === "singular-values"
                      ? "Singular Vals"
                      : "Both"}
                </button>
              ))}
            </div>
          </div>

          {/* Controls panel */}
          {svdResult && (
            <div className="mx-2 mb-2 p-2 pointer-events-auto rounded-lg bg-bg-secondary/60 backdrop-blur-sm border border-border/30">
              {/* Rank slider */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-text-secondary/70">
                <span>Rank k:</span>
                <input
                  type="range"
                  min={1}
                  max={maxRank}
                  value={rank}
                  onChange={handleRankChange}
                  className="w-24 accent-amber-500"
                />
                <span className="text-amber-400 w-6">{rank}</span>
                <span className="text-text-secondary/40">/ {maxRank}</span>

                <span className="ml-2 text-purple-400">{compressionRatio}</span>
                <span className="text-text-secondary/50">—</span>
                <span className="text-purple-400/70">{storagePct} storage</span>

                {autoAnimate && (
                  <>
                    <span className="ml-2">Speed:</span>
                    <input
                      type="range"
                      min={0.2}
                      max={5}
                      step={0.2}
                      value={animSpeed}
                      onChange={(e) => setAnimSpeed(Number.parseFloat(e.target.value))}
                      className="w-16 accent-amber-500"
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
