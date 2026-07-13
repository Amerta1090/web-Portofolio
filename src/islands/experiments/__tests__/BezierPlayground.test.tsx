import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BezierPlayground from "../BezierPlayground";

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
    globalAlpha: 1,
    font: "",
    textAlign: "" as CanvasTextAlign,
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    roundRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    setTimeout(() => cb(performance.now()), 16);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("BezierPlayground", () => {
  it("renders a canvas element", () => {
    render(<BezierPlayground />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders canvas in compact mode", () => {
    render(<BezierPlayground compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<BezierPlayground />);
    const root = container.querySelector(".bg-\\[\\#0f0f11\\]");
    expect(root).toBeTruthy();
  });

  it("shows curve type selector buttons", () => {
    render(<BezierPlayground />);
    expect(screen.getByText("Bézier")).toBeTruthy();
    expect(screen.getByText("B-Spline")).toBeTruthy();
    expect(screen.getByText("Catmull-Rom")).toBeTruthy();
  });

  it("shows Construction toggle button", () => {
    render(<BezierPlayground />);
    expect(screen.getByText("Construction OFF")).toBeTruthy();
  });

  it("shows preset buttons", () => {
    render(<BezierPlayground />);
    expect(screen.getByText("S-Curve")).toBeTruthy();
    expect(screen.getByText("Loop")).toBeTruthy();
    expect(screen.getByText("Star")).toBeTruthy();
    expect(screen.getByText("Spiral")).toBeTruthy();
  });

  it("shows Clear button", () => {
    render(<BezierPlayground />);
    expect(screen.getByText("Clear")).toBeTruthy();
  });

  it("shows point count display", () => {
    render(<BezierPlayground />);
    expect(screen.getByText("0 points, Degree 0")).toBeTruthy();
  });

  it("shows instruction text", () => {
    render(<BezierPlayground />);
    expect(screen.getByText("Click to add points, drag to move")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<BezierPlayground compact />);
    expect(screen.queryByText("Bézier")).toBeNull();
    expect(screen.queryByText("Clear")).toBeNull();
    expect(screen.queryByText("Construction OFF")).toBeNull();
    expect(screen.queryByText("Click to add points, drag to move")).toBeNull();
  });

  it("toggles Construction ON on click", async () => {
    const user = userEvent.setup();
    render(<BezierPlayground />);
    const btn = screen.getByText("Construction OFF");
    await user.click(btn);
    expect(screen.getByText("Construction ON")).toBeTruthy();
  });

  it("toggles Construction back OFF on second click", async () => {
    const user = userEvent.setup();
    render(<BezierPlayground />);
    const btn = screen.getByText("Construction OFF");
    await user.click(btn);
    await user.click(screen.getByText("Construction ON"));
    expect(screen.getByText("Construction OFF")).toBeTruthy();
  });

  it("shows Animate t button when Construction is ON", async () => {
    const user = userEvent.setup();
    render(<BezierPlayground />);
    await user.click(screen.getByText("Construction OFF"));
    expect(screen.getByText("Animate t")).toBeTruthy();
  });

  it("hides Animate t button when Construction is OFF", () => {
    render(<BezierPlayground />);
    expect(screen.queryByText("Animate t")).toBeNull();
  });

  it("highlights active curve type button", () => {
    render(<BezierPlayground />);
    const bezierBtn = screen.getByText("Bézier");
    expect(bezierBtn.className).toContain("bg-amber-500/20");
    expect(bezierBtn.className).toContain("text-amber-400");
  });

  it("changes active curve type on click", async () => {
    const user = userEvent.setup();
    render(<BezierPlayground />);
    await user.click(screen.getByText("B-Spline"));
    const bsplineBtn = screen.getByText("B-Spline");
    expect(bsplineBtn.className).toContain("bg-amber-500/20");
    const bezierBtn = screen.getByText("Bézier");
    expect(bezierBtn.className).toContain("bg-white/5");
  });
});
