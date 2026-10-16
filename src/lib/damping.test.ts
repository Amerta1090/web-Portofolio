import { describe, expect, it } from "vitest";
import { DAMPING_TAU_CURSOR, MAX_FRAME_DT, clampDt, frameDampingFactor } from "./damping";

describe("frameDampingFactor", () => {
  it("reproduces the old 0.12 constant at reference 60 fps (feel-preserving)", () => {
    expect(frameDampingFactor(1 / 60, DAMPING_TAU_CURSOR)).toBeCloseTo(0.12, 2);
  });

  it("returns 0 for no/elapsed-negative/non-finite time (never NaN)", () => {
    expect(frameDampingFactor(0)).toBe(0);
    expect(frameDampingFactor(-0.016)).toBe(0);
    expect(frameDampingFactor(Number.NaN)).toBe(0);
    expect(frameDampingFactor(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("is monotonic in dt and bounded by 1 (converges, never overshoots)", () => {
    const a = frameDampingFactor(1 / 120);
    const b = frameDampingFactor(1 / 60);
    const c = frameDampingFactor(1 / 30);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(frameDampingFactor(10)).toBeLessThanOrEqual(1);
  });

  it("120 fps twins the 60 fps curve over the same wall time (rate independence)", () => {
    // Two 120 Hz frames must (almost) equal one 60 Hz frame: remaining
    // distance after n frames is (1-k)^n; compare remaining, not position.
    const k60 = frameDampingFactor(1 / 60);
    const k120 = frameDampingFactor(1 / 120);
    expect((1 - k120) ** 2).toBeCloseTo(1 - k60, 3);
  });
});

describe("clampDt", () => {
  it("caps tab-switch spikes at MAX_FRAME_DT", () => {
    expect(clampDt(2.5)).toBe(MAX_FRAME_DT);
    expect(clampDt(Number.POSITIVE_INFINITY)).toBe(MAX_FRAME_DT);
    expect(clampDt(0.016)).toBeCloseTo(0.016, 5);
  });

  it("maps garbage to 0 (never negative, never NaN)", () => {
    expect(clampDt(-1)).toBe(0);
    expect(clampDt(Number.NaN)).toBe(0);
  });
});
