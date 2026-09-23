import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrganicLoader from "./OrganicLoader";

describe("OrganicLoader", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders with breathing variant", () => {
    const { container } = render(<OrganicLoader variant="breathing" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with pulsing variant", () => {
    const { container } = render(<OrganicLoader variant="pulsing" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with growing variant", () => {
    const { container } = render(<OrganicLoader variant="growing" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders label when provided", () => {
    render(<OrganicLoader variant="breathing" label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("does not render label when not provided", () => {
    const { container } = render(<OrganicLoader variant="breathing" />);
    const labels = container.querySelectorAll("span");
    expect(labels.length).toBe(0);
  });

  it("renders with size sm", () => {
    const { container } = render(<OrganicLoader variant="breathing" size="sm" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with size lg", () => {
    const { container } = render(<OrganicLoader variant="breathing" size="lg" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with custom color", () => {
    const { container } = render(<OrganicLoader variant="breathing" color="#ff0000" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("has progressbar role", () => {
    render(<OrganicLoader variant="growing" progress={50} />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("shows aria-valuenow for determinate", () => {
    render(<OrganicLoader variant="growing" progress={65} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("65");
  });

  it("growing variant shows correct width for progress", () => {
    const { container } = render(<OrganicLoader variant="growing" progress={42} />);
    const inner = container.querySelector(".h-full") as HTMLElement;
    expect(inner.style.width).toBe("42%");
  });

  it("accepts indeterminate for growing variant", () => {
    render(<OrganicLoader variant="growing" indeterminate />);
    const bar = screen.getByRole("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBeNull();
  });

  it("growing variant with indeterminate shows default width", () => {
    const { container } = render(<OrganicLoader variant="growing" indeterminate />);
    const inner = container.querySelector(".h-full") as HTMLElement;
    expect(inner.style.width).toBe("40%");
  });

  it("breathing RAF loop stops when tab is hidden", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const caf = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const original = document.hidden;
    Object.defineProperty(document, "hidden", { configurable: true, value: true });

    render(<OrganicLoader variant="breathing" />);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(caf).toHaveBeenCalled();
    raf.mockRestore();
    caf.mockRestore();
    Object.defineProperty(document, "hidden", { configurable: true, value: original });
  });

  it("pulsing RAF loop stops when tab is hidden", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const caf = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const original = document.hidden;
    Object.defineProperty(document, "hidden", { configurable: true, value: true });

    render(<OrganicLoader variant="pulsing" />);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(caf).toHaveBeenCalled();
    raf.mockRestore();
    caf.mockRestore();
    Object.defineProperty(document, "hidden", { configurable: true, value: original });
  });

  it("growing indeterminate RAF loop stops when tab is hidden", () => {
    const raf = vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    const caf = vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const original = document.hidden;
    Object.defineProperty(document, "hidden", { configurable: true, value: true });

    render(<OrganicLoader variant="growing" indeterminate />);
    document.dispatchEvent(new Event("visibilitychange"));

    expect(caf).toHaveBeenCalled();
    raf.mockRestore();
    caf.mockRestore();
    Object.defineProperty(document, "hidden", { configurable: true, value: original });
  });
});
