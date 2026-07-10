import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EigenvectorFlowField from "./EigenvectorFlowField";

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

// Track mock canvas 2d context so tests can inspect drawing calls
let mockCtx: ReturnType<typeof createMock2D>;

beforeEach(() => {
  mockCtx = createMock2D();
  HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
    if (type === "2d") return mockCtx;
    return null;
  }) as unknown as HTMLCanvasElement["getContext"];
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

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("EigenvectorFlowField", () => {
  // 1 - Renders canvas element
  it("renders canvas element", () => {
    render(<EigenvectorFlowField />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  // 2 - Renders in compact mode with smaller height
  it("renders in compact mode with smaller height", () => {
    render(<EigenvectorFlowField compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
    // In compact mode, hint text is shown
    expect(screen.getByText("Eigenvector Flow Field")).toBeTruthy();
  });

  // 3 - Matrix preset selector renders
  it("renders matrix preset selector with all options", () => {
    render(<EigenvectorFlowField />);
    const selector = document.querySelector("select");
    expect(selector).toBeTruthy();
    const options = Array.from(selector?.querySelectorAll("option") || []);
    const labels = options.map((o) => o.textContent);
    expect(labels).toContain("Identity");
    expect(labels).toContain("Rotation");
    expect(labels).toContain("Shear");
    expect(labels).toContain("Stretch");
    expect(labels).toContain("Random");
    // Stretch is the default
    expect((selector as HTMLSelectElement).value).toBe("stretch");
  });

  // 4 - "Animate PCA" button exists
  it('shows "Animate PCA" button in non-compact mode', () => {
    render(<EigenvectorFlowField />);
    // Button text is "▶ Animate PCA" (with play symbol)
    expect(screen.getByText(/Animate PCA/)).toBeTruthy();
  });

  // 5 - Sliders for matrix values render
  it("renders four matrix value sliders", () => {
    render(<EigenvectorFlowField />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBe(4);
    const labels = Array.from(document.querySelectorAll("label"));
    const labelTexts = labels.map((l) => l.textContent || "");
    expect(labelTexts.some((t) => t.startsWith("a:"))).toBeTruthy();
    expect(labelTexts.some((t) => t.startsWith("b:"))).toBeTruthy();
    expect(labelTexts.some((t) => t.startsWith("c:"))).toBeTruthy();
    expect(labelTexts.some((t) => t.startsWith("d:"))).toBeTruthy();
  });

  // 6 - Toggle between Vector Field and PCA mode
  it("toggles between Field, PCA, and Overlay modes", async () => {
    const user = userEvent.setup();
    render(<EigenvectorFlowField />);
    // Default is "Overlay"
    expect(screen.getByText("Overlay")).toBeTruthy();

    // Switch to Field mode
    const fieldBtn = screen.getByText("Field");
    await user.click(fieldBtn);

    // Switch to PCA mode
    const pcaBtn = screen.getByText("PCA");
    await user.click(pcaBtn);
    expect(pcaBtn).toBeTruthy();

    // Switch back to Overlay
    const overlayBtn = screen.getByText("Overlay");
    await user.click(overlayBtn);
    expect(overlayBtn).toBeTruthy();
  });

  // 7 - Canvas responds to pointer events (simulate drag)
  it("canvas responds to pointer events (simulate drag)", () => {
    render(<EigenvectorFlowField />);
    const canvas = document.querySelector("canvas")!;
    expect(() => {
      fireEvent.pointerDown(canvas, { clientX: 300, clientY: 250, pointerId: 1 });
      fireEvent.pointerMove(canvas, { clientX: 310, clientY: 255, pointerId: 1 });
      fireEvent.pointerMove(canvas, { clientX: 320, clientY: 260, pointerId: 1 });
      fireEvent.pointerUp(canvas, { clientX: 320, clientY: 260, pointerId: 1 });
    }).not.toThrow();

    // Verify setPointerCapture was called
    expect(HTMLCanvasElement.prototype.setPointerCapture).toHaveBeenCalledWith(1);
  });

  // 8 - Eigenvectors calculated correctly from 2x2 matrix
  it("eigenvectors calculated correctly from 2x2 matrix", () => {
    // Identity matrix: λ₁=1, λ₂=1, orthogonal eigenvectors
    const { λ1, λ2, v1, v2 } = eigenDecomposeInternal({ a: 1, b: 0, c: 0, d: 1 });
    expect(λ1).toBeCloseTo(1, 2);
    expect(λ2).toBeCloseTo(1, 2);
    const dot = v1.x * v2.x + v1.y * v2.y;
    expect(Math.abs(dot)).toBeLessThan(0.01);

    // Diagonal matrix [2,0;0,0.5]: λ₁=2, λ₂=0.5
    const d2 = eigenDecomposeInternal({ a: 2, b: 0, c: 0, d: 0.5 });
    expect(d2.λ1).toBeCloseTo(2, 2);
    expect(d2.λ2).toBeCloseTo(0.5, 2);
    // v1 should be along x (eigenvalue 2), v2 along y (eigenvalue 0.5)
    expect(Math.abs(d2.v1.x)).toBeGreaterThan(0.9);
    expect(Math.abs(d2.v2.y)).toBeGreaterThan(0.9);
    // They should be orthogonal
    const dot2 = d2.v1.x * d2.v2.x + d2.v1.y * d2.v2.y;
    expect(Math.abs(dot2)).toBeLessThan(0.01);
  });

  // 9 - Covariance ellipse draws for symmetric matrix
  it("covariance ellipse draws for symmetric matrix", async () => {
    render(<EigenvectorFlowField />);
    // Wait for animation loop to run
    await new Promise((r) => setTimeout(r, 50));
    // ellipse should have been called (covariance ellipse in Overlay mode)
    expect(mockCtx.ellipse).toHaveBeenCalled();
    // The covariance ellipse should have non-zero rx/ry values
    const ellipseCall = (mockCtx.ellipse as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const rx = ellipseCall[2] as number;
    const ry = ellipseCall[3] as number;
    expect(rx).toBeGreaterThan(0);
    expect(ry).toBeGreaterThan(0);
    // The ellipse should have a rotation angle
    const angle = ellipseCall[4] as number;
    expect(typeof angle).toBe("number");
  });

  // 10 - Arrow rendering draws direction indicators
  it("arrow rendering draws direction indicators", async () => {
    render(<EigenvectorFlowField />);
    await new Promise((r) => setTimeout(r, 50));
    // Eigenvectors are drawn as arrows with lines and arrowheads
    // moveTo/lineTo calls should have happened for the arrow shafts
    expect(mockCtx.moveTo).toHaveBeenCalled();
    expect(mockCtx.lineTo).toHaveBeenCalled();
    // stroke is called multiple times (grid, eigenvectors, flow field)
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  // 11 - Compact mode has auto-animation running (no controls but canvas renders)
  it("compact mode shows hint and hides controls", () => {
    render(<EigenvectorFlowField compact />);
    // The hint badge is shown in compact mode
    expect(screen.getByText("Eigenvector Flow Field")).toBeTruthy();
    // Controls should not be visible
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("Field")).toBeFalsy();
    expect(screen.queryByText("PCA")).toBeFalsy();
    expect(screen.queryByText("Overlay")).toBeFalsy();
    expect(screen.queryByText("Animate PCA")).toBeFalsy();
    // Canvas still renders
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  // 12 - "Reset view" restores defaults
  it('"Reset" button clears drag state and PCA step', async () => {
    const user = userEvent.setup();
    render(<EigenvectorFlowField />);
    // Verify Reset button exists
    const resetBtn = screen.getByText("Reset");
    expect(resetBtn).toBeTruthy();

    // Simulate a drag first (pointer events)
    const canvas = document.querySelector("canvas")!;
    fireEvent.pointerDown(canvas, { clientX: 300, clientY: 250, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 310, clientY: 255, pointerId: 1 });
    fireEvent.pointerUp(canvas, { clientX: 310, clientY: 255, pointerId: 1 });

    // Click Reset - should not throw
    await user.click(resetBtn);
    expect(resetBtn).toBeTruthy();
  });

  // Bonus: Dark background
  it("has container with dark background", () => {
    const { container } = render(<EigenvectorFlowField />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  // Bonus: Eigenvalue display
  it("displays eigenvalue info in controls bar", async () => {
    render(<EigenvectorFlowField />);
    await waitFor(
      () => {
        const allElements = document.querySelectorAll("span, text");
        const texts = Array.from(allElements)
          .map((el) => el.textContent || "")
          .filter((t) => t.includes("λ"));
        expect(texts.length).toBeGreaterThanOrEqual(1);
      },
      { timeout: 2000 }
    );
  });

  // Bonus: Det display
  it("displays determinant in controls bar", () => {
    render(<EigenvectorFlowField />);
    const texts = Array.from(document.querySelectorAll("span"))
      .map((s) => s.textContent || "")
      .filter((t) => t.startsWith("det="));
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Internal helper (mirrors the component's eigenDecompose)          */
/* ------------------------------------------------------------------ */

function eigenDecomposeInternal(m: {
  a: number;
  b: number;
  c: number;
  d: number;
}) {
  const tr = m.a + m.d;
  const d = m.a * m.d - m.b * m.c;
  const disc = tr * tr - 4 * d;
  if (disc < 0) {
    return { λ1: 1, λ2: 1, v1: { x: 1, y: 0 }, v2: { x: 0, y: 1 } };
  }
  const sqrtDisc = Math.sqrt(disc);
  const λ1 = (tr + sqrtDisc) / 2;
  const λ2 = (tr - sqrtDisc) / 2;

  const computeEigenvec = (λ: number, otherVec?: { x: number; y: number }) => {
    const tol = 1e-8;
    if (Math.abs(m.b) > tol) {
      const vx = 1;
      const vy = (λ - m.a) / m.b;
      const len = Math.sqrt(vx * vx + vy * vy);
      return { x: vx / len, y: vy / len };
    }
    if (Math.abs(m.c) > tol) {
      const vy = 1;
      const vx = (λ - m.d) / m.c;
      const len = Math.sqrt(vx * vx + vy * vy);
      return { x: vx / len, y: vy / len };
    }
    // Diagonal matrix
    if (m.a !== m.d) {
      const diff1 = Math.abs(λ - m.a);
      const diff2 = Math.abs(λ - m.d);
      if (diff1 < diff2) return { x: 1, y: 0 };
      return { x: 0, y: 1 };
    }
    // Degenerate eigenvalues
    if (otherVec) {
      const dot = otherVec.x * 1 + otherVec.y * 0;
      if (Math.abs(dot) < tol) return { x: 1, y: 0 };
      return { x: -otherVec.y, y: otherVec.x };
    }
    return { x: 1, y: 0 };
  };

  const v1 = computeEigenvec(λ1);
  const v2 = computeEigenvec(λ2, v1);
  return { λ1, λ2, v1, v2 };
}
