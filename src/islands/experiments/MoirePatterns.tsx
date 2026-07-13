import { useRef, useEffect, useState, useCallback } from "react";

type GridType = "circles" | "lines" | "radial" | "checker" | "dots";
type BlendMode = "multiply" | "screen" | "additive";

interface Layer {
  gridType: GridType;
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  color: string;
  animSpeed: number;
}

const PRESETS: Record<string, Layer[]> = {
  Classic: [
    { gridType: "circles", rotation: 0, scale: 12, offsetX: 0, offsetY: 0, color: "#ffffff", animSpeed: 0.3 },
    { gridType: "circles", rotation: 0, scale: 13, offsetX: 8, offsetY: 5, color: "#ffffff", animSpeed: -0.2 },
    { gridType: "circles", rotation: 0, scale: 14, offsetX: -4, offsetY: 8, color: "#f59e0b", animSpeed: 0 },
  ],
  Radial: [
    { gridType: "circles", rotation: 0, scale: 10, offsetX: 0, offsetY: 0, color: "#ffffff", animSpeed: 0.2 },
    { gridType: "radial", rotation: 0, scale: 18, offsetX: 0, offsetY: 0, color: "#22d3ee", animSpeed: -0.4 },
    { gridType: "radial", rotation: 15, scale: 24, offsetX: 0, offsetY: 0, color: "#f59e0b", animSpeed: 0 },
  ],
  Typography: [
    { gridType: "lines", rotation: 0, scale: 8, offsetX: 0, offsetY: 0, color: "#ffffff", animSpeed: 0.15 },
    { gridType: "lines", rotation: 0, scale: 9, offsetX: 0, offsetY: 3, color: "#f472b6", animSpeed: -0.1 },
    { gridType: "lines", rotation: 0, scale: 12, offsetX: 0, offsetY: 0, color: "#a78bfa", animSpeed: 0 },
  ],
  Spiral: [
    { gridType: "radial", rotation: 0, scale: 16, offsetX: 0, offsetY: 0, color: "#ffffff", animSpeed: 0.3 },
    { gridType: "radial", rotation: 0, scale: 20, offsetX: 0, offsetY: 0, color: "#22d3ee", animSpeed: -0.25 },
    { gridType: "circles", rotation: 0, scale: 30, offsetX: 0, offsetY: 0, color: "#f59e0b", animSpeed: 0.1 },
  ],
  Zoom: [
    { gridType: "dots", rotation: 0, scale: 14, offsetX: 0, offsetY: 0, color: "#ffffff", animSpeed: 0.2 },
    { gridType: "dots", rotation: 0, scale: 16, offsetX: 5, offsetY: 5, color: "#f472b6", animSpeed: -0.15 },
    { gridType: "dots", rotation: 0, scale: 20, offsetX: -3, offsetY: 8, color: "#22d3ee", animSpeed: 0 },
  ],
};

const GRID_TYPES: GridType[] = ["circles", "lines", "radial", "checker", "dots"];
const COLORS = ["#ffffff", "#22d3ee", "#f59e0b", "#f472b6", "#a78bfa"];
const BLENDS: BlendMode[] = ["multiply", "screen", "additive"];

function drawConcentricCircles(ctx: CanvasRenderingContext2D, cx: number, cy: number, spacing: number, color: string) {
  const maxR = Math.hypot(ctx.canvas.width, ctx.canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  for (let r = spacing; r < maxR; r += spacing) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawParallelLines(ctx: CanvasRenderingContext2D, spacing: number, color: string) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const maxDim = Math.hypot(w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  for (let y = -maxDim; y < maxDim; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(-maxDim, y);
    ctx.lineTo(maxDim, y);
    ctx.stroke();
  }
}

function drawRadialLines(ctx: CanvasRenderingContext2D, cx: number, cy: number, spacing: number, color: string) {
  const maxR = Math.hypot(ctx.canvas.width, ctx.canvas.height);
  const angleStep = (Math.PI * 2) / spacing;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  for (let a = 0; a < Math.PI * 2; a += angleStep) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
    ctx.stroke();
  }
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, spacing: number, color: string) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.fillStyle = color;
  for (let y = 0; y < h; y += spacing) {
    for (let x = 0; x < w; x += spacing) {
      if ((Math.floor(x / spacing) + Math.floor(y / spacing)) % 2 === 0) {
        ctx.fillRect(x, y, spacing, spacing);
      }
    }
  }
}

function drawDotGrid(ctx: CanvasRenderingContext2D, spacing: number, color: string) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const r = Math.max(1, spacing * 0.15);
  ctx.fillStyle = color;
  for (let y = spacing / 2; y < h; y += spacing) {
    for (let x = spacing / 2; x < w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, layer: Layer, w: number, h: number) {
  const cx = w / 2 + layer.offsetX;
  const cy = h / 2 + layer.offsetY;
  const sp = Math.max(2, 52 - layer.scale);
  switch (layer.gridType) {
    case "circles":
      drawConcentricCircles(ctx, cx, cy, sp, layer.color);
      break;
    case "lines":
      drawParallelLines(ctx, sp, layer.color);
      break;
    case "radial":
      drawRadialLines(ctx, cx, cy, sp, layer.color);
      break;
    case "checker":
      drawCheckerboard(ctx, sp, layer.color);
      break;
    case "dots":
      drawDotGrid(ctx, sp, layer.color);
      break;
  }
}

function getCompositeOp(blend: BlendMode): GlobalCompositeOperation {
  switch (blend) {
    case "multiply":
      return "multiply";
    case "screen":
      return "screen";
    case "additive":
      return "lighter";
  }
}

const DEFAULT_LAYERS: Layer[] = [
  { gridType: "circles", rotation: 0, scale: 12, offsetX: 0, offsetY: 0, color: "#ffffff", animSpeed: 0.3 },
  { gridType: "circles", rotation: 0, scale: 13, offsetX: 8, offsetY: 5, color: "#ffffff", animSpeed: -0.2 },
  { gridType: "circles", rotation: 0, scale: 14, offsetX: -4, offsetY: 8, color: "#f59e0b", animSpeed: 0 },
];

export default function MoirePatterns({ compact }: { compact?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const timeRef = useRef(0);

  const [layers, setLayers] = useState<Layer[]>(() =>
    compact ? PRESETS.Classic : structuredClone(DEFAULT_LAYERS)
  );
  const [activeLayer, setActiveLayer] = useState(0);
  const [blend, setBlend] = useState<BlendMode>("screen");
  const [animating, setAnimating] = useState(!compact);
  const [animSpeed, setAnimSpeed] = useState(1);

  const updateLayer = useCallback((idx: number, patch: Partial<Layer>) => {
    setLayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const applyPreset = useCallback((name: string) => {
    const p = PRESETS[name];
    if (p) setLayers(structuredClone(p));
  }, []);

  useEffect(() => {
    if (compact) return;
    const c = canvasRef.current;
    const container = containerRef.current;
    if (!c || !container) return;

    const onPointerDown = (e: PointerEvent) => {
      dragRef.current = { dragging: true, lastX: e.clientX, lastY: e.clientY };
      c.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.lastX;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      updateLayer(layers.length - 1, {
        rotation: (layers[layers.length - 1].rotation + dx * 0.5) % 360,
      });
    };
    const onPointerUp = () => {
      dragRef.current.dragging = false;
    };

    c.addEventListener("pointerdown", onPointerDown);
    c.addEventListener("pointermove", onPointerMove);
    c.addEventListener("pointerup", onPointerUp);
    c.addEventListener("pointercancel", onPointerUp);
    return () => {
      c.removeEventListener("pointerdown", onPointerDown);
      c.removeEventListener("pointermove", onPointerMove);
      c.removeEventListener("pointerup", onPointerUp);
      c.removeEventListener("pointercancel", onPointerUp);
    };
  }, [compact, layers, updateLayer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    if (!offscreenRef.current) {
      offscreenRef.current = document.createElement("canvas");
    }

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = compact ? 1 : Math.min(window.devicePixelRatio, 1.5);
      const w = rect.width;
      const h = compact ? Math.min(rect.height, 192) : rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      if (offscreenRef.current) {
        offscreenRef.current.width = canvas.width;
        offscreenRef.current.height = canvas.height;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (animating) {
        timeRef.current += dt * animSpeed;
      }

      const w = canvas.width;
      const h = canvas.height;
      const off = offscreenRef.current!;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const compositeOp = getCompositeOp(blend);

      for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        const rot = l.rotation + timeRef.current * l.animSpeed * 360;

        const offCtx = off.getContext("2d")!;
        offCtx.clearRect(0, 0, off.width, off.height);
        offCtx.save();
        offCtx.translate(off.width / 2, off.height / 2);
        offCtx.rotate((rot * Math.PI) / 180);
        offCtx.translate(-off.width / 2, -off.height / 2);
        drawGrid(offCtx, l, off.width, off.height);
        offCtx.restore();

        if (i === 0) {
          ctx.drawImage(off, 0, 0);
        } else {
          ctx.globalCompositeOperation = compositeOp;
          ctx.drawImage(off, 0, 0);
          ctx.globalCompositeOperation = "source-over";
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [compact, layers, blend, animating, animSpeed]);

  const L = layers[activeLayer] ?? layers[0];

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {!compact && (
        <>
          {/* Top bar: presets + blend + anim */}
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 z-10">
            <div className="flex gap-1">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all bg-bg-secondary/60 backdrop-blur-sm"
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border/30" />

            <div className="flex gap-1">
              {BLENDS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBlend(b)}
                  className={`px-2 py-0.5 text-[10px] rounded border transition-all backdrop-blur-sm ${
                    blend === b
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                      : "border-border/40 text-text-secondary hover:border-amber-500/30 bg-bg-secondary/60"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border/30" />

            <button
              onClick={() => setAnimating((a) => !a)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-all backdrop-blur-sm ${
                animating
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "border-border/40 text-text-secondary hover:border-amber-500/30 bg-bg-secondary/60"
              }`}
            >
              {animating ? "Stop" : "Animate"}
            </button>

            {animating && (
              <label className="flex items-center gap-1 text-[10px] text-text-secondary font-mono">
                spd
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={animSpeed}
                  onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                  className="w-14 accent-amber-500"
                />
                <span className="text-amber-400">{animSpeed.toFixed(1)}</span>
              </label>
            )}

            <button
              onClick={() => {
                setLayers(structuredClone(DEFAULT_LAYERS));
                setBlend("screen");
                setAnimating(false);
                setAnimSpeed(1);
                setActiveLayer(0);
              }}
              className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-red-500/30 transition-all bg-bg-secondary/60 backdrop-blur-sm"
            >
              Reset
            </button>
          </div>

          {/* Bottom panel: layer controls */}
          <div className="absolute bottom-3 left-3 right-3 z-10">
            <div className="bg-bg-secondary/80 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-2">
              {/* Layer tabs */}
              <div className="flex gap-1 mb-2">
                {layers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveLayer(i)}
                    className={`px-2 py-0.5 text-[10px] rounded transition-all ${
                      activeLayer === i
                        ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                        : "border border-border/30 text-text-secondary hover:border-amber-500/30"
                    }`}
                  >
                    Layer {i + 1}
                  </button>
                ))}
              </div>

              {/* Grid type */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] text-text-secondary/60 font-mono w-10">type</span>
                <div className="flex gap-1">
                  {GRID_TYPES.map((gt) => (
                    <button
                      key={gt}
                      onClick={() => updateLayer(activeLayer, { gridType: gt })}
                      className={`px-1.5 py-0.5 text-[9px] rounded transition-all ${
                        L.gridType === gt
                          ? "bg-amber-500/20 border border-amber-500/50 text-amber-400"
                          : "border border-border/30 text-text-secondary hover:border-amber-500/30"
                      }`}
                    >
                      {gt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-secondary font-mono mb-2">
                <label className="flex items-center gap-1">
                  rot
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={Math.round(L.rotation)}
                    onChange={(e) => updateLayer(activeLayer, { rotation: parseFloat(e.target.value) })}
                    className="w-16 accent-amber-500"
                  />
                  <span className="text-amber-400 w-7">{Math.round(L.rotation)}°</span>
                </label>
                <label className="flex items-center gap-1">
                  freq
                  <input
                    type="range"
                    min={1}
                    max={50}
                    step={1}
                    value={L.scale}
                    onChange={(e) => updateLayer(activeLayer, { scale: parseInt(e.target.value) })}
                    className="w-16 accent-amber-500"
                  />
                  <span className="text-amber-400 w-5">{L.scale}</span>
                </label>
                <label className="flex items-center gap-1">
                  x
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={L.offsetX}
                    onChange={(e) => updateLayer(activeLayer, { offsetX: parseInt(e.target.value) })}
                    className="w-14 accent-amber-500"
                  />
                  <span className="text-amber-400 w-7">{L.offsetX}</span>
                </label>
                <label className="flex items-center gap-1">
                  y
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={L.offsetY}
                    onChange={(e) => updateLayer(activeLayer, { offsetY: parseInt(e.target.value) })}
                    className="w-14 accent-amber-500"
                  />
                  <span className="text-amber-400 w-7">{L.offsetY}</span>
                </label>
              </div>

              {/* Color + per-layer anim */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-text-secondary/60 font-mono">color</span>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateLayer(activeLayer, { color: c })}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        L.color === c ? "border-amber-400 scale-110" : "border-border/40"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <label className="flex items-center gap-1 text-[10px] text-text-secondary font-mono">
                  auto
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.1}
                    value={L.animSpeed}
                    onChange={(e) => updateLayer(activeLayer, { animSpeed: parseFloat(e.target.value) })}
                    className="w-14 accent-amber-500"
                  />
                  <span className="text-amber-400 w-5">{L.animSpeed.toFixed(1)}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Drag hint */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-bg-secondary/60 backdrop-blur-sm border border-border/30 text-text-secondary/60 text-[9px] font-mono pointer-events-none">
            drag canvas to rotate top layer
          </div>
        </>
      )}
    </div>
  );
}
