import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HyperbolicGoL from "../HyperbolicGoL";

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
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    shadowColor: "",
    shadowBlur: 0,
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

describe("HyperbolicGoL", () => {
  it("renders canvas element", () => {
    render(<HyperbolicGoL />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<HyperbolicGoL compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<HyperbolicGoL />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows generation counter", () => {
    render(<HyperbolicGoL />);
    expect(screen.getByText(/gen:/)).toBeTruthy();
  });

  it("shows population counter", () => {
    render(<HyperbolicGoL />);
    expect(screen.getByText(/pop:/)).toBeTruthy();
  });

  it("shows Play/Pause button", () => {
    render(<HyperbolicGoL />);
    expect(screen.getByText("Play")).toBeTruthy();
  });

  it("shows Step button", () => {
    render(<HyperbolicGoL />);
    expect(screen.getByText("Step")).toBeTruthy();
  });

  it("has speed slider with label", () => {
    render(<HyperbolicGoL />);
    const labels = document.querySelectorAll("label");
    const speedLabel = Array.from(labels).find((l) =>
      l.textContent?.includes("speed")
    );
    expect(speedLabel).toBeTruthy();
    const slider = speedLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("shows rule toggle button with initial rule", () => {
    render(<HyperbolicGoL />);
    expect(screen.getByText("Conway")).toBeTruthy();
  });

  it("shows pattern button with initial pattern", () => {
    render(<HyperbolicGoL />);
    expect(screen.getByText("random")).toBeTruthy();
  });

  it("shows Clear and Reset buttons", () => {
    render(<HyperbolicGoL />);
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<HyperbolicGoL compact />);
    expect(screen.queryByText("Pause")).toBeFalsy();
    expect(screen.queryByText("Step")).toBeFalsy();
    expect(screen.queryByText("Clear")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("Conway")).toBeFalsy();
    expect(screen.queryByText(/gen:/)).toBeFalsy();
    expect(screen.queryByText(/pop:/)).toBeFalsy();
  });

  it("toggles pause on button click", async () => {
    const user = userEvent.setup();
    render(<HyperbolicGoL />);
    const btn = screen.getByText("Play");
    await user.click(btn);
    expect(screen.getByText("Pause")).toBeTruthy();
  });

  it("cycles rule on button click", async () => {
    const user = userEvent.setup();
    render(<HyperbolicGoL />);
    const ruleBtn = screen.getByText("Conway");
    await user.click(ruleBtn);
    expect(screen.getByText("Seeds")).toBeTruthy();
  });

  it("cycles pattern on button click", async () => {
    const user = userEvent.setup();
    render(<HyperbolicGoL />);
    const patBtn = screen.getByText("random");
    await user.click(patBtn);
    expect(screen.getByText("center")).toBeTruthy();
  });
});
