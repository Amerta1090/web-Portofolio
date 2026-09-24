import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CustomCursor from "./CustomCursor";

type MatchMediaMock = (query: string) => {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
};

function setMatchMedia(matches: boolean) {
  const impl: MatchMediaMock = (query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn(impl),
  });
}

function setTouchDevice(touch: boolean) {
  if (touch) {
    Object.defineProperty(window, "ontouchstart", {
      value: {},
      configurable: true,
      writable: true,
    });
  } else {
    Reflect.deleteProperty(window, "ontouchstart");
  }
}

describe("CustomCursor", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    setTouchDevice(false);
    setMatchMedia(false);
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("injects cursor dot and ring when pointer + motion allowed", () => {
    render(<CustomCursor />);
    expect(document.querySelector(".custom-cursor")).toBeTruthy();
    expect(document.querySelector(".custom-cursor-ring")).toBeTruthy();
  });

  it("does not inject anything when prefers-reduced-motion", () => {
    setMatchMedia(true);
    render(<CustomCursor />);
    expect(document.querySelector(".custom-cursor")).toBeNull();
    expect(document.querySelector(".custom-cursor-ring")).toBeNull();
  });

  it("does not inject anything on touch devices by default", () => {
    setTouchDevice(true);
    render(<CustomCursor />);
    expect(document.querySelector(".custom-cursor")).toBeNull();
  });

  it("does not inject anything on tier-1 (lightning) experience tier", () => {
    document.documentElement.dataset.experienceTier = "tier-1";
    render(<CustomCursor />);
    expect(document.querySelector(".custom-cursor")).toBeNull();
    expect(document.querySelector(".custom-cursor-ring")).toBeNull();
    delete document.documentElement.dataset.experienceTier;
  });

  it("injects cursor on touch devices when enableOnTouch is true", () => {
    setTouchDevice(true);
    render(<CustomCursor enableOnTouch />);
    expect(document.querySelector(".custom-cursor")).toBeTruthy();
  });

  it("removes injected elements on unmount", () => {
    const { unmount } = render(<CustomCursor />);
    expect(document.querySelector(".custom-cursor")).toBeTruthy();
    unmount();
    expect(document.querySelector(".custom-cursor")).toBeNull();
    expect(document.querySelector(".custom-cursor-ring")).toBeNull();
    expect(vi.mocked(cancelAnimationFrame)).toHaveBeenCalled();
  });

  it("positions via transform (compositor) and pauses loop when tab hidden", () => {
    const rafCalls: Array<(t: number) => void> = [];
    const rafSpy = vi.fn((cb: (t: number) => void) => {
      rafCalls.push(cb);
      return rafCalls.length;
    });
    vi.stubGlobal("requestAnimationFrame", rafSpy);
    const cancelSpy = vi.mocked(cancelAnimationFrame);

    render(<CustomCursor />);
    const cursor = document.querySelector(".custom-cursor") as HTMLElement | null;
    const ring = document.querySelector(".custom-cursor-ring") as HTMLElement | null;
    expect(cursor).toBeTruthy();
    expect(ring).toBeTruthy();
    if (!cursor || !ring) return;

    const runFrames = (n: number) => {
      for (let i = 0; i < n; i++) {
        const cbs = rafCalls.splice(0);
        for (const cb of cbs) cb(1);
      }
    };

    act(() => {
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 120, clientY: 80 }));
    });
    runFrames(3);

    // Per-frame writes use transform, never layout-triggering left/top.
    expect(cursor.style.left).toBe("");
    expect(cursor.style.top).toBe("");
    expect(cursor.style.transform).toContain("translate3d");
    expect(ring.style.transform).toContain("translate3d");

    // Tab hidden → cancel scheduled frame, no more transform writes.
    const frozen = ring.style.transform;
    act(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(cancelSpy).toHaveBeenCalled();

    runFrames(3);
    expect(ring.style.transform).toBe(frozen);

    // Restore default so other suites aren't affected.
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
  });
});
