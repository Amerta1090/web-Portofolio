import { useRef, useEffect } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
}

const PARTICLE_COUNT = 180;
const CONNECT_DIST = 120;
const MOUSE_RADIUS = 180;

export default function ParticleGalaxy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, ix: -9999, iy: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      const w = window.innerWidth;
      const h = window.innerHeight;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 1 + Math.random() * 2.5,
        hue: Math.random() * 360,
        alpha: 0.3 + Math.random() * 0.7,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.5 + Math.random() * 2,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        ix: e.clientX,
        iy: e.clientY,
      };
    };

    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) {
        mouseRef.current = { x: t.clientX, y: t.clientY, ix: t.clientX, iy: t.clientY };
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999, ix: -9999, iy: -9999 };
    };

    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("touchmove", handleTouch);
    window.addEventListener("mouseleave", handleMouseLeave);

    const loop = () => {
      timeRef.current += 0.016;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const { x: mx, y: my } = mouseRef.current;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS) {
          const force = (1 - dist / MOUSE_RADIUS) * 0.04;
          p.vx += dx * force;
          p.vy += dy * force;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed * 0.016;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        p.vx *= 0.99;
        p.vy *= 0.99;

        const alpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        const size = p.size * (0.8 + 0.2 * Math.sin(p.pulse));

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + timeRef.current * 10}, 80%, 65%, ${alpha})`;
        ctx.fill();

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        glow.addColorStop(0, `hsla(${p.hue + timeRef.current * 10}, 80%, 65%, ${alpha * 0.15})`);
        glow.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.2;
            const hue = (a.hue + b.hue) / 2 + timeRef.current * 10;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${hue}, 60%, 60%, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      if (mx > 0 && mx < w && my > 0 && my < h) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, MOUSE_RADIUS);
        grad.addColorStop(0, "hsla(0, 0%, 100%, 0.02)");
        grad.addColorStop(1, "hsla(0, 0%, 0%, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mx, my, MOUSE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0a0c] relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/5">
        <span className="text-[10px] text-text-secondary/60">
          Move your mouse to bend the galaxy
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
      </div>
    </div>
  );
}
