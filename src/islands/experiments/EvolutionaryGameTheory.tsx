import { useRef, useEffect, useState, useCallback } from "react";

const PRESETS: Record<string, { name: string; payoff: number[][] }> = {
  "hawk-dove": {
    name: "Hawk-Dove",
    payoff: [
      [-1, 2],
      [0, 1],
    ],
  },
  "rps": {
    name: "Rock-Paper-Scissors",
    payoff: [
      [0, -1, 1],
      [1, 0, -1],
      [-1, 1, 0],
    ],
  },
  "stag-hunt": {
    name: "Stag Hunt",
    payoff: [
      [4, 0],
      [3, 2],
    ],
  },
  "coordination": {
    name: "Coordination",
    payoff: [
      [3, 0],
      [0, 2],
    ],
  },
};

const TRAJECTORY_COLORS = [
  [245, 158, 11],
  [139, 92, 246],
  [6, 182, 212],
  [236, 72, 153],
  [16, 185, 129],
  [251, 191, 36],
];

function barycentricToCartesian(x: number, y: number, size: number, cx: number, cy: number): [number, number] {
  const h = size * Math.sqrt(3) / 2;
  const px = cx + (y * 0.5 + x) * size - size / 2;
  const py = cy - y * h;
  return [px, py];
}

export default function EvolutionaryGameTheory({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);

  const [preset, setPreset] = useState("hawk-dove");
  const [speed, setSpeed] = useState(1);
  const [showVectorField, setShowVectorField] = useState(true);
  const [running, setRunning] = useState(false);

  const trajectoriesRef = useRef<{ x: number; y: number; color: number[] }[][]>([]);
  const timeSeriesRef = useRef<number[][]>([]);
  const currentFreqsRef = useRef<number[]>([0.5, 0.5]);
  const presetRef = useRef(preset);
  const speedRef = useRef(speed);
  const runningSimRef = useRef(false);

  useEffect(() => { presetRef.current = preset; }, [preset]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { runningSimRef.current = running; }, [running]);

  const initSimulation = useCallback(() => {
    const p = PRESETS[presetRef.current] || PRESETS["hawk-dove"];
    const n = p.payoff.length;
    currentFreqsRef.current = Array.from({ length: n }, () => Math.random());
    const sum = currentFreqsRef.current.reduce((a, b) => a + b, 0);
    currentFreqsRef.current = currentFreqsRef.current.map((x) => x / sum);
    trajectoriesRef.current = [];
    timeSeriesRef.current = [[...currentFreqsRef.current]];
  }, []);

  useEffect(() => {
    initSimulation();
  }, [preset, initSimulation]);

  const addRandomTrajectory = useCallback(() => {
    const p = PRESETS[presetRef.current] || PRESETS["hawk-dove"];
    const n = p.payoff.length;
    const freqs = Array.from({ length: n }, () => Math.random());
    const sum = freqs.reduce((a, b) => a + b, 0);
    const norm = freqs.map((x) => x / sum);
    const trail: { x: number; y: number; color: number[] }[] = [];
    const color = TRAJECTORY_COLORS[trajectoriesRef.current.length % TRAJECTORY_COLORS.length];
    let state = norm;
    for (let i = 0; i < 2000; i++) {
      const tx = state[0];
      const ty = state.length > 2 ? state[1] : 1 - state[0];
      trail.push({ x: tx, y: ty, color });
      const fitness: number[] = [];
      let avgFitness = 0;
      for (let j = 0; j < n; j++) {
        let f = 0;
        for (let k = 0; k < n; k++) f += p.payoff[j][k] * state[k];
        fitness.push(f);
        avgFitness += f * state[j];
      }
      const newState = state.slice();
      for (let j = 0; j < n; j++) {
        newState[j] += 0.05 * state[j] * (fitness[j] - avgFitness);
        if (newState[j] < 0) newState[j] = 0;
      }
      const ns = newState.reduce((a, b) => a + b, 0);
      state = newState.map((x) => x / ns);
    }
    trajectoriesRef.current.push(trail);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;
    timeRef.current = 0;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 500),
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

    function drawSimplex(cx: number, cy: number, size: number, payoff: number[][]) {
      if (payoff.length === 0) return;
      const n = payoff.length;
      const h = size * Math.sqrt(3) / 2;

      const verts: [number, number][] = [];
      if (n === 3) {
        for (let i = 0; i < 3; i++) {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
          verts.push([cx + size * Math.cos(angle) * 0.5, cy + size * Math.sin(angle) * 0.5]);
        }
      } else {
        verts.push([cx - size / 2, cy + h / 2]);
        verts.push([cx + size / 2, cy + h / 2]);
        verts.push([cx, cy - h / 2]);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(verts[0][0], verts[0][1]);
      for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i][0], verts[i][1]);
      ctx.closePath();
      ctx.stroke();

      const labels = n === 3 ? ["S1", "S2", "S3"] : ["S1", "S2"];
      for (let i = 0; i < verts.length; i++) {
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(labels[i] || `S${i + 1}`, verts[i][0], verts[i][1] + (i === 2 ? -8 : 14));
      }

      if (showVectorField && !compact) {
        const gridStep = 0.1;
        for (let u = 0; u <= 1; u += gridStep) {
          for (let v = 0; v <= 1 - u; v += gridStep) {
            const w = 1 - u - v;
            let freqs: number[];
            if (n === 3) {
              freqs = [u, v, w];
            } else {
              freqs = [u, 1 - u];
            }
            const fitness: number[] = [];
            let avgF = 0;
            for (let j = 0; j < freqs.length; j++) {
              let f = 0;
              for (let k = 0; k < freqs.length; k++) f += payoff[j][k] * freqs[k];
              fitness.push(f);
              avgF += f * freqs[j];
            }
            const dx = freqs[0] * (fitness[0] - avgF);
            const dy = freqs.length > 2 ? freqs[1] * (fitness[1] - avgF) : -dx;
            const px = cx + (v * 0.5 + u) * size - size / 2;
            const py = cy - v * h;
            const arrowLen = Math.sqrt(dx * dx + dy * dy) * size * 0.8;
            if (arrowLen > 1) {
              const nx = dx / Math.sqrt(dx * dx + dy * dy);
              const ny = dy / Math.sqrt(dx * dx + dy * dy);
              ctx.strokeStyle = `rgba(245,158,11,${Math.min(0.4, arrowLen * 0.02)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + nx * Math.min(arrowLen, 15), py + ny * Math.min(arrowLen, 15));
              ctx.stroke();
            }
          }
        }
      }

      for (const trail of trajectoriesRef.current) {
        if (trail.length < 2) continue;
        ctx.beginPath();
        for (let j = 0; j < trail.length; j++) {
          const [px, py] = barycentricToCartesian(trail[j].x, trail[j].y, size, cx, cy);
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        const c = trail[0].color;
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.6)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      if (runningSimRef.current) {
        updateSimulation();
      }

      const freqs = currentFreqsRef.current;
      if (freqs.length >= 2) {
        const fx = freqs[0];
        const fy = freqs.length > 2 ? freqs[1] : 0;
        const [px, py] = barycentricToCartesian(fx, fy, size, cx, cy);
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
        ctx.strokeStyle = "rgba(245,158,11,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    function drawTimeSeries(x: number, y: number, w: number, hh: number) {
      const ts = timeSeriesRef.current;
      if (ts.length < 2) return;

      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, hh);

      const cols = [
        [245, 158, 11],
        [139, 92, 246],
        [6, 182, 212],
        [236, 72, 153],
        [16, 185, 129],
      ];

      const n = ts[0].length;
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        for (let j = 0; j < ts.length; j++) {
          const px = x + (j / ts.length) * w;
          const py = y + hh - (ts[j][i] || 0) * hh;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(${cols[i % cols.length].join(",")},0.8)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Frequency", x + 3, y + 10);
    }

    let updateCounter = 0;

    function updateSimulation() {
      const p = PRESETS[presetRef.current] || PRESETS["hawk-dove"];
      const n = p.payoff.length;
      const dt = 0.02 * speedRef.current;
      const freqs = replicatorStep(currentFreqsRef.current, p.payoff, dt);
      currentFreqsRef.current = freqs;

      updateCounter++;
      if (updateCounter % 5 === 0) {
        timeSeriesRef.current.push([...freqs]);
        if (timeSeriesRef.current.length > 300) timeSeriesRef.current.shift();
      }
    }

    function replicatorStep(freqs: number[], payoff: number[][], dt: number): number[] {
      const n = freqs.length;
      const fitness: number[] = [];
      let avgFitness = 0;
      for (let i = 0; i < n; i++) {
        let f = 0;
        for (let j = 0; j < n; j++) f += payoff[i][j] * freqs[j];
        fitness.push(f);
        avgFitness += f * freqs[i];
      }
      const newFreqs = freqs.slice();
      for (let i = 0; i < n; i++) {
        newFreqs[i] += dt * freqs[i] * (fitness[i] - avgFitness);
        if (newFreqs[i] < 0) newFreqs[i] = 0;
      }
      const sum = newFreqs.reduce((a, b) => a + b, 0);
      return sum > 0 ? newFreqs.map((x) => x / sum) : freqs;
    }

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);
      const { w, h } = getSize();
      const ctxH = compact ? h : h * 0.65;
      const timeSeriesH = compact ? 0 : h * 0.3;

      ctx.globalAlpha = compact ? 0.05 : 0.03;
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      const simplexSize = Math.min(w * 0.55, ctxH * 0.9);
      const cx = w / 2;
      const cy = ctxH * 0.48;

      const p = PRESETS[presetRef.current] || PRESETS["hawk-dove"];
      drawSimplex(cx, cy, simplexSize, p.payoff);

      if (!compact && timeSeriesH > 20) {
        drawTimeSeries(20, ctxH + 6, w - 40, timeSeriesH - 12);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, showVectorField]);

  const handleReset = useCallback(() => {
    initSimulation();
    trajectoriesRef.current = [];
    timeSeriesRef.current = [[...currentFreqsRef.current]];
  }, [initSimulation]);

  const toggleRun = useCallback(() => {
    setRunning((r) => !r);
  }, []);

  const presetObj = PRESETS[preset] || PRESETS["hawk-dove"];

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
          <div className="flex flex-wrap gap-1">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  preset === key
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={toggleRun}
              className="px-3 py-1 text-xs rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-all"
            >
              {running ? "Pause" : "Run"}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
            <button
              onClick={addRandomTrajectory}
              className="px-3 py-1 text-xs rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              +Trajectory
            </button>
            <button
              onClick={() => { trajectoriesRef.current = []; }}
              className="px-3 py-1 text-xs rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Clear Traj
            </button>
            <button
              onClick={() => setShowVectorField((v) => !v)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                showVectorField
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {showVectorField ? "VF On" : "VF Off"}
            </button>
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <span className="text-amber-400">{presetObj.name}</span>
            <label className="flex items-center gap-1">
              Speed:
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <span>
              Freq: {currentFreqsRef.current.map((f) => f.toFixed(3)).join(", ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
