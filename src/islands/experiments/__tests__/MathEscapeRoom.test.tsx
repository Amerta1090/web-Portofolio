import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MathEscapeRoom from "../MathEscapeRoom";

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
    shadowColor: "",
    shadowBlur: 0,
    lineCap: "" as CanvasLineCap,
    lineDashOffset: 0,
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    quadraticCurveTo: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

const origGetContext = HTMLCanvasElement.prototype.getContext;
const origGetBCR = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  }) as any;

  Element.prototype.getBoundingClientRect = vi.fn(function () {
    return { width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => "" };
  });

  Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });

  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    setTimeout(() => cb(performance.now()), 16);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
  });
  const store: Record<string, string> = {};
  vi.spyOn(Storage.prototype, "getItem").mockImplementation((key) => store[key] || null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => { store[key] = value; });
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = origGetContext;
  Element.prototype.getBoundingClientRect = origGetBCR;
  cleanup();
  vi.restoreAllMocks();
});

describe("MathEscapeRoom", () => {
  it("renders canvas element", () => {
    render(<MathEscapeRoom />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas?.tagName).toBe("CANVAS");
  });

  it("renders in compact mode without errors", () => {
    const { container } = render(<MathEscapeRoom compact />);
    expect(container.firstChild).toBeTruthy();
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<MathEscapeRoom />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows New Game button", () => {
    render(<MathEscapeRoom />);
    expect(screen.getByText("New Game")).toBeTruthy();
  });

  it("shows solved counter with initial 0/5", () => {
    render(<MathEscapeRoom />);
    expect(screen.getByText("0/5 solved")).toBeTruthy();
  });

  it("shows timer", () => {
    render(<MathEscapeRoom />);
    expect(screen.getByText("0:00")).toBeTruthy();
  });

  it("shows best time section only when a best time exists", () => {
    const { container } = render(<MathEscapeRoom />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.textContent).not.toContain("Best:");

    cleanup();
    localStorage.setItem("math-escape-room-best", "120");
    render(<MathEscapeRoom />);
    expect(screen.getByText(/Best:/)).toBeTruthy();
  });

  it("clicking New Game resets state", async () => {
    const user = userEvent.setup();
    render(<MathEscapeRoom />);
    const newGameBtn = screen.getByText("New Game");
    await user.click(newGameBtn);
    expect(screen.getByText("0/5 solved")).toBeTruthy();
    expect(screen.getByText("0:00")).toBeTruthy();
  });

  it("compact mode does not show controls", () => {
    render(<MathEscapeRoom compact />);
    expect(screen.queryByText("New Game")).toBeNull();
    expect(screen.queryByText("0/5 solved")).toBeNull();
  });

  it("compact mode does not show puzzle overlay", () => {
    render(<MathEscapeRoom compact />);
    expect(screen.queryByText("Submit")).toBeNull();
    expect(screen.queryByText(/Hint/)).toBeNull();
  });

  it("clicking a room on canvas opens puzzle overlay in non-compact mode", async () => {
    const user = userEvent.setup();
    const { container } = render(<MathEscapeRoom />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const canvas = container.querySelector("canvas")!;
    Object.defineProperty(canvas, "width", { value: 800, configurable: true });
    Object.defineProperty(canvas, "height", { value: 600, configurable: true });

    const roomX = 400;
    const roomY = 120;

    await act(async () => {
      const event = new MouseEvent("click", {
        clientX: roomX,
        clientY: roomY,
        bubbles: true,
      });
      Object.defineProperty(event, "target", { value: canvas });
      canvas.dispatchEvent(event);
    });

    expect(screen.getByText("Submit")).toBeTruthy();
  });

  it("puzzle overlay shows Submit button", async () => {
    const { container } = render(<MathEscapeRoom />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const canvas = container.querySelector("canvas")!;
    Object.defineProperty(canvas, "width", { value: 800, configurable: true });
    Object.defineProperty(canvas, "height", { value: 600, configurable: true });

    await act(async () => {
      const event = new MouseEvent("click", {
        clientX: 400,
        clientY: 120,
        bubbles: true,
      });
      canvas.dispatchEvent(event);
    });

    const submitBtn = screen.getByText("Submit");
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.tagName).toBe("BUTTON");
  });

  it("puzzle overlay shows Hint button", async () => {
    const { container } = render(<MathEscapeRoom />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const canvas = container.querySelector("canvas")!;
    Object.defineProperty(canvas, "width", { value: 800, configurable: true });
    Object.defineProperty(canvas, "height", { value: 600, configurable: true });

    await act(async () => {
      const event = new MouseEvent("click", {
        clientX: 400,
        clientY: 120,
        bubbles: true,
      });
      canvas.dispatchEvent(event);
    });

    const hintBtn = screen.getByText(/Hint/);
    expect(hintBtn).toBeTruthy();
    expect(hintBtn.tagName).toBe("BUTTON");
  });
});
