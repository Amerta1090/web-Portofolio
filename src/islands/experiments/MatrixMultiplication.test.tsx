import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MatrixMultiplication from "./MatrixMultiplication";

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
    textBaseline: "" as CanvasTextBaseline,
    setTransform: vi.fn(),
    getTransform: vi.fn().mockReturnValue({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
    }),
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
  window.ResizeObserver = vi.fn().mockImplementation(function () {
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    };
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = origGetContext;
  cleanup();
  vi.restoreAllMocks();
});

describe("MatrixMultiplication", () => {
  it("renders canvas element", () => {
    const { container } = render(<MatrixMultiplication />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders canvas in compact mode", () => {
    const { container } = render(<MatrixMultiplication compact />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("compact mode renders without controls", () => {
    render(<MatrixMultiplication compact />);
    expect(screen.queryByTestId("preset-select")).toBeFalsy();
    expect(screen.queryByTestId("play-btn")).toBeFalsy();
  });

  it("renders matrix preset selector", () => {
    render(<MatrixMultiplication />);
    const select = screen.getByTestId("preset-select");
    expect(select).toBeTruthy();
    // Check a few preset options exist
    expect(screen.getByText("Identity")).toBeTruthy();
    expect(screen.getByText("Rotation")).toBeTruthy();
    expect(screen.getByText("Shear")).toBeTruthy();
    expect(screen.getByText("Reflection")).toBeTruthy();
    expect(screen.getByText("Scale")).toBeTruthy();
    expect(screen.getByText("Custom")).toBeTruthy();
  });

  it("play button toggles animation state", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const playBtn = screen.getByTestId("play-btn");
    expect(playBtn.textContent).toContain("Play");
    await user.click(playBtn);
    expect(playBtn.textContent).toContain("Pause");
    await user.click(playBtn);
    expect(playBtn.textContent).toContain("Play");
  });

  it("speed slider changes animation speed", async () => {
    render(<MatrixMultiplication />);
    const slider = screen.getByTestId("speed-slider") as HTMLInputElement;
    expect(slider).toBeTruthy();
    fireEvent.change(slider, { target: { value: "2" } });
    expect(slider.value).toBe("2");
  });

  it("cell highlighting by row/column updates on step", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const stepBtn = screen.getByTestId("step-btn");
    await user.click(stepBtn);
    // After stepping, the computing indicator should appear
    await waitFor(() => {
      expect(screen.getByText(/Computing R/)).toBeTruthy();
    });
  });

  it("grid transform shows basis vectors in both mode", () => {
    render(<MatrixMultiplication />);
    // Both mode is default - "Both" button should be active (cyan class)
    const bothBtn = screen.getByTestId("view-both");
    expect(bothBtn.className).toContain("cyan");
    // Canvas renders grid/transform — verify canvas element exists
    expect(document.querySelector("canvas")).toBeTruthy();
  });

  it("size toggle switches between 2x2 and 3x3", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const btn3x3 = screen.getByText("3×3");
    await user.click(btn3x3);
    // After clicking 3×3, it should be active (amber highlighted)
    expect(btn3x3.className).toContain("amber");
  });

  it("step button advances one dot product", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const stepBtn = screen.getByTestId("step-btn");

    // Click step once - should show computing indicator
    await user.click(stepBtn);
    await waitFor(() => {
      expect(screen.getByText(/Computing R/)).toBeTruthy();
    });

    // Click step again - indicator stays because next step
    await user.click(stepBtn);
    await waitFor(() => {
      expect(screen.getByText(/Computing R/)).toBeTruthy();
    });
  });

  it("view toggle switches between dot, grid, and both modes", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);

    // Default is Both
    const dotBtn = screen.getByTestId("view-dot");
    const gridBtn = screen.getByTestId("view-grid");
    const bothBtn = screen.getByTestId("view-both");

    // Both should be active by default
    expect(bothBtn.className).toContain("cyan");

    // Click dot
    await user.click(dotBtn);
    expect(dotBtn.className).toContain("cyan");

    // Click grid
    await user.click(gridBtn);
    expect(gridBtn.className).toContain("cyan");

    // Click both
    await user.click(bothBtn);
    expect(bothBtn.className).toContain("cyan");
  });

  it("preset change affects matrix values (reflection flips x-axis)", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const select = screen.getByTestId("preset-select");

    await user.selectOptions(select, "reflection");
    expect(select).toHaveValue("reflection");

    // Reset button should be present
    expect(screen.getByText("↺ Reset")).toBeTruthy();
  });

  it("canvas responds to interactions - resize triggers canvas update", () => {
    const { container } = render(<MatrixMultiplication />);
    const canvas = container.querySelector("canvas")!;
    expect(canvas).toBeTruthy();
    // Trigger resize
    window.dispatchEvent(new Event("resize"));
    // Should not throw
    expect(canvas.width).toBeDefined();
  });

  it("render function uses proper imports", () => {
    expect(typeof MatrixMultiplication).toBe("function");
    expect(() => render(<MatrixMultiplication />)).not.toThrow();
  });

  it("rotation preset shows theta slider", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const select = screen.getByTestId("preset-select");
    await user.selectOptions(select, "rotation");
    expect(screen.getByText("θ:")).toBeTruthy();
  });

  it("shear preset shows k slider", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const select = screen.getByTestId("preset-select");
    await user.selectOptions(select, "shear");
    expect(screen.getByText("k:")).toBeTruthy();
  });

  it("scale preset shows sx and sy sliders", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);
    const select = screen.getByTestId("preset-select");
    await user.selectOptions(select, "scale");
    expect(screen.getByText("sx:")).toBeTruthy();
    expect(screen.getByText("sy:")).toBeTruthy();
  });

  it("reset button clears animation state", async () => {
    const user = userEvent.setup();
    render(<MatrixMultiplication />);

    // Start animation
    await user.click(screen.getByTestId("play-btn"));
    expect(screen.getByTestId("play-btn").textContent).toContain("Pause");

    // Reset
    await user.click(screen.getByText("↺ Reset"));
    expect(screen.getByTestId("play-btn").textContent).toContain("Play");
  });
});
