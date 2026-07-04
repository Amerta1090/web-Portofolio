import { useRef, useEffect, useState, useCallback, useMemo } from "react";

const TOTAL_FRAMES = 302;
const FRAME_BASE = "/images/sequence/watch-demo/frame-";
const FRAME_PAD = 4;
const FRAME_EXT = ".jpg";

function framePath(n: number): string {
  const padded = String(n + 1).padStart(FRAME_PAD, "0");
  return `${FRAME_BASE}${padded}${FRAME_EXT}`;
}

export default function VideoSequenceScroll({ compact }: { compact?: boolean }) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const wheelAccumRef = useRef(0);
  const preloadedRef = useRef(false);

  const frameIndexes = useMemo(
    () => Array.from({ length: TOTAL_FRAMES }, (_, i) => i),
    [],
  );

  const goToFrame = useCallback((f: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_FRAMES - 1, f));
    setFrame(clamped);
    setProgress(clamped / (TOTAL_FRAMES - 1));
  }, []);

  const advance = useCallback(
    (dir: number) => {
      goToFrame(frame + dir);
    },
    [frame, goToFrame],
  );

  useEffect(() => {
    if (compact) {
      const img = new Image();
      img.onload = () => setLoaded(true);
      img.onerror = () => setLoaded(true);
      img.src = framePath(0);
      return () => { img.src = ""; };
    }

    if (preloadedRef.current) return;
    preloadedRef.current = true;

    let loadedCount = 0;
    const imgs: HTMLImageElement[] = [];

    frameIndexes.forEach((i) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) setLoaded(true);
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) setLoaded(true);
      };
      img.src = framePath(i);
      imgs.push(img);
    });

    imagesRef.current = imgs;

    return () => {
      imgs.forEach((img) => { img.src = ""; });
    };
  }, [frameIndexes, compact]);

  const wheelHandlerRef = useRef<(e: WheelEvent) => void>();

  wheelHandlerRef.current = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      wheelAccumRef.current += e.deltaY;
      const threshold = 80;
      const steps = Math.floor(wheelAccumRef.current / threshold);
      if (steps !== 0) {
        wheelAccumRef.current -= steps * threshold;
        setFrame((prev) => {
          const next = Math.max(0, Math.min(TOTAL_FRAMES - 1, prev + steps));
          setProgress(next / (TOTAL_FRAMES - 1));
          return next;
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (compact) return;
    const handler = (e: WheelEvent) => wheelHandlerRef.current?.(e);
    const container = document.querySelector('[data-seq-container]');
    if (!container) return;
    container.addEventListener("wheel", handler, { passive: false });
    return () => container.removeEventListener("wheel", handler);
  }, [compact]);

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      goToFrame(Math.round(p * (TOTAL_FRAMES - 1)));
    },
    [goToFrame],
  );

  const handleScrubMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.buttons !== 1) return;
      handleScrub(e);
    },
    [handleScrub],
  );

  if (compact) {
    return (
      <div className="w-full h-full bg-black overflow-hidden flex items-center justify-center relative">
        {loaded ? (
          <img
            src={framePath(0)}
            alt="Preview"
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-amber-500/50 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-black select-none">
      <div
        data-seq-container
        className="flex-1 relative flex items-center justify-center bg-black overflow-hidden"
      >
        {!loaded && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-secondary font-mono">
              Loading {TOTAL_FRAMES} frames...
            </span>
          </div>
        )}

        <img
          src={loaded ? framePath(frame) : undefined}
          alt={`Frame ${frame + 1}`}
          className="max-w-full max-h-full object-contain select-none pointer-events-none"
          style={{
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
          draggable={false}
        />

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      <div className="flex items-center gap-4 px-6 py-3 bg-black/80 border-t border-white/5">
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
            onMouseMove={handleScrubMove}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-500 transition-all duration-75"
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
