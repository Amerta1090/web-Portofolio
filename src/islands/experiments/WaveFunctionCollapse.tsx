import { useRef, useEffect, useState, useCallback } from "react";

type Tile = "grass" | "dirt" | "water" | "stone";

const TILE_COLORS: Record<Tile, string> = {
  grass: "#4ade80",
  dirt: "#92400e",
  water: "#3b82f6",
  stone: "#6b7280",
};

const TILE_BORDERS: Record<Tile, string> = {
  grass: "#22c55e",
  dirt: "#78350f",
  water: "#2563eb",
  stone: "#4b5563",
};

type Direction = "N" | "S" | "E" | "W";
const DIRS: Direction[] = ["N", "S", "E", "W"];
const DX: Record<Direction, number> = { N: 0, S: 0, E: 1, W: -1 };
const DY: Record<Direction, number> = { N: -1, S: 1, E: 0, W: 0 };
const OPPOSITE: Record<Direction, Direction> = {
  N: "S",
  S: "N",
  E: "W",
  W: "E",
};

const ALL_TILES: Tile[] = ["grass", "dirt", "water", "stone"];

type AdjacencyRules = Record<Tile, Record<Direction, Tile[]>>;

const RULES: AdjacencyRules = {
  grass: {
    N: ["grass", "dirt"],
    S: ["grass", "dirt"],
    E: ["grass", "dirt"],
    W: ["grass", "dirt"],
  },
  dirt: {
    N: ["dirt", "water"],
    S: ["grass", "dirt"],
    E: ["grass", "dirt"],
    W: ["grass", "dirt"],
  },
  water: {
    N: ["water"],
    S: ["water"],
    E: ["water"],
    W: ["water"],
  },
  stone: {
    N: ["stone", "dirt"],
    S: ["stone", "dirt"],
    E: ["stone", "dirt"],
    W: ["stone", "dirt"],
  },
};

type Grid = Set<Tile>[][];

type Preset = "random" | "checkerboard" | "river";

export default function WaveFunctionCollapse({
  compact,
}: {
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [gridSize, setGridSize] = useState(20);
  const [speed, setSpeed] = useState(5);
  const [auto, setAuto] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showEntropy, setShowEntropy] = useState(false);
  const [preset, setPreset] = useState<Preset>("random");

  const [cellsRemaining, setCellsRemaining] = useState(0);
  const [stepsTaken, setStepsTaken] = useState(0);
  const [collapseCount, setCollapseCount] = useState(0);

  const gridSizeRef = useRef(gridSize);
  const speedRef = useRef(speed);
  const autoRef = useRef(auto);
  const pausedRef = useRef(paused);
  const showEntropyRef = useRef(showEntropy);

  const gridRef = useRef<Grid>([]);
  const flashRef = useRef<Map<string, number>>(new Map());
  const statsRef = useRef({ remaining: 0, steps: 0, collapses: 0 });

  useEffect(() => {
    gridSizeRef.current = gridSize;
  }, [gridSize]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    autoRef.current = auto;
  }, [auto]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    showEntropyRef.current = showEntropy;
  }, [showEntropy]);

  const makeCell = useCallback((): Set<Tile> => {
    return new Set<Tile>(ALL_TILES);
  }, []);

  const initGrid = useCallback(
    (size: number) => {
      const g: Grid = [];
      for (let y = 0; y < size; y++) {
        const row: Set<Tile>[] = [];
        for (let x = 0; x < size; x++) {
          row.push(makeCell());
        }
        g.push(row);
      }
      gridRef.current = g;
      flashRef.current = new Map();
      statsRef.current = { remaining: size * size, steps: 0, collapses: 0 };
      setCellsRemaining(size * size);
      setStepsTaken(0);
      setCollapseCount(0);
    },
    [makeCell]
  );

  const reset = useCallback(() => {
    initGrid(gridSizeRef.current);
  }, [initGrid]);

  useEffect(() => {
    initGrid(gridSize);
  }, [gridSize, initGrid]);

  const getEntropy = useCallback((cell: Set<Tile>): number => {
    return cell.size;
  }, []);

  const findMinEntropy = useCallback(
    (size: number): [number, number] | null => {
      const grid = gridRef.current;
      let minEnt = Infinity;
      const candidates: [number, number][] = [];

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const ent = getEntropy(grid[y][x]);
          if (ent === 1) continue;
          if (ent < minEnt) {
            minEnt = ent;
            candidates.length = 0;
            candidates.push([x, y]);
          } else if (ent === minEnt) {
            candidates.push([x, y]);
          }
        }
      }

      if (candidates.length === 0) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    },
    [getEntropy]
  );

  const collapse = useCallback(
    (x: number, y: number) => {
      const grid = gridRef.current;
      const cell = grid[y][x];
      if (cell.size <= 1) return;

      const options = Array.from(cell);
      const chosen = options[Math.floor(Math.random() * options.length)];
      grid[y][x] = new Set<Tile>([chosen]);

      statsRef.current.collapses++;
      statsRef.current.steps++;

      flashRef.current.set(`${x},${y}`, performance.now());

      setCollapseCount(statsRef.current.collapses);
      setStepsTaken(statsRef.current.steps);
    },
    []
  );

  const propagate = useCallback(
    (size: number) => {
      const grid = gridRef.current;
      const queue: [number, number][] = [];
      const visited = new Set<string>();

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (grid[y][x].size === 1) {
            queue.push([x, y]);
            visited.add(`${x},${y}`);
          }
        }
      }

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        const cell = grid[cy][cx];
        if (cell.size !== 1) continue;

        const collapsedTile = Array.from(cell)[0];

        for (const dir of DIRS) {
          const nx = cx + DX[dir];
          const ny = cy + DY[dir];
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;

          const neighbor = grid[ny][nx];
          if (neighbor.size <= 1) continue;

          const allowedNeighbors = RULES[collapsedTile][dir];
          const newNeighbor = new Set<Tile>();
          Array.from(neighbor).forEach((t) => {
            if (allowedNeighbors.includes(t)) {
              newNeighbor.add(t);
            }
          });

          if (newNeighbor.size < neighbor.size) {
            grid[ny][nx] = newNeighbor;

            if (newNeighbor.size === 0) {
              grid[ny][nx] = new Set<Tile>(ALL_TILES);
            }

            flashRef.current.set(
              `${nx},${ny}`,
              performance.now()
            );

            const key = `${nx},${ny}`;
            if (!visited.has(key)) {
              visited.add(key);
              if (newNeighbor.size > 1) {
                queue.push([nx, ny]);
              }
            }
          }
        }
      }
    },
    []
  );

  const step = useCallback(() => {
    const size = gridSizeRef.current;
    const target = findMinEntropy(size);
    if (!target) {
      setAuto(false);
      return;
    }
    const [x, y] = target;
    collapse(x, y);
    propagate(size);

    let remaining = 0;
    const grid = gridRef.current;
    for (let gy = 0; gy < size; gy++) {
      for (let gx = 0; gx < size; gx++) {
        if (grid[gy][gx].size > 1) remaining++;
      }
    }
    statsRef.current.remaining = remaining;
    setCellsRemaining(remaining);
  }, [findMinEntropy, collapse, propagate]);

  const applyPreset = useCallback(
    (p: Preset, size: number) => {
      initGrid(size);
      const grid = gridRef.current;

      if (p === "checkerboard") {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            grid[y][x] = new Set<Tile>(
              (x + y) % 2 === 0 ? ["grass"] : ["dirt"]
            );
          }
        }
        statsRef.current.remaining = 0;
        setCellsRemaining(0);
      } else if (p === "river") {
        for (let y = 0; y < size; y++) {
          for (let x = 0; x < size; x++) {
            grid[y][x] = new Set<Tile>(ALL_TILES);
          }
        }
        const riverY = Math.floor(size / 2);
        for (let x = 0; x < size; x++) {
          const wobble =
            Math.floor(Math.sin(x * 0.3) * 2 + (Math.random() - 0.5) * 1.5) |
            0;
          const ry = Math.max(0, Math.min(size - 1, riverY + wobble));
          grid[ry][x] = new Set<Tile>(["water"]);
          if (ry - 1 >= 0) grid[ry - 1][x] = new Set<Tile>(["dirt"]);
          if (ry + 1 < size) grid[ry + 1][x] = new Set<Tile>(["dirt"]);
        }
        propagate(size);
        let remaining = 0;
        for (let gy = 0; gy < size; gy++) {
          for (let gx = 0; gx < size; gx++) {
            if (grid[gy][gx].size > 1) remaining++;
          }
        }
        statsRef.current.remaining = remaining;
        statsRef.current.steps = 1;
        setCellsRemaining(remaining);
        setStepsTaken(1);
      }
    },
    [initGrid, propagate]
  );

  const handlePresetChange = useCallback(
    (p: Preset) => {
      setPreset(p);
      if (p !== "random") {
        applyPreset(p, gridSizeRef.current);
      } else {
        initGrid(gridSizeRef.current);
      }
    },
    [applyPreset, initGrid]
  );

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

    let lastStep = 0;

    function draw(time: number) {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      if (!pausedRef.current && autoRef.current) {
        const interval = 1000 / speedRef.current;
        if (time - lastStep > interval) {
          step();
          lastStep = time;
        }
      }

      if (compact && !pausedRef.current && time - lastStep > 200) {
        step();
        lastStep = time;
      }

      const { w, h } = getSize();
      const size = gridSizeRef.current;
      const grid = gridRef.current;
      const flash = flashRef.current;
      const now = performance.now();

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      if (size === 0 || grid.length === 0) return;

      const cellW = Math.max(1, (w - 10) / size);
      const cellH = Math.max(1, (h - 10) / size);
      const cell = Math.min(cellW, cellH);
      const offX = (w - cell * size) / 2;
      const offY = (h - cell * size) / 2;

      const showEnt = showEntropyRef.current;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const c = grid[y][x];
          const px = offX + x * cell;
          const py = offY + y * cell;
          const key = `${x},${y}`;
          const flashTime = flash.get(key);
          const flashAge = flashTime ? now - flashTime : Infinity;

          if (c.size === 1) {
            const tile = Array.from(c)[0];
            ctx.fillStyle = TILE_COLORS[tile];
            ctx.fillRect(px, py, cell, cell);

            if (cell > 4) {
              ctx.strokeStyle = TILE_BORDERS[tile];
              ctx.lineWidth = Math.max(0.5, cell * 0.08);
              ctx.strokeRect(px + 1, py + 1, cell - 2, cell - 2);
            }
          } else if (showEnt) {
            const ent = c.size;
            const ratio = ent / ALL_TILES.length;
            const r = Math.round(60 + ratio * 195);
            const g = Math.round(180 - ratio * 130);
            const b = 60;
            ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
            ctx.fillRect(px, py, cell, cell);
          } else {
            const colors = Array.from(c).map((t) => TILE_COLORS[t]);
            for (let i = 0; i < colors.length; i++) {
              const a = 0.15 + (i / colors.length) * 0.1;
              ctx.globalAlpha = a;
              ctx.fillStyle = colors[i];
              ctx.fillRect(px, py, cell, cell);
            }
            ctx.globalAlpha = 1;
          }

          if (flashAge < 300) {
            const intensity = 1 - flashAge / 300;
            ctx.fillStyle = `rgba(245,158,11,${intensity * 0.5})`;
            ctx.fillRect(px, py, cell, cell);
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, step]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <>
          <div className="absolute top-2 left-2 z-10 text-[9px] font-mono text-amber-400/70 space-y-0.5">
            <div>remaining: {cellsRemaining}</div>
            <div>steps: {stepsTaken}</div>
            <div>collapsed: {collapseCount}</div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <label className="flex items-center gap-1">
                grid:
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={gridSize}
                  onChange={(e) => setGridSize(parseInt(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-10">
                  {gridSize}×{gridSize}
                </span>
              </label>
              <label className="flex items-center gap-1">
                speed:
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-10">{speed}/s</span>
              </label>
              <button
                onClick={step}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Step
              </button>
              <button
                onClick={() => setAuto((a) => !a)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  auto
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {auto ? "Stop" : "Auto"}
              </button>
              <button
                onClick={() => setPaused((p) => !p)}
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
              <button
                onClick={() => setShowEntropy((e) => !e)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  showEntropy
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                entropy
              </button>
              <div className="w-px h-3 bg-border/30" />
              <button
                onClick={() => handlePresetChange("random")}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  preset === "random"
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                Random
              </button>
              <button
                onClick={() => handlePresetChange("checkerboard")}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  preset === "checkerboard"
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                Checkerboard
              </button>
              <button
                onClick={() => handlePresetChange("river")}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  preset === "river"
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                River
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
