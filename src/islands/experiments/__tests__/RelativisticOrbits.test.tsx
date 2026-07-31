import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RelativisticOrbits from "../RelativisticOrbits";

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
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    canvas: {} as HTMLCanvasElement,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    font: "",
    textAlign: "" as CanvasTextAlign,
    textBaseline: "" as CanvasTextBaseline,
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

const origGetContext = HTMLCanvasElement.prototype.getContext;

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
  // biome-ignore lint/complexity/useArrowFunction: ResizeObserver must be constructable with `new`, arrow functions are not
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    };
  });
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = origGetContext;
  cleanup();
  vi.restoreAllMocks();
});

describe("RelativisticOrbits", () => {
  it("renders canvas element", () => {
    render(<RelativisticOrbits />);
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("renders in compact mode", () => {
    render(<RelativisticOrbits compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("has dark background class", () => {
    render(<RelativisticOrbits />);
    const container = document.querySelector(".bg-\\[\\#0f0f11\\]");
    expect(container).not.toBeNull();
  });

  it("shows Play/Pause button", () => {
    render(<RelativisticOrbits />);
    expect(screen.getByText(/Pause|Play/)).toBeDefined();
  });

  it("shows Reset button", () => {
    render(<RelativisticOrbits />);
    expect(screen.getByText(/Reset/)).toBeDefined();
  });

  it("shows Speed slider", () => {
    render(<RelativisticOrbits />);
    expect(screen.getByText("Speed:")).toBeDefined();
  });

  it("shows Mass slider", () => {
    render(<RelativisticOrbits />);
    expect(screen.getByText("Mass:")).toBeDefined();
  });

  it("displays Schwarzschild radius R_s", () => {
    render(<RelativisticOrbits />);
    expect(document.body.textContent).toContain("Rs");
  });

  it("displays photon sphere R_ph", () => {
    render(<RelativisticOrbits />);
    expect(document.body.textContent).toContain("Rph");
  });

  it("displays perihelion shift Δφ", () => {
    render(<RelativisticOrbits />);
    const shiftElements = screen.getAllByText(/Δφ/);
    expect(shiftElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays orbit counter", () => {
    render(<RelativisticOrbits />);
    expect(screen.getByText(/Orbits:/)).toBeDefined();
  });

  it("Pause/Play toggle works", async () => {
    const user = userEvent.setup();
    render(<RelativisticOrbits />);
    const pauseBtn = screen.getByText(/Pause|Play/);
    await user.click(pauseBtn);
    expect(screen.getByText("▶ Play")).toBeDefined();
  });

  it("compact mode hides controls", () => {
    render(<RelativisticOrbits compact />);
    expect(screen.queryByText(/Pause/)).toBeNull();
    expect(screen.queryByText(/Reset/)).toBeNull();
    expect(screen.queryByText("Speed:")).toBeNull();
    expect(screen.queryByText("Mass:")).toBeNull();
  });

  it("compact mode shows orbit count", () => {
    render(<RelativisticOrbits compact />);
    const overlay = document.querySelector(".pointer-events-none");
    expect(overlay).not.toBeNull();
  });

  it("renders with different mass value", () => {
    render(<RelativisticOrbits />);
    const massLabel = screen.getByText("1");
    expect(massLabel).toBeDefined();
  });
});
