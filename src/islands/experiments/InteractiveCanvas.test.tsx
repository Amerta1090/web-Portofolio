import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InteractiveCanvas from "./InteractiveCanvas";

function createMock2D() {
  const canvas = document.createElement("canvas");
  return {
    canvas,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    setTransform: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
    getContext: vi.fn().mockReturnThis(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    shadowBlur: 0,
    shadowColor: "",
  } as unknown as CanvasRenderingContext2D;
}

const origGetContext = HTMLCanvasElement.prototype.getContext;

describe("InteractiveCanvas", () => {
  let mock2D: ReturnType<typeof createMock2D>;

  beforeEach(() => {
    mock2D = createMock2D();
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === "2d") return mock2D;
      return null;
    }) as any;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = origGetContext;
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders canvas element", () => {
    const { container } = render(<InteractiveCanvas />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });

  it("compact mode renders without crashing", () => {
    const { container } = render(<InteractiveCanvas compact />);
    expect(container.firstChild).toBeTruthy();
  });

  it("compact mode does not show toolbar", () => {
    render(<InteractiveCanvas compact />);
    expect(screen.queryByText("Pen")).toBeNull();
    expect(screen.queryByText("Eraser")).toBeNull();
  });

  it("renders tool buttons in full mode", () => {
    render(<InteractiveCanvas />);
    const buttons = screen.getAllByRole("button");
    TOOL_LABELS.forEach((label) => {
      const found = buttons.some(b => b.textContent?.includes(label));
      expect(found).toBe(true);
    });
  });

  it("renders color palette", () => {
    render(<InteractiveCanvas />);
    const buttons = document.querySelectorAll('button[style*="background-color"]');
    expect(buttons.length).toBe(8);
  });

  it("renders export buttons", () => {
    render(<InteractiveCanvas />);
    expect(screen.getByText("PNG")).toBeTruthy();
    expect(screen.getByText("SVG")).toBeTruthy();
  });

  it("renders clear button", () => {
    render(<InteractiveCanvas />);
    expect(screen.getByText("🗑 Clear")).toBeTruthy();
  });

  it("renders undo/redo buttons", () => {
    render(<InteractiveCanvas />);
    expect(screen.getByText("↶ Undo")).toBeTruthy();
    expect(screen.getByText("↷ Redo")).toBeTruthy();
  });

  it("renders size slider", () => {
    render(<InteractiveCanvas />);
    const sliders = document.querySelectorAll('input[type="range"]');
    expect(sliders.length).toBe(2);
  });

  it("renders timeline in full mode", () => {
    render(<InteractiveCanvas />);
    expect(screen.getByText(/snapshots/)).toBeTruthy();
  });

  it("renders keyboard shortcut hint", () => {
    render(<InteractiveCanvas />);
    expect(screen.getByText(/V: Pan/)).toBeTruthy();
  });

  it("switches tool when clicking tool buttons", async () => {
    const user = userEvent.setup();
    render(<InteractiveCanvas />);
    await user.click(screen.getByTitle("Eraser (E)"));
    const eraserBtn = screen.getByTitle("Eraser (E)");
    expect(eraserBtn.className).toContain("bg-amber");
  });

  it("switches tool when pressing keyboard shortcuts", async () => {
    const user = userEvent.setup();
    render(<InteractiveCanvas />);
    document.body.focus();
    await user.keyboard("e");
    const eraserBtn = screen.getByTitle("Eraser (E)");
    expect(eraserBtn.className).toContain("bg-amber");
  });
});

const TOOL_LABELS = ["Pan", "Pen", "Marker", "Spray", "Eraser", "Particle", "Node"];
