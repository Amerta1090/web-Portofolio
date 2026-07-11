import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UlamSpiral from "../UlamSpiral";

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

describe("UlamSpiral", () => {
  it("renders canvas element", () => {
    render(<UlamSpiral />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<UlamSpiral compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<UlamSpiral />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows stats overlay with primes and density", () => {
    render(<UlamSpiral />);
    expect(screen.getByText(/primes:/)).toBeTruthy();
    expect(screen.getByText(/density:/)).toBeTruthy();
    expect(screen.getByText(/largest:/)).toBeTruthy();
  });

  it("has zoom slider with label", () => {
    render(<UlamSpiral />);
    const labels = document.querySelectorAll("label");
    const zoomLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("zoom")
    );
    expect(zoomLabel).toBeTruthy();
    const slider = zoomLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("shows Spiral/Rectangular mode toggle button", () => {
    render(<UlamSpiral />);
    const btn = screen.getByText("Spiral");
    expect(btn).toBeTruthy();
  });

  it("shows highlight mode buttons", () => {
    render(<UlamSpiral />);
    expect(screen.getByText("Primes")).toBeTruthy();
    expect(screen.getByText("Twin Primes")).toBeTruthy();
    expect(screen.getByText("Mersenne")).toBeTruthy();
    expect(screen.getByText("Prime Gaps")).toBeTruthy();
  });

  it("has center number input", () => {
    render(<UlamSpiral />);
    const labels = document.querySelectorAll("label");
    const centerLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("center")
    );
    expect(centerLabel).toBeTruthy();
    const input = centerLabel!.querySelector("input[type=number]");
    expect(input).toBeTruthy();
  });

  it("shows Home button", () => {
    render(<UlamSpiral />);
    expect(screen.getByText("Home")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<UlamSpiral compact />);
    expect(screen.queryByText("Spiral")).toBeFalsy();
    expect(screen.queryByText("Primes")).toBeFalsy();
    expect(screen.queryByText("Home")).toBeFalsy();
    const labels = document.querySelectorAll("label");
    const zoomLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("zoom")
    );
    expect(zoomLabel).toBeFalsy();
  });

  it("toggles layout mode button text on click", async () => {
    const user = userEvent.setup();
    render(<UlamSpiral />);
    const btn = screen.getByText("Spiral");
    await user.click(btn);
    expect(screen.getByText("Rectangular")).toBeTruthy();
    expect(screen.queryByText("Spiral")).toBeFalsy();
  });

  it("activates highlight mode button on click", async () => {
    const user = userEvent.setup();
    render(<UlamSpiral />);
    const twinBtn = screen.getByText("Twin Primes");
    await user.click(twinBtn);
    expect(twinBtn.className).toContain("bg-amber-500/20");
    expect(twinBtn.className).toContain("border-amber-500/50");
    expect(twinBtn.className).toContain("text-amber-400");
  });
});
