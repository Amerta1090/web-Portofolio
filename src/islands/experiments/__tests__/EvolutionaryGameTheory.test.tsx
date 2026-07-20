import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EvolutionaryGameTheory from "../EvolutionaryGameTheory";

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
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
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

describe("EvolutionaryGameTheory", () => {
  it("renders canvas element", () => {
    render(<EvolutionaryGameTheory />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<EvolutionaryGameTheory compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows preset buttons (Hawk-Dove, Rock-Paper-Scissors, etc.)", () => {
    render(<EvolutionaryGameTheory />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toContain("Hawk-Dove");
    expect(labels).toContain("Rock-Paper-Scissors");
    expect(labels).toContain("Stag Hunt");
    expect(labels).toContain("Coordination");
  });

  it("shows Run, Reset, +Trajectory, Clear Traj buttons", () => {
    render(<EvolutionaryGameTheory />);
    expect(screen.getByRole("button", { name: "Run" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "+Trajectory" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear Traj" })).toBeTruthy();
  });

  it("shows VF On/Off toggle", () => {
    render(<EvolutionaryGameTheory />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toContain("VF On");
  });

  it("has Speed slider", () => {
    render(<EvolutionaryGameTheory />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it("hides controls in compact mode", () => {
    render(<EvolutionaryGameTheory compact />);
    const buttons = screen.queryAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).not.toContain("Hawk-Dove");
    expect(labels).not.toContain("Run");
    expect(labels).not.toContain("Reset");
    expect(labels).not.toContain("+Trajectory");
    expect(labels).not.toContain("Clear Traj");
    expect(labels).not.toContain("VF On");
  });

  it("displays current preset name in bottom bar", () => {
    render(<EvolutionaryGameTheory />);
    const spans = document.querySelectorAll("span");
    const presetSpan = Array.from(spans).find((s) => s.textContent === "Hawk-Dove" && s.className.includes("amber"));
    expect(presetSpan).toBeTruthy();
  });

  it("has container with dark bg", () => {
    const { container } = render(<EvolutionaryGameTheory />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("switches preset on button click", async () => {
    const user = userEvent.setup();
    render(<EvolutionaryGameTheory />);
    const buttons = screen.getAllByRole("button");
    const rpsBtn = buttons.find((b) => b.textContent === "Rock-Paper-Scissors")!;
    await user.click(rpsBtn);
    expect(rpsBtn.className).toContain("amber");
  });

  it("toggles Run to Pause on click", async () => {
    const user = userEvent.setup();
    render(<EvolutionaryGameTheory />);
    const runBtn = screen.getByRole("button", { name: "Run" });
    await user.click(runBtn);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  });

  it("renders Speed label in bottom bar", () => {
    render(<EvolutionaryGameTheory />);
    expect(screen.getByText(/Speed:/)).toBeTruthy();
  });
});
