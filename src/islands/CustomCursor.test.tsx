import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
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
    delete (window as Record<string, unknown>)["ontouchstart"];
  }
}

describe("CustomCursor", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    setTouchDevice(false);
    setMatchMedia(false);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
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
});
