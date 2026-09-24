import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders an input with passthrough attrs", () => {
    render(<Input placeholder="Your name" type="email" />);
    const input = screen.getByPlaceholderText("Your name");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("type", "email");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Name" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("sets aria-invalid when error flag is true", () => {
    render(<Input aria-label="Name" error />);
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when no error", () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
  });

  it("respects an explicit aria-invalid attribute", () => {
    render(<Input aria-label="Name" aria-invalid="true" />);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.className).toContain("aria-invalid:border-danger");
  });

  it("applies size and variant classes", () => {
    const { container, rerender } = render(<Input aria-label="Name" size="lg" />);
    expect(container.querySelector("input")?.className).toContain("text-base");
    rerender(<Input aria-label="Name" variant="ghost" />);
    expect(container.querySelector("input")?.className).toContain("bg-transparent");
  });

  it("merges className via cn (twMerge dedupes conflicting utilities)", () => {
    render(<Input aria-label="Name" className="rounded-full custom-input" />);
    const input = screen.getByLabelText("Name");
    expect(input.className).toContain("rounded-full");
    expect(input.className).not.toContain("rounded-lg");
    expect(input.className).toContain("custom-input");
  });

  it("forwards disabled state", () => {
    render(<Input aria-label="Name" disabled />);
    expect(screen.getByLabelText("Name")).toBeDisabled();
  });
});
