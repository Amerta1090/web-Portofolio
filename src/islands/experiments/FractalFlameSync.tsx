import { useState, useRef, useEffect, useCallback } from "react";

const POINTS_PER_FRAME = 25000;
const NUM_FUNCTIONS = 6;
const VARIATION_NAMES = ["Linear", "Sinusoidal", "Spherical", "Swirl", "Horseshoe", "Heart"];
const BIN_SKIP = 20;

type ColorMode = "heat" | "cool" | "rainbow";

type AffineFunc = { a: number; b: number; c: number; d: number; e: number; f: number };

const VARIATIONS: ((x: number, y: number) => [number, number])[] = [
  (x, y) => [x, y],
  (x, y) => [Math.sin(x), Math.sin(y)],
  (x, y) => {
    const r2 = x * x + y * y;
    if (r2 < 1e-10) return [0, 0];
    const s = 1 / r2;
    return [x * s, y * s];
  },
  (x, y) => {
    const r2 = x * x + y * y;
    const sr = Math.sin(r2);
    const cr = Math.cos(r2);
    return [x * sr - y * cr, x * cr + y * sr];
  },
  (x, y) => {
    const r = Math.sqrt(x * x + y * y);
    if (r < 1e-10) return [0, 0];
    return [(x - y) * (x + y) / r, 2 * x * y / r];
  },
  (x, y) => {
    const r = Math.sqrt(x * x + y * y);
    const t = Math.atan2(x, y);
    return [r * Math.sin(t * r), -r * Math.cos(t * r)];
  },
];

const PALETTE_COLORS: Record<ColorMode, number[][]> = {
  heat: [
    [0.02, 0.01, 0.04],
    [0.45, 0.02, 0.01],
    [0.9, 0.15, 0.02],
    [1.0, 0.55, 0.05],
    [1.0, 0.95, 0.3],
    [1.0, 1.0, 0.95],
  ],
  cool: [
    [0.02, 0.01, 0.06],
    [0.02, 0.05, 0.45],
    [0.05, 0.2, 0.9],
    [0.1, 0.75, 1.0],
    [0.55, 0.95, 1.0],
    [0.95, 1.0, 1.0],
  ],
  rainbow: [
    [0.9, 0.05, 0.05],
    [1.0, 0.85, 0.05],
    [0.05, 0.85, 0.15],
    [0.05, 0.75, 0.9],
    [0.35, 0.1, 0.95],
    [0.85, 0.05, 0.75],
  ],
};

function buildPalette(colors: number[][], shift: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(256 * 3);
  const n = colors.length;
  for (let i = 0; i < 256; i++) {
    const t = ((i / 256) + shift) % 1;
    const scaled = t * n;
    const idx = Math.floor(scaled);
    const frac = scaled - idx;
    const c1 = colors[idx % n];
    const c2 = colors[(idx + 1) % n];
    out[i * 3] = Math.round((c1[0] + (c2[0] - c1[0]) * frac) * 255);
    out[i * 3 + 1] = Math.round((c1[1] + (c2[1] - c1[1]) * frac) * 255);
    out[i * 3 + 2] = Math.round((c1[2] + (c2[2] - c1[2]) * frac) * 255);
  }
  return out;
}

function makeAffine(index: number): AffineFunc {
  const angle = (index / NUM_FUNCTIONS) * Math.PI * 2;
  const r = 0.3 + Math.random() * 0.35;
  return {
    a: r * Math.cos(angle + 0.1),
    b: -r * Math.sin(angle - 0.1),
    c: r * Math.sin(angle + 0.1),
    d: r * Math.cos(angle - 0.1),
    e: (Math.random() - 0.5) * 0.5,
    f: (Math.random() - 0.5) * 0.5,
  };
}

function pickIndex(weights: Float64Array, total: number): number {
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export default function FractalFlameSync({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const dimsRef = useRef({ w: 0, h: 0 });
  const densityRef = useRef<Float32Array | null>(null);
  const colorIdxRef = useRef<Float32Array | null>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const glowRef = useRef<HTMLCanvasElement | null>(null);

  const funcsRef = useRef<AffineFunc[]>([]);
  const baseWeightsRef = useRef<Float64Array>(new Float64Array([1, 1, 1, 1, 1, 1]));
  const weightsRef = useRef<Float64Array>(new Float64Array([1, 1, 1, 1, 1, 1]));
  const weightTotalRef = useRef(6);
  const ptRef = useRef<[number, number]>([0, 0]);
  const rotRef = useRef(0);
  const colorShiftRef = useRef(0);
  const gammaRef = useRef(0.55);
  const timeRef = useRef(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaSrcRef = useRef<MediaElementAudioSourceNode | null>(null);
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const smoothBassRef = useRef(0);
  const smoothMidRef = useRef(0);
  const smoothHighRef = useRef(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"static" | "mic" | "file">("static");
  const [speed, setSpeed] = useState(1);
  const [colorMode, setColorMode] = useState<ColorMode>("heat");
  const [baseWeights, setBaseWeights] = useState([1, 1, 1, 1, 1, 1]);

  const modeRef = useRef(mode);
  const speedRef = useRef(speed);
  const colorModeRef = useRef(colorMode);
  const baseWeightsStateRef = useRef(baseWeights);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);
  useEffect(() => { baseWeightsStateRef.current = baseWeights; }, [baseWeights]);

  const initBuffers = useCallback((w: number, h: number) => {
    dimsRef.current = { w, h };
    densityRef.current = new Float32Array(w * h);
    colorIdxRef.current = new Float32Array(w * h);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = w;
      canvas.height = h;
      imageDataRef.current = canvas.getContext("2d")!.createImageData(w, h);
    }
  }, []);

  const generateFunctions = useCallback(() => {
    funcsRef.current = Array.from({ length: NUM_FUNCTIONS }, (_, i) => makeAffine(i));
  }, []);

  const resetFractal = useCallback(() => {
    const { w, h } = dimsRef.current;
    if (w > 0 && h > 0) {
      initBuffers(w, h);
      generateFunctions();
      ptRef.current = [0, 0];
    }
  }, [initBuffers, generateFunctions]);

  const processAudio = useCallback((fd: Uint8Array) => {
    const binHz = 44100 / 1024;
    let bass = 0, bassN = 0;
    let mid = 0, midN = 0;
    let high = 0, highN = 0;
    for (let i = BIN_SKIP; i < fd.length; i++) {
      const hz = i * binHz;
      if (hz < 300) { bass += fd[i]; bassN++; }
      else if (hz < 2000) { mid += fd[i]; midN++; }
      else { high += fd[i]; highN++; }
    }
    bass = bassN > 0 ? bass / (bassN * 255) : 0;
    mid = midN > 0 ? mid / (midN * 255) : 0;
    high = highN > 0 ? high / (highN * 255) : 0;

    const s = 0.12;
    smoothBassRef.current += (bass - smoothBassRef.current) * s;
    smoothMidRef.current += (mid - smoothMidRef.current) * s;
    smoothHighRef.current += (high - smoothHighRef.current) * s;

    const sb = smoothBassRef.current;
    const sm = smoothMidRef.current;
    const sh = smoothHighRef.current;
    const bw = baseWeightsStateRef.current;
    const wArr = weightsRef.current;
    let total = 0;
    for (let i = 0; i < NUM_FUNCTIONS; i++) {
      const mod = 1 + sb * 3.5 * Math.sin(i * 1.25 + timeRef.current * 0.8);
      wArr[i] = Math.max(0.04, bw[i] * mod);
      total += wArr[i];
    }
    weightTotalRef.current = total;
    rotRef.current = sm * 0.4;
    colorShiftRef.current = sh * 0.6;
  }, []);

  const iteratePoints = useCallback((count: number) => {
    const funcs = funcsRef.current;
    if (!funcs.length) return;
    const density = densityRef.current;
    const ci = colorIdxRef.current;
    if (!density || !ci) return;
    const { w, h } = dimsRef.current;
    if (w === 0) return;
    const wArr = weightsRef.current;
    const total = weightTotalRef.current;
    const rot = rotRef.current;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);
    let [px, py] = ptRef.current;
    const sx = w / 3;
    const sy = h / 3;

    for (let n = 0; n < count; n++) {
      const fi = pickIndex(wArr, total);
      const f = funcs[fi];
      const ax = f.a * px + f.b * py + f.e;
      const ay = f.c * px + f.d * py + f.f;
      const [vx, vy] = VARIATIONS[fi](ax, ay);
      px = vx * cosR - vy * sinR;
      py = vx * sinR + vy * cosR;

      if (n < BIN_SKIP) continue;
      const ix = (px * sx + w * 0.5) | 0;
      const iy = (h * 0.5 - py * sy) | 0;
      if (ix >= 0 && ix < w && iy >= 0 && iy < h) {
        const p = iy * w + ix;
        density[p] += 1;
        ci[p] = ci[p] * 0.96 + fi * 0.04;
      }
    }
    ptRef.current = [px, py];
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = imageDataRef.current;
    const density = densityRef.current;
    const ci = colorIdxRef.current;
    if (!ctx || !img || !density || !ci) return;
    const { w, h } = dimsRef.current;
    const data = img.data;

    let maxD = 0;
    for (let i = 0; i < density.length; i++) {
      if (density[i] > maxD) maxD = density[i];
    }
    if (maxD === 0) {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 15; data[i + 1] = 15; data[i + 2] = 17; data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return;
    }

    const pal = buildPalette(PALETTE_COLORS[colorModeRef.current], colorShiftRef.current);
    const logMax = Math.log(maxD + 1);
    const gamma = gammaRef.current;
    const invN = 1 / NUM_FUNCTIONS;

    for (let i = 0; i < density.length; i++) {
      const d = density[i];
      const idx = i << 2;
      if (d === 0) {
        data[idx] = 15;
        data[idx + 1] = 15;
        data[idx + 2] = 17;
        data[idx + 3] = 255;
        continue;
      }
      let brightness = Math.log(d + 1) / logMax;
      brightness = Math.pow(brightness, gamma);
      const cPos = (((ci[i] * invN) + colorShiftRef.current) * 256) | 0;
      const pi = (cPos & 255) * 3;
      const br = brightness * 1.05;
      data[idx] = Math.min(255, pal[pi] * br) | 0;
      data[idx + 1] = Math.min(255, pal[pi + 1] * br) | 0;
      data[idx + 2] = Math.min(255, pal[pi + 2] * br) | 0;
      data[idx + 3] = 255;
    }

    ctx.putImageData(img, 0, 0);

    if (!glowRef.current) {
      glowRef.current = document.createElement("canvas");
    }
    const gc = glowRef.current;
    if (gc.width !== w || gc.height !== h) {
      gc.width = w;
      gc.height = h;
    }
    const gctx = gc.getContext("2d");
    if (gctx) {
      gctx.drawImage(canvas, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.22;
      ctx.filter = "blur(6px)";
      ctx.drawImage(gc, 0, 0);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }, []);

  const animate = useCallback(() => {
    if (!runningRef.current) return;

    timeRef.current += 0.016;

    if (analyserRef.current && freqDataRef.current) {
      analyserRef.current.getByteFrequencyData(freqDataRef.current);
      processAudio(freqDataRef.current);
    }

    if (compact) {
      const t = timeRef.current;
      const bw = baseWeightsStateRef.current;
      const wArr = weightsRef.current;
      let total = 0;
      for (let i = 0; i < NUM_FUNCTIONS; i++) {
        wArr[i] = bw[i] + Math.sin(t * 0.4 + i * 1.25) * 0.6 + 0.5;
        total += wArr[i];
      }
      weightTotalRef.current = total;
      colorShiftRef.current = Math.sin(t * 0.15) * 0.3 + 0.15;
      rotRef.current = Math.sin(t * 0.1) * 0.08;
    }

    const pts = Math.floor(POINTS_PER_FRAME * speedRef.current);
    iteratePoints(pts);
    renderFrame();

    rafRef.current = requestAnimationFrame(animate);
  }, [compact, processAudio, iteratePoints, renderFrame]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const cw = Math.floor(rect.width);
      const ch = Math.floor(rect.height);
      if (cw > 0 && ch > 0 && (dimsRef.current.w !== cw || dimsRef.current.h !== ch)) {
        initBuffers(cw, ch);
        generateFunctions();
        ptRef.current = [0, 0];
      }
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    runningRef.current = true;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        try { analyserRef.current.disconnect(); } catch {}
        analyserRef.current = null;
      }
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = "";
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [animate, initBuffers, generateFunctions]);

  const initAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    if (!analyserRef.current) {
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      freqDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }
  }, []);

  const stopCurrentSource = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
      sourceRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
    }
    try { analyserRef.current?.disconnect(); } catch {}
    smoothBassRef.current = 0;
    smoothMidRef.current = 0;
    smoothHighRef.current = 0;
    weightsRef.current.set(baseWeightsStateRef.current);
    rotRef.current = 0;
    colorShiftRef.current = 0;
  }, []);

  const startMic = useCallback(async () => {
    initAudioCtx();
    stopCurrentSource();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const ctx = audioCtxRef.current!;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyserRef.current!);
      sourceRef.current = src;
      setMode("mic");
    } catch {
      console.warn("Microphone access denied");
    }
  }, [initAudioCtx, stopCurrentSource]);

  const startFile = useCallback((file: File) => {
    initAudioCtx();
    stopCurrentSource();
    try {
      const ctx = audioCtxRef.current!;
      const el = new Audio();
      el.crossOrigin = "anonymous";
      el.loop = true;
      el.src = URL.createObjectURL(file);
      audioElRef.current = el;

      if (!mediaSrcRef.current) {
        mediaSrcRef.current = ctx.createMediaElementSource(el);
      }
      const src = mediaSrcRef.current;
      src.connect(analyserRef.current!);
      analyserRef.current!.connect(ctx.destination);
      sourceRef.current = src;
      el.play();
      setMode("file");
    } catch (err) {
      console.warn("Audio file error:", err);
    }
  }, [initAudioCtx, stopCurrentSource]);

  const stopAudio = useCallback(() => {
    stopCurrentSource();
    setMode("static");
  }, [stopCurrentSource]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith("audio/")) startFile(f);
    },
    [startFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) startFile(f);
      e.target.value = "";
    },
    [startFile]
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0f0f11] relative overflow-hidden flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="w-full flex-1" />

      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {(["static", "mic", "file"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    if (m === "static") stopAudio();
                    else if (m === "mic") startMic();
                    else fileInputRef.current?.click();
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === m
                      ? "bg-amber-500/20 text-amber-400 shadow-sm shadow-amber-500/10"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {m === "static" ? "Static" : m === "mic" ? "Mic" : "File"}
                </button>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {mode !== "static" && (
              <button
                onClick={stopAudio}
                className="px-3 py-1.5 rounded-md text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                Stop
              </button>
            )}

            <div className="flex items-center gap-2 ml-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Spd</span>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-16 accent-amber-500 h-1"
              />
              <span className="text-[10px] text-white/30 w-7 text-right">{speed.toFixed(1)}x</span>
            </div>

            <div className="flex gap-1 bg-white/5 rounded-lg p-1 ml-1">
              {(["heat", "cool", "rainbow"] as const).map((cm) => (
                <button
                  key={cm}
                  onClick={() => setColorMode(cm)}
                  className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider transition-all ${
                    colorMode === cm
                      ? "bg-amber-500/20 text-amber-400"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {cm}
                </button>
              ))}
            </div>

            <button
              onClick={resetFractal}
              className="px-3 py-1.5 rounded-md text-[10px] bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all ml-auto uppercase tracking-wider"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {VARIATION_NAMES.map((name, i) => (
              <div key={name} className="flex items-center gap-1">
                <span className="text-[9px] text-white/25 w-14 text-right uppercase tracking-wider">
                  {name.slice(0, 4)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={baseWeights[i]}
                  onChange={(e) => {
                    const nw = [...baseWeights];
                    nw[i] = parseFloat(e.target.value);
                    setBaseWeights(nw);
                    weightsRef.current[i] = nw[i];
                  }}
                  className="w-14 accent-amber-500 h-0.5"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
