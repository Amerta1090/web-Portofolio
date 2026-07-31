import { useRef, useEffect, useState, useCallback } from "react";

interface PlanetConfig {
  name: string;
  radius: number;
  size: number;
  color: string;
  periodRatio: number;
}

interface Preset {
  name: string;
  ratio: string;
  planets: PlanetConfig[];
}

const PRESETS: Record<string, Preset> = {
  "pluto-neptune": {
    name: "Pluto-Neptune 3:2",
    ratio: "3:2",
    planets: [
      { name: "Neptune", radius: 0.4, size: 5, color: "#3b82f6", periodRatio: 3 },
      { name: "Pluto", radius: 0.65, size: 4, color: "#f59e0b", periodRatio: 2 },
    ],
  },
  "laplace": {
    name: "Laplace 1:2:4",
    ratio: "1:2:4",
    planets: [
      { name: "Io", radius: 0.2, size: 3, color: "#fbbf24", periodRatio: 4 },
      { name: "Europa", radius: 0.3, size: 4, color: "#22d3ee", periodRatio: 2 },
      { name: "Ganymede", radius: 0.42, size: 5, color: "#a78bfa", periodRatio: 1 },
    ],
  },
  "custom": {
    name: "Custom",
    ratio: "3:1",
    planets: [
      { name: "Inner", radius: 0.3, size: 5, color: "#4ade80", periodRatio: 3 },
      { name: "Outer", radius: 0.6, size: 6, color: "#f472b6", periodRatio: 1 },
    ],
  },
};

const CUSTOM_RATIOS = [
  { label: "2:1", value: [2, 1] as [number, number] },
  { label: "3:1", value: [3, 1] as [number, number] },
  { label: "3:2", value: [3, 2] as [number, number] },
  { label: "4:3", value: [4, 3] as [number, number] },
  { label: "5:3", value: [5, 3] as [number, number] },
  { label: "5:4", value: [5, 4] as [number, number] },
];

const TRAIL_LENGTH = 250;
const BASE_OMEGA = 0.4;

export default function OrbitalResonance({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const timeRef = useRef(0);
  const anglesRef = useRef<number[]>([]);
  const trailsRef = useRef<{ x: number; y: number }[][]>([]);

  const [preset, setPreset] = useState("pluto-neptune");
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [customRatioIdx, setCustomRatioIdx] = useState(0);
  const [showArrows, setShowArrows] = useState(true);

  const presetRef = useRef(preset);
  const speedRef = useRef(speed);
  const runningSimRef = useRef(false);
  const customRatioIdxRef = useRef(customRatioIdx);

  useEffect(() => { presetRef.current = preset; }, [preset]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { runningSimRef.current = running; }, [running]);
  useEffect(() => { customRatioIdxRef.current = customRatioIdx; }, [customRatioIdx]);

  const getEffectivePreset = useCallback(() => {
    if (presetRef.current === "custom") {
      const ratio = CUSTOM_RATIOS[customRatioIdxRef.current]?.value ?? [3, 1];
      const base = PRESETS["custom"];
      return {
        ...base,
        ratio: `${ratio[0]}:${ratio[1]}`,
        planets: [
          { ...base.planets[0], periodRatio: ratio[0] },
          { ...base.planets[1], periodRatio: ratio[1] },
        ],
      };
    }
    return PRESETS[presetRef.current] ?? PRESETS["pluto-neptune"];
  }, []);

  const presetForRender = preset === "custom"
    ? (() => {
        const ratio = CUSTOM_RATIOS[customRatioIdx]?.value ?? [3, 1];
        const base = PRESETS["custom"];
        return {
          ...base,
          ratio: `${ratio[0]}:${ratio[1]}`,
          planets: [
            { ...base.planets[0], periodRatio: ratio[0] },
            { ...base.planets[1], periodRatio: ratio[1] },
          ],
        };
      })()
    : PRESETS[preset] ?? PRESETS["pluto-neptune"];

  const initSimulation = useCallback(() => {
    const p = getEffectivePreset();
    const n = p.planets.length;
    anglesRef.current = Array.from({ length: n }, () => Math.random() * Math.PI * 2);
    trailsRef.current = Array.from({ length: n }, () => []);
  }, [getEffectivePreset]);

  useEffect(() => {
    initSimulation();
  }, [preset, customRatioIdx, initSimulation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;
    timeRef.current = 0;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 200 : 500),
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

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.38;

      const p = (presetRef.current === "custom"
        ? (() => {
            const ratio = CUSTOM_RATIOS[customRatioIdxRef.current]?.value ?? [3, 1];
            const base = PRESETS["custom"];
            return {
              ...base,
              planets: [
                { ...base.planets[0], periodRatio: ratio[0] },
                { ...base.planets[1], periodRatio: ratio[1] },
              ],
            };
          })()
        : PRESETS[presetRef.current]) ?? PRESETS["pluto-neptune"];
      const planets = p.planets;
      const angles = anglesRef.current;

      if (runningSimRef.current) {
        const dt = 0.016 * speedRef.current;
        timeRef.current += dt;
        for (let i = 0; i < planets.length; i++) {
          angles[i] += dt * BASE_OMEGA * planets[i].periodRatio;
        }
      }

      for (const planet of planets) {
        const r = planet.radius * maxR;
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      for (let i = 0; i < planets.length; i++) {
        const r = planets[i].radius * maxR;
        const px = cx + r * Math.cos(angles[i]);
        const py = cy + r * Math.sin(angles[i]);
        trailsRef.current[i].push({ x: px, y: py });
        if (trailsRef.current[i].length > TRAIL_LENGTH) trailsRef.current[i].shift();
      }

      for (let i = 0; i < planets.length; i++) {
        const trail = trailsRef.current[i];
        if (trail.length < 2) continue;
        ctx.save();
        for (let j = 1; j < trail.length; j++) {
          ctx.globalAlpha = (j / trail.length) * 0.4;
          ctx.strokeStyle = planets[i].color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(trail[j - 1].x, trail[j - 1].y);
          ctx.lineTo(trail[j].x, trail[j].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
          const diff = Math.abs(angles[i] - angles[j]) % (Math.PI * 2);
          const minDiff = Math.min(diff, Math.PI * 2 - diff);
          if (minDiff < 0.15) {
            const markerAngle = (angles[i] + angles[j]) / 2;
            for (const idx of [i, j]) {
              const mr = planets[idx].radius * maxR;
              const mx = cx + mr * Math.cos(markerAngle);
              const my = cy + mr * Math.sin(markerAngle);
              ctx.beginPath();
              ctx.arc(mx, my, 3, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(245,158,11,0.7)";
              ctx.fill();
              ctx.beginPath();
              ctx.arc(mx, my, 7, 0, Math.PI * 2);
              ctx.strokeStyle = "rgba(245,158,11,0.2)";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
            const r1 = planets[i].radius * maxR;
            const r2 = planets[j].radius * maxR;
            ctx.strokeStyle = "rgba(245,158,11,0.12)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cx + r1 * Math.cos(markerAngle), cy + r1 * Math.sin(markerAngle));
            ctx.lineTo(cx + r2 * Math.cos(markerAngle), cy + r2 * Math.sin(markerAngle));
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }

      if (showArrows && !compact) {
        for (let i = 0; i < planets.length; i++) {
          for (let j = 0; j < planets.length; j++) {
            if (i === j) continue;
            const ri = planets[i].radius * maxR;
            const rj = planets[j].radius * maxR;
            const pix = cx + ri * Math.cos(angles[i]);
            const piy = cy + ri * Math.sin(angles[i]);
            const pjx = cx + rj * Math.cos(angles[j]);
            const pjy = cy + rj * Math.sin(angles[j]);
            const dx = pjx - pix;
            const dy = pjy - piy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) continue;
            const nx = dx / dist;
            const ny = dy / dist;
            const aLen = Math.min(18, dist / 3);
            const alpha = 0.25 * (1 - dist / (maxR * 2));
            if (alpha > 0.04) {
              ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pix, piy);
              ctx.lineTo(pix + nx * aLen, piy + ny * aLen);
              ctx.stroke();
              const hs = 3.5;
              const ha = 0.5;
              ctx.beginPath();
              ctx.moveTo(pix + nx * aLen, piy + ny * aLen);
              ctx.lineTo(
                pix + nx * aLen - hs * Math.cos(ha) * nx - hs * Math.sin(ha) * ny,
                piy + ny * aLen - hs * Math.cos(ha) * ny + hs * Math.sin(ha) * nx,
              );
              ctx.lineTo(
                pix + nx * aLen - hs * Math.cos(ha) * nx + hs * Math.sin(ha) * ny,
                piy + ny * aLen - hs * Math.cos(ha) * ny - hs * Math.sin(ha) * nx,
              );
              ctx.closePath();
              ctx.fillStyle = `rgba(255,255,255,${alpha})`;
              ctx.fill();
            }
          }
        }
      }

      const sr = compact ? 5 : 10;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sr * 3);
      glow.addColorStop(0, "rgba(245,158,11,0.9)");
      glow.addColorStop(0.3, "rgba(245,158,11,0.3)");
      glow.addColorStop(1, "rgba(245,158,11,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, sr * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, sr, 0, Math.PI * 2);
      ctx.fillStyle = "#fbbf24";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, sr * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff9e6";
      ctx.fill();

      for (let i = 0; i < planets.length; i++) {
        const r = planets[i].radius * maxR;
        const px = cx + r * Math.cos(angles[i]);
        const py = cy + r * Math.sin(angles[i]);
        const gl = ctx.createRadialGradient(px, py, 0, px, py, planets[i].size * 2.5);
        gl.addColorStop(0, planets[i].color + "50");
        gl.addColorStop(1, "transparent");
        ctx.fillStyle = gl;
        ctx.beginPath();
        ctx.arc(px, py, planets[i].size * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, planets[i].size, 0, Math.PI * 2);
        ctx.fillStyle = planets[i].color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, planets[i].size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fill();

        if (!compact) {
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.font = "9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(planets[i].name, px, py + planets[i].size + 11);
        }
      }

      if (!compact) {
        ctx.fillStyle = "rgba(245,158,11,0.8)";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "left";
        ctx.fillText("ORBITAL RESONANCE", 12, 18);

        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "10px monospace";
        ctx.fillText(`Ratio: ${p.ratio}  |  Planets: ${planets.length}`, 12, 34);

        const periods = planets.map((pl, i) => {
          const t = (2 * Math.PI) / (BASE_OMEGA * pl.periodRatio);
          return `${pl.name}: ${t.toFixed(1)}s`;
        });
        ctx.fillText(periods.join("  "), 12, 50);

        ctx.fillText(`Elapsed: ${timeRef.current.toFixed(1)}s`, 12, 66);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, showArrows]);

  const handleReset = useCallback(() => {
    initSimulation();
    setRunning(false);
  }, [initSimulation]);

  const toggleRun = useCallback(() => {
    setRunning((r) => !r);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
          <div className="flex flex-wrap gap-1">
            {Object.entries(PRESETS).map(([key]) => (
              <button
                key={key}
                onClick={() => { setPreset(key); }}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  preset === key
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {PRESETS[key].name}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              onClick={toggleRun}
              className="px-3 py-1 text-xs rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30 transition-all"
            >
              {running ? "Pause" : "Play"}
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-xs rounded-full bg-bg-secondary/60 border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
            >
              Reset
            </button>
            <button
              onClick={() => setShowArrows((v) => !v)}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                showArrows
                  ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                  : "bg-bg-secondary/60 border-border/40 text-text-secondary hover:border-amber-500/30"
              }`}
            >
              {showArrows ? "Arrows On" : "Arrows Off"}
            </button>
          </div>
        </div>
      )}
      {!compact && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
            <span className="text-amber-400">{presetForRender.name}</span>
            {preset === "custom" && (
              <select
                value={customRatioIdx}
                onChange={(e) => setCustomRatioIdx(parseInt(e.target.value))}
                className="bg-bg-secondary/80 text-text-secondary text-[11px] px-2 py-0.5 rounded border border-border/40 font-mono"
              >
                {CUSTOM_RATIOS.map((r, i) => (
                  <option key={i} value={i}>{r.label}</option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-1">
              Speed:
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-16 accent-amber-500"
              />
            </label>
            <span className="text-amber-400/80">{presetForRender.ratio}</span>
          </div>
        </div>
      )}
    </div>
  );
}
