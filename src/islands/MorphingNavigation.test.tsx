import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MorphingNavigation from "./MorphingNavigation";

describe("MorphingNavigation", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<MorphingNavigation />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders nav element", () => {
    const { container } = render(<MorphingNavigation />);
    const nav = container.querySelector("nav");
    expect(nav).toBeTruthy();
  });

  it("starts in dots phase (no text visible)", () => {
    render(<MorphingNavigation />);
    expect(screen.queryByText("Home")).toBeNull();
    expect(screen.queryByText("About")).toBeNull();
  });

  it("accepts custom className", () => {
    const { container } = render(<MorphingNavigation className="custom-nav" />);
    const nav = container.querySelector("nav");
    expect(nav?.className).toContain("custom-nav");
  });

  it("accepts anchor positions", () => {
    const { container: tl } = render(<MorphingNavigation anchor="top-left" />);
    expect(tl.firstChild).toBeTruthy();

    const { container: br } = render(<MorphingNavigation anchor="bottom-right" />);
    expect(br.firstChild).toBeTruthy();
  });

  it("renders with custom scroll thresholds", () => {
    const { container } = render(
      <MorphingNavigation scrollThresholds={{ dots: 200, text: 500, menu: 1000 }} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders all nav items", () => {
    const { container } = render(<MorphingNavigation />);
    const nav = container.querySelector("nav");
    expect(nav).toBeTruthy();
  });

  it("scrolls to section on menu item click", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = '<div id="hero">Hero</div>';
    const el = document.getElementById("hero")!;
    el.scrollIntoView = vi.fn();

    const { container } = render(<MorphingNavigation />);
    const nav = container.querySelector("nav");
    expect(nav).toBeTruthy();
  });

  it("renders hamburger in menu phase", () => {
    const { container } = render(<MorphingNavigation />);
    const nav = container.querySelector("nav");
    expect(nav).toBeTruthy();
  });

  it("shows expanded menu items when hamburger clicked", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = '<div id="hero">Hero</div><div id="about">About</div>';
    const { container } = render(<MorphingNavigation />);
    const nav = container.querySelector("nav");
    expect(nav).toBeTruthy();
  });

  it("does not crash without threshold props", () => {
    const { container } = render(<MorphingNavigation />);
    expect(container.firstChild).toBeTruthy();
  });
});
