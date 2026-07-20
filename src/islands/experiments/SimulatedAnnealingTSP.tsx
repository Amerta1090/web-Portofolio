import { useRef, useEffect, useState, useCallback } from "react";

interface City {
  x: number;
  y: number;
  label: string;
}

interface SAState {
  current: number[];
  best: number[];
  currentDist: number;
  bestDist: number;
  temp: number;
  iteration: number;
  accepted: number;
  rejected: number;
  candidateDist: number;
}

const MAX_CITIES = 50;
const PADDING = 40;

function euclidean(a: City, b: City): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function totalDistance(order: number[], cities: City[]): number {
  let d = 0;
  for (let i = 0; i < order.length; i++) {
    d += euclidean(cities[order[i]], cities[order[(i + 1) % order.length]]);
  }
  return d;
}

function generateNeighbor(order: number[]): number[] {
  const n = order.length;
  const next = order.slice();
  if (Math.random() < 0.6) {
    const i = Math.floor(Math.random() * n);
    const j = Math.floor(Math.random() * n);
    [next[i], next[j]] = [next[j], next[i]];
  } else {
    let i = Math.floor(Math.random() * n);
    let j = Math.floor(Math.random() * n);
    if (i > j) [i, j] = [j, i];
    const segment = next.slice(i, j + 1).reverse();
    next.splice(i, j - i + 1, ...segment);
  }
  return next;
}

function generateRandomOrder(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function presetRandom(n: number, w: number, h: number): City[] {
  const cities: City[] = [];
  const used = new Set<string>();
  for (let i = 0; i < n && cities.length < n; i++) {
    let tries = 0;
    while (tries < 100) {
      const x = PADDING + Math.random() * (w - 2 * PADDING);
      const y = PADDING + Math.random() * (h - 2 * PADDING);
      const key = `${Math.round(x / 10)},${Math.round(y / 10)}`;
      if (!used.has(key)) {
        used.add(key);
        cities.push({ x, y, label: String(cities.length + 1) });
        break;
      }
      tries++;
    }
  }
  return cities;
}

function presetGrid(cols: number, rows: number, w: number, h: number): City[] {
  const cities: City[] = [];
  let label = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = PADDING + (c + 0.5) * ((w - 2 * PADDING) / cols);
      const y = PADDING + (r + 0.5) * ((h - 2 * PADDING) / rows);
      cities.push({ x, y, label: String(label++) });
    }
  }
  return cities;
}

function presetCircle(n: number, w: number, h: number): City[] {
  const cities: City[] = [];
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - PADDING;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    cities.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      label: String(i + 1),
    });
  }
  return cities;
}

function tempToColor(t: number, maxT: number): string {
  const ratio = Math.max(0, Math.min(1, t / maxT));
  const r = Math.round(255 * ratio + 80 * (1 - ratio));
  const g = Math.round(80 * ratio + 120 * (1 - ratio));
  const b = Math.round(80 * ratio + 255 * (1 - ratio));
  return `rgb(${r},${g},${b})`;
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cities: City[],
  state: SAState,
  candidate: number[] | null,
  initialTemp: number,
) {
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "#0f0f11";
  ctx.fillRect(0, 0, w, h);

  if (cities.length === 0) {
    ctx.fillStyle = "#555";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Click to add cities, or use a preset", w / 2, h / 2);
    return;
  }

  const tempRatio = state.temp / initialTemp;
  const baseColor = tempToColor(state.temp, initialTemp);

  if (candidate) {
    ctx.beginPath();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.moveTo(cities[candidate[0]].x, cities[candidate[0]].y);
    for (let i = 1; i < candidate.length; i++) {
      ctx.lineTo(cities[candidate[i]].x, cities[candidate[i]].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (state.current.length > 0) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, `rgba(245,158,11,${0.6 + 0.4 * (1 - tempRatio)})`);
    grad.addColorStop(1, baseColor);
    ctx.beginPath();
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2 + tempRatio * 2;
    ctx.moveTo(cities[state.current[0]].x, cities[state.current[0]].y);
    for (let i = 1; i < state.current.length; i++) {
      ctx.lineTo(cities[state.current[i]].x, cities[state.current[i]].y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  if (state.best.length > 0) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(34,197,94,0.18)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(cities[state.best[0]].x, cities[state.best[0]].y);
    for (let i = 1; i < state.best.length; i++) {
      ctx.lineTo(cities[state.best[i]].x, cities[state.best[i]].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (let i = 0; i < cities.length; i++) {
    const c = cities[i];
    const isStart = state.current.length > 0 && state.current[0] === i;

    ctx.beginPath();
    ctx.arc(c.x, c.y, isStart ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isStart ? "#f59e0b" : "#ddd";
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.label, c.x, c.y - 12);
  }

  const barW = 120;
  const barH = 10;
  const barX = w - barW - 12;
  const barY = 12;
  ctx.fillStyle = "#222";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = baseColor;
  ctx.fillRect(barX, barY, barW * tempRatio, barH);
  ctx.strokeStyle = "#555";
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = "#aaa";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText("Temperature", barX - 4, barY + 9);

  const total = state.accepted + state.rejected;
  const rate = total > 0 ? ((state.accepted / total) * 100).toFixed(1) : "—";
  const info = [
    `Iteration: ${state.iteration}`,
    `Current: ${state.currentDist.toFixed(1)}`,
    `Best: ${state.bestDist.toFixed(1)}`,
    `Temp: ${state.temp.toFixed(2)}`,
    `Accept Rate: ${rate}%`,
    `Cities: ${cities.length}`,
  ];

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(8, 8, 180, info.length * 18 + 12);
  ctx.fillStyle = "#ccc";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  for (let i = 0; i < info.length; i++) {
    ctx.fillText(info[i], 16, 26 + i * 18);
  }
}

export default function SimulatedAnnealingTSP({
  compact,
}: {
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  const [cities, setCities] = useState<City[]>([]);
  const [initialTemp, setInitialTemp] = useState(100);
  const [coolingRate, setCoolingRate] = useState(0.005);
  const [speed, setSpeed] = useState(50);
  const [paused, setPaused] = useState(true);

  const citiesRef = useRef<City[]>([]);
  const saStateRef = useRef<SAState>({
    current: [],
    best: [],
    currentDist: 0,
    bestDist: 0,
    temp: 100,
    iteration: 0,
    accepted: 0,
    rejected: 0,
    candidateDist: 0,
  });
  const candidateRef = useRef<number[] | null>(null);
  const initialTempRef = useRef(100);
  const coolingRateRef = useRef(0.005);
  const speedRef = useRef(50);
  const pausedRef = useRef(true);

  useEffect(() => { citiesRef.current = cities; }, [cities]);
  useEffect(() => { initialTempRef.current = initialTemp; }, [initialTemp]);
  useEffect(() => { coolingRateRef.current = coolingRate; }, [coolingRate]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const initSA = useCallback(() => {
    const cs = citiesRef.current;
    if (cs.length < 2) return;
    const order = generateRandomOrder(cs.length);
    const dist = totalDistance(order, cs);
    saStateRef.current = {
      current: order,
      best: order.slice(),
      currentDist: dist,
      bestDist: dist,
      temp: initialTempRef.current,
      iteration: 0,
      accepted: 0,
      rejected: 0,
      candidateDist: 0,
    };
    candidateRef.current = null;
  }, []);

  const doStep = useCallback(() => {
    const st = saStateRef.current;
    const cs = citiesRef.current;
    if (cs.length < 2 || st.current.length === 0) return;

    const candidate = generateNeighbor(st.current);
    const candDist = totalDistance(candidate, cs);
    const delta = candDist - st.currentDist;

    st.candidateDist = candDist;
    let accept = false;
    if (delta < 0) {
      accept = true;
    } else if (st.temp > 0.001) {
      const prob = Math.exp(-delta / st.temp);
      accept = Math.random() < prob;
    }

    if (accept) {
      st.current = candidate;
      st.currentDist = candDist;
      st.accepted++;
      if (candDist < st.bestDist) {
        st.best = candidate.slice();
        st.bestDist = candDist;
      }
      candidateRef.current = candidate;
    } else {
      st.rejected++;
      candidateRef.current = candidate;
    }

    st.temp = Math.max(0.001, st.temp * (1 - coolingRateRef.current));
    st.iteration++;

    saStateRef.current = { ...st };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    draw(ctx, rect.width, rect.height, citiesRef.current, saStateRef.current, candidateRef.current, initialTempRef.current);
  }, []);

  useEffect(() => {
    if (compact) {
      initSA();
    }
  }, [compact, initSA]);

  const loop = useCallback(() => {
    if (!pausedRef.current) {
      const stepsPerFrame = Math.max(1, Math.floor(speedRef.current / 10));
      for (let i = 0; i < stepsPerFrame; i++) {
        doStep();
      }
    }
    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [doStep, render]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (compact) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (cities.length >= MAX_CITIES) return;
      const newCity: City = {
        x,
        y,
        label: String(cities.length + 1),
      };
      setCities((prev) => [...prev, newCity]);
    },
    [compact, cities.length],
  );

  const handleReset = useCallback(() => {
    setPaused(true);
    initSA();
  }, [initSA]);

  const handleStepOnce = useCallback(() => {
    setPaused(true);
    doStep();
  }, [doStep]);

  const loadPreset = useCallback(
    (preset: string) => {
      setPaused(true);
      const w = canvasRef.current?.getBoundingClientRect().width ?? 500;
      const h = canvasRef.current?.getBoundingClientRect().height ?? 400;
      let newCities: City[];
      switch (preset) {
        case "random10":
          newCities = presetRandom(10, w, h);
          break;
        case "random20":
          newCities = presetRandom(20, w, h);
          break;
        case "grid":
          newCities = presetGrid(5, 4, w, h);
          break;
        case "circle":
          newCities = presetCircle(12, w, h);
          break;
        default:
          return;
      }
      setCities(newCities);
      citiesRef.current = newCities;
      requestAnimationFrame(() => {
        initSA();
      });
    },
    [initSA],
  );

  const handleClear = useCallback(() => {
    setPaused(true);
    setCities([]);
    citiesRef.current = [];
    saStateRef.current = {
      current: [],
      best: [],
      currentDist: 0,
      bestDist: 0,
      temp: initialTempRef.current,
      iteration: 0,
      accepted: 0,
      rejected: 0,
      candidateDist: 0,
    };
    candidateRef.current = null;
  }, []);

  if (compact) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#0f0f11]">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: "block" }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      <div className="flex flex-wrap gap-2 items-center text-xs">
        <button
          onClick={() => {
            setPaused((p) => {
              const next = !p;
              if (next === false && saStateRef.current.current.length === 0) {
                initSA();
              }
              return next;
            });
          }}
          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono"
        >
          {paused ? "▶ Run" : "⏸ Pause"}
        </button>
        <button
          onClick={handleStepOnce}
          className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-mono"
        >
          Step
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-white font-mono"
        >
          Reset
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 rounded bg-red-900/60 hover:bg-red-800/60 text-white font-mono"
        >
          Clear
        </button>

        <span className="w-px h-5 bg-zinc-700 mx-1" />

        <button
          onClick={() => loadPreset("random10")}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
        >
          10 Cities
        </button>
        <button
          onClick={() => loadPreset("random20")}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
        >
          20 Cities
        </button>
        <button
          onClick={() => loadPreset("grid")}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
        >
          Grid
        </button>
        <button
          onClick={() => loadPreset("circle")}
          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono"
        >
          Circle
        </button>

        <span className="w-px h-5 bg-zinc-700 mx-1" />

        <label className="flex items-center gap-1 text-zinc-400">
          Speed
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-20 accent-amber-500"
          />
        </label>
        <label className="flex items-center gap-1 text-zinc-400">
          T₀
          <input
            type="range"
            min={10}
            max={500}
            value={initialTemp}
            onChange={(e) => setInitialTemp(Number(e.target.value))}
            className="w-16 accent-amber-500"
          />
        </label>
        <label className="flex items-center gap-1 text-zinc-400">
          Cooling
          <input
            type="range"
            min={1}
            max={20}
            value={Math.round(coolingRate * 1000)}
            onChange={(e) => setCoolingRate(Number(e.target.value) / 1000)}
            className="w-16 accent-amber-500"
          />
        </label>
      </div>

      <div ref={containerRef} className="relative flex-1 min-h-0 rounded-lg overflow-hidden border border-zinc-800">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
          style={{ display: "block" }}
        />
        {cities.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-500 font-mono text-sm">
            Click canvas to add cities, or use a preset above
          </div>
        )}
      </div>
    </div>
  );
}
