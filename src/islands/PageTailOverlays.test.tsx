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
    // One dot per declared section, and a matching total in the readout.
    expect(counter?.querySelectorAll("[data-section-dot]")).toHaveLength(sectionIds.length);
    expect(counter?.textContent).toContain(`01 / ${String(sectionIds.length).padStart(2, "0")}`);
  });

  it("keeps the readout out of the accessibility tree (it duplicates section landmarks)", () => {
    const { container } = render(<PageTailOverlays sectionIds={sectionIds} />);
    const counter = container.querySelector("[data-section-counter]");
    expect(counter?.getAttribute("aria-hidden")).toBe("true");
    // The old markup put aria-label on role-less dots, which ARIA 1.2 prohibits.
    expect(counter?.querySelectorAll("[aria-label]")).toHaveLength(0);
  });

  it("renders creative-lab pill linking to /gallery on non-gallery paths", () => {
    const { container } = render(<PageTailOverlays sectionIds={sectionIds} />);
    expect(container.querySelector("a[href='/gallery']")).not.toBeNull();
  });
});
