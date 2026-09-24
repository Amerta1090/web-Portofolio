import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Label } from "./Label";

describe("Label", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders text and links to control via htmlFor", () => {
    render(<Label htmlFor="cf-name">Name</Label>);
    const label = screen.getByText("Name");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "cf-name");
  });

  it("forwards ref", () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <Label ref={ref} htmlFor="x">
        X
      </Label>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("renders visually hidden when srOnly", () => {
    render(
      <Label htmlFor="x" srOnly>
        Search
      </Label>,
    );
    const label = screen.getByText("Search");
    expect(label.className).toContain("sr-only");
  });

  it("does not render sr-only by default", () => {
    render(<Label htmlFor="x">Search</Label>);
    expect(screen.getByText("Search").className).not.toContain("sr-only");
  });

  it("merges className via cn", () => {
    render(
      <Label htmlFor="x" className="custom-label">
        Name
      </Label>,
    );
    const label = screen.getByText("Name");
    expect(label.className).toContain("custom-label");
    expect(label.className).toContain("font-medium");
  });
});
