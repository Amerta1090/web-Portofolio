import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ContextTooltip from "./ContextTooltip";

describe("ContextTooltip", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders children", () => {
    render(
      <ContextTooltip content={{ title: "Test", description: "Desc" }}>
        <button>Hover me</button>
      </ContextTooltip>,
    );
    expect(screen.getByText("Hover me")).toBeTruthy();
  });

  it("does not show tooltip by default", () => {
    render(
      <ContextTooltip content={{ title: "Hidden" }} delay={0}>
        <button>Hover</button>
      </ContextTooltip>,
    );
    expect(screen.queryByText("Hidden")).toBeNull();
  });

  it("renders with icon prop", () => {
    const { container } = render(
      <ContextTooltip content={{ title: "With Icon", icon: <span>🔍</span> }} delay={0}>
        <button>Hover</button>
      </ContextTooltip>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with shortcut prop", () => {
    const { container } = render(
      <ContextTooltip content={{ title: "Shortcut", shortcut: "Ctrl+K" }} delay={0}>
        <button>Hover</button>
      </ContextTooltip>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts side prop", () => {
    const { container } = render(
      <ContextTooltip content={{ title: "Side test" }} side="bottom" delay={0}>
        <button>Hover</button>
      </ContextTooltip>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("accepts className prop", () => {
    const { container } = render(
      <ContextTooltip content={{ title: "Class test" }} className="custom-cls" delay={0}>
        <button>Hover</button>
      </ContextTooltip>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("custom-cls");
  });

  it("accepts delay prop", () => {
    const { container } = render(
      <ContextTooltip content={{ title: "Delayed" }} delay={500}>
        <button>Hover</button>
      </ContextTooltip>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with title and description in content", () => {
    const { container } = render(
      <ContextTooltip content={{ title: "Test Title", description: "Test Description" }} delay={0}>
        <button>Hover</button>
      </ContextTooltip>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with all content props", () => {
    const { container } = render(
      <ContextTooltip
        content={{
          title: "Full",
          description: "Full tooltip",
          icon: <span>⭐</span>,
          shortcut: "Ctrl+F",
        }}
        delay={0}
      >
        <button>Full</button>
      </ContextTooltip>,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with a React node as children", () => {
    render(
      <ContextTooltip content={{ title: "Test" }} delay={0}>
        <span data-testid="child">Custom Node</span>
      </ContextTooltip>,
    );
    expect(screen.getByTestId("child")).toBeTruthy();
  });
});
