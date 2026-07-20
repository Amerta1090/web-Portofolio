import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GradientDescent from "./GradientDescent";

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

describe("GradientDescent", () => {
  it("renders canvas element", () => {
    render(<GradientDescent />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<GradientDescent compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows SGD, Momentum, Adam buttons in non-compact mode", () => {
    render(<GradientDescent />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toContain("SGD");
    expect(labels).toContain("Momentum");
    expect(labels).toContain("Adam");
  });

  it("shows Reset and Chaos buttons", () => {
    render(<GradientDescent />);
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chaos" })).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<GradientDescent compact />);
    const buttons = screen.queryAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).not.toContain("SGD");
    expect(labels).not.toContain("Momentum");
    expect(labels).not.toContain("Adam");
    expect(labels).not.toContain("Reset");
    expect(labels).not.toContain("Chaos");
  });

  it("highlights active optimizer button", () => {
    render(<GradientDescent />);
    const buttons = screen.getAllByRole("button");
    const sgdBtn = buttons.find((b) => b.textContent === "SGD")!;
    expect(sgdBtn.style.backgroundColor).toBeTruthy();
  });

  it("has learning rate slider", () => {
    render(<GradientDescent />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
    expect(sliders[0].getAttribute("min")).toBe("0.01");
    expect(sliders[0].getAttribute("max")).toBe("0.5");
  });

  it("displays formula overlay", () => {
    render(<GradientDescent />);
    const overlay = document.querySelector(".font-mono");
    expect(overlay).toBeTruthy();
  });

  it("has container with dark bg", () => {
    const { container } = render(<GradientDescent />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("can toggle optimizer visibility on button click", async () => {
    const user = userEvent.setup();
    render(<GradientDescent />);
    const buttons = screen.getAllByRole("button");
    const sgdBtn = buttons.find((b) => b.textContent === "SGD")!;
    await user.click(sgdBtn);
    expect(sgdBtn.style.opacity).not.toBe("1");
  });

  it("shows LR label next to slider", () => {
    render(<GradientDescent />);
    expect(screen.getByText("LR:")).toBeTruthy();
  });

  it("renders three optimizer buttons", () => {
    render(<GradientDescent />);
    const buttons = screen.getAllByRole("button");
    const optButtons = buttons.filter(
      (b) => b.textContent === "SGD" || b.textContent === "Momentum" || b.textContent === "Adam"
    );
    expect(optButtons.length).toBe(3);
  });
});
