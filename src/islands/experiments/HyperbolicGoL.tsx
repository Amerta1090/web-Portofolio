import { useRef, useEffect, useState, useCallback } from "react";

type RuleName = "conway" | "seeds" | "highlife";
type PatternName = "random" | "center" | "ring" | "custom";

interface Rule {
  birth: number[];
  survive: number[];
  label: string;
}

const RULES: Record<RuleName, Rule> = {
  conway: { birth: [3], survive: [2, 3], label: "Conway" },
  seeds: { birth: [2], survive: [], label: "Seeds" },
  highlife: { birth: [3, 6], survive: [2, 3], label: "HighLife" },
};

const RULE_KEYS: RuleName[] = ["conway", "seeds", "highlife"];
const PATTERN_KEYS: PatternName[] = ["random", "center", "ring", "custom"];
const RINGS = [1, 7, 14, 21, 28, 35, 42, 49];
const TOTAL = RINGS.reduce((a, b) => a + b, 0);
const SCALE = 0.32;
const K = 7;

interface Cell {
  ring: number;
  pos: number;
  x: number;
  y: number;
  nb: number[];
}

function buildCells(): Cell[] {
  const cs: Cell[] = [];
  cs.push({ ring: 0, pos: 0, x: 0, y: 0, nb: [] });
  for (let r = 1; r < RINGS.length; r++) {
    const n = RINGS[r];
    for (let p = 0; p < n; p++) {
      const a = (2 * Math.PI * p) / n;
      const d = Math.tanh(r * SCALE);
      cs.push({
        ring: r,
        pos: p,
        x: d * Math.cos(a),
        y: d * Math.sin(a),
        nb: [],
      });
    }
  }
  for (let i = 0; i < cs.length; i++) {
    const ds = cs
      .map((c, j) => ({
        j,
        d: (cs[i].x - c.x) ** 2 + (cs[i].y - c.y) ** 2,
      }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d);
    cs[i].nb = ds.slice(0, K).map((e) => e.j);
  }
  return cs;
}

const CELLS = buildCells();

function nextGen(s: boolean[], r: Rule): boolean[] {
  return s.map((on, i) => {
    let n = 0;
    for (const j of CELLS[i].nb) if (s[j]) n++;
    return on ? r.survive.includes(n) : r.birth.includes(n);
  });
}

function countPop(s: boolean[]): number {
  let c = 0;
  for (let i = 0; i < s.length; i++) if (s[i]) c++;
  return c;
}

function makePattern(name: PatternName): boolean[] {
  const s = new Array<boolean>(TOTAL).fill(false);
  if (name === "random") {
    for (let i = 0; i < TOTAL; i++) s[i] = Math.random() < 0.3;
  } else if (name === "center") {
    s[0] = true;
    for (const j of CELLS[0].nb) s[j] = true;
  } else if (name === "ring") {
    for (let i = 0; i < TOTAL; i++) if (CELLS[i].ring === 3) s[i] = true;
  }
  return s;
}

export default function HyperbolicGoL({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [paused, setPaused] = useState(!compact);
  const [speed, setSpeed] = useState(3);
  const [ruleName, setRuleName] = useState<RuleName>("conway");
  const [patName, setPatName] = useState<PatternName>("random");
  const [gen, setGen] = useState(0);
  const [alive, setAlive] = useState(0);

  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  const ruleRef = useRef(ruleName);
  const patRef = useRef(patName);
  const genRef = useRef(0);
  const gridRef = useRef<boolean[]>(makePattern("random"));

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  useEffect(() => {
    ruleRef.current = ruleName;
  }, [ruleName]);
  useEffect(() => {
    patRef.current = patName;
  }, [patName]);

  useEffect(() => {
    gridRef.current = makePattern("random");
    genRef.current = 0;
    setGen(0);
    setAlive(countPop(gridRef.current));
  }, []);

  const doStep = useCallback(() => {
    gridRef.current = nextGen(gridRef.current, RULES[ruleRef.current]);
    genRef.current++;
    setGen(genRef.current);
    setAlive(countPop(gridRef.current));
  }, []);

  const doClear = useCallback(() => {
    gridRef.current = new Array<boolean>(TOTAL).fill(false);
    genRef.current = 0;
    setGen(0);
    setAlive(0);
  }, []);

  const doReset = useCallback(() => {
    gridRef.current = makePattern(patRef.current);
    genRef.current = 0;
    setGen(0);
    setAlive(countPop(gridRef.current));
  }, []);

  const cyclePattern = useCallback(() => {
    const i = PATTERN_KEYS.indexOf(patRef.current);
    const next = PATTERN_KEYS[(i + 1) % PATTERN_KEYS.length];
    patRef.current = next;
    setPatName(next);
    gridRef.current = makePattern(next);
    genRef.current = 0;
    setGen(0);
    setAlive(countPop(gridRef.current));
  }, []);

  const cycleRule = useCallback(() => {
    const i = RULE_KEYS.indexOf(ruleRef.current);
    ruleRef.current = RULE_KEYS[(i + 1) % RULE_KEYS.length];
    setRuleName(ruleRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    runningRef.current = true;

    const dims = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 500),
    });

    const resize = () => {
      const { w, h } = dims();
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

    let last = 0;

    function frame(t: number) {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(frame);

      if (!pausedRef.current && t - last > 1000 / speedRef.current) {
        gridRef.current = nextGen(gridRef.current, RULES[ruleRef.current]);
        genRef.current++;
        setGen(genRef.current);
        setAlive(countPop(gridRef.current));
        last = t;
      }

      const { w, h } = dims();
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const R = Math.min(w, h) * 0.42;
      const ox = w / 2;
      const oy = h / 2;
      const g = gridRef.current;

      ctx.beginPath();
      ctx.arc(ox, oy, R, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const grd = ctx.createRadialGradient(ox, oy, R * 0.88, ox, oy, R);
      grd.addColorStop(0, "rgba(245,158,11,0)");
      grd.addColorStop(1, "rgba(245,158,11,0.04)");
      ctx.fillStyle = grd;
      ctx.fill();

      for (let i = 0; i < CELLS.length; i++) {
        const c = CELLS[i];
        const px = ox + c.x * R;
        const py = oy + c.y * R;
        const sz = (R * 0.12) / (1 + c.ring * 0.3);
        const ang = Math.atan2(c.y, c.x);

        ctx.beginPath();
        for (let v = 0; v < 7; v++) {
          const a = ang + (2 * Math.PI * v) / 7;
          const vx = px + sz * Math.cos(a);
          const vy = py + sz * Math.sin(a);
          if (v === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        }
        ctx.closePath();

        if (g[i]) {
          ctx.save();
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#f59e0b";
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillStyle = "#1a1a2e";
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (compact || patRef.current !== "custom") return;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const R = Math.min(w, h) * 0.42;
      const ox = w / 2;
      const oy = h / 2;
      let best = -1;
      let bd = Infinity;
      for (let i = 0; i < CELLS.length; i++) {
        const c = CELLS[i];
        const d = (mx - (ox + c.x * R)) ** 2 + (my - (oy + c.y * R)) ** 2;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      if (best >= 0 && bd < (R * 0.15) ** 2) {
        gridRef.current[best] = !gridRef.current[best];
        setAlive(countPop(gridRef.current));
      }
    },
    [compact]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onClick={onClick}
      />
      {!compact && (
        <>
          <div className="absolute top-2 left-2 z-10 text-[9px] font-mono text-amber-400/70 space-y-0.5">
            <div>gen: {gen}</div>
            <div>pop: {alive}</div>
            <div>rule: {RULES[ruleName].label}</div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <button
                onClick={() => setPaused((p) => !p)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  !paused
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {paused ? "Play" : "Pause"}
              </button>
              <button
                onClick={doStep}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Step
              </button>
              <label className="flex items-center gap-1">
                speed:
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-10">{speed}/s</span>
              </label>
              <button
                onClick={cycleRule}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                {RULES[ruleName].label}
              </button>
              <button
                onClick={cyclePattern}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  patName === "custom"
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {patName}
              </button>
              <button
                onClick={doClear}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Clear
              </button>
              <button
                onClick={doReset}
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
