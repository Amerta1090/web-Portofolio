import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MoirePatterns from "../MoirePatterns";

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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MoirePatterns", () => {
  it("renders a canvas element", () => {
    const { container } = render(<MoirePatterns />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("renders with dark background class", () => {
    const { container } = render(<MoirePatterns />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders in compact mode without controls", () => {
    const { container } = render(<MoirePatterns compact />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Layer 1")).not.toBeInTheDocument();
  });

  it("renders canvas in compact mode", () => {
    const { container } = render(<MoirePatterns compact />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();
  });

  it("shows preset buttons", () => {
    render(<MoirePatterns />);
    expect(screen.getByRole("button", { name: "Classic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Radial" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Typography" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spiral" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom" })).toBeInTheDocument();
  });

  it("shows blend mode buttons", () => {
    render(<MoirePatterns />);
    expect(screen.getByRole("button", { name: "multiply" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "screen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "additive" })).toBeInTheDocument();
  });

  it("shows animation toggle button", () => {
    render(<MoirePatterns />);
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });

  it("toggles animation to Animate when Stop is clicked", async () => {
    const user = userEvent.setup();
    render(<MoirePatterns />);
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(screen.getByRole("button", { name: "Animate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument();
  });

  it("shows speed slider when animating", () => {
    render(<MoirePatterns />);
    expect(screen.getByText("spd")).toBeInTheDocument();
    const sliders = screen.getAllByRole("slider");
    expect(sliders.some((s) => (s as HTMLInputElement).min === "0.1")).toBe(true);
  });

  it("hides speed slider when animation is stopped", async () => {
    const user = userEvent.setup();
    render(<MoirePatterns />);
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(screen.queryByText("spd")).not.toBeInTheDocument();
  });

  it("shows Reset button", () => {
    render(<MoirePatterns />);
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("shows layer selector tabs", () => {
    render(<MoirePatterns />);
    expect(screen.getByRole("button", { name: "Layer 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Layer 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Layer 3" })).toBeInTheDocument();
  });

  it("shows grid type buttons", () => {
    render(<MoirePatterns />);
    expect(screen.getByRole("button", { name: "circles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "lines" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "radial" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "checker" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "dots" })).toBeInTheDocument();
  });

  it("shows rotation slider with label", () => {
    render(<MoirePatterns />);
    expect(screen.getByText("rot")).toBeInTheDocument();
  });

  it("shows frequency slider with label", () => {
    render(<MoirePatterns />);
    expect(screen.getByText("freq")).toBeInTheDocument();
  });

  it("shows color label", () => {
    render(<MoirePatterns />);
    expect(screen.getByText("color")).toBeInTheDocument();
  });

  it("shows auto animation speed slider with label", () => {
    render(<MoirePatterns />);
    expect(screen.getByText("auto")).toBeInTheDocument();
  });

  it("shows drag hint text", () => {
    render(<MoirePatterns />);
    expect(screen.getByText("drag canvas to rotate top layer")).toBeInTheDocument();
  });

  it("hides controls in compact mode", () => {
    render(<MoirePatterns compact />);
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Layer 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "circles" })).not.toBeInTheDocument();
    expect(screen.queryByText("rot")).not.toBeInTheDocument();
    expect(screen.queryByText("freq")).not.toBeInTheDocument();
    expect(screen.queryByText("color")).not.toBeInTheDocument();
    expect(screen.queryByText("auto")).not.toBeInTheDocument();
    expect(screen.queryByText("drag canvas to rotate top layer")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Classic" })).not.toBeInTheDocument();
  });
});
