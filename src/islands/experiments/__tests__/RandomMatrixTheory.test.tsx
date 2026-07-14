import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import RandomMatrixTheory from "../RandomMatrixTheory";

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
    shadowColor: "",
    shadowBlur: 0,
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
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

function flushGenerate() {
  act(() => {
    vi.advanceTimersByTime(100);
  });
}

describe("RandomMatrixTheory", () => {
  it("renders canvas element", () => {
    render(<RandomMatrixTheory />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background", () => {
    const { container } = render(<RandomMatrixTheory />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows ensemble selector buttons GOE, GUE, GSE", () => {
    render(<RandomMatrixTheory />);
    expect(screen.getByRole("button", { name: "GOE" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "GUE" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "GSE" })).toBeTruthy();
  });

  it("shows Generate button after initial generation completes", () => {
    render(<RandomMatrixTheory />);
    flushGenerate();
    expect(screen.getByRole("button", { name: "Generate" })).toBeTruthy();
  });

  it("shows matrix size slider with default value 50", () => {
    render(<RandomMatrixTheory />);
    const sliders = document.querySelectorAll('input[type="range"]');
    const sizeSlider = sliders[0] as HTMLInputElement;
    expect(sizeSlider).toBeTruthy();
    expect(Number(sizeSlider.value)).toBe(50);
  });

  it("shows sample count slider with default value 200", () => {
    render(<RandomMatrixTheory />);
    const sliders = document.querySelectorAll('input[type="range"]');
    const sampleSlider = sliders[1] as HTMLInputElement;
    expect(sampleSlider).toBeTruthy();
    expect(Number(sampleSlider.value)).toBe(200);
  });

  it("shows Auto toggle button", () => {
    render(<RandomMatrixTheory />);
    expect(screen.getByRole("button", { name: "Auto" })).toBeTruthy();
  });

  it("shows stats display with Mean spacing and Level repulsion", () => {
    render(<RandomMatrixTheory />);
    flushGenerate();
    expect(screen.getByText(/Mean spacing/)).toBeTruthy();
    expect(screen.getByText(/Level repulsion/)).toBeTruthy();
  });

  it("clicking GUE ensemble button changes active mode", () => {
    render(<RandomMatrixTheory />);
    flushGenerate();
    const gue = screen.getByRole("button", { name: "GUE" });
    fireEvent.click(gue);
    expect(gue.className).toContain("bg-amber-500/20");
    const goe = screen.getByRole("button", { name: "GOE" });
    expect(goe.className).not.toContain("bg-amber-500/20");
  });

  it("clicking GSE ensemble button changes active mode", () => {
    render(<RandomMatrixTheory />);
    flushGenerate();
    const gse = screen.getByRole("button", { name: "GSE" });
    fireEvent.click(gse);
    expect(gse.className).toContain("bg-amber-500/20");
    const goe = screen.getByRole("button", { name: "GOE" });
    expect(goe.className).not.toContain("bg-amber-500/20");
  });

  it("clicking Auto button toggles auto-generate mode", () => {
    render(<RandomMatrixTheory />);
    flushGenerate();
    const autoBtn = screen.getByRole("button", { name: "Auto" });
    expect(autoBtn.className).not.toContain("bg-amber-500/20");
    fireEvent.click(autoBtn);
    expect(autoBtn.className).toContain("bg-amber-500/20");
  });

  it("compact mode renders without controls", () => {
    render(<RandomMatrixTheory compact={true} />);
    expect(screen.queryByRole("button", { name: "GOE" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Generate" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Auto" })).toBeNull();
    expect(document.querySelectorAll('input[type="range"]').length).toBe(0);
  });

  it("compact mode renders canvas", () => {
    render(<RandomMatrixTheory compact={true} />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("compact mode has dark background", () => {
    const { container } = render(<RandomMatrixTheory compact={true} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });
});
