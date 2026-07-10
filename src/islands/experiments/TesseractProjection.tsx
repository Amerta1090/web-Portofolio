import { useRef, useEffect, useState, useCallback } from "react";

interface Props {
  compact?: boolean;
}

type ViewMode = "wireframe" | "faces" | "both";

interface PlaneState {
  active: boolean;
  speed: number;
  angle: number;
}

type PlaneKey = "xy" | "xz" | "xw" | "yz" | "yw" | "zw";

const PLANE_LABELS: Record<PlaneKey, string> = {
  xy: "XY",
  xz: "XZ",
  xw: "XW",
  yz: "YZ",
  yw: "YW",
  zw: "ZW",
};

function makeVertices(): number[][] {
  const v: number[][] = [];
  for (let i = 0; i < 16; i++) {
    const x = i & 1 ? 1 : -1;
    const y = i & 2 ? 1 : -1;
    const z = i & 4 ? 1 : -1;
    const w = i & 8 ? 1 : -1;
    v.push([x, y, z, w]);
  }
  return v;
}

function makeEdges(): [number, number][] {
  const edges: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      let diff = 0;
      for (let k = 0; k < 4; k++) {
        const a = (i >> k) & 1;
        const b = (j >> k) & 1;
        if (a !== b) diff++;
      }
      if (diff === 1) edges.push([i, j]);
    }
  }
  return edges;
}

/** 4D rotation in XY plane */
function rotateXY(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2], v[3]];
}

/** 4D rotation in XZ plane */
function rotateXZ(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c, v[3]];
}

/** 4D rotation in XW plane */
function rotateXW(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0] * c - v[3] * s, v[1], v[2], v[0] * s + v[3] * c];
}

/** 4D rotation in YZ plane */
function rotateYZ(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c, v[3]];
}

/** 4D rotation in YW plane */
function rotateYW(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], v[1] * c - v[3] * s, v[2], v[1] * s + v[3] * c];
}

/** 4D rotation in ZW plane */
function rotateZW(v: number[], angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], v[1], v[2] * c - v[3] * s, v[2] * s + v[3] * c];
}

type RotateFn = (v: number[], angle: number) => number[];

const ROTATIONS: Record<PlaneKey, RotateFn> = {
  xy: rotateXY,
  xz: rotateXZ,
  xw: rotateXW,
  yz: rotateYZ,
  yw: rotateYW,
  zw: rotateZW,
};

/** 4D → 3D perspective projection */
function project4Dto3D(v: number[], d: number): [number, number, number] {
  const scale = d / (d - v[3]);
  return [v[0] * scale, v[1] * scale, v[2] * scale];
}

/** 3D → 2D perspective projection */
function project3Dto2D(
  v: [number, number, number],
  fov: number,
  w: number,
  h: number,
): [number, number, number] {
  const d = fov;
  const zScale = d / (d + v[2]);
  return [w / 2 + v[0] * zScale * 200, h / 2 - v[1] * zScale * 200, zScale];
}

interface Face {
  indices: number[];
  color: string;
}

function buildFaces(): Face[] {
  // The tesseract projected to 3D shows 8 cube-like cells.
  // We define the visible face quads (6 faces per cell × 8 cells = 48 quads).
  // But many project behind each other. We'll define faces as the 24 visible
  // projected 2D faces from the 3D "shadow" — the faces of the inner & outer cubes
  // plus the connecting trapezoids.
  const faces: Face[] = [];

  // Each of the 8 cubic cells is defined by fixing one coordinate to ±1
  // and varying the other three.
  const cellDefs: { fixedDim: number; fixedVal: number }[] = [];
  for (let dim = 0; dim < 4; dim++) {
    cellDefs.push({ fixedDim: dim, fixedVal: -1 });
    cellDefs.push({ fixedDim: dim, fixedVal: 1 });
  }

  // For each cell, find the 8 vertices and 6 face quads
  for (const cell of cellDefs) {
    const cellVerts: number[] = [];
    for (let vi = 0; vi < 16; vi++) {
      const val = (vi >> cell.fixedDim) & 1;
      const expected = cell.fixedVal === 1 ? 1 : 0;
      if (val === expected) cellVerts.push(vi);
    }

    // Now find the 6 face quads — each face fixes one more dimension
    // Among the 8 vertices, two dimensions vary and one is fixed (besides the cell's fixed dim)
    const freeDims = [0, 1, 2, 3].filter((d) => d !== cell.fixedDim);
    for (const fixedFreeDim of freeDims) {
      for (const fixedFreeVal of [-1, 1]) {
        const quad: number[] = [];
        for (const vi of cellVerts) {
          const actualVal = (vi >> fixedFreeDim) & 1 ? 1 : -1;
          if (actualVal === fixedFreeVal) quad.push(vi);
        }
        if (quad.length === 4) {
          // Sort quad vertices in order (by varying 2 free dims)
          const remaining = freeDims.filter((d) => d !== fixedFreeDim);
          quad.sort((a, b) => {
            const a0 = (a >> remaining[0]) & 1;
            const b0 = (b >> remaining[0]) & 1;
            const a1 = (a >> remaining[1]) & 1;
            const b1 = (b >> remaining[1]) & 1;
            if (a0 !== b0) return a0 - b0;
            return a1 - b1;
          });
          faces.push({
            indices: quad,
            color: `hsla(${(cell.fixedDim * 90 + (cell.fixedVal === 1 ? 180 : 0) + (quad[0] * 22) % 360)}, 70%, 60%, 0.08)`,
          });
        }
      }
    }
  }

  return faces;
}

function buildStars(w: number, h: number, count: number): { x: number; y: number; r: number; a: number }[] {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.5 + 0.1,
    });
  }
  return stars;
}

export default function TesseractProjection({ compact }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const [autoRotate, setAutoRotate] = useState(true);
  const [masterSpeed, setMasterSpeed] = useState(1);
  const [cameraDist, setCameraDist] = useState(3);
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [dragRotating, setDragRotating] = useState(false);

  const [planes, setPlanes] = useState<Record<PlaneKey, PlaneState>>({
    xy: { active: true, speed: 0.5, angle: 0 },
    xz: { active: true, speed: 0.4, angle: 0 },
    xw: { active: true, speed: 0.3, angle: 0 },
    yz: { active: true, speed: 0.3, angle: 0 },
    yw: { active: true, speed: 0.4, angle: 0 },
    zw: { active: true, speed: 0.5, angle: 0 },
  });

  const planesRef = useRef(planes);
  const autoRotateRef = useRef(autoRotate);
  const masterSpeedRef = useRef(masterSpeed);
  const cameraDistRef = useRef(cameraDist);
  const viewModeRef = useRef(viewMode);
  const dragRotatingRef = useRef(dragRotating);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => { planesRef.current = planes; }, [planes]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { masterSpeedRef.current = masterSpeed; }, [masterSpeed]);
  useEffect(() => { cameraDistRef.current = cameraDist; }, [cameraDist]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { dragRotatingRef.current = dragRotating; }, [dragRotating]);

  const togglePlane = useCallback((key: PlaneKey) => {
    setPlanes((p) => ({ ...p, [key]: { ...p[key], active: !p[key].active } }));
  }, []);

  const updatePlaneSpeed = useCallback((key: PlaneKey, speed: number) => {
    setPlanes((p) => ({ ...p, [key]: { ...p[key], speed } }));
  }, []);

  const vertices = useRef(makeVertices());
  const edges = useRef(makeEdges());
  const faces = useRef(buildFaces());
  const starsRef = useRef<{ x: number; y: number; r: number; a: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    runningRef.current = true;

    const getSize = () => ({
      w: container.clientWidth || 400,
      h: container.clientHeight || (compact ? 300 : 600),
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
    starsRef.current = buildStars(getSize().w, getSize().h, compact ? 30 : 80);

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const fov = 5;

    function draw() {
      if (!runningRef.current) return;
      rafRef.current = requestAnimationFrame(draw);

      const { w, h } = getSize();
      const p = planesRef.current;
      const ar = autoRotateRef.current;
      const ms = masterSpeedRef.current;
      const cd = cameraDistRef.current;
      const vm = viewModeRef.current;

      // Update angles
      const dt = 0.016;
      const updated = { ...p };
      for (const key of Object.keys(updated) as PlaneKey[]) {
        if (ar && updated[key].active) {
          updated[key] = {
            ...updated[key],
            angle: updated[key].angle + dt * updated[key].speed * ms * 0.5,
          };
        }
      }
      // Apply drag rotation (adds rotation to active planes)
      if (dragRotatingRef.current && !ar) {
        // Drag rotation is handled via pointer events that directly modify angles
      }
      // Only trigger re-render if not already updating via drag
      if (ar) {
        setPlanes(updated);
      }

      // Clear
      ctx.fillStyle = "#0f0f11";
      ctx.fillRect(0, 0, w, h);

      // Background stars
      const stars = starsRef.current;
      for (const star of stars) {
        const twinkle = Math.sin(Date.now() / 1000 + star.x * 100) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.a * twinkle})`;
        ctx.fill();
      }

      // Grid floor (subtle 3D reference)
      const gridCx = w / 2;
      const gridCy = h / 2 + 120;
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let i = -8; i <= 8; i++) {
        const x = gridCx + i * 30;
        ctx.beginPath();
        ctx.moveTo(x, gridCy - 60);
        ctx.lineTo(x + 20, gridCy + 60);
        ctx.stroke();
      }
      for (let j = -3; j <= 3; j++) {
        const y = gridCy + j * 20;
        ctx.beginPath();
        ctx.moveTo(gridCx - 240, y);
        ctx.lineTo(gridCx + 240, y);
        ctx.stroke();
      }

      // Transform all 16 vertices
      const verts4D = vertices.current.map((v) => {
        let vv = [...v] as number[];
        vv = ROTATIONS.xy(vv, updated.xy.angle);
        vv = ROTATIONS.xz(vv, updated.xz.angle);
        vv = ROTATIONS.xw(vv, updated.xw.angle);
        vv = ROTATIONS.yz(vv, updated.yz.angle);
        vv = ROTATIONS.yw(vv, updated.yw.angle);
        vv = ROTATIONS.zw(vv, updated.zw.angle);
        return vv;
      });

      // Project to 3D
      const verts3D = verts4D.map((v) => project4Dto3D(v, cd));

      // Project to 2D screen
      const verts2D = verts3D.map((v) => project3Dto2D(v, fov, w, h));

      // Depth-sort faces for proper rendering
      const sortedFaces = vm === "wireframe" ? [] : [...faces.current].map((face, fi) => {
        const avgZ =
          face.indices.reduce((s, idx) => s + verts3D[idx][2], 0) / face.indices.length;
        return { face, avgZ, fi };
      });
      sortedFaces.sort((a, b) => b.avgZ - a.avgZ); // far to near

      // Draw faces (back to front)
      if (vm === "faces" || vm === "both") {
        for (const { face, avgZ } of sortedFaces) {
          const pts = face.indices.map((idx) => verts2D[idx]);

          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i][0], pts[i][1]);
          }
          ctx.closePath();

          // Face fill — cyan with very low opacity
          ctx.fillStyle = `rgba(6, 182, 212, ${Math.max(0.02, 0.1 - avgZ * 0.02)})`;
          ctx.fill();

          if (vm === "faces") {
            ctx.strokeStyle = `rgba(6, 182, 212, 0.15)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw wireframe edges
      if (vm === "wireframe" || vm === "both") {
        const edgeWidth = vm === "both" ? 1.5 : 1.8;
        for (const [i, j] of edges.current) {
          const p1 = verts2D[i];
          const p2 = verts2D[j];
          if (!p1 || !p2) continue;

          const avgZ = (verts3D[i][2] + verts3D[j][2]) / 2;
          const zFactor = Math.max(0.2, 0.5 - avgZ * 0.1 + 0.5);

          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);

          // Glow effect — wider, softer line underneath
          ctx.strokeStyle = `rgba(245, 158, 11, ${zFactor * 0.15})`;
          ctx.lineWidth = edgeWidth + 3;
          ctx.stroke();

          // Main line
          ctx.beginPath();
          ctx.moveTo(p1[0], p1[1]);
          ctx.lineTo(p2[0], p2[1]);
          ctx.strokeStyle = `rgba(245, 158, 11, ${zFactor * 0.7})`;
          ctx.lineWidth = edgeWidth;
          ctx.stroke();
        }

        // Vertex dots
        for (let i = 0; i < verts2D.length; i++) {
          const p = verts2D[i];
          const zFactor = Math.max(0.3, 0.7 - verts3D[i][2] * 0.1);

          ctx.beginPath();
          ctx.arc(p[0], p[1], 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${zFactor})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(139, 92, 246, ${zFactor * 0.3})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [compact]);

  // Pointer event handlers for drag rotation (non-compact only)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || compact) return;

    const getPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      dragStartRef.current = getPos(e);
      setDragRotating(true);
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRotatingRef.current) return;
      const pos = getPos(e);
      const dx = pos.x - dragStartRef.current.x;
      const dy = pos.y - dragStartRef.current.y;
      dragStartRef.current = pos;

      // Vertical drag → XZ/XY rotation; horizontal → YW/XW rotation
      const dragScale = 0.008;
      setPlanes((p) => ({
        ...p,
        xy: { ...p.xy, angle: p.xy.angle + dy * dragScale },
        xz: { ...p.xz, angle: p.xz.angle + dx * dragScale },
        yw: { ...p.yw, angle: p.yw.angle + dy * dragScale * 0.5 },
        xw: { ...p.xw, angle: p.xw.angle + dx * dragScale * 0.5 },
      }));
    };

    const onPointerUp = () => {
      setDragRotating(false);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [compact]);

  const planeKeys = Object.keys(PLANE_LABELS) as PlaneKey[];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0f0f11] overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {/* Drag hint */}
      {!compact && !autoRotate && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-bg-secondary/80 backdrop-blur-sm border border-border/40 text-text-secondary text-[10px] font-mono pointer-events-none opacity-60">
          Drag to rotate
        </div>
      )}

      {/* Vertex count display */}
      {!compact && (
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-bg-secondary/60 backdrop-blur-sm border border-border/30 text-[10px] font-mono text-text-secondary/60">
          Vertices: 16, Edges: 32, Faces: 24
        </div>
      )}

      {/* Controls */}
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-2">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-text-secondary/80 bg-bg-secondary/70 backdrop-blur-sm px-3 py-2 rounded-xl border border-border/30 w-full max-h-48 overflow-y-auto">
            {/* Auto-rotate toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={() => setAutoRotate((v) => !v)}
                className="accent-amber-500 w-3 h-3"
              />
              <span>Auto</span>
            </label>

            {/* Master Speed */}
            <label className="flex items-center gap-1">
              <span className="text-text-secondary/50">Speed:</span>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={masterSpeed}
                onChange={(e) => setMasterSpeed(parseFloat(e.target.value))}
                className="w-14 accent-amber-500"
              />
            </label>

            {/* Camera Distance */}
            <label className="flex items-center gap-1">
              <span className="text-text-secondary/50">Cam:</span>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={cameraDist}
                onChange={(e) => setCameraDist(parseFloat(e.target.value))}
                className="w-14 accent-amber-500"
              />
            </label>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-bg-secondary/60 rounded-lg p-0.5 border border-border/20">
              {(["wireframe", "faces", "both"] as ViewMode[]).map((vm) => (
                <button
                  key={vm}
                  onClick={() => setViewMode(vm)}
                  className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${
                    viewMode === vm
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "text-text-secondary/60 border border-transparent hover:text-text-secondary"
                  }`}
                >
                  {vm.charAt(0).toUpperCase() + vm.slice(1)}
                </button>
              ))}
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-border/30" />

            {/* Per-plane controls */}
            <div className="flex flex-wrap gap-2">
              {planeKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-secondary/40"
                >
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={planes[key].active}
                      onChange={() => togglePlane(key)}
                      className="accent-amber-500 w-2.5 h-2.5"
                    />
                    <span className="text-[10px] text-text-secondary/70">
                      {PLANE_LABELS[key]}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={0.1}
                    max={3}
                    step={0.1}
                    value={planes[key].speed}
                    onChange={(e) =>
                      updatePlaneSpeed(key, parseFloat(e.target.value))
                    }
                    className="w-10 accent-amber-500"
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
