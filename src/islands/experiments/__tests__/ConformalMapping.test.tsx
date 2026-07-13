import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConformalMapping from "../ConformalMapping";

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
    return { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ConformalMapping", () => {
  it("renders a canvas element", () => {
    const { container } = render(<ConformalMapping />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode without errors", () => {
    const { container } = render(<ConformalMapping compact />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class on container", () => {
    const { container } = render(<ConformalMapping />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows all six function selector buttons", () => {
    render(<ConformalMapping />);
    expect(screen.getByText("z²")).toBeTruthy();
    expect(screen.getByText("1/z")).toBeTruthy();
    expect(screen.getByText("eˣ")).toBeTruthy();
    expect(screen.getByText("sin(z)")).toBeTruthy();
    expect(screen.getByText("z³")).toBeTruthy();
    expect(screen.getByText("√z")).toBeTruthy();
  });

  it("shows formula display with default function", () => {
    render(<ConformalMapping />);
    expect(screen.getByText("f(z) = z²")).toBeTruthy();
  });

  it("shows zoom controls with + and − buttons", () => {
    render(<ConformalMapping />);
    expect(screen.getByText("+")).toBeTruthy();
    expect(screen.getByText("−")).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<ConformalMapping />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("shows legend labels for Re-lines and Im-lines", () => {
    render(<ConformalMapping />);
    expect(screen.getByText("Re-lines")).toBeTruthy();
    expect(screen.getByText("Im-lines")).toBeTruthy();
  });

  it("shows pole and zero markers in legend", () => {
    render(<ConformalMapping />);
    expect(screen.getByText("Pole (×)")).toBeTruthy();
    expect(screen.getByText("Zero (●)")).toBeTruthy();
  });

  it("hides all controls in compact mode", () => {
    render(<ConformalMapping compact />);
    expect(screen.queryByText("z²")).toBeNull();
    expect(screen.queryByText("f(z) = z²")).toBeNull();
    expect(screen.queryByText("Reset")).toBeNull();
    expect(screen.queryByText("+")).toBeNull();
    expect(screen.queryByText("−")).toBeNull();
    expect(screen.queryByText("Re-lines")).toBeNull();
  });

  it("switches function on button click and updates formula", async () => {
    const user = userEvent.setup();
    render(<ConformalMapping />);
    await user.click(screen.getByText("z³"));
    expect(screen.getByText("f(z) = z³")).toBeTruthy();
  });

  it("switches to 1/z function and shows its formula", async () => {
    const user = userEvent.setup();
    render(<ConformalMapping />);
    await user.click(screen.getByText("1/z"));
    expect(screen.getByText("f(z) = 1/z")).toBeTruthy();
  });

  it("canvas has correct positioning class", () => {
    const { container } = render(<ConformalMapping />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.className).toContain("absolute");
  });
});
