import { useRef, useEffect, useState, useCallback } from "react";

type GateType = "H" | "X" | "Y" | "Z" | "CNOT" | "S" | "T" | "RX" | "RY";

type Complex = { re: number; im: number };

interface Cell {
  gate: GateType;
  qubit: number;
  col: number;
  isTarget?: boolean;
}

interface BlochState {
  theta: number;
  phi: number;
}

const QUBITS = 3;
const COLS = 8;
const SQRT2_INV = 1 / Math.sqrt(2);

function cx(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function cabs2(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

function zeros(n: number): Complex[] {
  return Array.from({ length: n }, () => ({ re: 0, im: 0 }));
}

const GATES: GateType[] = ["H", "X", "Y", "Z", "CNOT", "S", "T", "RX", "RY"];

const PRESETS: Record<string, { label: string; cells: Cell[] }> = {
  bell: {
    label: "Bell State",
    cells: [
      { gate: "H", qubit: 0, col: 0 },
      { gate: "CNOT", qubit: 0, col: 1 },
      { gate: "CNOT", qubit: 1, col: 1, isTarget: true },
    ],
  },
  ghz: {
    label: "GHZ State",
    cells: [
      { gate: "H", qubit: 0, col: 0 },
      { gate: "CNOT", qubit: 0, col: 1 },
      { gate: "CNOT", qubit: 1, col: 1, isTarget: true },
      { gate: "CNOT", qubit: 1, col: 2 },
      { gate: "CNOT", qubit: 2, col: 2, isTarget: true },
    ],
  },
  teleport: {
    label: "Teleportation",
    cells: [
      { gate: "H", qubit: 0, col: 0 },
      { gate: "CNOT", qubit: 0, col: 1 },
      { gate: "CNOT", qubit: 1, col: 1, isTarget: true },
      { gate: "H", qubit: 0, col: 2 },
      { gate: "CNOT", qubit: 1, col: 3 },
      { gate: "CNOT", qubit: 2, col: 3, isTarget: true },
    ],
  },
};

function applySingleQubit(
  state: Complex[],
  gate: GateType,
  target: number,
  angle: number
): Complex[] {
  const n = state.length;
  const numQ = Math.log2(n);
  const out = zeros(n);
  const cosA = Math.cos(angle / 2);
  const sinA = Math.sin(angle / 2);

  for (let i = 0; i < n; i++) {
    const bit = (i >> (numQ - 1 - target)) & 1;
    const partner = i ^ (1 << (numQ - 1 - target));
    if (bit === 0) {
      switch (gate) {
        case "H":
          out[i] = cadd(out[i], cx({ re: SQRT2_INV, im: 0 }, state[i]));
          out[partner] = cadd(out[partner], cx({ re: SQRT2_INV, im: 0 }, state[i]));
          break;
        case "X":
          out[partner] = cadd(out[partner], state[i]);
          break;
        case "Y":
          out[partner] = cadd(out[partner], cx({ re: 0, im: -1 }, state[i]));
          break;
        case "Z":
          out[i] = cadd(out[i], state[i]);
          break;
        case "S":
          out[i] = cadd(out[i], state[i]);
          break;
        case "T":
          out[i] = cadd(out[i], state[i]);
          break;
        case "RX":
          out[i] = cadd(out[i], cx({ re: cosA, im: 0 }, state[i]));
          out[partner] = cadd(out[partner], cx({ re: 0, im: -sinA }, state[i]));
          break;
        case "RY":
          out[i] = cadd(out[i], cx({ re: cosA, im: 0 }, state[i]));
          out[partner] = cadd(out[partner], cx({ re: sinA, im: 0 }, state[i]));
          break;
        default:
          out[i] = cadd(out[i], state[i]);
      }
    } else {
      switch (gate) {
        case "H":
          out[i] = cadd(out[i], cx({ re: SQRT2_INV, im: 0 }, state[i]));
          out[partner] = cadd(out[partner], cx({ re: -SQRT2_INV, im: 0 }, state[i]));
          break;
        case "X":
          out[partner] = cadd(out[partner], state[i]);
          break;
        case "Y":
          out[partner] = cadd(out[partner], cx({ re: 0, im: 1 }, state[i]));
          break;
        case "Z":
          out[i] = cadd(out[i], cx({ re: -1, im: 0 }, state[i]));
          break;
        case "S":
          out[i] = cadd(out[i], cx({ re: 0, im: 1 }, state[i]));
          break;
        case "T": {
          const p = Math.PI / 4;
          out[i] = cadd(out[i], cx({ re: Math.cos(p), im: Math.sin(p) }, state[i]));
          break;
        }
        case "RX":
          out[i] = cadd(out[i], cx({ re: cosA, im: 0 }, state[i]));
          out[partner] = cadd(out[partner], cx({ re: 0, im: sinA }, state[i]));
          break;
        case "RY":
          out[i] = cadd(out[i], cx({ re: cosA, im: 0 }, state[i]));
          out[partner] = cadd(out[partner], cx({ re: -sinA, im: 0 }, state[i]));
          break;
        default:
          out[i] = cadd(out[i], state[i]);
      }
    }
  }
  return out;
}

function applyCNOT(
  state: Complex[],
  control: number,
  target: number
): Complex[] {
  const n = state.length;
  const numQ = Math.log2(n);
  const out = zeros(n);
  for (let i = 0; i < n; i++) {
    const ctrlBit = (i >> (numQ - 1 - control)) & 1;
    if (ctrlBit === 1) {
      const flipped = i ^ (1 << (numQ - 1 - target));
      out[flipped] = state[i];
    } else {
      out[i] = cadd(out[i], state[i]);
    }
  }
  return out;
}

function runCircuit(cells: Cell[], angle: number): Complex[] {
  let state = zeros(8);
  state[0] = { re: 1, im: 0 };

  const colGroups = new Map<number, Cell[]>();
  for (const c of cells) {
    if (c.isTarget) continue;
    const existing = colGroups.get(c.col) || [];
    existing.push(c);
    colGroups.set(c.col, existing);
  }

  const sortedCols = Array.from(colGroups.keys()).sort((a, b) => a - b);

  for (const col of sortedCols) {
    const group = colGroups.get(col)!;
    for (const cell of group) {
      if (cell.gate === "CNOT") {
        const targetCell = cells.find(
          (c) => c.isTarget && c.col === cell.col && c.qubit !== cell.qubit
        );
        if (targetCell) {
          const ctrl = Math.min(cell.qubit, targetCell.qubit);
          const tgt = Math.max(cell.qubit, targetCell.qubit);
          state = applyCNOT(state, ctrl, tgt);
        }
      } else {
        state = applySingleQubit(state, cell.gate, cell.qubit, angle);
      }
    }
  }
  return state;
}

function stateToBloch(state: Complex[], qubit: number): BlochState {
  const numQ = 3;
  let r00 = 0;
  let r11 = 0;
  let re01 = 0;
  let im01 = 0;

  for (let i = 0; i < 8; i++) {
    const bit = (i >> (numQ - 1 - qubit)) & 1;
    for (let j = 0; j < 8; j++) {
      const bit2 = (j >> (numQ - 1 - qubit)) & 1;
      if (bit === 0 && bit2 === 0) {
        const partnerJ = j | (1 << (numQ - 1 - qubit));
        r00 += state[i].re * state[partnerJ].re + state[i].im * state[partnerJ].im;
      }
      if (bit === 1 && bit2 === 1) {
        const partnerJ = j & ~(1 << (numQ - 1 - qubit));
        r11 += state[i].re * state[partnerJ].re + state[i].im * state[partnerJ].im;
      }
    }
  }

  const prob0 = Math.max(0, r00);
  const prob1 = Math.max(0, r11);
  const norm = prob0 + prob1;

  let blochX = 0;
  let blochY = 0;
  let blochZ = prob0 - prob1;

  for (let i = 0; i < 8; i++) {
    const bit = (i >> (numQ - 1 - qubit)) & 1;
    const partner = i ^ (1 << (numQ - 1 - qubit));
    if (bit === 0 && partner > i) {
      re01 += state[i].re * state[partner].re + state[i].im * state[partner].im;
      im01 += state[i].re * state[partner].im - state[i].im * state[partner].re;
    }
  }
  blochX = 2 * re01;
  blochY = 2 * im01;

  if (norm > 1e-10) {
    blochX /= norm;
    blochY /= norm;
    blochZ /= norm;
  }

  const theta = Math.acos(Math.min(1, Math.max(-1, blochZ)));
  const phi = Math.atan2(blochY, blochX);

  return {
    theta: isNaN(theta) ? 0 : theta,
    phi: isNaN(phi) ? 0 : phi,
  };
}

function getProbs(state: Complex[]): number[] {
  return state.map((a) => cabs2(a));
}

function ketLabel(i: number): string {
  return `|${i.toString(2).padStart(3, "0")}⟩`;
}

function drawBlochSphere(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  bloch: BlochState,
  time: number
) {
  const rotY = time * 0.3;

  function project(x: number, y: number, z: number): [number, number] {
    const rx = x * Math.cos(rotY) + z * Math.sin(rotY);
    const rz = -x * Math.sin(rotY) + z * Math.cos(rotY);
    return [cx + rx * r, cy - y * r];
  }

  ctx.strokeStyle = "#2a2a3a";
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const [px, py] = project(Math.cos(a), 0, Math.sin(a));
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const [px, py] = project(0, Math.cos(a), Math.sin(a));
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const [px, py] = project(Math.cos(a), Math.sin(a), 0);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.strokeStyle = "#3a3a4a";
  ctx.lineWidth = 0.5;
  for (let lat = -2; lat <= 2; lat++) {
    if (lat === 0) continue;
    const y = lat / 3;
    const lr = Math.sqrt(1 - y * y);
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const [px, py] = project(lr * Math.cos(a), y, lr * Math.sin(a));
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  const sx = Math.sin(bloch.theta) * Math.cos(bloch.phi);
  const sy = Math.cos(bloch.theta);
  const sz = Math.sin(bloch.theta) * Math.sin(bloch.phi);
  const [vx, vy] = project(sx, sy, sz);

  ctx.strokeStyle = "rgba(245,158,11,0.25)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(vx, cy);
  ctx.lineTo(vx, vy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(vx, vy);
  ctx.stroke();

  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.arc(vx, vy, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#888";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  const [xLx, xLy] = project(1.2, 0, 0);
  ctx.fillText("X", xLx, xLy + 3);
  const [, yLy] = project(0, 1.2, 0);
  ctx.fillText("Y", cx, yLy + 3);
  const [, zLz] = project(0, 0, 1.2);
  ctx.fillText("Z", cx + 8, zLz + 3);

  ctx.fillStyle = "#666";
  ctx.font = "8px monospace";
  ctx.fillText("|0⟩", cx, cy - r - 5);
  ctx.fillText("|1⟩", cx, cy + r + 11);

  ctx.fillStyle = "#999";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  const thetaDeg = (bloch.theta * 180 / Math.PI).toFixed(1);
  const phiDeg = (bloch.phi * 180 / Math.PI).toFixed(1);
  ctx.fillText(`θ ${thetaDeg}°  φ ${phiDeg}°`, cx - r, cy + r + 22);
}

function drawProbBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  probs: number[]
) {
  const barH = Math.min(20, (h - 10) / probs.length);
  const labelW = 48;
  const barMaxW = w - labelW - 45;

  for (let i = 0; i < probs.length; i++) {
    const by = y + 4 + i * barH;
    const bw = probs[i] * barMaxW;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(labelW, by + 2, barMaxW, barH - 4);

    if (bw > 0.5) {
      const grad = ctx.createLinearGradient(labelW, 0, labelW + bw, 0);
      grad.addColorStop(0, "#f59e0b");
      grad.addColorStop(1, "#d97706");
      ctx.fillStyle = grad;
      ctx.fillRect(labelW, by + 2, bw, barH - 4);
    }

    ctx.fillStyle = "#777";
    ctx.font = "8px monospace";
    ctx.textAlign = "right";
    ctx.fillText(ketLabel(i), labelW - 3, by + barH - 4);
    ctx.textAlign = "left";

    if (probs[i] > 0.005) {
      ctx.fillStyle = "#ccc";
      ctx.fillText(`${(probs[i] * 100).toFixed(1)}%`, labelW + bw + 3, by + barH - 4);
    }
  }
}

export default function QuantumCircuit({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const timeRef = useRef(0);

  const [cells, setCells] = useState<Cell[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateType | null>(null);
  const [resultState, setResultState] = useState<Complex[] | null>(null);
  const [angle, setAngle] = useState(Math.PI / 4);

  const cellsRef = useRef(cells);
  const angleRef = useRef(angle);
  const resultRef = useRef(resultState);
  useEffect(() => { cellsRef.current = cells; }, [cells]);
  useEffect(() => { angleRef.current = angle; }, [angle]);
  useEffect(() => { resultRef.current = resultState; }, [resultState]);

  const gridLayoutRef = useRef({ left: 0, top: 0, cellW: 0, cellH: 0 });

  const currentState = useCallback(() => {
    return resultRef.current || runCircuit(cellsRef.current, angleRef.current);
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || compact) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { left, top, cellW, cellH } = gridLayoutRef.current;

      const col = Math.floor((mx - left) / cellW);
      const qubit = Math.floor((my - top) / cellH);

      if (col < 0 || col >= COLS || qubit < 0 || qubit >= QUBITS) return;

      setCells((prev) => {
        const gate = selectedGateRef.current;
        if (!gate) return prev;

        const existingIdx = prev.findIndex(
          (c) => c.qubit === qubit && c.col === col && !c.isTarget
        );
        if (existingIdx >= 0) {
          const existing = prev[existingIdx];
          if (existing.gate === "CNOT") {
            return prev.filter(
              (c) =>
                !(c.col === col && (c.qubit === qubit || c.isTarget))
            );
          }
          return prev.filter(
            (_, idx) => idx !== existingIdx
          );
        }

        const cleaned = prev.filter(
          (c) => !(c.col === col && (c.qubit === qubit || (c.isTarget && Math.abs(c.qubit - qubit) <= 1)))
        );

        const newCells: Cell[] = [...cleaned, { gate, qubit, col }];
        if (gate === "CNOT") {
          const target = qubit < QUBITS - 1 ? qubit + 1 : qubit - 1;
          newCells.push({ gate: "CNOT", qubit: target, col, isTarget: true });
        }
        return newCells;
      });
      setResultState(null);
    },
    [compact]
  );

  const selectedGateRef = useRef(selectedGate);
  useEffect(() => { selectedGateRef.current = selectedGate; }, [selectedGate]);

  const handleRun = useCallback(() => {
    const state = runCircuit(cellsRef.current, angleRef.current);
    setResultState(state);
  }, []);

  const loadPreset = useCallback((key: string) => {
    const preset = PRESETS[key];
    if (preset) {
      setCells(preset.cells);
      setResultState(null);
    }
  }, []);

  const clearCircuit = useCallback(() => {
    setCells([]);
    setResultState(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let active = true;

    const render = () => {
      if (!active) return;
      timeRef.current += 0.016;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = compact ? 150 : rect.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      const state = currentState();
      const probs = getProbs(state);

      if (compact) {
        drawBlochSphere(ctx, w / 2, h / 2, Math.min(w, h) * 0.38, stateToBloch(state, 0), timeRef.current);
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const gridLeft = 30;
      const gridTop = 16;
      const cellW = Math.min(65, (w * 0.48) / COLS);
      const cellH = Math.min(55, (h * 0.35) / QUBITS);
      const gridW = cellW * COLS;
      const gridH = cellH * QUBITS;

      gridLayoutRef.current = { left: gridLeft, top: gridTop, cellW, cellH };

      ctx.strokeStyle = "#2a2a3a";
      ctx.lineWidth = 1;
      for (let q = 0; q < QUBITS; q++) {
        const y = gridTop + q * cellH + cellH / 2;
        ctx.beginPath();
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridLeft + gridW, y);
        ctx.stroke();

        ctx.fillStyle = "#555";
        ctx.font = "11px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(`q${q}`, gridLeft - 10, y);
      }

      for (let c = 0; c <= COLS; c++) {
        const x = gridLeft + c * cellW;
        ctx.strokeStyle = "#1e1e2e";
        ctx.beginPath();
        ctx.moveTo(x, gridTop - 4);
        ctx.lineTo(x, gridTop + gridH + 4);
        ctx.stroke();
      }

      for (const cell of cells) {
        if (cell.isTarget) continue;
        const x = gridLeft + cell.col * cellW + cellW / 2;
        const y = gridTop + cell.qubit * cellH + cellH / 2;

        if (cell.gate === "CNOT") {
          const targetCell = cells.find(
            (c) => c.isTarget && c.col === cell.col && c.qubit !== cell.qubit
          );
          if (targetCell) {
            const ty = gridTop + targetCell.qubit * cellH + cellH / 2;
            ctx.strokeStyle = "#f59e0b";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, ty);
            ctx.stroke();

            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(x, ty, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#0f0f11";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 8, ty);
            ctx.lineTo(x + 8, ty);
            ctx.moveTo(x, ty - 8);
            ctx.lineTo(x, ty + 8);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = "#16162a";
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x - 15, y - 15, 30, 30, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 12px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cell.gate, x, y + 1);
        }
      }

      const blochX = gridLeft + gridW + 30;
      const blochAreaW = w - blochX - 20;
      const blochR = Math.min(blochAreaW / 2, (gridH + 20) / 2, 85);
      let blochBottom = gridTop + gridH + 30;
      if (blochR > 20) {
        const blochCx = blochX + blochAreaW / 2;
        const blochCy = gridTop + 10;

        ctx.fillStyle = "#555";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Bloch (q0)", blochCx, blochCy);

        drawBlochSphere(ctx, blochCx, blochCy + blochR + 16, blochR, stateToBloch(state, 0), timeRef.current);
        blochBottom = Math.max(blochBottom, blochCy + blochR * 2 + 50);
      }

      const probY = blochBottom;
      const probH = h - probY - 8;
      if (probH > 40) {
        drawProbBars(ctx, gridLeft, probY, gridW + blochAreaW + 40, probH, probs);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [cells, resultState, compact, currentState]);

  if (compact) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0f0f11] text-white flex flex-col gap-3 p-4 overflow-auto">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] text-gray-600 uppercase tracking-widest mr-1">
          Gates
        </span>
        {GATES.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGate(selectedGate === g ? null : g)}
            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all select-none ${
              selectedGate === g
                ? "bg-amber-500 text-black shadow-[0_0_14px_rgba(245,158,11,0.5)]"
                : "bg-[#16162a] text-gray-400 hover:bg-[#1e1e38] hover:text-gray-200 border border-[#2a2a3a]"
            }`}
          >
            {g}
          </button>
        ))}

        <div className="w-px h-6 bg-[#2a2a3a] mx-1" />

        <button
          onClick={handleRun}
          disabled={cells.length === 0}
          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#1a1a2e] disabled:text-gray-600 text-sm font-semibold transition-colors"
        >
          ▶ Run
        </button>

        <button
          onClick={clearCircuit}
          className="px-3 py-1.5 rounded-lg bg-[#16162a] hover:bg-[#1e1e38] text-xs text-gray-500 border border-[#2a2a3a] transition-colors"
        >
          Clear
        </button>

        <div className="w-px h-6 bg-[#2a2a3a] mx-1" />

        {Object.entries(PRESETS).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => loadPreset(key)}
            className="px-3 py-1.5 rounded-lg bg-[#16162a] hover:bg-[#1e1e38] text-xs text-gray-400 border border-[#2a2a3a] transition-colors"
          >
            {label}
          </button>
        ))}

        {(selectedGate === "RX" || selectedGate === "RY") && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-gray-500">θ</span>
            <input
              type="range"
              min={0}
              max={Math.PI * 2}
              step={0.01}
              value={angle}
              onChange={(e) => setAngle(parseFloat(e.target.value))}
              className="w-24 accent-amber-500"
            />
            <span className="text-[10px] text-gray-500 w-10">
              {(angle * 180 / Math.PI).toFixed(0)}°
            </span>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-[320px] relative rounded-xl border border-[#1a1a2a] overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          onClick={handleCanvasClick}
          style={{ cursor: selectedGate ? "crosshair" : "default" }}
        />
      </div>

      {selectedGate && (
        <div className="text-[11px] text-gray-600 text-center">
          Click a grid cell to place{" "}
          <span className="text-amber-500 font-bold">{selectedGate}</span>.
          Click an existing gate to remove it.
          {selectedGate === "CNOT" && " Target auto-fills below."}
        </div>
      )}

      {resultState && (
        <div className="text-[11px] text-emerald-500 text-center">
          Circuit executed. Probabilities shown below the grid.
        </div>
      )}
    </div>
  );
}
