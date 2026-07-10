import { useRef, useEffect, useState, useCallback } from "react";

const COLORS = [
  "rgba(15,15,17,1)",
  "rgba(120,80,20,0.7)",
  "rgba(180,130,40,0.85)",
  "rgba(245,158,11,1)",
  "rgba(255,255,255,1)",
];

type Boundary = "absorbing" | "periodic";
type DropMode = "center" | "random" | "click";

export default function SandpileModel({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [dropRate, setDropRate] = useState(20);
  const [gridSize, setGridSize] = useState(80);
  const [boundary, setBoundary] = useState<Boundary>("absorbing");
  const [dropMode, setDropMode] = useState<DropMode>("center");
  const [raining, setRaining] = useState(false);
  const [paused, setPaused] = useState(false);

  const [totalDropped, setTotalDropped] = useState(0);
  const [totalAvalanches, setTotalAvalanches] = useState(0);
  const [maxAvalanche, setMaxAvalanche] = useState(0);

  const dropRateRef = useRef(dropRate);
  const gridSizeRef = useRef(gridSize);
  const boundaryRef = useRef(boundary);
  const dropModeRef = useRef(dropMode);
  const rainingRef = useRef(raining);
  const pausedRef = useRef(paused);

  const gridRef = useRef<number[][]>([]);
  const flashRef = useRef<Set<string>>(new Set());
  const avalancheHistoryRef = useRef<number[]>([]);

  const statsRef = useRef({ dropped: 0, avalanches: 0, maxAv: 0 });

  useEffect(() => { dropRateRef.current = dropRate; }, [dropRate]);
  useEffect(() => { gridSizeRef.current = gridSize; }, [gridSize]);
  useEffect(() => { boundaryRef.current = boundary; }, [boundary]);
  useEffect(() => { dropModeRef.current = dropMode; }, [dropMode]);
  useEffect(() => { rainingRef.current = raining; }, [raining]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const initGrid = useCallback((size: number) => {
    const g: number[][] = [];
    for (let y = 0; y < size; y++) {
      g.push(new Array(size).fill(0));
    }
    gridRef.current = g;
    flashRef.current = new Set();
    avalancheHistoryRef.current = [];
    statsRef.current = { dropped: 0, avalanches: 0, maxAv: 0 };
    setTotalDropped(0);
    setTotalAvalanches(0);
    setMaxAvalanche(0);
  }, []);

  const topple = useCallback((gx: number, gy: number): number => {
    const grid = gridRef.current;
    const size = gridSizeRef.current;
    const bnd = boundaryRef.current;
    const queue: [number, number][] = [[gx, gy]];
    const flash = flashRef.current;
    let topplings = 0;

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      if (grid[cy][cx] < 4) continue;

      grid[cy][cx] -= 4;
      topplings++;
      flash.add(`${cx},${cy}`);

      const dirs = [
        [cx - 1, cy],
        [cx + 1, cy],
        [cx, cy - 1],
        [cx, cy + 1],
      ];

      for (const [nx, ny] of dirs) {
        if (bnd === "absorbing") {
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            grid[ny][nx]++;
            if (grid[ny][nx] >= 4) queue.push([nx, ny]);
          }
        } else {
          const wx = ((nx % size) + size) % size;
          const wy = ((ny % size) + size) % size;
          grid[wy][wx]++;
          if (grid[wy][wx] >= 4) queue.push([wx, wy]);
        }
      }
    }
    return topplings;
  }, []);

  const dropGrain = useCallback((x?: number, y?: number) => {
    const grid = gridRef.current;
    const size = gridSizeRef.current;
    let cx: number, cy: number;

    if (x !== undefined && y !== undefined) {
      cx = Math.floor((x / (canvasRef.current?.width || 1)) * size);
      cy = Math.floor((y / (canvasRef.current?.height || 1)) * size);
      cx = Math.max(0, Math.min(size - 1, cx));
      cy = Math.max(0, Math.min(size - 1, cy));
    } else if (dropModeRef.current === "center") {
      cx = Math.floor(size / 2);
      cy = Math.floor(size / 2);
    } else {
      cx = Math.floor(Math.random() * size);
      cy = Math.floor(Math.random() * size);
    }

    grid[cy][cx]++;
    statsRef.current.dropped++;

    const t = topple(cx, cy);
    if (t > 0) {
      statsRef.current.avalanches++;
      avalancheHistoryRef.current.push(t);
      if (t > statsRef.current.maxAv) statsRef.current.maxAv = t;
    }

    setTotalDropped(statsRef.current.dropped);
    setTotalAvalanches(statsRef.current.avalanches);
    setMaxAvalanche(statsRef.current.maxAv);
  }, [topple]);

  const reset = useCallback(() => {
    initGrid(gridSizeRef.current);
  }, [initGrid]);

  useEffect(() => {
    initGrid(gridSize);
  }, [gridSize, initGrid]);

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

    let lastDrop = 0;

    function draw(time: number) {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      if (!pausedRef.current) {
        if (rainingRef.current && time - lastDrop > 1000 / dropRateRef.current) {
          dropGrain();
          lastDrop = time;
        }

        if (compact && time - lastDrop > 1000 / 20) {
          dropGrain();
          lastDrop = time;
        }
      }

      const { w, h } = getSize();
      const size = gridSizeRef.current;
      const grid = gridRef.current;
      const flash = flashRef.current;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      if (size === 0 || grid.length === 0) return;

      const histW = compact ? 0 : 140;
      const cellW = Math.max(1, (w - histW - 10) / size);
      const cellH = Math.max(1, h / size);
      const cell = Math.min(cellW, cellH);
      const offX = (w - histW - cell * size) / 2;
      const offY = (h - cell * size) / 2;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const v = grid[y][x];
          const key = `${x},${y}`;
          if (flash.has(key)) {
            ctx.fillStyle = COLORS[4];
            flash.delete(key);
          } else {
            ctx.fillStyle = COLORS[Math.min(v, 4)];
          }
          ctx.fillRect(offX + x * cell, offY + y * cell, cell, cell);
        }
      }

      if (!compact) {
        const histX = w - histW - 10;
        const histY = 20;
        const histH = h - 40;

        ctx.fillStyle = "rgba(15,15,17,0.85)";
        ctx.fillRect(histX, histY, histW, histH);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(histX, histY, histW, histH);

        const history = avalancheHistoryRef.current;
        if (history.length > 2) {
          const maxBin = Math.max(...history);
          const bins = new Array(30).fill(0);
          for (const s of history) {
            if (s > 0) {
              const bin = Math.min(29, Math.floor(Math.log2(s)));
              bins[bin]++;
            }
          }
          const maxCount = Math.max(...bins, 1);
          const barW = (histW - 20) / 30;

          ctx.fillStyle = "rgba(245,158,11,0.5)";
          for (let i = 0; i < 30; i++) {
            if (bins[i] > 0) {
              const barH = (bins[i] / maxCount) * (histH - 30);
              ctx.fillRect(histX + 10 + i * barW, histY + histH - barH - 10, barW - 1, barH);
            }
          }

          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "8px monospace";
          ctx.fillText("Avalanche sizes (log₂)", histX + 10, histY + 10);

          ctx.strokeStyle = "rgba(245,158,11,0.3)";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(histX + 10, histY + histH - 10 - (histH - 30) * 0.8);
          ctx.lineTo(histX + histW - 10, histY + histH - 10 - (histH - 30) * 0.1);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "9px monospace";
        const stats = statsRef.current;
        ctx.fillText(`dropped: ${stats.dropped}`, offX, offY + size * cell + 14);
        ctx.fillText(`avalanches: ${stats.avalanches}`, offX + 100, offY + size * cell + 14);
        ctx.fillText(`max: ${stats.maxAv}`, offX + 240, offY + size * cell + 14);
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, dropGrain, initGrid]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dropModeRef.current !== "click" && !compact) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dropGrain(
        (x / rect.width) * canvas.width,
        (y / rect.height) * canvas.height
      );
    },
    [dropGrain, compact]
  );

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onClick={handleCanvasClick}
      />
      {!compact && (
        <>
          <div className="absolute top-2 left-2 z-10 text-[9px] font-mono text-amber-400/70 space-y-0.5">
            <div>dropped: {totalDropped}</div>
            <div>avalanches: {totalAvalanches}</div>
            <div>max: {maxAvalanche}</div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1">
              rain:
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={dropRate}
                onChange={(e) => setDropRate(parseInt(e.target.value))}
                className="w-20 accent-amber-500"
              />
              <span className="text-amber-400 w-10">{dropRate}/s</span>
            </label>
            <label className="flex items-center gap-1">
              grid:
              <input
                type="range"
                min={40}
                max={120}
                step={10}
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value))}
                className="w-20 accent-amber-500"
              />
              <span className="text-amber-400 w-10">{gridSize}</span>
            </label>
            <button
              onClick={() => setBoundary(b => (b === "absorbing" ? "periodic" : "absorbing"))}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              {boundary}
            </button>
            <button
              onClick={() => setDropMode(m => {
                const modes: DropMode[] = ["center", "random", "click"];
                return modes[(modes.indexOf(m) + 1) % 3];
              })}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              {dropMode}
            </button>
            <button
              onClick={() => setRaining(r => !r)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                raining
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {raining ? "Stop Rain" : "Rain"}
            </button>
            <button
              onClick={() => dropGrain()}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Single Drop
            </button>
            <button
              onClick={() => setPaused(p => !p)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                paused
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              onClick={reset}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
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
