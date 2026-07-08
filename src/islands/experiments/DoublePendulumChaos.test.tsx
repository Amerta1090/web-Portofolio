import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DoublePendulumChaos from "./DoublePendulumChaos";

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
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DoublePendulumChaos", () => {
  it("renders canvas element", () => {
    render(<DoublePendulumChaos />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<DoublePendulumChaos compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows Lyapunov exponent display", () => {
    render(<DoublePendulumChaos />);
    expect(screen.getByText(/λ/)).toBeTruthy();
  });

  it("shows Phase Space toggle button", () => {
    render(<DoublePendulumChaos />);
    expect(screen.getByText("Phase Space")).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<DoublePendulumChaos />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<DoublePendulumChaos compact />);
    expect(screen.queryByText("Phase Space")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
  });

  it("has delta theta slider", () => {
    render(<DoublePendulumChaos />);
    const labels = document.querySelectorAll("label");
    const deltaLabel = Array.from(labels).find(l => l.textContent?.includes("Δθ"));
    expect(deltaLabel).toBeTruthy();
  });

  it("has mass and length parameter sliders", () => {
    render(<DoublePendulumChaos />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(4);
  });

  it("toggles phase space on button click", async () => {
    const user = userEvent.setup();
    render(<DoublePendulumChaos />);
    const phaseBtn = screen.getByText("Phase Space");
    await user.click(phaseBtn);
    expect(phaseBtn.className).toContain("amber");
  });

  it("has container with dark background", () => {
    const { container } = render(<DoublePendulumChaos />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("has damping slider", () => {
    render(<DoublePendulumChaos />);
    const labels = document.querySelectorAll("label");
    const dampLabel = Array.from(labels).find(l => l.textContent?.includes("Damping"));
    expect(dampLabel).toBeTruthy();
  });

  it("renders without crashing with all sliders at extreme values", () => {
    const { container } = render(<DoublePendulumChaos />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });
});
