import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SentimentGauge from "./SentimentGauge";

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("SentimentGauge", () => {
  it("renders a textarea", () => {
    render(<SentimentGauge />);
    expect(screen.getByLabelText(/type to gauge sentiment/i)).toBeTruthy();
  });

  it("shows stat panels", () => {
    render(<SentimentGauge />);
    expect(screen.getByText("Total")).toBeTruthy();
    expect(screen.getByText("Magnitude")).toBeTruthy();
    expect(screen.getByText("Mood")).toBeTruthy();
  });

  it("renders in compact mode", () => {
    render(<SentimentGauge compact />);
    const textarea = document.querySelector("textarea");
    expect(textarea).toBeTruthy();
  });

  it("compact mode hides full stat panels", () => {
    render(<SentimentGauge compact />);
    expect(screen.queryByText("Per-word score")).toBeNull();
  });

  it("computes a positive score for positive input", async () => {
    const user = userEvent.setup();
    render(<SentimentGauge />);
    const textarea = screen.getByLabelText(/type to gauge sentiment/i);
    await user.clear(textarea);
    await user.type(textarea, "amazing wonderful love");
    expect(screen.getAllByText("Very positive").length).toBeGreaterThanOrEqual(1);
  });

  it("computes a negative score for negative input", async () => {
    const user = userEvent.setup();
    render(<SentimentGauge />);
    const textarea = screen.getByLabelText(/type to gauge sentiment/i);
    await user.clear(textarea);
    await user.type(textarea, "terrible broken hate");
    expect(screen.getAllByText("Very negative").length).toBeGreaterThanOrEqual(1);
  });

  it("shows neutral for text with no lexicon words", async () => {
    const user = userEvent.setup();
    render(<SentimentGauge />);
    const textarea = screen.getByLabelText(/type to gauge sentiment/i);
    await user.clear(textarea);
    await user.type(textarea, "the cat sat on the mat");
    expect(screen.getByText("No lexicon words detected yet.")).toBeTruthy();
  });

  it("per-word chips are rendered for detected words", async () => {
    const user = userEvent.setup();
    render(<SentimentGauge />);
    const textarea = screen.getByLabelText(/type to gauge sentiment/i);
    await user.clear(textarea);
    await user.type(textarea, "happy sad");
    expect(screen.getAllByText(/happy|sad/).length).toBeGreaterThanOrEqual(2);
  });

  it("Sample button fills the textarea", async () => {
    const user = userEvent.setup();
    render(<SentimentGauge />);
    await user.click(screen.getByRole("button", { name: "Sample" }));
    const textarea = screen.getByLabelText(/type to gauge sentiment/i) as HTMLTextAreaElement;
    expect(textarea.value.length).toBeGreaterThan(0);
  });

  it("Clear button empties the textarea", async () => {
    const user = userEvent.setup();
    render(<SentimentGauge />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    const textarea = screen.getByLabelText(/type to gauge sentiment/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
  });
});
