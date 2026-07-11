import { useRef, useEffect, useState, useCallback } from "react";

interface TreeNode {
  value: number;
  x: number;
  y: number;
  depth: number;
  children: number[];
  parent: number | null;
}

function collatzSequence(n: number): number[] {
  const seq = [n];
  while (n !== 1) {
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    seq.push(n);
  }
  return seq;
}

function valueToColor(value: number, maxValue: number): string {
  if (value === 1) return "#f59e0b";
  const t = Math.min(1, Math.log2(value + 1) / Math.log2(maxValue + 1));
  const r = Math.round(80 - 60 * t);
  const g = Math.round(100 - 40 * t);
  const b = Math.round(220 + 35 * t);
  return `rgb(${r},${g},${b})`;
}

function computeSubtreeWidth(
  node: number,
  adjacency: Map<number, number[]>,
  widths: Map<number, number>
): number {
  const children = adjacency.get(node) || [];
  if (children.length === 0) {
    widths.set(node, 1);
    return 1;
  }
  let total = 0;
  for (const child of children) {
    total += computeSubtreeWidth(child, adjacency, widths);
  }
  widths.set(node, total);
  return total;
}

function layoutTree(
  nodes: Map<number, TreeNode>,
  adjacency: Map<number, number[]>,
  canvasW: number,
  nodeRadius: number
): void {
  const widths = new Map<number, number>();
  if (!adjacency.has(1) && !nodes.has(1)) return;
  computeSubtreeWidth(1, adjacency, widths);

  const totalWidth = widths.get(1) || 1;
  const hSpacing = nodeRadius * 4;
  const vSpacing = 48;

  function layout(
    nodeId: number,
    left: number,
    right: number,
    depth: number
  ) {
    const node = nodes.get(nodeId);
    if (!node) return;
    const mid = (left + right) / 2;
    node.x = mid;
    node.y = depth * vSpacing + 40;
    node.depth = depth;

    const children = adjacency.get(nodeId) || [];
    let childLeft = left;
    for (const child of children) {
      const w = widths.get(child) || 1;
      const childRight = childLeft + w * hSpacing;
      layout(child, childLeft, childRight, depth + 1);
      childLeft = childRight;
    }
  }

  layout(1, 0, totalWidth * hSpacing, 0);
}

export default function CollatzTree({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const nodesRef = useRef<Map<number, TreeNode>>(new Map());
  const adjacencyRef = useRef<Map<number, number[]>>(new Map());
  const childrenOfRef = useRef<Map<number, number[]>>(new Map());

  const [explored, setExplored] = useState(1);
  const [maxStopping, setMaxStopping] = useState(0);
  const [avgStopping, setAvgStopping] = useState(0);
  const [autoExplore, setAutoExplore] = useState(false);
  const [maxNumber, setMaxNumber] = useState(1000);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [stoppingTimes, setStoppingTimes] = useState<number[]>([0]);

  const autoExploreRef = useRef(autoExplore);
  const maxNumberRef = useRef(maxNumber);
  const selectedNodeRef = useRef<number | null>(null);
  const hoveredNodeRef = useRef<number | null>(null);
  const stoppingTimesRef = useRef<number[]>([0]);
  const exploredRef = useRef(1);
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const zoomRef = useRef(1);
  const mouseRef = useRef({ x: 0, y: 0 });
  const statsRef = useRef({ explored: 1, maxStop: 0, avgStop: 0 });

  useEffect(() => { autoExploreRef.current = autoExplore; }, [autoExplore]);
  useEffect(() => { maxNumberRef.current = maxNumber; }, [maxNumber]);
  useEffect(() => { selectedNodeRef.current = selectedNode; }, [selectedNode]);
  useEffect(() => { hoveredNodeRef.current = hoveredNode; }, [hoveredNode]);
  useEffect(() => { stoppingTimesRef.current = stoppingTimes; }, [stoppingTimes]);

  const addNumber = useCallback((start: number) => {
    const nodes = nodesRef.current;
    const adj = adjacencyRef.current;
    const childrenOf = childrenOfRef.current;
    const seq = collatzSequence(start);

    for (let i = 0; i < seq.length; i++) {
      const val = seq[i];
      if (!nodes.has(val)) {
        nodes.set(val, {
          value: val,
          x: 0,
          y: 0,
          depth: 0,
          children: [],
          parent: i > 0 ? seq[i - 1] : null,
        });
      }
      if (i > 0) {
        const parentVal = seq[i - 1];
        const parentNode = nodes.get(parentVal);
        if (parentNode && !parentNode.children.includes(val)) {
          parentNode.children.push(val);
        }
        if (!adj.has(parentVal)) adj.set(parentVal, []);
        if (!adj.get(parentVal)!.includes(val)) adj.get(parentVal)!.push(val);
        if (!childrenOf.has(val)) childrenOf.set(val, []);
      }
    }

    const stopping = seq.length - 1;
    const times = stoppingTimesRef.current;
    times.push(stopping);
    stoppingTimesRef.current = times;
    setStoppingTimes([...times]);

    const allTimes = times.filter((t) => t > 0);
    const maxStop = allTimes.length > 0 ? Math.max(...allTimes) : 0;
    const avgStop =
      allTimes.length > 0
        ? Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
        : 0;

    statsRef.current = {
      explored: nodes.size,
      maxStop,
      avgStop,
    };
    exploredRef.current = nodes.size;
    setExplored(nodes.size);
    setMaxStopping(maxStop);
    setAvgStopping(avgStop);
  }, []);

  const resetTree = useCallback(() => {
    nodesRef.current.clear();
    adjacencyRef.current.clear();
    childrenOfRef.current.clear();
    stoppingTimesRef.current = [0];
    statsRef.current = { explored: 1, maxStop: 0, avgStop: 0 };
    exploredRef.current = 1;
    panXRef.current = 0;
    panYRef.current = 0;
    zoomRef.current = 1;
    setSelectedNode(null);
    setHoveredNode(null);
    setExplored(1);
    setMaxStopping(0);
    setAvgStopping(0);
    setStoppingTimes([0]);
    nodesRef.current.set(1, {
      value: 1,
      x: 0,
      y: 0,
      depth: 0,
      children: [],
      parent: null,
    });
    addNumber(1);
  }, [addNumber]);

  useEffect(() => {
    nodesRef.current.set(1, {
      value: 1,
      x: 0,
      y: 0,
      depth: 0,
      children: [],
      parent: null,
    });
    addNumber(1);
  }, [addNumber]);

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

    let lastAuto = 0;

    function draw(time: number) {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      if (autoExploreRef.current && time - lastAuto > 300) {
        const n = Math.floor(Math.random() * maxNumberRef.current) + 1;
        addNumber(n);
        lastAuto = time;
      }

      if (compact && time - lastAuto > 50) {
        const n = Math.floor(Math.random() * 100) + 1;
        addNumber(n);
        lastAuto = time;
      }

      const { w, h } = getSize();
      const nodes = nodesRef.current;
      const adj = adjacencyRef.current;
      const nodeCount = nodes.size;

      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      if (nodeCount === 0) return;

      const histW = compact ? 0 : 130;
      const treeW = w - histW - 20;
      const treeH = compact ? h - 10 : h - 20;

      const nodeRadius = compact
        ? 8
        : Math.max(10, Math.min(16, treeW / Math.max(nodeCount, 20) / 2));
      layoutTree(nodes, adj, treeW, nodeRadius);

      let allX = 0;
      let allY = 0;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const nd of nodes.values()) {
        allX += nd.x;
        allY += nd.y;
        if (nd.x < minX) minX = nd.x;
        if (nd.x > maxX) maxX = nd.x;
        if (nd.y < minY) minY = nd.y;
        if (nd.y > maxY) maxY = nd.y;
      }

      const treeCenterX = (minX + maxX) / 2;
      const treeCenterY = (minY + maxY) / 2;
      const treeRangeX = (maxX - minX) / 2 + 60;
      const treeRangeY = (maxY - minY) / 2 + 60;

      const fitScale = Math.min(
        treeW / (treeRangeX * 2 || 1),
        treeH / (treeRangeY * 2 || 1),
        1
      );

      if (panXRef.current === 0 && panYRef.current === 0) {
        panXRef.current = treeW / 2 - treeCenterX * fitScale;
        panYRef.current = compact
          ? 10
          : 20 + (treeH - treeRangeY * 2 * fitScale) / 2;
      }

      const px = panXRef.current;
      const py = panYRef.current;
      const sc = zoomRef.current * fitScale;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, treeW, h);
      ctx.clip();
      ctx.translate(px, py);
      ctx.scale(sc, sc);

      const highlightedPath = new Set<number>();
      const hovVal = hoveredNodeRef.current;
      if (hovVal !== null && nodes.has(hovVal)) {
        let cur: number | null = hovVal;
        while (cur !== null) {
          highlightedPath.add(cur);
          const nd = nodes.get(cur);
          cur = nd ? nd.parent : null;
        }
      }

      for (const nd of nodes.values()) {
        const children = adj.get(nd.value) || [];
        for (const childVal of children) {
          const child = nodes.get(childVal);
          if (!child) continue;

          const bothHigh =
            highlightedPath.has(nd.value) && highlightedPath.has(childVal);

          ctx.beginPath();
          ctx.moveTo(nd.x, nd.y + nodeRadius);
          ctx.lineTo(child.x, child.y - nodeRadius);

          if (bothHigh) {
            ctx.strokeStyle = "rgba(245,158,11,0.9)";
            ctx.lineWidth = 3;
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = 8;
          } else {
            ctx.strokeStyle = "rgba(255,255,255,0.12)";
            ctx.lineWidth = 1;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
          }
          ctx.stroke();
        }
      }

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      let maxVal = 1;
      for (const nd of nodes.values()) {
        if (nd.value > maxVal) maxVal = nd.value;
      }

      for (const nd of nodes.values()) {
        const isHighlighted = highlightedPath.has(nd.value);
        const isSelected = selectedNodeRef.current === nd.value;
        const fillColor = valueToColor(nd.value, maxVal);

        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        if (isHighlighted || isSelected) {
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = isSelected ? 12 : 6;
          ctx.stroke();
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        const fontSize = compact
          ? 7
          : Math.max(8, Math.min(11, nodeRadius * 0.75));
        ctx.fillStyle = "#fff";
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const label =
          nd.value > 9999
            ? `${(nd.value / 1000).toFixed(1)}k`
            : String(nd.value);
        ctx.fillText(label, nd.x, nd.y);
      }

      ctx.restore();

      if (!compact) {
        const seq = selectedNodeRef.current;
        if (seq !== null && nodes.has(seq)) {
          const fullSeq = collatzSequence(seq);
          const seqText = fullSeq.join(" → ");
          const maxTextW = histW + 200;

          ctx.font = "9px monospace";
          const textW = Math.min(ctx.measureText(seqText).width + 16, maxTextW);
          const seqX = w - histW - textW - 10;
          const seqY = 8;

          ctx.fillStyle = "rgba(15,15,17,0.9)";
          ctx.beginPath();
          ctx.roundRect(seqX, seqY, textW, 22, 4);
          ctx.fill();
          ctx.strokeStyle = "rgba(245,158,11,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = "#f59e0b";
          ctx.font = "9px monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(seqText, seqX + 8, seqY + 11);
        }

        const times = stoppingTimesRef.current.filter((t) => t > 0);
        if (times.length > 2) {
          const histX = w - histW - 10;
          const histY = 40;
          const histH = h - 80;

          ctx.fillStyle = "rgba(15,15,17,0.85)";
          ctx.beginPath();
          ctx.roundRect(histX, histY, histW, histH, 4);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.1)";
          ctx.lineWidth = 0.5;
          ctx.stroke();

          const maxTime = Math.max(...times, 1);
          const binCount = 30;
          const bins = new Array(binCount).fill(0);
          for (const t of times) {
            const bin = Math.min(
              binCount - 1,
              Math.floor((t / maxTime) * binCount)
            );
            bins[bin]++;
          }
          const maxBin = Math.max(...bins, 1);
          const barW = (histW - 16) / binCount;

          ctx.fillStyle = "rgba(245,158,11,0.45)";
          for (let i = 0; i < binCount; i++) {
            if (bins[i] > 0) {
              const barH = (bins[i] / maxBin) * (histH - 30);
              ctx.fillRect(
                histX + 8 + i * barW,
                histY + histH - barH - 12,
                barW - 1,
                barH
              );
            }
          }

          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "8px monospace";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText("Stopping times", histX + 8, histY + 6);

          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.font = "7px monospace";
          ctx.fillText(`0`, histX + 8, histY + histH - 8);
          ctx.textAlign = "right";
          ctx.fillText(
            `${maxTime}`,
            histX + histW - 8,
            histY + histH - 8
          );
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact, addNumber]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const w = rect.width;
      const histW = compact ? 0 : 130;
      const treeW = w - histW - 20;

      const nodes = nodesRef.current;
      if (nodes.size === 0) return;

      let maxVal = 1;
      for (const nd of nodes.values()) {
        if (nd.value > maxVal) maxVal = nd.value;
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const nd of nodes.values()) {
        if (nd.x < minX) minX = nd.x;
        if (nd.x > maxX) maxX = nd.x;
        if (nd.y < minY) minY = nd.y;
        if (nd.y > maxY) maxY = nd.y;
      }

      const treeCenterX = (minX + maxX) / 2;
      const treeCenterY = (minY + maxY) / 2;
      const treeRangeX = (maxX - minX) / 2 + 60;
      const treeRangeY = (maxY - minY) / 2 + 60;
      const treeH = compact ? rect.height - 10 : rect.height - 20;

      const fitScale = Math.min(
        treeW / (treeRangeX * 2 || 1),
        treeH / (treeRangeY * 2 || 1),
        1
      );

      const px = panXRef.current || treeW / 2 - treeCenterX * fitScale;
      const py =
        panYRef.current ||
        (compact
          ? 10
          : 20 + (treeH - treeRangeY * 2 * fitScale) / 2);
      const sc = zoomRef.current * fitScale;

      let closest: number | null = null;
      let closestDist = Infinity;

      for (const nd of nodes.values()) {
        const screenX = nd.x * sc + px;
        const screenY = nd.y * sc + py;
        const dx = clickX - screenX;
        const dy = clickY - screenY;
        const dist = dx * dx + dy * dy;
        if (dist < closestDist) {
          closestDist = dist;
          closest = nd.value;
        }
      }

      if (closest !== null && closestDist < 900) {
        setSelectedNode(closest);
        selectedNodeRef.current = closest;
        addNumber(closest);
      } else {
        const rand = Math.floor(Math.random() * maxNumberRef.current) + 1;
        addNumber(rand);
      }
    },
    [compact, addNumber]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my };

      const w = rect.width;
      const histW = compact ? 0 : 130;
      const treeW = w - histW - 20;

      const nodes = nodesRef.current;
      if (nodes.size === 0) return;

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const nd of nodes.values()) {
        if (nd.x < minX) minX = nd.x;
        if (nd.x > maxX) maxX = nd.x;
        if (nd.y < minY) minY = nd.y;
        if (nd.y > maxY) maxY = nd.y;
      }

      const treeCenterX = (minX + maxX) / 2;
      const treeCenterY = (minY + maxY) / 2;
      const treeRangeX = (maxX - minX) / 2 + 60;
      const treeRangeY = (maxY - minY) / 2 + 60;
      const treeH = compact ? rect.height - 10 : rect.height - 20;

      const fitScale = Math.min(
        treeW / (treeRangeX * 2 || 1),
        treeH / (treeRangeY * 2 || 1),
        1
      );

      const px = panXRef.current || treeW / 2 - treeCenterX * fitScale;
      const py =
        panYRef.current ||
        (compact
          ? 10
          : 20 + (treeH - treeRangeY * 2 * fitScale) / 2);
      const sc = zoomRef.current * fitScale;

      let closest: number | null = null;
      let closestDist = Infinity;

      for (const nd of nodes.values()) {
        const screenX = nd.x * sc + px;
        const screenY = nd.y * sc + py;
        const dx = mx - screenX;
        const dy = my - screenY;
        const dist = dx * dx + dy * dy;
        if (dist < closestDist) {
          closestDist = dist;
          closest = nd.value;
        }
      }

      if (closest !== null && closestDist < 600) {
        setHoveredNode(closest);
        hoveredNodeRef.current = closest;
      } else {
        setHoveredNode(null);
        hoveredNodeRef.current = null;
      }
    },
    [compact]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      zoomRef.current = Math.max(0.1, Math.min(5, zoomRef.current * factor));
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onWheel={handleWheel}
      />
      {!compact && (
        <>
          <div className="absolute top-2 left-2 z-10 text-[9px] font-mono text-amber-400/70 space-y-0.5">
            <div>nodes: {explored}</div>
            <div>max stop: {maxStopping}</div>
            <div>avg stop: {avgStopping}</div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-secondary/70 font-mono bg-bg-secondary/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/30">
              <label className="flex items-center gap-1">
                max:
                <input
                  type="range"
                  min={100}
                  max={10000}
                  step={100}
                  value={maxNumber}
                  onChange={(e) => setMaxNumber(parseInt(e.target.value))}
                  className="w-20 accent-amber-500"
                />
                <span className="text-amber-400 w-12">{maxNumber}</span>
              </label>
              <button
                onClick={() => {
                  setAutoExplore((a) => !a);
                }}
                className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                  autoExplore
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                    : "border-border/40 text-text-secondary hover:border-amber-500/30"
                }`}
              >
                {autoExplore ? "Stop" : "Auto Explore"}
              </button>
              <button
                onClick={() => {
                  const n = Math.floor(Math.random() * maxNumberRef.current) + 1;
                  addNumber(n);
                }}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Random
              </button>
              <button
                onClick={resetTree}
                className="px-2 py-0.5 text-[10px] rounded border border-border/40 text-text-secondary hover:border-amber-500/30 transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
