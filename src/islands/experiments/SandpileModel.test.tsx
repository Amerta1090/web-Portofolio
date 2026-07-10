import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SandpileModel from "./SandpileModel";

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

describe("SandpileModel", () => {
  it("renders canvas element", () => {
    render(<SandpileModel />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<SandpileModel compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has drop rate slider", () => {
    render(<SandpileModel />);
    const labels = document.querySelectorAll("label");
    const dropLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("rain")
    );
    expect(dropLabel).toBeTruthy();
    const slider = dropLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("has grid size slider", () => {
    render(<SandpileModel />);
    const labels = document.querySelectorAll("label");
    const gridLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("grid")
    );
    expect(gridLabel).toBeTruthy();
    const slider = gridLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("shows boundary toggle", () => {
    render(<SandpileModel />);
    const btn = screen.getByText("absorbing");
    expect(btn).toBeTruthy();
  });

  it("shows Rain button", () => {
    render(<SandpileModel />);
    expect(screen.getByText("Rain")).toBeTruthy();
  });

  it("shows Single Drop button", () => {
    render(<SandpileModel />);
    expect(screen.getByText("Single Drop")).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<SandpileModel />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("shows avalanche count display", () => {
    render(<SandpileModel />);
    expect(screen.getByText(/dropped:/)).toBeTruthy();
    expect(screen.getByText(/avalanches:/)).toBeTruthy();
    expect(screen.getByText(/max:/)).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<SandpileModel compact />);
    expect(screen.queryByText("Rain")).toBeFalsy();
    expect(screen.queryByText("Single Drop")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("absorbing")).toBeFalsy();
  });

  it("has container with dark background", () => {
    const { container } = render(<SandpileModel />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders without crashing", () => {
    const { container } = render(<SandpileModel />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("toggles boundary on click", async () => {
    const user = userEvent.setup();
    render(<SandpileModel />);
    const btn = screen.getByText("absorbing");
    await user.click(btn);
    expect(screen.getByText("periodic")).toBeTruthy();
  });

  it("toggles Rain button on click", async () => {
    const user = userEvent.setup();
    render(<SandpileModel />);
    const rainBtn = screen.getByText("Rain");
    await user.click(rainBtn);
    expect(screen.getByText("Stop Rain")).toBeTruthy();
  });

  it("toggles Pause button on click", async () => {
    const user = userEvent.setup();
    render(<SandpileModel />);
    const pauseBtn = screen.getByText("Pause");
    await user.click(pauseBtn);
    expect(screen.getByText("Resume")).toBeTruthy();
  });
});
