import { useRef, useEffect } from "react";

const GRID_W = 80;
const GRID_H = 50;
const DPR_CAP = 1.5;

let _idx = (x: number, y: number) => x + y * GRID_W;

let _clamp = (x: number, min: number, max: number) =>
  x < min ? min : x > max ? max : x;

let _lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function sample(field: Float32Array, fx: number, fy: number, stride: number) {
  const x = _clamp(fx, 0, GRID_W - 1);
  const y = _clamp(fy, 0, GRID_H - 1);
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const sx = x - ix;
  const sy = y - iy;
  const ix1 = Math.min(ix + 1, GRID_W - 1);
  const iy1 = Math.min(iy + 1, GRID_H - 1);
  const v00 = field[_idx(ix, iy) * stride];
  const v10 = field[_idx(ix1, iy) * stride];
  const v01 = field[_idx(ix, iy1) * stride];
  const v11 = field[_idx(ix1, iy1) * stride];
  return _lerp(_lerp(v00, v10, sx), _lerp(v01, v11, sx), sy);
}

export default function LiquidDistortion({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);

  const velRef = useRef(new Float32Array(GRID_W * GRID_H * 2));
  const dyeRef = useRef(new Float32Array(GRID_W * GRID_H));
  const tempRef = useRef(new Float32Array(GRID_W * GRID_H));

  const mouseRef = useRef({ x: -1, y: -1, px: -1, py: -1, down: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;
    velRef.current.fill(0);
    dyeRef.current.fill(0);

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 600),
    });

    const resize = () => {
      const { w, h } = getSize();
      const dpr = compact ? 1 : Math.min(DPR_CAP, window.devicePixelRatio || 1);
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
        const r = mouseRef.current;
        r.px = r.x;
        r.py = r.y;
        r.x = ((e.clientX - rect.left) / rect.width) * GRID_W;
        r.y = ((e.clientY - rect.top) / rect.height) * GRID_H;
        r.down = (e.buttons & 1) !== 0;
      });
      container.addEventListener("mousedown", (e) => {
        const rect = container.getBoundingClientRect();
        const cx = ((e.clientX - rect.left) / rect.width) * GRID_W;
        const cy = ((e.clientY - rect.top) / rect.height) * GRID_H;
        const v = velRef.current;
        const d = dyeRef.current;
        for (let i = -3; i <= 3; i++) {
          for (let j = -3; j <= 3; j++) {
            const gx = Math.round(cx + i);
            const gy = Math.round(cy + j);
            if (gx >= 0 && gx < GRID_W && gy >= 0 && gy < GRID_H) {
              const p = _idx(gx, gy);
              const dist = Math.sqrt(i * i + j * j);
              const falloff = Math.max(0, 1 - dist / 4);
              v[p * 2] += (Math.random() - 0.5) * 200 * falloff;
              v[p * 2 + 1] += (Math.random() - 0.5) * 200 * falloff;
              d[p] += 300 * falloff;
            }
          }
        }
      });
      container.addEventListener("mouseleave", () => {
        mouseRef.current.x = -1;
        mouseRef.current.y = -1;
        mouseRef.current.px = -1;
        mouseRef.current.py = -1;
        mouseRef.current.down = false;
      });
    }

    const loop = () => {
      if (!runningRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      timeRef.current += 0.016;
      const { w, h } = getSize();
      const m = mouseRef.current;
      const v = velRef.current;
      const d = dyeRef.current;
      const t = tempRef.current;

      const decay = compact ? 0.94 : 0.995;

      if (m.x >= 0 && m.y >= 0 && m.px >= 0 && m.py >= 0) {
        const dx = (m.x - m.px) * 20;
        const dy = (m.y - m.py) * 20;
        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
          const gi = Math.round(m.x);
          const gj = Math.round(m.y);
          if (gi >= 0 && gi < GRID_W && gj >= 0 && gj < GRID_H) {
            const p = _idx(gi, gj);
            v[p * 2] += dx;
            v[p * 2 + 1] += dy;
            d[p] += m.down ? 200 : 50;
          }
        }
      }

      for (let j = 0; j < GRID_H; j++) {
        for (let i = 0; i < GRID_W; i++) {
          const p = _idx(i, j);
          const vx = v[p * 2];
          const vy = v[p * 2 + 1];
          const srcX = i - vx * 0.02;
          const srcY = j - vy * 0.02;
          t[p] = sample(d, srcX, srcY, 1) * decay;
          v[p * 2] *= 0.99;
          v[p * 2 + 1] *= 0.99;
        }
      }

      d.set(t);

      for (let j = 1; j < GRID_H - 1; j++) {
        for (let i = 1; i < GRID_W - 1; i++) {
          const p = _idx(i, j);
          d[p] += (d[_idx(i - 1, j)] + d[_idx(i + 1, j)] + d[_idx(i, j - 1)] + d[_idx(i, j + 1)] - d[p] * 4) * 0.02;
        }
      }

      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const gi = (px / w) * GRID_W;
          const gj = (py / h) * GRID_H;
          const dyeVal = sample(d, gi, gj, 1);
          const velX = sample(v, gi, gj, 2);
          const velY = sample(v, gi, gj + GRID_W * GRID_H, 2);
          const speed = Math.min(1, Math.sqrt(velX * velX + velY * velY) / 60);

          const dye = Math.min(1, dyeVal / 100);
          const bg = 6 + speed * 20;
          const r = Math.floor(bg + dye * 180);
          const g = Math.floor(bg + dye * 100);
          const b = Math.floor(bg + 20 + dye * 60);

          const pixelIdx = (py * w + px) * 4;
          data[pixelIdx] = r;
          data[pixelIdx + 1] = g;
          data[pixelIdx + 2] = b;
          data[pixelIdx + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/5">
        <span className="text-[10px] text-text-secondary/60">Move to push fluid · Click to burst · Drag to paint</span>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      </div>
    </div>
  );
}
