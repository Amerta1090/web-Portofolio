import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SimulatedAnnealingTSP from "../SimulatedAnnealingTSP";

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

describe("SimulatedAnnealingTSP", () => {
  it("renders canvas element", () => {
    render(<SimulatedAnnealingTSP />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<SimulatedAnnealingTSP compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows Run, Step, and Reset buttons", () => {
    render(<SimulatedAnnealingTSP />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels.some((l) => l?.includes("Run"))).toBe(true);
    expect(labels).toContain("Step");
    expect(labels).toContain("Reset");
  });

  it("shows preset buttons (10 Cities, 20 Cities, etc.)", () => {
    render(<SimulatedAnnealingTSP />);
    expect(screen.getByRole("button", { name: "10 Cities" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "20 Cities" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Grid" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Circle" })).toBeTruthy();
  });

  it("has Speed, Temperature, and Cooling Rate sliders", () => {
    render(<SimulatedAnnealingTSP />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(3);
  });

  it("shows Clear button", () => {
    render(<SimulatedAnnealingTSP />);
    expect(screen.getByRole("button", { name: "Clear" })).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<SimulatedAnnealingTSP compact />);
    const buttons = screen.queryAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels.some((l) => l?.includes("Run"))).toBe(false);
    expect(labels).not.toContain("Step");
    expect(labels).not.toContain("Reset");
    expect(labels).not.toContain("Clear");
    expect(labels).not.toContain("10 Cities");
  });

  it("displays distance info overlay", () => {
    render(<SimulatedAnnealingTSP />);
    const overlay = document.querySelector(".font-mono");
    expect(overlay).toBeTruthy();
  });

  it("has container with dark bg in compact mode", () => {
    const { container } = render(<SimulatedAnnealingTSP compact />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders 4 city preset buttons", () => {
    render(<SimulatedAnnealingTSP />);
    const buttons = screen.getAllByRole("button");
    const presetButtons = buttons.filter((b) =>
      ["10 Cities", "20 Cities", "Grid", "Circle"].includes(b.textContent || "")
    );
    expect(presetButtons.length).toBe(4);
  });

  it("has Temperature and Cooling labels", () => {
    render(<SimulatedAnnealingTSP />);
    expect(screen.getByText("T₀")).toBeTruthy();
    expect(screen.getByText("Cooling")).toBeTruthy();
  });

  it("toggles Run to Pause on click", async () => {
    const user = userEvent.setup();
    render(<SimulatedAnnealingTSP />);
    const buttons = screen.getAllByRole("button");
    const runBtn = buttons.find((b) => b.textContent?.includes("Run"))!;
    await user.click(runBtn);
    const afterBtns = screen.getAllByRole("button");
    expect(afterBtns.some((b) => b.textContent?.includes("Pause"))).toBe(true);
  });
});
