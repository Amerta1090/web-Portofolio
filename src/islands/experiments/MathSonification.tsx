import { useRef, useEffect, useState, useCallback } from "react";

type MathMode = "primes" | "pi" | "bifurcation" | "fractal";
type WaveType = "sine" | "square" | "triangle" | "sawtooth";

const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0];
const C_MAJOR = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25];

function sievePrimes(limit: number): number[] {
  const sieve = new Uint8Array(limit + 1);
  for (let i = 2; i * i <= limit; i++) {
    if (!sieve[i]) for (let j = i * i; j <= limit; j += i) sieve[j] = 1;
  }
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) if (!sieve[i]) primes.push(i);
  return primes;
}

const PI_DIGITS = "314159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196";

function generatePrimesSequence(): { value: number; freq: number; label: string }[] {
  const primes = sievePrimes(200).slice(0, 50);
  return primes.map((p, i) => ({
    value: p,
    freq: PENTATONIC[i % 5],
    label: `${p}`,
  }));
}

function generatePiSequence(): { value: number; freq: number; label: string }[] {
  const digits = PI_DIGITS.slice(0, 50).split("").map(Number);
  return digits.map((d, i) => ({
    value: d,
    freq: C_MAJOR[d],
    label: `${d}`,
  }));
}

function generateBifurcationSequence(rStart: number, rEnd: number, steps: number): { value: number; freq: number; label: string }[] {
  const result: { value: number; freq: number; label: string }[] = [];
  for (let i = 0; i < steps; i++) {
    const r = rStart + ((rEnd - rStart) * i) / steps;
    let x = 0.5;
    for (let j = 0; j < 200; j++) x = r * x * (1 - x);
    const freq = 200 + x * 800;
    result.push({ value: x, freq, label: `r=${r.toFixed(2)}` });
  }
  return result;
}

function generateFractalSequence(): { value: number; freq: number; label: string; depth: number }[] {
  const result: { value: number; freq: number; label: string; depth: number }[] = [];
  const baseFreq = 220;
  function recurse(depth: number, maxDepth: number) {
    if (depth > maxDepth) return;
    const freq = baseFreq * Math.pow(1.5, depth);
    result.push({ value: depth, freq, label: `L${depth}`, depth });
    recurse(depth + 1, maxDepth);
    recurse(depth + 1, maxDepth);
    recurse(depth + 1, maxDepth);
    recurse(depth + 1, maxDepth);
  }
  recurse(0, 4);
  return result;
}

function noteColor(index: number, total: number, isPlaying: boolean): string {
  const hue = 35 + (index / total) * 20;
  if (isPlaying) return `hsl(${hue}, 90%, 60%)`;
  return `hsl(${hue}, 50%, 25%)`;
}

export default function MathSonification({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sequenceRef = useRef<{ freq: number; label: string; value: number; depth?: number }[]>([]);
  const schedulerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mode, setMode] = useState<MathMode>("primes");
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [waveType, setWaveType] = useState<WaveType>("sine");
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [bifR, setBifR] = useState(2.5);

  const buildSequence = useCallback(() => {
    switch (mode) {
      case "primes": return generatePrimesSequence();
      case "pi": return generatePiSequence();
      case "bifurcation": return generateBifurcationSequence(bifR, Math.min(bifR + 1.8, 4.0), 50);
      case "fractal": return generateFractalSequence();
    }
  }, [mode, bifR]);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const scheduleNotes = useCallback(() => {
    const seq = sequenceRef.current;
    const ctx = ensureAudioCtx();
    const noteDur = 60 / tempo;
    const start = ctx.currentTime + 0.05;

    let idx = 0;
    const check = () => {
      if (!runningRef.current) return;
      const now = ctx.currentTime;
      while (idx < seq.length && start + idx * noteDur <= now + 0.1) {
        const note = seq[idx];
        const noteTime = start + idx * noteDur;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = waveType;
        osc.frequency.setValueAtTime(note.freq, noteTime);
        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDur * 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + noteDur * 0.8 + 0.01);
        idx++;
      }
      setCurrentIdx(idx < seq.length ? idx : seq.length);
      if (idx < seq.length) {
        schedulerRef.current = setTimeout(check, 50);
      } else {
        setTimeout(() => {
          setPlaying(false);
          runningRef.current = false;
          setCurrentIdx(-1);
        }, (noteDur + 0.2) * 1000);
      }
    };
    check();
  }, [tempo, waveType, ensureAudioCtx]);

  const startPlayback = useCallback(() => {
    sequenceRef.current = buildSequence();
    runningRef.current = true;
    setPlaying(true);
    setCurrentIdx(0);
    scheduleNotes();
  }, [buildSequence, scheduleNotes]);

  const stopPlayback = useCallback(() => {
    runningRef.current = false;
    setPlaying(false);
    setCurrentIdx(-1);
    if (schedulerRef.current) clearTimeout(schedulerRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (playing) stopPlayback();
    else startPlayback();
  }, [playing, startPlayback, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stopPlayback]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || compact) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = devicePixelRatio || 1;
    const seq = buildSequence();
    const total = seq.length;
    let animFrame = 0;

    const draw = () => {
      animFrame++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.save();
      ctx.scale(dpr, dpr);
      const cw = w / dpr;
      const ch = h / dpr;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, cw, ch);

      if (compact) {
        const t = animFrame * 0.03;
        ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < cw; x++) {
          const y = ch / 2 + Math.sin(x * 0.05 + t) * 20 * Math.sin(x * 0.02 + t * 0.5);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
        ctx.beginPath();
        for (let x = 0; x < cw; x++) {
          const y = ch / 2 + Math.cos(x * 0.03 + t * 1.3) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const barWidth = Math.max(8, Math.min(40, (cw - 40) / total));
      const scrollOffset = Math.max(0, (currentIdx * barWidth) - cw / 2 + barWidth / 2);

      for (let i = 0; i < total; i++) {
        const x = i * barWidth - scrollOffset + 20;
        if (x < -barWidth || x > cw + barWidth) continue;

        const isCurrent = i === currentIdx;
        const isPast = i < currentIdx;
        const maxFreq = 1000;
        const barH = (seq[i].freq / maxFreq) * (ch * 0.6);

        if (isCurrent) {
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 12;
        }

        ctx.fillStyle = isCurrent ? "#f59e0b" : isPast ? "rgba(245, 158, 11, 0.15)" : noteColor(i, total, false);
        const barY = ch * 0.7 - barH;
        ctx.beginPath();
        ctx.roundRect(x, barY, barWidth - 2, barH, 3);
        ctx.fill();

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        if (barWidth > 16 && i % (barWidth > 24 ? 1 : 2) === 0) {
          ctx.fillStyle = isCurrent ? "#fff" : "rgba(255,255,255,0.3)";
          ctx.font = "9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(seq[i].label, x + barWidth / 2, ch * 0.73);
        }
      }

      ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, ch * 0.7);
      ctx.lineTo(cw, ch * 0.7);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(245, 158, 11, 0.4)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(mode === "primes" ? "Prime → Pentatonic" : mode === "pi" ? "π digits → C Major" : mode === "bifurcation" ? "Logistic Map → Frequency" : "Koch Snowflake → Depth", 10, 18);

      if (currentIdx >= 0 && currentIdx < seq.length) {
        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${seq[currentIdx].label}  ${seq[currentIdx].freq.toFixed(0)}Hz`, cw - 10, 18);
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [buildSequence, currentIdx, mode, compact]);

  if (compact) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0f0f11] rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0f0f11] rounded-xl overflow-hidden text-white">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/10">
        {(["primes", "pi", "bifurcation", "fractal"] as MathMode[]).map((m) => (
          <button
            key={m}
            onClick={() => { if (playing) stopPlayback(); setMode(m); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m ? "bg-[#f59e0b] text-black" : "bg-white/10 hover:bg-white/20 text-white/70"
            }`}
          >
            {m === "pi" ? "π Digits" : m === "primes" ? "Primes" : m === "bifurcation" ? "Bifurcation" : "Fractal"}
          </button>
        ))}

        <div className="w-px h-6 bg-white/10 mx-1" />

        <button
          onClick={togglePlayback}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            playing ? "bg-red-500/80 hover:bg-red-500" : "bg-[#f59e0b] hover:bg-[#f59e0b]/80 text-black"
          }`}
        >
          {playing ? "■ Stop" : "▶ Play"}
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <span className="text-xs text-white/50">Tempo</span>
        <input
          type="range"
          min={60}
          max={300}
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          className="w-24 accent-[#f59e0b]"
        />
        <span className="text-xs text-white/50 w-12">{tempo} BPM</span>

        <div className="w-px h-6 bg-white/10 mx-1" />

        <select
          value={waveType}
          onChange={(e) => setWaveType(e.target.value as WaveType)}
          className="bg-white/10 text-white/70 text-xs rounded px-2 py-1 border-none outline-none"
        >
          <option value="sine">Sine</option>
          <option value="square">Square</option>
          <option value="triangle">Triangle</option>
          <option value="sawtooth">Sawtooth</option>
        </select>

        {mode === "bifurcation" && (
          <>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <span className="text-xs text-white/50">r={bifR.toFixed(2)}</span>
            <input
              type="range"
              min={200}
              max={400}
              value={bifR * 100}
              onChange={(e) => setBifR(Number(e.target.value) / 100)}
              className="w-24 accent-[#f59e0b]"
            />
          </>
        )}
      </div>

      <div ref={containerRef} className="flex-1 min-h-0">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
