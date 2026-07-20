import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NashEquilibrium from "./NashEquilibrium";

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
    rotate: vi.fn(),
    scale: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    roundRect: vi.fn(),
    clip: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
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

describe("NashEquilibrium", () => {
  it("renders canvas element", () => {
    render(<NashEquilibrium />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<NashEquilibrium compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows preset buttons (Prisoner's Dilemma, etc.)", () => {
    render(<NashEquilibrium />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toContain("Prisoner's Dilemma");
    expect(labels).toContain("Battle of the Sexes");
    expect(labels).toContain("Stag Hunt");
    expect(labels).toContain("Matching Pennies");
    expect(labels).toContain("Chicken");
  });

  it("shows Reset button", () => {
    render(<NashEquilibrium />);
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<NashEquilibrium compact />);
    const buttons = screen.queryAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).not.toContain("Prisoner's Dilemma");
    expect(labels).not.toContain("Reset");
    expect(labels).not.toContain("Battle of the Sexes");
  });

  it("has payoff matrix number inputs", () => {
    render(<NashEquilibrium />);
    const inputs = document.querySelectorAll('input[type="number"]');
    expect(inputs.length).toBeGreaterThanOrEqual(8);
  });

  it("highlights active preset button", () => {
    render(<NashEquilibrium />);
    const buttons = screen.getAllByRole("button");
    const pdBtn = buttons.find((b) => b.textContent === "Prisoner's Dilemma")!;
    expect(pdBtn.className).toContain("amber");
  });

  it("switches preset on button click", async () => {
    const user = userEvent.setup();
    render(<NashEquilibrium />);
    const buttons = screen.getAllByRole("button");
    const stagBtn = buttons.find((b) => b.textContent === "Stag Hunt")!;
    await user.click(stagBtn);
    expect(stagBtn.className).toContain("amber");
  });

  it("displays mixed strategy info", () => {
    render(<NashEquilibrium />);
    const overlay = document.querySelector(".font-mono");
    expect(overlay).toBeTruthy();
  });

  it("has container with dark bg", () => {
    const { container } = render(<NashEquilibrium />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("has Row Player and Col Player labels", () => {
    render(<NashEquilibrium />);
    expect(screen.getByText("Row Player")).toBeTruthy();
    expect(screen.getByText("Col Player")).toBeTruthy();
  });

  it("shows Curves toggle", () => {
    render(<NashEquilibrium />);
    expect(screen.getByText("Curves")).toBeTruthy();
  });
});
