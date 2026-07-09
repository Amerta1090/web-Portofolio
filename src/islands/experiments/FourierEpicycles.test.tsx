import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FourierEpicycles from "./FourierEpicycles";

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

async function simulateDrawing() {
  const canvas = document.querySelector("canvas")!;
  fireEvent.pointerDown(canvas, { clientX: 200, clientY: 250, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 220, clientY: 270, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 240, clientY: 280, pointerId: 1 });
  fireEvent.pointerMove(canvas, { clientX: 260, clientY: 260, pointerId: 1 });
  fireEvent.pointerUp(canvas, { clientX: 260, clientY: 260, pointerId: 1 });
}

describe("FourierEpicycles", () => {
  it("renders canvas element", () => {
    render(<FourierEpicycles />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<FourierEpicycles compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows 'Draw' button in non-compact mode", () => {
    render(<FourierEpicycles />);
    expect(screen.getByText("Draw a closed shape")).toBeTruthy();
  });

  it("shows 'Epicycles' mode button in non-compact mode", () => {
    render(<FourierEpicycles />);
    expect(screen.getByText("Epicycles →")).toBeTruthy();
  });

  it("shows N slider with max=100", async () => {
    render(<FourierEpicycles />);
    await simulateDrawing();
    await waitFor(() => {
      const sliders = document.querySelectorAll('input[type="range"]');
      const nSlider = Array.from(sliders).find(
        (s) => (s as HTMLInputElement).max === "100"
      );
      expect(nSlider).toBeTruthy();
    });
  });

  it("hides controls in compact mode", () => {
    render(<FourierEpicycles compact />);
    expect(screen.queryByText("Draw a closed shape")).toBeFalsy();
    expect(screen.queryByText("Epicycles →")).toBeFalsy();
  });

  it("has container with dark background 'bg-[#0f0f11]'", () => {
    const { container } = render(<FourierEpicycles />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("has Speed slider", async () => {
    render(<FourierEpicycles />);
    await simulateDrawing();
    await waitFor(() => {
      expect(screen.getByText("Speed:")).toBeTruthy();
    });
  });

  it("toggles between Draw and Epicycles mode", async () => {
    const user = userEvent.setup();
    render(<FourierEpicycles />);
    const toggleBtn = screen.getByText("Epicycles →");
    await user.click(toggleBtn);
    expect(screen.getByText("← Draw")).toBeTruthy();
  });

  it("has Clear button", async () => {
    render(<FourierEpicycles />);
    await simulateDrawing();
    await waitFor(() => {
      expect(screen.getByText("Clear")).toBeTruthy();
    });
  });

  it("shows Show/Hide Circles toggle", async () => {
    render(<FourierEpicycles />);
    await simulateDrawing();
    await waitFor(() => {
      expect(screen.getByText("Hide Circles")).toBeTruthy();
    });
  });

  it("render function uses proper imports", () => {
    expect(typeof FourierEpicycles).toBe("function");
    expect(() => render(<FourierEpicycles />)).not.toThrow();
  });
});
