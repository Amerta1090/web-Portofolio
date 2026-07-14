import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuantumCircuit from "../QuantumCircuit";

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
    createImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    putImageData: vi.fn(),
    canvas: { width: 100, height: 100 } as HTMLCanvasElement,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: "" as GlobalCompositeOperation,
    font: "",
    textAlign: "" as CanvasTextAlign,
    textBaseline: "" as CanvasTextBaseline,
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    drawImage: vi.fn(),
    roundRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return createMock2D();
    return null;
  });
  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,...");
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

describe("QuantumCircuit", () => {
  it("renders a canvas element", () => {
    render(<QuantumCircuit />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<QuantumCircuit />);
    const root = container.querySelector(".bg-\\[\\#0f0f11\\]");
    expect(root).toBeTruthy();
  });

  it("compact mode renders without controls", () => {
    render(<QuantumCircuit compact />);
    expect(screen.queryByText("H")).toBeNull();
    expect(screen.queryByText("▶ Run")).toBeNull();
    expect(screen.queryByText("Bell State")).toBeNull();
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("shows gate palette buttons", () => {
    render(<QuantumCircuit />);
    expect(screen.getByText("H")).toBeTruthy();
    expect(screen.getByText("X")).toBeTruthy();
    expect(screen.getByText("Y")).toBeTruthy();
    expect(screen.getByText("Z")).toBeTruthy();
    expect(screen.getByText("CNOT")).toBeTruthy();
    expect(screen.getByText("S")).toBeTruthy();
    expect(screen.getByText("T")).toBeTruthy();
    expect(screen.getByText("RX")).toBeTruthy();
    expect(screen.getByText("RY")).toBeTruthy();
  });

  it("shows Run Circuit button", () => {
    render(<QuantumCircuit />);
    expect(screen.getByText("▶ Run")).toBeTruthy();
  });

  it("shows preset buttons", () => {
    render(<QuantumCircuit />);
    expect(screen.getByText("Bell State")).toBeTruthy();
    expect(screen.getByText("GHZ State")).toBeTruthy();
    expect(screen.getByText("Teleportation")).toBeTruthy();
  });

  it("shows probability message after running circuit", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    await user.click(screen.getByText("Bell State"));
    await user.click(screen.getByText("▶ Run"));
    expect(screen.getByText(/Circuit executed/)).toBeTruthy();
  });

  it("clicking gate button selects it", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    const hBtn = screen.getByText("H");
    await user.click(hBtn);
    expect(hBtn.className).toContain("bg-amber-500");
    expect(screen.getByText(/Click a grid cell to place/)).toBeTruthy();
  });

  it("clicking gate button again deselects it", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    const hBtn = screen.getByText("H");
    await user.click(hBtn);
    await user.click(hBtn);
    expect(hBtn.className).toContain("bg-[#16162a]");
    expect(screen.queryByText(/Click a grid cell to place/)).toBeNull();
  });

  it("Bell State preset loads circuit", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    await user.click(screen.getByText("Bell State"));
    await user.click(screen.getByText("▶ Run"));
    expect(screen.getByText(/Circuit executed/)).toBeTruthy();
  });

  it("shows RX angle controls when RX gate selected", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    await user.click(screen.getByText("RX"));
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeTruthy();
  });

  it("shows RY angle controls when RY gate selected", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    await user.click(screen.getByText("RY"));
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeTruthy();
  });

  it("hides angle controls when non-RX/RY gate selected", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    await user.click(screen.getByText("H"));
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeNull();
  });

  it("shows Gates label", () => {
    render(<QuantumCircuit />);
    expect(screen.getByText("Gates")).toBeTruthy();
  });

  it("shows Clear button", () => {
    render(<QuantumCircuit />);
    expect(screen.getByText("Clear")).toBeTruthy();
  });

  it("compact mode has no buttons or controls", () => {
    render(<QuantumCircuit compact />);
    const buttons = document.querySelectorAll("button");
    expect(buttons.length).toBe(0);
  });

  it("canvas is clickable in full mode", async () => {
    const user = userEvent.setup();
    render(<QuantumCircuit />);
    const canvas = document.querySelector("canvas")!;
    expect(canvas).toBeTruthy();
    await user.click(screen.getByText("H"));
    await user.click(canvas);
  });
});
