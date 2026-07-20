import { useRef, useEffect, useState, useCallback } from "react";

type StrategyId = "tft" | "grim" | "defect" | "cooperate" | "random" | "pavlov" | "gtft";

interface Strategy {
  id: StrategyId;
  name: string;
  color: string;
  decide: (
    myHistory: number[],
    oppHistory: number[],
    myLastPayoff: number,
    oppLastPayoff: number,
  ) => number;
}

const COOPERATE = 1;
const DEFECT = 0;

const PAYOFF = {
  CC: 3,
  CD: 0,
  DC: 5,
  DD: 1,
};

const STRATEGIES: Strategy[] = [
  {
    id: "tft",
    name: "Tit-for-Tat",
    color: "#22d3ee",
    decide: (_my, opp) => {
      if (opp.length === 0) return COOPERATE;
      return opp[opp.length - 1];
    },
  },
  {
    id: "grim",
    name: "Grim Trigger",
    color: "#ef4444",
    decide: (_my, opp) => {
      for (const m of opp) {
        if (m === DEFECT) return DEFECT;
      }
      return COOPERATE;
    },
  },
  {
    id: "defect",
    name: "Always Defect",
    color: "#f97316",
    decide: () => DEFECT,
  },
  {
    id: "cooperate",
    name: "Always Coop",
    color: "#4ade80",
    decide: () => COOPERATE,
  },
  {
    id: "random",
    name: "Random",
    color: "#a78bfa",
    decide: () => (Math.random() < 0.5 ? COOPERATE : DEFECT),
  },
  {
    id: "pavlov",
    name: "Pavlov",
    color: "#fb923c",
    decide: (_my, opp, myPayoff, _oppPayoff) => {
      if (_my.length === 0) return COOPERATE;
      if (myPayoff >= 3) return _my[_my.length - 1];
      return _my[_my.length - 1] === COOPERATE ? DEFECT : COOPERATE;
    },
  },
  {
    id: "gtft",
    name: "Generous TFT",
    color: "#34d399",
    decide: (_my, opp) => {
      if (opp.length === 0) return COOPERATE;
      if (opp[opp.length - 1] === DEFECT) return Math.random() < 0.15 ? COOPERATE : DEFECT;
      return COOPERATE;
    },
  },
];

const ROUNDS_PER_MATCH = 50;
const POPULATION_SIZE = 100;
const MUTATION_RATE = 0.02;

interface GenerationStats {
  counts: Record<StrategyId, number>;
  scores: Record<StrategyId, number>;
}

function initPopulation(): StrategyId[] {
  const pop: StrategyId[] = [];
  const base = Math.floor(POPULATION_SIZE / STRATEGIES.length);
  let remainder = POPULATION_SIZE;
  for (const s of STRATEGIES) {
    const n = s.id === STRATEGIES[STRATEGIES.length - 1].id
      ? remainder
      : base;
    remainder -= n;
    for (let i = 0; i < n; i++) pop.push(s.id);
  }
  for (let i = pop.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pop[i], pop[j]] = [pop[j], pop[i]];
  }
  return pop;
}

function playMatch(a: Strategy, b: Strategy, rounds: number): [number, number] {
  const hA: number[] = [];
  const hB: number[] = [];
  let sA = 0;
  let sB = 0;
  let lastPayoffA = 0;
  let lastPayoffB = 0;
  for (let r = 0; r < rounds; r++) {
    const moveA = a.decide(hA, hB, lastPayoffA, lastPayoffB);
    const moveB = b.decide(hB, hA, lastPayoffB, lastPayoffA);
    const key = `${moveA === COOPERATE ? "C" : "D"}${moveB === COOPERATE ? "C" : "D"}` as "CC" | "CD" | "DC" | "DD";
    sA += PAYOFF[key];
    sB += PAYOFF[key[1] + key[0] as "CC" | "CD" | "DC" | "DD"];
    lastPayoffA = PAYOFF[key];
    lastPayoffB = PAYOFF[key[1] + key[0] as "CC" | "CD" | "DC" | "DD"];
    hA.push(moveA);
    hB.push(moveB);
  }
  return [sA, sB];
}

function runGeneration(pop: StrategyId[]): [StrategyId[], GenerationStats, StrategyId] {
  const stratMap = new Map<string, Strategy>();
  for (const s of STRATEGIES) stratMap.set(s.id, s);

  const counts: Record<StrategyId, number> = {} as Record<StrategyId, number>;
  const scores: Record<StrategyId, number> = {} as Record<StrategyId, number>;
  for (const s of STRATEGIES) {
    counts[s.id] = 0;
    scores[s.id] = 0;
  }
  for (const id of pop) counts[id]++;

  for (let i = 0; i < pop.length; i++) {
    for (let j = i + 1; j < pop.length; j++) {
      const a = stratMap.get(pop[i])!;
      const b = stratMap.get(pop[j])!;
      const [sA, sB] = playMatch(a, b, ROUNDS_PER_MATCH);
      scores[pop[i]] += sA;
      scores[pop[j]] += sB;
    }
  }

  const fitness = pop.map((id) => scores[id] / (pop.length * ROUNDS_PER_MATCH));
  const totalFitness = fitness.reduce((a, b) => a + b, 0.0001);
  const probs = fitness.map((f) => f / totalFitness);

  const cumulative: number[] = [];
  let cum = 0;
  for (const p of probs) {
    cum += p;
    cumulative.push(cum);
  }

  const newPop: StrategyId[] = [];
  for (let i = 0; i < POPULATION_SIZE; i++) {
    const r = Math.random();
    let chosen = pop[0];
    for (let j = 0; j < cumulative.length; j++) {
      if (r <= cumulative[j]) {
        chosen = pop[j];
        break;
      }
    }
    if (Math.random() < MUTATION_RATE) {
      const pool = STRATEGIES.filter((s) => s.id !== chosen);
      chosen = pool[Math.floor(Math.random() * pool.length)].id;
    }
    newPop.push(chosen);
  }

  let maxScore = -Infinity;
  let leader: StrategyId = pop[0];
  for (const s of STRATEGIES) {
    if (scores[s.id] > maxScore) {
      maxScore = scores[s.id];
      leader = s.id;
    }
  }

  return [newPop, { counts, scores }, leader];
}

const stratMap = new Map<string, Strategy>();
for (const s of STRATEGIES) stratMap.set(s.id, s);

export default function PrisonersDilemma({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  const [population, setPopulation] = useState<StrategyId[]>(initPopulation);
  const [history, setHistory] = useState<GenerationStats[]>([]);
  const [generation, setGeneration] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [leader, setLeader] = useState<StrategyId>("tft");
  const [visible, setVisible] = useState<Record<StrategyId, boolean>>(() => {
    const v = {} as Record<StrategyId, boolean>;
    for (const s of STRATEGIES) v[s.id] = true;
    return v;
  });

  const stepGen = useCallback(() => {
    setPopulation((prev) => {
      const [next, stats, ldr] = runGeneration(prev);
      setHistory((h) => {
        const nh = [...h, stats];
        if (nh.length > 200) nh.shift();
        return nh;
      });
      setGeneration((g) => g + 1);
      setLeader(ldr);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPopulation(initPopulation());
    setHistory([]);
    setGeneration(0);
    setRunning(false);
    setLeader("tft");
  }, []);

  useEffect(() => {
    if (!running) return;
    const interval = 1000 / Math.max(speed, 0.5);
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      acc += now - last;
      last = now;
      if (acc >= interval) {
        acc -= interval;
        stepGen();
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, speed, stepGen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0f0f11";
    ctx.fillRect(0, 0, w, h);

    const margin = compact
      ? { top: 4 * dpr, right: 4 * dpr, bottom: 4 * dpr, left: 4 * dpr }
      : { top: 50 * dpr, right: 16 * dpr, bottom: 80 * dpr, left: 50 * dpr };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    if (history.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = `${compact ? 10 : 14}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("Press Run to start tournament", w / 2, h / 2);
      return;
    }

    const visibleStrats = STRATEGIES.filter((s) => visible[s.id]);

    const maxPop = POPULATION_SIZE;
    const genCount = history.length;
    const barWidth = Math.max(chartW / Math.max(genCount, 1), 2 * dpr);

    ctx.save();
    ctx.translate(margin.left, margin.top);

    for (let gi = 0; gi < genCount; gi++) {
      const stats = history[gi];
      const x = (gi / Math.max(genCount, 1)) * chartW;
      let yOff = chartH;
      for (const s of visibleStrats) {
        const count = stats.counts[s.id] || 0;
        const segH = (count / maxPop) * chartH;
        yOff -= segH;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, yOff, Math.max(barWidth - 1, 2), segH);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (!compact) {
      ctx.fillStyle = "#f59e0b";
      ctx.font = `bold ${12 * dpr}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText("PRISONER'S DILEMMA TOURNAMENT", margin.left, 20 * dpr);

      ctx.fillStyle = "#9ca3af";
      ctx.font = `${10 * dpr}px monospace`;
      ctx.fillText(
        `Gen: ${generation}  |  Pop: ${POPULATION_SIZE}  |  Rounds/Match: ${ROUNDS_PER_MATCH}`,
        margin.left,
        36 * dpr,
      );

      ctx.textAlign = "right";
      ctx.fillStyle = stratMap.get(leader)?.color ?? "#fff";
      ctx.fillText(`Leader: ${stratMap.get(leader)?.name}`, w - margin.right, 20 * dpr);
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(`Mutation: ${(MUTATION_RATE * 100).toFixed(0)}%`, w - margin.right, 36 * dpr);

      ctx.fillStyle = "#6b7280";
      ctx.font = `${9 * dpr}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("Generation →", margin.left + chartW / 2, h - 10 * dpr);

      ctx.save();
      ctx.translate(14 * dpr, margin.top + chartH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Population →", 0, 0);
      ctx.restore();

      for (let t = 0; t <= 4; t++) {
        const y = margin.top + (chartH * t) / 4;
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(margin.left + chartW, y);
        ctx.stroke();
        ctx.fillStyle = "#6b7280";
        ctx.textAlign = "right";
        ctx.fillText(`${Math.round((POPULATION_SIZE * (4 - t)) / 4)}`, margin.left - 6 * dpr, y + 4 * dpr);
      }

      if (genCount > 1) {
        const step = Math.ceil(genCount / 8);
        for (let i = 0; i < genCount; i += step) {
          const x = margin.left + (i / Math.max(genCount, 1)) * chartW + barWidth / 2;
          ctx.fillStyle = "#6b7280";
          ctx.textAlign = "center";
          ctx.fillText(`${i + 1}`, x, h - margin.bottom + 14 * dpr);
        }
      }

      const lastStats = history[history.length - 1];
      if (lastStats) {
        const leaderboard = STRATEGIES.map((s) => ({
          ...s,
          count: lastStats.counts[s.id],
          score: lastStats.scores[s.id],
        }))
          .filter((s) => s.count > 0)
          .sort((a, b) => b.score - a.score);

        const lbX = margin.left + chartW - 160 * dpr;
        const lbY = margin.top + 8 * dpr;
        ctx.fillStyle = "rgba(15,15,17,0.8)";
        ctx.fillRect(lbX, lbY, 155 * dpr, (leaderboard.length * 18 + 16) * dpr);
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 1;
        ctx.strokeRect(lbX, lbY, 155 * dpr, (leaderboard.length * 18 + 16) * dpr);

        ctx.fillStyle = "#f59e0b";
        ctx.font = `bold ${9 * dpr}px monospace`;
        ctx.textAlign = "left";
        ctx.fillText("STRATEGY", lbX + 6 * dpr, lbY + 12 * dpr);
        ctx.fillText("POP", lbX + 95 * dpr, lbY + 12 * dpr);
        ctx.fillText("SCORE", lbX + 120 * dpr, lbY + 12 * dpr);

        leaderboard.forEach((s, i) => {
          const rowY = lbY + (i + 1) * 18 * dpr + 14 * dpr;
          ctx.fillStyle = s.color;
          ctx.fillRect(lbX + 4 * dpr, rowY - 8 * dpr, 6 * dpr, 6 * dpr);
          ctx.fillStyle = "#d1d5db";
          ctx.font = `${8 * dpr}px monospace`;
          ctx.fillText(s.name.slice(0, 10), lbX + 14 * dpr, rowY);
          ctx.fillText(`${s.count}`, lbX + 95 * dpr, rowY);
          ctx.fillText(`${s.score}`, lbX + 120 * dpr, rowY);
        });
      }
    }
  }, [history, generation, leader, visible, compact]);

  if (compact) {
    return (
      <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0" />
        <div className="absolute top-1 right-1 z-10 text-[8px] font-mono text-amber-400/70">
          {generation > 0 ? `gen ${generation} · ${stratMap.get(leader)?.name}` : "PD"}
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair" />
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
          <button
            onClick={() => setRunning((r) => !r)}
            className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
              running
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "border-border/40 text-text-secondary hover:border-amber-500/30"
            }`}
          >
            {running ? "Pause" : "Run"}
          </button>
          <button
            onClick={stepGen}
            disabled={running}
            className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all disabled:opacity-30"
          >
            Step
          </button>
          <button
            onClick={reset}
            className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
          >
            Reset
          </button>
          <label className="flex items-center gap-1">
            speed:
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-16 accent-amber-500"
            />
            <span className="text-amber-400 w-6">{speed}</span>
          </label>
          <div className="flex items-center gap-1 flex-wrap">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setVisible((v) => ({ ...v, [s.id]: !v[s.id] }))}
                className={`px-1.5 py-0.5 text-[9px] rounded border transition-all ${
                  visible[s.id]
                    ? "border-border/40 text-text-secondary"
                    : "border-border/20 text-text-secondary/30"
                }`}
                style={visible[s.id] ? { borderColor: s.color + "80", color: s.color } : {}}
              >
                {s.name.slice(0, 6)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
