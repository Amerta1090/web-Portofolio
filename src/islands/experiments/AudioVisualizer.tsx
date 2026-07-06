import { useRef, useEffect, useState, useCallback } from "react";

type VizMode = "bar" | "ring" | "wave" | "particle" | "hex";

const FFT_SIZE = 256;
const PARTICLE_COUNT = 120;
const HEX_COLS = 16;
const HEX_ROWS = 8;

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; freqIndex: number;
  _burstAngle: number; _burstTime: number;
}

export default function AudioVisualizer({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const particlesRef = useRef<Particle[]>([]);
  const frequencyDataRef = useRef(new Uint8Array(FFT_SIZE / 2));
  const timeDataRef = useRef(new Uint8Array(FFT_SIZE));

  const [mode, setMode] = useState<VizMode>("bar");
  const [audioSource, setAudioSource] = useState<"idle" | "mic" | "file" | "demo">("idle");
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
  }, []);

  const stopCurrentSource = useCallback(() => {
    if (sourceRef.current) {
      try { (sourceRef.current as AudioNode).disconnect(); } catch {}
      sourceRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  const startMic = useCallback(async () => {
    initAudio();
    if (!audioCtxRef.current || !analyserRef.current) return;
    stopCurrentSource();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      sourceRef.current = source;
      setAudioSource("mic");
    } catch {
      console.warn("Microphone access denied");
    }
  }, [initAudio, stopCurrentSource]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    initAudio();
    if (!audioCtxRef.current || !analyserRef.current) return;
    stopCurrentSource();
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
      source.start();
      sourceRef.current = source;
      setAudioSource("file");
    } catch (err) {
      console.warn("Failed to decode audio file", err);
    }
  }, [initAudio, stopCurrentSource]);

  const startDemo = useCallback(async () => {
    initAudio();
    if (!audioCtxRef.current || !analyserRef.current) return;
    stopCurrentSource();
    try {
      const res = await fetch("/audio/love.mp3");
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
      source.start();
      sourceRef.current = source;
      setAudioSource("demo");
    } catch (err) {
      console.warn("Failed to load demo audio", err);
    }
  }, [initAudio, stopCurrentSource]);

  const stopAudio = useCallback(() => {
    stopCurrentSource();
    try { analyserRef.current?.disconnect(); } catch {}
    setAudioSource("idle");
  }, [stopCurrentSource]);

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    initAudio();
    try {
      const stream = canvas.captureStream(30);
      streamRef.current = stream;
      if (audioCtxRef.current && analyserRef.current) {
        const dest = audioCtxRef.current.createMediaStreamDestination();
        analyserRef.current.connect(dest);
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      }
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audio-visualizer-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      console.warn("Recording not supported", err);
    }
  }, [initAudio]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    try { analyserRef.current?.disconnect(); } catch {}
    setRecording(false);
  }, []);

  // Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 600),
    });

    const resize = () => {
      const { w, h } = getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    // Initialize particles
    const pArr = particlesRef.current;
    pArr.length = 0;
    const { w: initW, h: initH } = getSize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pArr.push({
        x: Math.random() * initW, y: Math.random() * initH,
        vx: 0, vy: 0,
        life: 0, maxLife: 60 + Math.random() * 120,
        size: 2 + Math.random() * 4, freqIndex: Math.floor(Math.random() * 32),
        _burstAngle: Math.random() * Math.PI * 2,
        _burstTime: 0,
      });
    }

    // ---- Draw functions (closures over refs) ----

    function drawBars(freq: Uint8Array, w: number, h: number) {
      const barCount = freq.length;
      const barW = w / barCount;
      let maxVal = 0;
      for (let i = 0; i < barCount; i++) {
        if (freq[i] > maxVal) maxVal = freq[i];
      }
      const hasAudio = maxVal > 0;
      if (!hasAudio) return;
      for (let i = 0; i < barCount; i++) {
        const norm = freq[i] / maxVal;
        const boost = (i / barCount) * 0.35;
        const val = Math.min(norm + boost, 1);
        const barH = Math.max(val * h * 0.9, 2);
        const x = i * barW;
        const y = h - barH;
        const hue = 40 + (i / barCount) * 40;
        ctx.fillStyle = `hsla(${hue}, 100%, ${55 + val * 25}%, ${0.5 + val * 0.5})`;
        ctx.fillRect(x, y, Math.max(barW, 1), barH);
      }
    }

    function drawRing(freq: Uint8Array, cx: number, cy: number) {
      const count = Math.min(freq.length, 64);
      const maxR = Math.min(cx, cy) * 0.7;
      const minR = maxR * 0.3;
      for (let i = 0; i < count; i++) {
        const val = freq[i] / 255;
        const angle = (i / count) * Math.PI * 2;
        const r = minR + val * (maxR - minR);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        const hue = 40 + (i / count) * 50;
        ctx.beginPath();
        ctx.arc(x, y, 2 + val * 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, ${60 + val * 30}%, ${0.6 + val * 0.4})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
      ctx.fill();
    }

    function drawWave(time: Uint8Array, w: number, h: number) {
      const len = time.length;
      const step = w / len;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let i = 0; i < len; i++) {
        const val = (time[i] - 128) / 128;
        const x = i * step;
        const y = h / 2 + val * (h * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let i = 0; i < len; i++) {
        const val = (time[i] - 128) / 128;
        const x = i * step;
        const y = h / 2 + val * (h * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h / 2);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(245, 158, 11, 0.2)");
      grad.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function drawParticles(freq: Uint8Array, w: number, h: number, cx: number, cy: number) {
      for (let i = 0; i < pArr.length; i++) {
        const p = pArr[i];
        const energy = freq[p.freqIndex] / 255;

        if (energy > 0.3) {
          const angle = p._burstAngle + (Math.random() - 0.5) * 0.5;
          const force = energy * 5;
          p.vx += Math.cos(angle) * force;
          p.vy += Math.sin(angle) * force;
          p._burstTime = 0;
        } else {
          p._burstTime = (p._burstTime || 0) + 1;
          if (p._burstTime > 120) {
            p._burstAngle = Math.random() * Math.PI * 2;
            p._burstTime = 0;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;

        p.life++;
        if (p.life > p.maxLife || p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50) {
          p.x = cx + (Math.random() - 0.5) * 40;
          p.y = cy + (Math.random() - 0.5) * 40;
          p.vx = 0;
          p.vy = 0;
          p.life = 0;
          p.maxLife = 60 + Math.random() * 120;
          p.freqIndex = Math.floor(Math.random() * 32);
          p._burstAngle = Math.random() * Math.PI * 2;
          p._burstTime = 0;
        }

        const alpha = 1 - p.life / p.maxLife;
        const hue = 40 + (p.freqIndex / 32) * 40;
        const s = p.size * (0.5 + energy * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha * (0.5 + energy * 0.5)})`;
        ctx.fill();
      }
    }

    function drawHexGrid(freq: Uint8Array, w: number, h: number) {
      const hexR = Math.max(Math.min(w / HEX_COLS, h / HEX_ROWS) * 0.45, 3);
      const spacingX = hexR * 1.8;
      const spacingY = hexR * 1.6;
      const offsetX = (w - (HEX_COLS - 1) * spacingX) / 2;
      const offsetY = (h - (HEX_ROWS - 1) * spacingY) / 2;

      for (let row = 0; row < HEX_ROWS; row++) {
        for (let col = 0; col < HEX_COLS; col++) {
          const idx = (row * HEX_COLS + col) % freq.length;
          const val = freq[idx] / 255;
          const x = offsetX + col * spacingX + (row % 2) * spacingX / 2;
          const y = offsetY + row * spacingY;
          const r = hexR * (0.3 + val * 0.7);
          const hue = 40 + (idx / freq.length) * 40;

          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = x + Math.cos(angle) * r;
            const hy = y + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fillStyle = `hsla(${hue}, 100%, ${50 + val * 30}%, ${0.3 + val * 0.5})`;
          ctx.fill();
          ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${0.2 + val * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    const draw = () => {
      if (!runningRef.current) return;
      const { w, h } = getSize();
      const freq = frequencyDataRef.current;
      const time = timeDataRef.current;
      const analyser = analyserRef.current;

      if (analyser) {
        analyser.getByteFrequencyData(freq);
        analyser.getByteTimeDomainData(time);
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;

      switch (mode) {
        case "bar": drawBars(freq, w, h); break;
        case "ring": drawRing(freq, centerX, centerY); break;
        case "wave": drawWave(time, w, h); break;
        case "particle": drawParticles(freq, w, h, centerX, centerY); break;
        case "hex": drawHexGrid(freq, w, h); break;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [mode, compact]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stopAudio]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {!compact && (
        <>
          <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 items-center">
            <ModeButton mode={mode} setMode={setMode} />

            <div className="flex gap-1 ml-2">
              <button
                onClick={startDemo}
                disabled={audioSource === "demo"}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  audioSource === "demo"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                }`}
              >
                {audioSource === "demo" ? "love.mp3" : "Demo"}
              </button>

              <button
                onClick={startMic}
                disabled={audioSource === "mic"}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  audioSource === "mic"
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                }`}
              >
                {audioSource === "mic" ? "Mic Live" : "Mic"}
              </button>

              <label className="px-2.5 py-1 text-xs rounded-lg border border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30 bg-[#ffffff08] transition-all cursor-pointer">
                File
                <input type="file" accept=".mp3,.wav,.ogg,.m4a,.aac" onChange={handleFileUpload} className="hidden" />
              </label>

              {audioSource !== "idle" && (
                <button
                  onClick={stopAudio}
                  className="px-2.5 py-1 text-xs rounded-lg border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
                >
                  Stop
                </button>
              )}
            </div>

            <div className="ml-auto flex gap-1">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  recording
                    ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse"
                    : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                }`}
                disabled={audioSource === "idle"}
              >
                {recording ? "■ Stop" : "● Record"}
              </button>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              audioSource === "idle" ? "bg-[#a0a0b0]/30" :
              audioSource === "mic" ? "bg-green-400 animate-pulse" : "bg-amber-400"
            }`} />
            <span className="text-[10px] text-[#a0a0b0] font-mono">
              {audioSource === "idle" ? "No source — Demo, Mic, or File" :
               audioSource === "mic" ? "Live Microphone" :
               audioSource === "demo" ? "love.mp3" : "Uploaded Audio"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function ModeButton({ mode, setMode }: { mode: VizMode; setMode: (m: VizMode) => void }) {
  const modes: { id: VizMode; label: string }[] = [
    { id: "bar", label: "Bars" },
    { id: "ring", label: "Ring" },
    { id: "wave", label: "Wave" },
    { id: "particle", label: "Particles" },
    { id: "hex", label: "Hex Grid" },
  ];

  return (
    <div className="flex gap-1">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
            mode === m.id
              ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
              : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
