import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaylorSeries from "./TaylorSeries";

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

describe("TaylorSeries", () => {
  it("renders canvas element", () => {
    render(<TaylorSeries />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<TaylorSeries compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows function selector buttons (eˣ, sin, cos, ln) in non-compact mode", () => {
    render(<TaylorSeries />);
    expect(screen.getByText("eˣ")).toBeTruthy();
    expect(screen.getByText("sin(x)")).toBeTruthy();
    expect(screen.getByText("cos(x)")).toBeTruthy();
    expect(screen.getByText("ln(1+x)")).toBeTruthy();
  });

  it("shows N term slider (0 to 20)", () => {
    render(<TaylorSeries />);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    expect(slider).toBeTruthy();
    expect(parseInt(slider.min)).toBe(0);
    expect(parseInt(slider.max)).toBe(20);
  });

  it("shows Auto Animate button", () => {
    render(<TaylorSeries />);
    expect(screen.getByText("Auto Animate")).toBeTruthy();
  });

  it("shows formula overlay text in non-compact mode", () => {
    render(<TaylorSeries />);
    const formulaText = screen.getByText(/≈/);
    expect(formulaText).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<TaylorSeries compact />);
    expect(screen.queryByText("Auto Animate")).toBeFalsy();
    expect(screen.queryByText("eˣ")).toBeFalsy();
    expect(screen.queryByText("sin(x)")).toBeFalsy();
    expect(screen.queryByText("cos(x)")).toBeFalsy();
    expect(screen.queryByText("ln(1+x)")).toBeFalsy();
    expect(screen.queryByText("N:")).toBeFalsy();
  });

  it("has container with dark background bg-[#0f0f11]", () => {
    const { container } = render(<TaylorSeries />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("switches function on button click", async () => {
    const user = userEvent.setup();
    render(<TaylorSeries />);
    const cosBtn = screen.getByText("cos(x)");
    await user.click(cosBtn);
    expect(cosBtn.className).toContain("bg-amber-500/20");
    const sinBtn = screen.getByText("sin(x)");
    expect(sinBtn.className).not.toContain("bg-amber-500/20");
  });

  it("has N slider label visible", () => {
    render(<TaylorSeries />);
    expect(screen.getByText("N:")).toBeTruthy();
  });

  it("toggles auto-animate on button click", async () => {
    const user = userEvent.setup();
    render(<TaylorSeries />);
    const autoBtn = screen.getByText("Auto Animate");
    expect(autoBtn).toBeTruthy();
    await user.click(autoBtn);
    expect(screen.getByText("Animating...")).toBeTruthy();
  });
});
