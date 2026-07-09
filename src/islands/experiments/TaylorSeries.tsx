import { useRef, useEffect, useState, useCallback } from "react";

type TaylorFunc = "exp" | "sin" | "cos" | "ln";

const FUNC_CONFIG: Record<TaylorFunc, { name: string; domain: [number, number] }> = {
  exp: { name: "eˣ", domain: [-3, 3] },
  sin: { name: "sin(x)", domain: [-2 * Math.PI, 2 * Math.PI] },
  cos: { name: "cos(x)", domain: [-2 * Math.PI, 2 * Math.PI] },
  ln: { name: "ln(1+x)", domain: [-0.95, 2] },
};

const TERM_COLORS = [
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#10b981",
  "#f97316",
  "#3b82f6",
  "#14b8a6",
  "#e11d48",
  "#a855f7",
  "#0ea5e9",
  "#84cc16",
  "#d946ef",
  "#22c55e",
  "#eab308",
  "#6366f1",
  "#2dd4bf",
  "#f43f5e",
  "#38bdf8",
  "#a3e635",
];

function actualFn(func: TaylorFunc, x: number): number {
  switch (func) {
    case "exp":
      return Math.exp(x);
    case "sin":
      return Math.sin(x);
    case "cos":
      return Math.cos(x);
    case "ln":
      return Math.log(1 + x);
  }
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function superscript(n: number): string {
  const chars = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  if (n < 10) return chars[n];
  return String(n)
    .split("")
    .map((d) => chars[parseInt(d)])
    .join("");
}

function formatTaylorFormula(func: TaylorFunc, N: number): string {
  const fname = FUNC_CONFIG[func].name;
  if (N <= 0) return `${fname} ≈ 0`;

  const parts: string[] = [];

  switch (func) {
    case "exp":
      for (let n = 0; n < N; n++) {
        if (n === 0) {
          parts.push("1");
        } else {
          const xp = n === 1 ? "x" : `x${superscript(n)}`;
          const d = factorial(n);
          parts.push(d === 1 ? xp : `${xp}/${d}`);
        }
      }
      break;
    case "sin":
      for (let n = 0; n < N; n++) {
        const sign = n % 2 === 0 ? "" : "-";
        const exp = 2 * n + 1;
        const xp = exp === 1 ? "x" : `x${superscript(exp)}`;
        const d = factorial(exp);
        parts.push(sign + (d === 1 ? xp : `${xp}/${d}`));
      }
      break;
    case "cos":
      for (let n = 0; n < N; n++) {
        const sign = n % 2 === 0 ? "" : "-";
        const exp = 2 * n;
        const xp = exp === 0 ? "1" : exp === 2 ? "x²" : `x${superscript(exp)}`;
        const d = factorial(exp);
        parts.push(sign + (d === 1 ? xp : `${xp}/${d}`));
      }
      break;
    case "ln":
      for (let n = 1; n <= N; n++) {
        const sign = (n + 1) % 2 === 0 ? "" : "-";
        const xp = n === 1 ? "x" : `x${superscript(n)}`;
        parts.push(`${sign}${xp}/${n}`);
      }
      break;
  }

  let formula = parts.join(" + ").replace(/\+ -/g, "- ");
  return `${fname} ≈ ${formula}`;
}

export default function TaylorSeries({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [func, setFunc] = useState<TaylorFunc>("sin");
  const [n, setN] = useState(3);
  const [animating, setAnimating] = useState(false);

  const funcRef = useRef(func);
  const nRef = useRef(n);

  useEffect(() => {
    funcRef.current = func;
  }, [func]);
  useEffect(() => {
    nRef.current = n;
  }, [n]);

  useEffect(() => {
    if (!animating) return;
    const interval = setInterval(() => {
      setN((prev) => {
        if (prev >= 20) {
          setAnimating(false);
          return 20;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [animating]);

  const handleAutoAnimate = useCallback(() => {
    setN(0);
    setAnimating(true);
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

    const SAMPLES = compact ? 150 : 300;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const currentFunc = funcRef.current;
      const currentN = nRef.current;
      const cfg = FUNC_CONFIG[currentFunc];
      const [xMin, xMax] = cfg.domain;

      const errorHeight = compact ? 0 : Math.max(40, h * 0.25);
      const mainHeight = h - errorHeight;

      const mL = 50;
      const mR = 15;
      const mT = 20;
      const mB = compact ? 15 : 10;
      const mBE = 15;
      const mTE = 5;

      const plotW = w - mL - mR;
      const plotH = mainHeight - mT - mB;
      const errorH = errorHeight - mTE - mBE;

      const xs: number[] = [];
      const actuals: number[] = [];
      const cumulatives: number[][] = [];

      for (let i = 0; i < SAMPLES; i++) {
        const x = xMin + ((xMax - xMin) * i) / (SAMPLES - 1);
        xs.push(x);
        actuals.push(actualFn(currentFunc, x));

        const terms: number[] = [];
        switch (currentFunc) {
          case "exp":
            for (let k = 0; k < currentN; k++)
              terms.push(Math.pow(x, k) / factorial(k));
            break;
          case "sin":
            for (let k = 0; k < currentN; k++)
              terms.push(
                (Math.pow(-1, k) * Math.pow(x, 2 * k + 1)) /
                  factorial(2 * k + 1),
              );
            break;
          case "cos":
            for (let k = 0; k < currentN; k++)
              terms.push(
                (Math.pow(-1, k) * Math.pow(x, 2 * k)) / factorial(2 * k),
              );
            break;
          case "ln":
            for (let k = 1; k <= currentN; k++)
              terms.push((Math.pow(-1, k + 1) * Math.pow(x, k)) / k);
            break;
        }

        const cum: number[] = [];
        let sum = 0;
        for (const term of terms) {
          sum += term;
          cum.push(sum);
        }
        cumulatives.push(cum);
      }

      let yMin = Infinity;
      let yMax = -Infinity;
      for (let i = 0; i < SAMPLES; i++) {
        const a = actuals[i];
        if (isFinite(a)) {
          yMin = Math.min(yMin, a);
          yMax = Math.max(yMax, a);
        }
        const cum = cumulatives[i];
        for (const c of cum) {
          if (isFinite(c)) {
            yMin = Math.min(yMin, c);
            yMax = Math.max(yMax, c);
          }
        }
      }
      if (!isFinite(yMin)) yMin = -1;
      if (!isFinite(yMax)) yMax = 1;
      if (yMax - yMin < 1e-10) {
        yMin -= 0.5;
        yMax += 0.5;
      }
      const yPad = (yMax - yMin) * 0.1;
      yMin -= yPad;
      yMax += yPad;

      const xToPixel = (x: number) =>
        mL + ((x - xMin) / (xMax - xMin)) * plotW;
      const yToPixel = (y: number) =>
        mT + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      const isTrig = currentFunc === "sin" || currentFunc === "cos";
      if (isTrig) {
        for (let i = -4; i <= 4; i++) {
          const xp = xToPixel(i * Math.PI);
          if (xp >= mL && xp <= w - mR) {
            ctx.beginPath();
            ctx.moveTo(xp, mT);
            ctx.lineTo(xp, mT + plotH);
            ctx.stroke();
          }
        }
      } else {
        for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
          const xp = xToPixel(i);
          if (xp >= mL && xp <= w - mR) {
            ctx.beginPath();
            ctx.moveTo(xp, mT);
            ctx.lineTo(xp, mT + plotH);
            ctx.stroke();
          }
        }
      }
      for (let i = Math.ceil(yMin); i <= Math.floor(yMax); i++) {
        const yp = yToPixel(i);
        if (yp >= mT && yp <= mT + plotH) {
          ctx.beginPath();
          ctx.moveTo(mL, yp);
          ctx.lineTo(w - mR, yp);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      const y0 = yToPixel(0);
      if (y0 >= mT && y0 <= mT + plotH) {
        ctx.beginPath();
        ctx.moveTo(mL, y0);
        ctx.lineTo(w - mR, y0);
        ctx.stroke();
      }
      const x0 = xToPixel(0);
      if (x0 >= mL && x0 <= w - mR) {
        ctx.beginPath();
        ctx.moveTo(x0, mT);
        ctx.lineTo(x0, mT + plotH);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = compact ? "8px monospace" : "10px monospace";
      if (isTrig) {
        for (let i = -4; i <= 4; i++) {
          if (i === 0) continue;
          const xp = xToPixel(i * Math.PI);
          if (xp >= mL && xp <= w - mR && y0 >= mT && y0 <= mT + plotH) {
            ctx.textAlign = "center";
            ctx.fillText(
              i === 1 ? "π" : i === -1 ? "-π" : `${i}π`,
              xp,
              y0 + (compact ? 10 : 14),
            );
          }
        }
      } else {
        for (let i = Math.ceil(xMin); i <= Math.floor(xMax); i++) {
          if (i === 0) continue;
          const xp = xToPixel(i);
          if (xp >= mL && xp <= w - mR && y0 >= mT && y0 <= mT + plotH) {
            ctx.textAlign = "center";
            ctx.fillText(String(i), xp, y0 + (compact ? 10 : 14));
          }
        }
      }
      ctx.textAlign = "right";
      for (let i = Math.ceil(yMin); i <= Math.floor(yMax); i++) {
        const yp = yToPixel(i);
        if (yp >= mT && yp <= mT + plotH) {
          ctx.fillText(String(i), mL - 5, yp + 3);
        }
      }

      for (let k = 0; k < currentN; k++) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < SAMPLES; i++) {
          const v = cumulatives[i][k];
          if (!isFinite(v)) continue;
          const px = xToPixel(xs[i]);
          const py = yToPixel(v);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        if (started) {
          ctx.strokeStyle = TERM_COLORS[k % TERM_COLORS.length];
          ctx.lineWidth = compact ? 0.7 : 1;
          ctx.globalAlpha = 0.25 + 0.55 * (k / Math.max(1, currentN - 1));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      if (currentN > 0) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < SAMPLES; i++) {
          const cum = cumulatives[i];
          const v = cum[cum.length - 1];
          if (!isFinite(v)) continue;
          const px = xToPixel(xs[i]);
          const py = yToPixel(v);
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
        if (started) {
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = compact ? 1.5 : 2.5;
          ctx.stroke();
        }
      }

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < SAMPLES; i++) {
        const v = actuals[i];
        if (!isFinite(v)) continue;
        const px = xToPixel(xs[i]);
        const py = yToPixel(v);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      if (started) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = compact ? 1 : 1.5;
        ctx.setLineDash([5, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (!compact && w > 200) {
        const lx = w - mR - 130;
        const ly = mT + 8;
        ctx.font = "9px monospace";
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(lx, ly + 1);
        ctx.lineTo(lx + 20, ly + 1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.textAlign = "left";
        ctx.fillText("Actual", lx + 24, ly + 4);

        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, ly + 16);
        ctx.lineTo(lx + 20, ly + 16);
        ctx.stroke();
        ctx.fillStyle = "#22c55e";
        ctx.fillText("Approx", lx + 24, ly + 19);

        if (currentN > 0) {
          const tc = TERM_COLORS[Math.min(currentN - 1, TERM_COLORS.length - 1)];
          ctx.strokeStyle = tc;
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.moveTo(lx, ly + 32);
          ctx.lineTo(lx + 20, ly + 32);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.fillStyle = tc;
          ctx.fillText("Terms", lx + 24, ly + 35);
        }
      }

      if (!compact && errorHeight > 30) {
        const errors: number[] = [];
        let maxError = 0;
        for (let i = 0; i < SAMPLES; i++) {
          const cum = cumulatives[i];
          const approx = cum.length > 0 ? cum[cum.length - 1] : 0;
          const err = Math.abs(actuals[i] - approx);
          errors.push(err);
          if (isFinite(err)) maxError = Math.max(maxError, err);
        }

        if (maxError > 0 && currentN > 0) {
          const baseY = mT + mainHeight + mTE + errorH;
          const eToPixel = (e: number) =>
            mT + mainHeight + mTE + errorH - (e / maxError) * errorH;

          ctx.beginPath();
          let started2 = false;
          for (let i = 0; i < SAMPLES; i++) {
            if (!isFinite(errors[i])) continue;
            const px = xToPixel(xs[i]);
            const py = eToPixel(errors[i]);
            if (!started2) {
              ctx.moveTo(px, py);
              started2 = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
          if (started2) {
            ctx.lineTo(xToPixel(xs[SAMPLES - 1]), baseY);
            ctx.lineTo(xToPixel(xs[0]), baseY);
            ctx.closePath();
            ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
            ctx.fill();
          }

          ctx.beginPath();
          started2 = false;
          for (let i = 0; i < SAMPLES; i++) {
            if (!isFinite(errors[i])) continue;
            const px = xToPixel(xs[i]);
            const py = eToPixel(errors[i]);
            if (!started2) {
              ctx.moveTo(px, py);
              started2 = true;
            } else {
              ctx.lineTo(px, py);
            }
          }
          if (started2) {
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          ctx.strokeStyle = "rgba(255,255,255,0.1)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(mL, baseY);
          ctx.lineTo(w - mR, baseY);
          ctx.stroke();

          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "8px monospace";
          ctx.textAlign = "left";
          ctx.fillText("Residual Error", mL + 5, mT + mainHeight + mTE + 10);

          const maxErrStr =
            maxError < 0.001
              ? maxError.toExponential(2)
              : maxError.toFixed(5);
          ctx.fillStyle = "#ef4444";
          ctx.textAlign = "right";
          ctx.fillText(
            `max: ${maxErrStr}`,
            w - mR,
            mT + mainHeight + mTE + 10,
          );

          ctx.strokeStyle = "rgba(255,255,255,0.03)";
          for (let i = 1; i <= 4; i++) {
            const yp = mT + mainHeight + mTE + errorH * (i / 5);
            ctx.beginPath();
            ctx.moveTo(mL, yp);
            ctx.lineTo(w - mR, yp);
            ctx.stroke();
          }
        } else if (currentN === 0) {
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.font = "10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            "No terms — error is the function itself",
            w / 2,
            mT + mainHeight + mTE + errorH / 2 + 3,
          );
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

  const formulaStr = formatTaylorFormula(func, n);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <>
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5 z-10">
            <div className="flex flex-wrap gap-1">
              {(Object.keys(FUNC_CONFIG) as TaylorFunc[]).map(
                (key) => {
                  const cfg = FUNC_CONFIG[key];
                  return (
                  <button
                    key={key}
                    onClick={() => {
                      setFunc(key);
                      setN(3);
                      setAnimating(false);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                      func === key
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                    }`}
                  >
                    {cfg.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="absolute top-10 left-2 right-2 z-10">
            <div className="inline-block bg-bg-secondary/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/30 text-[11px] font-mono text-amber-300/90 max-w-[95%] overflow-x-auto whitespace-nowrap">
              {formulaStr}
            </div>
          </div>

          <div className="absolute bottom-2 left-2 right-2 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <label className="flex items-center gap-1.5">
                <span className="text-text-secondary/50">N:</span>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={n}
                  onChange={(e) => {
                    setN(parseInt(e.target.value));
                    setAnimating(false);
                  }}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400/80 w-5 text-center">
                  {n}
                </span>
              </label>
              <button
                onClick={handleAutoAnimate}
                disabled={animating}
                className={`px-2.5 py-1 text-[10px] rounded-full border transition-all ${
                  animating
                    ? "bg-green-500/20 border-green-500/40 text-green-400 cursor-not-allowed"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {animating ? "Animating..." : "Auto Animate"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
