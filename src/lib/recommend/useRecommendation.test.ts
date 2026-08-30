import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  TRACK_WEIGHTS,
  accumulateHistory,
  createViewTracker,
  rankRecommendations,
  useRecommendation,
  type Recommendable,
} from "./useRecommendation";

const LAB: Recommendable[] = [
  { id: "fluid", tags: ["canvas", "fluid", "solver"] },
  { id: "fractal", tags: ["fractal", "canvas", "glsl"] },
  { id: "audio", tags: ["audio", "fft", "web-audio"] },
  { id: "ml-clock", tags: ["ml", "neural-net", "backprop"] },
  { id: "snake", tags: ["game", "ml", "reinforcement"] },
  { id: "planet", tags: ["astronomy", "gravity", "n-body"] },
];

describe("accumulateHistory", () => {
  it("adds weighted tag counts into an existing vector", () => {
    const merged = accumulateHistory(new Map([["ml", 1]]), ["ml", "python"], 2);
    expect(merged.get("ml")).toBe(3);
    expect(merged.get("python")).toBe(2);
  });

  it("normalizes tags on merge", () => {
    const merged = accumulateHistory(new Map(), [" ML ", "ml"]);
    expect(merged.get("ml")).toBe(2);
  });

  it("does not mutate the input history", () => {
    const input = new Map([["ml", 1]]);
    accumulateHistory(input, ["web"], 3);
    expect(input.has("web")).toBe(false);
  });

  it("weights click heavier than hover, hover heavier than view", () => {
    expect(TRACK_WEIGHTS.click).toBeGreaterThan(TRACK_WEIGHTS.hover);
    expect(TRACK_WEIGHTS.hover).toBeGreaterThan(TRACK_WEIGHTS.view);
  });
});

describe("rankRecommendations", () => {
  const current: Recommendable = { id: "fluid", tags: ["canvas", "fluid"] };

  it("excludes the current item itself", () => {
    const ranked = rankRecommendations(current, LAB, new Map());
    expect(ranked.find((r) => r.item.id === "fluid")).toBeUndefined();
  });

  it("ranks by current tags when history is empty", () => {
    const ranked = rankRecommendations(current, LAB, new Map(), { limit: 10 });
    const [top] = ranked;
    expect(top.item.id).toBe("fractal"); // shares "canvas"
  });

  it("history dominates the query", () => {
    const history = new Map([["ml", 5], ["neural-net", 2]]);
    const ranked = rankRecommendations(current, LAB, history, { limit: 10 });
    const order = ranked.map((r) => r.item.id);
    expect(order[0]).toBe("ml-clock");
    expect(order.indexOf("ml-clock")).toBeLessThan(order.indexOf("snake"));
    expect(order.indexOf("snake")).toBeLessThan(order.indexOf("fractal"));
  });

  it("respects limit and minScore", () => {
    const ranked = rankRecommendations(current, LAB, new Map(), { limit: 2 });
    expect(ranked).toHaveLength(2);
    const scored = rankRecommendations(current, LAB, new Map(), {
      limit: 10,
      minScore: 0.5,
    });
    expect(scored.every((r) => r.score >= 0.5)).toBe(true);
  });

  it("honors excludeIds", () => {
    const ranked = rankRecommendations(current, LAB, new Map(), {
      limit: 10,
      excludeIds: new Set(["fractal", "audio"]),
    });
    expect(ranked.find((r) => r.item.id === "fractal")).toBeUndefined();
    expect(ranked.find((r) => r.item.id === "audio")).toBeUndefined();
  });

  it("is deterministic: identical inputs yield identical ordering", () => {
    const history = new Map([["audio", 2], ["shader", 1]]);
    const first = rankRecommendations(current, LAB, history, { limit: 10 });
    for (let i = 0; i < 10; i++) {
      const again = rankRecommendations(current, LAB, history, { limit: 10 });
      expect(again.map((r) => r.item.id)).toEqual(first.map((r) => r.item.id));
      expect(again.map((r) => r.score)).toEqual(first.map((r) => r.score));
    }
  });

  it("scores fit within [0, 1]", () => {
    const ranked = rankRecommendations(current, LAB, new Map(), { limit: 10 });
    for (const r of ranked) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    }
  });
});

describe("useRecommendation", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("starts empty and reports no interactions", () => {
    const { result } = renderHook(() =>
      useRecommendation({ items: LAB, storageKey: "test:v1", enabled: true }),
    );
    expect(result.current.hasInteractions).toBe(false);
    expect(result.current.history.size).toBe(0);
  });

  it("accumulates tags per interaction kind", () => {
    const { result } = renderHook(() =>
      useRecommendation({ items: LAB, storageKey: "test:v1", enabled: true }),
    );
    act(() => result.current.track("audio", "view"));
    act(() => result.current.track("audio", "view"));
    expect(result.current.history.get("audio")).toBe(TRACK_WEIGHTS.view * 2);
    expect(result.current.hasInteractions).toBe(true);
  });

  it("accumulated clicks pull the explored item to the top", () => {
    const { result } = renderHook(() =>
      useRecommendation({ items: LAB, storageKey: "test:v1", enabled: true }),
    );
    const current: Recommendable = { id: "fluid", tags: ["canvas"] };
    const before = result.current.recommend(current, { limit: 10 });
    expect(before[0].item.id).not.toBe("audio");

    act(() => result.current.track("audio", "click"));
    act(() => result.current.track("audio", "click"));

    const ranked = result.current.recommend(current, { limit: 10 });
    expect(ranked[0].item.id).toBe("audio");
    expect(ranked.map((r) => r.item.id)).toContain("audio");
  });

  it("persists history to localStorage and restores it on mount", () => {
    const first = renderHook(() =>
      useRecommendation({ items: LAB, storageKey: "test:v1", enabled: true }),
    );
    act(() => first.result.current.track("planet", "hover"));
    first.unmount();

    const restored = renderHook(() =>
      useRecommendation({ items: LAB, storageKey: "test:v1", enabled: true }),
    );
    expect(restored.result.current.history.get("gravity")).toBe(
      TRACK_WEIGHTS.hover,
    );
    expect(restored.result.current.hasInteractions).toBe(true);
  });

  it("ignores unknown ids and does nothing when disabled", () => {
    const { result } = renderHook(() =>
      useRecommendation({ items: LAB, storageKey: "test:v1", enabled: false }),
    );
    act(() => result.current.track("nah", "click"));
    act(() => result.current.track("audio", "click"));
    expect(result.current.history.size).toBe(0);
    expect(result.current.hasInteractions).toBe(false);
  });
});

describe("createViewTracker", () => {
  it("is a safe no-op where IntersectionObserver is missing (jsdom)", () => {
    const observe = createViewTracker(() => undefined);
    expect(() => observe(null, "planet")).not.toThrow();
  });
});