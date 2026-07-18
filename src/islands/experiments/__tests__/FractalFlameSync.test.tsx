import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FractalFlameSync from "../FractalFlameSync";

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
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    globalCompositeOperation: "" as GlobalCompositeOperation,
    filter: "",
    drawImage: vi.fn(),
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
  Object.defineProperty(navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
    writable: true,
  });
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = origGetContext;
  cleanup();
  vi.restoreAllMocks();
});

describe("FractalFlameSync", () => {
  it("renders canvas element", () => {
    const { container } = render(<FractalFlameSync />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("renders in compact mode without crashing", () => {
    const { container } = render(<FractalFlameSync compact />);
    expect(container.firstChild).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<FractalFlameSync />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows Static mode button", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("Static")).toBeDefined();
  });

  it("shows Mic mode button", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("Mic")).toBeDefined();
  });

  it("shows File mode button", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("File")).toBeDefined();
  });

  it("shows Reset button", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("Reset")).toBeDefined();
  });

  it("shows HEAT color mode button", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("heat")).toBeDefined();
  });

  it("shows COOL color mode button", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("cool")).toBeDefined();
  });

  it("shows RAINBOW color mode button", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("rainbow")).toBeDefined();
  });

  it("shows Speed label and slider", () => {
    render(<FractalFlameSync />);
    expect(screen.getByText("Spd")).toBeDefined();
    const sliders = screen.getAllByRole("slider");
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it("shows variation weight labels", () => {
    render(<FractalFlameSync />);
    const expected = ["Line", "Sinu", "Sphe", "Swir", "Hors", "Hear"];
    for (const label of expected) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("compact mode does not show controls", () => {
    render(<FractalFlameSync compact />);
    expect(screen.queryByText("Static")).toBeNull();
    expect(screen.queryByText("Mic")).toBeNull();
    expect(screen.queryByText("File")).toBeNull();
    expect(screen.queryByText("Reset")).toBeNull();
    expect(screen.queryByText("Spd")).toBeNull();
  });
});
