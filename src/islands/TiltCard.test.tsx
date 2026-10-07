import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TiltCard from "./TiltCard";

/**
 * `TiltCard` writes only CSS — a transform plus two custom properties — from a
 * single coalesced rAF, and never touches React state. These tests pin that
 * contract: one frame per batch, glow coordinates in px, cleanup on leave and
 * unmount, and nothing at all when the guard has paused it.
 */
let rafQueue: Array<(t: number) => void>;
let rafSpy: ReturnType<typeof vi.fn>;
let cancelSpy: ReturnType<typeof vi.fn>;

function runFrames() {
  const pending = rafQueue.splice(0);
  for (const cb of pending) cb(1);
}

describe("TiltCard", () => {
  beforeEach(() => {
    rafQueue = [];
    rafSpy = vi.fn((cb: (t: number) => void) => {
      rafQueue.push(cb);
      return rafQueue.length;
    });
    cancelSpy = vi.fn();
    vi.stubGlobal("requestAnimationFrame", rafSpy);
    vi.stubGlobal("cancelAnimationFrame", cancelSpy);
    // jsdom returns an all-zero rect, which would divide by a zero half-width.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 200,
      bottom: 100,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    } as DOMRect);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("coalesces pointer moves into one rAF and writes the glow in px", () => {
    const { container } = render(<TiltCard spotlight>content</TiltCard>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-tilt-spotlight")).toBe("on");

    fireEvent.mouseMove(el, { clientX: 150, clientY: 25 });
    fireEvent.mouseMove(el, { clientX: 60, clientY: 80 });
    expect(rafSpy).toHaveBeenCalledTimes(1);

    runFrames();
    // Last pointer wins; rect is left/top 0, 200x100.
    expect(el.style.getPropertyValue("--glow-x")).toBe("60px");
    expect(el.style.getPropertyValue("--glow-y")).toBe("80px");
    expect(el.style.transform).toContain("rotateX");
  });

  it("clears glow and unwinds the tilt on pointer leave", () => {
    const { container } = render(<TiltCard spotlight>content</TiltCard>);
    const el = container.firstElementChild as HTMLElement;

    fireEvent.mouseMove(el, { clientX: 150, clientY: 25 });
    runFrames();
    expect(el.style.getPropertyValue("--glow-x")).toBe("150px");

    fireEvent.mouseLeave(el);
    expect(el.style.getPropertyValue("--glow-x")).toBe("");
    expect(el.style.getPropertyValue("--glow-y")).toBe("");
    expect(el.style.transform).toContain("rotateX(0deg)");
  });

  it("does nothing when the guard has paused the spotlight", () => {
    const { container } = render(<TiltCard spotlight={false}>content</TiltCard>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute("data-tilt-spotlight")).toBeNull();

    fireEvent.mouseMove(el, { clientX: 150, clientY: 25 });
    expect(rafSpy).not.toHaveBeenCalled();
    expect(el.style.transform).toBeFalsy();
    expect(el.style.getPropertyValue("--glow-x")).toBe("");
  });

  it("cancels a pending frame on unmount", () => {
    const { container, unmount } = render(<TiltCard spotlight>content</TiltCard>);
    const el = container.firstElementChild as HTMLElement;
    fireEvent.mouseMove(el, { clientX: 150, clientY: 25 });
    expect(rafSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
