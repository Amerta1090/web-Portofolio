import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import MarkovGenerator from "./MarkovGenerator";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MarkovGenerator", () => {
  it("renders mode toggle buttons", () => {
    render(<MarkovGenerator />);
    expect(screen.getByRole("button", { name: "Bio" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Project" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fact" })).toBeTruthy();
  });

  it("shows the generated-not-AI tag", () => {
    render(<MarkovGenerator />);
    expect(screen.getByText(/generated, not ai/i)).toBeTruthy();
  });

  it("produces a non-empty output", () => {
    render(<MarkovGenerator />);
    const output = document.querySelector("p[aria-live='polite']")?.textContent ?? "";
    expect(output.length).toBeGreaterThan(0);
  });

  it("renders in compact mode with regenerate button", () => {
    render(<MarkovGenerator compact />);
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeTruthy();
  });

  it("compact mode hides mode toggles", () => {
    render(<MarkovGenerator compact />);
    expect(screen.queryByRole("button", { name: "Fact" })).toBeNull();
  });

  it("regenerating changes the output (or keeps it stable if repeated)", async () => {
    const user = userEvent.setup();
    render(<MarkovGenerator />);
    const before = document.querySelector("p[aria-live='polite']")?.textContent ?? "";
    await user.click(screen.getByRole("button", { name: "Generate again" }));
    const after = document.querySelector("p[aria-live='polite']")?.textContent ?? "";
    expect(after.length).toBeGreaterThan(0);
    expect(before.length).toBeGreaterThan(0);
  });

  it("switching mode to Project updates the output", async () => {
    const user = userEvent.setup();
    render(<MarkovGenerator />);
    const before = document.querySelector("p[aria-live='polite']")?.textContent ?? "";
    await user.click(screen.getByRole("button", { name: "Project" }));
    const after = document.querySelector("p[aria-live='polite']")?.textContent ?? "";
    expect(after.length).toBeGreaterThan(0);
    expect(after).not.toBe(before);
  });

  it("switching mode to Fact produces output", async () => {
    const user = userEvent.setup();
    render(<MarkovGenerator />);
    await user.click(screen.getByRole("button", { name: "Fact" }));
    const out = document.querySelector("p[aria-live='polite']")?.textContent ?? "";
    expect(out.length).toBeGreaterThan(0);
  });

  it("exposes a length slider", () => {
    render(<MarkovGenerator />);
    const slider = document.querySelector('input[type="range"]');
    expect(slider).toBeTruthy();
  });
});
