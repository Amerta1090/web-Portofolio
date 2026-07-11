import { useRef, useEffect, useState, useCallback } from "react";

type HighlightMode = "primes" | "twin" | "mersenne" | "gaps";
type LayoutMode = "spiral" | "rectangular";

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

function spiralCoords(n: number): [number, number] {
  if (n === 0) return [0, 0];
  const k = Math.ceil((Math.sqrt(n) - 1) / 2);
  const side = 2 * k;
  const base = (2 * k - 1) * (2 * k - 1);
  const rem = n - base - 1;
  const q = Math.floor(rem / side);
  const r = rem % side;
  switch (q) {
    case 0: return [k, -k + 1 + r];
    case 1: return [k - 1 - r, k];
    case 2: return [-k, k - 1 - r];
    case 3: return [-k + 1 + r, -k];
    default: return [0, 0];
  }
}

function primeGaps(n: number): number {
  if (!isPrime(n)) return 0;
  let next = n + 1;
  while (!isPrime(next)) next++;
  return next - n;
}

function buildPrimesUpTo(limit: number): boolean[] {
  const sieve = new Uint8Array(limit + 1);
  sieve[0] = 0;
  sieve[1] = 0;
  for (let i = 2; i <= limit; i++) sieve[i] = 1;
  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) sieve[j] = 0;
    }
  }
  const result = new Array<boolean>(limit + 1);
  for (let i = 0; i <= limit; i++) result[i] = sieve[i] === 1;
  return result;
}

function gapColor(gap: number, maxGap: number): string {
  if (gap === 0) return "transparent";
  const t = Math.min(gap / Math.max(maxGap, 1), 1);
  const r = Math.round(15 + t * 240);
  const g = Math.round(15 + (1 - t) * 80);
  const b = Math.round(17 + t * 120);
  return `rgb(${r},${g},${b})`;
}

export default function UlamSpiral({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [cellSize, setCellSize] = useState(compact ? 4 : 6);
  const [highlight, setHighlight] = useState<HighlightMode>("primes");
  const [layout, setLayout] = useState<LayoutMode>("spiral");
  const [centerN, setCenterN] = useState(1);

  const cellSizeRef = useRef(cellSize);
  const highlightRef = useRef(highlight);
  const layoutRef = useRef(layout);
  const centerRef = useRef(centerN);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; sx: number; sy: number; ox: number; oy: number }>({
    active: false, sx: 0, sy: 0, ox: 0, oy: 0,
  });
  const primesCacheRef = useRef<boolean[]>([]);

  const [stats, setStats] = useState({ primesShown: 0, density: 0, largestPrime: 0 });

  useEffect(() => { cellSizeRef.current = cellSize; }, [cellSize]);
  useEffect(() => { highlightRef.current = highlight; }, [highlight]);
  useEffect(() => { layoutRef.current = layout; }, [layout]);
  useEffect(() => { centerRef.current = centerN; }, [centerN]);

  useEffect(() => {
    if (primesCacheRef.current.length < 200001) {
      primesCacheRef.current = buildPrimesUpTo(200000);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 600),
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

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const cs = cellSizeRef.current;
      const hl = highlightRef.current;
      const lay = layoutRef.current;
      const cn = centerRef.current;
      const pan = panRef.current;
      const primes = primesCacheRef.current;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const cols = Math.ceil(w / cs) + 2;
      const rows = Math.ceil(h / cs) + 2;
      const halfCols = Math.floor(cols / 2);
      const halfRows = Math.floor(rows / 2);

      const centerX = Math.floor(cn === 1 ? 0 : spiralCoords(cn)[0]);
      const centerY = Math.floor(cn === 1 ? 0 : spiralCoords(cn)[1]);

      let primesShown = 0;
      let largestPrime = 0;
      let totalCells = 0;

      for (let py = -halfRows; py <= halfRows; py++) {
        for (let px = -halfCols; px <= halfCols; px++) {
          const sx = px + centerX;
          const sy = py + centerY;

          let n: number;
          if (lay === "spiral") {
            n = inverseSpiral(sx, sy);
          } else {
            n = (sy + halfRows) * cols + (px + halfCols) + 1;
          }

          if (n < 0 || n > 199999) continue;
          totalCells++;

          const screenX = w / 2 + pan.x + px * cs;
          const screenY = h / 2 + pan.y + py * cs;

          if (screenX + cs < 0 || screenX > w || screenY + cs < 0 || screenY > h) continue;

          if (primes[n]) {
            primesShown++;
            if (n > largestPrime) largestPrime = n;

            if (hl === "primes") {
              ctx.fillStyle = "rgba(255,255,255,0.9)";
              ctx.fillRect(screenX, screenY, cs, cs);
            } else if (hl === "twin") {
              if (n > 2 && isPrime(n - 2)) {
                ctx.fillStyle = "rgba(34,211,238,0.9)";
                ctx.fillRect(screenX, screenY, cs, cs);
                ctx.fillRect(screenX - cs, screenY, cs, cs);
              } else if (isPrime(n + 2)) {
                ctx.fillStyle = "rgba(34,211,238,0.5)";
                ctx.fillRect(screenX, screenY, cs, cs);
              } else {
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.fillRect(screenX, screenY, cs, cs);
              }
            } else if (hl === "mersenne") {
              const p = Math.round(Math.log2(n + 1));
              if ((1 << p) - 1 === n && p > 1) {
                ctx.fillStyle = "rgba(245,158,11,1)";
                ctx.fillRect(screenX, screenY, cs, cs);
              } else {
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                ctx.fillRect(screenX, screenY, cs, cs);
              }
            } else if (hl === "gaps") {
              const gap = primeGaps(n);
              ctx.fillStyle = gapColor(gap, 30);
              ctx.fillRect(screenX, screenY, cs, cs);
            }
          } else {
            if (!compact && cs >= 4) {
              ctx.fillStyle = "rgba(255,255,255,0.03)";
              ctx.fillRect(screenX, screenY, cs - 0.5, cs - 0.5);
            }
          }
        }
      }

      const density = totalCells > 0 ? (primesShown / totalCells * 100) : 0;
      setStats({ primesShown, density, largestPrime });
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (compact) return;
    dragRef.current = {
      active: true,
      sx: e.clientX,
      sy: e.clientY,
      ox: panRef.current.x,
      oy: panRef.current.y,
    };
  }, [compact]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d.active) return;
    panRef.current.x = d.ox + (e.clientX - d.sx);
    panRef.current.y = d.oy + (e.clientY - d.sy);
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (compact) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    setCellSize((prev) => Math.max(2, Math.min(20, prev + delta)));
  }, [compact]);

  const centerOnNumber = useCallback((n: number) => {
    setCenterN(Math.max(1, n));
    panRef.current = { x: 0, y: 0 };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      {!compact && (
        <>
          <div className="absolute top-2 left-2 z-10 text-[9px] font-mono text-amber-400/70 space-y-0.5">
            <div>primes: {stats.primesShown.toLocaleString()}</div>
            <div>density: {stats.density.toFixed(1)}%</div>
            <div>largest: {stats.largestPrime.toLocaleString()}</div>
          </div>

          <div className="absolute top-2 right-2 z-10 text-[9px] font-mono text-white/40 space-y-0.5 bg-[#0f0f11]/80 px-2 py-1 rounded border border-white/10">
            {highlight === "primes" && (
              <>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-white/90 rounded-sm" /> prime</div>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-white/3 rounded-sm" /> composite</div>
              </>
            )}
            {highlight === "twin" && (
              <>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-cyan-400 rounded-sm" /> twin prime</div>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-cyan-400/50 rounded-sm" /> partner</div>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-white/50 rounded-sm" /> prime</div>
              </>
            )}
            {highlight === "mersenne" && (
              <>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-amber-500 rounded-sm" /> Mersenne prime</div>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-white/50 rounded-sm" /> prime</div>
              </>
            )}
            {highlight === "gaps" && (
              <>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgb(15,15,17)"}} /> gap=0</div>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgb(135,15,77)"}} /> gap=6</div>
                <div className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{background:"rgb(255,15,137)"}} /> gap=30+</div>
              </>
            )}
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <button
                onClick={() => setLayout(l => l === "spiral" ? "rectangular" : "spiral")}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  layout !== "spiral"
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {layout === "spiral" ? "Spiral" : "Rectangular"}
              </button>
              <label className="flex items-center gap-1">
                zoom:
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={cellSize}
                  onChange={(e) => setCellSize(parseInt(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-8">{cellSize}px</span>
              </label>
              {(["primes", "twin", "mersenne", "gaps"] as HighlightMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setHighlight(m)}
                  className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                    highlight === m
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                      : "border-border/40 text-text-secondary hover:border-amber-500/30"
                  }`}
                >
                  {m === "twin" ? "Twin Primes" : m === "mersenne" ? "Mersenne" : m === "gaps" ? "Prime Gaps" : "Primes"}
                </button>
              ))}
              <label className="flex items-center gap-1">
                center:
                <input
                  type="number"
                  min={1}
                  max={199999}
                  value={centerN}
                  onChange={(e) => centerOnNumber(parseInt(e.target.value) || 1)}
                  className="w-16 px-1 py-0.5 text-[10px] rounded border border-border/40 bg-transparent text-amber-400 focus:border-amber-500/50 outline-none"
                />
              </label>
              <button
                onClick={() => centerOnNumber(1)}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Home
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function inverseSpiral(x: number, y: number): number {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  const k = Math.max(ax, ay);
  if (k === 0) return 0;
  const base = (2 * k - 1) * (2 * k - 1);
  const side = 2 * k;
  if (y === k) {
    return base + (x + k);
  }
  if (x === -k) {
    return base + side + (k + y);
  }
  if (y === -k) {
    return base + 2 * side + (k - x);
  }
  if (x === k) {
    return base + 3 * side + (k - y);
  }
  return 0;
}
