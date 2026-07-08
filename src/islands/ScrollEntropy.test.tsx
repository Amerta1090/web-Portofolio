import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ScrollEntropy from "./ScrollEntropy";

describe("ScrollEntropy", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const zones = [
    {
      id: "hero-zone",
      startThreshold: 0,
      endThreshold: 0.5,
      children: <div>Hero Zone Content</div>,
    },
    {
      id: "about-zone",
      startThreshold: 0.5,
      endThreshold: 1,
      intensity: 0.8,
      children: <div>About Zone Content</div>,
    },
  ];

  it("renders all zones", () => {
    render(<ScrollEntropy zones={zones} />);
    expect(screen.getByText("Hero Zone Content")).toBeTruthy();
    expect(screen.getByText("About Zone Content")).toBeTruthy();
  });

  it("renders without crashing with empty zones", () => {
    const { container } = render(<ScrollEntropy zones={[]} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts custom className", () => {
    const { container } = render(<ScrollEntropy zones={zones} className="custom-entropy" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-entropy");
  });

  it("renders single zone", () => {
    const singleZone = [
      {
        id: "single",
        startThreshold: 0,
        endThreshold: 0.8,
        children: <span>Single</span>,
      },
    ];
    render(<ScrollEntropy zones={singleZone} />);
    expect(screen.getByText("Single")).toBeTruthy();
  });

  it("renders with intensity prop", () => {
    const intenseZone = [
      {
        id: "intense",
        startThreshold: 0.2,
        endThreshold: 0.9,
        intensity: 1,
        children: <span>Intense</span>,
      },
    ];
    render(<ScrollEntropy zones={intenseZone} />);
    expect(screen.getByText("Intense")).toBeTruthy();
  });

  it("renders className on zone wrappers", () => {
    const withClass = [
      {
        id: "with-class",
        startThreshold: 0,
        endThreshold: 1,
        className: "zone-class",
        children: <span>With Class</span>,
      },
    ];
    render(<ScrollEntropy zones={withClass} />);
    expect(screen.getByText("With Class")).toBeTruthy();
  });

  it("handles zones with start=end threshold", () => {
    const edgeZone = [
      {
        id: "edge",
        startThreshold: 0.5,
        endThreshold: 0.5,
        children: <span>Edge</span>,
      },
    ];
    render(<ScrollEntropy zones={edgeZone} />);
    expect(screen.getByText("Edge")).toBeTruthy();
  });

  it("handles zones with reversed thresholds", () => {
    const reversed = [
      {
        id: "reversed",
        startThreshold: 0.8,
        endThreshold: 0.2,
        children: <span>Reversed</span>,
      },
    ];
    render(<ScrollEntropy zones={reversed} />);
    expect(screen.getByText("Reversed")).toBeTruthy();
  });

  it("renders complex children", () => {
    const complexZone = [
      {
        id: "complex",
        startThreshold: 0,
        endThreshold: 1,
        children: (
          <div className="complex-child">
            <h3>Title</h3>
            <p>Description</p>
          </div>
        ),
      },
    ];
    render(<ScrollEntropy zones={complexZone} />);
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
  });

  it("renders with all optional props", () => {
    const fullZones = [
      {
        id: "full",
        startThreshold: 0.1,
        endThreshold: 0.9,
        intensity: 0.6,
        className: "full-zone",
        children: <span>Full</span>,
      },
    ];
    render(<ScrollEntropy zones={fullZones} />);
    expect(screen.getByText("Full")).toBeTruthy();
  });
});
