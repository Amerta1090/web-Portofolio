import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CommandPalette from "./CommandPalette";

function openWithKey() {
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
}

function getOptions() {
  const list = screen.getByRole("list", { name: "Hasil pencarian" });
  return within(list).getAllByRole("button");
}

describe("CommandPalette", () => {
  let scrollSpy: ReturnType<typeof vi.fn>;
  let assignSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    cleanup();
    scrollSpy = vi.fn();
    assignSpy = vi.fn();
    Element.prototype.scrollIntoView =
      scrollSpy as unknown as typeof Element.prototype.scrollIntoView;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        assign: assignSpy,
        href: "",
        replace: vi.fn(),
        reload: vi.fn(),
        toString: () => "http://localhost",
        pathname: "/",
        search: "",
        hash: "",
        origin: "http://localhost",
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("does not render the overlay by default", () => {
    render(<CommandPalette />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the overlay via Ctrl+K", () => {
    render(<CommandPalette />);
    openWithKey();
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeTruthy();
  });

  it("shows a hint when the query is empty", () => {
    render(<CommandPalette />);
    openWithKey();
    expect(
      screen.getByText(/Ketik untuk mencari skill, proyek, eksperimen lab, atau halaman/),
    ).toBeTruthy();
  });

  it("returns results when typing a query", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "galaxy" } });
    expect(screen.getByRole("list", { name: "Hasil pencarian" })).toBeTruthy();
    expect(getOptions().length).toBeGreaterThan(0);
  });

  it("shows an empty state when nothing matches", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "zzzzqqqqx" } });
    expect(screen.getByText("Tidak ada hasil yang cocok.")).toBeTruthy();
  });

  it("supports ArrowDown/ArrowUp selection", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "machine" } });

    const options = getOptions();
    expect(options.length).toBeGreaterThan(1);

    expect(options[0].getAttribute("aria-current")).toBe("true");
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(options[1].getAttribute("aria-current")).toBe("true");
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(options[0].getAttribute("aria-current")).toBe("true");
  });

  it("activates a single lab result via Enter (navigates)", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "galaxy" } });
    const option = getOptions()[0];
    expect(option).toBeTruthy();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(assignSpy).toHaveBeenCalledWith("/gallery#galaxy-formation");
  });

  it("scrolls to an anchor section for skill items", () => {
    const anchor = document.createElement("div");
    anchor.id = "skills";
    document.body.appendChild(anchor);

    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "docker" } });
    const option = getOptions()[0];
    expect(option).toBeTruthy();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(scrollSpy).toHaveBeenCalled();
    // anchor scroll closes the palette
    expect(screen.queryByRole("dialog")).toBeNull();
    anchor.remove();
  });

  it("activates a result on click", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "galaxy" } });
    const option = getOptions()[0];
    fireEvent.click(option);
    expect(assignSpy).toHaveBeenCalledWith("/gallery#galaxy-formation");
  });

  it("clears the query with the clear button", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "galaxy" } });
    fireEvent.click(screen.getByLabelText("Bersihkan pencarian"));
    expect(input.getAttribute("value")).toBe("");
  });

  it("closes the overlay on Escape and restores prior focus", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();
    const focusSpy = vi.spyOn(button, "focus");

    render(<CommandPalette />);
    openWithKey();
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    // reduce scroll-into-view noise from earlier tests
    expect(focusSpy).toHaveBeenCalled();
  });

  it("categorizes results with type badges", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "galaxy" } });
    const listbox = screen.getByRole("list", { name: "Hasil pencarian" });
    expect(within(listbox).getByText("Lab")).toBeTruthy();
  });

  it("traps Tab focus within the dialog", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "galaxy" } });
    const clearBtn = screen.getByLabelText("Bersihkan pencarian");
    clearBtn.focus();
    expect(document.activeElement).toBe(clearBtn);
    // Tab from the last focusable wraps back to the first (input).
    fireEvent.keyDown(window, { key: "Tab" });
    expect(document.activeElement).toBe(input);
  });

  it("filters results by category segment", () => {
    render(<CommandPalette />);
    openWithKey();
    const input = screen.getByRole("searchbox");
    // "python" spans skills, certifications, experience, and projects.
    fireEvent.change(input, { target: { value: "python" } });
    const allCount = getOptions().length;
    expect(allCount).toBeGreaterThan(1);

    fireEvent.click(screen.getByRole("button", { name: "Proyek" }));
    const filtered = getOptions();
    expect(filtered.length).toBeLessThan(allCount);
    expect(filtered.length).toBeGreaterThan(0);
  });
});
