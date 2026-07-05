import { useRef, useEffect, useState, useCallback } from "react";

interface Layer {
  id: number;
  speed: number;
  baseBlur: number;
  opacity: number;
  color: string;
  size: number;
  phase: number;
}

function generateLayers(count: number): Layer[] {
  const colors = [
    "245,158,11",  // amber
    "139,92,246",  // purple
    "6,182,212",   // cyan
    "236,72,153",  // pink
  ];
  return Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1);
    return {
      id: i,
      speed: 0.4 + t * 0.8,
      baseBlur: Math.floor(t * 5),
      opacity: 0.3 + t * 0.5,
      color: colors[i % colors.length],
      size: 120 + Math.random() * 80 - t * 60,
      phase: Math.random() * Math.PI * 2,
    };
  });
}

interface State {
  dof: boolean;
  focus: number | null;
}

export default function DepthPlayground({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [state, setState] = useState<State>({ dof: false, focus: null });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const layers = useRef(generateLayers(compact ? 2 : 4)).current;

  const toggleDof = useCallback(() => {
    setState((s) => ({ ...s, dof: !s.dof }));
  }, []);

  const focusLayer = useCallback((id: number) => {
    setState((s) => ({ ...s, focus: s.focus === id ? null : id }));
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

    if (!compact) {
      container.addEventListener("mousemove", (e) => {
        const rect = container.getBoundingClientRect();
        mouseRef.current = {
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        };
      });
      container.addEventListener("mouseleave", () => {
        mouseRef.current = { x: 0.5, y: 0.5 };
      });
    }

    const loop = () => {
      if (!runningRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      timeRef.current += 1;
      const { w, h } = getSize();
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const s = stateRef.current;

      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, w, h);

      const t = timeRef.current;

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const ox = (mx - 0.5) * layer.speed * 100;
        const oy = (my - 0.5) * layer.speed * 60;
        const cx = w * 0.5 + ox;
        const cy = h * 0.5 + oy + Math.sin(t * 0.008 + layer.phase) * 8;
        const size = layer.size + Math.sin(t * 0.005 + layer.phase * 2) * 5;
        const r = size / 2;

        let blur = layer.baseBlur;
        if (s.focus !== null) {
          blur = layer.id === s.focus ? 0 : 10;
        } else if (s.dof) {
          const mid = (layers.length - 1) / 2;
          blur = Math.abs(i - mid) * 2.5;
        }

        const alpha = layer.opacity;
        const col = layer.color;

        const holdGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + blur * 3);
        holdGrad.addColorStop(0, `rgba(${col},${alpha})`);
        holdGrad.addColorStop(0.5, `rgba(${col},${alpha * 0.4})`);
        holdGrad.addColorStop(1, `rgba(${col},0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, r + blur * 3, 0, Math.PI * 2);
        ctx.fillStyle = holdGrad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [compact]);

  if (compact) {
    return (
      <div ref={containerRef} className="w-full h-full bg-[#0a0a0c] overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0a0a0c] relative overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={toggleDof}
          className={`px-3 py-1.5 rounded-full text-[10px] font-mono border transition-all ${
            state.dof
              ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
              : "bg-black/40 border-white/10 text-text-secondary/50"
          }`}
        >
          DOF: {state.dof ? "ON" : "OFF"}
        </button>
      </div>

      <div className="absolute top-4 right-4 flex flex-col gap-1.5">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => focusLayer(layer.id)}
            className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
              state.focus === layer.id
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-black/40 border-white/5 text-text-secondary/40"
            }`}
          >
            L{layer.id + 1} ×{layer.speed.toFixed(1)}
          </button>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/5">
        <span className="text-[10px] text-text-secondary/60">Move mouse to shift depth layers</span>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      </div>
    </div>
  );
}
