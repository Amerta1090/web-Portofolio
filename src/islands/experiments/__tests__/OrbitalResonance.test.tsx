import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrbitalResonance from "../OrbitalResonance";

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

describe("OrbitalResonance", () => {
  it("renders canvas element", () => {
    render(<OrbitalResonance />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<OrbitalResonance compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows preset buttons (Pluto-Neptune, Laplace, Custom)", () => {
    render(<OrbitalResonance />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).toContain("Pluto-Neptune 3:2");
    expect(labels).toContain("Laplace 1:2:4");
    expect(labels).toContain("Custom");
  });

  it("shows Play, Reset and Arrows On buttons", () => {
    render(<OrbitalResonance />);
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Arrows On" })).toBeTruthy();
  });

  it("has Speed slider", () => {
    render(<OrbitalResonance />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
  });

  it("hides controls in compact mode", () => {
    render(<OrbitalResonance compact />);
    const buttons = screen.queryAllByRole("button");
    const labels = buttons.map((b) => b.textContent);
    expect(labels).not.toContain("Pluto-Neptune 3:2");
    expect(labels).not.toContain("Laplace 1:2:4");
    expect(labels).not.toContain("Custom");
    expect(labels).not.toContain("Play");
    expect(labels).not.toContain("Reset");
    expect(labels).not.toContain("Arrows On");
  });

  it("displays current preset name in bottom bar", () => {
    render(<OrbitalResonance />);
    const spans = document.querySelectorAll("span");
    const presetSpan = Array.from(spans).find((s) => s.textContent === "Pluto-Neptune 3:2" && s.className.includes("amber"));
    expect(presetSpan).toBeTruthy();
  });

  it("has container with dark bg", () => {
    const { container } = render(<OrbitalResonance />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("switches preset on button click", async () => {
    const user = userEvent.setup();
    render(<OrbitalResonance />);
    const buttons = screen.getAllByRole("button");
    const laplaceBtn = buttons.find((b) => b.textContent === "Laplace 1:2:4")!;
    await user.click(laplaceBtn);
    expect(laplaceBtn.className).toContain("amber");
  });

  it("toggles Play to Pause on click", async () => {
    const user = userEvent.setup();
    render(<OrbitalResonance />);
    const playBtn = screen.getByRole("button", { name: "Play" });
    await user.click(playBtn);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
  });

  it("renders Speed label in bottom bar", () => {
    render(<OrbitalResonance />);
    expect(screen.getByText(/Speed:/)).toBeTruthy();
  });

  it("renders ratio display in bottom bar", () => {
    render(<OrbitalResonance />);
    const spans = document.querySelectorAll("span");
    const ratioSpan = Array.from(spans).find((s) => s.className.includes("amber") && s.textContent === "3:2");
    expect(ratioSpan).toBeTruthy();
  });

  it("shows Custom ratio selector when Custom preset selected", async () => {
    const user = userEvent.setup();
    render(<OrbitalResonance />);
    const buttons = screen.getAllByRole("button");
    const customBtn = buttons.find((b) => b.textContent === "Custom")!;
    await user.click(customBtn);
    const select = document.querySelector("select");
    expect(select).toBeTruthy();
  });

  it("toggles Arrows On/Off", async () => {
    const user = userEvent.setup();
    render(<OrbitalResonance />);
    const arrowsBtn = screen.getByRole("button", { name: "Arrows On" });
    await user.click(arrowsBtn);
    expect(screen.getByRole("button", { name: "Arrows Off" })).toBeTruthy();
  });

  it("resets when Reset clicked", async () => {
    const user = userEvent.setup();
    render(<OrbitalResonance />);
    const playBtn = screen.getByRole("button", { name: "Play" });
    await user.click(playBtn);
    expect(screen.getByRole("button", { name: "Pause" })).toBeTruthy();
    const resetBtn = screen.getByRole("button", { name: "Reset" });
    await user.click(resetBtn);
    expect(screen.getByRole("button", { name: "Play" })).toBeTruthy();
  });

  it("renders planet names for Laplace preset", async () => {
    const user = userEvent.setup();
    render(<OrbitalResonance />);
    const buttons = screen.getAllByRole("button");
    const laplaceBtn = buttons.find((b) => b.textContent === "Laplace 1:2:4")!;
    await user.click(laplaceBtn);
    const spans = document.querySelectorAll("span");
    const presetSpan = Array.from(spans).find((s) => s.className.includes("amber"));
    expect(presetSpan?.textContent).toBe("Laplace 1:2:4");
  });
});
