import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PageTailOverlays from "./PageTailOverlays";

// Reduce-motion = false keeps entrance animations deterministic in jsdom
// (motion's useReducedMotion guards matchMedia; real components still render).
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => false };
});

const sectionIds = ["hero", "about", "experience", "contact"];

describe("PageTailOverlays (composite: EasterEgg + SectionCounter + CreativeLabPill)", () => {
  it("mounts without throwing (EasterEgg renders null, pill naik tanpa error)", () => {
    expect(() => render(<PageTailOverlays sectionIds={sectionIds} />)).not.toThrow();
  });

  it("renders no second nav — the page keeps exactly one primary navigation", () => {
    const { container } = render(<PageTailOverlays sectionIds={sectionIds} />);
    // The morphing dots/text/hamburger nav is gone from the markup, not hidden.
    expect(container.querySelector("nav")).toBeNull();
  });

  it("renders the position readout for the ids the page declares", () => {
    const { container } = render(<PageTailOverlays sectionIds={sectionIds} />);
    const counter = container.querySelector("[data-section-counter]");
    expect(counter).not.toBeNull();
    // One dot per declared section, and the same total on the readout's own
    // data attribute. MOTION-12 dropped the `01 / 06` numerals: they restated
    // what the filled-dot column already shows, so the position lives in
    // `data-section-current` now instead of in decorative type.
    expect(counter?.querySelectorAll("[data-section-dot]")).toHaveLength(sectionIds.length);
    expect(counter?.getAttribute("data-section-total")).toBe(String(sectionIds.length));
    expect(counter?.getAttribute("data-section-current")).toBe("1");
    expect(counter?.textContent?.trim()).toBe("");
  });

  it("keeps the readout out of the accessibility tree (it duplicates section landmarks)", () => {
    const { container } = render(<PageTailOverlays sectionIds={sectionIds} />);
    const counter = container.querySelector("[data-section-counter]");
    expect(counter?.getAttribute("aria-hidden")).toBe("true");
    // The old markup put aria-label on role-less dots, which ARIA 1.2 prohibits.
    expect(counter?.querySelectorAll("[aria-label]")).toHaveLength(0);
  });

  it("renders creative-lab pill linking to /lab on non-lab paths", () => {
    const { container } = render(<PageTailOverlays sectionIds={sectionIds} />);
    expect(container.querySelector("a[href='/lab']")).not.toBeNull();
  });
});
