import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThreeBodyProblem from "../ThreeBodyProblem";

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
    lineCap: "" as CanvasLineCap,
    lineJoin: "" as CanvasLineJoin,
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

const origGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  }) as any;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    setTimeout(() => cb(performance.now()), 16);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  window.ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as any;
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = origGetContext;
  cleanup();
  vi.restoreAllMocks();
});

describe("ThreeBodyProblem", () => {
  it("renders canvas element", () => {
    render(<ThreeBodyProblem />);
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("renders in compact mode", () => {
    render(<ThreeBodyProblem compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("has dark background class", () => {
    render(<ThreeBodyProblem />);
    const container = document.querySelector(".bg-\\[\\#0f0f11\\]");
    expect(container).not.toBeNull();
  });

  it("shows Play/Pause button", () => {
    render(<ThreeBodyProblem />);
    const pauseBtn = screen.getByText(/Pause|Play/);
    expect(pauseBtn).toBeDefined();
  });

  it("shows Reset button", () => {
    render(<ThreeBodyProblem />);
    expect(screen.getByText(/Reset/)).toBeDefined();
  });

  it("shows preset selector with Figure-8, Lagrange L4/L5, Broucke Orbit options", () => {
    render(<ThreeBodyProblem />);
    const select = screen.getByRole("combobox");
    const options = select.querySelectorAll("option");
    const labels = Array.from(options).map((o) => o.textContent);
    expect(labels).toContain("Figure-8");
    expect(labels).toContain("Lagrange L4/L5");
    expect(labels).toContain("Broucke Orbit");
  });

  it("shows energy display (KE / PE / total)", () => {
    render(<ThreeBodyProblem />);
    expect(screen.getByText(/KE/)).toBeDefined();
    expect(screen.getByText(/PE/)).toBeDefined();
    expect(screen.getByText(/tot/)).toBeDefined();
  });

  it("shows momentum display", () => {
    render(<ThreeBodyProblem />);
    expect(screen.getByText(/p =/)).toBeDefined();
  });

  it("shows drag hint text", () => {
    render(<ThreeBodyProblem />);
    expect(screen.getByText(/Drag a body/)).toBeDefined();
  });

  it("shows Speed slider", () => {
    render(<ThreeBodyProblem />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Speed/)).toBeDefined();
  });

  it("compact mode hides all controls", () => {
    render(<ThreeBodyProblem compact />);
    expect(screen.queryByText(/Pause/)).toBeNull();
    expect(screen.queryByText(/Reset/)).toBeNull();
    expect(screen.queryByText(/Speed/)).toBeNull();
    expect(screen.queryByText(/Preset/)).toBeNull();
    expect(screen.queryByText(/Drag a body/)).toBeNull();
    expect(screen.queryByText(/KE/)).toBeNull();
    expect(screen.queryByText(/p =/)).toBeNull();
    expect(document.querySelectorAll("button").length).toBe(0);
    expect(document.querySelectorAll("select").length).toBe(0);
  });

  it("compact mode shows watermark label", () => {
    render(<ThreeBodyProblem compact />);
    expect(screen.getByText("3-Body")).toBeDefined();
  });

  it("Pause/Play button toggles when clicked", async () => {
    const user = userEvent.setup();
    render(<ThreeBodyProblem />);
    const pauseBtn = screen.getByText(/Pause|Play/);
    expect(pauseBtn.textContent).toContain("Pause");
    await user.click(pauseBtn);
    expect(screen.getByText(/Play/)).toBeDefined();
    await user.click(screen.getByText(/Play/));
    expect(screen.getByText(/Pause/)).toBeDefined();
  });

  it("preset selection updates dropdown value", async () => {
    const user = userEvent.setup();
    render(<ThreeBodyProblem />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("figure8");
    await user.selectOptions(select, "lagrange");
    expect(select.value).toBe("lagrange");
    await user.selectOptions(select, "broucke");
    expect(select.value).toBe("broucke");
  });

  it("switching preset triggers reset of step counter", async () => {
    const user = userEvent.setup();
    render(<ThreeBodyProblem />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    await user.selectOptions(select, "lagrange");
    expect(screen.getByText(/steps/)).toBeDefined();
  });

  it("Reset button exists and is clickable", async () => {
    const user = userEvent.setup();
    render(<ThreeBodyProblem />);
    const resetBtn = screen.getByText(/Reset/);
    await user.click(resetBtn);
    expect(screen.getByText(/Reset/)).toBeDefined();
  });

  it("positions canvas absolutely inside overflow-hidden container", () => {
    const { container } = render(<ThreeBodyProblem />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("overflow-hidden");
    const canvas = document.querySelector("canvas");
    expect(canvas?.className).toContain("absolute");
  });
});
