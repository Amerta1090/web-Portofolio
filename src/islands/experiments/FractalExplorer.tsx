import { useRef, useEffect, useState, useCallback } from "react";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_zoom;
uniform float u_maxIter;
uniform int u_type;
uniform vec2 u_juliaC;
uniform vec3 u_palA;
uniform vec3 u_palB;
uniform vec3 u_palC;
uniform vec3 u_palD;
uniform float u_time;
out vec4 fragColor;

vec3 palette(float t) {
  return u_palA + u_palB * cos(6.28318 * (u_palC * t + u_palD));
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = v_uv;
  vec2 z, c;
  if (u_type == 0) {
    c = (uv - 0.5) * u_zoom * vec2(aspect, 1.0) + u_center;
    z = vec2(0.0);
  } else {
    z = (uv - 0.5) * u_zoom * vec2(aspect, 1.0) + u_center;
    c = u_juliaC;
  }
  float n = 0.0;
  for (float i = 0.0; i < 1024.0; i += 1.0) {
    if (i >= u_maxIter) break;
    float zx = z.x * z.x - z.y * z.y + c.x;
    float zy = 2.0 * z.x * z.y + c.y;
    z = vec2(zx, zy);
    if (dot(z, z) > 256.0) {
      n = i + 1.0 - log2(log2(dot(z, z)));
      break;
    }
  }
  float t = n / u_maxIter;
  vec3 col = palette(t);
  fragColor = vec4(col, 1.0);
}`;

interface PalettePreset {
  name: string;
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  d: [number, number, number];
}

const PALETTES: PalettePreset[] = [
  { name: "Amber", a: [0.5,0.5,0.5], b: [0.5,0.5,0.5], c: [1.0,1.0,1.0], d: [0.00,0.05,0.15] },
  { name: "Fire", a: [0.5,0.5,0.5], b: [0.5,0.5,0.5], c: [1.0,1.0,1.0], d: [0.00,0.10,0.20] },
  { name: "Ice", a: [0.5,0.5,0.5], b: [0.5,0.5,0.5], c: [2.0,1.0,0.0], d: [0.50,0.60,0.70] },
  { name: "Plasma", a: [0.5,0.5,0.5], b: [0.5,0.5,0.5], c: [1.0,1.0,0.5], d: [0.80,0.90,0.30] },
  { name: "Forest", a: [0.5,0.5,0.5], b: [0.3,0.5,0.3], c: [0.5,1.0,0.5], d: [0.30,0.20,0.40] },
  { name: "Ocean", a: [0.4,0.5,0.6], b: [0.3,0.4,0.5], c: [0.8,1.2,0.6], d: [0.40,0.50,0.60] },
];

function initWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return null;

  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, VERTEX_SHADER);
  gl.compileShader(vs);
  if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
    console.error("VS compile error:", gl.getShaderInfoLog(vs));
    return null;
  }

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, FRAGMENT_SHADER);
  gl.compileShader(fs);
  if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
    console.error("FS compile error:", gl.getShaderInfoLog(fs));
    return null;
  }

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Link error:", gl.getProgramInfoLog(program));
    return null;
  }

  const positions = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.useProgram(program);

  return { gl, program };
}

function encodeState(s: { cx: number; cy: number; zoom: number; maxIter: number; type: number; jr: number; ji: number; pal: number }): string {
  return btoa(JSON.stringify(s));
}

function decodeState(h: string) {
  try { return JSON.parse(atob(h)); } catch { return null; }
}

export default function FractalExplorer({ compact }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef(0);
  const runningRef = useRef(true);

  const centerRef = useRef({ x: -0.5, y: 0 });
  const zoomRef = useRef(2.5);
  const timeRef = useRef(0);
  const animatingRef = useRef(false);
  const animStartRef = useRef(0);
  const animFromRef = useRef({ cx: -0.5, cy: 0, zoom: 2.5 });
  const animToRef = useRef({ cx: -0.5, cy: 0, zoom: 2.5 });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panCenterRef = useRef({ x: -0.5, y: 0 });

  const [fractalType, setFractalType] = useState(0);
  const juliaCRef = useRef({ x: -0.7, y: 0.27 });
  const [juliaRe, setJuliaRe] = useState(-0.7);
  const [juliaIm, setJuliaIm] = useState(0.27);
  const [maxIter, setMaxIter] = useState(256);
  const iterRef = useRef(256);
  const [palIdx, setPalIdx] = useState(0);
  const [palShift, setPalShift] = useState(0);
  const [morphing, setMorphing] = useState(false);
  const [morphSpeed, setMorphSpeed] = useState(0.3);
  const [zoomDisplay, setZoomDisplay] = useState("1.0");
  const [cursorMode, setCursorMode] = useState<"pan" | "zoom">("pan");
  const [supportsGL, setSupportsGL] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const result = initWebGL(canvas);
    if (!result) { setSupportsGL(false); return; }
    glRef.current = result.gl;
    progRef.current = result.program;
    runningRef.current = true;

    const gl = result.gl;
    const prog = result.program;

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uCenter = gl.getUniformLocation(prog, "u_center");
    const uZoom = gl.getUniformLocation(prog, "u_zoom");
    const uMaxIter = gl.getUniformLocation(prog, "u_maxIter");
    const uType = gl.getUniformLocation(prog, "u_type");
    const uJuliaC = gl.getUniformLocation(prog, "u_juliaC");
    const uPalA = gl.getUniformLocation(prog, "u_palA");
    const uPalB = gl.getUniformLocation(prog, "u_palB");
    const uPalC = gl.getUniformLocation(prog, "u_palC");
    const uPalD = gl.getUniformLocation(prog, "u_palD");
    const uTime = gl.getUniformLocation(prog, "u_time");

    function getSize() {
      return { w: container!.clientWidth || 400, h: compact ? container!.clientHeight || 192 : container!.clientHeight || 600 };
    }

    function resize() {
      const { w, h } = getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      gl.viewport(0, 0, canvas!.width, canvas!.height);
      return { w, h };
    }

    resize();

    function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

    function render(now: number) {
      if (!runningRef.current) return;
      const { w, h } = getSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas!.width !== w * dpr || canvas!.height !== h * dpr) resize();

      if (animatingRef.current) {
        const elapsed = now - animStartRef.current;
        const dur = 500;
        const t = Math.min(elapsed / dur, 1);
        const e = easeOutCubic(t);
        const from = animFromRef.current;
        const to = animToRef.current;
        centerRef.current.x = from.cx + (to.cx - from.cx) * e;
        centerRef.current.y = from.cy + (to.cy - from.cy) * e;
        zoomRef.current = from.zoom + (to.zoom - from.zoom) * e;
        if (t < 1) {
          const scale = 1 - t * 0.4;
          iterRef.current = Math.max(Math.floor(maxIter * scale), 32);
        } else {
          iterRef.current = maxIter;
          animatingRef.current = false;
        }
      }

      timeRef.current = now / 1000;

      if (morphing && fractalType === 1) {
        const speed = morphSpeed * 0.15;
        const angle = now / 1000 * speed;
        const r = 0.6;
        const jx = Math.cos(angle) * r;
        const jy = Math.sin(angle) * r;
        juliaCRef.current = { x: jx, y: jy };
        setJuliaRe(Math.round(jx * 100) / 100);
        setJuliaIm(Math.round(jy * 100) / 100);
      }

      const pal = PALETTES[palIdx];
      const shift = palShift * 0.01;
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uCenter, centerRef.current.x, centerRef.current.y);
      gl.uniform1f(uZoom, zoomRef.current);
      gl.uniform1f(uMaxIter, iterRef.current);
      gl.uniform1i(uType, fractalType);
      gl.uniform2f(uJuliaC, juliaCRef.current.x, juliaCRef.current.y);
      gl.uniform3f(uPalA, pal.a[0], pal.a[1], pal.a[2]);
      gl.uniform3f(uPalB, pal.b[0], pal.b[1], pal.b[2]);
      gl.uniform3f(uPalC, pal.c[0], pal.c[1], pal.c[2]);
      gl.uniform3f(uPalD, pal.d[0] + shift, pal.d[1] + shift, pal.d[2] + shift);
      gl.uniform1f(uTime, timeRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      setZoomDisplay(zoomRef.current < 0.0001
        ? `${(1 / zoomRef.current).toFixed(0)}x`
        : `${(1 / zoomRef.current).toFixed(1)}x`);

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, [compact]);

  useEffect(() => {
    iterRef.current = maxIter;
  }, [maxIter]);

  useEffect(() => {
    if (fractalType === 0) {
      centerRef.current = { x: -0.5, y: 0 };
      zoomRef.current = 2.5;
    } else {
      centerRef.current = { x: 0, y: 0 };
      zoomRef.current = 3.0;
    }
  }, [fractalType]);

  const startZoomAnim = useCallback((targetCx: number, targetCy: number, targetZoom: number) => {
    animFromRef.current = { cx: centerRef.current.x, cy: centerRef.current.y, zoom: zoomRef.current };
    animToRef.current = { cx: targetCx, cy: targetCy, zoom: targetZoom };
    animStartRef.current = performance.now();
    animatingRef.current = true;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const aspect = rect.width / rect.height;
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    const newZoom = zoomRef.current * factor;
    if (newZoom < 0.00000001 || newZoom > 10) return;
    const worldX = (mx - 0.5) * zoomRef.current * aspect + centerRef.current.x;
    const worldY = (my - 0.5) * zoomRef.current + centerRef.current.y;
    const newCx = worldX - (mx - 0.5) * newZoom * aspect;
    const newCy = worldY - (my - 0.5) * newZoom;
    startZoomAnim(newCx, newCy, newZoom);
  }, [startZoomAnim]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (cursorMode === "zoom") {
      isDraggingRef.current = true;
      dragStartRef.current = { x, y };
      dragRectRef.current = null;
    } else {
      isDraggingRef.current = true;
      panStartRef.current = { x, y };
      panCenterRef.current = { ...centerRef.current };
    }
  }, [cursorMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (cursorMode === "zoom") {
      const sx = dragStartRef.current.x;
      const sy = dragStartRef.current.y;
      dragRectRef.current = {
        x: Math.min(sx, x),
        y: Math.min(sy, y),
        w: Math.abs(x - sx),
        h: Math.abs(y - sy),
      };
    } else {
      const dx = (x - panStartRef.current.x) / rect.width;
      const dy = (y - panStartRef.current.y) / rect.height;
      const aspect = rect.width / rect.height;
      centerRef.current.x = panCenterRef.current.x - dx * zoomRef.current * aspect;
      centerRef.current.y = panCenterRef.current.y - dy * zoomRef.current;
    }
  }, [cursorMode]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (cursorMode === "zoom" && dragRectRef.current) {
      const r = dragRectRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && r.w > 10 && r.h > 10) {
        const aspect = rect.width / rect.height;
        const uv_w = r.w / rect.width;
        const uv_h = r.h / rect.height;
        const uv_cx = (r.x + r.w / 2) / rect.width;
        const uv_cy = (r.y + r.h / 2) / rect.height;
        const targetCx = (uv_cx - 0.5) * zoomRef.current * aspect + centerRef.current.x;
        const targetCy = (uv_cy - 0.5) * zoomRef.current + centerRef.current.y;
        const newZoomX = uv_w * zoomRef.current;
        const newZoomY = uv_h * zoomRef.current;
        const targetZoom = Math.max(newZoomX, newZoomY);
        startZoomAnim(targetCx, targetCy, targetZoom);
      }
      dragRectRef.current = null;
    }
  }, [cursorMode, startZoomAnim]);

  const handleCopyUrl = useCallback(() => {
    const s = encodeState({
      cx: centerRef.current.x,
      cy: centerRef.current.y,
      zoom: zoomRef.current,
      maxIter: maxIter,
      type: fractalType,
      jr: juliaCRef.current.x,
      ji: juliaCRef.current.y,
      pal: palIdx,
    });
    const url = `${window.location.origin}${window.location.pathname}?fractal=${s}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }, [maxIter, fractalType, palIdx]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const f = params.get("fractal");
    if (f) {
      const s = decodeState(f);
      if (s) {
        centerRef.current = { x: s.cx, y: s.cy };
        zoomRef.current = s.zoom;
        setMaxIter(s.maxIter);
        setFractalType(s.type);
        setJuliaRe(s.jr);
        setJuliaIm(s.ji);
        juliaCRef.current = { x: s.jr, y: s.ji };
        setPalIdx(s.pal);
      }
    }
  }, []);

  function drawDragRect(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!dragRectRef.current) return;
    const r = dragRectRef.current;
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }

  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const oc = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!oc || !container) return;
    const ctx = oc.getContext("2d")!;
    let raf = 0;

    function drawOverlay() {
      if (!runningRef.current) return;
      const w = container!.clientWidth;
      const h = compact ? container!.clientHeight || 192 : container!.clientHeight || 600;
      if (oc.width !== w || oc.height !== h) {
        oc.width = w;
        oc.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      drawDragRect(ctx, w, h);
      raf = requestAnimationFrame(drawOverlay);
    }
    drawOverlay();

    return () => cancelAnimationFrame(raf);
  }, [compact]);

  const juliaSetRe = useCallback((v: number) => {
    setJuliaRe(v);
    juliaCRef.current = { ...juliaCRef.current, x: v };
  }, []);

  const juliaSetIm = useCallback((v: number) => {
    setJuliaIm(v);
    juliaCRef.current = { ...juliaCRef.current, y: v };
  }, []);

  if (!supportsGL) {
    return (
      <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-[#0a0a0c]">
        <p className="text-[#a0a0b0] text-sm">WebGL 2 not supported</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#0a0a0c]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {!compact && (
        <>
          <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 items-center z-10">
            <div className="flex gap-1">
              <button
                onClick={() => setFractalType(0)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                  fractalType === 0
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                }`}
              >
                Mandelbrot
              </button>
              <button
                onClick={() => setFractalType(1)}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                  fractalType === 1
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                }`}
              >
                Julia
              </button>
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setCursorMode("pan")}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                  cursorMode === "pan"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                }`}
              >
                Pan
              </button>
              <button
                onClick={() => setCursorMode("zoom")}
                className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                  cursorMode === "zoom"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                }`}
              >
                Zoom
              </button>
            </div>

            <span className="text-[11px] text-[#a0a0b0] font-mono ml-auto">
              {zoomDisplay}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-x-3 gap-y-1.5 items-center z-10">
            <div className="flex gap-1">
              {PALETTES.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setPalIdx(i)}
                  className={`px-2 py-0.5 text-[10px] rounded-lg border transition-all ${
                    palIdx === i
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                      : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-[10px] text-[#a0a0b0]">
              Shift
              <Slider value={palShift} onChange={setPalShift} min={0} max={100} />
            </label>

            <label className="flex items-center gap-1.5 text-[10px] text-[#a0a0b0]">
              Iter
              <Slider value={maxIter} onChange={(v) => setMaxIter(Math.round(v))} min={32} max={1024} />
            </label>

            {fractalType === 1 && (
              <>
                <label className="flex items-center gap-1.5 text-[10px] text-[#a0a0b0]">
                  Cx
                  <Slider value={juliaRe} onChange={juliaSetRe} min={-1.5} max={1.5} step={0.01} />
                </label>
                <label className="flex items-center gap-1.5 text-[10px] text-[#a0a0b0]">
                  Cy
                  <Slider value={juliaIm} onChange={juliaSetIm} min={-1.5} max={1.5} step={0.01} />
                </label>
                <button
                  onClick={() => setMorphing(!morphing)}
                  className={`px-2 py-0.5 text-[10px] rounded-lg border transition-all ${
                    morphing
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-400"
                      : "bg-[#ffffff08] border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30"
                  }`}
                >
                  {morphing ? "Morph On" : "Morph"}
                </button>
                {morphing && (
                  <label className="flex items-center gap-1.5 text-[10px] text-[#a0a0b0]">
                    Speed
                    <Slider value={morphSpeed} onChange={setMorphSpeed} min={0.05} max={1} step={0.05} />
                  </label>
                )}
              </>
            )}

            <button
              onClick={handleCopyUrl}
              className="px-2 py-0.5 text-[10px] rounded-lg border border-[#ffffff0f] text-[#a0a0b0] hover:border-amber-500/30 bg-[#ffffff08] transition-all ml-auto"
              title="Copy shareable URL"
            >
              Bookmark
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Slider({ value, onChange, min, max, step }: {
  value: number; onChange: (v: number) => void; min: number; max: number; step?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
      step={step ?? 1}
      className="w-16 h-1 appearance-none bg-[#ffffff0f] rounded-full outline-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:border-0"
    />
  );
}
