import { useRef, useEffect, useState, useCallback } from "react";

const TOTAL_FRAMES = 240;
const PALETTES = [
  ["#f59e0b", "#d97706", "#fbbf24", "#92400e"],
  ["#8b5cf6", "#6d28d9", "#a78bfa", "#4c1d95"],
  ["#06b6d4", "#0891b2", "#22d3ee", "#155e75"],
  ["#ec4899", "#db2777", "#f472b6", "#9d174d"],
  ["#10b981", "#059669", "#34d399", "#065f46"],
];

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: number,
  time: number,
) {
  const palette = PALETTES[Math.floor(frame / (TOTAL_FRAMES / PALETTES.length)) % PALETTES.length];
  const progress = frame / TOTAL_FRAMES;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.45;

  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2 + progress * Math.PI * 4 + time * 0.3;
    const radius =
      maxR * (0.2 + 0.8 * Math.sin(i * 0.5 + progress * Math.PI * 3 + time));
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const size = 1 + 4 * Math.sin(i * 0.3 + progress * Math.PI * 2 + time * 0.5);
    const colorIdx = Math.floor(
      (Math.sin(i * 0.7 + progress * Math.PI + time * 0.2) + 1) * 1.5,
    ) % palette.length;

    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
    ctx.fillStyle = palette[colorIdx];
    ctx.globalAlpha = 0.3 + 0.7 * Math.sin(i * 0.4 + frame * 0.05 + time);
    ctx.fill();
  }

  for (let r = 0; r < 8; r++) {
    const ringProgress = (r / 8 + progress) % 1;
    const ringRadius = maxR * (0.1 + 0.9 * ringProgress);
    const alpha = 0.05 + 0.2 * Math.sin(ringProgress * Math.PI);
    const hue = (frame * 1.5 + r * 45) % 360;

    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.6);
  glow.addColorStop(0, `hsla(${frame * 2 % 360}, 80%, 60%, 0.04)`);
  glow.addColorStop(1, `hsla(${frame * 2 % 360}, 80%, 60%, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

export default function ImageSequenceScroll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelHandlerRef = useRef<(e: WheelEvent) => void>();

  wheelHandlerRef.current = (e: WheelEvent) => {
    e.preventDefault();
    wheelAccumRef.current += e.deltaY;
    const threshold = 60;
    const steps = Math.floor(wheelAccumRef.current / threshold);
    if (steps !== 0) {
      wheelAccumRef.current -= steps * threshold;
      setFrame((prev) => {
        const next = Math.max(0, Math.min(TOTAL_FRAMES - 1, prev + steps));
        setProgress(next / (TOTAL_FRAMES - 1));
        return next;
      });
    }
  };

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
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const handler = (e: WheelEvent) => wheelHandlerRef.current?.(e);
    container.addEventListener("wheel", handler, { passive: false });

    const loop = () => {
      timeRef.current += 0.016;
      const ctx = canvas.getContext("2d")!;
      const rect = container.getBoundingClientRect();
      drawFrame(ctx, rect.width, rect.height, frame, timeRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("wheel", handler);
      cancelAnimationFrame(rafRef.current);
    };
  }, [frame]);

  const goToFrame = useCallback((f: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, f));
    setFrame(clamped);
    setProgress(clamped / (TOTAL_FRAMES - 1));
  }, []);

  const advance = useCallback(
    (dir: number) => goToFrame(frame + dir),
    [frame, goToFrame],
  );

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      goToFrame(Math.round(p * (TOTAL_FRAMES - 1)));
    },
    [goToFrame],
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] select-none">
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      <div className="flex items-center gap-4 px-6 py-3 bg-black/60 border-t border-white/5">
        <button
          onClick={() => advance(-5)}
          className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-95"
        >
          ◀ Prev
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-amber-400 font-mono min-w-[7ch] tabular-nums">
            FRM {String(frame + 1).padStart(3, "0")}
          </span>
          <div
            className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden cursor-pointer relative group py-2 -my-2"
            onClick={handleScrub}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full transition-all duration-75"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `calc(${progress * 100}% - 8px)` }}
            />
          </div>
          <span className="text-xs text-text-secondary font-mono tabular-nums">
            /{TOTAL_FRAMES}
          </span>
        </div>

        <button
          onClick={() => advance(5)}
          className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-95"
        >
          Next ▶
        </button>

        <span className="text-[10px] text-text-secondary/40 ml-2 hidden sm:inline">
          Scroll to sequence
        </span>
      </div>
    </div>
  );
}
