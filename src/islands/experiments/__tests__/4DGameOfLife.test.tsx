import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FourDGameOfLife from "../4DGameOfLife";

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

const origGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  }) as any;
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
  HTMLCanvasElement.prototype.getContext = origGetContext;
  cleanup();
  vi.restoreAllMocks();
});

describe("FourDGameOfLife", () => {
  it("renders canvas element", () => {
    render(<FourDGameOfLife />);
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("renders in compact mode", () => {
    render(<FourDGameOfLife compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("has dark background class", () => {
    render(<FourDGameOfLife />);
    const container = document.querySelector(".bg-\\[\\#0f0f11\\]");
    expect(container).not.toBeNull();
  });

  it("shows Play/Pause button", () => {
    render(<FourDGameOfLife />);
    const pauseBtn = screen.getByText(/Pause|Play/);
    expect(pauseBtn).toBeDefined();
  });

  it("shows Step button", () => {
    render(<FourDGameOfLife />);
    expect(screen.getByText(/Step/)).toBeDefined();
  });

  it("shows Reset button", () => {
    render(<FourDGameOfLife />);
    expect(screen.getByText(/Reset/)).toBeDefined();
  });

  it("shows Speed label", () => {
    render(<FourDGameOfLife />);
    expect(screen.getByText("Speed:")).toBeDefined();
  });

  it("shows rule selector with Standard 4D, HighLife 4D, Custom options", () => {
    render(<FourDGameOfLife />);
    const selects = screen.getAllByRole("combobox");
    const ruleSelect = selects[0];
    const options = ruleSelect.querySelectorAll("option");
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain("Standard 4D");
    expect(labels).toContain("HighLife 4D");
    expect(labels).toContain("Custom");
  });

  it("shows pattern selector with Random, 4D Glider, 4D Oscillator options", () => {
    render(<FourDGameOfLife />);
    const selects = screen.getAllByRole("combobox");
    const patternSelect = selects[1];
    const options = patternSelect.querySelectorAll("option");
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain("Random");
    expect(labels).toContain("4D Glider");
    expect(labels).toContain("4D Oscillator");
  });

  it("shows Rotate toggle button", () => {
    render(<FourDGameOfLife />);
    expect(screen.getByText(/Rotate/)).toBeDefined();
  });

  it("shows Grid toggle button", () => {
    render(<FourDGameOfLife />);
    expect(screen.getByText(/Grid/)).toBeDefined();
  });

  it("displays generation counter text", () => {
    render(<FourDGameOfLife />);
    expect(screen.getByText(/Gen:/)).toBeDefined();
  });

  it("compact mode does not show controls", () => {
    render(<FourDGameOfLife compact />);
    expect(screen.queryByText(/Pause/)).toBeNull();
    expect(screen.queryByText(/Step/)).toBeNull();
    expect(screen.queryByText(/Reset/)).toBeNull();
    expect(screen.queryByText("Speed:")).toBeNull();
    expect(screen.queryByText(/Rotate/)).toBeNull();
    expect(screen.queryByText(/Grid/)).toBeNull();
    expect(screen.queryByText(/Gen:/)).toBeNull();
  });
});
