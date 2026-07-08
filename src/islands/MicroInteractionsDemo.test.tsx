import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import MicroInteractionsDemo from "./MicroInteractionsDemo";

describe("MicroInteractionsDemo", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders Magnetic Buttons section", () => {
    render(<MicroInteractionsDemo />);
    expect(screen.getByText("Magnetic Buttons")).toBeTruthy();
  });

  it("renders Context Tooltips section", () => {
    render(<MicroInteractionsDemo />);
    expect(screen.getByText("Context-Aware Tooltips")).toBeTruthy();
  });

  it("renders Organic Loading section", () => {
    render(<MicroInteractionsDemo />);
    expect(screen.getByText("Organic Loading States")).toBeTruthy();
  });

  it("renders magnetic button triggers", () => {
    render(<MicroInteractionsDemo />);
    expect(screen.getByText("Get in Touch")).toBeTruthy();
    expect(screen.getByText("View Projects")).toBeTruthy();
    expect(screen.getByText("Download CV")).toBeTruthy();
  });

  it("renders tooltip trigger labels", () => {
    render(<MicroInteractionsDemo />);
    expect(screen.getByText("React")).toBeTruthy();
    expect(screen.getByText("TypeScript")).toBeTruthy();
    expect(screen.getByText("Framer Motion")).toBeTruthy();
  });

  it("renders loading labels", () => {
    render(<MicroInteractionsDemo />);
    expect(screen.getByText("Loading...")).toBeTruthy();
    expect(screen.getByText("Processing...")).toBeTruthy();
    expect(screen.getByText("Synthesizing...")).toBeTruthy();
    expect(screen.getByText("Compiling...")).toBeTruthy();
  });

  it("renders all variant labels", () => {
    render(<MicroInteractionsDemo />);
    expect(screen.getByText("Breathing variant")).toBeTruthy();
    expect(screen.getByText("Pulsing variant")).toBeTruthy();
    expect(screen.getByText("Growing variant (indeterminate)")).toBeTruthy();
    expect(screen.getByText("Growing variant (determinate 65%)")).toBeTruthy();
  });
});
