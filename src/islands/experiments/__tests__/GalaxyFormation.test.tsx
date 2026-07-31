import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GalaxyFormation, {
  createParticles,
  densityColorRamp,
  stepSimulation,
} from "../GalaxyFormation";

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
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    canvas: {} as HTMLCanvasElement,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: "",
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
    rect: vi.fn(),
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

describe("GalaxyFormation", () => {
  it("renders canvas element", () => {
    render(<GalaxyFormation />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<GalaxyFormation compact />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
  });

  it("has dark background class", () => {
    const { container } = render(<GalaxyFormation />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-[#0f0f11]");
  });

  it("shows Pause button in full mode", () => {
    render(<GalaxyFormation />);
    expect(screen.getByText("Pause")).toBeTruthy();
  });

  it("shows Reset button in full mode", () => {
    render(<GalaxyFormation />);
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("has dark matter fraction slider", () => {
    render(<GalaxyFormation />);
    const labels = document.querySelectorAll("label");
    const dmLabel = Array.from(labels).find((l) => l.textContent?.includes("Dark matter"));
    expect(dmLabel).toBeTruthy();
    const slider = dmLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
    expect((slider as HTMLInputElement).max).toBe("0.8");
  });

  it("has angular momentum slider", () => {
    render(<GalaxyFormation />);
    const labels = document.querySelectorAll("label");
    const amLabel = Array.from(labels).find((l) => l.textContent?.includes("Angular momentum"));
    expect(amLabel).toBeTruthy();
    const slider = amLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("has speed slider", () => {
    render(<GalaxyFormation />);
    const labels = document.querySelectorAll("label");
    const speedLabel = Array.from(labels).find((l) => l.textContent?.includes("Speed"));
    expect(speedLabel).toBeTruthy();
    const slider = speedLabel!.querySelector("input[type=range]");
    expect(slider).toBeTruthy();
  });

  it("shows stats overlay in full mode", () => {
    render(<GalaxyFormation />);
    expect(screen.getByText(/Particles:/)).toBeTruthy();
    expect(screen.getAllByText(/Dark matter:/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Baryonic:/)).toBeTruthy();
    expect(screen.getByText(/Age:/)).toBeTruthy();
  });

  it("shows density legend in full mode", () => {
    render(<GalaxyFormation />);
    expect(screen.getByText(/low density/)).toBeTruthy();
    expect(screen.getByText(/dark matter/)).toBeTruthy();
  });

  it("hides controls in compact mode", () => {
    render(<GalaxyFormation compact />);
    expect(screen.queryByText("Pause")).toBeFalsy();
    expect(screen.queryByText("Reset")).toBeFalsy();
    expect(screen.queryByText(/Particles:/)).toBeFalsy();
  });

  it("Pause toggles to Play on click", async () => {
    const user = userEvent.setup();
    render(<GalaxyFormation />);
    await user.click(screen.getByText("Pause"));
    expect(screen.getByText("Play")).toBeTruthy();
  });

  it("canvas has aria-label", () => {
    render(<GalaxyFormation />);
    const canvas = document.querySelector("canvas");
    expect(canvas?.getAttribute("aria-label")).toMatch(/galaxy/i);
  });
});

describe("densityColorRamp", () => {
  it("returns blue at t=0", () => {
    expect(densityColorRamp(0)).toEqual([59, 130, 246]);
  });

  it("returns cyan at low-density stop", () => {
    expect(densityColorRamp(0.34)).toEqual([34, 211, 238]);
  });

  it("returns amber at high-density stop", () => {
    expect(densityColorRamp(0.66)).toEqual([245, 158, 11]);
  });

  it("returns red at t=1", () => {
    expect(densityColorRamp(1)).toEqual([239, 68, 68]);
  });

  it("clamps values outside [0,1]", () => {
    expect(densityColorRamp(-0.5)).toEqual([59, 130, 246]);
    expect(densityColorRamp(2)).toEqual([239, 68, 68]);
  });

  it("green channel decreases from cyan to red stops", () => {
    for (let t = 0.34; t < 1; t += 0.01) {
      const [, g1] = densityColorRamp(t);
      const [, g2] = densityColorRamp(t + 0.01);
      expect(g2).toBeLessThanOrEqual(g1);
    }
  });
});

describe("createParticles", () => {
  it("returns requested number of particles", () => {
    const ps = createParticles(700, 0.3, 1.0, 42);
    expect(ps.length).toBe(700);
  });

  it("labels particles according to dark matter fraction", () => {
    const ps = createParticles(100, 0.5, 1.0, 42);
    const dark = ps.filter((p) => p.dark).length;
    expect(dark).toBe(50);
  });

  it("spawns all particles inside the initial disk", () => {
    const ps = createParticles(500, 0.3, 1.0, 7);
    for (const p of ps) {
      expect(Math.sqrt(p.x * p.x + p.y * p.y)).toBeLessThanOrEqual(1.001);
    }
  });

  it("gives particles positive angular momentum when am > 0", () => {
    const ps = createParticles(300, 0.3, 1.8, 99);
    let meanL = 0;
    for (const p of ps) meanL += p.x * p.vy - p.y * p.vx;
    meanL /= ps.length;
    expect(meanL).toBeGreaterThan(0.1);
  });

  it("gives near-zero angular momentum when am = 0", () => {
    const ps = createParticles(300, 0.3, 0, 99);
    let meanL = 0;
    for (const p of ps) meanL += p.x * p.vy - p.y * p.vx;
    meanL /= ps.length;
    expect(Math.abs(meanL)).toBeLessThan(0.05);
  });
});

describe("stepSimulation", () => {
  it("advances particle positions", () => {
    const ps = createParticles(50, 0.3, 1.0, 5);
    const acc = new Float64Array(50 * 2);
    const before = ps.map((p) => [p.x, p.y]);
    stepSimulation(ps, acc, 0.01, 0.09, 1);
    let moved = false;
    for (let i = 0; i < ps.length; i++) {
      if (Math.abs(ps[i].x - before[i][0]) > 1e-9 || Math.abs(ps[i].y - before[i][1]) > 1e-9) {
        moved = true;
        break;
      }
    }
    expect(moved).toBe(true);
  });

  it("cooling factor reduces speed magnitude", () => {
    const warmPs = createParticles(50, 0.3, 1.0, 5);
    const warmAcc = new Float64Array(50 * 2);
    stepSimulation(warmPs, warmAcc, 0.01, 0.09, 1);

    const cooledPs = createParticles(50, 0.3, 1.0, 5);
    const cooledAcc = new Float64Array(50 * 2);
    stepSimulation(cooledPs, cooledAcc, 0.01, 0.09, 0.5);

    let warmSpeed = 0;
    for (const p of warmPs) warmSpeed += Math.hypot(p.vx, p.vy);
    let cooledSpeed = 0;
    for (const p of cooledPs) cooledSpeed += Math.hypot(p.vx, p.vy);
    expect(cooledSpeed).toBeLessThan(warmSpeed);
  });
});
