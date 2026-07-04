import { useRef, useEffect, useState, useCallback } from "react";
import { Bookmark, Download, RotateCcw, RotateCw } from "lucide-react";

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
  compact?: boolean,
) {
  const palette = PALETTES[Math.floor(frame / (TOTAL_FRAMES / PALETTES.length)) % PALETTES.length];
  const progress = frame / TOTAL_FRAMES;
  const count = compact ? 24 : 80;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.45;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + progress * Math.PI * 4 + time * 0.3;
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

  if (!compact) {
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
}

export default function ImageSequenceScroll({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reversed, setReversed] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const frameRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelHandlerRef = useRef<(e: WheelEvent) => void>();
  const autoRef = useRef<ReturnType<typeof setInterval>>();
  const runningRef = useRef(true);
  const tweenRef = useRef<{ from: number; to: number; start: number } | null>(null);
  const momentumRef = useRef(0);
  const momentumDecayRef = useRef<ReturnType<typeof requestAnimationFrame>>();

  const goToFrame = useCallback((f: number, instant?: boolean) => {
    const prev = frameRef.current;
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(f)));
    if (!instant && Math.abs(clamped - prev) > 1 && !compact) {
      tweenRef.current = { from: prev, to: clamped, start: performance.now() };
    }
    setFrame(clamped);
    frameRef.current = clamped;
    setProgress(clamped / (TOTAL_FRAMES - 1));
  }, [compact]);

  const advance = useCallback(
    (dir: number) => goToFrame(frameRef.current + dir),
    [goToFrame],
  );

  wheelHandlerRef.current = (e: WheelEvent) => {
    e.preventDefault();
    const delta = reversed ? -e.deltaY : e.deltaY;
    wheelAccumRef.current += delta;
    const threshold = 60;
    const steps = Math.floor(wheelAccumRef.current / threshold);
    if (steps !== 0) {
      wheelAccumRef.current -= steps * threshold;
      goToFrame(frameRef.current + steps);
      momentumRef.current = steps * 0.3;
    }
  };

  const exportFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `frame-${String(frame + 1).padStart(3, "0")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [frame]);

  const toggleBookmark = useCallback(() => {
    setBookmarks((prev) => {
      if (prev.includes(frame)) return prev.filter((b) => b !== frame);
      return [...prev, frame].sort((a, b) => a - b);
    });
  }, [frame]);

  const jumpToBookmark = useCallback((f: number) => {
    goToFrame(f);
  }, [goToFrame]);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    setShowBookmarks(false);
  }, []);

  // Keyboard handlers for bookmarking + export
  useEffect(() => {
    if (compact) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        toggleBookmark();
      }
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        exportFrame();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [compact, toggleBookmark, exportFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width || 400;
      const h = rect.height || 400;
      const dpr = compact ? 1 : (window.devicePixelRatio || 1);
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    if (!compact) {
      const handler = (e: WheelEvent) => wheelHandlerRef.current?.(e);
      container.addEventListener("wheel", handler, { passive: false });
      (container as any).__issWheelCleanup = () => {
        container.removeEventListener("wheel", handler);
      };
    } else {
      frameRef.current = 0;
      autoRef.current = setInterval(() => {
        if (!runningRef.current) return;
        setFrame((prev) => {
          const next = (prev + 1) % TOTAL_FRAMES;
          frameRef.current = next;
          setProgress(next / (TOTAL_FRAMES - 1));
          return next;
        });
      }, 100);
    }

    let skipCounter = 0;
    const loop = () => {
      if (!runningRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      timeRef.current += 0.016;
      skipCounter++;
      if (!compact || skipCounter % 3 === 0) {
        const ctx = canvas.getContext("2d")!;
        const rect = container.getBoundingClientRect();
        drawFrame(ctx, Math.max(1, rect.width), Math.max(1, rect.height), frameRef.current, timeRef.current, compact);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      if (autoRef.current) clearInterval(autoRef.current);
      const wheelCleanup = (container as any).__issWheelCleanup;
      if (wheelCleanup) wheelCleanup();
    };
  }, [compact]);

  // Scroll momentum decay
  useEffect(() => {
    if (compact) return;
    const decay = () => {
      if (Math.abs(momentumRef.current) > 0.01) {
        goToFrame(frameRef.current + Math.round(momentumRef.current));
        momentumRef.current *= 0.92;
        momentumDecayRef.current = requestAnimationFrame(decay);
      }
    };
    momentumDecayRef.current = requestAnimationFrame(decay);
    return () => {
      if (momentumDecayRef.current) cancelAnimationFrame(momentumDecayRef.current);
    };
  }, [compact, goToFrame]);

  // Frame interpolation tween
  useEffect(() => {
    if (compact) return;
    const tweenLoop = () => {
      if (tweenRef.current) {
        const elapsed = performance.now() - tweenRef.current.start;
        const duration = 120;
        const t = Math.min(1, elapsed / duration);
        const eased = t * (2 - t);
        const current = tweenRef.current.from + (tweenRef.current.to - tweenRef.current.from) * eased;
        const rounded = Math.round(current);
        if (rounded !== frameRef.current) {
          frameRef.current = Math.max(0, Math.min(TOTAL_FRAMES - 1, rounded));
          setFrame(frameRef.current);
          setProgress(frameRef.current / (TOTAL_FRAMES - 1));
        }
        if (t >= 1) tweenRef.current = null;
      }
    };
    const id = setInterval(tweenLoop, 16);
    return () => clearInterval(id);
  }, [compact]);

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      goToFrame(Math.round(p * (TOTAL_FRAMES - 1)));
    },
    [goToFrame],
  );

  if (compact) {
    return (
      <div ref={containerRef} className="w-full h-full bg-[#0a0a0c] overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0c] select-none">
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        {bookmarks.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[60%]">
            {bookmarks.slice(0, 8).map((f) => (
              <button
                key={f}
                onClick={() => jumpToBookmark(f)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-all ${
                  f === frame ? "ring-1 ring-amber-400" : ""
                }`}
              >
                F{String(f + 1).padStart(2, "0")}
              </button>
            ))}
            {bookmarks.length > 8 && (
              <span className="text-[10px] text-amber-500/50 font-mono self-center">
                +{bookmarks.length - 8}
              </span>
            )}
          </div>
        )}

        {showBookmarks && bookmarks.length > 0 && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-mono text-amber-400">
                Bookmarks ({bookmarks.length})
              </h3>
              <button
                onClick={() => setShowBookmarks(false)}
                className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-white/5 hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 content-start">
              {bookmarks.map((f) => (
                <button
                  key={f}
                  onClick={() => { jumpToBookmark(f); setShowBookmarks(false); }}
                  className="aspect-square bg-white/5 rounded border border-white/10 hover:border-amber-500/50 flex items-center justify-center text-[10px] font-mono text-text-secondary hover:text-amber-400 transition-all"
                >
                  {f + 1}
                </button>
              ))}
            </div>
            <button
              onClick={clearBookmarks}
              className="mt-3 text-xs text-red-400/60 hover:text-red-400 self-end px-3 py-1 rounded bg-white/5 hover:bg-white/10"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-black/60 border-t border-white/5">
        <button
          onClick={() => advance(-5)}
          className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-95"
        >
          ◀◀
        </button>

        <button
          onClick={() => setReversed((r) => !r)}
          className={`p-1.5 rounded-lg transition-all active:scale-95 ${
            reversed
              ? "bg-amber-500/20 text-amber-400"
              : "bg-white/5 text-text-secondary hover:text-text-primary"
          }`}
          title={reversed ? "Playing in reverse" : "Playing forward"}
        >
          {reversed ? <RotateCcw className="w-3.5 h-3.5" /> : <RotateCw className="w-3.5 h-3.5" />}
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

            {bookmarks.map((f) => (
              <div
                key={f}
                className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-amber-400/60 rounded-full pointer-events-none"
                style={{ left: `${(f / (TOTAL_FRAMES - 1)) * 100}%` }}
              />
            ))}
          </div>
          <span className="text-xs text-text-secondary font-mono tabular-nums">
            /{TOTAL_FRAMES}
          </span>
        </div>

        <button
          onClick={() => advance(5)}
          className="px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all active:scale-95"
        >
          ▶▶
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleBookmark}
            className={`p-1.5 rounded-lg transition-all active:scale-95 ${
              bookmarks.includes(frame)
                ? "bg-amber-500/20 text-amber-400"
                : "bg-white/5 text-text-secondary hover:text-text-primary"
            }`}
            title={`Bookmark frame (B key) [${bookmarks.length}]`}
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={exportFrame}
            className="p-1.5 rounded-lg bg-white/5 text-text-secondary hover:text-text-primary transition-all active:scale-95"
            title="Export as PNG (E key)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {bookmarks.length > 0 && (
          <button
            onClick={() => setShowBookmarks((s) => !s)}
            className="px-2 py-1 text-[10px] font-mono rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
          >
            {bookmarks.length} B
          </button>
        )}

        <span className="text-[10px] text-text-secondary/40 ml-1 hidden sm:inline">
          Scroll to sequence
        </span>
      </div>
    </div>
  );
}
