import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

let reducedMotion = false;

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useReducedMotion: () => reducedMotion,
  };
});

const CreativeLabPill = (await import("./CreativeLabPill")).default;

describe("CreativeLabPill", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState({}, "", "/");
    reducedMotion = false;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the Lab pill link on non-gallery pages", () => {
    const { container } = render(<CreativeLabPill />);
    const link = container.querySelector('a[href="/gallery"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain("Lab");
  });

  it("renders nothing on /gallery", () => {
    window.history.replaceState({}, "", "/gallery");
    const { container } = render(<CreativeLabPill />);
    expect(container.querySelector('a[href="/gallery"]')).toBeNull();
  });

  it("shows breathing glow ring by default", () => {
    const { container } = render(<CreativeLabPill />);
    expect(container.querySelector(".pointer-events-none.inset-0")).toBeTruthy();
  });

  it("omits infinite animations when prefers-reduced-motion", () => {
    reducedMotion = true;
    const { container } = render(<CreativeLabPill />);
    expect(container.querySelector(".pointer-events-none.inset-0")).toBeNull();
    expect(container.querySelector('a[href="/gallery"]')).toBeTruthy();
  });
});
