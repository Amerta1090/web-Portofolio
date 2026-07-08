import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StrangeAttractorZoo from "./StrangeAttractorZoo";

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

describe("StrangeAttractorZoo", () => {
  it("renders canvas element", () => {
    render(<StrangeAttractorZoo />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<StrangeAttractorZoo compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows attractor toggle buttons in non-compact mode", () => {
    render(<StrangeAttractorZoo />);
    expect(screen.getByText("Lorenz")).toBeTruthy();
    expect(screen.getByText("Rössler")).toBeTruthy();
    expect(screen.getByText("Aizawa")).toBeTruthy();
    expect(screen.getByText("Thomas")).toBeTruthy();
  });

  it("shows Reset button in non-compact mode", () => {
    render(<StrangeAttractorZoo />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("shows Chaos Mode button", () => {
    render(<StrangeAttractorZoo />);
    expect(screen.getByText("Chaos Mode")).toBeTruthy();
  });

  it("hides control buttons in compact mode", () => {
    render(<StrangeAttractorZoo compact />);
    expect(screen.queryByText("Lorenz")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
  });

  it("highlights active attractor button", async () => {
    render(<StrangeAttractorZoo />);
    const lorenzBtn = screen.getByText("Lorenz");
    expect(lorenzBtn.className).toContain("amber");
  });

  it("switches attractor on button click", async () => {
    const user = userEvent.setup();
    render(<StrangeAttractorZoo />);
    await user.click(screen.getByText("Rössler"));
    const rosslerBtn = screen.getByText("Rössler");
    expect(rosslerBtn.className).toContain("amber");
  });

  it("has sigma parameter slider", () => {
    render(<StrangeAttractorZoo />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(3);
  });

  it("displays formula/parameter overlay", () => {
    render(<StrangeAttractorZoo />);
    const overlay = document.querySelector(".font-mono");
    expect(overlay).toBeTruthy();
  });

  it("has container with dark background", () => {
    const { container } = render(<StrangeAttractorZoo />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders total 4 attractor choices", () => {
    render(<StrangeAttractorZoo />);
    expect(screen.getByText("Lorenz")).toBeTruthy();
    expect(screen.getByText("Rössler")).toBeTruthy();
    expect(screen.getByText("Aizawa")).toBeTruthy();
    expect(screen.getByText("Thomas")).toBeTruthy();
  });

  it("has sensitivity slider", () => {
    render(<StrangeAttractorZoo />);
    const labels = document.querySelectorAll("label");
    const sensLabel = Array.from(labels).find(l => l.textContent?.includes("Sensitivity"));
    expect(sensLabel).toBeTruthy();
  });
});
