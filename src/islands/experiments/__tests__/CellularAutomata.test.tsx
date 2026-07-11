import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CellularAutomata from "../CellularAutomata";

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

describe("CellularAutomata", () => {
  it("renders canvas element", () => {
    render(<CellularAutomata />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<CellularAutomata compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<CellularAutomata />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("has 1D/2D mode toggle buttons", () => {
    render(<CellularAutomata />);
    expect(screen.getByText("1D")).toBeTruthy();
    expect(screen.getByText("2D")).toBeTruthy();
  });

  it("shows 1D rule selector buttons", () => {
    render(<CellularAutomata />);
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("90")).toBeTruthy();
    expect(screen.getByText("110")).toBeTruthy();
    expect(screen.getByText("184")).toBeTruthy();
    expect(screen.getByText("54")).toBeTruthy();
    expect(screen.getByText("11")).toBeTruthy();
  });

  it("shows Play/Pause button", () => {
    render(<CellularAutomata />);
    const btn = screen.getByText("Pause");
    expect(btn).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<CellularAutomata />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("shows Clear button", () => {
    render(<CellularAutomata />);
    expect(screen.getByText("Clear")).toBeTruthy();
  });

  it("has speed slider", () => {
    render(<CellularAutomata />);
    const labels = document.querySelectorAll("label");
    const speedLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("speed")
    );
    expect(speedLabel).toBeTruthy();
    const slider = speedLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("shows generation counter", () => {
    render(<CellularAutomata />);
    expect(screen.getByText(/gen:/)).toBeTruthy();
  });

  it("shows population counter", () => {
    render(<CellularAutomata />);
    expect(screen.getByText(/pop:/)).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<CellularAutomata compact />);
    expect(screen.queryByText("1D")).toBeFalsy();
    expect(screen.queryByText("2D")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("Clear")).toBeFalsy();
    expect(screen.queryByText("Pause")).toBeFalsy();
    expect(screen.queryByText("Play")).toBeFalsy();
  });
});
