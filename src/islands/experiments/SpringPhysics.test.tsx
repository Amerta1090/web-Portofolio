import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SpringPhysics from "./SpringPhysics";

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

describe("SpringPhysics", () => {
  it("renders canvas element", () => {
    render(<SpringPhysics />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<SpringPhysics compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has gravity slider", () => {
    render(<SpringPhysics />);
    const labels = document.querySelectorAll("label");
    const gLabel = Array.from(labels).find(l => l.textContent?.includes("Gravity"));
    expect(gLabel).toBeTruthy();
  });

  it("has damping slider", () => {
    render(<SpringPhysics />);
    const labels = document.querySelectorAll("label");
    const dLabel = Array.from(labels).find(l => l.textContent?.includes("Damping"));
    expect(dLabel).toBeTruthy();
  });

  it("has stiffness slider", () => {
    render(<SpringPhysics />);
    const labels = document.querySelectorAll("label");
    const sLabel = Array.from(labels).find(l => l.textContent?.includes("Stiffness"));
    expect(sLabel).toBeTruthy();
  });

  it("shows Cloth preset button", () => {
    render(<SpringPhysics />);
    expect(screen.getByText("Cloth")).toBeTruthy();
  });

  it("shows Chain preset button", () => {
    render(<SpringPhysics />);
    expect(screen.getByText("Chain")).toBeTruthy();
  });

  it("shows Clear All button", () => {
    render(<SpringPhysics />);
    expect(screen.getByText("Clear All")).toBeTruthy();
  });

  it("shows Pause button", () => {
    render(<SpringPhysics />);
    expect(screen.getByText("Pause")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<SpringPhysics compact />);
    expect(screen.queryByText("Cloth")).toBeFalsy();
    expect(screen.queryByText("Clear All")).toBeFalsy();
    expect(screen.queryByText("Pause")).toBeFalsy();
    expect(screen.queryByText("Gravity")).toBeFalsy();
  });

  it("has container with dark background", () => {
    const { container } = render(<SpringPhysics />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders without crashing", () => {
    const { container } = render(<SpringPhysics />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("shows Jelly preset button", () => {
    render(<SpringPhysics />);
    expect(screen.getByText("Jelly")).toBeTruthy();
  });

  it("shows Ragdoll preset button", () => {
    render(<SpringPhysics />);
    expect(screen.getByText("Ragdoll")).toBeTruthy();
  });

  it("toggles pause to resume on click", async () => {
    const user = userEvent.setup();
    render(<SpringPhysics />);
    const pauseBtn = screen.getByText("Pause");
    await user.click(pauseBtn);
    expect(screen.getByText("Resume")).toBeTruthy();
  });

  it("toggles resume back to pause on second click", async () => {
    const user = userEvent.setup();
    render(<SpringPhysics />);
    const pauseBtn = screen.getByText("Pause");
    await user.click(pauseBtn);
    await user.click(screen.getByText("Resume"));
    expect(screen.getByText("Pause")).toBeTruthy();
  });
});
