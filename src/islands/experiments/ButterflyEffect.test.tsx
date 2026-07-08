import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ButterflyEffect from "./ButterflyEffect";

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
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    setTimeout(() => cb(performance.now()), 16);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ButterflyEffect", () => {
  it("renders canvas element", () => {
    render(<ButterflyEffect />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<ButterflyEffect compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows system toggle button (Lorenz/Rössler)", () => {
    render(<ButterflyEffect />);
    expect(screen.getByText("Lorenz")).toBeTruthy();
  });

  it("shows Lyapunov exponent display", () => {
    render(<ButterflyEffect />);
    expect(screen.getByText(/λ/)).toBeTruthy();
  });

  it("shows Spread slider", () => {
    render(<ButterflyEffect />);
    const labels = document.querySelectorAll("label");
    const spreadLabel = Array.from(labels).find(l => l.textContent?.includes("Spread"));
    expect(spreadLabel).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<ButterflyEffect />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("shows Chaos button", () => {
    render(<ButterflyEffect />);
    expect(screen.getByText("Chaos")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<ButterflyEffect compact />);
    expect(screen.queryByText("Lorenz")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
  });

  it("has parameter sliders for sigma, rho, beta", () => {
    render(<ButterflyEffect />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(3);
  });

  it("toggles between Lorenz and Rössler on click", async () => {
    const user = userEvent.setup();
    render(<ButterflyEffect />);
    const btn = screen.getByText("Lorenz");
    await user.click(btn);
    expect(screen.getByText("Rössler")).toBeTruthy();
  });

  it("has container with dark background", () => {
    const { container } = render(<ButterflyEffect />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("has crosshair cursor on canvas", () => {
    render(<ButterflyEffect />);
    const canvas = document.querySelector("canvas");
    expect(canvas?.className).toContain("cursor-crosshair");
  });

  it("renders without crashing with all controls", () => {
    const { container } = render(<ButterflyEffect />);
    const labels = container.querySelectorAll("label");
    expect(labels.length).toBeGreaterThanOrEqual(3);
  });
});
