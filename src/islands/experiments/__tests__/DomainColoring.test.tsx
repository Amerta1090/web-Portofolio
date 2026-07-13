import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DomainColoring from "../DomainColoring";

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
    drawImage: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
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

describe("DomainColoring", () => {
  it("renders canvas element", () => {
    render(<DomainColoring />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<DomainColoring compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<DomainColoring />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows function selector buttons", () => {
    render(<DomainColoring />);
    expect(screen.getByText("z^2")).toBeTruthy();
    expect(screen.getByText("z^3")).toBeTruthy();
    expect(screen.getByText("1/z")).toBeTruthy();
    expect(screen.getByText("e^z")).toBeTruthy();
    expect(screen.getByText("sin(z)")).toBeTruthy();
    expect(screen.getByText("cos(z)")).toBeTruthy();
    expect(screen.getByText("tanh(z)")).toBeTruthy();
  });

  it("shows formula display", () => {
    render(<DomainColoring />);
    expect(screen.getByText(/f\(z\)\s*=/)).toBeTruthy();
  });

  it("shows zoom controls", () => {
    render(<DomainColoring />);
    expect(screen.getByText("+")).toBeTruthy();
    expect(screen.getByText("−")).toBeTruthy();
  });

  it("shows grid overlay toggle", () => {
    render(<DomainColoring />);
    expect(screen.getByText("Grid")).toBeTruthy();
  });

  it("shows auto-rotate toggle", () => {
    render(<DomainColoring />);
    expect(screen.getByText("Rotate")).toBeTruthy();
  });

  it("shows Reset button", () => {
    render(<DomainColoring />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("shows HSL color legend", () => {
    render(<DomainColoring />);
    expect(screen.getByText("Hue → Arg(w)")).toBeTruthy();
    const svg = document.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<DomainColoring compact />);
    expect(screen.queryByText("z^2")).toBeFalsy();
    expect(screen.queryByText("Grid")).toBeFalsy();
    expect(screen.queryByText("Rotate")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText("Hue → Arg(w)")).toBeFalsy();
    expect(screen.queryByText("+")).toBeFalsy();
    expect(screen.queryByText("−")).toBeFalsy();
  });

  it("switches function on button click", async () => {
    const user = userEvent.setup();
    render(<DomainColoring />);
    expect(screen.getByText(/f\(z\)\s*=\s*z\^2/)).toBeTruthy();
    await user.click(screen.getByText("sin(z)"));
    expect(screen.getByText(/f\(z\)\s*=\s*sin\(z\)/)).toBeTruthy();
  });

  it("highlights active function button", async () => {
    const user = userEvent.setup();
    render(<DomainColoring />);
    const z2Btn = screen.getByText("z^2");
    expect(z2Btn.className).toContain("bg-amber-500/20");
    await user.click(screen.getByText("e^z"));
    const ezBtn = screen.getByText("e^z");
    expect(ezBtn.className).toContain("bg-amber-500/20");
    expect(z2Btn.className).toContain("text-white/50");
  });

  it("toggles grid overlay on click", async () => {
    const user = userEvent.setup();
    render(<DomainColoring />);
    const gridBtn = screen.getByText("Grid");
    expect(gridBtn.className).toContain("bg-white/10");
    await user.click(gridBtn);
    expect(gridBtn.className).not.toContain("bg-white/10");
    await user.click(gridBtn);
    expect(gridBtn.className).toContain("bg-white/10");
  });

  it("toggles auto-rotate on click", async () => {
    const user = userEvent.setup();
    render(<DomainColoring />);
    const rotateBtn = screen.getByText("Rotate");
    expect(rotateBtn.className).not.toContain("bg-amber-500/20");
    await user.click(rotateBtn);
    expect(rotateBtn.className).toContain("bg-amber-500/20");
    await user.click(rotateBtn);
    expect(rotateBtn.className).not.toContain("bg-amber-500/20");
  });
});
