import { useRef, useEffect, useState, useCallback } from "react";

type Mode = "1d" | "2d";
type Init1d = "center" | "random";
type Init2d = "random" | "center" | "glider" | "pulsar";

const RULES_1D = [
  { name: "Rule 30", rule: 30 },
  { name: "Rule 90", rule: 90 },
  { name: "Rule 110", rule: 110 },
  { name: "Rule 184", rule: 184 },
  { name: "Rule 54", rule: 54 },
  { name: "Rule 11", rule: 11 },
] as const;

const RULES_2D = [
  { name: "Life", born: [3], survive: [2, 3] },
  { name: "Seeds", born: [2], survive: [] as number[] },
  { name: "HighLife", born: [3, 6], survive: [2, 3] },
  { name: "Day&Night", born: [3, 6, 7, 8], survive: [3, 4, 6, 7, 8] },
  { name: "Anneal", born: [4, 6, 7, 8], survive: [3, 5, 6, 7, 8] },
] as const;

const GRID_2D = 100;
const MAX_HISTORY = 2000;

function makeRuleLookup(rule: number): number[] {
  const lookup = new Array<number>(8);
  for (let i = 0; i < 8; i++) {
    lookup[i] = (rule >> i) & 1;
  }
  return lookup;
}

function step1D(cells: number[], lookup: number[]): number[] {
  const n = cells.length;
  const next = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const left = cells[(i - 1 + n) % n];
    const center = cells[i];
    const right = cells[(i + 1) % n];
    next[i] = lookup[(left << 2) | (center << 1) | right];
  }
  return next;
}

function countNeighbors(grid: number[][], x: number, y: number): number {
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = ((x + dx) % cols + cols) % cols;
      const ny = ((y + dy) % rows + rows) % rows;
      count += grid[ny][nx];
    }
  }
  return count;
}

function step2D(
  grid: number[][],
  born: number[],
  survive: number[],
): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const next: number[][] = [];
  for (let y = 0; y < rows; y++) {
    const row = new Array<number>(cols);
    for (let x = 0; x < cols; x++) {
      const n = countNeighbors(grid, x, y);
      row[x] = grid[y][x] === 1
        ? (survive.includes(n) ? 1 : 0)
        : (born.includes(n) ? 1 : 0);
    }
    next.push(row);
  }
  return next;
}

function classifyPattern(popHistory: number[]): string {
  if (popHistory.length < 20) return "evolving";
  const recent = popHistory.slice(-20);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (mean === 0) return "stable";
  const variance = recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length;
  const cv = Math.sqrt(variance) / mean;
  if (variance === 0) return "stable";
  if (cv < 0.02) return "periodic";
  if (cv > 0.15) return "chaotic";
  return "complex";
}

function init1DCells(width: number, mode: Init1d): number[] {
  const cells = new Array<number>(width).fill(0);
  if (mode === "random") {
    for (let i = 0; i < width; i++) cells[i] = Math.random() < 0.5 ? 1 : 0;
  } else {
    cells[Math.floor(width / 2)] = 1;
  }
  return cells;
}

function init2DGrid(rows: number, cols: number, pattern: Init2d): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < rows; y++) grid.push(new Array<number>(cols).fill(0));

  if (pattern === "random") {
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++)
        grid[y][x] = Math.random() < 0.3 ? 1 : 0;
  } else if (pattern === "center") {
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        if (Math.abs(dx) + Math.abs(dy) <= 3) {
          grid[((cy + dy) % rows + rows) % rows][((cx + dx) % cols + cols) % cols] = 1;
        }
      }
    }
  } else if (pattern === "glider") {
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    const g = [[0, 1, 0], [0, 0, 1], [1, 1, 1]];
    for (let dy = 0; dy < 3; dy++)
      for (let dx = 0; dx < 3; dx++)
        if (g[dy][dx]) {
          grid[((cy + dy - 1) % rows + rows) % rows][((cx + dx - 1) % cols + cols) % cols] = 1;
        }
  } else if (pattern === "pulsar") {
    const cx = Math.floor(cols / 2);
    const cy = Math.floor(rows / 2);
    const p = [
      "..OOO...OOO.",
      "...........",
      "O..O.OO.O..O",
      "O..O.OO.O..O",
      "O..O.OO.O..O",
      "..OOO...OOO.",
      "...........",
      "..OOO...OOO.",
      "O..O.OO.O..O",
      "O..O.OO.O..O",
      "O..O.OO.O..O",
      "...........",
      "..OOO...OOO.",
    ];
    for (let dy = 0; dy < p.length; dy++)
      for (let dx = 0; dx < p[dy].length; dx++)
        if (p[dy][dx] === "O") {
          grid[((cy + dy - 6) % rows + rows) % rows][((cx + dx - 6) % cols + cols) % cols] = 1;
        }
  }

  return grid;
}

export default function CellularAutomata({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [mode, setMode] = useState<Mode>("1d");
  const [rule1dIdx, setRule1dIdx] = useState(0);
  const [rule2dIdx, setRule2dIdx] = useState(0);
  const [width1d, setWidth1d] = useState(200);
  const [speed, setSpeed] = useState(10);
  const [paused, setPaused] = useState(false);
  const [init1d, setInit1d] = useState<Init1d>("center");
  const [init2d, setInit2d] = useState<Init2d>("center");

  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(0);
  const [classification, setClassification] = useState("evolving");

  const modeRef = useRef(mode);
  const rule1dIdxRef = useRef(rule1dIdx);
  const rule2dIdxRef = useRef(rule2dIdx);
  const width1dRef = useRef(width1d);
  const speedRef = useRef(speed);
  const pausedRef = useRef(paused);
  const init1dRef = useRef(init1d);
  const init2dRef = useRef(init2d);

  const history1dRef = useRef<number[][]>([]);
  const gen1dRef = useRef(0);
  const cells1dRef = useRef<number[]>([]);

  const grid2dRef = useRef<number[][]>([]);
  const gen2dRef = useRef(0);
  const popHistory2dRef = useRef<number[]>([]);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { rule1dIdxRef.current = rule1dIdx; }, [rule1dIdx]);
  useEffect(() => { rule2dIdxRef.current = rule2dIdx; }, [rule2dIdx]);
  useEffect(() => { width1dRef.current = width1d; }, [width1d]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { init1dRef.current = init1d; }, [init1d]);
  useEffect(() => { init2dRef.current = init2d; }, [init2d]);

  const reset1D = useCallback(() => {
    const w = width1dRef.current;
    const cells = init1DCells(w, init1dRef.current);
    cells1dRef.current = cells;
    history1dRef.current = [cells.slice()];
    gen1dRef.current = 0;
    setGeneration(0);
    setPopulation(cells.reduce((a, b) => a + b, 0));
  }, []);

  const reset2D = useCallback(() => {
    const grid = init2DGrid(GRID_2D, GRID_2D, init2dRef.current);
    grid2dRef.current = grid;
    gen2dRef.current = 0;
    popHistory2dRef.current = [];
    const pop = grid.flat().reduce((a, b) => a + b, 0);
    setGeneration(0);
    setPopulation(pop);
    setClassification("evolving");
  }, []);

  const handleReset = useCallback(() => {
    if (modeRef.current === "1d") reset1D();
    else reset2D();
  }, [reset1D, reset2D]);

  const handleClear = useCallback(() => {
    if (modeRef.current === "1d") {
      const w = width1dRef.current;
      cells1dRef.current = new Array(w).fill(0);
      history1dRef.current = [new Array(w).fill(0)];
      gen1dRef.current = 0;
      setGeneration(0);
      setPopulation(0);
    } else {
      grid2dRef.current = Array.from({ length: GRID_2D }, () => new Array<number>(GRID_2D).fill(0));
      gen2dRef.current = 0;
      popHistory2dRef.current = [];
      setGeneration(0);
      setPopulation(0);
      setClassification("evolving");
    }
  }, []);

  useEffect(() => {
    if (mode === "1d") reset1D();
    else reset2D();
  }, [mode, rule1dIdx, rule2dIdx, width1d, init1d, init2d, reset1D, reset2D]);

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

      const { w, h } = getSize();

      const stepInterval = compact ? 1000 / 15 : 1000 / speedRef.current;
      if (!pausedRef.current && time - lastStep > stepInterval) {
        if (modeRef.current === "1d") {
          const lookup = makeRuleLookup(RULES_1D[rule1dIdxRef.current].rule);
          const next = step1D(cells1dRef.current, lookup);
          cells1dRef.current = next;
          history1dRef.current.push(next.slice());
          if (history1dRef.current.length > MAX_HISTORY) {
            history1dRef.current = history1dRef.current.slice(-MAX_HISTORY);
          }
          gen1dRef.current++;
          setGeneration(gen1dRef.current);
          setPopulation(next.reduce((a, b) => a + b, 0));
        } else {
          const rule = RULES_2D[rule2dIdxRef.current];
          const next = step2D(grid2dRef.current, [...rule.born], [...rule.survive]);
          grid2dRef.current = next;
          gen2dRef.current++;
          const pop = next.flat().reduce((a, b) => a + b, 0);
          popHistory2dRef.current.push(pop);
          if (popHistory2dRef.current.length > 50) {
            popHistory2dRef.current = popHistory2dRef.current.slice(-50);
          }
          setGeneration(gen2dRef.current);
          setPopulation(pop);
          if (gen2dRef.current >= 50) {
            setClassification(classifyPattern(popHistory2dRef.current));
          }
        }
        lastStep = time;
      }

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      if (modeRef.current === "1d") {
        const history = history1dRef.current;
        const numCells = width1dRef.current;
        if (history.length === 0 || numCells === 0) return;

        const cellW = w / numCells;
        const maxVisible = Math.floor(h);
        const totalGens = history.length;
        const startGen = Math.max(0, totalGens - maxVisible);

        for (let gen = startGen; gen < totalGens; gen++) {
          const cells = history[gen];
          const localIdx = gen - startGen;
          const y = h - (localIdx + 1);

          for (let x = 0; x < numCells; x++) {
            if (cells[x]) {
              ctx.fillStyle = "rgba(245,158,11,0.9)";
              ctx.fillRect(x * cellW, y, Math.ceil(cellW), 1);
            }
          }
        }
      } else {
        const grid = grid2dRef.current;
        if (grid.length === 0) return;
        const rows = grid.length;
        const cols = grid[0].length;
        const cellW = w / cols;
        const cellH = h / rows;

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            if (grid[y][x]) {
              ctx.fillStyle = "rgba(245,158,11,0.9)";
              ctx.fillRect(x * cellW, y * cellH, Math.ceil(cellW), Math.ceil(cellH));
            }
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
  }, [compact]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (compact) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;

      if (modeRef.current === "1d") {
        const numCells = width1dRef.current;
        const idx = Math.floor(mx * numCells);
        if (idx >= 0 && idx < numCells) {
          cells1dRef.current[idx] = cells1dRef.current[idx] ? 0 : 1;
          history1dRef.current[history1dRef.current.length - 1] = cells1dRef.current.slice();
          setPopulation(cells1dRef.current.reduce((a, b) => a + b, 0));
        }
      } else {
        const grid = grid2dRef.current;
        if (grid.length === 0) return;
        const cols = grid[0].length;
        const rows = grid.length;
        const cx = Math.floor(mx * cols);
        const cy = Math.floor(my * rows);
        if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
          grid[cy][cx] = grid[cy][cx] ? 0 : 1;
          setPopulation(grid.flat().reduce((a, b) => a + b, 0));
        }
      }
    },
    [compact],
  );

  const ruleName = mode === "1d"
    ? RULES_1D[rule1dIdx].name
    : RULES_2D[rule2dIdx].name;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleCanvasClick}
      />
      {!compact && (
        <>
          <div className="absolute top-2 left-2 z-10 text-[9px] font-mono text-amber-400/70 space-y-0.5">
            <div>gen: {generation}</div>
            <div>pop: {population}</div>
            <div>rule: {ruleName}</div>
            {mode === "2d" && gen2dRef.current >= 50 && (
              <div>class: {classification}</div>
            )}
          </div>

          <div className="absolute top-2 right-2 z-10 flex gap-1">
            <button
              onClick={() => setMode("1d")}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                mode === "1d"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              1D
            </button>
            <button
              onClick={() => setMode("2d")}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                mode === "2d"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              2D
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              {mode === "1d" ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {RULES_1D.map((r, i) => (
                    <button
                      key={r.rule}
                      onClick={() => setRule1dIdx(i)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                        rule1dIdx === i
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                          : "border-border/40 text-text-secondary hover:border-amber-500/30"
                      }`}
                    >
                      {r.rule}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  {RULES_2D.map((r, i) => (
                    <button
                      key={r.name}
                      onClick={() => setRule2dIdx(i)}
                      className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                        rule2dIdx === i
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                          : "border-border/40 text-text-secondary hover:border-amber-500/30"
                      }`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-1">
                speed:
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-10">{speed}/s</span>
              </label>

              {mode === "1d" && (
                <label className="flex items-center gap-1">
                  width:
                  <input
                    type="range"
                    min={100}
                    max={500}
                    step={50}
                    value={width1d}
                    onChange={(e) => setWidth1d(parseInt(e.target.value))}
                    className="w-20 accent-amber-500"
                  />
                  <span className="text-amber-400 w-10">{width1d}</span>
                </label>
              )}

              {mode === "1d" ? (
                <button
                  onClick={() => setInit1d((m) => (m === "center" ? "random" : "center"))}
                  className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
                >
                  {init1d}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const ps: Init2d[] = ["random", "center", "glider", "pulsar"];
                    setInit2d((p) => ps[(ps.indexOf(p) + 1) % ps.length]);
                  }}
                  className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
                >
                  {init2d}
                </button>
              )}

              <button
                onClick={() => setPaused((p) => !p)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  paused
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {paused ? "Play" : "Pause"}
              </button>

              <button
                onClick={handleReset}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Reset
              </button>

              <button
                onClick={handleClear}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
