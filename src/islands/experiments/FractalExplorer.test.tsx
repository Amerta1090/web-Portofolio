import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FractalExplorer from "./FractalExplorer";

function createMockWebGL2() {
  return {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    COMPILE_STATUS: 0x8B81,
    LINK_STATUS: 0x8B82,
    STATIC_DRAW: 0x88E4,
    ARRAY_BUFFER: 0x8892,
    TRIANGLES: 0x0004,
    createShader: vi.fn().mockReturnValue({}),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn().mockReturnValue(true),
    getShaderInfoLog: vi.fn().mockReturnValue(""),
    createProgram: vi.fn().mockReturnValue({}),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn().mockReturnValue(true),
    getProgramInfoLog: vi.fn().mockReturnValue(""),
    createBuffer: vi.fn().mockReturnValue({}),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn().mockReturnValue(0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    useProgram: vi.fn(),
    getUniformLocation: vi.fn().mockReturnValue({}),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniform3f: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    getExtension: vi.fn().mockReturnValue({ loseContext: vi.fn() }),
  };
}

function createMock2D() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    canvas: {} as HTMLCanvasElement,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
  } as unknown as CanvasRenderingContext2D;
}

const origGetContext = HTMLCanvasElement.prototype.getContext;
const origLocation = window.location;

describe("FractalExplorer — WebGL unavailable", () => {
  let mock2D: ReturnType<typeof createMock2D>;

  beforeEach(() => {
    mock2D = createMock2D();
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === "2d") return mock2D;
      return null;
    }) as any;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = origGetContext;
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows fallback message", () => {
    render(<FractalExplorer />);
    expect(screen.getByText("WebGL 2 not supported")).toBeTruthy();
  });

  it("compact renders without crashing", () => {
    const { container } = render(<FractalExplorer compact />);
    expect(container.firstChild).toBeTruthy();
  });

  it("compact mode does not render controls", () => {
    render(<FractalExplorer compact />);
    expect(screen.queryByText("Mandelbrot")).toBeNull();
    expect(screen.queryByText("Bookmark")).toBeNull();
  });
});

describe("FractalExplorer — WebGL available", () => {
  const mockGL = createMockWebGL2();
  let mock2D: ReturnType<typeof createMock2D>;

  beforeEach(() => {
    mock2D = createMock2D();
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === "webgl2") return mockGL;
      if (type === "2d") return mock2D;
      return null;
    }) as any;
    // Suppress React act warnings from animation frame loops
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = origGetContext;
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders control buttons", () => {
    render(<FractalExplorer />);
    expect(screen.getByText("Mandelbrot")).toBeTruthy();
    expect(screen.getByText("Julia")).toBeTruthy();
    expect(screen.getByText("Pan")).toBeTruthy();
    expect(screen.getByText("Zoom")).toBeTruthy();
  });

  it("renders all 6 palette presets", () => {
    render(<FractalExplorer />);
    ["Amber", "Fire", "Ice", "Plasma", "Forest", "Ocean"].forEach((name) => {
      expect(screen.getByText(name)).toBeTruthy();
    });
  });

  it("renders Shift and Iter sliders", () => {
    render(<FractalExplorer />);
    expect(screen.getByText("Shift")).toBeTruthy();
    expect(screen.getByText("Iter")).toBeTruthy();
  });

  it("renders Bookmark button", () => {
    render(<FractalExplorer />);
    expect(screen.getByText("Bookmark")).toBeTruthy();
  });

  it("shows Julia controls when Julia is selected", async () => {
    const user = userEvent.setup();
    render(<FractalExplorer />);
    await user.click(screen.getByText("Julia"));
    expect(screen.getByText("Cx")).toBeTruthy();
    expect(screen.getByText("Cy")).toBeTruthy();
    expect(screen.getByText("Morph")).toBeTruthy();
  });

  it("toggles morph on/off", async () => {
    const user = userEvent.setup();
    render(<FractalExplorer />);
    await user.click(screen.getByText("Julia"));
    await user.click(screen.getByText("Morph"));
    expect(screen.getByText("Morph On")).toBeTruthy();
    expect(screen.getByText("Speed")).toBeTruthy();
    await user.click(screen.getByText("Morph On"));
    expect(screen.getByText("Morph")).toBeTruthy();
  });

  it("switches cursor mode between Pan and Zoom", async () => {
    const user = userEvent.setup();
    render(<FractalExplorer />);
    await user.click(screen.getByText("Zoom"));
    await user.click(screen.getByText("Pan"));
    expect(screen.getByText("Pan")).toBeTruthy();
  });

  it("hides Julia controls when switching back to Mandelbrot", async () => {
    const user = userEvent.setup();
    render(<FractalExplorer />);
    await user.click(screen.getByText("Julia"));
    expect(screen.getByText("Cx")).toBeTruthy();
    await user.click(screen.getByText("Mandelbrot"));
    expect(screen.queryByText("Cx")).toBeNull();
    expect(screen.queryByText("Cy")).toBeNull();
  });

  it("shows zoom level display with initial value", () => {
    render(<FractalExplorer />);
    // Initial zoom display state is "1.0" before first rAF tick
    expect(screen.getByText("1.0")).toBeTruthy();
  });

  it("renders two canvases", () => {
    render(<FractalExplorer />);
    expect(document.querySelectorAll("canvas").length).toBe(2);
  });

  it("does not show fallback message", () => {
    render(<FractalExplorer />);
    expect(screen.queryByText("WebGL 2 not supported")).toBeNull();
  });

  it("compact mode still renders canvas", () => {
    render(<FractalExplorer compact />);
    expect(document.querySelectorAll("canvas").length).toBe(2);
  });
});

describe("FractalExplorer — URL restore", () => {
  const mockGL = createMockWebGL2();
  let mock2D: ReturnType<typeof createMock2D>;

  beforeEach(() => {
    mock2D = createMock2D();
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === "webgl2") return mockGL;
      if (type === "2d") return mock2D;
      return null;
    }) as any;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = origGetContext;
    Object.defineProperty(window, "location", { value: origLocation, writable: true });
    cleanup();
  });

  it("restores Julia state from URL param", () => {
    const state = { cx: -0.75, cy: 0.1, zoom: 0.2, maxIter: 512, type: 1, jr: -0.4, ji: 0.6, pal: 3 };
    const encoded = btoa(JSON.stringify(state));
    Object.defineProperty(window, "location", {
      value: new URL(`http://localhost/gallery?fractal=${encoded}`),
      writable: true,
    });
    render(<FractalExplorer />);
    expect(screen.getByText("Cx")).toBeTruthy();
    expect(screen.getByText("Cy")).toBeTruthy();
  });
});

describe("FractalExplorer — init WebGL failures", () => {
  let mock2D: ReturnType<typeof createMock2D>;

  beforeEach(() => {
    mock2D = createMock2D();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = origGetContext;
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows fallback when shader compile fails", () => {
    const failGL = createMockWebGL2();
    failGL.getShaderParameter = vi.fn().mockReturnValue(false);
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === "webgl2") return failGL;
      if (type === "2d") return mock2D;
      return null;
    }) as any;
    render(<FractalExplorer />);
    expect(screen.getByText("WebGL 2 not supported")).toBeTruthy();
  });

  it("shows fallback when program link fails", () => {
    const failGL = createMockWebGL2();
    failGL.getProgramParameter = vi.fn().mockReturnValue(false);
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === "webgl2") return failGL;
      if (type === "2d") return mock2D;
      return null;
    }) as any;
    render(<FractalExplorer />);
    expect(screen.getByText("WebGL 2 not supported")).toBeTruthy();
  });
});
