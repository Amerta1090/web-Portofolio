import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VonKarmannVortex from "./VonKarmannVortex";

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

describe("VonKarmannVortex", () => {
  it("renders canvas element", () => {
    render(<VonKarmannVortex />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<VonKarmannVortex compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has Reynolds number slider", () => {
    render(<VonKarmannVortex />);
    const labels = document.querySelectorAll("label");
    const reLabel = Array.from(labels).find((l) => l.textContent?.includes("Re"));
    expect(reLabel).toBeTruthy();
  });

  it("has flow speed slider", () => {
    render(<VonKarmannVortex />);
    const labels = document.querySelectorAll("label");
    const uLabel = Array.from(labels).find((l) => l.textContent?.includes("U"));
    expect(uLabel).toBeTruthy();
  });

  it("has cylinder radius slider", () => {
    render(<VonKarmannVortex />);
    const labels = document.querySelectorAll("label");
    const rLabel = Array.from(labels).find((l) => l.textContent?.includes("R"));
    expect(rLabel).toBeTruthy();
  });

  it("shows Streamlines toggle button", () => {
    render(<VonKarmannVortex />);
    expect(screen.getByText("Streamlines")).toBeTruthy();
  });

  it("shows color mode toggle button", () => {
    render(<VonKarmannVortex />);
    expect(screen.getByText("Velocity")).toBeTruthy();
  });

  it("shows Pause button", () => {
    render(<VonKarmannVortex />);
    expect(screen.getByText("Pause")).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<VonKarmannVortex compact />);
    expect(screen.queryByText("Streamlines")).toBeFalsy();
    expect(screen.queryByText("Velocity")).toBeFalsy();
    expect(screen.queryByText("Pause")).toBeFalsy();
  });

  it("toggles streamlines on click", async () => {
    const user = userEvent.setup();
    render(<VonKarmannVortex />);
    const btn = screen.getByText("Streamlines");
    await user.click(btn);
    expect(btn.className).toContain("amber");
  });

  it("toggles pause on click", async () => {
    const user = userEvent.setup();
    render(<VonKarmannVortex />);
    const btn = screen.getByText("Pause");
    await user.click(btn);
    expect(btn.textContent).toBe("Resume");
    await user.click(btn);
    expect(btn.textContent).toBe("Pause");
  });

  it("toggles color mode on click", async () => {
    const user = userEvent.setup();
    render(<VonKarmannVortex />);
    const btn = screen.getByText("Velocity");
    await user.click(btn);
    expect(btn.textContent).toBe("Vorticity");
    await user.click(btn);
    expect(btn.textContent).toBe("Velocity");
  });

  it("has container with dark background", () => {
    const { container } = render(<VonKarmannVortex />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("renders without crashing", () => {
    const { container } = render(<VonKarmannVortex />);
    expect(container.querySelector("canvas")).toBeTruthy();
  });
});
