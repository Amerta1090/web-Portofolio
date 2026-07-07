import { useRef, useEffect, useState, useCallback } from "react";

type CanvasTool = "pan" | "pen" | "marker" | "spray" | "eraser" | "particle" | "node";
type ExportFormat = "png" | "svg";

interface Point { x: number; y: number; pressure?: number; time?: number }
interface StrokeData { points: Point[]; tool: CanvasTool; color: string; size: number; opacity: number }
interface NodePort { id: string; x: number; y: number; type: "input" | "output" }
interface GraphNode { id: string; x: number; y: number; w: number; h: number; label: string; ports: NodePort[]; color: string }
interface GraphEdge { id: string; from: string; to: string; fromPort: string; toPort: string }
interface HistoryEntry { strokes: StrokeData[]; nodes: GraphNode[]; edges: GraphEdge[]; timestamp: number }
interface CanvasParticle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; opacity: number }

const COLORS = ["#ffffff", "#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];
const TOOLS: { id: CanvasTool; label: string; icon: string; shortcut: string }[] = [
  { id: "pan", label: "Pan", icon: "✋", shortcut: "V" },
  { id: "pen", label: "Pen", icon: "✏️", shortcut: "P" },
  { id: "marker", label: "Marker", icon: "🖊️", shortcut: "M" },
  { id: "spray", label: "Spray", icon: "💨", shortcut: "S" },
  { id: "eraser", label: "Eraser", icon: "🧹", shortcut: "E" },
  { id: "particle", label: "Particle", icon: "✨", shortcut: "B" },
  { id: "node", label: "Node", icon: "🔷", shortcut: "N" },
];

const SPRAY_DENSITY = 12;
const PARTICLE_COUNT = 200;
const MINIMAP_SIZE = 140;
const HISTORY_MAX = 50;
const NODE_W = 140;
const NODE_H = 60;
const PORT_R = 6;

let _idCounter = 0;
function uid(prefix = "x") { return `${prefix}_${++_idCounter}_${Math.random().toString(36).slice(2, 6)}`; }

function distance(a: Point, b: Point) { return Math.hypot(b.x - a.x, b.y - a.y); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v; }

function applyTransform(ctx: CanvasRenderingContext2D, ox: number, oy: number, sc: number) {
  ctx.setTransform(sc, 0, 0, sc, ox, oy);
}

function screenToWorld(sx: number, sy: number, ox: number, oy: number, sc: number): Point {
  return { x: (sx - ox) / sc, y: (sy - oy) / sc };
}

function worldToScreen(wx: number, wy: number, ox: number, oy: number, sc: number): Point {
  return { x: wx * sc + ox, y: wy * sc + oy };
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, ox: number, oy: number, sc: number) {
  const gridSize = 40;
  const scaledSize = gridSize * sc;
  if (scaledSize < 4) return;
  const startX = Math.floor(-ox / scaledSize) * scaledSize;
  const startY = Math.floor(-oy / scaledSize) * scaledSize;
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x < w; x += scaledSize) {
    if (x < 0) continue;
    ctx.moveTo(x, 0); ctx.lineTo(x, h);
  }
  for (let y = startY; y < h; y += scaledSize) {
    if (y < 0) continue;
    ctx.moveTo(0, y); ctx.lineTo(w, y);
  }
  ctx.stroke();
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: StrokeData) {
  if (stroke.points.length < 2) {
    if (stroke.points.length === 1) {
      const p = stroke.points[0];
      ctx.beginPath();
      ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }
  const pts = stroke.points;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  if (pts.length > 1) {
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  ctx.stroke();
}

function drawSpray(ctx: CanvasRenderingContext2D, stroke: StrokeData) {
  const pts = stroke.points;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    for (let j = 0; j < SPRAY_DENSITY; j++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * stroke.size;
      ctx.fillRect(p.x + Math.cos(angle) * radius, p.y + Math.sin(angle) * radius, 1.5, 1.5);
    }
  }
}

function drawEraser(ctx: CanvasRenderingContext2D, stroke: StrokeData) {
  ctx.globalCompositeOperation = "destination-out";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = stroke.size;
  ctx.strokeStyle = "rgba(0,0,0,1)";
  drawStroke(ctx, stroke);
  ctx.globalCompositeOperation = "source-over";
}

function getNodePortPosition(node: GraphNode, portId: string): Point {
  const port = node.ports.find(p => p.id === portId);
  if (!port) return { x: node.x, y: node.y };
  return {
    x: node.x + port.x,
    y: node.y + port.y,
  };
}

function drawNode(ctx: CanvasRenderingContext2D, node: GraphNode) {
  const r = 8;
  ctx.beginPath();
  ctx.moveTo(node.x + r, node.y);
  ctx.lineTo(node.x + node.w - r, node.y);
  ctx.quadraticCurveTo(node.x + node.w, node.y, node.x + node.w, node.y + r);
  ctx.lineTo(node.x + node.w, node.y + node.h - r);
  ctx.quadraticCurveTo(node.x + node.w, node.y + node.h, node.x + node.w - r, node.y + node.h);
  ctx.lineTo(node.x + r, node.y + node.h);
  ctx.quadraticCurveTo(node.x, node.y + node.h, node.x, node.y + node.h - r);
  ctx.lineTo(node.x, node.y + r);
  ctx.quadraticCurveTo(node.x, node.y, node.x + r, node.y);
  ctx.closePath();
  ctx.fillStyle = "rgba(15,15,17,0.85)";
  ctx.fill();
  ctx.strokeStyle = node.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.label, node.x + node.w / 2, node.y + node.h / 2);

  for (const port of node.ports) {
    const px = node.x + port.x;
    const py = node.y + port.y;
    ctx.beginPath();
    ctx.arc(px, py, PORT_R, 0, Math.PI * 2);
    ctx.fillStyle = port.type === "input" ? "#3b82f6" : "#10b981";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawEdge(ctx: CanvasRenderingContext2D, from: Point, to: Point) {
  const dx = to.x - from.x;
  const cp = Math.abs(dx) * 0.5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(from.x + cp, from.y, to.x - cp, to.y, to.x, to.y);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  ox: number,
  oy: number,
  sc: number,
  strokes: StrokeData[],
  nodes: GraphNode[],
  edges: GraphEdge[],
) {
  const pad = 8;
  const mapX = w - MINIMAP_SIZE - pad;
  const mapY = pad;
  const mmScale = MINIMAP_SIZE / Math.max(w / sc, h / sc);
  const cx = w / 2 - ox / sc;
  const cy = h / 2 - oy / sc;
  const viewW = w / sc;
  const viewH = h / sc;

  ctx.save();
  ctx.translate(mapX, mapY);

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  ctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  ctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

  ctx.save();
  ctx.scale(mmScale, mmScale);
  ctx.translate(-(cx - viewW / 2), -(cy - viewH / 2));

  for (const edge of edges) {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) continue;
    const fromP = getNodePortPosition(fromNode, edge.fromPort);
    const toP = getNodePortPosition(toNode, edge.toPort);
    ctx.beginPath();
    ctx.moveTo(fromP.x, fromP.y);
    ctx.lineTo(toP.x, toP.y);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (const node of nodes) {
    ctx.fillStyle = node.color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(node.x, node.y, node.w, node.h);
    ctx.globalAlpha = 1;
  }

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  ctx.restore();

  const view = cx - viewW / 2;
  const vwy = cy - viewH / 2;
  ctx.strokeStyle = "rgba(245,158,11,0.5)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(view * mmScale, vwy * mmScale, viewW * mmScale, viewH * mmScale);

  ctx.restore();
}

function initParticles(): CanvasParticle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * 400 - 200,
    y: Math.random() * 400 - 200,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    life: 0,
    maxLife: 100 + Math.random() * 200,
    size: 1 + Math.random() * 2,
    color: "#ffffff",
    opacity: 0.3 + Math.random() * 0.4,
  }));
}

function spawnParticlesAt(x: number, y: number, color: string, count: number): CanvasParticle[] {
  const parts: CanvasParticle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 3;
    parts.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 0,
      maxLife: 60 + Math.random() * 120,
      size: 1 + Math.random() * 3,
      color,
      opacity: 0.6 + Math.random() * 0.4,
    });
  }
  return parts;
}

function updateParticles(parts: CanvasParticle[], settling: boolean) {
  for (const p of parts) {
    p.life++;
    if (settling) {
      p.vx *= 0.97;
      p.vy += 0.02;
      p.vy *= 0.97;
    }
    p.x += p.vx;
    p.y += p.vy;
    p.opacity *= 0.995;
  }
  return parts.filter(p => p.life < p.maxLife && p.opacity > 0.01);
}

export default function InteractiveCanvas({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [tool, setTool] = useState<CanvasTool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(1);

  const oxRef = useRef(0);
  const oyRef = useRef(0);
  const scRef = useRef(1);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const strokesRef = useRef<StrokeData[]>([]);
  const currentStrokeRef = useRef<StrokeData | null>(null);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIdxRef = useRef(-1);

  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const selectedNodeRef = useRef<string | null>(null);
  const draggingNodeRef = useRef(false);
  const draggingEdgeRef = useRef<{ from: string; fromPort: string } | null>(null);
  const dragNodeOffsetRef = useRef({ x: 0, y: 0 });

  const particlesRef = useRef<CanvasParticle[]>(initParticles());
  const particleModeRef = useRef(false);
  const lastParticleSpawnRef = useRef({ x: 0, y: 0, time: 0 });

  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [timelineIdx, setTimelineIdx] = useState(-1);
  const [timelineCount, setTimelineCount] = useState(0);

  const saveSnapshot = useCallback(() => {
    const entry: HistoryEntry = {
      strokes: JSON.parse(JSON.stringify(strokesRef.current)),
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
      timestamp: Date.now(),
    };
    const hist = historyRef.current;
    const idx = historyIdxRef.current;
    hist.length = idx + 1;
    hist.push(entry);
    if (hist.length > HISTORY_MAX) hist.shift();
    historyIdxRef.current = hist.length - 1;
    setCanUndo(true);
    setCanRedo(false);
    setTimelineIdx(hist.length - 1);
    setTimelineCount(hist.length);
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current < 0) return;
    const idx = historyIdxRef.current - 1;
    if (idx < 0) return;
    const hist = historyRef.current;
    const entry = hist[idx];
    strokesRef.current = JSON.parse(JSON.stringify(entry.strokes));
    nodesRef.current = JSON.parse(JSON.stringify(entry.nodes));
    edgesRef.current = JSON.parse(JSON.stringify(entry.edges));
    setStrokes(strokesRef.current);
    setNodes(nodesRef.current);
    setEdges(edgesRef.current);
    historyIdxRef.current = idx;
    setCanUndo(idx > 0);
    setCanRedo(true);
    setTimelineIdx(idx);
  }, []);

  const redo = useCallback(() => {
    const hist = historyRef.current;
    const idx = historyIdxRef.current + 1;
    if (idx >= hist.length) return;
    const entry = hist[idx];
    strokesRef.current = JSON.parse(JSON.stringify(entry.strokes));
    nodesRef.current = JSON.parse(JSON.stringify(entry.nodes));
    edgesRef.current = JSON.parse(JSON.stringify(entry.edges));
    setStrokes(strokesRef.current);
    setNodes(nodesRef.current);
    setEdges(edgesRef.current);
    historyIdxRef.current = idx;
    setCanUndo(true);
    setCanRedo(idx < hist.length - 1);
    setTimelineIdx(idx);
  }, []);

  const jumpToHistory = useCallback((idx: number) => {
    const hist = historyRef.current;
    if (idx < 0 || idx >= hist.length) return;
    const entry = hist[idx];
    strokesRef.current = JSON.parse(JSON.stringify(entry.strokes));
    nodesRef.current = JSON.parse(JSON.stringify(entry.nodes));
    edgesRef.current = JSON.parse(JSON.stringify(entry.edges));
    setStrokes(strokesRef.current);
    setNodes(nodesRef.current);
    setEdges(edgesRef.current);
    historyIdxRef.current = idx;
    setCanUndo(idx > 0);
    setCanRedo(idx < hist.length - 1);
    setTimelineIdx(idx);
  }, []);

  const renderScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const ox = oxRef.current;
    const oy = oyRef.current;
    const sc = scRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    drawGrid(ctx, w, h, ox, oy, sc);

    applyTransform(ctx, ox, oy, sc);

    for (const stroke of strokesRef.current) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = stroke.size;
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = stroke.opacity;
      if (stroke.tool === "eraser") {
        drawEraser(ctx, stroke);
      } else if (stroke.tool === "spray") {
        ctx.fillStyle = stroke.color;
        drawSpray(ctx, stroke);
      } else {
        drawStroke(ctx, stroke);
      }
      ctx.globalAlpha = 1;
    }

    if (currentStrokeRef.current) {
      const cs = currentStrokeRef.current;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = cs.size;
      ctx.strokeStyle = cs.color;
      ctx.globalAlpha = cs.opacity;
      if (cs.tool === "eraser") {
        drawEraser(ctx, cs);
      } else if (cs.tool === "spray") {
        ctx.fillStyle = cs.color;
        drawSpray(ctx, cs);
      } else {
        drawStroke(ctx, cs);
      }
      ctx.globalAlpha = 1;
    }

    for (const edge of edgesRef.current) {
      const fromNode = nodesRef.current.find(n => n.id === edge.from);
      const toNode = nodesRef.current.find(n => n.id === edge.to);
      if (!fromNode || !toNode) continue;
      const fromP = getNodePortPosition(fromNode, edge.fromPort);
      const toP = getNodePortPosition(toNode, edge.toPort);
      drawEdge(ctx, fromP, toP);
    }

    if (draggingEdgeRef.current) {
      const dn = nodesRef.current.find(n => n.id === draggingEdgeRef.current!.from);
      if (dn) {
        const dp = getNodePortPosition(dn, draggingEdgeRef.current!.fromPort);
        drawEdge(ctx, dp, { x: mouseWorldRef.current.x, y: mouseWorldRef.current.y });
      }
    }

    for (const node of nodesRef.current) {
      drawNode(ctx, node);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const parts = particlesRef.current;
    if (parts.length > 0) {
      for (const p of parts) {
        const sx = p.x * sc + ox;
        const sy = p.y * sc + oy;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * Math.max(0.5, sc * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * 0.5;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (!compact) {
      drawMinimap(ctx, w, h, ox, oy, sc, strokesRef.current, nodesRef.current, edgesRef.current);
    }

    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`zoom: ${sc.toFixed(1)}x`, 8, h - 8);
  }, [compact]);

  const mouseWorldRef = useRef({ x: 0, y: 0 });

  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const cp = getCanvasPoint(e);
    const wp = screenToWorld(cp.x, cp.y, oxRef.current, oyRef.current, scRef.current);
    mouseWorldRef.current = wp;

    if (tool === "pan" || (tool === "node" && e.button === 1)) {
      isPanningRef.current = true;
      panStartRef.current = { x: cp.x, y: cp.y, ox: oxRef.current, oy: oyRef.current };
      return;
    }

    if (tool === "node") {
      const node = nodesRef.current.find(n =>
        wp.x >= n.x && wp.x <= n.x + n.w && wp.y >= n.y && wp.y <= n.y + n.h
      );
      if (node) {
        selectedNodeRef.current = node.id;
        draggingNodeRef.current = true;
        dragNodeOffsetRef.current = { x: wp.x - node.x, y: wp.y - node.y };
        return;
      }

      let edgeStarted = false;
      for (const node of nodesRef.current) {
        for (const port of node.ports) {
          if (port.type === "output") {
            const pp = getNodePortPosition(node, port.id);
            if (distance(wp, pp) < PORT_R * 2) {
              draggingEdgeRef.current = { from: node.id, fromPort: port.id };
              edgeStarted = true;
              break;
            }
          }
        }
        if (edgeStarted) break;
      }

      if (!edgeStarted) {
        const newNode: GraphNode = {
          id: uid("n"),
          x: wp.x - NODE_W / 2,
          y: wp.y - NODE_H / 2,
          w: NODE_W,
          h: NODE_H,
          label: `Node ${nodesRef.current.length + 1}`,
          color: COLORS[Math.floor(Math.random() * (COLORS.length - 1)) + 1],
          ports: [
            { id: uid("pi"), x: 0, y: NODE_H / 2, type: "input" },
            { id: uid("po"), x: NODE_W, y: NODE_H / 2, type: "output" },
          ],
        };
        nodesRef.current = [...nodesRef.current, newNode];
        setNodes(nodesRef.current);
        saveSnapshot();
      }
      return;
    }

    if (["pen", "marker", "spray", "eraser"].includes(tool)) {
      currentStrokeRef.current = {
        points: [wp],
        tool,
        color: tool === "eraser" ? "#000000" : color,
        size: brushSize * (tool === "marker" ? 3 : 1),
        opacity: tool === "eraser" ? 1 : opacity,
      };
    }

    if (tool === "particle") {
      particleModeRef.current = true;
      const spawnCount = 8 + Math.floor(Math.random() * 8);
      const newParts = spawnParticlesAt(wp.x, wp.y, color, spawnCount);
      particlesRef.current = [...particlesRef.current, ...newParts];
      lastParticleSpawnRef.current = { x: wp.x, y: wp.y, time: Date.now() };
    }
  }, [tool, color, brushSize, opacity, getCanvasPoint, saveSnapshot]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const cp = getCanvasPoint(e);
    const wp = screenToWorld(cp.x, cp.y, oxRef.current, oyRef.current, scRef.current);
    mouseWorldRef.current = wp;

    if (isPanningRef.current) {
      oxRef.current = panStartRef.current.ox + (cp.x - panStartRef.current.x);
      oyRef.current = panStartRef.current.oy + (cp.y - panStartRef.current.y);
      return;
    }

    if (draggingNodeRef.current && selectedNodeRef.current) {
      const node = nodesRef.current.find(n => n.id === selectedNodeRef.current);
      if (node) {
        node.x = wp.x - dragNodeOffsetRef.current.x;
        node.y = wp.y - dragNodeOffsetRef.current.y;
        setNodes([...nodesRef.current]);
      }
      return;
    }

    if (currentStrokeRef.current && ["pen", "marker", "spray", "eraser"].includes(tool)) {
      const last = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
      if (distance(wp, last) > 1) {
        const cpPoint = { ...wp, pressure: e.pressure };
        if (tool === "pen" && e.pressure > 0) {
          cpPoint.pressure = e.pressure;
        }
        currentStrokeRef.current.points.push(cpPoint);
      }
    }

    if (tool === "particle" && particleModeRef.current) {
      const now = Date.now();
      if (now - lastParticleSpawnRef.current.time > 40) {
        const spawnCount = 4 + Math.floor(Math.random() * 4);
        const newParts = spawnParticlesAt(wp.x, wp.y, color, spawnCount);
        particlesRef.current = [...particlesRef.current, ...newParts];
        lastParticleSpawnRef.current = { x: wp.x, y: wp.y, time: now };
      }
    }
  }, [tool, color, getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (draggingNodeRef.current) {
      draggingNodeRef.current = false;
      selectedNodeRef.current = null;
      saveSnapshot();
      return;
    }

    if (draggingEdgeRef.current) {
      const mw = mouseWorldRef.current;
      const nodes = nodesRef.current;
      for (const node of nodes) {
        for (const port of node.ports) {
          if (port.type === "input") {
            const pp = getNodePortPosition(node, port.id);
            if (distance(mw, pp) < PORT_R * 2) {
              const newEdge: GraphEdge = {
                id: uid("e"),
                from: draggingEdgeRef.current.from,
                to: node.id,
                fromPort: draggingEdgeRef.current.fromPort,
                toPort: port.id,
              };
              edgesRef.current = [...edgesRef.current, newEdge];
              setEdges(edgesRef.current);
              saveSnapshot();
              break;
            }
          }
        }
      }
      draggingEdgeRef.current = null;
      return;
    }

    if (currentStrokeRef.current && ["pen", "marker", "spray", "eraser"].includes(tool)) {
      const stroke = currentStrokeRef.current;
      if (stroke.points.length > 0) {
        strokesRef.current = [...strokesRef.current, stroke];
        setStrokes(strokesRef.current);
        saveSnapshot();
      }
      currentStrokeRef.current = null;
    }

    if (tool === "particle") {
      particleModeRef.current = false;
    }
  }, [tool, saveSnapshot]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const sc = scRef.current;
    const newSc = clamp(sc * delta, 0.1, 10);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    oxRef.current = mx - (mx - oxRef.current) * (newSc / sc);
    oyRef.current = my - (my - oyRef.current) * (newSc / sc);
    scRef.current = newSc;
  }, []);

  const exportCanvas = useCallback(async (format: ExportFormat) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (format === "png") {
      const link = document.createElement("a");
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else if (format === "svg") {
      const w = canvas.width;
      const h = canvas.height;
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0f0f11"/>`;
      for (const stroke of strokesRef.current) {
        if (stroke.points.length < 2) continue;
        let d = "";
        for (let i = 0; i < stroke.points.length; i++) {
          if (i === 0) d += `M ${stroke.points[i].x.toFixed(1)} ${stroke.points[i].y.toFixed(1)} `;
          else d += `L ${stroke.points[i].x.toFixed(1)} ${stroke.points[i].y.toFixed(1)} `;
        }
        svgContent += `<path d="${d}" stroke="${stroke.color}" stroke-width="${stroke.size}" fill="none" opacity="${stroke.opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      svgContent += "</svg>";
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `whiteboard-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  const clearCanvas = useCallback(() => {
    strokesRef.current = [];
    nodesRef.current = [];
    edgesRef.current = [];
    setStrokes([]);
    setNodes([]);
    setEdges([]);
    particlesRef.current = initParticles();
    saveSnapshot();
  }, [saveSnapshot]);

  useEffect(() => {
    if (!compact) {
      const initial: HistoryEntry = {
        strokes: [],
        nodes: [],
        edges: [],
        timestamp: Date.now(),
      };
      historyRef.current = [initial];
      historyIdxRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      setTimelineIdx(0);
      setTimelineCount(1);
    }
  }, [compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    runningRef.current = true;

    const resize = () => {
      const w = container.clientWidth || 600;
      const h = container.clientHeight || (compact ? 192 : 500);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      return { w, h, dpr };
    };

    resize();
    window.addEventListener("resize", resize);

    const el = canvas;
    el.addEventListener("wheel", handleWheel, { passive: false });

    const loop = () => {
      if (!runningRef.current) return;
      particlesRef.current = updateParticles(particlesRef.current, !particleModeRef.current);
      renderScene();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [compact, renderScene, handleWheel]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;
      const key = e.key.toLowerCase();
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); return; }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo(); return; }
      const toolMap: Record<string, CanvasTool> = { v: "pan", p: "pen", m: "marker", s: "spray", e: "eraser", b: "particle", n: "node" };
      if (key in toolMap) setTool(toolMap[key]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo]);

  const tooltips: Record<CanvasTool, string> = {
    pan: "Pan canvas (click-drag or middle-click)\nScroll to zoom",
    pen: "Pressure-sensitive pen\nThin, variable width",
    marker: "Thick marker strokes\n3x brush size",
    spray: "Spray can effect\nRandom dots in radius",
    eraser: "Erase strokes\nDestructive",
    particle: "Particle brush\nEmits settling particles",
    node: "Node graph editor\nClick empty area to add node\nDrag output port → input port to connect",
  };

  if (compact) {
    return (
      <div ref={containerRef} className="w-full h-full bg-bg-tertiary rounded-lg overflow-hidden relative">
        <canvas ref={canvasRef} className="w-full h-full block touch-none" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-bg-tertiary flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary/80 border-b border-border/40 shrink-0 gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`px-2 py-1 rounded text-xs font-mono transition-all ${
                tool === t.id
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary border border-transparent"
              }`}
              title={`${t.label} (${t.shortcut})`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border transition-all ${
                  color === c ? "border-amber-400 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span>Size</span>
            <input
              type="range"
              min={1}
              max={20}
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-16 h-1 accent-amber-500"
            />
            <span className="w-4">{brushSize}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-text-secondary">
            <span>Opacity</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.1}
              value={opacity}
              onChange={e => setOpacity(Number(e.target.value))}
              className="w-16 h-1 accent-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-2 py-1 rounded text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-2 py-1 rounded text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button
            onClick={clearCanvas}
            className="px-2 py-1 rounded text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            🗑 Clear
          </button>
          <button
            onClick={() => exportCanvas("png")}
            className="px-2 py-1 rounded text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            title="Export as PNG"
          >
            PNG
          </button>
          <button
            onClick={() => exportCanvas("svg")}
            className="px-2 py-1 rounded text-xs font-mono text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
            title="Export as SVG"
          >
            SVG
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        <div className="absolute bottom-3 left-3 text-[10px] text-text-secondary/40 font-mono pointer-events-none leading-relaxed">
          <div>V: Pan | P: Pen | M: Marker | S: Spray | E: Eraser | B: Particle | N: Node</div>
          <div>Scroll: Zoom | Ctrl+Z: Undo | Ctrl+Y: Redo</div>
        </div>
      </div>

      <div className="h-8 bg-bg-secondary/80 border-t border-border/40 flex items-center px-3 gap-1 shrink-0">
        <span className="text-[10px] text-text-secondary/50 mr-1">Timeline</span>
        {timelineCount > 0 && (
          <div className="flex items-center gap-px flex-1 max-w-[300px]">
            {Array.from({ length: timelineCount }, (_, i) => (
              <button
                key={i}
                onClick={() => jumpToHistory(i)}
                className={`h-3 flex-1 rounded-sm transition-all ${
                  i === timelineIdx
                    ? "bg-amber-500"
                    : i < timelineIdx
                    ? "bg-amber-500/30 hover:bg-amber-500/50"
                    : "bg-bg-tertiary hover:bg-bg-tertiary/80"
                }`}
                title={`Snapshot ${i + 1}`}
              />
            ))}
          </div>
        )}
        <span className="text-[10px] text-text-secondary/30 ml-2">{timelineCount} snapshots</span>
      </div>
    </div>
  );
}
