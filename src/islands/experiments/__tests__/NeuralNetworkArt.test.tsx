import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NeuralNetworkArt from "../NeuralNetworkArt";

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
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    putImageData: vi.fn(),
    roundRect: vi.fn(),
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

describe("NeuralNetworkArt", () => {
  it("renders canvas element", () => {
    render(<NeuralNetworkArt />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    const { container } = render(<NeuralNetworkArt compact />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<NeuralNetworkArt />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows Pause/Resume button", () => {
    render(<NeuralNetworkArt />);
    expect(screen.getByText(/Pause/)).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<NeuralNetworkArt />);
    expect(screen.getByText(/Reset/)).toBeTruthy();
  });

  it("shows Speed label", () => {
    render(<NeuralNetworkArt />);
    expect(screen.getByText("Speed")).toBeTruthy();
  });

  it("shows XOR task button", () => {
    render(<NeuralNetworkArt />);
    expect(screen.getByText("XOR")).toBeTruthy();
  });

  it("shows CIRCLE task button", () => {
    render(<NeuralNetworkArt />);
    expect(screen.getByText("CIRCLE")).toBeTruthy();
  });

  it("shows SPIRAL task button", () => {
    render(<NeuralNetworkArt />);
    expect(screen.getByText("SPIRAL")).toBeTruthy();
  });

  it("clicking Reset does not crash", async () => {
    const user = userEvent.setup();
    render(<NeuralNetworkArt />);
    const resetBtn = screen.getByText(/Reset/);
    await user.click(resetBtn);
    expect(resetBtn).toBeTruthy();
  });

  it("compact mode does not show controls", () => {
    render(<NeuralNetworkArt compact />);
    expect(screen.queryByText("Speed")).toBeNull();
    expect(screen.queryByText("XOR")).toBeNull();
    expect(screen.queryByText("CIRCLE")).toBeNull();
    expect(screen.queryByText("SPIRAL")).toBeNull();
    expect(screen.queryByText(/Pause/)).toBeNull();
    expect(screen.queryByText(/Reset/)).toBeNull();
  });

  it("clicking task buttons does not crash", async () => {
    const user = userEvent.setup();
    render(<NeuralNetworkArt />);
    const xorBtn = screen.getByText("XOR");
    const circleBtn = screen.getByText("CIRCLE");
    const spiralBtn = screen.getByText("SPIRAL");
    await user.click(xorBtn);
    await user.click(circleBtn);
    await user.click(spiralBtn);
    expect(spiralBtn).toBeTruthy();
  });

  it("clicking Pause toggles to Resume", async () => {
    const user = userEvent.setup();
    render(<NeuralNetworkArt />);
    const pauseBtn = screen.getByText(/Pause/);
    await user.click(pauseBtn);
    expect(screen.getByText(/Resume/)).toBeTruthy();
  });

  it("clicking Resume toggles back to Pause", async () => {
    const user = userEvent.setup();
    render(<NeuralNetworkArt />);
    await user.click(screen.getByText(/Pause/));
    await user.click(screen.getByText(/Resume/));
    expect(screen.getByText(/Pause/)).toBeTruthy();
  });
});
