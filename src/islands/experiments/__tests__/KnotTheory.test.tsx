import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import KnotTheory from "../KnotTheory";

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
    ellipse: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: vi.fn(),
    canvas: { width: 100, height: 100 } as HTMLCanvasElement,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: "" as GlobalCompositeOperation,
    font: "",
    textAlign: "" as CanvasTextAlign,
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  vi.useFakeTimers();
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  });
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,...");
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    return setTimeout(() => cb(performance.now()), 16) as unknown as number;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    clearTimeout(id);
  });
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
  });
  Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
    width: 800, height: 600, top: 0, left: 0,
    bottom: 600, right: 800, x: 0, y: 0, toJSON: vi.fn(),
  });
});

afterEach(() => {
  vi.advanceTimersByTime(100);
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("KnotTheory", () => {
  it("renders canvas element in DOM", () => {
    const { container } = render(<KnotTheory />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background on container", () => {
    const { container } = render(<KnotTheory />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("compact mode renders without controls", () => {
    const { container } = render(<KnotTheory compact />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(screen.queryByText("Trefoil")).not.toBeInTheDocument();
    expect(screen.queryByText("2D Diagram")).not.toBeInTheDocument();
    expect(screen.queryByText("Move I")).not.toBeInTheDocument();
    expect(screen.queryByText("Speed")).not.toBeInTheDocument();
  });

  it("shows knot preset buttons", () => {
    render(<KnotTheory />);
    expect(screen.getByText("Trefoil (3₁)")).toBeInTheDocument();
    expect(screen.getByText("Figure-Eight (4₁)")).toBeInTheDocument();
    expect(screen.getByText("Cinquefoil (5₁)")).toBeInTheDocument();
  });

  it("shows Reidemeister move buttons", () => {
    render(<KnotTheory />);
    expect(screen.getByText("Move I")).toBeInTheDocument();
    expect(screen.getByText("Move II")).toBeInTheDocument();
    expect(screen.getByText("Move III")).toBeInTheDocument();
  });

  it("shows 3D view toggle", () => {
    render(<KnotTheory />);
    expect(screen.getByText("3D Wireframe")).toBeInTheDocument();
  });

  it("shows crossing info in invariants panel", () => {
    render(<KnotTheory />);
    expect(screen.getByText("Crossings:")).toBeInTheDocument();
    expect(screen.getByText("Writhe:")).toBeInTheDocument();
    expect(screen.getByText("Tricolorable:")).toBeInTheDocument();
    expect(screen.getByText("Jones polynomial:")).toBeInTheDocument();
  });

  it("clicking preset changes knot", () => {
    render(<KnotTheory />);
    vi.advanceTimersByTime(50);
    const btn = screen.getByText("Figure-Eight (4₁)");
    fireEvent.click(btn);
    expect(btn).toHaveClass("bg-amber-500/90");
  });

  it("shows auto-rotate toggle", () => {
    render(<KnotTheory />);
    expect(screen.getByText("Rotate")).toBeInTheDocument();
  });

  it("shows speed slider", () => {
    render(<KnotTheory />);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "1.5");
  });

  it("shows crossing gap toggle", () => {
    render(<KnotTheory />);
    const crossingsBtn = screen.getByText("Crossings");
    expect(crossingsBtn).toBeInTheDocument();
  });

  it("compact mode hides all controls", () => {
    render(<KnotTheory compact />);
    expect(screen.queryByText("Trefoil (3₁)")).not.toBeInTheDocument();
    expect(screen.queryByText("Figure-Eight (4₁)")).not.toBeInTheDocument();
    expect(screen.queryByText("Cinquefoil (5₁)")).not.toBeInTheDocument();
    expect(screen.queryByText("Hopf Link")).not.toBeInTheDocument();
    expect(screen.queryByText("Unknot (0₁)")).not.toBeInTheDocument();
    expect(screen.queryByText("Move I")).not.toBeInTheDocument();
    expect(screen.queryByText("Move II")).not.toBeInTheDocument();
    expect(screen.queryByText("Move III")).not.toBeInTheDocument();
    expect(screen.queryByText("2D Diagram")).not.toBeInTheDocument();
    expect(screen.queryByText("3D Wireframe")).not.toBeInTheDocument();
    expect(screen.queryByText("Rotate")).not.toBeInTheDocument();
    expect(screen.queryByText("Speed")).not.toBeInTheDocument();
    expect(screen.queryByText("Crossings")).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});
