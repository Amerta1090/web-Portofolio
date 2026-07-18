import { useState, useRef, useEffect, useCallback } from "react";

type Task = "xor" | "circle" | "spiral";

interface Point {
  x: number;
  y: number;
  label: number;
}

interface Particle {
  progress: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  speed: number;
  color: string;
  size: number;
  born: number;
}

interface NN {
  wIH: number[][];
  bH: number[];
  wHO: number[][];
  bO: number[];
  activations: number[];
  hiddenAct: number[];
  outputAct: number[];
  lossHistory: number[];
  step: number;
  particles: Particle[];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function sigmoidDeriv(sig: number): number {
  return sig * (1 - sig);
}

function generateXOR(): Point[] {
  const pts: Point[] = [];
  const noise = 0.15;
  for (let i = 0; i < 40; i++) {
    pts.push({ x: 0.2 + (Math.random() - 0.5) * noise, y: 0.2 + (Math.random() - 0.5) * noise, label: 0 });
    pts.push({ x: 0.8 + (Math.random() - 0.5) * noise, y: 0.2 + (Math.random() - 0.5) * noise, label: 1 });
    pts.push({ x: 0.2 + (Math.random() - 0.5) * noise, y: 0.8 + (Math.random() - 0.5) * noise, label: 1 });
    pts.push({ x: 0.8 + (Math.random() - 0.5) * noise, y: 0.8 + (Math.random() - 0.5) * noise, label: 0 });
  }
  return pts;
}

function generateCircle(): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.15;
    pts.push({ x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r, label: 1 });
  }
  for (let i = 0; i < 120; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.3 + Math.random() * 0.15;
    pts.push({ x: 0.5 + Math.cos(a) * r, y: 0.5 + Math.sin(a) * r, label: 0 });
  }
  return pts;
}

function generateSpiral(): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < 80; i++) {
    const t = i / 80;
    const r = t * 0.35 + 0.02;
    const a = t * 3 * Math.PI;
    pts.push({ x: 0.5 + Math.cos(a) * r + (Math.random() - 0.5) * 0.04, y: 0.5 + Math.sin(a) * r + (Math.random() - 0.5) * 0.04, label: 0 });
    pts.push({ x: 0.5 - Math.cos(a) * r + (Math.random() - 0.5) * 0.04, y: 0.5 - Math.sin(a) * r + (Math.random() - 0.5) * 0.04, label: 1 });
  }
  return pts;
}

function generateData(task: Task): Point[] {
  if (task === "circle") return generateCircle();
  if (task === "spiral") return generateSpiral();
  return generateXOR();
}

function randInit(): number {
  return (Math.random() - 0.5) * 2;
}

function createNN(): NN {
  return {
    wIH: Array.from({ length: 6 }, () => [randInit(), randInit()]),
    bH: Array.from({ length: 6 }, () => randInit()),
    wHO: Array.from({ length: 1 }, () => Array.from({ length: 6 }, () => randInit())),
    bO: [randInit()],
    activations: [0, 0],
    hiddenAct: Array(6).fill(0),
    outputAct: [0],
    lossHistory: [],
    step: 0,
    particles: [],
  };
}

function forward(nn: NN, x: number, y: number): number {
  nn.activations = [x, y];
  for (let j = 0; j < 6; j++) {
    let sum = nn.bH[j];
    for (let i = 0; i < 2; i++) sum += nn.wIH[j][i] * (i === 0 ? x : y);
    nn.hiddenAct[j] = sigmoid(sum);
  }
  let oSum = nn.bO[0];
  for (let j = 0; j < 6; j++) oSum += nn.wHO[0][j] * nn.hiddenAct[j];
  nn.outputAct[0] = sigmoid(oSum);
  return nn.outputAct[0];
}

function backward(nn: NN, x: number, y: number, target: number, lr: number): number {
  const out = forward(nn, x, y);
  const error = out - target;
  const loss = 0.5 * error * error;

  const dOut = error * sigmoidDeriv(out);
  const wHOd = Array(6).fill(0);
  for (let j = 0; j < 6; j++) wHOd[j] = dOut * nn.hiddenAct[j];
  const bOd = dOut;

  const dHid = Array(6).fill(0);
  for (let j = 0; j < 6; j++) {
    dHid[j] = wHOd[j] * sigmoidDeriv(nn.hiddenAct[j]);
  }

  for (let j = 0; j < 6; j++) {
    nn.wHO[0][j] -= lr * wHOd[j];
    for (let i = 0; i < 2; i++) {
      nn.wIH[j][i] -= lr * dHid[j] * (i === 0 ? x : y);
    }
    nn.bH[j] -= lr * dHid[j];
  }
  nn.bO[0] -= lr * bOd;

  return loss;
}

function spawnParticles(nn: NN, w: number, h: number) {
  const inputPos = getInputPos(w, h);
  const hiddenPos = getHiddenPos(w, h);
  const outputPos = getOutputPos(w, h);

  for (let j = 0; j < 6; j++) {
    const act = Math.abs(nn.hiddenAct[j]);
    const count = Math.ceil(act * 3);
    for (let k = 0; k < count; k++) {
      const wVal = nn.wIH[j][0] * nn.activations[0] + nn.wIH[j][1] * nn.activations[1];
      const hue = wVal > 0 ? 140 : 0;
      const brightness = 40 + Math.min(act * 60, 60);
      nn.particles.push({
        progress: 0,
        fromX: inputPos[0][0], fromY: inputPos[0][1],
        toX: hiddenPos[j][0], toY: hiddenPos[j][1],
        speed: 0.02 + act * 0.03,
        color: `hsl(${hue}, 90%, ${brightness}%)`,
        size: 1.5 + act * 2,
        born: nn.step,
      });
    }
  }

  for (let j = 0; j < 6; j++) {
    const act = Math.abs(nn.hiddenAct[j]) * Math.abs(nn.outputAct[0]);
    const count = Math.ceil(act * 2);
    for (let k = 0; k < count; k++) {
      const wVal = nn.wHO[0][j] * nn.hiddenAct[j];
      const hue = wVal > 0 ? 140 : 0;
      const brightness = 40 + Math.min(act * 60, 60);
      nn.particles.push({
        progress: 0,
        fromX: hiddenPos[j][0], fromY: hiddenPos[j][1],
        toX: outputPos[0][0], toY: outputPos[0][1],
        speed: 0.02 + act * 0.03,
        color: `hsl(${hue}, 90%, ${brightness}%)`,
        size: 1.5 + act * 2,
        born: nn.step,
      });
    }
  }

  if (nn.particles.length > 600) nn.particles.splice(0, nn.particles.length - 600);
}

function getInputPos(w: number, h: number): [number, number][] {
  const cx = w * 0.12;
  const cy = h * 0.5;
  return [[cx, cy - h * 0.08], [cx, cy + h * 0.08]];
}

function getHiddenPos(w: number, h: number): [number, number][] {
  const cx = w * 0.42;
  const spacing = h * 0.09;
  const startY = h * 0.5 - spacing * 2.5;
  return Array.from({ length: 6 }, (_, i) => [cx, startY + i * spacing]);
}

function getOutputPos(w: number, h: number): [number, number][] {
  return [[w * 0.72, h * 0.5]];
}

function weightColor(w: number): string {
  const t = Math.min(Math.abs(w) / 4, 1);
  if (w > 0) return `rgba(34,${Math.round(197 - t * 80)},94,${0.4 + t * 0.6})`;
  if (w < 0) return `rgba(${Math.round(239 - t * 60)},68,68,${0.4 + t * 0.6})`;
  return `rgba(255,255,255,0.3)`;
}

function activationColor(v: number): string {
  const t = Math.min(Math.max(v, 0), 1);
  const r = Math.round(15 + t * 230);
  const g = Math.round(15 + t * 158);
  const b = Math.round(17 + t * 59);
  return `rgb(${r},${g},${b})`;
}

function drawNeuron(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  activation: number,
  radius: number,
  bias: number,
) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  const col = activationColor(activation);
  grad.addColorStop(0, col);
  grad.addColorStop(1, "rgba(15,15,17,0.9)");

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  const glow = Math.abs(bias) * 2;
  if (glow > 0.5) {
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = bias > 0 ? `rgba(34,197,94,${Math.min(glow * 0.3, 0.7)})` : `rgba(239,68,68,${Math.min(glow * 0.3, 0.7)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawConnection(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  weight: number,
  pulse: number,
) {
  const col = weightColor(weight);
  const baseThick = 0.5 + Math.min(Math.abs(weight) / 3, 2.5);
  const thick = baseThick + pulse * 0.8;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = col;
  ctx.lineWidth = thick;
  ctx.stroke();

  if (pulse > 0.2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = col.replace(/[\d.]+\)$/, `${pulse * 0.4})`);
    ctx.lineWidth = thick + 2;
    ctx.stroke();
  }
}

function drawLossCurve(
  ctx: CanvasRenderingContext2D,
  history: number[],
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = "rgba(15,15,17,0.85)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "9px monospace";
  ctx.fillText("Loss", x + 4, y + 10);

  if (history.length < 2) return;

  const last200 = history.slice(-200);
  const maxLoss = Math.max(...last200, 0.01);

  ctx.beginPath();
  ctx.moveTo(x + 4, y + h - 6);
  for (let i = 0; i < last200.length; i++) {
    const px = x + 4 + (i / (last200.length - 1)) * (w - 8);
    const py = y + h - 6 - (last200[i] / maxLoss) * (h - 18);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  const latest = last200[last200.length - 1];
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 9px monospace";
  ctx.fillText(latest.toFixed(4), x + 4, y + h - 2);
}

function drawWeightHeatmap(
  ctx: CanvasRenderingContext2D,
  nn: NN,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = "rgba(15,15,17,0.85)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "9px monospace";
  ctx.fillText("Weights", x + 4, y + 10);

  const cellW = (w - 8) / 6;
  const cellH = (h - 16) / 2;
  const startY = y + 14;

  for (let j = 0; j < 6; j++) {
    const wi = nn.wIH[j][0];
    const t = Math.min(Math.abs(wi) / 4, 1);
    ctx.fillStyle = wi > 0 ? `rgba(34,197,94,${t})` : `rgba(239,68,68,${t})`;
    ctx.fillRect(x + 4 + j * cellW, startY, cellW - 1, cellH - 1);
  }

  for (let j = 0; j < 6; j++) {
    const wi = nn.wHO[0][j];
    const t = Math.min(Math.abs(wi) / 4, 1);
    ctx.fillStyle = wi > 0 ? `rgba(34,197,94,${t})` : `rgba(239,68,68,${t})`;
    ctx.fillRect(x + 4 + j * cellW, startY + cellH, cellW - 1, cellH - 1);
  }
}

function drawDataScatter(
  ctx: CanvasRenderingContext2D,
  data: Point[],
  x: number,
  y: number,
  w: number,
  h: number,
  nn: NN,
) {
  ctx.fillStyle = "rgba(15,15,17,0.85)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "9px monospace";
  ctx.fillText("Data", x + 4, y + 10);

  const plotX = x + 6;
  const plotY = y + 16;
  const plotW = w - 12;
  const plotH = h - 22;

  const res = 16;
  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const dx = i / res;
      const dy = j / res;
      const pred = forward(nn, dx, dy);
      const g = Math.round(pred * 200);
      const r = Math.round((1 - pred) * 200);
      ctx.fillStyle = `rgba(${r},${g},80,0.15)`;
      ctx.fillRect(plotX + (i / res) * plotW, plotY + (j / res) * plotH, plotW / res + 1, plotH / res + 1);
    }
  }

  for (const pt of data) {
    const px = plotX + pt.x * plotW;
    const py = plotY + pt.y * plotH;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fillStyle = pt.label === 1 ? "#22c55e" : "#ef4444";
    ctx.fill();
  }
}

export default function NeuralNetworkArt({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [task, setTask] = useState<Task>("xor");
  const [stepsPerFrame, setStepsPerFrame] = useState(2);
  const [paused, setPaused] = useState(false);
  const [learningRate] = useState(0.5);

  const nnRef = useRef(createNN());
  const dataRef = useRef(generateXOR());
  const taskRef = useRef<Task>("xor");
  const pausedRef = useRef(false);
  const stepsRef = useRef(2);
  const timeRef = useRef(0);

  useEffect(() => { taskRef.current = task; }, [task]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { stepsRef.current = stepsPerFrame; }, [stepsPerFrame]);

  const reset = useCallback(() => {
    nnRef.current = createNN();
    dataRef.current = generateData(taskRef.current);
    timeRef.current = 0;
  }, []);

  useEffect(() => {
    dataRef.current = generateData(task);
    nnRef.current = createNN();
  }, [task]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const loop = () => {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(loop);

      timeRef.current += 0.016;

      const nn = nnRef.current;
      const data = dataRef.current;

      if (!pausedRef.current) {
        const steps = stepsRef.current;
        let totalLoss = 0;
        for (let s = 0; s < steps; s++) {
          const idx = Math.floor(Math.random() * data.length);
          const pt = data[idx];
          totalLoss += backward(nn, pt.x, pt.y, pt.label, learningRate);
          nn.step++;
        }
        const avgLoss = totalLoss / steps;
        if (nn.lossHistory.length > 500) nn.lossHistory.shift();
        nn.lossHistory.push(avgLoss);
        spawnParticles(nn, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
      }

      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      ctx.clearRect(0, 0, w, h);

      const inputPos = getInputPos(w, h);
      const hiddenPos = getHiddenPos(w, h);
      const outputPos = getOutputPos(w, h);

      const inputRadius = compact ? 8 : Math.min(w * 0.015, 12);
      const hiddenRadius = compact ? 7 : Math.min(w * 0.013, 10);
      const outputRadius = compact ? 9 : Math.min(w * 0.017, 14);

      const activeCount: number[] = Array(6).fill(0);
      let outputActive = 0;

      for (const p of nn.particles) {
        p.progress += p.speed;
      }
      nn.particles = nn.particles.filter(p => p.progress < 1.2);

      for (const p of nn.particles) {
        if (p.progress > 1) continue;
        const t = p.progress;
        const px = p.fromX + (p.toX - p.fromX) * t;
        const py = p.fromY + (p.toY - p.fromY) * t;
        const alpha = t < 0.5 ? t * 2 : Math.max(0, 1 - (t - 0.5) * 2);
        const glow = alpha * 0.6;

        ctx.beginPath();
        ctx.arc(px, py, p.size + 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `,${glow * 0.3})`).replace("hsl(", "hsla(");
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const t = timeRef.current;
      for (let j = 0; j < 6; j++) {
        const [x1, y1] = inputPos[0];
        const [x2, y2] = hiddenPos[j];
        const pulse = (Math.sin(t * 3 + j) + 1) * 0.15;
        drawConnection(ctx, x1, y1, x2, y2, nn.wIH[j][0] * nn.activations[0], pulse);
        const [x3, y3] = inputPos[1];
        drawConnection(ctx, x3, y3, x2, y2, nn.wIH[j][1] * nn.activations[1], pulse);
      }

      for (let j = 0; j < 6; j++) {
        const [x1, y1] = hiddenPos[j];
        const [x2, y2] = outputPos[0];
        const pulse = (Math.sin(t * 3 + j + 1.5) + 1) * 0.15;
        drawConnection(ctx, x1, y1, x2, y2, nn.wHO[0][j] * nn.hiddenAct[j], pulse);
      }

      for (let i = 0; i < 2; i++) {
        drawNeuron(ctx, inputPos[i][0], inputPos[i][1], nn.activations[i], inputRadius, 0);
      }

      for (let j = 0; j < 6; j++) {
        drawNeuron(ctx, hiddenPos[j][0], hiddenPos[j][1], nn.hiddenAct[j], hiddenRadius, nn.bH[j]);
      }

      drawNeuron(ctx, outputPos[0][0], outputPos[0][1], nn.outputAct[0], outputRadius, nn.bO[0]);

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `${compact ? 8 : 10}px monospace`;
      ctx.fillText("Input", inputPos[0][0] - 12, inputPos[0][1] - inputRadius - 8);
      ctx.fillText("Hidden", hiddenPos[0][0] - 14, hiddenPos[0][1] - hiddenRadius - 8);
      ctx.fillText("Output", outputPos[0][0] - 15, outputPos[0][1] - outputRadius - 8);

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = `${compact ? 7 : 8}px monospace`;
      for (let i = 0; i < 2; i++) {
        ctx.fillText(nn.activations[i].toFixed(2), inputPos[i][0] - 10, inputPos[i][1] + inputRadius + 12);
      }
      for (let j = 0; j < 6; j++) {
        ctx.fillText(nn.hiddenAct[j].toFixed(2), hiddenPos[j][0] - 10, hiddenPos[j][1] + hiddenRadius + 12);
      }
      ctx.fillText(nn.outputAct[0].toFixed(2), outputPos[0][0] - 10, outputPos[0][1] + outputRadius + 12);

      if (!compact) {
        const panelW = Math.min(w * 0.18, 140);
        const panelH = panelW * 0.6;
        drawLossCurve(ctx, nn.lossHistory, w - panelW - 12, 10, panelW, panelH);
        drawWeightHeatmap(ctx, nn, w - panelW - 12, panelH + 18, panelW, panelH);
        drawDataScatter(ctx, data, 12, h - panelH - 18, panelW, panelH, nn);

        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.font = "10px monospace";
        ctx.fillText(`Step: ${nn.step}`, 14, 22);
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [learningRate, compact]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0f0f11] relative overflow-hidden flex flex-col"
    >
      <canvas ref={canvasRef} className="w-full flex-1" />

      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center gap-3 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/90 to-transparent">
          <button
            onClick={() => setPaused(p => !p)}
            className="px-3 py-1.5 text-xs font-mono rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>

          <button
            onClick={reset}
            className="px-3 py-1.5 text-xs font-mono rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            ↻ Reset
          </button>

          <div className="flex items-center gap-2 ml-2">
            <label className="text-[10px] text-white/50 font-mono whitespace-nowrap">
              Speed
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={stepsPerFrame}
              onChange={e => setStepsPerFrame(Number(e.target.value))}
              className="w-20 accent-amber-500"
            />
            <span className="text-[10px] text-amber-400 font-mono w-4">{stepsPerFrame}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {(["xor", "circle", "spiral"] as Task[]).map(t => (
              <button
                key={t}
                onClick={() => setTask(t)}
                className={`px-2.5 py-1 text-[10px] font-mono rounded transition-colors ${
                  task === t
                    ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
