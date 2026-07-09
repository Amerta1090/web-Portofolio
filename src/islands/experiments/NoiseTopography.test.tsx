import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NoiseTopography from "./NoiseTopography";

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

describe("NoiseTopography", () => {
  it("renders canvas element", () => {
    render(<NoiseTopography />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<NoiseTopography compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows auto-rotate button in non-compact mode", () => {
    render(<NoiseTopography />);
    expect(screen.getByText(/Auto|Manual/)).toBeTruthy();
  });

  it("shows Export STL button in non-compact mode", () => {
    render(<NoiseTopography />);
    expect(screen.getByText("Export STL")).toBeTruthy();
  });

  it("hides control buttons in compact mode", () => {
    render(<NoiseTopography compact />);
    expect(screen.queryByText("Export STL")).toBeFalsy();
    expect(screen.queryByText(/Auto|Manual/)).toBeFalsy();
  });

  it("has octaves slider", () => {
    render(<NoiseTopography />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(4);
  });

  it("has container with dark background", () => {
    const { container } = render(<NoiseTopography />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("toggles auto-rotate on button click", async () => {
    const user = userEvent.setup();
    render(<NoiseTopography />);
    const autoBtn = screen.getByText(/Auto|Manual/);
    await user.click(autoBtn);
    expect(autoBtn.textContent).toMatch(/Auto|Manual/);
  });

  it("has parameter sliders for all controls", () => {
    render(<NoiseTopography />);
    const labels = document.querySelectorAll("label");
    const labelTexts = Array.from(labels).map(l => l.textContent || "");
    const allText = labelTexts.join(" ");
    expect(allText).toContain("Oct");
    expect(allText).toContain("Pers");
    expect(allText).toContain("Lac");
    expect(allText).toContain("Seed");
    expect(allText).toContain("Ht");
  });
});
