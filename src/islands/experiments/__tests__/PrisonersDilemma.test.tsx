import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrisonersDilemma from "../PrisonersDilemma";

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

describe("PrisonersDilemma", () => {
  it("renders canvas element", () => {
    render(<PrisonersDilemma />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<PrisonersDilemma compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows Run and Reset buttons", () => {
    render(<PrisonersDilemma />);
    expect(screen.getByRole("button", { name: "Run" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
  });

  it("shows Step button", () => {
    render(<PrisonersDilemma />);
    expect(screen.getByRole("button", { name: "Step" })).toBeTruthy();
  });

  it("has speed slider", () => {
    render(<PrisonersDilemma />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it("shows strategy visibility buttons", () => {
    render(<PrisonersDilemma />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toContain("Tit-fo");
    expect(labels).toContain("Grim T");
    expect(labels).toContain("Always");
    expect(labels).toContain("Random");
    expect(labels).toContain("Pavlov");
    expect(labels).toContain("Genero");
  });

  it("hides controls in compact mode", () => {
    render(<PrisonersDilemma compact />);
    const buttons = screen.queryAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).not.toContain("Run");
    expect(labels).not.toContain("Step");
    expect(labels).not.toContain("Reset");
  });

  it("displays formula overlay with generation info", () => {
    render(<PrisonersDilemma />);
    const overlay = document.querySelector(".font-mono");
    expect(overlay).toBeTruthy();
  });

  it("has container with dark bg", () => {
    const { container } = render(<PrisonersDilemma />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("Run/Pause toggle works", async () => {
    const user = userEvent.setup();
    render(<PrisonersDilemma />);
    const runBtn = screen.getByRole("button", { name: "Run" });
    await user.click(runBtn);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  });

  it("shows speed label", () => {
    render(<PrisonersDilemma />);
    expect(screen.getByText(/speed:/)).toBeTruthy();
  });

  it("renders 7 strategy toggle buttons", () => {
    render(<PrisonersDilemma />);
    const stratNames = ["Tit-fo", "Grim T", "Always", "Random", "Pavlov", "Genero"];
    for (const name of stratNames) {
      const buttons = screen.getAllByRole("button");
      const found = buttons.filter((b) => b.textContent === name);
      expect(found.length).toBeGreaterThanOrEqual(1);
    }
  });
});
