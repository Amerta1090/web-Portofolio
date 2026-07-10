import { useRef, useEffect, useState, useCallback } from "react";

interface Point {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  pinned: boolean;
}

interface Spring {
  a: number;
  b: number;
  restLength: number;
}

function createPoint(x: number, y: number, pinned = false): Point {
  return { x, y, prevX: x, prevY: y, pinned };
}

function hitTest(x: number, y: number, nodes: Point[], radius = 12): number {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const dx = n.x - x;
    const dy = n.y - y;
    if (dx * dx + dy * dy < radius * radius) return i;
  }
  return -1;
}

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number, t: number
): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${clamp(r1 + (r2 - r1) * t)},${clamp(g1 + (g2 - g1) * t)},${clamp(b1 + (b2 - b1) * t)})`;
}

function setupCloth(cx: number, cy: number, cols: number, rows: number, spacing: number) {
  const points: Point[] = [];
  const springs: Spring[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const pinned = r === 0;
      points.push(createPoint(cx + c * spacing, cy + r * spacing, pinned));
      const idx = r * cols + c;
      if (c > 0) {
        springs.push({ a: idx, b: idx - 1, restLength: spacing });
      }
      if (r > 0) {
        springs.push({ a: idx, b: idx - cols, restLength: spacing });
      }
      if (c > 0 && r > 0) {
        springs.push({ a: idx, b: idx - cols - 1, restLength: spacing * 1.414 });
      }
    }
  }
  return { points, springs };
}

function setupChain(cx: number, cy: number, count: number, spacing: number) {
  const points: Point[] = [];
  const springs: Spring[] = [];
  for (let i = 0; i < count; i++) {
    points.push(createPoint(cx, cy + i * spacing, i === 0));
    if (i > 0) {
      springs.push({ a: i - 1, b: i, restLength: spacing });
    }
  }
  return { points, springs };
}

function setupJelly(cx: number, cy: number, size: number, spacing: number) {
  const points: Point[] = [];
  const springs: Spring[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      points.push(createPoint(cx + c * spacing, cy + r * spacing));
      const idx = r * size + c;
      if (c > 0) {
        springs.push({ a: idx, b: idx - 1, restLength: spacing });
      }
      if (r > 0) {
        springs.push({ a: idx, b: idx - size, restLength: spacing });
      }
      if (c > 0 && r > 0) {
        springs.push({ a: idx, b: idx - size - 1, restLength: spacing * 1.414 });
      }
    }
  }
  return { points, springs };
}

function setupRagdoll(cx: number, cy: number) {
  const pts: Point[] = [];
  const add = (x: number, y: number, pinned = false) => {
    pts.push(createPoint(x, y, pinned));
    return pts.length - 1;
  };
  const springs: Spring[] = [];
  const connect = (a: number, b: number) => {
    const dx = pts[a].x - pts[b].x;
    const dy = pts[a].y - pts[b].y;
    springs.push({ a, b, restLength: Math.sqrt(dx * dx + dy * dy) });
  };

  const head = add(cx, cy - 50);
  const neck = add(cx, cy - 35);
  const shoulderL = add(cx - 18, cy - 20);
  const shoulderR = add(cx + 18, cy - 20);
  const handL = add(cx - 28, cy + 10);
  const handR = add(cx + 28, cy + 10);
  const spine = add(cx, cy);
  const hip = add(cx, cy + 20);
  const hipL = add(cx - 12, cy + 25);
  const hipR = add(cx + 12, cy + 25);
  const footL = add(cx - 15, cy + 55);
  const footR = add(cx + 15, cy + 55);

  connect(head, neck);
  connect(neck, shoulderL);
  connect(neck, shoulderR);
  connect(shoulderL, handL);
  connect(shoulderR, handR);
  connect(shoulderL, shoulderR);
  connect(shoulderL, spine);
  connect(shoulderR, spine);
  connect(spine, hip);
  connect(hip, hipL);
  connect(hip, hipR);
  connect(hipL, footL);
  connect(hipR, footR);

  return { points: pts, springs };
}

export default function SpringPhysics({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const nodesRef = useRef<Point[]>([]);
  const springsRef = useRef<Spring[]>([]);
  const dragNodeRef = useRef(-1);
  const mouseRef = useRef({ x: 0, y: 0 });

  const [gravity, setGravity] = useState(9.8);
  const [damping, setDamping] = useState(0.99);
  const [stiffness, setStiffness] = useState(8);
  const [paused, setPaused] = useState(false);

  const gravityRef = useRef(gravity);
  const dampingRef = useRef(damping);
  const stiffnessRef = useRef(stiffness);
  const pausedRef = useRef(paused);

  useEffect(() => { gravityRef.current = gravity; }, [gravity]);
  useEffect(() => { dampingRef.current = damping; }, [damping]);
  useEffect(() => { stiffnessRef.current = stiffness; }, [stiffness]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const applyPreset = useCallback((preset: string) => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth || 400;
    const h = container.clientHeight || 600;
    const cx = w / 2;
    const cy = h / 2;

    let result: { points: Point[]; springs: Spring[] };
    switch (preset) {
      case "cloth":
        result = setupCloth(cx - 4.5 * 28, 20, 10, 8, 28);
        break;
      case "chain":
        result = setupChain(cx, 20, 12, 30);
        break;
      case "jelly":
        result = setupJelly(cx - 1.5 * 30, cy - 1.5 * 30, 4, 30);
        break;
      case "ragdoll":
        result = setupRagdoll(cx, cy - 30);
        break;
      default:
        result = { points: [], springs: [] };
    }
    nodesRef.current = result.points;
    springsRef.current = result.springs;
    dragNodeRef.current = -1;
  }, []);

  const clearAll = useCallback(() => {
    nodesRef.current = [];
    springsRef.current = [];
    dragNodeRef.current = -1;
  }, []);

  useEffect(() => {
    if (compact) {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 192;
      const result = setupCloth(w / 2 - 4.5 * 28, 10, 10, 6, 28);
      nodesRef.current = result.points;
      springsRef.current = result.springs;
    }
  }, [compact]);

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

    function physicsStep() {
      if (pausedRef.current) return;
      const nodes = nodesRef.current;
      const springs = springsRef.current;
      const g = gravityRef.current * 0.5;
      const d = dampingRef.current;
      const iters = stiffnessRef.current;
      const dragIdx = dragNodeRef.current;

      for (let i = 0; i < nodes.length; i++) {
        if (i === dragIdx || nodes[i].pinned) continue;
        const node = nodes[i];
        const vx = (node.x - node.prevX) * d;
        const vy = (node.y - node.prevY) * d;
        node.prevX = node.x;
        node.prevY = node.y;
        node.x += vx;
        node.y += vy + g;
      }

      for (let iter = 0; iter < iters; iter++) {
        for (const spring of springs) {
          const a = nodes[spring.a];
          const b = nodes[spring.b];
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 === 0) continue;
          const dist = Math.sqrt(d2);
          const diff = (spring.restLength - dist) / dist;
          const ox = dx * 0.5 * diff;
          const oy = dy * 0.5 * diff;
          if (!a.pinned) { a.x -= ox; a.y -= oy; }
          if (!b.pinned) { b.x += ox; b.y += oy; }
        }
      }

      if (dragIdx >= 0 && dragIdx < nodes.length) {
        const node = nodes[dragIdx];
        node.x = mouseRef.current.x;
        node.y = mouseRef.current.y;
        node.prevX = mouseRef.current.x;
        node.prevY = mouseRef.current.y;
      }
    }

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      physicsStep();

      const nodes = nodesRef.current;
      const springs = springsRef.current;

      for (const spring of springs) {
        const a = nodes[spring.a];
        const b = nodes[spring.b];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d === 0) continue;
        const ratio = d / spring.restLength;

        let color: string;
        if (ratio < 0.95) {
          const t = ratio / 0.95;
          color = lerpColor(60, 130, 255, 255, 255, 255, t);
        } else if (ratio > 1.05) {
          const t = Math.min(1, (ratio - 1.05) / 0.95);
          color = lerpColor(255, 255, 255, 255, 80, 80, t);
        } else {
          color = "rgba(255,255,255,0.5)";
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(0.5, Math.min(3, 1 + Math.abs(ratio - 1) * 4));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      const dragIdx = dragNodeRef.current;
      if (dragIdx >= 0 && dragIdx < nodes.length) {
        const sourceNode = nodes[dragIdx];
        const hit = hitTest(mouseRef.current.x, mouseRef.current.y, nodes, 16);
        if (hit >= 0 && hit !== dragIdx) {
          const target = nodes[hit];
          ctx.strokeStyle = "rgba(245,158,11,0.5)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(245,158,11,0.15)";
          ctx.beginPath();
          ctx.arc(target.x, target.y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isDrag = i === dragIdx;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isDrag ? 6 : n.pinned ? 5 : 4, 0, Math.PI * 2);
        ctx.fillStyle = n.pinned ? "#f59e0b" : isDrag ? "rgba(245,158,11,0.8)" : "#ffffff";
        ctx.fill();
        if (isDrag) {
          ctx.strokeStyle = "rgba(245,158,11,0.4)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (n.pinned) {
          ctx.strokeStyle = "rgba(245,158,11,0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (!compact) {
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.font = "9px monospace";
        ctx.fillText(`Nodes: ${nodes.length}  Springs: ${springs.length}`, 8, 12);
      }

      if (!compact && nodes.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.font = "12px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Click to create nodes · Drag between nodes to connect", w / 2, h / 2);
        ctx.textAlign = "start";
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getCanvasPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (pausedRef.current) return;
      if (e.button !== 0) return;
      const pos = getCanvasPos(e);
      const nodes = nodesRef.current;
      const hit = hitTest(pos.x, pos.y, nodes);
      if (hit >= 0) {
        dragNodeRef.current = hit;
        mouseRef.current = pos;
      } else {
        nodesRef.current = [...nodes, createPoint(pos.x, pos.y)];
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e);
      mouseRef.current = pos;
    };

    const handleMouseUp = () => {
      const dragIdx = dragNodeRef.current;
      if (dragIdx >= 0) {
        const nodes = nodesRef.current;
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const hit = hitTest(mx, my, nodes, 16);
        if (hit >= 0 && hit !== dragIdx) {
          const dx = nodes[dragIdx].x - nodes[hit].x;
          const dy = nodes[dragIdx].y - nodes[hit].y;
          const restLength = Math.sqrt(dx * dx + dy * dy);
          if (restLength > 0 && restLength < 200) {
            springsRef.current = [...springsRef.current, { a: dragIdx, b: hit, restLength }];
          }
        }
        dragNodeRef.current = -1;
      }
    };

    const handleDblClick = (e: MouseEvent) => {
      if (pausedRef.current) return;
      const pos = getCanvasPos(e);
      const nodes = nodesRef.current;
      const hit = hitTest(pos.x, pos.y, nodes);
      if (hit >= 0) {
        const newNodes = [...nodes];
        newNodes[hit] = {
          ...newNodes[hit],
          pinned: !newNodes[hit].pinned,
          prevX: newNodes[hit].x,
          prevY: newNodes[hit].y,
        };
        nodesRef.current = newNodes;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (pausedRef.current) return;
      e.preventDefault();
      const pos = getCanvasPos(e);
      const nodes = nodesRef.current;
      const hit = hitTest(pos.x, pos.y, nodes);
      if (hit >= 0) {
        nodesRef.current = nodes.filter((_, i) => i !== hit);
        springsRef.current = springsRef.current
          .filter(s => s.a !== hit && s.b !== hit)
          .map(s => ({
            a: s.a > hit ? s.a - 1 : s.a,
            b: s.b > hit ? s.b - 1 : s.b,
            restLength: s.restLength,
          }));
        dragNodeRef.current = -1;
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("dblclick", handleDblClick);
    canvas.addEventListener("contextmenu", handleContextMenu);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("dblclick", handleDblClick);
      canvas.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0f0f11] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!compact && (
        <>
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <button
                onClick={() => applyPreset("cloth")}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Cloth
              </button>
              <button
                onClick={() => applyPreset("chain")}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Chain
              </button>
              <button
                onClick={() => applyPreset("jelly")}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Jelly
              </button>
              <button
                onClick={() => applyPreset("ragdoll")}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Ragdoll
              </button>
              <button
                onClick={clearAll}
                className="px-2 py-0.5 text-[10px] rounded border border-red-500/30 text-red-400/70 hover:border-red-500/50 hover:text-red-400 transition-all"
              >
                Clear All
              </button>
              <button
                onClick={() => setPaused(p => !p)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  paused
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <label className="flex items-center gap-1">
                Gravity:
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.1}
                  value={gravity}
                  onChange={(e) => setGravity(parseFloat(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-10">{gravity.toFixed(1)}</span>
              </label>
              <label className="flex items-center gap-1">
                Damping:
                <input
                  type="range"
                  min={0.9}
                  max={1}
                  step={0.001}
                  value={damping}
                  onChange={(e) => setDamping(parseFloat(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-9">{damping.toFixed(3)}</span>
              </label>
              <label className="flex items-center gap-1">
                Stiffness:
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={stiffness}
                  onChange={(e) => setStiffness(parseInt(e.target.value))}
                  className="w-16 accent-amber-500"
                />
                <span className="text-amber-400 w-4">{stiffness}</span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
