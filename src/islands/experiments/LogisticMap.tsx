import { useRef, useEffect, useState, useCallback } from "react";

const BIFURCATION_POINTS = 20000;
const SWEEP_STEPS = 2000;
const TRANSIENT = 500;

function logistic(r: number, x: number): number {
  return r * x * (1 - x);
}

function iterate(r: number, x0: number, n: number): number[] {
  let x = x0;
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    x = logistic(r, x);
    result.push(x);
  }
  return result;
}

function computeFeigenbaum(): number {
  const r1 = 3;
  const r2 = 3.44949;
  const r3 = 3.54409;
  const r4 = 3.56441;
  const d1 = r2 - r1;
  const d2 = r3 - r2;
  const d3 = r4 - r3;
  if (Math.abs(d2 - d1) < 1e-10) return 4.669;
  const d = (d1 - d2) / (d2 - d3);
  return isFinite(d) ? d : 4.669;
}

export default function LogisticMap({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [r, setR] = useState(3.5);
  const [x0, setX0] = useState(0.5);
  const [showCobweb, setShowCobweb] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [feigenbaum, setFeigenbaum] = useState(0);

  const rRef = useRef(r);
  const x0Ref = useRef(x0);
  const showCobwebRef = useRef(showCobweb);

  useEffect(() => { rRef.current = r; }, [r]);
  useEffect(() => { x0Ref.current = x0; }, [x0]);
  useEffect(() => { showCobwebRef.current = showCobweb; }, [showCobweb]);

  const handleSweep = useCallback(() => {
    setSweeping(true);
    setFeigenbaum(computeFeigenbaum());
    let currentR = 2;
    const targetR = 4;
    const step = (targetR - currentR) / SWEEP_STEPS;

    function animateSweep() {
      if (!runningRef.current || currentR >= targetR) {
        setSweeping(false);
        return;
      }
      currentR += step;
      setR(currentR);
      rafRef.current = requestAnimationFrame(animateSweep);
    }
    animateSweep();
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
      const margin = compact ? 20 : 40;
      const plotW = w - margin * 2;
      const plotH = h - margin * 2 - (compact ? 0 : 20);

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const rV = rRef.current;
      const x0V = x0Ref.current;

      if (compact) {
        const ptsPerR = Math.max(1, Math.floor(BIFURCATION_POINTS / SWEEP_STEPS));
        ctx.fillStyle = "rgba(245,158,11,0.3)";
        for (let i = 0; i < SWEEP_STEPS; i++) {
          const ri = 2 + (i / SWEEP_STEPS) * 2;
          const transient = iterate(ri, 0.5, 100);
          const vals = iterate(ri, transient[transient.length - 1], ptsPerR);
          for (const v of vals) {
            const px = margin + ((ri - 2) / 2) * plotW;
            const py = margin + plotH - v * plotH;
            ctx.fillRect(px, py, 1, 1);
          }
        }
        return;
      }

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(margin, margin, plotW, plotH);

      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.font = "9px monospace";
      ctx.fillText("r = " + rV.toFixed(4), margin + 4, margin + 12);

      const ptsPerR = Math.max(10, Math.floor(400 / SWEEP_STEPS * (4 - 2)));

      ctx.fillStyle = "rgba(245,158,11,0.4)";
      for (let i = 0; i < SWEEP_STEPS; i++) {
        const ri = 2 + (i / SWEEP_STEPS) * 2;
        const transient = iterate(ri, 0.5, TRANSIENT);
        const vals = iterate(ri, transient[transient.length - 1], ptsPerR);
        for (const v of vals) {
          const px = margin + ((ri - 2) / 2) * plotW;
          const py = margin + plotH - v * plotH;
          ctx.fillRect(px, py, 1, 1);
        }
      }

      const rLine = margin + ((rV - 2) / 2) * plotW;
      ctx.strokeStyle = "rgba(139,92,246,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rLine, margin);
      ctx.lineTo(rLine, margin + plotH);
      ctx.stroke();

      if (showCobwebRef.current) {
        const cobX = margin + plotW + 20;
        const cobSize = Math.min(w - cobX - margin, h * 0.5);
        const cm = 10;

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.strokeRect(cobX, margin, cobSize, cobSize);

        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cobX, margin + cobSize);
        ctx.lineTo(cobX + cobSize, margin + cobSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cobX, margin);
        ctx.lineTo(cobX, margin + cobSize);
        ctx.stroke();

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cobX, margin + cobSize);
        ctx.lineTo(cobX + cobSize, margin);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.font = "8px monospace";
        ctx.fillText("Cobweb", cobX + 4, margin + 10);

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        for (let px = 0; px <= cobSize; px++) {
          const nx = px / cobSize;
          const ny = logistic(rV, nx);
          ctx.lineTo(cobX + px, margin + cobSize - ny * cobSize);
        }
        ctx.stroke();

        let cx = x0V;
        const cobIter = 50;
        ctx.strokeStyle = "rgba(245,158,11,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < cobIter; i++) {
          const cy = logistic(rV, cx);
          const x1 = cobX + cx * cobSize;
          const y1 = margin + cobSize - cy * cobSize;
          if (i === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);

          ctx.lineTo(x1, margin + cobSize - cy * cobSize);
          cx = cy;
        }
        ctx.stroke();

        ctx.fillStyle = "rgba(245,158,11,0.8)";
        ctx.beginPath();
        ctx.arc(cobX + x0V * cobSize, margin + cobSize - logistic(rV, x0V) * cobSize, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.font = "8px monospace";
      ctx.fillText("r=2.0", margin, margin + plotH + 12);
      ctx.fillText("r=4.0", margin + plotW - 20, margin + plotH + 12);
      ctx.fillText("1", margin - 10, margin + 4);
      ctx.fillText("0", margin - 10, margin + plotH + 4);

      const orbit = iterate(rV, x0V, 100);
      if (orbit.length > 50) {
        const recent = orbit.slice(-50);
        const ox = margin + plotW + 20;
        const oy = margin;
        const ow = 60;
        const oh = 40;

        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.strokeRect(ox, oy, ow, oh);

        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.font = "7px monospace";
        ctx.fillText("Orbit", ox + 4, oy + 8);

        ctx.strokeStyle = "rgba(245,158,11,0.4)";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for (let i = 0; i < recent.length; i++) {
          const px = ox + (i / recent.length) * ow;
          const py = oy + oh - recent[i] * oh;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <label className="flex items-center gap-1">
              r:
              <input
                type="range"
                min={2}
                max={4}
                step={0.001}
                value={r}
                onChange={(e) => setR(parseFloat(e.target.value))}
                className="w-24 accent-amber-500"
              />
              <span className="text-amber-400 w-12">{r.toFixed(3)}</span>
            </label>
            <label className="flex items-center gap-1">
              x₀:
              <input
                type="range"
                min={0.01}
                max={0.99}
                step={0.01}
                value={x0}
                onChange={(e) => setX0(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
              <span className="w-8">{x0.toFixed(2)}</span>
            </label>
            <button
              onClick={() => setShowCobweb(s => !s)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                showCobweb ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              Cobweb
            </button>
            <button
              onClick={handleSweep}
              disabled={sweeping}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all disabled:opacity-40"
            >
              {sweeping ? "Sweeping…" : "Auto Sweep"}
            </button>
            {feigenbaum > 0 && (
              <span className="text-amber-400/60">
                δ ≈ {feigenbaum.toFixed(3)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
