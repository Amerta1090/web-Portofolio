import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RiemannSum from "./RiemannSum";

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
  global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("RiemannSum", () => {
  it("renders canvas element", () => {
    render(<RiemannSum />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<RiemannSum compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows method selector buttons (Left, Right, Midpoint, Trapezoidal)", () => {
    render(<RiemannSum />);
    expect(screen.getAllByText("Left").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Right").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Midpoint").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Trapezoidal").length).toBeGreaterThanOrEqual(1);
  });

  it("shows N partition slider (2 to 100)", () => {
    render(<RiemannSum />);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider).toBeTruthy();
    expect(parseInt(slider.min)).toBe(2);
    expect(parseInt(slider.max)).toBe(100);
  });

  it("shows Animate button", () => {
    render(<RiemannSum />);
    expect(screen.getByText("Animate")).toBeTruthy();
  });

  it("shows preset selectors (x², sin, 1/x)", () => {
    render(<RiemannSum />);
    expect(screen.getByText("f(x) = x²")).toBeTruthy();
    expect(screen.getByText("f(x) = sin(x)")).toBeTruthy();
    expect(screen.getByText("f(x) = 1/x")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<RiemannSum compact />);
    expect(screen.queryByText("Left")).toBeFalsy();
    expect(screen.queryByText("Animate")).toBeFalsy();
    expect(screen.queryByText("f(x) = x²")).toBeFalsy();
  });

  it("has container with dark background", () => {
    const { container } = render(<RiemannSum />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("switches Riemann method on button click", async () => {
    const user = userEvent.setup();
    render(<RiemannSum />);
    const rightBtn = screen.getByText("Right");
    await user.click(rightBtn);
    expect(rightBtn.className).toContain("bg-amber-500/20");
    const leftBtn = screen.getByText("Left");
    expect(leftBtn.className).not.toContain("bg-amber-500/20");
  });

  it("has N slider label visible in non-compact mode", () => {
    render(<RiemannSum />);
    const labels = document.querySelectorAll("label");
    const labelTexts = Array.from(labels).map(l => l.textContent || "");
    const allText = labelTexts.join(" ");
    expect(allText).toContain("N:");
  });

  it("switches preset on button click", async () => {
    const user = userEvent.setup();
    render(<RiemannSum />);
    const sinBtn = screen.getByText("f(x) = sin(x)");
    await user.click(sinBtn);
    expect(sinBtn.className).toContain("bg-amber-500/20");
    const x2Btn = screen.getByText("f(x) = x²");
    expect(x2Btn.className).not.toContain("bg-amber-500/20");
  });

  it("render function uses proper imports", () => {
    expect(typeof RiemannSum).toBe("function");
    expect(() => render(<RiemannSum />)).not.toThrow();
  });
});
