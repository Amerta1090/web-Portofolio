import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a textarea with passthrough attrs", () => {
    render(<Textarea placeholder="Your message..." rows={4} />);
    const textarea = screen.getByPlaceholderText("Your message...");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("rows", "4");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} aria-label="Message" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("sets aria-invalid when error flag is true", () => {
    render(<Textarea aria-label="Message" error />);
    expect(screen.getByLabelText("Message")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Textarea aria-label="Message" />);
    expect(screen.getByLabelText("Message")).not.toHaveAttribute("aria-invalid");
  });

  it("respects an explicit aria-invalid attribute", () => {
    render(<Textarea aria-label="Message" aria-invalid="true" />);
    const textarea = screen.getByLabelText("Message");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea.className).toContain("aria-invalid:border-danger");
  });

  it("applies size and variant classes", () => {
    const { container, rerender } = render(<Textarea aria-label="Message" size="lg" />);
    expect(container.querySelector("textarea")?.className).toContain("text-base");
    rerender(<Textarea aria-label="Message" variant="ghost" />);
    expect(container.querySelector("textarea")?.className).toContain("bg-transparent");
  });

  it("merges className via cn (twMerge dedupes conflicting utilities)", () => {
    render(<Textarea aria-label="Message" className="resize-none custom-ta" />);
    const textarea = screen.getByLabelText("Message");
    expect(textarea.className).toContain("resize-none");
    expect(textarea.className).not.toContain("resize-y");
    expect(textarea.className).toContain("custom-ta");
  });

  it("does not enforce a fixed height (min-height only)", () => {
    render(<Textarea aria-label="Message" />);
    const textarea = screen.getByLabelText("Message");
    expect(textarea.className).toContain("min-h-[88px]");
    expect(textarea.className).not.toMatch(/(^|\s)h-\d/);
  });
});
