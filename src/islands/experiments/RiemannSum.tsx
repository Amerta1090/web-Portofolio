import { useRef, useEffect, useState, useCallback } from "react";

type RiemannMethod = "left" | "right" | "midpoint" | "trapezoidal";

const METHODS: { key: RiemannMethod; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "midpoint", label: "Midpoint" },
  { key: "trapezoidal", label: "Trapezoidal" },
];

const PRESETS: Record<string, { fn: (x: number) => number; label: string }> = {
  x2: { fn: (x:  number) => x * x, label: "f(x) = x²" },
  sin: { fn: (x: number) => Math.sin(x), label: "f(x) = sin(x)" },
  inv: { fn: (x: number) => (x > 0.1 ? 1 / x : 10), label: "f(x) = 1/x" },
};

const VIEW_X_MIN = -1;
const VIEW_X_MAX = 5;
const VIEW_Y_MIN = -2;
const VIEW_Y_MAX = 10;

function riemannArea(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number,
  method: RiemannMethod
): number {
  if (n < 1) return 0;
  const dx = (b - a) / n;
  let sum = 0;
  if (method === "trapezoidal") {
    for (let i = 0; i <= n; i++) {
      const x = a + i * dx;
      const w = i === 0 || i === n ? 1 : 2;
      sum += w * fn(x);
    }
    return (dx / 2) * sum;
  }
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = a + (i + 1) * dx;
    let x: number;
    if (method === "left") x = x0;
    else if (method === "right") x = x1;
    else x = (x0 + x1) / 2;
    sum += fn(x);
  }
  return sum * dx;
}

function toCanvasX(x: number, w: number, pad: number): number {
  return pad + ((x - VIEW_X_MIN) / (VIEW_X_MAX - VIEW_X_MIN)) * (w - 2 * pad);
}

function toCanvasY(y: number, h: number, pad: number): number {
  return h - pad - ((y - VIEW_Y_MIN) / (VIEW_Y_MAX - VIEW_Y_MIN)) * (h - 2 * pad);
}

function toWorldX(cx: number, w: number, pad: number): number {
  return VIEW_X_MIN + ((cx - pad) / (w - 2 * pad)) * (VIEW_X_MAX - VIEW_X_MIN);
}

const PAD = 48;
const AMBER = "245, 158, 11";

export default function RiemannSum({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [method, setMethod] = useState<RiemannMethod>("midpoint");
  const [n, setN] = useState(10);
  const [animating, setAnimating] = useState(false);
  const [preset, setPreset] = useState("x2");
  const [drawing, setDrawing] = useState(false);
  const customPointsRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);
  const nRef = useRef(n);
  const methodRef = useRef(method);
  const presetRef = useRef(preset);
  const drawingRef = useRef(drawing);
  const animatingRef = useRef(animating);

  useEffect(() => { nRef.current = n; }, [n]);
  useEffect(() => { methodRef.current = method; }, [method]);
  useEffect(() => { presetRef.current = preset; }, [preset]);
  useEffect(() => { drawingRef.current = drawing; }, [drawing]);
  useEffect(() => { animatingRef.current = animating; }, [animating]);

  const getFn = useCallback((x: number): number => {
    if (preset === "custom") {
      const pts = customPointsRef.current;
      if (pts.length < 2) return 0;
      const screenX = x;
      let low = 0;
      let high = pts.length - 1;
      while (low < high - 1) {
        const mid = (low + high) >> 1;
        if (pts[mid].x <= screenX) low = mid;
        else high = mid;
      }
      if (high >= pts.length) high = pts.length - 1;
      const a = pts[low];
      const b = pts[high];
      if (Math.abs(b.x - a.x) < 1e-8) return a.y;
      const t = (screenX - a.x) / (b.x - a.x);
      return a.y + t * (b.y - a.y);
    }
    return PRESETS[preset]?.fn(x) ?? 0;
  }, [preset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 480),
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


    function drawAxes(w: number, h: number) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.textAlign = "center";

      const x0 = toCanvasX(0, w, PAD);
      const y0 = toCanvasY(0, h, PAD);

      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PAD, y0);
      ctx.lineTo(w - PAD, y0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0, PAD);
      ctx.lineTo(x0, h - PAD);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      for (let x = Math.ceil(VIEW_X_MIN); x <= Math.floor(VIEW_X_MAX); x++) {
        if (x === 0) continue;
        const cx = toCanvasX(x, w, PAD);
        ctx.beginPath();
        ctx.moveTo(cx, PAD);
        ctx.lineTo(cx, h - PAD);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText(String(x), cx, y0 + 14);
      }
      for (let y = Math.ceil(VIEW_Y_MIN); y <= Math.floor(VIEW_Y_MAX); y++) {
        if (y === 0) continue;
        const cy = toCanvasY(y, h, PAD);
        ctx.beginPath();
        ctx.moveTo(PAD, cy);
        ctx.lineTo(w - PAD, cy);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.textAlign = "right";
        ctx.fillText(String(y), x0 - 6, cy + 3);
        ctx.textAlign = "center";
      }
    }

    function drawFunction(w: number, h: number, fn: (x: number) => number) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const steps = Math.max(200, w);
      let first = true;
      for (let i = 0; i <= steps; i++) {
        const sx = (i / steps) * (w - 2 * PAD) + PAD;
        const x = toWorldX(sx, w, PAD);
        const y = fn(x);
        if (!isFinite(y)) { first = true; continue; }
        const sy = toCanvasY(y, h, PAD);
        if (first) { ctx.moveTo(sx, sy); first = false; }
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    function drawRiemann(w: number, h: number, fn: (x: number) => number, a: number, b: number, n: number, m: RiemannMethod) {
      if (n < 1 || n > 500) return;
      const dx = (b - a) / n;
      const alpha = Math.min(0.3, 0.05 + 0.25 * (1 - n / 100));

      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const x1 = a + (i + 1) * dx;
        let hx: number;
        if (m === "left") hx = x0;
        else if (m === "right") hx = x1;
        else if (m === "midpoint") hx = (x0 + x1) / 2;
        else {
          const ly = fn(x0);
          const ry = fn(x1);
          if (!isFinite(ly) || !isFinite(ry)) continue;
          const sx0 = toCanvasX(x0, w, PAD);
          const sx1 = toCanvasX(x1, w, PAD);
          const sy0 = toCanvasY(0, h, PAD);
          const syL = toCanvasY(ly, h, PAD);
          const syR = toCanvasY(ry, h, PAD);
          ctx.fillStyle = `rgba(${AMBER},${alpha})`;
          ctx.strokeStyle = `rgba(${AMBER},0.6)`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(sx0, sy0);
          ctx.lineTo(sx0, syL);
          ctx.lineTo(sx1, syR);
          ctx.lineTo(sx1, sy0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          continue;
        }
        const hy = fn(hx);
        if (!isFinite(hy)) continue;
        const sx0 = toCanvasX(x0, w, PAD);
        const sx1 = toCanvasX(x1, w, PAD);
        const sy0 = toCanvasY(0, h, PAD);
        const sy1 = toCanvasY(hy, h, PAD);
        ctx.fillStyle = `rgba(${AMBER},${alpha})`;
        ctx.strokeStyle = `rgba(${AMBER},0.6)`;
        ctx.lineWidth = 0.5;
        ctx.fillRect(sx0, Math.min(sy0, sy1), Math.max(1, sx1 - sx0), Math.abs(sy1 - sy0));
        ctx.strokeRect(sx0, Math.min(sy0, sy1), Math.max(1, sx1 - sx0), Math.abs(sy1 - sy0));
      }
    }

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const A = 0;
      const B = 4;
      const currentN = nRef.current;
      const currentMethod = methodRef.current;
      const fn = (x: number) => {
        if (presetRef.current === "custom") {
          return getFn(x);
        }
        return PRESETS[presetRef.current]?.fn(x) ?? 0;
      };

      drawAxes(w, h);

      if (drawingRef.current && presetRef.current !== "custom") {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "13px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Enable Draw mode below to create custom f(x)", w / 2, h / 2);
      }

      drawRiemann(w, h, fn, A, B, currentN, currentMethod);
      drawFunction(w, h, fn);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, getFn]);

  const handleAnimate = useCallback(() => {
    if (animatingRef.current) return;
    setAnimating(true);
    animatingRef.current = true;
    let current = 2;
    const step = () => {
      current += 1 + Math.floor(current / 20);
      if (current >= 100) {
        setN(100);
        nRef.current = 100;
        setAnimating(false);
        animatingRef.current = false;
        return;
      }
      setN(current);
      nRef.current = current;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (preset !== "custom") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const x = toWorldX(sx, w, PAD);
    const y = VIEW_Y_MIN + ((h - PAD - sy) / (h - 2 * PAD)) * (VIEW_Y_MAX - VIEW_Y_MIN);
    isDrawingRef.current = true;
    customPointsRef.current = [{ x, y }];
    setDrawing(true);
    drawingRef.current = true;
  }, [preset]);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || preset !== "custom") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const x = toWorldX(sx, w, PAD);
    const y = VIEW_Y_MIN + ((h - PAD - sy) / (h - 2 * PAD)) * (VIEW_Y_MAX - VIEW_Y_MIN);
    const pts = customPointsRef.current;
    if (pts.length > 0 && Math.abs(x - pts[pts.length - 1].x) < 0.02) return;
    pts.push({ x: Math.max(VIEW_X_MIN, Math.min(VIEW_X_MAX, x)), y });
    if (pts.length > 500) pts.splice(0, 1);
  }, [preset]);

  const handleCanvasPointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const area = riemannArea(
    (x) => {
      if (preset === "custom") return getFn(x);
      return PRESETS[preset]?.fn(x) ?? 0;
    },
    0, 4, n, method
  );
  const actualArea = riemannArea(
    (x) => {
      if (preset === "custom") return getFn(x);
      return PRESETS[preset]?.fn(x) ?? 0;
    },
    0, 4, 1000, "midpoint"
  );

  const sigmaNotation = `Σ f(xᵢ) · Δx`;
  const integralNotation = `∫₀⁴ f(x) dx`;
  const showIntegralNotation = n >= 50;

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
        style={{ cursor: preset === "custom" ? "crosshair" : "default" }}
      />
      {!compact && (
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            {METHODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                  method === m.key
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => { setPreset(key); setDrawing(false); drawingRef.current = false; customPointsRef.current = []; }}
                className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                  preset === key
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setPreset("custom")}
              className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                preset === "custom"
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Custom
            </button>
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            {showIntegralNotation ? (
              <span className="text-amber-400/80">{integralNotation}</span>
            ) : (
              <span className="text-amber-400/60">{sigmaNotation}</span>
            )}
            <span className="text-[10px] text-text-secondary/50">→</span>
            {!showIntegralNotation ? (
              <span className="text-text-secondary/40 text-[10px]">{integralNotation}</span>
            ) : (
              <span className="text-text-secondary/40 text-[10px] line-through">{sigmaNotation}</span>
            )}
            <span className="text-text-secondary/50">|</span>
            <span>
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </span>
            <span>
              N=<span className="text-amber-400/70">{n}</span>
            </span>
            <span>
              Area≈<span className="text-amber-400/70">{area.toFixed(4)}</span>
            </span>
            <span className="text-[10px] text-text-secondary/40">
              (ref {actualArea.toFixed(4)})
            </span>
            <label className="flex items-center gap-1 ml-auto">
              N:
              <input
                type="range"
                min={2}
                max={100}
                value={n}
                onChange={(e) => { const v = parseInt(e.target.value); setN(v); nRef.current = v; }}
                className="w-20 accent-amber-500"
                disabled={animating}
              />
            </label>
            <button
              onClick={handleAnimate}
              disabled={animating}
              className={`px-2.5 py-0.5 text-[10px] rounded-full border transition-all ${
                animating
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500/50 cursor-not-allowed"
                  : "bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25"
              }`}
            >
              {animating ? "Animating…" : "Animate"}
            </button>
            {preset === "custom" && (
              <button
                onClick={() => {
                  const d = !drawing;
                  setDrawing(d);
                  drawingRef.current = d;
                  if (!d) customPointsRef.current = [];
                }}
                className={`px-2.5 py-0.5 text-[10px] rounded-full border transition-all ${
                  drawing
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {drawing ? "Drawing…" : "Draw"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
