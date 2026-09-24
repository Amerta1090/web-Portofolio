import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PageTailOverlays from "./PageTailOverlays";

// Reduce-motion = false keeps entrance animations deterministic in jsdom
// (motion's useReducedMotion guards matchMedia; real components still render).
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => false };
});

describe("PageTailOverlays (composite: MorphingNavigation + EasterEgg + SectionCounter + CreativeLabPill)", () => {
  it("renders the morphing navigation in dots phase (7 section dots) at scroll 0", () => {
    const { container } = render(<PageTailOverlays />);
    const nav = container.querySelector("nav");
    expect(nav).not.toBeNull();
    // At scroll 0 the nav shows dot indicators only (text phase needs real scroll).
    expect(nav?.querySelectorAll(".w-2.h-2").length).toBe(7);
  });

  it("mounts without throwing (EasterEgg renders null, pill naik tanpa error)", () => {
    expect(() => render(<PageTailOverlays />)).not.toThrow();
  });

  it("renders creative-lab pill linking to /gallery on non-gallery paths", () => {
    const { container } = render(<PageTailOverlays />);
    expect(container.querySelector("a[href='/gallery']")).not.toBeNull();
  });

  it("renders section progress markers (aria-labeled by section id)", () => {
    const { container } = render(<PageTailOverlays />);
    const markers = container.querySelectorAll(
      '[aria-label^="Current section"], [aria-label="about"], [aria-label="contact"]',
    );
    expect(markers.length).toBeGreaterThan(0);
  });
});
