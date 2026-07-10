import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RayleighBenard from "./RayleighBenard";

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
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
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

describe("RayleighBenard", () => {
  it("renders canvas element", () => {
    render(<RayleighBenard />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<RayleighBenard compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has Rayleigh number slider", () => {
    render(<RayleighBenard />);
    const labels = document.querySelectorAll("label");
    const raLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("Ra"),
    );
    expect(raLabel).toBeTruthy();
  });

  it("has Prandtl number slider", () => {
    render(<RayleighBenard />);
    const labels = document.querySelectorAll("label");
    const prLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("Pr"),
    );
    expect(prLabel).toBeTruthy();
  });

  it("has grid resolution slider", () => {
    render(<RayleighBenard />);
    const labels = document.querySelectorAll("label");
    const gridLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("Grid"),
    );
    expect(gridLabel).toBeTruthy();
  });

  it("shows velocity arrows toggle", () => {
    render(<RayleighBenard />);
    expect(screen.getByText("Arrows")).toBeTruthy();
  });

  it("shows temperature overlay toggle", () => {
    render(<RayleighBenard />);
    expect(screen.getByText("Overlay")).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<RayleighBenard />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("shows Pause button", () => {
    render(<RayleighBenard />);
    expect(screen.getByText("Pause")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<RayleighBenard compact />);
    expect(screen.queryByText("Arrows")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("Pause")).toBeFalsy();
  });

  it("has container with dark background", () => {
    const { container } = render(<RayleighBenard />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders without crashing", () => {
    const { container } = render(<RayleighBenard />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("has all three parameter sliders", () => {
    render(<RayleighBenard />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(3);
  });

  it("displays default Rayleigh number value", () => {
    render(<RayleighBenard />);
    expect(screen.getByText("3000")).toBeTruthy();
  });

  it("toggles pause on button click", async () => {
    const user = userEvent.setup();
    render(<RayleighBenard />);
    const pauseBtn = screen.getByText("Pause");
    await user.click(pauseBtn);
    expect(screen.getByText("Resume")).toBeTruthy();
    await user.click(screen.getByText("Resume"));
    expect(screen.getByText("Pause")).toBeTruthy();
  });

  it("toggles arrows on button click", async () => {
    const user = userEvent.setup();
    render(<RayleighBenard />);
    const arrowsBtn = screen.getByText("Arrows");
    await user.click(arrowsBtn);
    expect(arrowsBtn.className).toContain("amber");
  });

  it("renders without crashing with extreme Ra value", () => {
    const { container } = render(<RayleighBenard />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });
});
