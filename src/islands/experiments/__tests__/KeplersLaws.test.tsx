import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KeplersLaws from "../KeplersLaws";

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
    ellipse: vi.fn(),
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
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    roundRect: vi.fn(),
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

describe("KeplersLaws", () => {
  it("renders canvas element", () => {
    render(<KeplersLaws />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<KeplersLaws compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows Law 1, Law 2, and Law 3 buttons", () => {
    render(<KeplersLaws />);
    expect(screen.getByRole("button", { name: "Law 1" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Law 2" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Law 3" })).toBeTruthy();
  });

  it("shows Pause and Reset buttons", () => {
    render(<KeplersLaws />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
  });

  it("has eccentricity slider for Law 1", () => {
    render(<KeplersLaws />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(2);
  });

  it("has speed slider", () => {
    render(<KeplersLaws />);
    const speedLabels = screen.getAllByText(/speed:/i);
    expect(speedLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("hides controls in compact mode", () => {
    render(<KeplersLaws compact />);
    const buttons = screen.queryAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).not.toContain("Law 1");
    expect(labels).not.toContain("Law 2");
    expect(labels).not.toContain("Law 3");
    expect(labels).not.toContain("Pause");
  });

  it("has container with dark bg", () => {
    const { container } = render(<KeplersLaws />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("toggles between laws", async () => {
    const user = userEvent.setup();
    render(<KeplersLaws />);
    const law1Btn = screen.getByRole("button", { name: "Law 1" });
    const law2Btn = screen.getByRole("button", { name: "Law 2" });
    const law3Btn = screen.getByRole("button", { name: "Law 3" });

    expect(law1Btn.className).toContain("font-bold");

    await user.click(law2Btn);
    expect(law2Btn.className).toContain("font-bold");

    await user.click(law3Btn);
    expect(law3Btn.className).toContain("font-bold");
  });

  it("Pause/Play toggle works", async () => {
    const user = userEvent.setup();
    render(<KeplersLaws />);
    const pauseBtn = screen.getByRole("button", { name: "Pause" });
    await user.click(pauseBtn);
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  });

  it("shows Eccentricity label", () => {
    render(<KeplersLaws />);
    expect(screen.getByText(/eccentricity/i)).toBeTruthy();
  });

  it("shows Semi-major label when Law 1 is active", () => {
    render(<KeplersLaws />);
    expect(screen.getByText(/semi-major/i)).toBeTruthy();
  });

  it("Law 3 button switches to third law display", async () => {
    const user = userEvent.setup();
    render(<KeplersLaws />);
    await user.click(screen.getByRole("button", { name: "Law 3" }));
    const law3Btn = screen.getByRole("button", { name: "Law 3" });
    expect(law3Btn.className).toContain("font-bold");
  });

  it("renders with eccentricity slider value display", () => {
    render(<KeplersLaws />);
    const eccValues = document.querySelectorAll(".text-amber-400");
    expect(eccValues.length).toBeGreaterThanOrEqual(1);
  });
});
