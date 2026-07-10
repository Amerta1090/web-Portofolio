import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PCATSNEViz from "./PCATSNEViz";

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
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
  global.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PCATSNEViz", () => {
  it("renders canvas element", () => {
    const { container } = render(<PCATSNEViz />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders canvas in compact mode", () => {
    const { container } = render(<PCATSNEViz compact />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background container", () => {
    const { container } = render(<PCATSNEViz />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows Generate New Data button in non-compact mode", () => {
    render(<PCATSNEViz />);
    expect(screen.getByText(/Generate New Data/)).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<PCATSNEViz compact />);
    expect(screen.queryByText(/Generate New Data/)).toBeFalsy();
    expect(screen.queryByText("▶ Play")).toBeFalsy();
    expect(screen.queryByText("Center")).toBeFalsy();
  });

  it("renders PCA projection step controls", () => {
    render(<PCATSNEViz />);
    expect(screen.getByText("Center")).toBeTruthy();
    expect(screen.getByText("Covariance")).toBeTruthy();
    expect(screen.getByText("Eigenvectors")).toBeTruthy();
    expect(screen.getByText("Project")).toBeTruthy();
  });

  it("renders t-SNE play/pause button", () => {
    render(<PCATSNEViz />);
    const playBtn = screen.getByText("▶ Play");
    expect(playBtn).toBeTruthy();
  });

  it("t-SNE play button toggles to pause on click", async () => {
    const user = userEvent.setup();
    render(<PCATSNEViz />);
    const playBtn = screen.getByText("▶ Play");
    await user.click(playBtn);
    // After clicking play, it should become "⏸ Pause"
    await waitFor(() => {
      expect(screen.getByText("⏸ Pause")).toBeTruthy();
    });
  });

  it("renders perplexity slider with correct range", () => {
    render(<PCATSNEViz />);
    const sliders = document.querySelectorAll('input[type="range"]');
    // Perplexity slider has min=5
    const perpSlider = Array.from(sliders).find(
      (s) => (s as HTMLInputElement).min === "5",
    );
    expect(perpSlider).toBeTruthy();
  });

  it("renders cluster count slider", () => {
    render(<PCATSNEViz />);
    const sliders = document.querySelectorAll('input[type="range"]');
    // Cluster slider has min=2
    const clusterSlider = Array.from(sliders).find(
      (s) => (s as HTMLInputElement).min === "2",
    );
    expect(clusterSlider).toBeTruthy();
  });

  it("renders dimensionality slider", () => {
    render(<PCATSNEViz />);
    const sliders = document.querySelectorAll('input[type="range"]');
    // Dims slider has min=3
    const dimsSlider = Array.from(sliders).find(
      (s) => (s as HTMLInputElement).min === "3",
    );
    expect(dimsSlider).toBeTruthy();
  });

  it("shows t-SNE Step and Reset buttons", () => {
    render(<PCATSNEViz />);
    expect(screen.getByText(/Step/)).toBeTruthy();
    expect(screen.getByText(/Reset/)).toBeTruthy();
  });

  it("shows explained variance checkbox", () => {
    render(<PCATSNEViz />);
    const explVarLabel = screen.getByText("Expl. Var");
    expect(explVarLabel).toBeTruthy();
  });

  it("shows covariance heatmap checkbox", () => {
    render(<PCATSNEViz />);
    const covLabel = screen.getByText("Cov Σ");
    expect(covLabel).toBeTruthy();
  });

  it("compact mode overlay shows label", () => {
    render(<PCATSNEViz compact />);
    expect(screen.getByText("PCA + t-SNE")).toBeTruthy();
  });

  it("renders t-SNE speed slider", () => {
    render(<PCATSNEViz />);
    const sliders = document.querySelectorAll('input[type="range"]');
    const speedSlider = Array.from(sliders).find(
      (s) => (s as HTMLInputElement).step === "0.1",
    );
    expect(speedSlider).toBeTruthy();
  });

  it("shows iteration count", () => {
    render(<PCATSNEViz />);
    expect(screen.getByText(/Iter: 0\/500/)).toBeTruthy();
  });

  it("shows data label with point count and dims", () => {
    render(<PCATSNEViz />);
    // Default: 3 clusters × 50 pts = 150 pts, 5 dims
    expect(screen.getByText(/150 pts/)).toBeTruthy();
    expect(screen.getByText(/5D/)).toBeTruthy();
  });

  it("render function imports correctly", () => {
    expect(typeof PCATSNEViz).toBe("function");
    expect(() => render(<PCATSNEViz />)).not.toThrow();
  });
});
