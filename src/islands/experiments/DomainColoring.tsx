import { useRef, useEffect, useState, useCallback } from "react";

type ComplexFn = "z^2" | "z^3" | "1/z" | "e^z" | "sin(z)" | "cos(z)" | "tanh(z)";

const FUNCTIONS: ComplexFn[] = ["z^2", "z^3", "1/z", "e^z", "sin(z)", "cos(z)", "tanh(z)"];

function complexFn(name: ComplexFn): (re: number, im: number) => [number, number] {
  switch (name) {
    case "z^2": {
      const fn = (re: number, im: number): [number, number] => [re * re - im * im, 2 * re * im];
      return fn;
    }
    case "z^3": {
      const fn = (re: number, im: number): [number, number] => {
        const r2 = re * re - im * im;
        const i2 = 2 * re * im;
        return [r2 * re - i2 * im, r2 * im + i2 * re];
      };
      return fn;
    }
    case "1/z": {
      const fn = (re: number, im: number): [number, number] => {
        const d = re * re + im * im;
        if (d < 1e-30) return [Infinity, Infinity];
        return [re / d, -im / d];
      };
      return fn;
    }
    case "e^z": {
      const fn = (re: number, im: number): [number, number] => {
        const er = Math.exp(re);
        return [er * Math.cos(im), er * Math.sin(im)];
      };
      return fn;
    }
    case "sin(z)": {
      const fn = (re: number, im: number): [number, number] => [
        Math.sin(re) * Math.cosh(im),
        Math.cos(re) * Math.sinh(im),
      ];
      return fn;
    }
    case "cos(z)": {
      const fn = (re: number, im: number): [number, number] => [
        Math.cos(re) * Math.cosh(im),
        -Math.sin(re) * Math.sinh(im),
      ];
      return fn;
    }
    case "tanh(z)": {
      const fn = (re: number, im: number): [number, number] => {
        const c = Math.cos(2 * im);
        const s = Math.cosh(2 * re);
        if (s + c < 1e-30) return [0, 0];
        return [Math.sinh(2 * re) / (s + c), Math.sin(2 * im) / (s + c)];
      };
      return fn;
    }
  }
}

function hsl2rgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  const hh = h / 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hh * 12) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

function brightness(wre: number, wim: number): number {
  const mag = Math.sqrt(wre * wre + wim * wim);
  if (!isFinite(mag)) return 0;
  return 2 / (1 + Math.pow(mag, 0.3));
}

type ViewState = {
  cx: number;
  cy: number;
  zoom: number;
};

const ZOOM_SPEED = 0.12;

export default function DomainColoring({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [fnIndex, setFnIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);

  const fnIndexRef = useRef(fnIndex);
  const showGridRef = useRef(showGrid);
  const autoRotateRef = useRef(autoRotate);

  const viewRef = useRef<ViewState>({ cx: 0, cy: 0, zoom: 3 });
  const dragRef = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
  const timeRef = useRef(0);

  useEffect(() => { fnIndexRef.current = fnIndex; }, [fnIndex]);
  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  const resetView = useCallback(() => {
    viewRef.current = { cx: 0, cy: 0, zoom: 3 };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const dpr = compact ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
    const cw = Math.round(container.clientWidth || 400) * dpr;
    const ch = Math.round((container.clientHeight || (compact ? 192 : 600)) * dpr);

    if (w !== cw || h !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    const vw = canvas.width;
    const vh = canvas.height;
    const imageData = ctx.createImageData(vw, vh);
    const data = imageData.data;
    const view = viewRef.current;
    const fn = complexFn(FUNCTIONS[fnIndexRef.current]);
    const showGridLines = showGridRef.current;
    const t = timeRef.current;
    const autoRot = autoRotateRef.current;

    const step = compact ? 2 : 1;
    const scaleX = view.zoom / Math.max(vw, 1);
    const scaleY = view.zoom / Math.max(vh, 1);
    const halfW = vw / 2;
    const halfH = vh / 2;

    for (let py = 0; py < vh; py += step) {
      for (let px = 0; px < vw; px += step) {
        const re = (px - halfW) * scaleX + view.cx;
        const im = (py - halfH) * scaleY + view.cy;

        let wre: number, wim: number;
        if (autoRot) {
          const angle = t * 0.08;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);
          const rre = re * cosA - im * sinA;
          const rim = re * sinA + im * cosA;
          [wre, wim] = fn(rre, rim);
        } else {
          [wre, wim] = fn(re, im);
        }

        const hue = (Math.atan2(wim, wre) / Math.PI) * 180;
        const sat = 1;
        const light = brightness(wre, wim);

        const [r, g, b] = hsl2rgb(hue, sat, light);

        for (let dy = 0; dy < step && py + dy < vh; dy++) {
          for (let dx = 0; dx < step && px + dx < vw; dx++) {
            const idx = ((py + dy) * vw + (px + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }

    if (showGridLines) {
      const gc = "rgba(255,255,255,0.07)";
      const gStep = compact ? 0.5 : view.zoom * 0.25;
      if (gStep > 0.01) {
        const snapped = Math.pow(2, Math.round(Math.log2(gStep)));
        const startX = Math.floor((view.cx - halfW * scaleX) / snapped) * snapped;
        const endX = Math.ceil((view.cx + halfW * scaleX) / snapped) * snapped;
        const startY = Math.floor((view.cy - halfH * scaleY) / snapped) * snapped;
        const endY = Math.ceil((view.cy + halfH * scaleY) / snapped) * snapped;

        ctx.putImageData(imageData, 0, 0);

        ctx.strokeStyle = gc;
        ctx.lineWidth = Math.max(0.5, 1 / dpr);

        ctx.beginPath();
        for (let gx = startX; gx <= endX; gx += snapped) {
          const sx = (gx - view.cx) / scaleX + halfW;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, vh);
        }
        for (let gy = startY; gy <= endY; gy += snapped) {
          const sy = (gy - view.cy) / scaleY + halfH;
          ctx.moveTo(0, sy);
          ctx.lineTo(vw, sy);
        }
        ctx.stroke();
        return;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

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
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const animate = () => {
      if (!runningRef.current) return;
      timeRef.current += 1;
      render();
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dpr = compact ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      const cw = canvas.width;
      const ch = canvas.height;
      const halfW = cw / 2;
      const halfH = ch / 2;
      const view = viewRef.current;
      const scaleX = view.zoom / cw;
      const scaleY = view.zoom / ch;
      const worldX = (mx * dpr - halfW) * scaleX + view.cx;
      const worldY = (my * dpr - halfH) * scaleY + view.cy;
      const factor = e.deltaY > 0 ? 1 + ZOOM_SPEED : 1 / (1 + ZOOM_SPEED);
      view.zoom = Math.max(0.001, Math.min(1000, view.zoom * factor));
      const newScaleX = view.zoom / cw;
      const newScaleY = view.zoom / ch;
      view.cx = worldX - (mx * dpr - halfW) * newScaleX;
      view.cy = worldY - (my * dpr - halfH) * newScaleY;
    };
    container.addEventListener("wheel", handleWheel, { passive: false });

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        dragRef.current = {
          active: true,
          sx: e.clientX,
          sy: e.clientY,
          ox: viewRef.current.cx,
          oy: viewRef.current.cy,
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (d.active) {
        const rect = container.getBoundingClientRect();
        const cw = canvas.width;
        const ch = canvas.height;
        const dpr = compact ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
        const dx = (e.clientX - d.sx) * dpr;
        const dy = (e.clientY - d.sy) * dpr;
        const view = viewRef.current;
        view.cx = d.ox - (dx / cw) * view.zoom;
        view.cy = d.oy - (dy / ch) * view.zoom;
      }
    };

    const handleMouseUp = () => {
      dragRef.current.active = false;
    };

    if (!compact) {
      container.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      container.removeEventListener("wheel", handleWheel);
      if (!compact) {
        container.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      }
    };
  }, [compact, render]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-3 left-3 z-10">
          <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-mono text-amber-400/90 select-none">
            f(z) = {FUNCTIONS[fnIndex]}
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10">
          {FUNCTIONS.map((fn, i) => (
            <button
              key={fn}
              onClick={() => setFnIndex(i)}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all ${
                fnIndex === i
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm shadow-amber-500/10"
                  : "text-white/50 border border-transparent hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {fn}
            </button>
          ))}
          <span className="w-px h-5 bg-white/10 mx-1" />
          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              showGrid
                ? "bg-white/10 text-white/80 border border-white/20"
                : "text-white/40 border border-transparent hover:text-white/60"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setAutoRotate((a) => !a)}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              autoRotate
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "text-white/40 border border-transparent hover:text-white/60"
            }`}
          >
            Rotate
          </button>
          <button
            onClick={resetView}
            className="px-2.5 py-1 text-xs text-white/50 border border-transparent rounded-md hover:text-white/80 hover:bg-white/5 transition-all"
          >
            Reset
          </button>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-20 right-3 z-10 flex flex-col items-center gap-1.5">
          <button
            onClick={() => {
              const view = viewRef.current;
              view.zoom = Math.max(0.001, view.zoom / (1 + ZOOM_SPEED));
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white text-sm transition-all hover:bg-white/10"
          >
            +
          </button>
          <button
            onClick={() => {
              const view = viewRef.current;
              view.zoom = Math.min(1000, view.zoom * (1 + ZOOM_SPEED));
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white text-sm transition-all hover:bg-white/10"
          >
            −
          </button>
        </div>
      )}
      {!compact && (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
          <div className="px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10">
            <svg width="48" height="48" viewBox="0 0 48 48" className="rounded-full">
              {Array.from({ length: 360 }, (_, i) => {
                const angle = (i / 360) * Math.PI * 2;
                const r = 20;
                const cx = 24 + r * Math.cos(angle);
                const cy = 24 + r * Math.sin(angle);
                const [rr, gg, bb] = hsl2rgb(i, 1, 0.6);
                return (
                  <line
                    key={i}
                    x1={24}
                    y1={24}
                    x2={cx}
                    y2={cy}
                    stroke={`rgb(${rr},${gg},${bb})`}
                    strokeWidth="1"
                  />
                );
              })}
              <circle cx="24" cy="24" r="4" fill="#0f0f11" />
            </svg>
          </div>
          <span className="text-[10px] text-white/30 font-mono">Hue → Arg(w)</span>
        </div>
      )}
    </div>
  );
}
