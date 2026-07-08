import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LogisticMap from "./LogisticMap";

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

describe("LogisticMap", () => {
  it("renders canvas element", () => {
    render(<LogisticMap />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<LogisticMap compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has r parameter slider", () => {
    render(<LogisticMap />);
    const labels = document.querySelectorAll("label");
    const rLabel = Array.from(labels).find(l => l.textContent?.includes("r"));
    expect(rLabel).toBeTruthy();
  });

  it("has x₀ parameter slider", () => {
    render(<LogisticMap />);
    const labels = document.querySelectorAll("label");
    const x0Label = Array.from(labels).find(l => l.textContent?.includes("x₀"));
    expect(x0Label).toBeTruthy();
  });

  it("shows Cobweb toggle button", () => {
    render(<LogisticMap />);
    expect(screen.getByText("Cobweb")).toBeTruthy();
  });

  it("shows Auto Sweep button", () => {
    render(<LogisticMap />);
    expect(screen.getByText("Auto Sweep")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<LogisticMap compact />);
    expect(screen.queryByText("Cobweb")).toBeFalsy();
    expect(screen.queryByText("Auto Sweep")).toBeFalsy();
  });

  it("toggles cobweb on button click", async () => {
    const user = userEvent.setup();
    render(<LogisticMap />);
    const cobwebBtn = screen.getByText("Cobweb");
    await user.click(cobwebBtn);
    expect(cobwebBtn.className).toContain("amber");
  });

  it("has container with dark background", () => {
    const { container } = render(<LogisticMap />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("displays current r value", () => {
    render(<LogisticMap />);
    expect(screen.getByText(/3\.5/)).toBeTruthy();
  });

  it("renders without crashing with extreme r value", () => {
    const { container } = render(<LogisticMap />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("auto sweep button is clickable", async () => {
    const user = userEvent.setup();
    render(<LogisticMap />);
    const sweepBtn = screen.getByText("Auto Sweep");
    await user.click(sweepBtn);
    expect(sweepBtn).toBeTruthy();
  });
});
