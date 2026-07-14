import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MathSonification from "../MathSonification";

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
    roundRect: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  });
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,...");
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    setTimeout(() => cb(performance.now()), 16);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
  });
  vi.stubGlobal(
    "AudioContext",
    class {
      state = "running";
      currentTime = 0;
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      close = vi.fn().mockResolvedValue(undefined);
      createOscillator = vi.fn().mockReturnValue({
        type: "",
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      });
      createGain = vi.fn().mockReturnValue({
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      });
    },
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MathSonification", () => {
  it("renders canvas element", () => {
    render(<MathSonification />);
    const canvases = document.querySelectorAll("canvas");
    expect(canvases.length).toBeGreaterThanOrEqual(1);
  });

  it("has dark background", () => {
    const { container } = render(<MathSonification />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("compact mode renders without controls", () => {
    render(<MathSonification compact />);
    expect(screen.queryByText("Play")).not.toBeInTheDocument();
    expect(screen.queryByText("Stop")).not.toBeInTheDocument();
    expect(screen.queryByText("Primes")).not.toBeInTheDocument();
    expect(screen.queryByText("Tempo")).not.toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("shows mode selector buttons", () => {
    render(<MathSonification />);
    expect(screen.getByText("Primes")).toBeInTheDocument();
    expect(screen.getByText("π Digits")).toBeInTheDocument();
    expect(screen.getByText("Bifurcation")).toBeInTheDocument();
    expect(screen.getByText("Fractal")).toBeInTheDocument();
  });

  it("shows play/stop button", () => {
    render(<MathSonification />);
    expect(screen.getByText("▶ Play")).toBeInTheDocument();
  });

  it("shows tempo slider", () => {
    render(<MathSonification />);
    expect(screen.getByText("Tempo")).toBeInTheDocument();
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
  });

  it("shows wave type selector with all options", () => {
    render(<MathSonification />);
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sine" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Square" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Triangle" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sawtooth" })).toBeInTheDocument();
  });

  it("clicking mode button changes mode and stops playback", async () => {
    const user = userEvent.setup();
    render(<MathSonification />);
    const piButton = screen.getByText("π Digits");
    await user.click(piButton);
    expect(piButton.className).toContain("bg-[#f59e0b]");
    expect(piButton.className).toContain("text-black");
    const primesButton = screen.getByText("Primes");
    expect(primesButton.className).toContain("bg-white/10");
  });

  it("clicking play button starts audio and changes to stop", async () => {
    const user = userEvent.setup();
    render(<MathSonification />);
    const playBtn = screen.getByText("▶ Play");
    await user.click(playBtn);
    expect(screen.getByText("■ Stop")).toBeInTheDocument();
  });

  it("tempo slider has default value of 120", () => {
    render(<MathSonification />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("value", "120");
  });

  it("wave type selector is selectable", async () => {
    const user = userEvent.setup();
    render(<MathSonification />);
    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "square");
    expect(select).toHaveValue("square");
    await user.selectOptions(select, "triangle");
    expect(select).toHaveValue("triangle");
  });

  it("compact mode hides all interactive controls", () => {
    render(<MathSonification compact />);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
