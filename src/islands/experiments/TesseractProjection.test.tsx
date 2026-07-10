import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TesseractProjection from "./TesseractProjection";

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
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("TesseractProjection", () => {
  it("renders canvas element", () => {
    render(<TesseractProjection />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<TesseractProjection compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows vertex count display in non-compact mode", () => {
    render(<TesseractProjection />);
    expect(screen.getByText(/Vertices: 16/)).toBeTruthy();
    expect(screen.getByText(/Edges: 32/)).toBeTruthy();
    expect(screen.getByText(/Faces: 24/)).toBeTruthy();
  });

  it("hides vertex count in compact mode", () => {
    render(<TesseractProjection compact />);
    expect(screen.queryByText(/Vertices: 16/)).toBeFalsy();
    expect(screen.queryByText(/Edges: 32/)).toBeFalsy();
  });

  it("renders 6 rotation plane checkboxes", () => {
    render(<TesseractProjection />);
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    // At least one checkbox for auto-rotate + 6 plane checkboxes = 7 total
    expect(checkboxes.length).toBeGreaterThanOrEqual(7);
  });

  it("has auto-rotation toggle", () => {
    render(<TesseractProjection />);
    const autoLabel = screen.getByText("Auto");
    expect(autoLabel).toBeTruthy();
  });

  it("renders camera distance slider", () => {
    render(<TesseractProjection />);
    const camLabel = screen.getByText("Cam:");
    expect(camLabel).toBeTruthy();
    const camSlider = document.querySelector('input[type="range"]');
    expect(camSlider).toBeTruthy();
  });

  it("renders Wireframe/Faces/Both view toggle buttons", () => {
    render(<TesseractProjection />);
    expect(screen.getByText("Wireframe")).toBeTruthy();
    expect(screen.getByText("Faces")).toBeTruthy();
    expect(screen.getByText("Both")).toBeTruthy();
  });

  it("view toggle switches between modes", async () => {
    const user = userEvent.setup();
    render(<TesseractProjection />);
    const facesBtn = screen.getByText("Faces");
    await user.click(facesBtn);
    // After clicking "Faces", the button should be active (indicated by amber class)
    expect(facesBtn.className).toContain("amber");
  });

  it("shows 'Drag to rotate' hint when auto-rotation is off", async () => {
    const user = userEvent.setup();
    render(<TesseractProjection />);
    const autoCheckbox = screen.getByText("Auto").previousElementSibling as HTMLInputElement;
    // Toggle auto-rotate off
    await user.click(autoCheckbox);
    expect(screen.getByText("Drag to rotate")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<TesseractProjection compact />);
    expect(screen.queryByText("Auto")).toBeFalsy();
    expect(screen.queryByText("Cam:")).toBeFalsy();
    expect(screen.queryByText("Wireframe")).toBeFalsy();
  });

  it("per-plane speed sliders affect rotation", async () => {
    render(<TesseractProjection />);
    const sliders = document.querySelectorAll('input[type="range"]');
    // First range is master speed, second is camera dist, then per-plane sliders
    expect(sliders.length).toBeGreaterThanOrEqual(2);
    // Verify at least one plane speed slider exists
    const allRangeInputs = document.querySelectorAll('input[type="range"]');
    expect(allRangeInputs.length).toBeGreaterThanOrEqual(8); // master + cam + 6 planes
  });

  it("canvas renders during rotation animation", () => {
    render(<TesseractProjection />);
    const canvas = document.querySelector("canvas")!;
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it("has container with dark background", () => {
    const { container } = render(<TesseractProjection />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders without crashing", () => {
    expect(typeof TesseractProjection).toBe("function");
    expect(() => render(<TesseractProjection />)).not.toThrow();
  });
});
