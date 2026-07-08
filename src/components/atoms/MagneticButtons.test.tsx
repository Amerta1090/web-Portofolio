import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MagneticButtons from "./MagneticButtons";

describe("MagneticButtons", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders children", () => {
    render(
      <MagneticButtons>
        <button>Click Me</button>
      </MagneticButtons>,
    );
    expect(screen.getByText("Click Me")).toBeTruthy();
  });

  it("renders as anchor when href provided", () => {
    render(
      <MagneticButtons href="https://example.com">
        <span>Link</span>
      </MagneticButtons>,
    );
    const link = screen.getByText("Link").closest("a");
    expect(link).toBeTruthy();
    expect(link?.getAttribute("href")).toBe("https://example.com");
  });

  it("accepts custom className", () => {
    const { container } = render(
      <MagneticButtons className="custom-class">
        <button>Test</button>
      </MagneticButtons>,
    );
    const inner = container.querySelector(".custom-class");
    expect(inner).toBeTruthy();
  });

  it("applies perspective style to wrapper", () => {
    const { container } = render(
      <MagneticButtons>
        <button>Test</button>
      </MagneticButtons>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.perspective).toBe("800px");
  });

  it("moves element on mouse move near center", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MagneticButtons>
        <button>Test</button>
      </MagneticButtons>,
    );
    const wrapper = container.firstChild as HTMLElement;
    Object.defineProperty(wrapper, "getBoundingClientRect", {
      value: () => ({
        left: 100,
        top: 100,
        width: 200,
        height: 60,
        right: 300,
        bottom: 160,
      }),
    });
    await user.pointer({ target: wrapper, coords: { x: 200, y: 130 } });
    const inner = wrapper.firstChild as HTMLElement;
    const transform = inner.style.transform;
    expect(transform).toBeTruthy();
  });

  it("resets position on mouse leave", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MagneticButtons>
        <button>Test</button>
      </MagneticButtons>,
    );
    const wrapper = container.firstChild as HTMLElement;
    Object.defineProperty(wrapper, "getBoundingClientRect", {
      value: () => ({
        left: 100,
        top: 100,
        width: 200,
        height: 60,
        right: 300,
        bottom: 160,
      }),
    });
    await user.pointer({ target: wrapper, coords: { x: 200, y: 130 } });
    await user.pointer({ target: wrapper, coords: { x: -100, y: -100 } });
    const inner = wrapper.firstChild as HTMLElement;
    expect(inner.style.transform).toContain("translate(0px, 0px)");
  });

  it("accepts custom radius prop", () => {
    const { container } = render(
      <MagneticButtons radius={200}>
        <button>Test</button>
      </MagneticButtons>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts custom strength prop", () => {
    const { container } = render(
      <MagneticButtons strength={0.5}>
        <button>Test</button>
      </MagneticButtons>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts custom snapDistance prop", () => {
    const { container } = render(
      <MagneticButtons snapDistance={60}>
        <button>Test</button>
      </MagneticButtons>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders multiple buttons independently", () => {
    render(
      <div>
        <MagneticButtons>
          <button>First</button>
        </MagneticButtons>
        <MagneticButtons>
          <button>Second</button>
        </MagneticButtons>
      </div>,
    );
    expect(screen.getByText("First")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("does not throw with no children", () => {
    const { container } = render(<MagneticButtons />);
    expect(container.firstChild).toBeTruthy();
  });
});
