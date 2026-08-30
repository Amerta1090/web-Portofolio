import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CURRENT_STORAGE,
  HISTORY_STORAGE,
  SESSION_EVENT,
  onSessionChange,
  readCurrent,
  readHistory,
  recordInteraction,
  setCurrent,
  writeHistory,
} from "./session";
import { TRACK_WEIGHTS } from "./useRecommendation";

describe("recommendation session", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });
  afterEach(() => localStorage.clear());

  it("recordInteraction accumulates weighted tags and persists", () => {
    recordInteraction("audio", ["audio", "fft"], "view");
    const history = readHistory();
    expect(history.get("audio")).toBe(TRACK_WEIGHTS.view);
    expect(history.get("fft")).toBe(TRACK_WEIGHTS.view);

    recordInteraction("audio", ["audio", "fft"], "click");
    const merged = readHistory();
    expect(merged.get("audio")).toBe(TRACK_WEIGHTS.view + TRACK_WEIGHTS.click);
    expect(merged.get("fft")).toBe(TRACK_WEIGHTS.view + TRACK_WEIGHTS.click);

    const persisted = JSON.parse(localStorage.getItem(HISTORY_STORAGE) ?? "{}");
    expect(persisted.audio).toBe(4);
  });

  it("writeHistory then readHistory round-trips", () => {
    writeHistory(
      new Map([
        ["ml", 2],
        ["python", 3],
      ]),
    );
    const loaded = readHistory();
    expect(loaded.get("ml")).toBe(2);
    expect(loaded.get("python")).toBe(3);
  });

  it("setCurrent stores the current item id", () => {
    setCurrent("fractal-explorer");
    expect(readCurrent()).toBe("fractal-explorer");
    expect(localStorage.getItem(CURRENT_STORAGE)).toBe("fractal-explorer");
  });

  it("emits a change event so subscribers can re-read", () => {
    const listener = vi.fn();
    const unsubscribe = onSessionChange(listener);
    setCurrent("liquid-distortion");
    recordInteraction("audio", ["audio"], "view");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
    unsubscribe();
    setCurrent("interactive-canvas");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("exposes the event name for debug/integration", () => {
    expect(SESSION_EVENT).toBe("detAIministic:recommend:change");
    expect(CURRENT_STORAGE).toMatch(/^detAIministic:/);
  });
});
