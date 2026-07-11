import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WaveFunctionCollapse from "../WaveFunctionCollapse";

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

describe("WaveFunctionCollapse", () => {
  it("renders canvas element", () => {
    render(<WaveFunctionCollapse />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<WaveFunctionCollapse compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<WaveFunctionCollapse />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows stats overlay with cells remaining, steps, and collapsed", () => {
    render(<WaveFunctionCollapse />);
    expect(screen.getByText(/remaining:/)).toBeTruthy();
    expect(screen.getByText(/steps:/)).toBeTruthy();
    expect(screen.getByText(/collapsed:/)).toBeTruthy();
  });

  it("shows Step button", () => {
    render(<WaveFunctionCollapse />);
    expect(screen.getByText("Step")).toBeTruthy();
  });

  it("shows Auto button", () => {
    render(<WaveFunctionCollapse />);
    expect(screen.getByText("Auto")).toBeTruthy();
  });

  it("shows Pause button", () => {
    render(<WaveFunctionCollapse />);
    expect(screen.getByText("Pause")).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<WaveFunctionCollapse />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("has speed slider", () => {
    render(<WaveFunctionCollapse />);
    const labels = document.querySelectorAll("label");
    const speedLabel = Array.from(labels).find((l) =>
      l.textContent?.toLowerCase().includes("speed")
    );
    expect(speedLabel).toBeTruthy();
    const slider = speedLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("has grid size slider", () => {
    render(<WaveFunctionCollapse />);
    const labels = document.querySelectorAll("label");
    const gridLabel = Array.from(labels).find((l) =>
      l.textContent?.toLowerCase().includes("grid")
    );
    expect(gridLabel).toBeTruthy();
    const slider = gridLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("shows entropy heatmap toggle", () => {
    render(<WaveFunctionCollapse />);
    const btn = screen.getByText("entropy");
    expect(btn).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<WaveFunctionCollapse compact />);
    expect(screen.queryByText("Step")).toBeFalsy();
    expect(screen.queryByText("Auto")).toBeFalsy();
    expect(screen.queryByText("Pause")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("entropy")).toBeFalsy();
  });
});
