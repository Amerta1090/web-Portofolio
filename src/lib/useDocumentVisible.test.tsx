import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useDocumentVisible from "./useDocumentVisible";

function setDocumentHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => hidden,
  });
}

function dispatchVisibility() {
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useDocumentVisible", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Restore jsdom default (hidden=false) so other suites are unaffected.
    setDocumentHidden(false);
  });

  it("defaults to visible (jsdom / SSR)", () => {
    const { result } = renderHook(() => useDocumentVisible());
    expect(result.current).toBe(true);
  });

  it("flips to false when the tab becomes hidden", () => {
    const { result } = renderHook(() => useDocumentVisible());
    act(() => {
      setDocumentHidden(true);
      dispatchVisibility();
    });
    expect(result.current).toBe(false);
  });

  it("flips back to true when the tab becomes visible again", () => {
    const { result } = renderHook(() => useDocumentVisible());
    act(() => {
      setDocumentHidden(true);
      dispatchVisibility();
    });
    expect(result.current).toBe(false);

    act(() => {
      setDocumentHidden(false);
      dispatchVisibility();
    });
    expect(result.current).toBe(true);
  });

  it("removes the visibilitychange listener on unmount", () => {
    const spy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useDocumentVisible());
    unmount();
    expect(spy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    spy.mockRestore();
  });
});
