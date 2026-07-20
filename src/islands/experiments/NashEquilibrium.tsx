import { useRef, useEffect, useState, useCallback } from "react";

interface PayoffMatrix {
  row: [[number, number], [number, number]];
  col: [[number, number], [number, number]];
}

interface NashResult {
  pure: Array<{ r: number; c: number }>;
  mixed: { p: number; q: number } | null;
}

interface Preset {
  name: string;
  row: [[number, number], [number, number]];
  col: [[number, number], [number, number]];
}

const PRESETS: Preset[] = [
  {
    name: "Prisoner's Dilemma",
    row: [[3, 0], [5, 1]],
    col: [[3, 5], [0, 1]],
  },
  {
    name: "Battle of the Sexes",
    row: [[3, 0], [0, 2]],
    col: [[2, 0], [0, 3]],
  },
  {
    name: "Stag Hunt",
    row: [[4, 0], [3, 3]],
    col: [[4, 3], [0, 3]],
  },
  {
    name: "Matching Pennies",
    row: [[1, -1], [-1, 1]],
    col: [[-1, 1], [1, -1]],
  },
  {
    name: "Chicken",
    row: [[0, -1], [1, -2]],
    col: [[0, 1], [-1, -2]],
  },
];

function findNashEquilibria(m: PayoffMatrix): NashResult {
  const pure: Array<{ r: number; c: number }> = [];

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const rowBest =
        m.row[r][c] >= m.row[1 - r][c] &&
        (m.row[r][c] > m.row[1 - r][c] || r <= 1 - r);
      const colBest =
        m.col[r][c] >= m.col[r][1 - c] &&
        (m.col[r][c] > m.col[r][1 - c] || c <= 1 - c);

      if (rowBest && colBest) {
        pure.push({ r, c });
      }
    }
  }

  const a11 = m.row[0][0] - m.row[1][0];
  const a12 = m.row[0][1] - m.row[1][1];
  const b11 = m.col[0][0] - m.col[0][1];
  const b21 = m.col[1][0] - m.col[1][1];

  let mixed: { p: number; q: number } | null = null;
  const denomP = a11 - a12 + b11 - b21;

  if (pure.length === 0 || (pure.length < 2 && Math.abs(denomP) < 1e-10)) {
    const denomP2 = (m.row[1][0] - m.row[0][0]) + (m.row[0][1] - m.row[1][1]);
    const denomQ2 = (m.col[0][1] - m.col[0][0]) + (m.col[1][0] - m.col[1][1]);
    const p = Math.abs(denomP2) > 1e-10 ? (m.row[1][0] - m.row[0][0]) / denomP2 : 0.5;
    const q = Math.abs(denomQ2) > 1e-10 ? (m.col[0][1] - m.col[0][0]) / denomQ2 : 0.5;
    mixed = { p: Math.max(0, Math.min(1, p)), q: Math.max(0, Math.min(1, q)) };
  } else if (pure.length === 2) {
    const p = a11 - a12;
    const q = b11 - b21;
    if (Math.abs(p) > 1e-10 || Math.abs(q) > 1e-10) {
      mixed = {
        p: Math.abs(p) > 1e-10 ? Math.max(0, Math.min(1, a12 / (a12 - a11 + 1e-10))) : 0.5,
        q: Math.abs(q) > 1e-10 ? Math.max(0, Math.min(1, b21 / (b21 - b11 + 1e-10))) : 0.5,
      };
    }
  } else {
    const denomP2 = (m.row[1][0] - m.row[0][0]) + (m.row[0][1] - m.row[1][1]);
    const denomQ2 = (m.col[0][1] - m.col[0][0]) + (m.col[1][0] - m.col[1][1]);
    const p = Math.abs(denomP2) > 1e-10 ? (m.row[1][0] - m.row[0][0]) / denomP2 : 0.5;
    const q = Math.abs(denomQ2) > 1e-10 ? (m.col[0][1] - m.col[0][0]) / denomQ2 : 0.5;
    mixed = { p: Math.max(0, Math.min(1, p)), q: Math.max(0, Math.min(1, q)) };
  }

  return { pure, mixed };
}

function isPureNE(r: number, c: number, m: PayoffMatrix): boolean {
  const rowBest = m.row[r][c] >= m.row[1 - r][c];
  const colBest = m.col[r][c] >= m.col[r][1 - c];
  return rowBest && colBest;
}

function drawMatrix(
  ctx: CanvasRenderingContext2D,
  m: PayoffMatrix,
  result: NashResult,
  x: number,
  y: number,
  size: number,
  compact: boolean,
) {
  const cellSize = size / 2;
  const pad = compact ? 4 : 8;

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(x + cellSize, y);
  ctx.lineTo(x + cellSize, y + size);
  ctx.moveTo(x, y + cellSize);
  ctx.lineTo(x + size, y + cellSize);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `${compact ? 9 : 11}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("Col", x + cellSize, y - pad);
  ctx.fillText("Row", x - pad - 14, y + cellSize);

  ctx.font = `bold ${compact ? 8 : 10}px monospace`;
  ctx.fillText("0", x + cellSize * 0.5, y - pad);
  ctx.fillText("1", x + cellSize * 1.5, y - pad);

  ctx.textAlign = "right";
  ctx.fillText("0", x - pad - 2, y + cellSize * 0.5 + 4);
  ctx.fillText("1", x - pad - 2, y + cellSize * 1.5 + 4);
  ctx.textAlign = "center";

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const cx = x + c * cellSize + cellSize / 2;
      const cy = y + r * cellSize + cellSize / 2;
      const isNE = isPureNE(r, c, m);

      if (isNE) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cellSize * 0.45);
        grad.addColorStop(0, "rgba(245,158,11,0.25)");
        grad.addColorStop(1, "rgba(245,158,11,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x + c * cellSize + 1, y + r * cellSize + 1, cellSize - 2, cellSize - 2);

        ctx.shadowColor = "rgba(245,158,11,0.6)";
        ctx.shadowBlur = compact ? 6 : 10;
        ctx.fillStyle = "#f59e0b";
        ctx.font = `bold ${compact ? 11 : 14}px monospace`;
        ctx.fillText(`${m.row[r][c]}, ${m.col[r][c]}`, cx, cy + 2);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = `${compact ? 10 : 13}px monospace`;
        ctx.fillText(`${m.row[r][c]}, ${m.col[r][c]}`, cx, cy + 2);
      }
    }
  }
}

function drawBestResponseCurves(
  ctx: CanvasRenderingContext2D,
  m: PayoffMatrix,
  showCurves: boolean,
  x: number,
  y: number,
  w: number,
  h: number,
  compact: boolean,
) {
  if (!showCurves) return;

  ctx.fillStyle = "rgba(15,15,17,0.85)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `${compact ? 8 : 9}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText("Best Response Curves", x + 4, y + 10);

  const plotX = x + 20;
  const plotY = y + 18;
  const plotW = w - 32;
  const plotH = h - 30;

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.strokeRect(plotX, plotY, plotW, plotH);

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = `${compact ? 7 : 8}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("q (Col plays 0)", plotX + plotW / 2, plotY + plotH + 10);
  ctx.save();
  ctx.translate(plotX - 10, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("p (Row plays 0)", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";

  const a11 = m.row[0][0] - m.row[1][0];
  const a12 = m.row[0][1] - m.row[1][1];
  const b11 = m.col[0][0] - m.col[0][1];
  const b21 = m.col[1][0] - m.col[1][1];

  ctx.beginPath();
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const q = i / steps;
    const u0 = q * m.row[0][0] + (1 - q) * m.row[0][1];
    const u1 = q * m.row[1][0] + (1 - q) * m.row[1][1];
    const p = u0 >= u1 ? 1 : 0;
    const px = plotX + q * plotW;
    const py = plotY + (1 - p) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = "rgba(34,197,94,0.8)";
  ctx.lineWidth = compact ? 1.5 : 2;
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const v0 = p * m.col[0][0] + (1 - p) * m.col[1][0];
    const v1 = p * m.col[0][1] + (1 - p) * m.col[1][1];
    const q = v0 >= v1 ? 1 : 0;
    const px = plotX + q * plotW;
    const py = plotY + (1 - p) * plotH;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.strokeStyle = "rgba(59,130,246,0.8)";
  ctx.lineWidth = compact ? 1.5 : 2;
  ctx.stroke();

  if (result.mixed) {
    const mx = plotX + result.mixed.q * plotW;
    const my = plotY + (1 - result.mixed.p) * plotH;
    ctx.beginPath();
    ctx.arc(mx, my, compact ? 4 : 6, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.strokeStyle = "rgba(245,158,11,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawMixedStrategyVisual(
  ctx: CanvasRenderingContext2D,
  m: PayoffMatrix,
  mixed: { p: number; q: number } | null,
  x: number,
  y: number,
  w: number,
  h: number,
  compact: boolean,
) {
  if (!mixed) return;

  ctx.fillStyle = "rgba(15,15,17,0.85)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `${compact ? 8 : 9}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText("Mixed Strategy Equilibrium", x + 4, y + 10);

  const barX = x + 8;
  const barY = y + 20;
  const barW = w - 16;
  const barH = compact ? 8 : 12;

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = "rgba(34,197,94,0.6)";
  ctx.fillRect(barX, barY, barW * mixed.p, barH);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = "rgba(34,197,94,0.9)";
  ctx.font = `${compact ? 8 : 9}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`Row p=${mixed.p.toFixed(3)}`, barX, barY + barH + 10);

  const bar2Y = barY + barH + 16;
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(barX, bar2Y, barW, barH);
  ctx.fillStyle = "rgba(59,130,246,0.6)";
  ctx.fillRect(barX, bar2Y, barW * mixed.q, barH);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.strokeRect(barX, bar2Y, barW, barH);

  ctx.fillStyle = "rgba(59,130,246,0.9)";
  ctx.fillText(`Col q=${mixed.q.toFixed(3)}`, barX, bar2Y + barH + 10);
}

function drawInfoOverlay(
  ctx: CanvasRenderingContext2D,
  result: NashResult,
  x: number,
  y: number,
  w: number,
  h: number,
  compact: boolean,
) {
  ctx.fillStyle = "rgba(15,15,17,0.85)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(245,158,11,0.9)";
  ctx.font = `bold ${compact ? 8 : 10}px monospace`;
  ctx.textAlign = "left";
  ctx.fillText("Nash Equilibrium", x + 6, y + 14);

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `${compact ? 7 : 9}px monospace`;

  let lineY = y + 26;
  if (result.pure.length > 0) {
    const cells = result.pure.map(ne => `(${ne.r},${ne.c})`).join(", ");
    ctx.fillText(`Pure: ${cells}`, x + 6, lineY);
  } else {
    ctx.fillText("Pure: none", x + 6, lineY);
  }

  lineY += compact ? 11 : 13;
  if (result.mixed) {
    ctx.fillText(`Mixed: p=${result.mixed.p.toFixed(3)} q=${result.mixed.q.toFixed(3)}`, x + 6, lineY);
  } else {
    ctx.fillText("Mixed: none", x + 6, lineY);
  }
}

function drawPayoffInput(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = "rgba(30,30,35,0.9)";
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "8px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 4, y + 10);

  ctx.fillStyle = color;
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(value), x + w / 2, y + h - 4);
  ctx.textAlign = "left";
}

export default function NashEquilibrium({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [matrix, setMatrix] = useState<PayoffMatrix>({
    row: [[3, 0], [5, 1]],
    col: [[3, 5], [0, 1]],
  });
  const [showCurves, setShowCurves] = useState(true);
  const [presetIdx, setPresetIdx] = useState(0);

  const matrixRef = useRef(matrix);
  const showCurvesRef = useRef(showCurves);
  const timeRef = useRef(0);

  useEffect(() => { matrixRef.current = matrix; }, [matrix]);
  useEffect(() => { showCurvesRef.current = showCurves; }, [showCurves]);

  const applyPreset = useCallback((idx: number) => {
    setPresetIdx(idx);
    setMatrix({ row: PRESETS[idx].row.map(r => [...r] as [number, number]) as [[number, number], [number, number]], col: PRESETS[idx].col.map(r => [...r] as [number, number]) as [[number, number], [number, number]] });
  }, []);

  const resetMatrix = useCallback(() => {
    applyPreset(presetIdx);
  }, [presetIdx, applyPreset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 192 : 500),
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

    const loop = () => {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(loop);

      timeRef.current += 0.016;
      const t = timeRef.current;

      const { w, h } = getSize();
      const m = matrixRef.current;
      const sc = showCurvesRef.current;
      const result = findNashEquilibria(m);

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      if (compact) {
        const matSize = Math.min(w * 0.35, h * 0.8);
        drawMatrix(ctx, m, result, 12, (h - matSize) / 2, matSize, true);

        if (sc) {
          const crW = w * 0.35;
          const crH = h * 0.7;
          drawBestResponseCurves(ctx, m, true, w - crW - 12, (h - crH) / 2, crW, crH, true);
        }
      } else {
        const topMargin = 30;
        const matSize = Math.min(w * 0.32, h * 0.4);
        const matX = 20;
        const matY = topMargin;
        drawMatrix(ctx, m, result, matX, matY, matSize, false);

        const infoX = matX + matSize + 16;
        const infoW = Math.min(w * 0.25, 180);
        drawInfoOverlay(ctx, result, infoX, matY, infoW, compact ? 60 : 60, false);

        if (m.mixed !== null || result.mixed) {
          drawMixedStrategyVisual(ctx, m, result.mixed, infoX, matY + 68, infoW, compact ? 50 : 50, false);
        }

        const brW = w * 0.35;
        const brH = h * 0.42;
        const brX = w - brW - 16;
        const brY = topMargin;
        drawBestResponseCurves(ctx, m, sc, brX, brY, brW, brH, false);

        const pulse = Math.sin(t * 2) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(245,158,11,${pulse * 0.1})`;
        ctx.beginPath();
        ctx.arc(matX + matSize / 2, matY + matSize + 20, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "8px monospace";
        ctx.textAlign = "left";
        ctx.fillText("Green = Row BR | Blue = Col BR | Amber = NE", matX, matY + matSize + 16);
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0f0f11] relative overflow-hidden flex flex-col"
    >
      <canvas ref={canvasRef} className="w-full flex-1" />

      {!compact && (
        <div className="absolute top-0 left-0 right-0 p-2 flex items-center gap-2 bg-gradient-to-b from-[#0f0f11] via-[#0f0f11]/90 to-transparent z-10">
          <div className="flex items-center gap-1 flex-wrap">
            {PRESETS.map((p, i) => (
              <button
                key={p.name}
                onClick={() => applyPreset(i)}
                className={`px-2 py-1 text-[9px] font-mono rounded transition-colors ${
                  presetIdx === i
                    ? "bg-amber-500/30 text-amber-300 border border-amber-500/40"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <label className="text-[9px] text-white/40 font-mono">Curves</label>
            <button
              onClick={() => setShowCurves(v => !v)}
              className={`w-7 h-4 rounded-full transition-colors ${
                showCurves ? "bg-amber-500" : "bg-white/20"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${
                  showCurves ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <button
            onClick={resetMatrix}
            className="px-2 py-1 text-[9px] font-mono rounded bg-white/10 hover:bg-white/20 text-white/60 transition-colors ml-1"
          >
            Reset
          </button>
        </div>
      )}

      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 p-3 grid grid-cols-2 gap-2 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/90 to-transparent z-10">
          <div className="space-y-1">
            <div className="text-[9px] text-green-400/70 font-mono font-bold mb-1">Row Player</div>
            {[
              ["r0c0", "r0c1", "r1c0", "r1c1"],
            ].map((keys, ki) => (
              <div key={ki} className="grid grid-cols-2 gap-1">
                {(["00", "01", "10", "11"] as const).map(([r, c]) => (
                  <div key={`${r}${c}`} className="flex items-center gap-1">
                    <span className="text-[8px] text-white/30 font-mono w-6">({r},{c})</span>
                    <input
                      type="number"
                      value={matrix.row[+r][+c]}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setMatrix(prev => {
                          const newRow = prev.row.map(row => [...row] as [number, number]) as [[number, number], [number, number]];
                          newRow[+r][+c] = val;
                          return { ...prev, row: newRow };
                        });
                      }}
                      className="w-full px-1 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-green-300 focus:border-green-500/50 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="text-[9px] text-blue-400/70 font-mono font-bold mb-1">Col Player</div>
            <div className="grid grid-cols-2 gap-1">
              {(["00", "01", "10", "11"] as const).map(([r, c]) => (
                <div key={`${r}${c}`} className="flex items-center gap-1">
                  <span className="text-[8px] text-white/30 font-mono w-6">({r},{c})</span>
                  <input
                    type="number"
                    value={matrix.col[+r][+c]}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setMatrix(prev => {
                        const newCol = prev.col.map(row => [...row] as [number, number]) as [[number, number], [number, number]];
                        newCol[+r][+c] = val;
                        return { ...prev, col: newCol };
                      });
                    }}
                    className="w-full px-1 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-blue-300 focus:border-blue-500/50 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
