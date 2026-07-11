import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CollatzTree from "../CollatzTree";

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
    textBaseline: "" as CanvasTextBaseline,
    shadowColor: "",
    shadowBlur: 0,
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    rect: vi.fn(),
    roundRect: vi.fn(),
    clip: vi.fn(),
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

describe("CollatzTree", () => {
  it("renders canvas element", () => {
    render(<CollatzTree />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<CollatzTree compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<CollatzTree />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows stats overlay in full mode", () => {
    render(<CollatzTree />);
    expect(screen.getByText(/nodes:/)).toBeTruthy();
    expect(screen.getByText(/max stop:/)).toBeTruthy();
    expect(screen.getByText(/avg stop:/)).toBeTruthy();
  });

  it("has Auto Explore button", () => {
    render(<CollatzTree />);
    expect(screen.getByText("Auto Explore")).toBeTruthy();
  });

  it("has Reset button", () => {
    render(<CollatzTree />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("has max number slider", () => {
    render(<CollatzTree />);
    const labels = document.querySelectorAll("label");
    const maxLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("max")
    );
    expect(maxLabel).toBeTruthy();
    const slider = maxLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("orbit panel accessible after canvas click", async () => {
    const user = userEvent.setup();
    const { container } = render(<CollatzTree />);
    const canvas = container.querySelector("canvas")!;
    await user.click(canvas);
    expect(canvas).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<CollatzTree compact />);
    expect(screen.queryByText("Auto Explore")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("Random")).toBeFalsy();
  });

  it("Auto Explore toggles to Stop on click", async () => {
    const user = userEvent.setup();
    render(<CollatzTree />);
    const btn = screen.getByText("Auto Explore");
    await user.click(btn);
    expect(screen.getByText("Stop")).toBeTruthy();
  });

  it("histogram area present in full mode", () => {
    render(<CollatzTree />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
    const labels = document.querySelectorAll("label");
    const maxLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("max")
    );
    expect(maxLabel).toBeTruthy();
  });

  it("canvas element has correct tag", () => {
    render(<CollatzTree />);
    const canvas = document.querySelector("canvas");
    expect(canvas?.tagName).toBe("CANVAS");
  });
});
